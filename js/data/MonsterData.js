// モンスターデータ（4種族×8グレード）
var MonsterData = {

  SLIMES: [
    { grade:1, id:'sl1', name:'プニプニ',         race:'slime', hp:100,  atk:12,  matk:5,   def:6,   mdef:4,  spd:30, exp:16,   gold:5,   color:'#88ccff', eye:'cute' },
    { grade:2, id:'sl2', name:'スライミー',       race:'slime', hp:180,  atk:20,  matk:8,   def:10,  mdef:6,  spd:35, exp:28,  gold:8,   color:'#44bb44', eye:'angry' },
    { grade:3, id:'sl3', name:'エレキスライム',   race:'slime', hp:320,  atk:35,  matk:25,  def:16,  mdef:12, spd:45, exp:50,  gold:14,  color:'#ddcc22', eye:'angry', spark:true },
    { grade:4, id:'sl4', name:'マグマスライム',   race:'slime', hp:520,  atk:55,  matk:40,  def:24,  mdef:18, spd:35, exp:80,  gold:22,  color:'#ee5500', eye:'angry', drip:true },
    { grade:5, id:'sl5', name:'ストーンスライム', race:'slime', hp:900,  atk:70,  matk:20,  def:55,  mdef:30, spd:20, exp:110,  gold:30,  color:'#997755', eye:'angry', rocky:true },
    { grade:6, id:'sl6', name:'ヴェノムスライム', race:'slime', hp:1200, atk:90,  matk:70,  def:40,  mdef:45, spd:40, exp:150,  gold:45,  color:'#9944bb', eye:'angry', poison:true },
    { grade:7, id:'sl7', name:'ブラックゼリー',   race:'slime', hp:2800, atk:196, matk:140, def:91,  mdef:84, spd:45, exp:220, gold:70,  color:'#223333', eye:'glow' },
    { grade:8, id:'sl8', name:'スライムキング',   race:'slime', hp:5600, atk:308, matk:224, def:126,  mdef:119, spd:35, exp:400, gold:120, color:'#aa1122', eye:'king', crown:true, flame:true },
  ],

  BEASTS: [
    { grade:1, id:'bt1', name:'プニプニウサギ', race:'beast', hp:80,   atk:10,  matk:0,   def:4,   mdef:3,  spd:50, exp:14,   gold:4,   color:'#aaccff', shape:'rabbit' },
    { grade:2, id:'bt2', name:'イヌコロ',       race:'beast', hp:160,  atk:22,  matk:0,   def:8,   mdef:5,  spd:45, exp:24,  gold:7,   color:'#bb8844', shape:'dog' },
    { grade:3, id:'bt3', name:'フォックスカウト', race:'beast', hp:280, atk:38,  matk:12,  def:14,  mdef:10, spd:55, exp:44,  gold:12,  color:'#dd8833', shape:'fox' },
    { grade:4, id:'bt4', name:'ブレイクボア',   race:'beast', hp:600,  atk:65,  matk:0,   def:35,  mdef:15, spd:40, exp:76,  gold:20,  color:'#664422', shape:'boar' },
    { grade:5, id:'bt5', name:'シャドウウルフ', race:'beast', hp:850,  atk:85,  matk:20,  def:38,  mdef:25, spd:60, exp:110,  gold:32,  color:'#556677', shape:'wolf' },
    { grade:6, id:'bt6', name:'アイアンベア',   race:'beast', hp:1500, atk:120, matk:0,   def:70,  mdef:35, spd:30, exp:160,  gold:50,  color:'#775533', shape:'bear' },
    { grade:7, id:'bt7', name:'グリフォンレッサ', race:'beast', hp:3080, atk:224, matk:84, def:77,  mdef:70, spd:55, exp:240, gold:75,  color:'#cc9933', shape:'griffon' },
    { grade:8, id:'bt8', name:'キマイラ',       race:'beast', hp:7000, atk:350, matk:252, def:140, mdef:126, spd:45, exp:440, gold:140, color:'#885522', shape:'chimera' },
  ],

  DRAGONS: [
    { grade:1, id:'dr1', name:'ドラコ',           race:'dragon', hp:120,  atk:14,  matk:8,   def:8,   mdef:6,  spd:35, exp:20,  gold:6,   color:'#55aa55', shape:'baby' },
    { grade:2, id:'dr2', name:'コドモドラゴン',   race:'dragon', hp:220,  atk:28,  matk:15,  def:14,  mdef:10, spd:38, exp:32,  gold:10,  color:'#cc3322', shape:'young', fire:true },
    { grade:3, id:'dr3', name:'スカイウィング',   race:'dragon', hp:380,  atk:42,  matk:30,  def:20,  mdef:18, spd:55, exp:56,  gold:16,  color:'#4488cc', shape:'sky', wing:true },
    { grade:4, id:'dr4', name:'陸生ワイバーン',   race:'dragon', hp:700,  atk:72,  matk:25,  def:40,  mdef:22, spd:42, exp:90,  gold:26,  color:'#886644', shape:'wyvern' },
    { grade:5, id:'dr5', name:'レッドドラゴン',   race:'dragon', hp:1100, atk:100, matk:60,  def:50,  mdef:35, spd:45, exp:130,  gold:38,  color:'#cc2211', shape:'red', fire:true },
    { grade:6, id:'dr6', name:'フロストドラゴン', race:'dragon', hp:1600, atk:120, matk:90,  def:55,  mdef:60, spd:40, exp:180,  gold:55,  color:'#66bbdd', shape:'frost' },
    { grade:7, id:'dr7', name:'エインシャントドラゴン', race:'dragon', hp:3920, atk:252, matk:182, def:105, mdef:98, spd:42, exp:280, gold:85, color:'#336644', shape:'ancient' },
    { grade:8, id:'dr8', name:'アビス・ドラゴン', race:'dragon', hp:8400, atk:392, matk:280, def:154, mdef:140, spd:48, exp:500, gold:160, color:'#442266', shape:'abyss', aura:true },
  ],

  BANDITS: [
    { grade:1, id:'bd1', name:'駆け出しの賊',   race:'bandit', hp:90,   atk:14,  matk:0,   def:5,   mdef:3,  spd:40, exp:16,   gold:8,   color:'#aa8866', shape:'novice' },
    { grade:2, id:'bd2', name:'コソ泥',         race:'bandit', hp:170,  atk:25,  matk:0,   def:10,  mdef:5,  spd:48, exp:28,  gold:12,  color:'#887755', shape:'thief' },
    { grade:3, id:'bd3', name:'盗賊',           race:'bandit', hp:300,  atk:40,  matk:5,   def:18,  mdef:8,  spd:45, exp:48,  gold:16,  color:'#665544', shape:'bandit' },
    { grade:4, id:'bd4', name:'略奪者',         race:'bandit', hp:550,  atk:62,  matk:10,  def:30,  mdef:14, spd:38, exp:84,  gold:24,  color:'#554433', shape:'raider' },
    { grade:5, id:'bd5', name:'暗殺者',         race:'bandit', hp:800,  atk:95,  matk:15,  def:32,  mdef:20, spd:65, exp:120,  gold:35,  color:'#333344', shape:'assassin' },
    { grade:6, id:'bd6', name:'影の弓手',       race:'bandit', hp:1300, atk:110, matk:40,  def:42,  mdef:38, spd:55, exp:170,  gold:52,  color:'#334455', shape:'archer' },
    { grade:7, id:'bd7', name:'賊の魔道士',     race:'bandit', hp:2940, atk:140, matk:196, def:63,  mdef:91, spd:42, exp:260, gold:80,  color:'#553366', shape:'mage' },
    { grade:8, id:'bd8', name:'盗賊王',         race:'bandit', hp:6300, atk:336, matk:168, def:133,  mdef:112, spd:50, exp:460, gold:150, color:'#dddddd', shape:'king' },
  ],

  BOSSES: {
    1:  { id:'b01', name:'ゴブリンキング',   hp:1333,   atk:80,   matk:0,   def:35,  mdef:18,  spd:35, exp:60,   gold:40,   color:'#448822' },
    2:  { id:'b02', name:'海竜',             hp:2333,   atk:120,  matk:50,  def:50,  mdef:35,  spd:40, exp:100,  gold:70,   color:'#2266aa' },
    3:  { id:'b03', name:'森の主',           hp:3666,   atk:160,  matk:70,  def:65,  mdef:50,  spd:30, exp:150,  gold:100,  color:'#224411' },
    4:  { id:'b04', name:'炎帝イフリート',   hp:5333,   atk:220,  matk:120, def:80,  mdef:60,  spd:35, exp:220,  gold:150,  color:'#cc2200' },
    5:  { id:'b05', name:'氷姫フリージア',   hp:8000,  atk:280,  matk:180, def:100, mdef:90,  spd:40, exp:300,  gold:200,  color:'#88ccee' },
    6:  { id:'b06', name:'砂王ファラオ',     hp:12000,  atk:350,  matk:220, def:120, mdef:110, spd:38, exp:400,  gold:280,  color:'#ccaa22' },
    7:  { id:'b07', name:'闇将軍ダリウス',   hp:18666,  atk:450,  matk:300, def:150, mdef:140, spd:42, exp:550,  gold:380,  color:'#221144' },
    8:  { id:'b08', name:'天使長ミカエル',   hp:42000,  atk:812,  matk:560, def:266, mdef:252, spd:50, exp:800,  gold:550,  color:'#eeeeff' },
    9:  { id:'b09', name:'魔王ルシファー',   hp:65332,  atk:1050,  matk:770, def:336, mdef:308, spd:50, exp:1200, gold:850,  color:'#660022' },
    10: { id:'b10', name:'終焉の神',         hp:112000, atk:1400, matk:1050, def:420, mdef:392, spd:55, exp:2500, gold:1800, color:'#ffd700' },
  },

  WORLD_GRADES: {
    1: {min:1,max:2}, 2: {min:1,max:3}, 3: {min:2,max:4}, 4: {min:3,max:5}, 5: {min:3,max:6},
    6: {min:4,max:6}, 7: {min:5,max:7}, 8: {min:6,max:8}, 9: {min:7,max:8}, 10:{min:7,max:8},
  },

  getMonsters: function(world) {
    var range = this.WORLD_GRADES[world] || {min:1,max:2};
    var pool = [];
    var races = [this.SLIMES, this.BEASTS, this.DRAGONS, this.BANDITS];
    for (var r = 0; r < races.length; r++) {
      for (var g = range.min; g <= range.max; g++) {
        if (races[r][g-1]) pool.push(races[r][g-1]);
      }
    }
    return pool;
  },

  getBoss: function(world) {
    var b = this.BOSSES[world];
    if (!b) return null;
    return { id:b.id, name:b.name, hp:b.hp, atk:b.atk, matk:b.matk, def:b.def, mdef:b.mdef, spd:b.spd, exp:b.exp, gold:b.gold, spriteColor:b.color, width:50, height:50, speed:45, attackInterval:1.5 };
  },

  pickRandom: function(world) {
    var list = this.getMonsters(world);
    return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;
  },
};
