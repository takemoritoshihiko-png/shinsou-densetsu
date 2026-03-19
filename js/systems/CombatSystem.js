// 戦闘ダメージ計算システム
var CombatSystem = {

  // ランダム補正 (0.9〜1.1)
  _randomFactor: function () {
    return 0.9 + Math.random() * 0.2;
  },

  // 物理ダメージ計算
  calcPhysical: function (attacker, defender) {
    var atk = attacker.atk || 0;
    var def = defender.def || 0;
    var crit = attacker.crit || 0;

    // ATK × (1 - DEF/(DEF+100)) × ランダム補正
    var reduction = def / (def + 100);
    var damage = atk * (1 - reduction) * this._randomFactor();

    // クリティカル判定
    var isCritical = Math.random() * 100 < crit;
    if (isCritical) {
      damage *= 1.5;
    }

    damage = Math.max(1, Math.floor(damage));

    return { damage: damage, critical: isCritical };
  },

  // 魔法ダメージ計算
  calcMagical: function (attacker, defender) {
    var matk = attacker.matk || 0;
    var mdef = defender.mdef || 0;
    var crit = attacker.crit || 0;

    // MATK × (1 - MDEF/(MDEF+100)) × ランダム補正
    var reduction = mdef / (mdef + 100);
    var damage = matk * (1 - reduction) * this._randomFactor();

    // クリティカル判定
    var isCritical = Math.random() * 100 < crit;
    if (isCritical) {
      damage *= 1.5;
    }

    damage = Math.max(1, Math.floor(damage));

    return { damage: damage, critical: isCritical };
  },

  // ダメージを適用して結果を返す（被ダメージ軽減パッシブ考慮）
  applyDamage: function (target, amount) {
    var finalAmount = amount;
    // damage_reduction パッシブ（Player.getDamageReduction）
    if (target.getDamageReduction) {
      var reduction = target.getDamageReduction();
      if (reduction > 0) {
        finalAmount = Math.max(1, Math.floor(amount * (1 - reduction / 100)));
      }
    }
    target.hp = Math.max(0, target.hp - finalAmount);
    return target.hp <= 0;
  },
};

// ダメージ数字のフロートテキスト
class DamageNumber {
  constructor(x, y, damage, critical) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.critical = critical;

    this.elapsed = 0;
    this.duration = 800; // ms
    this.vy = -120;      // 上に浮く速度 px/sec
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.elapsed += dt;
    this.y += this.vy * (dt / 1000);

    // 減速
    this.vy *= 0.97;

    if (this.elapsed >= this.duration) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    var progress = this.elapsed / this.duration;
    var alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.critical) {
      // クリティカル: 黄色、1.3倍サイズ
      var size = Math.round(22 * 1.3);
      ctx.font = 'bold ' + size + 'px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffdd00';
      // 影
      ctx.shadowColor = 'rgba(255, 180, 0, 0.6)';
      ctx.shadowBlur = 8;
    } else {
      // 通常: 白
      ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
    }

    ctx.fillText(this.damage, this.x, this.y);
    ctx.restore();
  }
}
