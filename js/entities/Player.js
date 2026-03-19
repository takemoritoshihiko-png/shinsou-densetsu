// プレイヤーキャラクター
class Player {
  constructor(inputManager, partySystem, equipSystem) {
    this.inputManager = inputManager;
    this.partySystem = partySystem;
    this.equipSystem = equipSystem;

    // サイズ
    this.width = 40;
    this.height = 60;

    // 位置
    this.x = 100;
    this.y = CONFIG.BATTLE_GROUND_Y - this.height;

    // 速度
    this.vx = 0;
    this.vy = 0;

    // 接地判定
    this.grounded = true;

    // 自動攻撃
    this.attackTimer = 0;
    this.attackInterval = 0.8; // 秒
    this.attackRange = 80;     // px
    this._enemies = [];        // BattleSceneから毎フレーム渡される
    this._onAttackCallback = null; // ダメージ数字表示用コールバック

    // キャラクター情報
    this.name = 'プレイヤー';
    this.level = 1;
    this.job = 'warrior';
    this.rarity = 'SR';

    // 職業レベル（各職業ごとに独立）
    this.classLevels = {};
    for (var i = 0; i < ClassData.JOB_KEYS.length; i++) {
      this.classLevels[ClassData.JOB_KEYS[i]] = 1;
    }

    // EXP管理
    this.totalExp = 0;
    this.expToNext = LevelSystem.expToNext(this.level);

    // 所持ゴールド（永続）
    this.ownedGold = 0;

    // ステータス
    this._applyStats();

    // 現在HP/MP
    this.hp = this.hpMax;
    this.mp = this.mpMax;

    // 報酬累計（バトル内）
    this.battleExp = 0;
    this.battleGold = 0;

    // HP自動回復の蓄積
    this._regenAccum = 0;
    this.attackTimer = 0;
  }

  getClassLevel() {
    return this.classLevels[this.job] || 1;
  }

  // パーティ全体のパッシブバフを統合してステータス計算
  _applyStats() {
    var equipBonus = this.equipSystem ? this.equipSystem.getTotalEquipBonus() : null;
    var stats = StatusSystem.calc(this.level, this.job, this.rarity, equipBonus);

    // パーティの統合パッシブ（partySystemがあれば使用）
    var passive;
    if (this.partySystem) {
      passive = this.partySystem.getCombinedPassiveBuffs();
    } else {
      passive = ClassData.getPassiveBuff(this.job);
    }

    if (passive.atk_percent) {
      stats.atk = Math.floor(stats.atk * (1 + passive.atk_percent / 100));
    }
    if (passive.matk_percent) {
      stats.matk = Math.floor(stats.matk * (1 + passive.matk_percent / 100));
    }
    if (passive.spd_percent) {
      stats.spd = Math.floor(stats.spd * (1 + passive.spd_percent / 100));
    }
    if (passive.crit_percent) {
      stats.crit = Math.round((stats.crit + passive.crit_percent) * 10) / 10;
    }

    this.hpMax = stats.hp;
    this.mpMax = stats.mp;
    this.atk   = stats.atk;
    this.matk  = stats.matk;
    this.def   = stats.def;
    this.mdef  = stats.mdef;
    this.spd   = stats.spd;
    this.crit  = stats.crit;
  }

  getDamageReduction() {
    var passive;
    if (this.partySystem) {
      passive = this.partySystem.getCombinedPassiveBuffs();
    } else {
      passive = ClassData.getPassiveBuff(this.job);
    }
    return passive.damage_reduction || 0;
  }

  _getRegenPercent() {
    var passive;
    if (this.partySystem) {
      passive = this.partySystem.getCombinedPassiveBuffs();
    } else {
      passive = ClassData.getPassiveBuff(this.job);
    }
    return passive.hp_regen_per_sec || 0;
  }

  reset() {
    this.x = 100;
    this.y = CONFIG.BATTLE_GROUND_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this._applyStats();
    this.hp = this.hpMax;
    this.mp = this.mpMax;
    this.battleExp = 0;
    this.battleGold = 0;
    this._regenAccum = 0;
  }

  addReward(exp, gold) {
    this.battleExp += exp;
    this.battleGold += gold;
  }

  applyBattleRewards() {
    this.ownedGold += this.battleGold;
  }

  get exp() { return this.battleExp; }
  get gold() { return this.battleGold; }

  update(dt) {
    var sec = dt / 1000;

    // 毎秒HP回復（パーティ統合パッシブ）
    var regenPct = this._getRegenPercent();
    if (regenPct > 0 && this.hp > 0 && this.hp < this.hpMax) {
      this._regenAccum += dt;
      if (this._regenAccum >= 1000) {
        this._regenAccum -= 1000;
        var heal = Math.floor(this.hpMax * regenPct / 100);
        this.hp = Math.min(this.hpMax, this.hp + heal);
      }
    }

//     // 自動攻撃処理
//     this.attackTimer += sec;
//     if (this.attackTimer >= this.attackInterval) {
//       this._tryAutoAttack();
//       this.attackTimer = 0;
//     }

    // 左右移動
    this.vx = 0;
    if (this.inputManager.isKeyDown('left'))  this.vx = -CONFIG.PLAYER_SPEED;
    if (this.inputManager.isKeyDown('right')) this.vx = CONFIG.PLAYER_SPEED;

    // ジャンプ
    if (this.grounded && this.inputManager.isKeyPressed('jump')) {
      this.vy = CONFIG.PLAYER_JUMP_FORCE;
      this.grounded = false;
    }

    // 重力
    if (!this.grounded) {
      this.vy += CONFIG.GRAVITY * sec;
    }

    // 位置更新
    this.x += this.vx * sec;
    this.y += this.vy * sec;

    // 地面判定
    var groundY = CONFIG.BATTLE_GROUND_Y - this.height;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.grounded = true;
    }

    // 画面端の制限
    if (this.x < 0) this.x = 0;
    if (this.x > CONFIG.CANVAS_WIDTH - this.width) {
      this.x = CONFIG.CANVAS_WIDTH - this.width;
    }
  }

  _tryAutoAttack() {
    if (this.hp <= 0) return;
    var pcx = this.x + this.width / 2;
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < this._enemies.length; i++) {
      var enemy = this._enemies[i];
      if (!enemy.alive) continue;
      var ecx = enemy.x + enemy.width / 2;
      var dist = Math.abs(pcx - ecx);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    if (nearest && nearestDist <= this.attackRange) {
      var result = CombatSystem.calcPhysical(this, nearest);
      var killed = nearest.takeDamage(result.damage);
      var ecx2 = nearest.x + nearest.width / 2;
      if (this._onAttackCallback) {
        this._onAttackCallback(ecx2, nearest.y - 10, result.damage, result.critical, nearest, killed);
      }
    }
  }


  render(ctx) {
    var jobData = ClassData.get(this.job);
    var jc = jobData ? jobData.color : '#4488ff';
    var cx = this.x + this.width / 2;
    var by = this.y + this.height;
    var faceDir = this.vx >= 0 ? 1 : -1;
    var time = Date.now();
    var isRunning = Math.abs(this.vx) > 10;
    var isJumping = !this.grounded;
    var bobY = isRunning ? Math.sin(time * 0.012) * 3 : Math.sin(time * 0.003) * 1;
    var legPhase = isRunning ? Math.sin(time * 0.015) : 0;
    var breathe = Math.sin(time * 0.003) * 0.5;
    var weaponColor = '#888888', armorColor = jc, shieldColor = null, headColor = null, feetColor = '#6b5b3a';
    var weaponRank = 'common';
    if (this.equipSystem) {
      var wep = this.equipSystem.getEquippedItem('weapon');
      if (wep) { weaponColor = EquipmentData.RANK_COLORS[wep.rank] || '#888'; weaponRank = wep.rank; }
      var bod = this.equipSystem.getEquippedItem('body');
      if (bod) armorColor = EquipmentData.RANK_COLORS[bod.rank] || jc;
      var sh = this.equipSystem.getEquippedItem('shield');
      if (sh) shieldColor = EquipmentData.RANK_COLORS[sh.rank] || '#888';
      var hd = this.equipSystem.getEquippedItem('head');
      if (hd) headColor = EquipmentData.RANK_COLORS[hd.rank] || '#666';
      var ft = this.equipSystem.getEquippedItem('feet');
      if (ft) feetColor = EquipmentData.RANK_COLORS[ft.rank] || '#6b5b3a';
    }
    ctx.save();
    // Shadow
    var shadowScale = isJumping ? 0.5 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, CONFIG.BATTLE_GROUND_Y + 3, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    var justAttacked = this.attackTimer < 0.08 && this.attackTimer > 0;
    if (isRunning) { ctx.translate(cx, by); ctx.rotate(faceDir * 0.05); ctx.translate(-cx, -by); }
    // Legs
    var legW = 7, legH = 16, leftLegX = cx - 9, rightLegX = cx + 2, legY = by - legH;
    var lKick = isJumping ? -6 : legPhase * 5, rKick = isJumping ? -6 : -legPhase * 5;
    ctx.fillStyle = '#4a4a5a';
    this._roundRect2(ctx, leftLegX, legY + lKick + bobY, legW, legH - lKick, 2);
    this._roundRect2(ctx, rightLegX, legY + rKick + bobY, legW, legH - rKick, 2);
    ctx.fillStyle = feetColor;
    this._roundRect2(ctx, leftLegX - 1, by - 5 + bobY, legW + 3, 5, 2);
    this._roundRect2(ctx, rightLegX - 1, by - 5 + bobY, legW + 3, 5, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(leftLegX, by - 8 + bobY, legW + 1, 2);
    ctx.fillRect(rightLegX, by - 8 + bobY, legW + 1, 2);
    // Body
    var bodyW = 26, bodyH = 24, bodyX = cx - bodyW / 2;
    var bodyY = by - legH - bodyH + bobY + breathe;
    ctx.fillStyle = armorColor;
    this._roundRect2(ctx, bodyX, bodyY, bodyW, bodyH, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 6, bodyY + 4); ctx.lineTo(cx, bodyY + 12); ctx.lineTo(cx + 6, bodyY + 4); ctx.stroke();
    ctx.fillStyle = '#3a3322'; ctx.fillRect(bodyX + 1, bodyY + bodyH - 6, bodyW - 2, 5);
    ctx.fillStyle = '#ffcc44'; ctx.fillRect(cx - 3, bodyY + bodyH - 6, 6, 5);
    // Shoulder pads
    ctx.fillStyle = armorColor;
    ctx.beginPath(); ctx.ellipse(bodyX - 1, bodyY + 5, 7, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bodyX + bodyW + 1, bodyY + 5, 7, 5, 0.2, 0, Math.PI * 2); ctx.fill();
    // Arms
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(bodyX - 7, bodyY + 8 + bobY, 6, 16);
    ctx.fillRect(bodyX + bodyW + 1, bodyY + 6 + bobY, 6, 18);
    // Shield
    if (shieldColor) {
      var shX = bodyX - 10, shY = bodyY + 9 + bobY;
      ctx.fillStyle = shieldColor;
      ctx.beginPath();
      ctx.moveTo(shX + 6, shY); ctx.quadraticCurveTo(shX + 14, shY + 2, shX + 14, shY + 10);
      ctx.quadraticCurveTo(shX + 12, shY + 20, shX + 6, shY + 22);
      ctx.quadraticCurveTo(shX, shY + 20, shX - 2, shY + 10);
      ctx.quadraticCurveTo(shX - 2, shY + 2, shX + 6, shY);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(shX + 6, shY + 4); ctx.lineTo(shX + 6, shY + 18);
      ctx.moveTo(shX + 1, shY + 10); ctx.lineTo(shX + 11, shY + 10); ctx.stroke();
    }
    // Head
    var headR = 13, headY2 = bodyY - headR - 1 + bobY;
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath(); ctx.arc(cx, headY2, headR, 0, Math.PI * 2); ctx.fill();
    // Hair
    var hairFlow = isRunning ? Math.sin(time * 0.008) * 3 : Math.sin(time * 0.002) * 1;
    ctx.fillStyle = jc;
    ctx.beginPath(); ctx.arc(cx, headY2 - 2, headR + 2, Math.PI * 1.1, Math.PI * 1.9, true); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, headY2 - 8); ctx.lineTo(cx - 14 + hairFlow, headY2 - 22);
    ctx.lineTo(cx - 4, headY2 - 10); ctx.lineTo(cx + 2 + hairFlow * 0.5, headY2 - 25);
    ctx.lineTo(cx + 6, headY2 - 10); ctx.lineTo(cx + 12 + hairFlow * 0.3, headY2 - 20);
    ctx.lineTo(cx + 13, headY2 - 6); ctx.closePath(); ctx.fill();
    // Back hair
    ctx.beginPath();
    ctx.moveTo(cx - faceDir * 8, headY2 + 2);
    ctx.quadraticCurveTo(cx - faceDir * 18 + hairFlow, headY2 + 10, cx - faceDir * 14 + hairFlow * 2, headY2 + 20);
    ctx.lineTo(cx - faceDir * 10, headY2 + 5); ctx.closePath(); ctx.fill();
    // Eyes
    var eyeOffX = faceDir * 2, eyeY = headY2 - 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx - 5 + eyeOffX, eyeY, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 5 + eyeOffX, eyeY, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = jc;
    ctx.beginPath(); ctx.arc(cx - 4 + eyeOffX + faceDir * 1.5, eyeY + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6 + eyeOffX + faceDir * 1.5, eyeY + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath(); ctx.arc(cx - 4 + eyeOffX + faceDir * 2, eyeY + 0.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6 + eyeOffX + faceDir * 2, eyeY + 0.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 3 + eyeOffX, eyeY - 1.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 7 + eyeOffX, eyeY - 1.5, 1, 0, Math.PI * 2); ctx.fill();
    // Mouth
    ctx.strokeStyle = '#cc7755'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx + faceDir * 2, headY2 + 5, 3, 0.1, Math.PI - 0.1); ctx.stroke();
    // Cheeks
    ctx.fillStyle = 'rgba(255,150,150,0.2)';
    ctx.beginPath(); ctx.ellipse(cx - 9, headY2 + 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 9, headY2 + 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    // Helmet
    if (headColor) {
      ctx.fillStyle = headColor;
      ctx.beginPath(); ctx.arc(cx, headY2 - 3, headR + 3, Math.PI * 1.05, Math.PI * 1.95, true); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - headR - 1, headY2 - 3, headR * 2 + 2, 3);
      ctx.fillStyle = headColor; ctx.fillRect(cx - 2, headY2 - headR - 5, 4, 8);
    }
    // Weapon
    var weapX = bodyX + bodyW + 5, weapY = bodyY + 2 + bobY;
    var weapSway = Math.sin(time * 0.002) * 0.05;
    ctx.save();
    ctx.translate(weapX + 2, weapY + 18); ctx.rotate(-0.4 + weapSway);
    if (weaponRank === 'epic' || weaponRank === 'legend') {
      ctx.shadowColor = weaponRank === 'legend' ? '#ffd700' : '#bb44ff';
      ctx.shadowBlur = 12 + Math.sin(time * 0.004) * 5;
    }
    ctx.fillStyle = '#ffcc44'; ctx.beginPath(); ctx.arc(0, 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2, 0, 4, 12);
    ctx.fillStyle = weaponColor;
    ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(7, -1); ctx.lineTo(6, 2); ctx.lineTo(-6, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = weaponColor;
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(1.5, -30); ctx.lineTo(0, -33); ctx.lineTo(-1.5, -30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(1, -2); ctx.lineTo(0.5, -30); ctx.lineTo(0, -30); ctx.closePath(); ctx.fill();
    var gleamPos = ((time * 0.001) % 3) / 3;
    if (gleamPos < 0.3) { var gleamY2 = -2 - gleamPos / 0.3 * 28; ctx.fillStyle = 'rgba(255,255,255,' + (0.6 - gleamPos * 2) + ')'; ctx.fillRect(-2, gleamY2, 4, 3); }
    ctx.shadowBlur = 0;
    ctx.restore();
    // Attack flash
    if (justAttacked) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, this.y + this.height / 2, this.width / 2 + 5, this.height / 2 + 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Dust particles
    if (isRunning && this.grounded) {
      ctx.fillStyle = 'rgba(180,160,130,0.4)';
      for (var di = 0; di < 3; di++) {
        var dustX = cx - faceDir * (10 + di * 8) + Math.sin(time * 0.01 + di) * 4;
        var dustY = by - 2 + Math.cos(time * 0.012 + di * 2) * 3;
        ctx.beginPath(); ctx.arc(dustX, dustY, 2 + Math.sin(time * 0.008 + di), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  _roundRect2(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }
}
