// セーブ・ロードシステム（3スロット・環境変更耐性版）
var SaveSystem = {

  SAVE_KEY_PREFIX: 'shinsou_densetsu_slot_',
  VERSION: 3,
  MAX_SLOTS: 3,

  _slotKey: function (i) { return this.SAVE_KEY_PREFIX + i; },

  _migrateOldSave: function () {
    try {
      var old = localStorage.getItem('shinsou_densetsu_save');
      if (old && !localStorage.getItem(this._slotKey(0))) {
        localStorage.setItem(this._slotKey(0), old);
        localStorage.removeItem('shinsou_densetsu_save');
      }
    } catch (e) {}
  },

  hasSaveData: function (slotIndex) {
    if (slotIndex === undefined) {
      for (var i = 0; i < this.MAX_SLOTS; i++) { if (this.hasSaveData(i)) return true; }
      return false;
    }
    try { return !!localStorage.getItem(this._slotKey(slotIndex)); } catch (e) { return false; }
  },

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
          date: d ? (d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' ' + ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2)) : '',
        });
      } catch (e) { summaries.push(null); }
    }
    return summaries;
  },

  // ============================================================
  // セーブ: プレイヤーの「進行データ」のみを保存
  // 計算で導出できる値(expToNext, ステータス)は保存しない
  // 装備はbaseId+rank+upgradeLevel+slots+traitsを保存
  // ============================================================
  save: function (gameState, slotIndex) {
    if (slotIndex === undefined) slotIndex = 0;
    var p = gameState.player;
    var ps = gameState.partySystem;
    var es = gameState.equipSystem;
    var bs = gameState.bookSystem;

    // 装備インベントリ: マスターデータ依存しない形で保存
    var savedInventory = [];
    for (var i = 0; i < es.inventory.length; i++) {
      var eq = es.inventory[i];
      savedInventory.push({
        uid: eq.uid,
        baseId: eq.baseId,
        rank: eq.rank,
        upgradeLevel: eq.upgradeLevel || 0,
        innateTraits: eq.innateTraits || [],
        slots: eq.slots || [],
      });
    }

    var data = {
      version: this.VERSION,
      timestamp: Date.now(),

      // プレイヤー進行データ
      player: {
        name: p.name,
        level: p.level,
        totalExp: p.totalExp,
        ownedGold: p.ownedGold,
        job: p.job,
        rarity: p.rarity,
        classLevels: p.classLevels,
        // HP/MP/ATK等のステータスは保存しない（ロード時に再計算）
      },

      // パーティ
      party: {
        characters: ps.characters,
        frontLine: ps.frontLine,
        reserve: ps.reserve,
        enhanceMaterials: ps.enhanceMaterials || 0,
        _nextId: ps._nextId,
      },

      // 装備（baseId+ランク+強化値+特性のみ。baseStatsは保存しない）
      equipment: {
        inventory: savedInventory,
        equipped: es.equipped,
        cores: es.cores,
        rerollStones: es.rerollStones,
        eraseStones: es.eraseStones,
        hpPotions: es.hpPotions,
        mpPotions: es.mpPotions,
        _nextUid: es._nextUid,
        presets: es.presets,
      },

      // ステージ進行
      stageProgress: gameState.stageSelectScene ? gameState.stageSelectScene.progress : {},

      // 図鑑（発見記録のみ）
      book: {
        monsters: bs.monsters,
        equipment: bs.equipment,
        items: bs.items,
      },
    };

    try {
      localStorage.setItem(this._slotKey(slotIndex), JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  },

  load: function (slotIndex) {
    if (slotIndex === undefined) slotIndex = 0;
    try {
      var raw = localStorage.getItem(this._slotKey(slotIndex));
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data) return null;
      return data;
    } catch (e) { return null; }
  },

  // ============================================================
  // ロード: 保存データからゲーム状態を復元
  // ステータスは現在のマスターデータから再計算
  // 装備のbaseStatsもマスターデータから再生成
  // ============================================================
  applyLoad: function (data, gameState) {
    if (!data || !data.player) return false;
    var p = gameState.player;
    var ps = gameState.partySystem;
    var es = gameState.equipSystem;
    var bs = gameState.bookSystem;
    var ss = gameState.stageSelectScene;

    // --- プレイヤー ---
    var pd = data.player;
    p.name = pd.name || 'プレイヤー';
    p.level = pd.level || 1;
    p.totalExp = pd.totalExp || 0;
    p.ownedGold = pd.ownedGold || 0;
    p.job = pd.job || 'warrior';
    p.rarity = pd.rarity || 'SR';
    p.classLevels = pd.classLevels || {};
    // expToNextは現在の計算式から導出
    p.expToNext = LevelSystem.expToNext(p.level);

    // --- パーティ ---
    if (data.party) {
      var ptd = data.party;
      ps.characters = ptd.characters || [];
      ps.frontLine = ptd.frontLine || [null, null, null];
      ps.reserve = ptd.reserve || [null, null, null];
      ps.enhanceMaterials = ptd.enhanceMaterials || 0;
      ps._nextId = ptd._nextId || ps.characters.length + 1;
    }

    // --- 装備 ---
    if (data.equipment) {
      var ed = data.equipment;

      // インベントリ復元: baseStatsをマスターデータから再計算
      es.inventory = [];
      var savedInv = ed.inventory || [];
      for (var i = 0; i < savedInv.length; i++) {
        var si = savedInv[i];
        var base = EquipmentData.getBase(si.baseId);
        if (!base) continue; // マスターデータから削除された装備はスキップ

        var stats = EquipmentData.calcStats(si.baseId, si.rank);
        var displayName = EquipmentData.buildName(base.name, si.innateTraits || []);
        if (si.upgradeLevel > 0) displayName += ' +' + si.upgradeLevel;

        es.inventory.push({
          uid: si.uid,
          baseId: si.baseId,
          baseName: base.name,
          name: displayName,
          slot: base.slot || 'weapon',
          rank: si.rank,
          requiredLevel: base.reqLv,
          baseStats: stats,                    // マスターデータから再計算
          innateTraits: this._clampTraits(si.innateTraits || [], si.rank, 'innate'),
          slots: this._clampTraits(si.slots || [], si.rank, 'slot'),
          innateTraits: si.innateTraits || [],
          slots: si.slots || [],
          upgradeLevel: si.upgradeLevel || 0,
        });
      }

      es.equipped = ed.equipped || { weapon: null, shield: null, head: null, body: null, feet: null, accessory: null };
      es.cores = ed.cores || { common: 0, uncommon: 0, rare: 0, epic: 0, legend: 0 };
      es.rerollStones = ed.rerollStones || 0;
      es.eraseStones = ed.eraseStones || 0;
      es.hpPotions = ed.hpPotions || 0;
      es.mpPotions = ed.mpPotions || 0;
      es._nextUid = ed._nextUid || es.inventory.length + 1;
      es.presets = ed.presets || [];

      // 装備中のUIDが存在するか検証（削除された装備への参照をクリア）
      for (var slot in es.equipped) {
        if (es.equipped[slot] && !es.getByUid(es.equipped[slot])) {
          es.equipped[slot] = null;
        }
      }
    }

    // --- ステージ進行 ---
    if (ss && data.stageProgress) {
      ss.progress = data.stageProgress;
    }

    // --- 図鑑 ---
    if (bs && data.book) {
      bs.monsters = data.book.monsters || {};
      bs.equipment = data.book.equipment || {};
      bs.items = data.book.items || {};
    }

    // --- ステータス再計算（現在のマスターデータ＋装備ボーナスから） ---
    p._applyStats();
    p.hp = p.hpMax;
    p.mp = p.mpMax;

    return true;
  },


  // 特性値を現在のレンジにクランプ
  _clampTraits: function (traits, rank, type) {
    if (!traits || traits.length === 0) return traits;
    var result = [];
    for (var i = 0; i < traits.length; i++) {
      var tr = traits[i];
      if (!tr) { result.push(null); continue; }
      var maxVal = 10;
      if (type === 'slot') {
        var sDef = SlotTraitData.getDef(tr.id);
        if (sDef && sDef.ranks && sDef.ranks[rank]) {
          maxVal = sDef.ranks[rank][1];
        }
      } else {
        var tDef = EquipmentData.getTraitDef(tr.id);
        var isSpecial = tDef && EquipmentData.SPECIAL_TRAIT_KEYS.indexOf(tDef.key) >= 0;
        var range = isSpecial ? EquipmentData.SPECIAL_TRAIT_RANGE[rank] : EquipmentData.TRAIT_VALUE_RANGE[rank];
        if (range) maxVal = range[1];
      }
      var clampedVal = Math.min(tr.value, maxVal);
      result.push({ id: tr.id, key: tr.key, value: Math.round(clampedVal * 10) / 10 });
    }
    return result;
  },

  deleteSave: function (slotIndex) {
    if (slotIndex === undefined) {
      for (var i = 0; i < this.MAX_SLOTS; i++) this.deleteSave(i);
      return true;
    }
    try { localStorage.removeItem(this._slotKey(slotIndex)); return true; } catch (e) { return false; }
  },
};
