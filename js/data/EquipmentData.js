// 装備マスターデータ
var EquipmentData = {

  SLOTS: ['weapon', 'shield', 'head', 'body', 'feet', 'accessory'],
  SLOT_NAMES: { weapon: '武器', shield: '盾', head: '頭', body: '体', feet: '足', accessory: 'アクセ' },

  RANKS: ['common', 'uncommon', 'rare', 'epic', 'legend'],
  RANK_NAMES: { common: 'コモン', uncommon: 'アンコモン', rare: 'レア', epic: 'エピック', legend: 'レジェンド' },
  RANK_COLORS: { common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', epic: '#bb44ff', legend: '#ffd700' },
  RANK_MULTIPLIER: { common: 1.0, uncommon: 1.5, rare: 2.5, epic: 4.0, legend: 7.0 },

  STAT_KEYS: ['hp', 'mp', 'atk', 'matk', 'def', 'mdef', 'spd', 'crit'],

  // --- 固有特性（第1層） ---

  // 特性の個数レンジ（ランク別） [min, max]
  TRAIT_COUNT: {
    common:   [0, 1],
    uncommon: [1, 1],
    rare:     [1, 2],
    epic:     [2, 2],
    legend:   [2, 3],
  },

  // 特性の数値レンジ（ランク別） [min, max]（%系の値）
  TRAIT_VALUE_RANGE: {
    common:   [1, 3],
    uncommon: [2, 5],
    rare:     [4, 8],
    epic:     [7, 12],
    legend:   [10, 18],
  },

  // 特性候補テーブル
  TRAITS: [
    { id: 'S01', key: 'atk_pct',       label: 'ATK',         unit: '%',   prefix: '鋭い' },
    { id: 'S02', key: 'matk_pct',      label: 'MATK',        unit: '%',   prefix: '賢者の' },
    { id: 'S03', key: 'def_pct',       label: 'DEF',         unit: '%',   prefix: '守りの' },
    { id: 'S04', key: 'mdef_pct',      label: 'MDEF',        unit: '%',   prefix: '魔防の' },
    { id: 'S05', key: 'hp_pct',        label: 'HP',          unit: '%',   prefix: '頑強な' },
    { id: 'S06', key: 'spd_pct',       label: 'SPD',         unit: '%',   prefix: '迅速な' },
    { id: 'S07', key: 'crit_pct',      label: 'CRIT',        unit: '%',   prefix: '会心の' },
    { id: 'S08', key: 'mp_regen',      label: 'MP回復/秒',   unit: '',    prefix: '英知の' },
    { id: 'S09', key: 'hp_regen_pct',  label: 'HP回復/秒',   unit: '%',   prefix: '再生の' },
    { id: 'S10', key: 'lifesteal',     label: '吸血',        unit: '%',   prefix: '吸血の' },
    { id: 'S11', key: 'reflect',       label: '反射',        unit: '%',   prefix: '棘の' },
    { id: 'S12', key: 'gold_bonus',    label: 'ゴールド+',   unit: '%',   prefix: '黄金の' },
    { id: 'S13', key: 'rare_drop',     label: 'レアドロップ', unit: '%',  prefix: '幸運の' },
  ],

  // 特殊系の特性（ステータス系より値が低い）
  SPECIAL_TRAIT_KEYS: ['mp_regen', 'hp_regen_pct', 'lifesteal', 'reflect', 'gold_bonus', 'rare_drop'],

  // 特殊系の数値レンジ（ランク別） [min, max]
  SPECIAL_TRAIT_RANGE: {
    common:   [0.5, 1],
    uncommon: [1, 2],
    rare:     [2, 4],
    epic:     [3, 6],
    legend:   [5, 10],
  },

  // 特性IDから特性定義を取得
  getTraitDef: function (traitId) {
    for (var i = 0; i < this.TRAITS.length; i++) {
      if (this.TRAITS[i].id === traitId) return this.TRAITS[i];
    }
    return null;
  },

  // ランダム特性を生成
  generateTraits: function (rank) {
    var countRange = this.TRAIT_COUNT[rank] || [0, 0];
    var count = countRange[0] + Math.floor(Math.random() * (countRange[1] - countRange[0] + 1));
    if (count === 0) return [];

    // 重複なしで選ぶ
    var pool = this.TRAITS.slice();
    var result = [];
    for (var i = 0; i < count && pool.length > 0; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      var def = pool.splice(idx, 1)[0];

      var isSpecial = this.SPECIAL_TRAIT_KEYS.indexOf(def.key) >= 0;
      var range = isSpecial ? this.SPECIAL_TRAIT_RANGE[rank] : this.TRAIT_VALUE_RANGE[rank];
      var min = range[0];
      var max = range[1];
      var value = Math.round((min + Math.random() * (max - min)) * 10) / 10;

      result.push({
        id: def.id,
        key: def.key,
        value: value,
      });
    }

    return result;
  },

  // 特性から最良の接頭辞を決定
  getPrefix: function (traits) {
    if (!traits || traits.length === 0) return '';
    // 最も値が高い特性の接頭辞を返す
    var best = traits[0];
    for (var i = 1; i < traits.length; i++) {
      if (traits[i].value > best.value) best = traits[i];
    }
    var def = this.getTraitDef(best.id);
    return def ? def.prefix : '';
  },

  // 特性付き装備名を生成
  buildName: function (baseName, traits) {
    var prefix = this.getPrefix(traits);
    return prefix ? prefix + baseName : baseName;
  },

  // --- 武器ベースデータ ---

  WEAPONS: [
    { baseId: 'w01', name: '木の剣',       reqLv: 1,  atk: 5,  matk: 0, crit: 0.2 },
    { baseId: 'w02', name: '鉄の剣',       reqLv: 5,  atk: 10, matk: 0, crit: 0.3 },
    { baseId: 'w03', name: '鋼の剣',       reqLv: 10, atk: 18, matk: 0, crit: 0.5 },
    { baseId: 'w04', name: '炎の剣',       reqLv: 15, atk: 28, matk: 8, crit: 0.6 },
    { baseId: 'w05', name: '氷の刃',       reqLv: 20, atk: 35, matk: 12, crit: 0.8 },
    { baseId: 'w06', name: '雷鳴の剣',     reqLv: 25, atk: 45, matk: 15, crit: 1.0 },
    { baseId: 'w07', name: '聖剣',         reqLv: 30, atk: 58, matk: 20, crit: 1.2 },
    { baseId: 'w08', name: '魔剣',         reqLv: 35, atk: 65, matk: 40, crit: 1.5 },
    { baseId: 'w09', name: '竜殺しの剣',   reqLv: 42, atk: 85, matk: 30, crit: 2.0 },
    { baseId: 'w10', name: '神器の剣',     reqLv: 50, atk: 110, matk: 45, crit: 3.0 },
  ],

  // --- 盾ベースデータ（DEF主体） ---
  SHIELDS: [
    { baseId: 'sh01', name: '木の盾',     slot: 'shield', reqLv: 1,  def: 5,  mdef: 2,  hp: 10 },
    { baseId: 'sh02', name: '鉄の盾',     slot: 'shield', reqLv: 5,  def: 10, mdef: 4,  hp: 20 },
    { baseId: 'sh03', name: '鋼の盾',     slot: 'shield', reqLv: 10, def: 18, mdef: 6,  hp: 35 },
    { baseId: 'sh04', name: '炎の盾',     slot: 'shield', reqLv: 15, def: 25, mdef: 10, hp: 50 },
    { baseId: 'sh05', name: '氷壁の盾',   slot: 'shield', reqLv: 20, def: 32, mdef: 14, hp: 65 },
    { baseId: 'sh06', name: '雷光の盾',   slot: 'shield', reqLv: 25, def: 40, mdef: 18, hp: 80 },
    { baseId: 'sh07', name: '聖盾',       slot: 'shield', reqLv: 30, def: 50, mdef: 24, hp: 100 },
    { baseId: 'sh08', name: '魔盾',       slot: 'shield', reqLv: 35, def: 45, mdef: 35, hp: 90 },
    { baseId: 'sh09', name: '竜鱗の盾',   slot: 'shield', reqLv: 42, def: 65, mdef: 30, hp: 130 },
    { baseId: 'sh10', name: '神盾',       slot: 'shield', reqLv: 50, def: 85, mdef: 45, hp: 180 },
  ],

  // --- 頭装備ベースデータ（MDEF+HP主体） ---
  HEADS: [
    { baseId: 'hd01', name: '布の帽子',   slot: 'head', reqLv: 1,  mdef: 3,  def: 1,  hp: 8 },
    { baseId: 'hd02', name: '革の帽子',   slot: 'head', reqLv: 5,  mdef: 6,  def: 2,  hp: 15 },
    { baseId: 'hd03', name: '鉄兜',       slot: 'head', reqLv: 10, mdef: 8,  def: 6,  hp: 25 },
    { baseId: 'hd04', name: '炎の冠',     slot: 'head', reqLv: 15, mdef: 12, def: 5,  hp: 35, matk: 5 },
    { baseId: 'hd05', name: '氷の冠',     slot: 'head', reqLv: 20, mdef: 16, def: 7,  hp: 45, matk: 8 },
    { baseId: 'hd06', name: '雷の兜',     slot: 'head', reqLv: 25, mdef: 20, def: 10, hp: 55 },
    { baseId: 'hd07', name: '聖なる冠',   slot: 'head', reqLv: 30, mdef: 26, def: 12, hp: 70, matk: 12 },
    { baseId: 'hd08', name: '魔導師の帽子',slot:'head', reqLv: 35, mdef: 30, def: 8,  hp: 60, matk: 20 },
    { baseId: 'hd09', name: '竜角の兜',   slot: 'head', reqLv: 42, mdef: 35, def: 18, hp: 90 },
    { baseId: 'hd10', name: '神冠',       slot: 'head', reqLv: 50, mdef: 48, def: 22, hp: 120, matk: 25 },
  ],

  // --- 体装備ベースデータ（DEF+HP主体） ---
  BODIES: [
    { baseId: 'bd01', name: '布の服',     slot: 'body', reqLv: 1,  def: 4,  mdef: 2,  hp: 15 },
    { baseId: 'bd02', name: '革の鎧',     slot: 'body', reqLv: 5,  def: 8,  mdef: 3,  hp: 30 },
    { baseId: 'bd03', name: '鉄の鎧',     slot: 'body', reqLv: 10, def: 15, mdef: 5,  hp: 50 },
    { baseId: 'bd04', name: '炎の鎧',     slot: 'body', reqLv: 15, def: 22, mdef: 8,  hp: 70 },
    { baseId: 'bd05', name: '氷の鎧',     slot: 'body', reqLv: 20, def: 28, mdef: 12, hp: 90 },
    { baseId: 'bd06', name: '雷の鎧',     slot: 'body', reqLv: 25, def: 36, mdef: 15, hp: 110 },
    { baseId: 'bd07', name: '聖なる鎧',   slot: 'body', reqLv: 30, def: 45, mdef: 20, hp: 140 },
    { baseId: 'bd08', name: '魔導師のローブ',slot:'body',reqLv:35, def: 25, mdef: 35, hp: 100, matk: 15 },
    { baseId: 'bd09', name: '竜鱗の鎧',   slot: 'body', reqLv: 42, def: 60, mdef: 25, hp: 180 },
    { baseId: 'bd10', name: '神鎧',       slot: 'body', reqLv: 50, def: 80, mdef: 40, hp: 250 },
  ],

  // --- 足装備ベースデータ（SPD+DEF主体） ---
  FEET: [
    { baseId: 'ft01', name: '布の靴',     slot: 'feet', reqLv: 1,  spd: 3,  def: 1,  hp: 5 },
    { baseId: 'ft02', name: '革の靴',     slot: 'feet', reqLv: 5,  spd: 5,  def: 2,  hp: 10 },
    { baseId: 'ft03', name: '鉄のブーツ', slot: 'feet', reqLv: 10, spd: 4,  def: 6,  hp: 18 },
    { baseId: 'ft04', name: '炎の靴',     slot: 'feet', reqLv: 15, spd: 8,  def: 5,  hp: 25 },
    { baseId: 'ft05', name: '氷の靴',     slot: 'feet', reqLv: 20, spd: 10, def: 7,  hp: 30 },
    { baseId: 'ft06', name: '雷の靴',     slot: 'feet', reqLv: 25, spd: 14, def: 8,  hp: 35 },
    { baseId: 'ft07', name: '聖なる靴',   slot: 'feet', reqLv: 30, spd: 18, def: 10, hp: 45 },
    { baseId: 'ft08', name: '疾風の靴',   slot: 'feet', reqLv: 35, spd: 25, def: 6,  hp: 35 },
    { baseId: 'ft09', name: '竜革のブーツ',slot:'feet', reqLv: 42, spd: 22, def: 15, hp: 60 },
    { baseId: 'ft10', name: '神足',       slot: 'feet', reqLv: 50, spd: 30, def: 18, hp: 80 },
  ],

  // --- アクセサリーベースデータ（多様なステータス） ---
  ACCESSORIES: [
    { baseId: 'ac01', name: '力の指輪',   slot: 'accessory', reqLv: 1,  atk: 3,  crit: 0.3 },
    { baseId: 'ac02', name: '守りの指輪', slot: 'accessory', reqLv: 5,  def: 5,  mdef: 5 },
    { baseId: 'ac03', name: '知恵の首飾り',slot:'accessory', reqLv: 10, matk: 10, mp: 15 },
    { baseId: 'ac04', name: '俊足の腕輪', slot: 'accessory', reqLv: 15, spd: 12, crit: 0.5 },
    { baseId: 'ac05', name: '生命のペンダント',slot:'accessory',reqLv:20, hp: 80, def: 5 },
    { baseId: 'ac06', name: '会心の指輪', slot: 'accessory', reqLv: 25, crit: 2.0, atk: 10 },
    { baseId: 'ac07', name: '聖なるロザリオ',slot:'accessory',reqLv:30, mdef: 20, hp: 60, mp: 20 },
    { baseId: 'ac08', name: '魔力の宝珠', slot: 'accessory', reqLv: 35, matk: 30, mp: 30, crit: 1.0 },
    { baseId: 'ac09', name: '竜の牙飾り', slot: 'accessory', reqLv: 42, atk: 25, crit: 2.5, hp: 50 },
    { baseId: 'ac10', name: '神器の首飾り',slot:'accessory', reqLv: 50, atk: 20, matk: 20, def: 15, mdef: 15, hp: 100, crit: 2.0 },
  ],

  // 全装備テーブル
  ALL_EQUIP_TABLES: null,

  _buildAllTables: function () {
    if (this.ALL_EQUIP_TABLES) return;
    this.ALL_EQUIP_TABLES = [].concat(
      this.WEAPONS,
      this.SHIELDS,
      this.HEADS,
      this.BODIES,
      this.FEET,
      this.ACCESSORIES
    );
  },

  getBase: function (baseId) {
    this._buildAllTables();
    for (var i = 0; i < this.ALL_EQUIP_TABLES.length; i++) {
      if (this.ALL_EQUIP_TABLES[i].baseId === baseId) return this.ALL_EQUIP_TABLES[i];
    }
    return null;
  },

  calcStats: function (baseId, rank) {
    var base = this.getBase(baseId);
    if (!base) return {};
    var mul = this.RANK_MULTIPLIER[rank] || 1;
    var result = {};
    for (var i = 0; i < this.STAT_KEYS.length; i++) {
      var key = this.STAT_KEYS[i];
      var val = base[key] || 0;
      if (val === 0) { result[key] = 0; continue; }
      if (key === 'crit') {
        result[key] = Math.round(val * mul * 10) / 10;
      } else {
        result[key] = Math.floor(val * mul);
      }
    }
    return result;
  },

  getAllWeapons: function () {
    var list = [];
    for (var w = 0; w < this.WEAPONS.length; w++) {
      for (var r = 0; r < this.RANKS.length; r++) {
        list.push({
          baseId: this.WEAPONS[w].baseId,
          name: this.WEAPONS[w].name,
          slot: 'weapon',
          rank: this.RANKS[r],
          requiredLevel: this.WEAPONS[w].reqLv,
        });
      }
    }
    return list;
  },
};
