// セーブ・ロードシステム
var SaveSystem = {

  SAVE_KEY: 'shinsou_densetsu_save',
  VERSION: 1,

  // セーブデータが存在するか
  hasSaveData: function () {
    try {
      return !!localStorage.getItem(this.SAVE_KEY);
    } catch (e) {
      return false;
    }
  },

  // セーブ
  save: function (gameState) {
    var data = {
      version: this.VERSION,
      timestamp: Date.now(),

      // プレイヤー
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

      // パーティ
      party: {
        characters: gameState.partySystem.characters,
        frontLine: gameState.partySystem.frontLine,
        reserve: gameState.partySystem.reserve,
        enhanceMaterials: gameState.partySystem.enhanceMaterials || 0,
        _nextId: gameState.partySystem._nextId,
      },

      // 装備
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

      // ステージ進行
      stageProgress: gameState.stageSelectScene ? gameState.stageSelectScene.progress : {},

      // 図鑑
      book: {
        monsters: gameState.bookSystem.monsters,
        equipment: gameState.bookSystem.equipment,
        items: gameState.bookSystem.items,
      },

      // 設定
      settings: gameState.settings || { volume: 1.0 },
    };

    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      console.log('セーブ完了');
      return true;
    } catch (e) {
      console.error('セーブ失敗:', e);
      return false;
    }
  },

  // ロード（rawデータを返す）
  load: function () {
    try {
      var raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.version) return null;
      console.log('ロード完了');
      return data;
    } catch (e) {
      console.error('ロード失敗:', e);
      return null;
    }
  },

  // ロードデータをゲーム状態に適用
  applyLoad: function (data, gameState) {
    if (!data) return false;

    var p = gameState.player;
    var ps = gameState.partySystem;
    var es = gameState.equipSystem;
    var bs = gameState.bookSystem;
    var ss = gameState.stageSelectScene;

    // 欠損データの安全対策
    if (!data.player || !data.party || !data.equipment) {
      console.error('セーブデータ破損: 必須フィールド欠損');
      return false;
    }

    // プレイヤー
    var pd = data.player;
    p.name = pd.name;
    p.level = pd.level;
    p.totalExp = pd.totalExp;
    p.expToNext = pd.expToNext;
    p.ownedGold = pd.ownedGold;
    p.job = pd.job;
    p.rarity = pd.rarity;
    if (pd.classLevels) p.classLevels = pd.classLevels;

    // パーティ
    var ptd = data.party;
    ps.characters = ptd.characters || [];
    ps.frontLine = ptd.frontLine || [null, null, null];
    ps.reserve = ptd.reserve || [null, null, null];
    ps.enhanceMaterials = ptd.enhanceMaterials || 0;
    ps._nextId = ptd._nextId || ps.characters.length + 1;

    // 装備
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

    // ステージ進行
    if (ss && data.stageProgress) {
      ss.progress = data.stageProgress;
    }

    // 図鑑
    if (bs && data.book) {
      bs.monsters = data.book.monsters || {};
      bs.equipment = data.book.equipment || {};
      bs.items = data.book.items || {};
    }

    // ステータス再計算
    p._applyStats();
    p.hp = p.hpMax;
    p.mp = p.mpMax;

    return true;
  },

  // セーブデータ削除
  deleteSave: function () {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },
};
