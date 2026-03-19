// プレイヤーキャラクター（トップダウン版）
class Player {
  constructor(inputManager, partySystem, equipSystem) {
    this.inputManager = inputManager;
    this.partySystem = partySystem;
    this.equipSystem = equipSystem;

    this.width = 28;
    this.height = 28;
    this.x = CONFIG.FIELD_W / 2 - 14;
    this.y = CONFIG.FIELD_H / 2 - 14;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down'; // up/down/left/right

    // 自動攻撃
    this.attackTimer = 0;
    this.attackInterval = 0.8;
    this.attackRange = CONFIG.ATTACK_RANGE;
    this._enemies = [];
    this._onAttackCallback = null;

    this.name = 'プレイヤー';
    this.level = 1;
    this.job = 'warrior';
    this.rarity = 'SR';

    this.classLevels = {};
    for (var i = 0; i < ClassData.JOB_KEYS.length; i++) {
      this.classLevels[ClassData.JOB_KEYS[i]] = 1;
    }

    this.totalExp = 0;
    this.expToNext = LevelSystem.expToNext(this.level);
    this.ownedGold = 0;

    this._applyStats();
    this.hp = this.hpMax;
    this.mp = this.mpMax;

    this.battleExp = 0;
    this.battleGold = 0;
    this._regenAccum = 0;
  }

  getClassLevel() { return this.classLevels[this.job] || 1; }

  _applyStats() {
    var equipBonus = this.equipSystem ? this.equipSystem.getTotalEquipBonus() : null;
    var stats = StatusSystem.calc(this.level, this.job, this.rarity, equipBonus);
    var passive;
    if (this.partySystem) {
      passive = this.partySystem.getCombinedPassiveBuffs();
    } else {
      passive = ClassData.getPassiveBuff(this.job);
    }
    if (passive.atk_percent) stats.atk = Math.floor(stats.atk * (1 + passive.atk_percent / 100));
    if (passive.matk_percent) stats.matk = Math.floor(stats.matk * (1 + passive.matk_percent / 100));
    if (passive.spd_percent) stats.spd = Math.floor(stats.spd * (1 + passive.spd_percent / 100));
    if (passive.crit_percent) stats.crit = Math.round((stats.crit + passive.crit_percent) * 10) / 10;
    this.hpMax = stats.hp;
    this.mpMax = stats.mp;
    this.atk = stats.atk;
    this.matk = stats.matk;
    this.def = stats.def;
    this.mdef = stats.mdef;
    this.spd = stats.spd;
    this.crit = stats.crit;
  }

  getDamageReduction() {
    var passive = this.partySystem ? this.partySystem.getCombinedPassiveBuffs() : ClassData.getPassiveBuff(this.job);
    return passive.damage_reduction || 0;
  }

  _getRegenPercent() {
    var passive = this.partySystem ? this.partySystem.getCombinedPassiveBuffs() : ClassData.getPassiveBuff(this.job);
    return passive.hp_regen_per_sec || 0;
  }

  reset() {
    this.x = CONFIG.FIELD_W / 2 - 14;
    this.y = CONFIG.FIELD_H / 2 - 14;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down';
    this._applyStats();
    this.hp = this.hpMax;
    this.mp = this.mpMax;
    this.battleExp = 0;
    this.battleGold = 0;
    this._regenAccum = 0;
    this.attackTimer = 0;
  }

  addReward(exp, gold) { this.battleExp += exp; this.battleGold += gold; }
  applyBattleRewards() { this.ownedGold += this.battleGold; }
  get exp() { return this.battleExp; }
  get gold() { return this.battleGold; }

  update(dt) {
    var sec = dt / 1000;

    // HP regen
    var regenPct = this._getRegenPercent();
    if (regenPct > 0 && this.hp > 0 && this.hp < this.hpMax) {
      this._regenAccum += dt;
      if (this._regenAccum >= 1000) {
        this._regenAccum -= 1000;
        this.hp = Math.min(this.hpMax, this.hp + Math.floor(this.hpMax * regenPct / 100));
      }
    }

    // 4方向移動
    this.vx = 0;
    this.vy = 0;
    if (this.inputManager.isKeyDown('left'))  { this.vx = -CONFIG.PLAYER_SPEED; this.facing = 'left'; }
    if (this.inputManager.isKeyDown('right')) { this.vx = CONFIG.PLAYER_SPEED;  this.facing = 'right'; }
    if (this.inputManager.isKeyDown('up'))    { this.vy = -CONFIG.PLAYER_SPEED; this.facing = 'up'; }
    if (this.inputManager.isKeyDown('down'))  { this.vy = CONFIG.PLAYER_SPEED;  this.facing = 'down'; }

    // 斜め移動の正規化
    if (this.vx !== 0 && this.vy !== 0) {
      var norm = 0.7071;
      this.vx *= norm;
      this.vy *= norm;
    }

    this.x += this.vx * sec;
    this.y += this.vy * sec;

    // フィールド境界
    var margin = 20;
    if (this.x < margin) this.x = margin;
    if (this.y < margin) this.y = margin;
    if (this.x > CONFIG.FIELD_W - this.width - margin) this.x = CONFIG.FIELD_W - this.width - margin;
    if (this.y > CONFIG.FIELD_H - this.height - margin) this.y = CONFIG.FIELD_H - this.height - margin;
  }

  _tryAutoAttack() {
    if (this.hp <= 0) return;
    var pcx = this.x + this.width / 2;
    var pcy = this.y + this.height / 2;
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < this._enemies.length; i++) {
      var e = this._enemies[i];
      if (!e.alive) continue;
      var dx = (e.x + e.width / 2) - pcx;
      var dy = (e.y + e.height / 2) - pcy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; nearest = e; }
    }
    if (nearest && nearestDist <= this.attackRange) {
      var result = CombatSystem.calcPhysical(this, nearest);
      var killed = nearest.takeDamage(result.damage);
      var ecx = nearest.x + nearest.width / 2;
      var ecy = nearest.y + nearest.height / 2;
      if (this._onAttackCallback) {
        this._onAttackCallback(ecx, ecy - 16, result.damage, result.critical, nearest, killed);
      }
    }
  }

  render(ctx) {
    var jobData = ClassData.get(this.job);
    var jc = jobData ? jobData.color : '#4488ff';
    var cx = this.x + this.width / 2;
    var cy = this.y + this.height / 2;
    var time = Date.now();
    var isMoving = Math.abs(this.vx) > 5 || Math.abs(this.vy) > 5;
    var bobY = isMoving ? Math.sin(time * 0.012) * 2 : 0;
    var weaponColor = '#888888';
    var armorColor = jc;
    var weaponRank = 'common';
    if (this.equipSystem) {
      var wep = this.equipSystem.getEquippedItem('weapon');
      if (wep) { weaponColor = EquipmentData.RANK_COLORS[wep.rank] || '#888'; weaponRank = wep.rank; }
      var bod = this.equipSystem.getEquippedItem('body');
      if (bod) armorColor = EquipmentData.RANK_COLORS[bod.rank] || jc;
    }
    var justAttacked = this.attackTimer < 0.08 && this.attackTimer > 0;

    ctx.save();

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 向き
    var dirAngle = 0;
    if (this.facing === 'up') dirAngle = -Math.PI / 2;
    else if (this.facing === 'down') dirAngle = Math.PI / 2;
    else if (this.facing === 'left') dirAngle = Math.PI;
    else dirAngle = 0;

    // 体 (丸い)
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.arc(cx, cy + bobY, 12, 0, Math.PI * 2);
    ctx.fill();
    // 体ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3 + bobY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 頭 (大きめ)
    var headY = cy - 10 + bobY;
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.arc(cx, headY, 10, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = jc;
    ctx.beginPath();
    ctx.arc(cx, headY - 2, 11, Math.PI * 1.1, Math.PI * 1.9, true);
    ctx.fill();
    // 髪スパイク
    ctx.beginPath();
    ctx.moveTo(cx - 8, headY - 6);
    ctx.lineTo(cx - 10, headY - 16);
    ctx.lineTo(cx - 2, headY - 8);
    ctx.lineTo(cx + 3, headY - 18);
    ctx.lineTo(cx + 6, headY - 8);
    ctx.lineTo(cx + 10, headY - 14);
    ctx.lineTo(cx + 10, headY - 4);
    ctx.closePath();
    ctx.fill();

    // 目 (向きで位置変化)
    var eyeOff = { x: 0, y: 0 };
    if (this.facing === 'left') eyeOff.x = -3;
    else if (this.facing === 'right') eyeOff.x = 3;
    else if (this.facing === 'up') eyeOff.y = -2;
    else eyeOff.y = 2;

    if (this.facing !== 'up') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(cx - 4 + eyeOff.x, headY + eyeOff.y, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 4 + eyeOff.x, headY + eyeOff.y, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = jc;
      ctx.beginPath(); ctx.arc(cx - 3.5 + eyeOff.x * 0.5, headY + 0.5 + eyeOff.y * 0.5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 4.5 + eyeOff.x * 0.5, headY + 0.5 + eyeOff.y * 0.5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(cx - 3.5 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 4.5 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 1, 0, Math.PI * 2); ctx.fill();
      // 光
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx - 4.5 + eyeOff.x, headY - 1 + eyeOff.y * 0.3, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 3.5 + eyeOff.x, headY - 1 + eyeOff.y * 0.3, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // 武器 (向きに合わせて描画)
    ctx.save();
    ctx.translate(cx, cy + bobY);
    ctx.rotate(dirAngle);
    // 剣
    if (weaponRank === 'epic' || weaponRank === 'legend') {
      ctx.shadowColor = weaponRank === 'legend' ? '#ffd700' : '#bb44ff';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = weaponColor;
    ctx.fillRect(12, -2, 16, 4);
    // 剣先
    ctx.beginPath();
    ctx.moveTo(28, -3);
    ctx.lineTo(34, 0);
    ctx.lineTo(28, 3);
    ctx.closePath();
    ctx.fill();
    // ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(14, -1, 12, 1);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 攻撃フラッシュ
    if (justAttacked) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _roundRect2(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
  }
}
