// ドロップシステム
var DropSystem = {

  // ワールド別の装備ランク確率テーブル
  // レジェンドは最大10%（W10ボス）、通常フロアでは1〜5%
  // エピックも希少寄り — やり込みで少しずつ集まるバランス
  EQUIP_RANK_TABLES: {
    1:  { common: 84, uncommon: 14, rare: 1, epic: 0, legend: 1 },
    2:  { common: 75, uncommon: 21, rare: 3, epic: 0, legend: 1 },
    3:  { common: 65, uncommon: 28, rare: 6, epic: 0, legend: 1 },
    4:  { common: 52, uncommon: 33, rare: 12, epic: 2, legend: 1 },
    5:  { common: 40, uncommon: 38, rare: 17, epic: 4, legend: 1 },
    6:  { common: 28, uncommon: 40, rare: 24, epic: 6, legend: 2 },
    7:  { common: 18, uncommon: 38, rare: 30, epic: 11, legend: 3 },
    8:  { common: 8,  uncommon: 32, rare: 38, epic: 18, legend: 4 },
    9:  { common: 3,  uncommon: 22, rare: 40, epic: 28, legend: 7 },
    10: { common: 0,  uncommon: 10, rare: 38, epic: 42, legend: 10 },
    // ボス専用テーブル（各ワールドのボスが使用 — 通常より1段階良い）
    boss1:  { common: 70, uncommon: 24, rare: 4, epic: 1, legend: 1 },
    boss2:  { common: 58, uncommon: 30, rare: 9, epic: 2, legend: 1 },
    boss3:  { common: 45, uncommon: 35, rare: 15, epic: 4, legend: 1 },
    boss4:  { common: 32, uncommon: 38, rare: 21, epic: 7, legend: 2 },
    boss5:  { common: 20, uncommon: 38, rare: 28, epic: 11, legend: 3 },
    boss6:  { common: 12, uncommon: 32, rare: 35, epic: 16, legend: 5 },
    boss7:  { common: 5,  uncommon: 25, rare: 38, epic: 25, legend: 7 },
    boss8:  { common: 2,  uncommon: 15, rare: 38, epic: 35, legend: 10 },
    boss9:  { common: 0,  uncommon: 8,  rare: 32, epic: 45, legend: 15 },
    boss10: { common: 0,  uncommon: 3,  rare: 22, epic: 50, legend: 25 },
  },

  // ドロップ確率
  RATES: {
    equipment:    20, // %
    core:          5,
    rerollStone:   8,
    eraseStone:    3,
    enhanceMat:   15,
    potion:       20,
  },

  RANK_COLORS: { common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', epic: '#bb44ff', legend: '#ffd700' },
  RANK_NAMES: { common: 'コモン', uncommon: 'アンコモン', rare: 'レア', epic: 'エピック', legend: 'レジェンド' },

  // コアのランクテーブル（ワールドに連動）
  CORE_RANK_BY_WORLD: {
    1: 'common', 2: 'common', 3: 'uncommon', 4: 'uncommon',
    5: 'rare', 6: 'rare', 7: 'epic', 8: 'epic', 9: 'legend', 10: 'legend',
  },

  // 装備ランクを抽選
  _rollEquipRank: function (world, isBoss) {
    var tableKey = isBoss ? ('boss' + world) : world;
    var table = this.EQUIP_RANK_TABLES[tableKey] || this.EQUIP_RANK_TABLES[world] || this.EQUIP_RANK_TABLES[1];
    var roll = Math.random() * 100;
    var cum = 0;
    for (var rank in table) {
      cum += table[rank];
      if (roll < cum) return rank;
    }
    return 'common';
  },

  // 装備のベースIDをランダム選択（DropTableData使用）
  _rollEquipBaseId: function (world) {
    return DropTableData.pickRandomBaseId(world);
  },

  // 敵1体のドロップを生成
  generateDrops: function (enemy, world, playerLevel, equipSystem, partySystem) {
    var drops = [];
    var isBoss = !!enemy.isBoss;

    // 1. ゴールド（必ず）
    var goldAmount = enemy.rewardGold || enemy.gold || 5;
    if (isBoss) goldAmount *= 3;
    drops.push({ type: 'gold', amount: goldAmount });

    // 2. 装備
    var eqRate = isBoss ? Math.min(this.RATES.equipment * 2, 80) : this.RATES.equipment;
    if (Math.random() * 100 < eqRate) {
      var rank = this._rollEquipRank(world, isBoss);
      var baseId = this._rollEquipBaseId(world);
      var item = equipSystem.addEquipment(baseId, rank);
      drops.push({ type: 'equipment', item: item, rank: rank });
    }

    // 3. コア
    var coreRate = isBoss ? this.RATES.core * 3 : this.RATES.core;
    if (Math.random() * 100 < coreRate) {
      var coreRank = this.CORE_RANK_BY_WORLD[Math.min(world, 10)] || 'common';
      equipSystem.cores[coreRank] = (equipSystem.cores[coreRank] || 0) + 1;
      drops.push({ type: 'core', rank: coreRank });
    }

    // 4. 再抽選の石
    if (Math.random() * 100 < this.RATES.rerollStone) {
      equipSystem.rerollStones++;
      drops.push({ type: 'rerollStone' });
    }

    // 5. 消去の石
    if (Math.random() * 100 < this.RATES.eraseStone) {
      equipSystem.eraseStones++;
      drops.push({ type: 'eraseStone' });
    }

    // 6. 強化素材
    if (Math.random() * 100 < this.RATES.enhanceMat) {
      var matCount = isBoss ? 5 : 1;
      if (partySystem) {
        partySystem.enhanceMaterials = (partySystem.enhanceMaterials || 0) + matCount;
      }
      drops.push({ type: 'enhanceMat', amount: matCount });
    }

    // 7. ポーション
    if (Math.random() * 100 < this.RATES.potion) {
      drops.push({ type: 'potion' });
    }

    return drops;
  },

  // ドロップの表示名を取得
  getDropName: function (drop) {
    switch (drop.type) {
      case 'gold': return drop.amount + ' GOLD';
      case 'equipment': return drop.item.name + ' (' + this.RANK_NAMES[drop.rank] + ')';
      case 'core': return UpgradeSystem.CORE_NAMES[drop.rank];
      case 'rerollStone': return '再抽選の石';
      case 'eraseStone': return '消去の石';
      case 'enhanceMat': return '強化素材 ×' + drop.amount;
      case 'potion': return 'ポーション';
      default: return '???';
    }
  },

  // ドロップの色を取得
  getDropColor: function (drop) {
    switch (drop.type) {
      case 'gold': return '#ffcc00';
      case 'equipment': return this.RANK_COLORS[drop.rank] || '#aaaaaa';
      case 'core': return UpgradeSystem.CORE_COLORS[drop.rank] || '#aaaaaa';
      case 'rerollStone': return '#44aaff';
      case 'eraseStone': return '#ff6666';
      case 'enhanceMat': return '#ff8844';
      case 'potion': return '#44ff88';
      default: return '#ffffff';
    }
  },

  // レアリティの演出レベルを返す (0=なし, 1=普通, 2=レア, 3=エピック, 4=レジェンド)
  getDropTier: function (drop) {
    if (drop.type !== 'equipment') return 0;
    var r = drop.rank;
    if (r === 'legend') return 4;
    if (r === 'epic') return 3;
    if (r === 'rare') return 2;
    if (r === 'uncommon') return 1;
    return 0;
  },
};

// フィールドドロップアイテム（バウンド＋自動回収演出）
class DropItem {
  constructor(x, y, drop) {
    this.drop = drop;
    this.color = DropSystem.getDropColor(drop);
    this.tier = DropSystem.getDropTier(drop);

    // 物理
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 80;
    this.vy = -150 - Math.random() * 80;
    this.groundY = this.y + 40;
    this.size = this.tier >= 2 ? 8 : 6;

    // 状態
    this.state = 'falling'; // falling | waiting | collecting | done
    this.waitTimer = 0;
    this.waitDuration = 1000;
    this.collectSpeed = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.alive = true;
    this.elapsed = 0;
  }

  update(dt, playerX, playerY) {
    this.elapsed += dt;
    var sec = dt / 1000;

    if (this.state === 'falling') {
      this.vy += 600 * sec;
      this.x += this.vx * sec;
      this.y += this.vy * sec;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = -this.vy * 0.4;
        this.vx *= 0.6;
        if (Math.abs(this.vy) < 20) {
          this.vy = 0;
          this.state = 'waiting';
          this.waitTimer = 0;
        }
      }
    } else if (this.state === 'waiting') {
      this.waitTimer += dt;
      if (this.waitTimer >= this.waitDuration) {
        this.state = 'collecting';
        this.collectSpeed = 0;
      }
    } else if (this.state === 'collecting') {
      this.targetX = playerX;
      this.targetY = playerY;
      this.collectSpeed += 800 * sec;
      var dx = this.targetX - this.x;
      var dy = this.targetY - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        this.state = 'done';
        this.alive = false;
      } else {
        var nx = dx / dist;
        var ny = dy / dist;
        this.x += nx * this.collectSpeed * sec;
        this.y += ny * this.collectSpeed * sec;
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();

    // 光の演出
    if (this.tier >= 2) {
      ctx.globalAlpha = 0.3 + (Math.sin(this.elapsed * 0.008) + 1) * 0.2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // アイテム本体
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

// レアドロップ演出エフェクト
class RareDropEffect {
  constructor(tier) {
    this.tier = tier; // 2=rare, 3=epic, 4=legend
    this.elapsed = 0;
    this.duration = tier === 4 ? 1200 : tier === 3 ? 600 : 300;
    this.alive = true;
    this.slowFactor = tier === 4 ? 0.3 : 1; // レジェンド時のスロー
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= this.duration) this.alive = false;
  }

  render(ctx) {
    if (!this.alive) return;
    var p = this.elapsed / this.duration;
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    ctx.save();

    if (this.tier === 4) {
      // レジェンド: 金色全画面フラッシュ
      ctx.globalAlpha = (1 - p) * 0.4;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, W, H);
    } else if (this.tier === 3) {
      // エピック: 紫フラッシュ + 画面揺れ（描画オフセットで表現）
      ctx.globalAlpha = (1 - p) * 0.25;
      ctx.fillStyle = '#bb44ff';
      ctx.fillRect(0, 0, W, H);
    } else if (this.tier === 2) {
      // レア: 青いフラッシュ
      ctx.globalAlpha = (1 - p) * 0.15;
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }
}
