// 敵キャラクター
class Enemy {
  constructor(stats) {
    // ボスフラグ
    this.isBoss = !!stats.isBoss;
    this.bossName = stats.bossName || '';
    this.spriteColor = stats.spriteColor || (this.isBoss ? '#8b0000' : '#dd3333');
    this.monsterName = stats.monsterName || '';

    // サイズ
    this.width = stats.width || 36;
    this.height = stats.height || 50;

    // 画面右端の外からスポーン
    this.x = CONFIG.CANVAS_WIDTH + (stats.spawnOffset || 0);
    this.y = CONFIG.BATTLE_GROUND_Y - this.height;

    // 移動速度
    this.speed = stats.speed || 80;

    // ステータス（StatusSystem経由で正規化）
    var s = StatusSystem.fromRaw(stats);
    this.hp    = s.hp;
    this.hpMax = s.hp;
    this.atk   = s.atk;
    this.matk  = s.matk;
    this.def   = s.def;
    this.mdef  = s.mdef;
    this.spd   = s.spd;
    this.crit  = s.crit;

    // 報酬（ステータスとは別管理）
    this.rewardExp  = stats.exp || 0;
    this.rewardGold = stats.gold || 0;

    // 攻撃
    this.attackRange = this.isBoss ? 70 : 50;
    this.attackInterval = stats.attackInterval || 1.5;
    this.attackTimer = 0;

    // 状態
    this.alive = true;

    // 死亡エフェクト
    this.deathEffect = false;
    this.deathTimer = 0;
    this.deathDuration = this.isBoss ? 600 : 300;
  }

  // 下位互換プロパティ（BattleSceneがenemy.exp / enemy.goldを参照する箇所向け）
  get exp() { return this.rewardExp; }
  get gold() { return this.rewardGold; }

  update(dt, player) {
    if (!this.alive) {
      if (this.deathEffect) {
        this.deathTimer += dt;
        if (this.deathTimer >= this.deathDuration) {
          this.deathEffect = false;
        }
      }
      return;
    }

    var sec = dt / 1000;

    var dx = player.x + player.width / 2 - (this.x + this.width / 2);
    var dist = Math.abs(dx);

    if (dist > this.attackRange) {
      this.x -= this.speed * sec;
    } else {
      this.attackTimer += sec;
      if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this._attack(player, this._onDamageCallback);
      }
    }
  }

  _attack(player, onDamage) {
    var result = CombatSystem.calcPhysical(this, player);
    CombatSystem.applyDamage(player, result.damage);
    if (onDamage) {
      onDamage(player.x + player.width / 2, player.y, result.damage, result.critical);
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deathEffect = true;
      this.deathTimer = 0;
      return true;
    }
    return false;
  }

  isFinished() {
    return !this.alive && !this.deathEffect;
  }

  render(ctx) {
    if (this.deathEffect) {
      this._renderDeathEffect(ctx);
      return;
    }

    if (!this.alive) return;

    var ecx = this.x + this.width / 2;
    var eby = this.y + this.height;
    var sc = this.spriteColor;
    var pulse = Math.sin(Date.now() * 0.003) * 0.05;

    ctx.save();

    if (this.isBoss) {
      // --- ボス描画 ---
      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(ecx, eby + 3, this.width / 2.2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 体（丸みのある大きい形状）
      ctx.fillStyle = sc;
      ctx.beginPath();
      ctx.moveTo(ecx - this.width / 2, eby);
      ctx.lineTo(ecx - this.width / 2 - 5, this.y + this.height * 0.4);
      ctx.quadraticCurveTo(ecx, this.y - 10, ecx + this.width / 2 + 5, this.y + this.height * 0.4);
      ctx.lineTo(ecx + this.width / 2, eby);
      ctx.closePath();
      ctx.fill();

      // 内側グラデ
      var bGrad = ctx.createLinearGradient(ecx - 20, this.y, ecx + 20, eby);
      bGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
      bGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = bGrad;
      ctx.fill();

      // 目（赤い光）
      var eyeY = this.y + this.height * 0.28;
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8 + pulse * 40;
      ctx.beginPath();
      ctx.arc(ecx - 14, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ecx + 14, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 瞳
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ecx - 14, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ecx + 14, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();

      // 角（2本）
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(ecx - 20, this.y + 10);
      ctx.lineTo(ecx - 28, this.y - 18);
      ctx.lineTo(ecx - 12, this.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ecx + 20, this.y + 10);
      ctx.lineTo(ecx + 28, this.y - 18);
      ctx.lineTo(ecx + 12, this.y + 5);
      ctx.closePath();
      ctx.fill();

      // オーラ
      ctx.strokeStyle = sc;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.2 + pulse;
      ctx.beginPath();
      ctx.arc(ecx, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

    } else {
      // --- 雑魚描画 ---
      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(ecx, eby + 2, this.width / 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 体（楕円形のスライム/獣型）
      ctx.fillStyle = sc;
      ctx.beginPath();
      ctx.ellipse(ecx, this.y + this.height * 0.55, this.width / 2, this.height / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(ecx - 4, this.y + this.height * 0.35, this.width / 4, this.height / 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 目
      var meY = this.y + this.height * 0.42;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ecx - 6, meY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ecx + 6, meY, 4, 0, Math.PI * 2);
      ctx.fill();

      // 瞳
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(ecx - 5, meY + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ecx + 7, meY + 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // HPバー
      var barW = this.width + 4;
      var barH = 4;
      var barX = ecx - barW / 2;
      var barY = this.y - 10;
      var ratio = this.hpMax > 0 ? this.hp / this.hpMax : 0;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = ratio > 0.5 ? '#44cc44' : ratio > 0.2 ? '#ccaa22' : '#cc2222';
      ctx.fillRect(barX, barY, barW * ratio, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }

  _renderDeathEffect(ctx) {
    var progress = this.deathTimer / this.deathDuration;
    var alpha = 1 - progress;
    var cx = this.x + this.width / 2;
    var cy = this.y + this.height / 2;
    var count = this.isBoss ? 12 : 6;
    var maxDist = this.isBoss ? 50 : 20;
    var maxSize = this.isBoss ? 7 : 4;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i;
      var dist = maxDist * progress;
      var px = cx + Math.cos(angle) * dist;
      var py = cy + Math.sin(angle) * dist;
      var size = maxSize * (1 - progress);

      ctx.fillStyle = this.isBoss ? '#ff6666' : '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
