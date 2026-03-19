// 敵キャラクター（トップダウン版）
class Enemy {
  constructor(stats) {
    this.isBoss = !!stats.isBoss;
    this.bossName = stats.bossName || '';
    this.spriteColor = stats.spriteColor || (this.isBoss ? '#8b0000' : '#dd3333');
    this.monsterName = stats.monsterName || '';

    this.width = stats.width || (this.isBoss ? 40 : 26);
    this.height = stats.height || (this.isBoss ? 40 : 26);

    // フィールド上のランダム位置にスポーン (端から)
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { this.x = Math.random() * CONFIG.FIELD_W; this.y = -30; }
    else if (edge === 1) { this.x = CONFIG.FIELD_W + 30; this.y = Math.random() * CONFIG.FIELD_H; }
    else if (edge === 2) { this.x = Math.random() * CONFIG.FIELD_W; this.y = CONFIG.FIELD_H + 30; }
    else { this.x = -30; this.y = Math.random() * CONFIG.FIELD_H; }

    this.speed = stats.speed || (this.isBoss ? 40 : 60);

    var s = StatusSystem.fromRaw(stats);
    this.hp = s.hp; this.hpMax = s.hp;
    this.atk = s.atk; this.matk = s.matk;
    this.def = s.def; this.mdef = s.mdef;
    this.spd = s.spd; this.crit = s.crit;

    this.rewardExp = stats.exp || 0;
    this.rewardGold = stats.gold || 0;

    this.attackRange = this.isBoss ? 50 : 35;
    this.attackInterval = stats.attackInterval || 1.5;
    this.attackTimer = 0;

    this.alive = true;
    this.deathEffect = false;
    this.deathTimer = 0;
    this.deathDuration = this.isBoss ? 600 : 300;

    // 移動AI
    this._wanderTimer = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get exp() { return this.rewardExp; }
  get gold() { return this.rewardGold; }

  update(dt, player) {
    if (!this.alive) {
      if (this.deathEffect) {
        this.deathTimer += dt;
        if (this.deathTimer >= this.deathDuration) this.deathEffect = false;
      }
      return;
    }

    var sec = dt / 1000;
    var ecx = this.x + this.width / 2;
    var ecy = this.y + this.height / 2;
    var pcx = player.x + player.width / 2;
    var pcy = player.y + player.height / 2;
    var dx = pcx - ecx;
    var dy = pcy - ecy;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.attackRange) {
      // プレイヤーに向かって移動
      var nx = dx / dist;
      var ny = dy / dist;
      this.x += nx * this.speed * sec;
      this.y += ny * this.speed * sec;
    } else {
      // 攻撃
      this.attackTimer += sec;
      if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this._attack(player, this._onDamageCallback);
      }
    }

    // フィールド内に制限
    if (this.x < -10) this.x = -10;
    if (this.y < -10) this.y = -10;
    if (this.x > CONFIG.FIELD_W + 10) this.x = CONFIG.FIELD_W + 10;
    if (this.y > CONFIG.FIELD_H + 10) this.y = CONFIG.FIELD_H + 10;
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

  isFinished() { return !this.alive && !this.deathEffect; }

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
    var ecy = this.y + this.height / 2;
    var sc = this.spriteColor;
    var time = Date.now();
    var r = this.width / 2;

    ctx.save();

    if (this.isBoss) {
      // === ボス (トップダウン) ===
      // オーラ
      ctx.globalAlpha = 0.15 + Math.sin(time * 0.003) * 0.05;
      ctx.fillStyle = sc;
      ctx.beginPath(); ctx.arc(ecx, ecy, r + 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(ecx, ecy + r + 4, r, 6, 0, 0, Math.PI * 2); ctx.fill();
      // 体
      ctx.fillStyle = sc;
      ctx.beginPath(); ctx.arc(ecx, ecy, r, 0, Math.PI * 2); ctx.fill();
      // 模様
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
      for (var si = 0; si < 3; si++) {
        ctx.beginPath(); ctx.arc(ecx, ecy, r - 4 - si * 5, 0, Math.PI * 2); ctx.stroke();
      }
      // 角
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.moveTo(ecx - 10, ecy - r + 2); ctx.lineTo(ecx - 14, ecy - r - 16); ctx.lineTo(ecx - 6, ecy - r + 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ecx + 10, ecy - r + 2); ctx.lineTo(ecx + 14, ecy - r - 16); ctx.lineTo(ecx + 6, ecy - r + 4); ctx.fill();
      // 角先端の光
      ctx.fillStyle = '#ff4400'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(ecx - 14, ecy - r - 16, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx + 14, ecy - r - 16, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // 目
      ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(ecx - 8, ecy - 4, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ecx + 8, ecy - 4, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.fillRect(ecx - 9, ecy - 6, 2, 4);
      ctx.fillRect(ecx + 7, ecy - 6, 2, 4);
    } else {
      // === 雑魚 (トップダウン) ===
      var type = this._getBodyType();
      var bob = Math.sin(time * 0.005) * 2;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(ecx, ecy + r + 2, r * 0.8, 4, 0, 0, Math.PI * 2); ctx.fill();

      if (type === 'slime') {
        var squish = Math.sin(time * 0.006) * 2;
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, ecy + bob, r + squish, r - squish * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.ellipse(ecx - 3, ecy - 4 + bob, r * 0.4, r * 0.3, -0.3, 0, Math.PI * 2); ctx.fill();
        // 目
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ecx - 4, ecy - 2 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 4, ecy - 2 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(ecx - 3, ecy - 1 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 5, ecy - 1 + bob, 1.5, 0, Math.PI * 2); ctx.fill();

      } else if (type === 'beast') {
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, ecy + bob, r + 2, r - 2, 0, 0, Math.PI * 2); ctx.fill();
        // 耳
        ctx.beginPath(); ctx.moveTo(ecx - 8, ecy - r + 2); ctx.lineTo(ecx - 12, ecy - r - 8); ctx.lineTo(ecx - 4, ecy - r + 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ecx + 8, ecy - r + 2); ctx.lineTo(ecx + 12, ecy - r - 8); ctx.lineTo(ecx + 4, ecy - r + 4); ctx.fill();
        // 目
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(ecx - 5, ecy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 5, ecy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.fillRect(ecx - 5.5, ecy - 3.5, 1, 3);
        ctx.fillRect(ecx + 4.5, ecy - 3.5, 1, 3);

      } else if (type === 'humanoid') {
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.arc(ecx, ecy + bob, r, 0, Math.PI * 2); ctx.fill();
        // フード
        ctx.beginPath(); ctx.arc(ecx, ecy - 2 + bob, r + 1, Math.PI * 1.15, Math.PI * 1.85, true); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ecx - 6, ecy - r + bob); ctx.lineTo(ecx, ecy - r - 10 + bob); ctx.lineTo(ecx + 6, ecy - r + bob); ctx.fill();
        // 光る目
        ctx.fillStyle = '#44ffff'; ctx.shadowColor = '#44ffff'; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.arc(ecx - 4, ecy - 2 + bob, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 4, ecy - 2 + bob, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

      } else if (type === 'flying') {
        var flyOff = Math.sin(time * 0.008) * 4;
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.ellipse(ecx, ecy + flyOff, r - 2, r - 4, 0, 0, Math.PI * 2); ctx.fill();
        // 翼
        var wingA = Math.sin(time * 0.012) * 0.3;
        ctx.save(); ctx.translate(ecx, ecy + flyOff); ctx.rotate(-wingA);
        ctx.fillStyle = sc + 'aa';
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-20, -10, -18, 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(ecx, ecy + flyOff); ctx.rotate(wingA);
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(20, -10, 18, 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ecx - 3, ecy - 2 + flyOff, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 3, ecy - 2 + flyOff, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(ecx - 2.5, ecy - 1.5 + flyOff, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx + 3.5, ecy - 1.5 + flyOff, 1, 0, Math.PI * 2); ctx.fill();

      } else {
        // elemental
        ctx.fillStyle = sc; ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.arc(ecx, ecy, r + 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        var grad = ctx.createRadialGradient(ecx, ecy, 0, ecx, ecy, r);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, sc); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(ecx, ecy, r, 0, Math.PI * 2); ctx.fill();
        // 周回スパーク
        for (var oi = 0; oi < 3; oi++) {
          var oa = time * 0.004 + oi * 2.1;
          ctx.fillStyle = sc; ctx.shadowColor = sc; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.arc(ecx + Math.cos(oa) * r, ecy + Math.sin(oa) * (r * 0.7), 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // HPバー
      var barW = this.width + 6, barH = 4;
      var barX = ecx - barW / 2, barY = this.y - 8;
      var ratio = this.hpMax > 0 ? this.hp / this.hpMax : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = ratio > 0.5 ? '#44cc44' : ratio > 0.2 ? '#ccaa22' : '#cc2222';
      ctx.fillRect(barX, barY, barW * ratio, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }

  _renderDeathEffect(ctx) {
    var progress = this.deathTimer / this.deathDuration;
    var cx = this.x + this.width / 2;
    var cy = this.y + this.height / 2;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    if (this.isBoss) {
      for (var ri = 0; ri < 3; ri++) {
        var rp = Math.max(0, progress - ri * 0.15);
        var radius = 15 + 40 * rp;
        ctx.strokeStyle = ri === 0 ? '#ffd700' : '#ff6600';
        ctx.lineWidth = (1 - rp) * 3;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      }
      for (var gi = 0; gi < 12; gi++) {
        var ga = Math.PI * 2 / 12 * gi;
        var gd = 25 * progress;
        ctx.fillStyle = gi % 2 === 0 ? '#ffd700' : '#ffaa44';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ga) * gd, cy + Math.sin(ga) * gd, 2 * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
    } else {
      var count = 10;
      for (var i = 0; i < count; i++) {
        var angle = Math.PI * 2 / count * i + progress * 2;
        var dist = 16 * progress;
        var px = cx + Math.cos(angle) * dist;
        var py = cy + Math.sin(angle) * dist;
        ctx.fillStyle = i % 2 === 0 ? this.spriteColor : '#ffffff';
        ctx.beginPath(); ctx.arc(px, py, 2.5 * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}
