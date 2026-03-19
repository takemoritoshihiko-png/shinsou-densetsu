// アップグレードコア強化システム
var UpgradeSystem = {

  MAX_LEVEL: 8,

  // 強化段階別の成功率（%）
  SUCCESS_RATES: [90, 80, 70, 55, 40, 25, 15, 5],

  // ランク名
  CORE_RANKS: ['common', 'uncommon', 'rare', 'epic', 'legend'],
  CORE_NAMES: {
    common: 'コモンコア',
    uncommon: 'アンコモンコア',
    rare: 'レアコア',
    epic: 'エピックコア',
    legend: 'レジェンドコア',
  },
  CORE_COLORS: {
    common: '#aaaaaa',
    uncommon: '#44cc44',
    rare: '#4488ff',
    epic: '#bb44ff',
    legend: '#ffd700',
  },

  // ランクの序数（比較用）
  RANK_INDEX: { common: 0, uncommon: 1, rare: 2, epic: 3, legend: 4 },

  // ランク倍率（ゴールドコスト用）
  RANK_GOLD_MUL: { common: 1, uncommon: 2, rare: 3, epic: 4, legend: 5 },

  // 成功率を計算（ランク差ボーナス込み）
  getSuccessRate: function (item, coreRank) {
    var lvl = item.upgradeLevel || 0;
    if (lvl >= this.MAX_LEVEL) return 0;
    var baseRate = this.SUCCESS_RATES[lvl];
    var rankDiff = this.RANK_INDEX[coreRank] - this.RANK_INDEX[item.rank];
    var bonus = rankDiff > 0 ? rankDiff * 10 : 0;
    return Math.min(100, baseRate + bonus);
  },

  // ゴールドコストを計算
  getGoldCost: function (item) {
    var lvl = item.upgradeLevel || 0;
    var mul = this.RANK_GOLD_MUL[item.rank] || 1;
    return 100 * (lvl + 1) * mul;
  },

  // コアが装備に使用可能か（同ランク or 上位コア）
  canUseCore: function (item, coreRank) {
    return this.RANK_INDEX[coreRank] >= this.RANK_INDEX[item.rank];
  },

  // 強化を実行
  // returns: { success: bool, newLevel: number }
  attempt: function (item, coreRank, playerGold, coreInventory) {
    var lvl = item.upgradeLevel || 0;
    if (lvl >= this.MAX_LEVEL) return null;
    if (!this.canUseCore(item, coreRank)) return null;

    var goldCost = this.getGoldCost(item);
    if (playerGold < goldCost) return null;
    if ((coreInventory[coreRank] || 0) < 1) return null;

    var rate = this.getSuccessRate(item, coreRank);
    var roll = Math.random() * 100;
    var success = roll < rate;

    if (success) {
      item.upgradeLevel = lvl + 1;
      // 装備名を更新（+値を反映）
      this._updateItemName(item);
    }

    return { success: success, newLevel: item.upgradeLevel, goldCost: goldCost, coreRank: coreRank };
  },

  // 装備名に+値を反映
  _updateItemName: function (item) {
    // ベース名（接頭辞付き、+値なし）を復元
    var baseName = item._displayBase || item.name.replace(/\s*\+\d+$/, '');
    item._displayBase = baseName;
    if (item.upgradeLevel > 0) {
      item.name = baseName + ' +' + item.upgradeLevel;
    } else {
      item.name = baseName;
    }
  },

  // +値によるステータス倍率を取得（+1あたり10%、+8で×1.80）
  getUpgradeMultiplier: function (upgradeLevel) {
    return 1 + (upgradeLevel || 0) * 0.10;
  },
};
