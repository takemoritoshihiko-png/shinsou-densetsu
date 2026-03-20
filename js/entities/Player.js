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

    // 自動攻撃タイマー
    this.attackTimer += sec;
    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      this._tryAutoAttack();
    }
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
    var cx = this.x + this.width / 2;
    var cy = this.y + this.height / 2;
    var time = Date.now();
    var isMoving = Math.abs(this.vx) > 5 || Math.abs(this.vy) > 5;
    var bobY = isMoving ? Math.sin(time * 0.012) * 2 : 0;
    var justAttacked = this.attackTimer < 0.08 && this.attackTimer > 0;

    // 向き角度
    var dirAngle = 0;
    if (this.facing === 'up') dirAngle = -Math.PI / 2;
    else if (this.facing === 'down') dirAngle = Math.PI / 2;
    else if (this.facing === 'left') dirAngle = Math.PI;

    ctx.save();

    // === 影 ===
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // === ブーツ（茶色の革ブーツ） ===
    var bootY = cy + 10 + bobY;
    var legAnim = isMoving ? Math.sin(time * 0.015) * 3 : 0;
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(cx - 8, bootY + legAnim, 6, 8);
    ctx.fillRect(cx + 2, bootY - legAnim, 6, 8);
    // ブーツの折り返し
    ctx.fillStyle = '#A07818';
    ctx.fillRect(cx - 8, bootY + legAnim, 6, 3);
    ctx.fillRect(cx + 2, bootY - legAnim, 6, 3);

    // === タイツ（ベージュのズボン） ===
    var legY = cy + 4 + bobY;
    ctx.fillStyle = '#D2C4A0';
    ctx.fillRect(cx - 7, legY + legAnim, 5, 8);
    ctx.fillRect(cx + 2, legY - legAnim, 5, 8);

    // === 緑のチュニック（胴体） ===
    var bodyY = cy - 8 + bobY;
    ctx.fillStyle = '#3D7A2A';
    ctx.beginPath();
    ctx.moveTo(cx - 12, bodyY);
    ctx.lineTo(cx + 12, bodyY);
    ctx.lineTo(cx + 10, cy + 8 + bobY);
    ctx.lineTo(cx - 10, cy + 8 + bobY);
    ctx.closePath();
    ctx.fill();
    // チュニック裾（少し広がる）
    ctx.fillStyle = '#357024';
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 2 + bobY);
    ctx.lineTo(cx + 11, cy + 2 + bobY);
    ctx.lineTo(cx + 14, cy + 10 + bobY);
    ctx.lineTo(cx - 14, cy + 10 + bobY);
    ctx.closePath();
    ctx.fill();
    // チュニックの装飾ライン（裾の模様）
    ctx.strokeStyle = '#A8D48A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 8 + bobY);
    ctx.lineTo(cx + 10, cy + 8 + bobY);
    ctx.stroke();
    // Vネック
    ctx.strokeStyle = '#2D5A1E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, bodyY);
    ctx.lineTo(cx, bodyY + 6);
    ctx.lineTo(cx + 4, bodyY);
    ctx.stroke();

    // === ベルト（茶革ベルト＋バックル） ===
    ctx.fillStyle = '#6B4C1E';
    ctx.fillRect(cx - 11, cy + bobY, 22, 4);
    // バックル（青い宝石風）
    ctx.fillStyle = '#3388BB';
    ctx.beginPath();
    ctx.arc(cx, cy + 2 + bobY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#AA8833';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === クロスベルト（X字のストラップ） ===
    ctx.strokeStyle = '#7B5B2E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, bodyY + 2);
    ctx.lineTo(cx + 6, cy + bobY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 10, bodyY + 2);
    ctx.lineTo(cx - 6, cy + bobY);
    ctx.stroke();

    // === 腕（肌色＋腕当て） ===
    ctx.fillStyle = '#F0C8A0';
    ctx.fillRect(cx - 14, bodyY + 4 + bobY, 4, 10);
    ctx.fillRect(cx + 10, bodyY + 4 + bobY, 4, 10);
    // 腕当て（革のアームガード）
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(cx - 14, bodyY + 6 + bobY, 4, 5);
    ctx.fillRect(cx + 10, bodyY + 6 + bobY, 4, 5);

    // === 盾（左手側 - 紋章付き） ===
    if (this.facing !== 'up') {
      var shX = cx - 18, shY = bodyY + 2 + bobY;
      // 盾本体（青紫色）
      ctx.fillStyle = '#2244AA';
      ctx.beginPath();
      ctx.moveTo(shX + 5, shY);
      ctx.lineTo(shX + 13, shY + 1);
      ctx.lineTo(shX + 14, shY + 10);
      ctx.lineTo(shX + 9, shY + 16);
      ctx.lineTo(shX + 4, shY + 10);
      ctx.lineTo(shX + 3, shY + 1);
      ctx.closePath();
      ctx.fill();
      // 盾の縁（銀色）
      ctx.strokeStyle = '#AABBCC';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 紋章（三角の翼模様）
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(shX + 9, shY + 4);
      ctx.lineTo(shX + 6, shY + 10);
      ctx.lineTo(shX + 12, shY + 10);
      ctx.closePath();
      ctx.fill();
      // 紋章の鳥（簡易）
      ctx.strokeStyle = '#CC3333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shX + 7, shY + 8);
      ctx.lineTo(shX + 9, shY + 6);
      ctx.lineTo(shX + 11, shY + 8);
      ctx.stroke();
    }

    // === 頭 ===
    var headY = cy - 16 + bobY;
    // 顔（肌色）
    ctx.fillStyle = '#F0C8A0';
    ctx.beginPath();
    ctx.arc(cx, headY, 9, 0, Math.PI * 2);
    ctx.fill();

    // === 金髪 ===
    ctx.fillStyle = '#D4A840';
    // ベース
    ctx.beginPath();
    ctx.arc(cx, headY - 2, 10, Math.PI * 1.05, Math.PI * 1.95, true);
    ctx.fill();
    // 前髪（左右に分かれる）
    ctx.beginPath();
    ctx.moveTo(cx - 9, headY - 4);
    ctx.lineTo(cx - 12, headY + 2);
    ctx.lineTo(cx - 6, headY - 1);
    ctx.lineTo(cx - 3, headY - 6);
    ctx.lineTo(cx + 1, headY - 8);
    ctx.lineTo(cx + 5, headY - 6);
    ctx.lineTo(cx + 8, headY - 1);
    ctx.lineTo(cx + 12, headY + 2);
    ctx.lineTo(cx + 9, headY - 4);
    ctx.closePath();
    ctx.fill();
    // サイドヘア（耳の横に垂れる）
    ctx.fillStyle = '#C49830';
    ctx.beginPath();
    ctx.moveTo(cx - 9, headY);
    ctx.quadraticCurveTo(cx - 13, headY + 6, cx - 10, headY + 12);
    ctx.lineTo(cx - 8, headY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 9, headY);
    ctx.quadraticCurveTo(cx + 13, headY + 6, cx + 10, headY + 12);
    ctx.lineTo(cx + 8, headY + 2);
    ctx.closePath();
    ctx.fill();

    // === 尖った耳 ===
    ctx.fillStyle = '#F0C8A0';
    ctx.beginPath();
    ctx.moveTo(cx - 9, headY - 1);
    ctx.lineTo(cx - 15, headY - 3);
    ctx.lineTo(cx - 9, headY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 9, headY - 1);
    ctx.lineTo(cx + 15, headY - 3);
    ctx.lineTo(cx + 9, headY + 2);
    ctx.closePath();
    ctx.fill();

    // === フード（緑、首の後ろに垂れている） ===
    ctx.fillStyle = '#3D7A2A';
    ctx.beginPath();
    ctx.arc(cx, headY - 1, 10.5, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.lineTo(cx + 6, bodyY + 3 + bobY);
    ctx.lineTo(cx - 6, bodyY + 3 + bobY);
    ctx.closePath();
    ctx.fill();
    // フードの折り返し
    ctx.fillStyle = '#4A8E35';
    ctx.beginPath();
    ctx.arc(cx, headY - 1, 10.5, Math.PI * 0.9, Math.PI * 0.1, true);
    ctx.closePath();
    ctx.fill();

    // === 目（青い目） ===
    var eyeOff = { x: 0, y: 0 };
    if (this.facing === 'left') eyeOff.x = -2;
    else if (this.facing === 'right') eyeOff.x = 2;
    else if (this.facing === 'up') eyeOff.y = -2;
    else eyeOff.y = 1;

    if (this.facing !== 'up') {
      // 白目
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 3.5 + eyeOff.x, headY + eyeOff.y, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3.5 + eyeOff.x, headY + eyeOff.y, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // 虹彩（青）
      ctx.fillStyle = '#4488CC';
      ctx.beginPath();
      ctx.arc(cx - 3 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 4 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // 瞳孔
      ctx.fillStyle = '#112244';
      ctx.beginPath();
      ctx.arc(cx - 3 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 4 + eyeOff.x, headY + 0.5 + eyeOff.y * 0.5, 0.9, 0, Math.PI * 2);
      ctx.fill();
      // 光の反射
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 3.8 + eyeOff.x, headY - 0.8, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3.2 + eyeOff.x, headY - 0.8, 0.6, 0, Math.PI * 2);
      ctx.fill();
      // 眉（凛々しい）
      ctx.strokeStyle = '#8B7030';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, headY - 3.5);
      ctx.lineTo(cx - 1, headY - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 1, headY - 3);
      ctx.lineTo(cx + 5.5, headY - 3.5);
      ctx.stroke();
      // 口（真一文字の決意の表情）
      ctx.strokeStyle = '#BB8866';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 2, headY + 4);
      ctx.lineTo(cx + 2, headY + 4);
      ctx.stroke();
    }

    // === 剣（背中に斜めに差している） ===
    ctx.save();
    ctx.translate(cx, cy + bobY);
    ctx.rotate(dirAngle);
    // 鞘（紫の柄が見える）
    ctx.fillStyle = '#665588';
    ctx.fillRect(4, -22, 3, 14);
    // 剣身
    ctx.fillStyle = '#C0C8D8';
    ctx.fillRect(3, -28, 5, 8);
    // 剣先
    ctx.beginPath();
    ctx.moveTo(3, -28);
    ctx.lineTo(5.5, -34);
    ctx.lineTo(8, -28);
    ctx.closePath();
    ctx.fill();
    // ガード（翼型）
    ctx.fillStyle = '#665588';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5.5, -10);
    ctx.lineTo(11, -8);
    ctx.lineTo(5.5, -7);
    ctx.closePath();
    ctx.fill();
    // 剣のハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(5, -28, 1.5, 18);
    ctx.shadowBlur = 0;
    ctx.restore();

    // === 剣を振るエフェクト ===
    if (justAttacked) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(dirAngle);
      // 剣の軌跡（弧）
      var slashProgress = this.attackTimer / 0.08;
      var slashAngle = -Math.PI * 0.6 + slashProgress * Math.PI * 1.2;
      ctx.strokeStyle = 'rgba(255,255,220,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 30, slashAngle - 0.8, slashAngle + 0.3);
      ctx.stroke();
      // 剣身
      ctx.save();
      ctx.rotate(slashAngle);
      ctx.fillStyle = '#ddeeff';
      ctx.beginPath();
      ctx.moveTo(12, -2);
      ctx.lineTo(35, -1);
      ctx.lineTo(38, 0);
      ctx.lineTo(35, 1);
      ctx.lineTo(12, 2);
      ctx.closePath();
      ctx.fill();
      // 光の尾
      ctx.strokeStyle = 'rgba(255,255,200,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, slashAngle - 1.2, slashAngle - 0.2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    // === 移動時のほこり ===
    if (isMoving) {
      ctx.fillStyle = 'rgba(180,160,130,0.3)';
      for (var di = 0; di < 2; di++) {
        var dx2 = cx + Math.sin(time * 0.01 + di * 3) * 8;
        var dy2 = cy + 16 + Math.cos(time * 0.012 + di * 2) * 3;
        ctx.beginPath();
        ctx.arc(dx2, dy2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
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
