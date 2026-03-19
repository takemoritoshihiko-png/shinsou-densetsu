// 全モンスターデータ（60種 + ボス10体）
var MonsterData = {

  // モンスター一覧（ワールド別）
  MONSTERS: {
    // === W1 草原 ===
    w1: [
      { id: 'm101', name: 'スライム',     hp: 30,  atk: 5,  matk: 0, def: 2,  mdef: 1,  spd: 30, exp: 8,   gold: 4,  spriteColor: '#44cc88' },
      { id: 'm102', name: 'ゴブリン',     hp: 45,  atk: 8,  matk: 0, def: 3,  mdef: 1,  spd: 40, exp: 10,  gold: 5,  spriteColor: '#66aa44' },
      { id: 'm103', name: 'コボルト',     hp: 40,  atk: 7,  matk: 2, def: 2,  mdef: 2,  spd: 45, exp: 9,   gold: 5,  spriteColor: '#886644' },
      { id: 'm104', name: '大コウモリ',   hp: 25,  atk: 10, matk: 0, def: 1,  mdef: 1,  spd: 60, exp: 8,   gold: 4,  spriteColor: '#554466' },
      { id: 'm105', name: '野犬',         hp: 50,  atk: 12, matk: 0, def: 3,  mdef: 1,  spd: 55, exp: 12,  gold: 6,  spriteColor: '#aa7744' },
    ],
    w1boss: { id: 'b101', name: 'ゴブリンキング', hp: 250, atk: 18, matk: 0, def: 8, mdef: 4, spd: 35, exp: 50, gold: 30, spriteColor: '#448822', width: 80, height: 100, speed: 50, attackInterval: 2.0 },

    // === W2 海岸 ===
    w2: [
      { id: 'm201', name: 'カニ兵',       hp: 60,  atk: 12, matk: 0, def: 8,  mdef: 2,  spd: 25, exp: 14,  gold: 8,  spriteColor: '#cc4422' },
      { id: 'm202', name: 'マーマン',     hp: 70,  atk: 14, matk: 6, def: 5,  mdef: 5,  spd: 40, exp: 16,  gold: 9,  spriteColor: '#2288aa' },
      { id: 'm203', name: 'ヤドカリ',     hp: 80,  atk: 10, matk: 0, def: 12, mdef: 3,  spd: 20, exp: 15,  gold: 8,  spriteColor: '#ddaa66' },
      { id: 'm204', name: 'クラゲ',       hp: 45,  atk: 8,  matk: 12,def: 2,  mdef: 8,  spd: 35, exp: 14,  gold: 7,  spriteColor: '#88aadd' },
      { id: 'm205', name: 'サハギン',     hp: 75,  atk: 16, matk: 4, def: 6,  mdef: 4,  spd: 45, exp: 18,  gold: 10, spriteColor: '#44aa88' },
    ],
    w2boss: { id: 'b201', name: '海竜',           hp: 400, atk: 24, matk: 10, def: 12, mdef: 8, spd: 40, exp: 80, gold: 50, spriteColor: '#2266aa', width: 80, height: 100, speed: 45, attackInterval: 1.8 },

    // === W3 森 ===
    w3: [
      { id: 'm301', name: 'トレント',     hp: 100, atk: 15, matk: 0, def: 14, mdef: 6,  spd: 15, exp: 22,  gold: 12, spriteColor: '#336622' },
      { id: 'm302', name: 'エルフ射手',   hp: 70,  atk: 22, matk: 0, def: 6,  mdef: 8,  spd: 55, exp: 24,  gold: 14, spriteColor: '#66cc66' },
      { id: 'm303', name: 'マンドラゴラ', hp: 55,  atk: 10, matk: 18,def: 5,  mdef: 10, spd: 30, exp: 20,  gold: 11, spriteColor: '#88cc44' },
      { id: 'm304', name: '巨大蜘蛛',     hp: 85,  atk: 20, matk: 0, def: 8,  mdef: 4,  spd: 50, exp: 22,  gold: 13, spriteColor: '#443322' },
      { id: 'm305', name: 'ワーウルフ',   hp: 95,  atk: 25, matk: 0, def: 10, mdef: 5,  spd: 60, exp: 28,  gold: 16, spriteColor: '#777766' },
    ],
    w3boss: { id: 'b301', name: '森の主',         hp: 550, atk: 35, matk: 15, def: 18, mdef: 12, spd: 30, exp: 120, gold: 70, spriteColor: '#224411', width: 80, height: 100, speed: 40, attackInterval: 1.8 },

    // === W4 火山 ===
    w4: [
      { id: 'm401', name: 'ファイアリザード', hp: 120, atk: 28, matk: 12, def: 10, mdef: 6, spd: 45, exp: 30, gold: 18, spriteColor: '#dd4422' },
      { id: 'm402', name: 'サラマンダー', hp: 140, atk: 32, matk: 16, def: 12, mdef: 8, spd: 40, exp: 34, gold: 20, spriteColor: '#ff6622' },
      { id: 'm403', name: '溶岩ゴーレム', hp: 200, atk: 22, matk: 0,  def: 22, mdef: 10,spd: 15, exp: 32, gold: 22, spriteColor: '#883311' },
      { id: 'm404', name: 'フレイムバット',hp: 80, atk: 35, matk: 10, def: 6,  mdef: 4, spd: 65, exp: 28, gold: 16, spriteColor: '#cc3300' },
      { id: 'm405', name: '炎の精霊',     hp: 100, atk: 20, matk: 35, def: 8,  mdef: 15,spd: 50, exp: 36, gold: 22, spriteColor: '#ffaa22' },
    ],
    w4boss: { id: 'b401', name: '炎帝イフリート', hp: 800, atk: 48, matk: 25, def: 22, mdef: 15, spd: 35, exp: 180, gold: 100, spriteColor: '#cc2200', width: 80, height: 100, speed: 45, attackInterval: 1.6 },

    // === W5 氷原 ===
    w5: [
      { id: 'm501', name: 'アイスウルフ', hp: 180, atk: 35, matk: 0,  def: 14, mdef: 12,spd: 55, exp: 40, gold: 24, spriteColor: '#88bbdd' },
      { id: 'm502', name: 'フロストメイジ',hp:130, atk: 15, matk: 45, def: 8,  mdef: 20,spd: 35, exp: 44, gold: 28, spriteColor: '#aaccff' },
      { id: 'm503', name: '氷の巨人',     hp: 300, atk: 40, matk: 0,  def: 25, mdef: 15,spd: 18, exp: 48, gold: 30, spriteColor: '#6699bb' },
      { id: 'm504', name: 'ペンギンナイト',hp:160, atk: 38, matk: 0,  def: 18, mdef: 10,spd: 40, exp: 42, gold: 26, spriteColor: '#334455' },
      { id: 'm505', name: 'ブリザードドレイク',hp:220,atk:42,matk:20, def: 16, mdef: 14,spd: 48, exp: 50, gold: 32, spriteColor: '#4488aa' },
    ],
    w5boss: { id: 'b501', name: '氷姫フリージア', hp: 1200, atk: 60, matk: 40, def: 28, mdef: 25, spd: 40, exp: 250, gold: 150, spriteColor: '#88ccee', width: 80, height: 100, speed: 40, attackInterval: 1.5 },

    // === W6 砂漠 ===
    w6: [
      { id: 'm601', name: 'サンドワーム', hp: 280, atk: 48, matk: 0,  def: 20, mdef: 10,spd: 30, exp: 55, gold: 35, spriteColor: '#ccaa44' },
      { id: 'm602', name: 'スコーピオン', hp: 220, atk: 55, matk: 0,  def: 22, mdef: 8, spd: 50, exp: 58, gold: 38, spriteColor: '#aa6622' },
      { id: 'm603', name: 'ミイラ',       hp: 250, atk: 42, matk: 18, def: 18, mdef: 18,spd: 25, exp: 52, gold: 34, spriteColor: '#998866' },
      { id: 'm604', name: 'ジン',         hp: 180, atk: 30, matk: 55, def: 12, mdef: 25,spd: 55, exp: 60, gold: 40, spriteColor: '#4488cc' },
      { id: 'm605', name: 'スフィンクス', hp: 320, atk: 50, matk: 30, def: 25, mdef: 20,spd: 35, exp: 65, gold: 42, spriteColor: '#ddcc88' },
    ],
    w6boss: { id: 'b601', name: '砂王ファラオ',   hp: 1800, atk: 80, matk: 45, def: 35, mdef: 30, spd: 38, exp: 350, gold: 200, spriteColor: '#ccaa22', width: 80, height: 100, speed: 42, attackInterval: 1.5 },

    // === W7 暗黒城 ===
    w7: [
      { id: 'm701', name: 'ダークナイト', hp: 350, atk: 65, matk: 0,  def: 30, mdef: 15,spd: 45, exp: 72, gold: 48, spriteColor: '#333355' },
      { id: 'm702', name: 'ネクロマンサー',hp:250, atk: 25, matk: 70, def: 15, mdef: 30,spd: 35, exp: 75, gold: 50, spriteColor: '#553388' },
      { id: 'm703', name: 'デスアーマー', hp: 450, atk: 55, matk: 0,  def: 40, mdef: 20,spd: 20, exp: 70, gold: 46, spriteColor: '#444444' },
      { id: 'm704', name: 'ヴァンパイア', hp: 300, atk: 60, matk: 40, def: 22, mdef: 25,spd: 55, exp: 78, gold: 52, spriteColor: '#882244' },
      { id: 'm705', name: 'リッチ',       hp: 280, atk: 30, matk: 80, def: 18, mdef: 35,spd: 30, exp: 80, gold: 55, spriteColor: '#667788' },
    ],
    w7boss: { id: 'b701', name: '闇将軍ダリウス', hp: 2500, atk: 100, matk: 60, def: 42, mdef: 35, spd: 42, exp: 450, gold: 280, spriteColor: '#221144', width: 80, height: 100, speed: 45, attackInterval: 1.4 },

    // === W8 天空 ===
    w8: [
      { id: 'm801', name: '天使兵',       hp: 420, atk: 75, matk: 30, def: 32, mdef: 28,spd: 50, exp: 88, gold: 60, spriteColor: '#ccccee' },
      { id: 'm802', name: 'グリフォン',   hp: 480, atk: 85, matk: 0,  def: 28, mdef: 22,spd: 60, exp: 92, gold: 65, spriteColor: '#ddcc88' },
      { id: 'm803', name: '風の精霊王',   hp: 350, atk: 40, matk: 90, def: 20, mdef: 38,spd: 70, exp: 90, gold: 62, spriteColor: '#aaddcc' },
      { id: 'm804', name: 'ペガサスナイト',hp:400, atk: 80, matk: 20, def: 30, mdef: 30,spd: 65, exp: 95, gold: 68, spriteColor: '#eeeeff' },
      { id: 'm805', name: 'サンダーバード',hp:380, atk: 70, matk: 50, def: 25, mdef: 25,spd: 75, exp: 98, gold: 70, spriteColor: '#ffdd44' },
    ],
    w8boss: { id: 'b801', name: '天使長ミカエル', hp: 5000, atk: 160, matk: 100, def: 55, mdef: 50, spd: 50, exp: 800, gold: 500, spriteColor: '#eeeeff', width: 80, height: 100, speed: 48, attackInterval: 1.3 },

    // === W9 魔界 ===
    w9: [
      { id: 'm901', name: 'デーモン',     hp: 550, atk: 95,  matk: 40, def: 38, mdef: 30,spd: 48, exp: 110, gold: 78,  spriteColor: '#aa2233' },
      { id: 'm902', name: 'サキュバス',   hp: 400, atk: 70,  matk: 80, def: 25, mdef: 35,spd: 60, exp: 115, gold: 82,  spriteColor: '#cc44aa' },
      { id: 'm903', name: 'ケルベロス',   hp: 600, atk: 110, matk: 0,  def: 35, mdef: 25,spd: 55, exp: 120, gold: 85,  spriteColor: '#551111' },
      { id: 'm904', name: 'アークデーモン',hp:500, atk: 90,  matk: 60, def: 40, mdef: 38,spd: 42, exp: 125, gold: 90,  spriteColor: '#882222' },
      { id: 'm905', name: 'バアル',       hp: 650, atk: 105, matk: 50, def: 42, mdef: 32,spd: 50, exp: 130, gold: 95,  spriteColor: '#440011' },
    ],
    w9boss: { id: 'b901', name: '魔王ルシファー', hp: 8000, atk: 220, matk: 140, def: 70, mdef: 60, spd: 50, exp: 1200, gold: 800, spriteColor: '#660022', width: 80, height: 100, speed: 50, attackInterval: 1.2 },

    // === W10 終焉 ===
    w10: [
      { id: 'm1001', name: '虚無の使徒',  hp: 800,  atk: 120, matk: 60,  def: 48, mdef: 40,spd: 50, exp: 150, gold: 110, spriteColor: '#333333' },
      { id: 'm1002', name: '終焉の騎士',  hp: 1000, atk: 140, matk: 0,   def: 55, mdef: 35,spd: 45, exp: 160, gold: 120, spriteColor: '#222222' },
      { id: 'm1003', name: '混沌の魔導師',hp: 700,  atk: 60,  matk: 150, def: 30, mdef: 55,spd: 40, exp: 165, gold: 125, spriteColor: '#441166' },
      { id: 'm1004', name: '破壊の化身',  hp: 1200, atk: 160, matk: 40,  def: 50, mdef: 42,spd: 55, exp: 170, gold: 130, spriteColor: '#880000' },
      { id: 'm1005', name: '終焉の竜',    hp: 1500, atk: 180, matk: 80,  def: 60, mdef: 50,spd: 48, exp: 200, gold: 150, spriteColor: '#111111' },
    ],
    w10boss: { id: 'b1001', name: '終焉の神', hp: 15000, atk: 280, matk: 200, def: 85, mdef: 80, spd: 55, exp: 2000, gold: 1500, spriteColor: '#ffd700', width: 80, height: 100, speed: 50, attackInterval: 1.0 },
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
