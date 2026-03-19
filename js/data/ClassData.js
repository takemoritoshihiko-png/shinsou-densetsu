// 職業データ定義
var ClassData = {

  // 職業一覧（キー順 = 表示順）
  JOBS: {
    warrior: {
      name: 'ウォーリア',
      description: '近接物理アタッカー。高いHPとATKで前線を張る。',
      color: '#cc4444',
      multiplier: { hp: 1.3, mp: 1.0, atk: 1.2, matk: 1.0, def: 1.1, mdef: 1.0, spd: 1.0, crit: 1.0 },
      passiveBuff: { atk_percent: 15 },
      passiveDesc: 'ATK +15%',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: 'パワースラッシュ',   desc: '物理攻撃 ATK×150%' },
        { level: 15, name: 'ウォークライ',       desc: '自身のATK 20%UP (10秒)' },
        { level: 30, name: 'ブレイクアーマー',   desc: '敵DEF 30%DOWN (8秒)' },
        { level: 50, name: '滅殺の一撃',         desc: '物理攻撃 ATK×300% + 確定クリティカル' },
      ],
    },

    blader: {
      name: 'ブレーダー',
      description: '素早い連撃が得意。高いSPDとCRITで手数勝負。',
      color: '#44aacc',
      multiplier: { hp: 0.9, mp: 1.0, atk: 1.3, matk: 1.0, def: 1.0, mdef: 1.0, spd: 1.2, crit: 1.5 },
      passiveBuff: { spd_percent: 20 },
      passiveDesc: 'SPD +20%',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: '疾風斬',         desc: '2連撃 ATK×80%×2' },
        { level: 15, name: 'シャドウステップ', desc: '回避率UP (5秒)' },
        { level: 30, name: '百花繚乱',       desc: '5連撃 ATK×60%×5' },
        { level: 50, name: '無影剣',         desc: '10連撃 ATK×50%×10 + SPD 50%UP (5秒)' },
      ],
    },

    shielder: {
      name: 'ホースシールダー',
      description: '鉄壁の防御力。味方を守る盾役。',
      color: '#8888cc',
      multiplier: { hp: 1.4, mp: 1.0, atk: 0.9, matk: 1.0, def: 1.3, mdef: 1.2, spd: 0.8, crit: 1.0 },
      passiveBuff: { damage_reduction: 15 },
      passiveDesc: '被ダメージ -15%',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: 'シールドバッシュ', desc: '物理攻撃 ATK×120% + スタン(1秒)' },
        { level: 15, name: 'アイアンウォール', desc: '自身DEF 50%UP (8秒)' },
        { level: 30, name: '挑発',             desc: '全敵のターゲットを自身に集中(5秒)' },
        { level: 50, name: '不落の城塞',       desc: '3秒間ダメージ無効 + HP 30%回復' },
      ],
    },

    mage: {
      name: '魔法使い',
      description: '強力な魔法攻撃。MATKとMPが高い。',
      color: '#aa44dd',
      multiplier: { hp: 0.8, mp: 1.3, atk: 1.0, matk: 1.5, def: 0.8, mdef: 1.1, spd: 1.0, crit: 1.0 },
      passiveBuff: { matk_percent: 20 },
      passiveDesc: 'MATK +20%',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: 'ファイアボール',     desc: '魔法攻撃 MATK×160%' },
        { level: 15, name: 'フロストノヴァ',     desc: '範囲魔法 MATK×120% + 移動速度DOWN' },
        { level: 30, name: 'サンダーストーム',   desc: '範囲魔法 MATK×200%' },
        { level: 50, name: 'メテオストライク',   desc: '全体魔法 MATK×350%' },
      ],
    },

    priest: {
      name: '僧侶',
      description: '回復とサポートの専門家。MPとMDEFが高い。',
      color: '#ddcc44',
      multiplier: { hp: 1.1, mp: 1.4, atk: 0.7, matk: 1.0, def: 1.0, mdef: 1.2, spd: 1.0, crit: 1.0 },
      passiveBuff: { hp_regen_per_sec: 2 },
      passiveDesc: '毎秒HP 2%回復',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: 'ヒール',         desc: 'HP 30%回復' },
        { level: 15, name: 'プロテクション', desc: '味方全体DEF 20%UP (10秒)' },
        { level: 30, name: 'ホーリーライト', desc: '魔法攻撃 MATK×180% + HP 15%回復' },
        { level: 50, name: 'リザレクション', desc: '戦闘不能時に1回自動復活(HP50%)' },
      ],
    },

    archer: {
      name: 'アーチャー',
      description: '遠距離から正確に狙い撃つ。CRITが非常に高い。',
      color: '#44cc66',
      multiplier: { hp: 0.9, mp: 1.0, atk: 1.2, matk: 1.0, def: 0.8, mdef: 1.0, spd: 1.3, crit: 2.0 },
      passiveBuff: { crit_percent: 10 },
      passiveDesc: 'CRIT +10%',
      skillUnlockLevels: [5, 15, 30, 50],
      skills: [
        { level: 5,  name: 'エイムショット',     desc: '物理攻撃 ATK×140% + CRIT率UP' },
        { level: 15, name: 'マルチショット',     desc: '3連射 ATK×90%×3' },
        { level: 30, name: 'ウィークポイント',   desc: '物理攻撃 ATK×200% + 確定クリティカル' },
        { level: 50, name: 'レインオブアロー',   desc: '全体物理 ATK×250% + CRIT率2倍(5秒)' },
      ],
    },
  },

  // 職業キー一覧
  JOB_KEYS: ['warrior', 'blader', 'shielder', 'mage', 'priest', 'archer'],

  // 職業データを取得
  get: function (jobKey) {
    return this.JOBS[jobKey] || null;
  },

  // 職業補正を取得（StatusSystem用）
  getMultiplier: function (jobKey) {
    var job = this.JOBS[jobKey];
    return job ? job.multiplier : { hp: 1, mp: 1, atk: 1, matk: 1, def: 1, mdef: 1, spd: 1, crit: 1 };
  },

  // パッシブバフを取得
  getPassiveBuff: function (jobKey) {
    var job = this.JOBS[jobKey];
    return job ? job.passiveBuff : {};
  },

  // 職業レベルで解放済みのスキル一覧を返す
  getUnlockedSkills: function (jobKey, classLevel) {
    var job = this.JOBS[jobKey];
    if (!job) return [];
    var result = [];
    for (var i = 0; i < job.skills.length; i++) {
      var s = job.skills[i];
      result.push({
        name: s.name,
        desc: s.desc,
        level: s.level,
        unlocked: classLevel >= s.level,
      });
    }
    return result;
  },
};
