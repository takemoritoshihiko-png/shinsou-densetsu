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


  _getBodyType() {
    var sc = this.spriteColor || '#cc4444';
    var r = parseInt(sc.substr(1, 2), 16) || 0;
    var g = parseInt(sc.substr(3, 2), 16) || 0;
    var b = parseInt(sc.substr(5, 2), 16) || 0;
    if (g > r && g > b) return 'slime';
    if (r > g && r > b) return 'beast';
    if (b > r && b > g) return b > 150 ? 'flying' : 'humanoid';
    return 'elemental';
  }

  render(ctx) {
    if (this.deathEffect) { this._renderDeathEffect(ctx); return; }
    if (!this.alive) return;
    var ecx = this.x + this.width / 2;
    var eby = this.y + this.height;
    var sc = this.spriteColor;
    var time = Date.now();
    var pulse = Math.sin(time * 0.003) * 0.05;
    ctx.save();

    if (this.isBoss) {
      // === BOSS ===
      // Ground cracks
      ctx.strokeStyle = 'rgba(80,0,0,0.4)'; ctx.lineWidth = 1;
      for (var ci = 0; ci < 5; ci++) {
        var ca = Math.PI * 2 / 5 * ci + 0.3;
        ctx.beginPath(); ctx.moveTo(ecx, eby + 2);
        ctx.lineTo(ecx + Math.cos(ca) * 35, eby + 2 + Math.sin(ca) * 8); ctx.stroke();
      }
      // Aura
      for (var ai = 0; ai < 3; ai++) {
        ctx.beginPath();
        ctx.ellipse(ecx, this.y + this.height / 2, this.width / 1.3 + ai * 8, this.height / 1.5 + ai * 6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = sc; ctx.globalAlpha = 0.08 + pulse; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Floating particles
      for (var pi = 0; pi < 6; pi++) {
        var pa = time * 0.001 + pi * 1.05;
        var px = ecx + Math.cos(pa) * (this.width * 0.7);
        var py = this.y + this.height * 0.5 + Math.sin(pa * 1.3) * (this.height * 0.4);
        ctx.fillStyle = sc; ctx.globalAlpha = 0.3 + Math.sin(pa) * 0.2;
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(ecx, eby + 3, this.width / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Body
      ctx.fillStyle = sc;
      ctx.beginPath();
      ctx.moveTo(ecx - this.width / 2, eby);
      ctx.lineTo(ecx - this.width / 2 - 5, this.y + this.height * 0.35);
      ctx.quadraticCurveTo(ecx, this.y - 12, ecx + this.width / 2 + 5, this.y + this.height * 0.35);
      ctx.lineTo(ecx + this.width / 2, eby);
      ctx.closePath(); ctx.fill();
      // Body gradient
      var bGrad = ctx.createLinearGradient(ecx - 20, this.y, ecx + 20, eby);
      bGrad.addColorStop(0, 'rgba(255,255,255,0.12)'); bGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = bGrad; ctx.fill();
      // Scale lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
      for (var si = 0; si < 4; si++) {
        var sy = this.y + this.height * 0.4 + si * 12;
        ctx.beginPath(); ctx.moveTo(ecx - 15, sy); ctx.quadraticCurveTo(ecx, sy + 4, ecx + 15, sy); ctx.stroke();
      }
      // Horns
      ctx.fillStyle = '#222222';
      ctx.beginPath(); ctx.moveTo(ecx - 22, this.y + 8); ctx.lineTo(ecx - 30, this.y - 22); ctx.lineTo(ecx - 14, this.y + 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ecx + 22, this.y + 8); ctx.lineTo(ecx + 30, this.y - 22); ctx.lineTo(ecx + 14, this.y + 3); ctx.closePath(); ctx.fill();
      // Horn glow tips
      ctx.fillStyle = '#ff6600'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(ecx - 30, this.y - 22, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx + 30, this.y - 22, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      var eyeY = this.y + this.height * 0.28;
      ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10 + pulse * 60;
      ctx.beginPath(); ctx.ellipse(ecx - 14, eyeY, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ecx + 14, eyeY, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Slit pupils
      ctx.fillStyle = '#000000';
      ctx.fillRect(ecx - 15, eyeY - 3, 2, 6);
      ctx.fillRect(ecx + 13, eyeY - 3, 2, 6);
      // Eye glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ecx - 16, eyeY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx + 12, eyeY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      // Mouth
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ecx - 12, eyeY + 16); ctx.quadraticCurveTo(ecx, eyeY + 22, ecx + 12, eyeY + 16); ctx.stroke();
      // Fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(ecx - 8, eyeY + 17); ctx.lineTo(ecx - 6, eyeY + 24); ctx.lineTo(ecx - 4, eyeY + 17); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ecx + 4, eyeY + 17); ctx.lineTo(ecx + 6, eyeY + 24); ctx.lineTo(ecx + 8, eyeY + 17); ctx.fill();
    } else {
      // === REGULAR ENEMIES ===
      var type = this._getBodyType();
      var bounce = Math.sin(time * 0.005) * 3;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(ecx, eby + 2, this.width / 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();

      if (type === 'slime') {
        // Slime: bouncy blob
        var squish = Math.sin(time * 0.006) * 2;
        var sw = this.width / 2 + squish, sh = this.height / 2.2 - squish * 0.5;
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, this.y + this.height * 0.55 + bounce * 0.5, sw, sh, 0, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.ellipse(ecx - 4, this.y + this.height * 0.35, sw * 0.5, sh * 0.4, -0.3, 0, Math.PI * 2); ctx.fill();
        // Drips
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx - 6, eby - 2, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(ecx + 8, eby - 1, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Eyes
        var meY = this.y + this.height * 0.42;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(ecx - 6, meY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(ecx + 6, meY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(ecx - 5, meY + 1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 7, meY + 1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(ecx - 6, meY - 1, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 6, meY - 1, 1, 0, Math.PI * 2); ctx.fill();
        // Mouth
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ecx, meY + 8, 4, 0.2, Math.PI - 0.2); ctx.stroke();

      } else if (type === 'beast') {
        // Beast: four-legged creature
        var bcy = this.y + this.height * 0.5;
        var tailSwing = Math.sin(time * 0.006) * 8;
        // Tail
        ctx.strokeStyle = sc; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ecx + this.width * 0.35, bcy);
        ctx.quadraticCurveTo(ecx + this.width * 0.6, bcy - 10 + tailSwing, ecx + this.width * 0.7, bcy - 20 + tailSwing);
        ctx.stroke();
        // Legs
        ctx.fillStyle = sc;
        var legAnim = Math.sin(time * 0.008) * 3;
        ctx.fillRect(ecx - 12, bcy + 8 + legAnim, 5, 14);
        ctx.fillRect(ecx - 3, bcy + 8 - legAnim, 5, 14);
        ctx.fillRect(ecx + 5, bcy + 8 + legAnim, 5, 14);
        ctx.fillRect(ecx + 14, bcy + 8 - legAnim, 5, 14);
        // Body
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, bcy, this.width / 2, this.height / 3, 0, 0, Math.PI * 2); ctx.fill();
        // Fur dots
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (var fi = 0; fi < 6; fi++) {
          ctx.beginPath(); ctx.arc(ecx - 10 + fi * 5, bcy - 4 + (fi % 2) * 6, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        // Head
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx - this.width * 0.35, bcy - 6, 10, 8, -0.3, 0, Math.PI * 2); ctx.fill();
        // Ears
        ctx.beginPath(); ctx.moveTo(ecx - this.width * 0.4, bcy - 12); ctx.lineTo(ecx - this.width * 0.5, bcy - 24);
        ctx.lineTo(ecx - this.width * 0.35, bcy - 10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ecx - this.width * 0.3, bcy - 12); ctx.lineTo(ecx - this.width * 0.35, bcy - 22);
        ctx.lineTo(ecx - this.width * 0.25, bcy - 10); ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(ecx - this.width * 0.4, bcy - 8, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.fillRect(ecx - this.width * 0.41, bcy - 10, 1.5, 4);
        // Fangs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(ecx - this.width * 0.4, bcy - 2); ctx.lineTo(ecx - this.width * 0.38, bcy + 4);
        ctx.lineTo(ecx - this.width * 0.36, bcy - 2); ctx.fill();

      } else if (type === 'humanoid') {
        // Humanoid: cloaked figure with staff
        var hcy = this.y + this.height * 0.5;
        // Cape
        ctx.fillStyle = sc; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(ecx - 8, hcy - 12); ctx.quadraticCurveTo(ecx - 16, hcy + 10, ecx - 12, eby);
        ctx.lineTo(ecx + 12, eby); ctx.quadraticCurveTo(ecx + 16, hcy + 10, ecx + 8, hcy - 12); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Body
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.moveTo(ecx - 8, hcy - 8); ctx.lineTo(ecx + 8, hcy - 8);
        ctx.lineTo(ecx + 6, eby - 8); ctx.lineTo(ecx - 6, eby - 8); ctx.closePath(); ctx.fill();
        // Legs
        ctx.fillStyle = '#333344';
        ctx.fillRect(ecx - 5, eby - 10, 4, 10); ctx.fillRect(ecx + 1, eby - 10, 4, 10);
        // Hood/head
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.arc(ecx, hcy - 14, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ecx - 10, hcy - 14); ctx.lineTo(ecx, hcy - 28);
        ctx.lineTo(ecx + 10, hcy - 14); ctx.closePath(); ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#44ffff'; ctx.shadowColor = '#44ffff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(ecx - 4, hcy - 16, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 4, hcy - 16, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Staff
        ctx.strokeStyle = '#8b7355'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ecx + 14, hcy - 20); ctx.lineTo(ecx + 14, eby); ctx.stroke();
        ctx.fillStyle = '#bb44ff'; ctx.shadowColor = '#bb44ff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(ecx + 14, hcy - 22, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

      } else if (type === 'flying') {
        // Flying: winged creature
        var flyY = this.y + this.height * 0.4 + Math.sin(time * 0.005) * 6;
        var wingAngle = Math.sin(time * 0.01) * 0.4;
        // Wing shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(ecx, eby + 2, 20, 3, 0, 0, Math.PI * 2); ctx.fill();
        // Wings
        ctx.fillStyle = sc; ctx.globalAlpha = 0.7;
        ctx.save(); ctx.translate(ecx - 5, flyY); ctx.rotate(-wingAngle - 0.3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -15, -30, -5);
        ctx.quadraticCurveTo(-20, 5, 0, 0); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(ecx + 5, flyY); ctx.rotate(wingAngle + 0.3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -15, 30, -5);
        ctx.quadraticCurveTo(20, 5, 0, 0); ctx.fill(); ctx.restore();
        ctx.globalAlpha = 1;
        // Body
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, flyY, this.width / 3, this.height / 4, 0, 0, Math.PI * 2); ctx.fill();
        // Tail
        ctx.beginPath(); ctx.moveTo(ecx + 8, flyY + 5); ctx.quadraticCurveTo(ecx + 20, flyY + 15, ecx + 25, flyY + 8); ctx.strokeStyle = sc; ctx.lineWidth = 2; ctx.stroke();
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(ecx - 5, flyY - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 5, flyY - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(ecx - 4, flyY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 6, flyY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
        // Beak
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath(); ctx.moveTo(ecx - 2, flyY + 1); ctx.lineTo(ecx + 2, flyY + 1); ctx.lineTo(ecx, flyY + 6); ctx.closePath(); ctx.fill();

      } else {
        // Elemental: glowing amorphous shape
        var ecy = this.y + this.height * 0.5;
        // Outer glow
        ctx.fillStyle = sc; ctx.globalAlpha = 0.15;
        ctx.beginPath(); ctx.arc(ecx, ecy, this.width / 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Core
        var coreGrad = ctx.createRadialGradient(ecx, ecy, 0, ecx, ecy, this.width / 2.5);
        coreGrad.addColorStop(0, '#ffffff'); coreGrad.addColorStop(0.3, sc); coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath(); ctx.arc(ecx, ecy, this.width / 2.5, 0, Math.PI * 2); ctx.fill();
        // Orbiting sparks
        for (var oi = 0; oi < 4; oi++) {
          var oa = time * 0.003 + oi * Math.PI / 2;
          var ox = ecx + Math.cos(oa) * 14;
          var oy = ecy + Math.sin(oa) * 10;
          ctx.fillStyle = sc; ctx.shadowColor = sc; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        // Rising particles
        ctx.fillStyle = sc; ctx.globalAlpha = 0.5;
        for (var ri = 0; ri < 3; ri++) {
          var rpy = ecy - ((time * 0.03 + ri * 30) % 30);
          var rpx = ecx + Math.sin(time * 0.005 + ri) * 6;
          ctx.beginPath(); ctx.arc(rpx, rpy, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // HP Bar (regular enemies)
      if (!this.isBoss) {
        var barW = this.width + 4, barH = 5;
        var barX = ecx - barW / 2, barY = this.y - 12;
        var ratio = this.hpMax > 0 ? this.hp / this.hpMax : 0;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this._roundRect(ctx, barX, barY, barW, barH, 2);
        var hpColor = ratio > 0.5 ? '#44cc44' : ratio > 0.2 ? '#ccaa22' : '#cc2222';
        ctx.fillStyle = hpColor;
        if (ratio > 0) this._roundRect(ctx, barX + 1, barY + 1, (barW - 2) * ratio, barH - 2, 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barX + 2, barY); ctx.lineTo(barX + barW - 2, barY);
        ctx.quadraticCurveTo(barX + barW, barY, barX + barW, barY + 2);
        ctx.lineTo(barX + barW, barY + barH - 2);
        ctx.quadraticCurveTo(barX + barW, barY + barH, barX + barW - 2, barY + barH);
        ctx.lineTo(barX + 2, barY + barH);
        ctx.quadraticCurveTo(barX, barY + barH, barX, barY + barH - 2);
        ctx.lineTo(barX, barY + 2);
        ctx.quadraticCurveTo(barX, barY, barX + 2, barY);
        ctx.closePath(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    if (w < 1 || h < 1) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
  }

  _renderDeathEffect(ctx) {
    var progress = this.deathTimer / this.deathDuration;
    var cx = this.x + this.width / 2;
    var cy = this.y + this.height / 2;
    ctx.save();

    if (this.isBoss) {
      // Boss: explosion rings + golden particles
      var ringCount = 3;
      for (var ri = 0; ri < ringCount; ri++) {
        var rp = Math.max(0, progress - ri * 0.15) / (1 - ri * 0.15);
        if (rp <= 0 || rp > 1) continue;
        var radius = 20 + 60 * rp;
        ctx.strokeStyle = ri === 0 ? '#ffd700' : '#ff6600';
        ctx.lineWidth = (1 - rp) * 4;
        ctx.globalAlpha = (1 - rp) * 0.8;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      }
      // Golden particles
      ctx.globalAlpha = 1 - progress;
      for (var gi = 0; gi < 16; gi++) {
        var ga = Math.PI * 2 / 16 * gi + gi * 0.5;
        var gd = (30 + gi * 3) * progress;
        var gx = cx + Math.cos(ga) * gd;
        var gy = cy + Math.sin(ga) * gd - progress * 20;
        ctx.fillStyle = gi % 2 === 0 ? '#ffd700' : '#ffaa44';
        ctx.beginPath(); ctx.arc(gx, gy, 3 * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
      // Central flash
      if (progress < 0.3) {
        ctx.globalAlpha = (1 - progress / 0.3) * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(cx, cy, 30 * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // Regular: spiral pixel shards
      var count = 12;
      ctx.globalAlpha = 1 - progress;
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 / count) * i + progress * 2;
        var dist = (20 + i * 2) * progress;
        var px = cx + Math.cos(angle) * dist;
        var py = cy + Math.sin(angle) * dist - progress * 10;
        var size = (this.isBoss ? 6 : 4) * (1 - progress);
        ctx.save();
        ctx.translate(px, py); ctx.rotate(angle + progress * 3);
        ctx.fillStyle = i % 2 === 0 ? this.spriteColor : '#ffffff';
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
      // Afterimage
      if (progress < 0.4) {
        ctx.globalAlpha = (1 - progress / 0.4) * 0.3;
        ctx.fillStyle = this.spriteColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 * (1 - progress), this.height / 2.5 * (1 - progress), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
