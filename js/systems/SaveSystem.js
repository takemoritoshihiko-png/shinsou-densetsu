// セーブ・ロードシステム（3スロット対応）
var SaveSystem = {

  SAVE_KEY_PREFIX: 'shinsou_densetsu_slot_',
  VERSION: 2,
  MAX_SLOTS: 3,

  _slotKey: function (slotIndex) {
    return this.SAVE_KEY_PREFIX + slotIndex;
  },

  // 旧キーの互換（旧セーブを自動でスロット1に移行）
  _migrateOldSave: function () {
    try {
      var old = localStorage.getItem('shinsou_densetsu_save');
      if (old && !localStorage.getItem(this._slotKey(0))) {
        localStorage.setItem(this._slotKey(0), old);
        localStorage.removeItem('shinsou_densetsu_save');
      }
    } catch (e) {}
  },

  // 指定スロットにセーブデータが存在するか
  hasSaveData: function (slotIndex) {
    if (slotIndex === undefined) {
      for (var i = 0; i < this.MAX_SLOTS; i++) {
        if (this.hasSaveData(i)) return true;
      }
      return false;
    }
    try { return !!localStorage.getItem(this._slotKey(slotIndex)); } catch (e) { return false; }
  },

  // 全スロットのサマリーを取得
  getSlotSummaries: function () {
    var summaries = [];
    for (var i = 0; i < this.MAX_SLOTS; i++) {
      try {
        var raw = localStorage.getItem(this._slotKey(i));
        if (!raw) { summaries.push(null); continue; }
        var data = JSON.parse(raw);
        var d = data.timestamp ? new Date(data.timestamp) : null;
        summaries.push({
          level: data.player ? data.player.level : '?',
          name: data.player ? data.player.name : '???',
          job: data.player ? data.player.job : '',
          gold: data.player ? data.player.ownedGold : 0,
          date: d ? (d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2)) : '',
        });
      } catch (e) { summaries.push(null); }
    }
    return summaries;
  },

  // セーブ
  save: function (gameState, slotIndex) {
    if (slotIndex === undefined) slotIndex = 0;
    var data = {
      version: this.VERSION,
      timestamp: Date.now(),
      player: {
        name: gameState.player.name,
        level: gameState.player.level,
        totalExp: gameState.player.totalExp,
        expToNext: gameState.player.expToNext,
        ownedGold: gameState.player.ownedGold,
        job: gameState.player.job,
        rarity: gameState.player.rarity,
        classLevels: gameState.player.classLevels,
      },
      party: {
        characters: gameState.partySystem.characters,
        frontLine: gameState.partySystem.frontLine,
        reserve: gameState.partySystem.reserve,
        enhanceMaterials: gameState.partySystem.enhanceMaterials || 0,
        _nextId: gameState.partySystem._nextId,
      },
      equipment: {
        inventory: gameState.equipSystem.inventory,
        equipped: gameState.equipSystem.equipped,
        cores: gameState.equipSystem.cores,
        rerollStones: gameState.equipSystem.rerollStones,
        eraseStones: gameState.equipSystem.eraseStones,
        hpPotions: gameState.equipSystem.hpPotions,
        mpPotions: gameState.equipSystem.mpPotions,
        _nextUid: gameState.equipSystem._nextUid,
        presets: gameState.equipSystem.presets,
      },
      stageProgress: gameState.stageSelectScene ? gameState.stageSelectScene.progress : {},
      book: {
        monsters: gameState.bookSystem.monsters,
        equipment: gameState.bookSystem.equipment,
        items: gameState.bookSystem.items,
      },
      settings: gameState.settings || { bgmVolume: 0.7, seVolume: 0.8 },
    };
    try {
      localStorage.setItem(this._slotKey(slotIndex), JSON.stringify(data));
      console.log('スロット' + (slotIndex + 1) + 'にセーブ完了');
      return true;
    } catch (e) { console.error('セーブ失敗:', e); return false; }
  },

  // ロード
  load: function (slotIndex) {
    if (slotIndex === undefined) slotIndex = 0;
    try {
      var raw = localStorage.getItem(this._slotKey(slotIndex));
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.version) return null;
      return data;
    } catch (e) { console.error('ロード失敗:', e); return null; }
  },

  // ロードデータをゲーム状態に適用
  applyLoad: function (data, gameState) {
    if (!data) return false;
    var p = gameState.player;
    var ps = gameState.partySystem;
    var es = gameState.equipSystem;
    var bs = gameState.bookSystem;
    var ss = gameState.stageSelectScene;
    if (!data.player || !data.party || !data.equipment) return false;

    var pd = data.player;
    p.name = pd.name; p.level = pd.level; p.totalExp = pd.totalExp;
    p.expToNext = pd.expToNext; p.ownedGold = pd.ownedGold;
    p.job = pd.job; p.rarity = pd.rarity;
    if (pd.classLevels) p.classLevels = pd.classLevels;

    var ptd = data.party;
    ps.characters = ptd.characters || [];
    ps.frontLine = ptd.frontLine || [null, null, null];
    ps.reserve = ptd.reserve || [null, null, null];
    ps.enhanceMaterials = ptd.enhanceMaterials || 0;
    ps._nextId = ptd._nextId || ps.characters.length + 1;

    var ed = data.equipment;
    es.inventory = ed.inventory || [];
    es.equipped = ed.equipped || { weapon: null, shield: null, head: null, body: null, feet: null, accessory: null };
    es.cores = ed.cores || { common: 0, uncommon: 0, rare: 0, epic: 0, legend: 0 };
    es.rerollStones = ed.rerollStones || 0;
    es.eraseStones = ed.eraseStones || 0;
    es.hpPotions = ed.hpPotions || 0;
    es.mpPotions = ed.mpPotions || 0;
    es._nextUid = ed._nextUid || es.inventory.length + 1;
    es.presets = ed.presets || [];

    if (ss && data.stageProgress) ss.progress = data.stageProgress;
    if (bs && data.book) {
      bs.monsters = data.book.monsters || {};
      bs.equipment = data.book.equipment || {};
      bs.items = data.book.items || {};
    }
    if (data.settings) gameState.settings = data.settings;

    p._applyStats(); p.hp = p.hpMax; p.mp = p.mpMax;
    return true;
  },

  // スロット削除
  deleteSave: function (slotIndex) {
    if (slotIndex === undefined) {
      for (var i = 0; i < this.MAX_SLOTS; i++) this.deleteSave(i);
      return true;
    }
    try { localStorage.removeItem(this._slotKey(slotIndex)); return true; } catch (e) { return false; }
  },
};
