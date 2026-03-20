// スロット特性データ（第2層）
var SlotTraitData = {

  // スロット数の確率テーブル
  SLOT_COUNT_WEIGHTS: [
    { count: 1, weight: 25 },
    { count: 2, weight: 50 },
    { count: 3, weight: 20 },
    { count: 4, weight: 5 },
  ],

  // 特性カテゴリと色
  CATEGORIES: {
    stat:    { color: '#4488ff', label: 'ステータス' },
    recover: { color: '#44cc88', label: '回復' },
    special: { color: '#ff8844', label: '特殊' },
  },

  // 全13特性の定義 + ランク別数値レンジ [min, max]
  TRAITS: [
    {
      id: 'S01', key: 'atk_pct', label: 'ATK強化', unit: '%', category: 'stat',
      ranks: { common: [1, 3], uncommon: [2, 4], rare: [3, 6], epic: [5, 8], legend: [7, 10] },
    },
    {
      id: 'S02', key: 'matk_pct', label: 'MATK強化', unit: '%', category: 'stat',
      ranks: { common: [1, 3], uncommon: [2, 4], rare: [3, 6], epic: [5, 8], legend: [7, 10] },
    },
    {
      id: 'S03', key: 'def_pct', label: 'DEF強化', unit: '%', category: 'stat',
      ranks: { common: [1, 2], uncommon: [2, 3], rare: [3, 5], epic: [4, 7], legend: [6, 9] },
    },
    {
      id: 'S04', key: 'mdef_pct', label: 'MDEF強化', unit: '%', category: 'stat',
      ranks: { common: [1, 2], uncommon: [2, 3], rare: [3, 5], epic: [4, 7], legend: [6, 9] },
    },
    {
      id: 'S05', key: 'hp_pct', label: 'HP強化', unit: '%', category: 'stat',
      ranks: { common: [1, 3], uncommon: [2, 5], rare: [4, 7], epic: [6, 9], legend: [8, 12] },
    },
    {
      id: 'S06', key: 'spd_pct', label: 'SPD強化', unit: '%', category: 'stat',
      ranks: { common: [1, 2], uncommon: [2, 3], rare: [2, 4], epic: [3, 5], legend: [4, 7] },
    },
    {
      id: 'S07', key: 'crit_pct', label: 'クリティカル率UP', unit: '%', category: 'stat',
      ranks: { common: [0.5, 1], uncommon: [1, 2], rare: [2, 3], epic: [3, 5], legend: [4, 6] },
    },
    {
      id: 'S08', key: 'mp_regen', label: 'MP回復', unit: '/秒', category: 'recover',
      ranks: { common: [1, 1.5], uncommon: [1.5, 2], rare: [2, 3], epic: [3, 4], legend: [4, 5] },
    },
    {
      id: 'S09', key: 'hp_regen_pct', label: 'HP回復', unit: '%/秒', category: 'recover',
      ranks: { common: [0.5, 0.8], uncommon: [0.8, 1.2], rare: [1.2, 1.8], epic: [1.8, 2.5], legend: [2.5, 3] },
    },
    {
      id: 'S10', key: 'lifesteal', label: '吸血', unit: '%', category: 'special',
      ranks: { common: [2, 3], uncommon: [3, 4.5], rare: [4.5, 6], epic: [6, 8], legend: [8, 10] },
    },
    {
      id: 'S11', key: 'reflect', label: '反射', unit: '%', category: 'special',
      ranks: { common: [3, 4], uncommon: [4, 6], rare: [6, 9], epic: [9, 12], legend: [12, 15] },
    },
    {
      id: 'S12', key: 'gold_bonus', label: 'ゴールドUP', unit: '%', category: 'special',
      ranks: { common: [5, 8], uncommon: [8, 12], rare: [12, 18], epic: [18, 24], legend: [24, 30] },
    },
    {
      id: 'S13', key: 'rare_drop', label: 'レアドロップUP', unit: '%', category: 'special',
      ranks: { common: [0.3, 0.5], uncommon: [0.5, 0.8], rare: [0.8, 1.2], epic: [1.2, 1.6], legend: [1.6, 2] },
    },
  ],

  // IDから特性定義を取得
  getDef: function (traitId) {
    for (var i = 0; i < this.TRAITS.length; i++) {
      if (this.TRAITS[i].id === traitId) return this.TRAITS[i];
    }
    return null;
  },

  // スロット数をランダムに決定
  rollSlotCount: function () {
    var roll = Math.random() * 100;
    var cum = 0;
    for (var i = 0; i < this.SLOT_COUNT_WEIGHTS.length; i++) {
      cum += this.SLOT_COUNT_WEIGHTS[i].weight;
      if (roll < cum) return this.SLOT_COUNT_WEIGHTS[i].count;
    }
    return 1;
  },

  // 指定ランクでスロット特性を1つ生成
  rollOneTrait: function (rank) {
    var idx = Math.floor(Math.random() * this.TRAITS.length);
    var def = this.TRAITS[idx];
    var range = def.ranks[rank] || def.ranks['common'];
    var value = Math.round((range[0] + Math.random() * (range[1] - range[0])) * 10) / 10;
    return {
      id: def.id,
      key: def.key,
      value: value,
    };
  },

  // 装備にスロット一式を生成
  generateSlots: function (rank) {
    var count = this.rollSlotCount();
    var result = [];
    for (var i = 0; i < count; i++) {
      result.push(this.rollOneTrait(rank));
    }
    return result;
  },

  // カテゴリ色を取得
  getColor: function (traitId) {
    var def = this.getDef(traitId);
    if (!def) return '#888888';
    var cat = this.CATEGORIES[def.category];
    return cat ? cat.color : '#888888';
  },
};
