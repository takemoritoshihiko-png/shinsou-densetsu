// ワールド別ドロップテーブル
var DropTableData = {

  // 各ワールドでドロップする装備ベースID一覧
  TABLES: {
    1:  { weapons: ['w01', 'w02'],  shields: ['sh01', 'sh02'],  heads: ['hd01', 'hd02'],  bodies: ['bd01', 'bd02'],  feet: ['ft01', 'ft02'],  accessories: ['ac01', 'ac02'] },
    2:  { weapons: ['w02', 'w03'],  shields: ['sh02', 'sh03'],  heads: ['hd02', 'hd03'],  bodies: ['bd02', 'bd03'],  feet: ['ft02', 'ft03'],  accessories: ['ac02', 'ac03'] },
    3:  { weapons: ['w03', 'w04'],  shields: ['sh03', 'sh04'],  heads: ['hd03', 'hd04'],  bodies: ['bd03', 'bd04'],  feet: ['ft03', 'ft04'],  accessories: ['ac03', 'ac04'] },
    4:  { weapons: ['w04', 'w05'],  shields: ['sh04', 'sh05'],  heads: ['hd04', 'hd05'],  bodies: ['bd04', 'bd05'],  feet: ['ft04', 'ft05'],  accessories: ['ac04', 'ac05'] },
    5:  { weapons: ['w05', 'w06'],  shields: ['sh05', 'sh06'],  heads: ['hd05', 'hd06'],  bodies: ['bd05', 'bd06'],  feet: ['ft05', 'ft06'],  accessories: ['ac05', 'ac06'] },
    6:  { weapons: ['w06', 'w07'],  shields: ['sh06', 'sh07'],  heads: ['hd06', 'hd07'],  bodies: ['bd06', 'bd07'],  feet: ['ft06', 'ft07'],  accessories: ['ac06', 'ac07'] },
    7:  { weapons: ['w07', 'w08'],  shields: ['sh07', 'sh08'],  heads: ['hd07', 'hd08'],  bodies: ['bd07', 'bd08'],  feet: ['ft07', 'ft08'],  accessories: ['ac07', 'ac08'] },
    8:  { weapons: ['w08', 'w09'],  shields: ['sh08', 'sh09'],  heads: ['hd08', 'hd09'],  bodies: ['bd08', 'bd09'],  feet: ['ft08', 'ft09'],  accessories: ['ac08', 'ac09'] },
    9:  { weapons: ['w09', 'w10'],  shields: ['sh09', 'sh10'],  heads: ['hd09', 'hd10'],  bodies: ['bd09', 'bd10'],  feet: ['ft09', 'ft10'],  accessories: ['ac09', 'ac10'] },
    10: { weapons: ['w10'],         shields: ['sh10'],          heads: ['hd10'],           bodies: ['bd10'],          feet: ['ft10'],           accessories: ['ac10'] },
  },

  // 指定ワールドからランダムな装備ベースIDを取得
  pickRandomBaseId: function (world) {
    var table = this.TABLES[world] || this.TABLES[1];
    // 全カテゴリを統合
    var all = [].concat(
      table.weapons,
      table.shields,
      table.heads,
      table.bodies,
      table.feet,
      table.accessories
    );
    return all[Math.floor(Math.random() * all.length)];
  },

  // 指定ワールド+部位からランダムな装備ベースIDを取得
  pickRandomBySlot: function (world, slot) {
    var table = this.TABLES[world] || this.TABLES[1];
    var slotMap = {
      weapon: 'weapons', shield: 'shields', head: 'heads',
      body: 'bodies', feet: 'feet', accessory: 'accessories',
    };
    var key = slotMap[slot];
    if (!key || !table[key] || table[key].length === 0) return this.pickRandomBaseId(world);
    var list = table[key];
    return list[Math.floor(Math.random() * list.length)];
  },
};
