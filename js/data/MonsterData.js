// 全モンスターデータ（60種 + ボス10体）
var MonsterData = {

  // モンスター一覧（ワールド別）
  MONSTERS: {
    // === W1 草原 ===
    w1: [
      { id: 'm101', name: 'スライム',     hp: 45,  atk: 8,  matk: 0, def: 3,  mdef: 2,  spd: 30, exp: 8,   gold: 4,  spriteColor: '#44cc88' },
      { id: 'm102', name: 'ゴブリン',     hp: 68,  atk: 12,  matk: 0, def: 5,  mdef: 2,  spd: 40, exp: 10,  gold: 5,  spriteColor: '#66aa44' },
      { id: 'm103', name: 'コボルト',     hp: 60,  atk: 11,  matk: 3, def: 3,  mdef: 3,  spd: 45, exp: 9,   gold: 5,  spriteColor: '#886644' },
      { id: 'm104', name: '大コウモリ',   hp: 38,  atk: 15, matk: 0, def: 2,  mdef: 2,  spd: 60, exp: 8,   gold: 4,  spriteColor: '#554466' },
      { id: 'm105', name: '野犬',         hp: 75,  atk: 18, matk: 0, def: 5,  mdef: 2,  spd: 55, exp: 12,  gold: 6,  spriteColor: '#aa7744' },
    ],
    w1boss: { id: 'b101', name: 'ゴブリンキング', hp: 375, atk: 27, matk: 0, def: 12, mdef: 6, spd: 35, exp: 50, gold: 30, spriteColor: '#448822', width: 80, height: 100, speed: 50, attackInterval: 2.0 },

    // === W2 海岸 ===
    w2: [
      { id: 'm201', name: 'カニ兵',       hp: 90,  atk: 18, matk: 0, def: 12,  mdef: 3,  spd: 25, exp: 14,  gold: 8,  spriteColor: '#cc4422' },
      { id: 'm202', name: 'マーマン',     hp: 105,  atk: 21, matk: 9, def: 8,  mdef: 8,  spd: 40, exp: 16,  gold: 9,  spriteColor: '#2288aa' },
      { id: 'm203', name: 'ヤドカリ',     hp: 120,  atk: 15, matk: 0, def: 18, mdef: 5,  spd: 20, exp: 15,  gold: 8,  spriteColor: '#ddaa66' },
      { id: 'm204', name: 'クラゲ',       hp: 68,  atk: 12,  matk: 18,def: 2,  mdef: 12,  spd: 35, exp: 14,  gold: 7,  spriteColor: '#88aadd' },
      { id: 'm205', name: 'サハギン',     hp: 113,  atk: 24, matk: 6, def: 9,  mdef: 6,  spd: 45, exp: 18,  gold: 10, spriteColor: '#44aa88' },
    ],
    w2boss: { id: 'b201', name: '海竜',           hp: 600, atk: 36, matk: 15, def: 18, mdef: 12, spd: 40, exp: 80, gold: 50, spriteColor: '#2266aa', width: 80, height: 100, speed: 45, attackInterval: 1.8 },

    // === W3 森 ===
    w3: [
      { id: 'm301', name: 'トレント',     hp: 150, atk: 23, matk: 0, def: 21, mdef: 9,  spd: 15, exp: 22,  gold: 12, spriteColor: '#336622' },
      { id: 'm302', name: 'エルフ射手',   hp: 105,  atk: 33, matk: 0, def: 9,  mdef: 12,  spd: 55, exp: 24,  gold: 14, spriteColor: '#66cc66' },
      { id: 'm303', name: 'マンドラゴラ', hp: 83,  atk: 15, matk: 27,def: 5,  mdef: 15, spd: 30, exp: 20,  gold: 11, spriteColor: '#88cc44' },
      { id: 'm304', name: '巨大蜘蛛',     hp: 128,  atk: 30, matk: 0, def: 12,  mdef: 6,  spd: 50, exp: 22,  gold: 13, spriteColor: '#443322' },
      { id: 'm305', name: 'ワーウルフ',   hp: 143,  atk: 38, matk: 0, def: 15, mdef: 8,  spd: 60, exp: 28,  gold: 16, spriteColor: '#777766' },
    ],
    w3boss: { id: 'b301', name: '森の主',         hp: 825, atk: 53, matk: 23, def: 27, mdef: 18, spd: 30, exp: 120, gold: 70, spriteColor: '#224411', width: 80, height: 100, speed: 40, attackInterval: 1.8 },

    // === W4 火山 ===
    w4: [
      { id: 'm401', name: 'ファイアリザード', hp: 180, atk: 42, matk: 18, def: 15, mdef: 9, spd: 45, exp: 30, gold: 18, spriteColor: '#dd4422' },
      { id: 'm402', name: 'サラマンダー', hp: 210, atk: 48, matk: 24, def: 18, mdef: 12, spd: 40, exp: 34, gold: 20, spriteColor: '#ff6622' },
      { id: 'm403', name: '溶岩ゴーレム', hp: 300, atk: 33, matk: 0,  def: 33, mdef: 15,spd: 15, exp: 32, gold: 22, spriteColor: '#883311' },
      { id: 'm404', name: 'フレイムバット',hp: 120, atk: 53, matk: 15, def: 9,  mdef: 6, spd: 65, exp: 28, gold: 16, spriteColor: '#cc3300' },
      { id: 'm405', name: '炎の精霊',     hp: 150, atk: 30, matk: 53, def: 12,  mdef: 23,spd: 50, exp: 36, gold: 22, spriteColor: '#ffaa22' },
    ],
    w4boss: { id: 'b401', name: '炎帝イフリート', hp: 1200, atk: 72, matk: 38, def: 33, mdef: 23, spd: 35, exp: 180, gold: 100, spriteColor: '#cc2200', width: 80, height: 100, speed: 45, attackInterval: 1.6 },

    // === W5 氷原 ===
    w5: [
      { id: 'm501', name: 'アイスウルフ', hp: 270, atk: 53, matk: 0,  def: 21, mdef: 18,spd: 55, exp: 40, gold: 24, spriteColor: '#88bbdd' },
      { id: 'm502', name: 'フロストメイジ',hp:130, atk: 23, matk: 68, def: 12,  mdef: 30,spd: 35, exp: 44, gold: 28, spriteColor: '#aaccff' },
      { id: 'm503', name: '氷の巨人',     hp: 450, atk: 60, matk: 0,  def: 38, mdef: 23,spd: 18, exp: 48, gold: 30, spriteColor: '#6699bb' },
      { id: 'm504', name: 'ペンギンナイト',hp:160, atk: 57, matk: 0,  def: 27, mdef: 15,spd: 40, exp: 42, gold: 26, spriteColor: '#334455' },
      { id: 'm505', name: 'ブリザードドレイク',hp:220,atk:42,matk:20, def: 24, mdef: 21,spd: 48, exp: 50, gold: 32, spriteColor: '#4488aa' },
    ],
    w5boss: { id: 'b501', name: '氷姫フリージア', hp: 1800, atk: 90, matk: 60, def: 42, mdef: 38, spd: 40, exp: 250, gold: 150, spriteColor: '#88ccee', width: 80, height: 100, speed: 40, attackInterval: 1.5 },

    // === W6 砂漠 ===
    w6: [
      { id: 'm601', name: 'サンドワーム', hp: 420, atk: 72, matk: 0,  def: 30, mdef: 15,spd: 30, exp: 55, gold: 35, spriteColor: '#ccaa44' },
      { id: 'm602', name: 'スコーピオン', hp: 330, atk: 83, matk: 0,  def: 33, mdef: 12, spd: 50, exp: 58, gold: 38, spriteColor: '#aa6622' },
      { id: 'm603', name: 'ミイラ',       hp: 375, atk: 63, matk: 27, def: 27, mdef: 27,spd: 25, exp: 52, gold: 34, spriteColor: '#998866' },
      { id: 'm604', name: 'ジン',         hp: 270, atk: 45, matk: 83, def: 18, mdef: 38,spd: 55, exp: 60, gold: 40, spriteColor: '#4488cc' },
      { id: 'm605', name: 'スフィンクス', hp: 480, atk: 75, matk: 45, def: 38, mdef: 30,spd: 35, exp: 65, gold: 42, spriteColor: '#ddcc88' },
    ],
    w6boss: { id: 'b601', name: '砂王ファラオ',   hp: 2700, atk: 120, matk: 68, def: 53, mdef: 45, spd: 38, exp: 350, gold: 200, spriteColor: '#ccaa22', width: 80, height: 100, speed: 42, attackInterval: 1.5 },

    // === W7 暗黒城 ===
    w7: [
      { id: 'm701', name: 'ダークナイト', hp: 525, atk: 98, matk: 0,  def: 45, mdef: 23,spd: 45, exp: 72, gold: 48, spriteColor: '#333355' },
      { id: 'm702', name: 'ネクロマンサー',hp:250, atk: 38, matk: 105, def: 23, mdef: 45,spd: 35, exp: 75, gold: 50, spriteColor: '#553388' },
      { id: 'm703', name: 'デスアーマー', hp: 675, atk: 83, matk: 0,  def: 60, mdef: 30,spd: 20, exp: 70, gold: 46, spriteColor: '#444444' },
      { id: 'm704', name: 'ヴァンパイア', hp: 450, atk: 90, matk: 60, def: 33, mdef: 38,spd: 55, exp: 78, gold: 52, spriteColor: '#882244' },
      { id: 'm705', name: 'リッチ',       hp: 420, atk: 45, matk: 120, def: 27, mdef: 53,spd: 30, exp: 80, gold: 55, spriteColor: '#667788' },
    ],
    w7boss: { id: 'b701', name: '闇将軍ダリウス', hp: 3750, atk: 150, matk: 90, def: 63, mdef: 53, spd: 42, exp: 450, gold: 280, spriteColor: '#221144', width: 80, height: 100, speed: 45, attackInterval: 1.4 },

    // === W8 天空 ===
    w8: [
      { id: 'm801', name: '天使兵',       hp: 630, atk: 113, matk: 45, def: 48, mdef: 42,spd: 50, exp: 88, gold: 60, spriteColor: '#ccccee' },
      { id: 'm802', name: 'グリフォン',   hp: 720, atk: 128, matk: 0,  def: 42, mdef: 33,spd: 60, exp: 92, gold: 65, spriteColor: '#ddcc88' },
      { id: 'm803', name: '風の精霊王',   hp: 525, atk: 60, matk: 135, def: 30, mdef: 57,spd: 70, exp: 90, gold: 62, spriteColor: '#aaddcc' },
      { id: 'm804', name: 'ペガサスナイト',hp:400, atk: 120, matk: 30, def: 45, mdef: 45,spd: 65, exp: 95, gold: 68, spriteColor: '#eeeeff' },
      { id: 'm805', name: 'サンダーバード',hp:380, atk: 105, matk: 75, def: 38, mdef: 38,spd: 75, exp: 98, gold: 70, spriteColor: '#ffdd44' },
    ],
    w8boss: { id: 'b801', name: '天使長ミカエル', hp: 7500, atk: 240, matk: 150, def: 83, mdef: 75, spd: 50, exp: 800, gold: 500, spriteColor: '#eeeeff', width: 80, height: 100, speed: 48, attackInterval: 1.3 },

    // === W9 魔界 ===
    w9: [
      { id: 'm901', name: 'デーモン',     hp: 825, atk: 143,  matk: 60, def: 57, mdef: 45,spd: 48, exp: 110, gold: 78,  spriteColor: '#aa2233' },
      { id: 'm902', name: 'サキュバス',   hp: 600, atk: 105,  matk: 120, def: 38, mdef: 53,spd: 60, exp: 115, gold: 82,  spriteColor: '#cc44aa' },
      { id: 'm903', name: 'ケルベロス',   hp: 900, atk: 165, matk: 0,  def: 53, mdef: 38,spd: 55, exp: 120, gold: 85,  spriteColor: '#551111' },
      { id: 'm904', name: 'アークデーモン',hp:500, atk: 135,  matk: 90, def: 60, mdef: 57,spd: 42, exp: 125, gold: 90,  spriteColor: '#882222' },
      { id: 'm905', name: 'バアル',       hp: 975, atk: 158, matk: 75, def: 63, mdef: 48,spd: 50, exp: 130, gold: 95,  spriteColor: '#440011' },
    ],
    w9boss: { id: 'b901', name: '魔王ルシファー', hp: 12000, atk: 330, matk: 210, def: 105, mdef: 90, spd: 50, exp: 1200, gold: 800, spriteColor: '#660022', width: 80, height: 100, speed: 50, attackInterval: 1.2 },

    // === W10 終焉 ===
    w10: [
      { id: 'm1001', name: '虚無の使徒',  hp: 1200,  atk: 180, matk: 90,  def: 72, mdef: 60,spd: 50, exp: 150, gold: 110, spriteColor: '#333333' },
      { id: 'm1002', name: '終焉の騎士',  hp: 1500, atk: 210, matk: 0,   def: 83, mdef: 53,spd: 45, exp: 160, gold: 120, spriteColor: '#222222' },
      { id: 'm1003', name: '混沌の魔導師',hp: 1050,  atk: 90,  matk: 225, def: 45, mdef: 83,spd: 40, exp: 165, gold: 125, spriteColor: '#441166' },
      { id: 'm1004', name: '破壊の化身',  hp: 1800, atk: 240, matk: 60,  def: 75, mdef: 63,spd: 55, exp: 170, gold: 130, spriteColor: '#880000' },
      { id: 'm1005', name: '終焉の竜',    hp: 2250, atk: 270, matk: 120,  def: 90, mdef: 75,spd: 48, exp: 200, gold: 150, spriteColor: '#111111' },
    ],
    w10boss: { id: 'b1001', name: '終焉の神', hp: 22500, atk: 420, matk: 300, def: 128, mdef: 120, spd: 55, exp: 2000, gold: 1500, spriteColor: '#ffd700', width: 80, height: 100, speed: 50, attackInterval: 1.0 },
  },

  // ワールドの雑魚モンスター一覧を取得
  getMonsters: function (world) {
    return this.MONSTERS['w' + world] || [];
  },

  // ワールドのボスを取得
  getBoss: function (world) {
    return this.MONSTERS['w' + world + 'boss'] || null;
  },

  // ワールド+ステージからランダムに雑魚を選択
  pickRandom: function (world) {
    var list = this.getMonsters(world);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  },
};
