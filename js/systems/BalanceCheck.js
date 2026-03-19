// バランスチェック用関数（コンソールから実行）
var BalanceCheck = {

  // プレイヤーステータスをシミュレート
  simulatePlayer: function (level, job, rarity, equipRank, upgradeLevel) {
    var stats = StatusSystem.calc(level, job || 'warrior', rarity || 'SR');

    // 装備シミュレート（全6部位に同ランクTier装備）
    if (equipRank) {
      var mul = EquipmentData.RANK_MULTIPLIER[equipRank] || 1;
      var upgMul = UpgradeSystem.getUpgradeMultiplier(upgradeLevel || 0);
      // 全6部位の合計概算（武器+盾+頭+体+足+アクセの平均ステ）
      var tierIdx = Math.min(Math.floor(level / 5), 9);
      var w = EquipmentData.WEAPONS[tierIdx];
      var sh = EquipmentData.SHIELDS[tierIdx];
      var bd = EquipmentData.BODIES[tierIdx];
      var hd = EquipmentData.HEADS[tierIdx];
      var ft = EquipmentData.FEET[tierIdx];
      var ac = EquipmentData.ACCESSORIES[tierIdx];

      var equipBonus = { hp: 0, mp: 0, atk: 0, matk: 0, def: 0, mdef: 0, spd: 0, crit: 0 };
      var sources = [w, sh, bd, hd, ft, ac];
      for (var i = 0; i < sources.length; i++) {
        var src = sources[i];
        if (!src) continue;
        for (var k in equipBonus) {
          if (src[k]) {
            equipBonus[k] += Math.floor(src[k] * mul * upgMul);
          }
        }
      }
      // 装備ボーナスを加算
      for (var k2 in equipBonus) {
        if (k2 === 'crit') {
          stats[k2] = Math.round((stats[k2] + equipBonus[k2]) * 10) / 10;
        } else {
          stats[k2] += equipBonus[k2];
        }
      }
    }

    return stats;
  },

  // 推奨レベルテーブル
  WORLD_REC_LV: [0, 1, 8, 15, 22, 30, 38, 46, 55, 65, 80],

  // フルバランスチェック
  run: function () {
    console.log('========= 神装伝説 バランスチェック =========');
    console.log('');

    // 1. プレイヤーステ比較: Lv99装備なし vs Lv50レジェンド+8
    console.log('--- プレイヤー比較 ---');
    var lv99bare = this.simulatePlayer(99, 'warrior', 'SR', null, 0);
    var lv50legend = this.simulatePlayer(50, 'warrior', 'SR', 'legend', 8);
    console.log('Lv99 装備なし:', JSON.stringify(lv99bare));
    console.log('Lv50 レジェンド+8:', JSON.stringify(lv50legend));

    var atkRatio = lv50legend.atk / lv99bare.atk;
    console.log('ATK比率 (Lv50装備/Lv99裸): ' + atkRatio.toFixed(2) + 'x → ' +
      (atkRatio > 1 ? '装備が上回る(想定通り)' : 'レベルが上回る(要調整)'));
    console.log('');

    // 2. 各ワールドの想定ステータス vs ボスHP
    console.log('--- ワールド別バランス ---');
    console.log('世界 | 推奨Lv | プレイヤーATK | ボスHP | 必要攻撃回数');
    for (var w = 1; w <= 10; w++) {
      var recLv = this.WORLD_REC_LV[w];
      var pStats = this.simulatePlayer(recLv, 'warrior', 'SR', 'common', 0);
      var boss = MonsterData.getBoss(w);
      if (!boss) continue;

      // ダメージ概算: ATK × (1 - DEF/(DEF+100))
      var dmg = pStats.atk * (1 - boss.def / (boss.def + 100));
      var hitsNeeded = Math.ceil(boss.hp / dmg);

      console.log('W' + w + '   | Lv' + recLv + (recLv < 10 ? ' ' : '') +
        '  | ATK ' + pStats.atk + (pStats.atk < 100 ? ' ' : '') +
        '       | HP ' + boss.hp + (boss.hp < 1000 ? ' ' : '') +
        '    | ~' + hitsNeeded + '回');
    }
    console.log('');

    // 3. ゴールド経済チェック
    console.log('--- ゴールド経済 ---');
    for (var w2 = 1; w2 <= 10; w2++) {
      var monsters = MonsterData.getMonsters(w2);
      var avgGold = 0;
      for (var m = 0; m < monsters.length; m++) avgGold += monsters[m].gold;
      avgGold = monsters.length > 0 ? Math.floor(avgGold / monsters.length) : 0;
      var stageGold = avgGold * 15; // ~15 enemies per stage
      var boss2 = MonsterData.getBoss(w2);
      var bossGold = boss2 ? boss2.gold : 0;
      var totalPerStage = stageGold + bossGold;
      var stagesForGacha = totalPerStage > 0 ? (300 / totalPerStage).toFixed(1) : '∞';
      console.log('W' + w2 + ': 平均' + avgGold + 'G/敵, ステージ合計~' + totalPerStage + 'G, ガチャ1回=' + stagesForGacha + 'ステージ');
    }
    console.log('');

    // 4. 装備の強さ割合
    console.log('--- 装備の強さ割合 ---');
    var testLevels = [10, 25, 50, 80, 99];
    for (var t = 0; t < testLevels.length; t++) {
      var lv = testLevels[t];
      var bare = this.simulatePlayer(lv, 'warrior', 'SR', null, 0);
      var equipped = this.simulatePlayer(lv, 'warrior', 'SR', 'rare', 4);
      var ratio = ((equipped.atk - bare.atk) / equipped.atk * 100).toFixed(1);
      console.log('Lv' + lv + ': 裸ATK=' + bare.atk + ', 装備ATK=' + equipped.atk + ', 装備比率=' + ratio + '%');
    }

    console.log('');
    console.log('=========================================');
  },
};

// コンソールから BalanceCheck.run() で実行可能
