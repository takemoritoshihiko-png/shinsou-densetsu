// 全職業スキルデータ定義
var SkillData = {

  // スキルスロット: skill1(Z), skill2(X), skill3(C), ultimate(V)
  // type: 'physical' | 'magical' | 'buff' | 'heal' | 'ultimate'
  // target: 'front' | 'all' | 'self'

  warrior: [
    {
      slot: 'skill1', name: 'パワースラッシュ', unlockLevel: 5,
      type: 'physical', target: 'front', range: 120,
      multiplier: 2.0, mpCost: 5, cooldown: 3,
      effectColor: '#ff6644', effectType: 'slash',
      desc: '前方にATK×2.0の物理ダメージ',
    },
    {
      slot: 'skill2', name: 'ウォークライ', unlockLevel: 15,
      type: 'buff', target: 'self',
      buffStat: 'atk', buffPercent: 30, buffDuration: 5,
      mpCost: 10, cooldown: 10,
      effectColor: '#ffaa22', effectType: 'aura',
      desc: '5秒間ATK+30%',
    },
    {
      slot: 'skill3', name: 'グランドスマッシュ', unlockLevel: 30,
      type: 'physical', target: 'front', range: 150,
      multiplier: 3.5, knockback: 80, mpCost: 15, cooldown: 15,
      effectColor: '#ff4400', effectType: 'impact',
      desc: '前方にATK×3.5＋ノックバック',
    },
    {
      slot: 'ultimate', name: 'レイジングストーム', unlockLevel: 50,
      type: 'ultimate', target: 'all',
      multiplier: 5.0, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: '画面全体にATK×5.0',
    },
  ],

  blader: [
    {
      slot: 'skill1', name: '疾風斬', unlockLevel: 5,
      type: 'physical', target: 'front', range: 100,
      multiplier: 0.8, hits: 2, mpCost: 5, cooldown: 2.5,
      effectColor: '#44ccff', effectType: 'slash',
      desc: '2連撃 ATK×0.8×2',
    },
    {
      slot: 'skill2', name: 'シャドウステップ', unlockLevel: 15,
      type: 'buff', target: 'self',
      buffStat: 'spd', buffPercent: 50, buffDuration: 5,
      mpCost: 8, cooldown: 12,
      effectColor: '#6644cc', effectType: 'aura',
      desc: '5秒間SPD+50%',
    },
    {
      slot: 'skill3', name: '百花繚乱', unlockLevel: 30,
      type: 'physical', target: 'front', range: 110,
      multiplier: 0.6, hits: 5, mpCost: 18, cooldown: 14,
      effectColor: '#88ddff', effectType: 'slash',
      desc: '5連撃 ATK×0.6×5',
    },
    {
      slot: 'ultimate', name: '無影剣', unlockLevel: 50,
      type: 'ultimate', target: 'all',
      multiplier: 0.5, hits: 10, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: '10連撃 ATK×0.5×10',
    },
  ],

  shielder: [
    {
      slot: 'skill1', name: 'シールドバッシュ', unlockLevel: 5,
      type: 'physical', target: 'front', range: 90,
      multiplier: 1.2, mpCost: 5, cooldown: 4,
      effectColor: '#8888ff', effectType: 'impact',
      desc: '物理攻撃 ATK×1.2',
    },
    {
      slot: 'skill2', name: 'アイアンウォール', unlockLevel: 15,
      type: 'buff', target: 'self',
      buffStat: 'def', buffPercent: 50, buffDuration: 8,
      mpCost: 12, cooldown: 15,
      effectColor: '#aaaaff', effectType: 'aura',
      desc: '8秒間DEF+50%',
    },
    {
      slot: 'skill3', name: '挑発', unlockLevel: 30,
      type: 'buff', target: 'self',
      buffStat: 'def', buffPercent: 20, buffDuration: 5,
      mpCost: 10, cooldown: 18,
      effectColor: '#ff8844', effectType: 'aura',
      desc: 'DEF+20%(5秒)',
    },
    {
      slot: 'ultimate', name: '不落の城塞', unlockLevel: 50,
      type: 'ultimate', target: 'self',
      healPercent: 30, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: 'HP30%回復＋全画面フラッシュ',
    },
  ],

  mage: [
    {
      slot: 'skill1', name: 'ファイアボール', unlockLevel: 5,
      type: 'magical', target: 'front', range: 200,
      multiplier: 1.6, mpCost: 8, cooldown: 3,
      effectColor: '#ff4400', effectType: 'burst',
      desc: '魔法攻撃 MATK×1.6',
    },
    {
      slot: 'skill2', name: 'フロストノヴァ', unlockLevel: 15,
      type: 'magical', target: 'front', range: 180,
      multiplier: 1.2, mpCost: 12, cooldown: 8,
      effectColor: '#44ccff', effectType: 'burst',
      desc: '範囲魔法 MATK×1.2',
    },
    {
      slot: 'skill3', name: 'サンダーストーム', unlockLevel: 30,
      type: 'magical', target: 'front', range: 250,
      multiplier: 2.0, mpCost: 20, cooldown: 14,
      effectColor: '#ffff44', effectType: 'burst',
      desc: '範囲魔法 MATK×2.0',
    },
    {
      slot: 'ultimate', name: 'メテオストライク', unlockLevel: 50,
      type: 'ultimate', target: 'all',
      multiplier: 3.5, useMATK: true, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: '全体魔法 MATK×3.5',
    },
  ],

  priest: [
    {
      slot: 'skill1', name: 'ヒール', unlockLevel: 5,
      type: 'heal', target: 'self',
      healPercent: 30, mpCost: 10, cooldown: 5,
      effectColor: '#44ff88', effectType: 'aura',
      desc: 'HP30%回復',
    },
    {
      slot: 'skill2', name: 'プロテクション', unlockLevel: 15,
      type: 'buff', target: 'self',
      buffStat: 'def', buffPercent: 20, buffDuration: 10,
      mpCost: 12, cooldown: 15,
      effectColor: '#ffff88', effectType: 'aura',
      desc: 'DEF+20%(10秒)',
    },
    {
      slot: 'skill3', name: 'ホーリーライト', unlockLevel: 30,
      type: 'magical', target: 'front', range: 160,
      multiplier: 1.8, healPercent: 15, useMATK: true,
      mpCost: 18, cooldown: 12,
      effectColor: '#ffffaa', effectType: 'burst',
      desc: 'MATK×1.8＋HP15%回復',
    },
    {
      slot: 'ultimate', name: 'リザレクション', unlockLevel: 50,
      type: 'ultimate', target: 'self',
      healPercent: 50, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: 'HP50%回復＋全画面フラッシュ',
    },
  ],

  archer: [
    {
      slot: 'skill1', name: 'エイムショット', unlockLevel: 5,
      type: 'physical', target: 'front', range: 300,
      multiplier: 1.4, mpCost: 5, cooldown: 3,
      effectColor: '#44ff44', effectType: 'slash',
      desc: '物理攻撃 ATK×1.4',
    },
    {
      slot: 'skill2', name: 'マルチショット', unlockLevel: 15,
      type: 'physical', target: 'front', range: 280,
      multiplier: 0.9, hits: 3, mpCost: 10, cooldown: 8,
      effectColor: '#88ff88', effectType: 'slash',
      desc: '3連射 ATK×0.9×3',
    },
    {
      slot: 'skill3', name: 'ウィークポイント', unlockLevel: 30,
      type: 'physical', target: 'front', range: 300,
      multiplier: 2.0, forceCrit: true, mpCost: 15, cooldown: 14,
      effectColor: '#ffff44', effectType: 'slash',
      desc: 'ATK×2.0＋確定クリティカル',
    },
    {
      slot: 'ultimate', name: 'レインオブアロー', unlockLevel: 50,
      type: 'ultimate', target: 'all',
      multiplier: 2.5, gaugeCost: 100,
      effectColor: '#ffffff', effectType: 'fullscreen',
      desc: '全体物理 ATK×2.5',
    },
  ],

  // 指定職業のスキル一覧を取得
  getSkills: function (jobKey) {
    return this[jobKey] || [];
  },

  // スロット名でスキルを取得
  getBySlot: function (jobKey, slot) {
    var skills = this[jobKey] || [];
    for (var i = 0; i < skills.length; i++) {
      if (skills[i].slot === slot) return skills[i];
    }
    return null;
  },
};
