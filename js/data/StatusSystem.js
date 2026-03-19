// キャラクターステータス計算システム
var StatusSystem = {

  // レベル上限
  MAX_LEVEL: 99,

  // 基礎値（全キャラ共通 Lv1）
  BASE: {
    hp:   100,
    mp:    30,
    atk:   10,
    matk:  10,
    def:    5,
    mdef:   5,
    spd:   50,
    crit:   3,
  },

  // レベルごとの上昇値（装備が55%程度になるよう調整）
  GROWTH: {
    hp:   18,
    mp:    4,
    atk:   3.5,
    matk:  3.5,
    def:   2.5,
    mdef:  2.5,
    spd:   1.5,
    crit:  0.15,
  },

  // 職業補正: ClassDataから動的に取得（後方互換のためプロパティは残す）
  JOB_MULTIPLIER: {},

  // レアリティ補正テーブル
  RARITY_MULTIPLIER: {
    N:   1.0,
    R:   1.1,
    SR:  1.2,
    SSR: 1.35,
    UR:  1.5,
  },

  // ステータス名一覧
  STAT_KEYS: ['hp', 'mp', 'atk', 'matk', 'def', 'mdef', 'spd', 'crit'],

  /**
   * 最終ステータスを計算する
   * @param {number} level - キャラクターレベル (1〜99)
   * @param {string} job - 職業キー (warrior, mage, thief, priest, default)
   * @param {string} rarity - レアリティ (N, R, SR, SSR, UR)
   * @param {object} [equipBonus] - 装備ボーナス {hp, atk, ...} (省略時は全0)
   * @returns {object} 計算済みステータス
   */
  calc: function (level, job, rarity, equipBonus) {
    var lv = Math.max(1, Math.min(level, this.MAX_LEVEL));
    var jobMul = ClassData.getMultiplier(job);
    var rarityMul = this.RARITY_MULTIPLIER[rarity] || this.RARITY_MULTIPLIER['N'];
    var equip = equipBonus || {};

    var result = {};
    for (var i = 0; i < this.STAT_KEYS.length; i++) {
      var key = this.STAT_KEYS[i];
      var base = this.BASE[key];
      var growth = this.GROWTH[key];
      var lvBonus = growth * (lv - 1);
      var raw = (base + lvBonus) * jobMul[key] * rarityMul;
      var bonus = equip[key] || 0;

      // CRIT以外は整数に丸める、CRITは小数第1位まで
      if (key === 'crit') {
        result[key] = Math.round((raw + bonus) * 10) / 10;
      } else {
        result[key] = Math.floor(raw + bonus);
      }
    }

    return result;
  },

  /**
   * 敵用: 直接ステータスを指定して構造体を返す（計算不要な場合）
   * @param {object} rawStats - {hp, mp, atk, matk, def, mdef, spd, crit}
   * @returns {object} 正規化されたステータス
   */
  fromRaw: function (rawStats) {
    var result = {};
    for (var i = 0; i < this.STAT_KEYS.length; i++) {
      var key = this.STAT_KEYS[i];
      result[key] = rawStats[key] || 0;
    }
    return result;
  },

  /**
   * レベルアップに必要な経験値（LevelSystemに委譲）
   * @deprecated LevelSystem.expToNext() を使用してください
   */
  expToNextLevel: function (level) {
    return LevelSystem.expToNext(level);
  },
};
