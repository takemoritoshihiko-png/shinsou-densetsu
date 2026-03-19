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

    // 自動攻撃処理
    this.attackTimer += sec;
    if (this.attackTimer >= this.attackInterval) {
      this._tryAutoAttack();
      this.attackTimer = 0;
    }

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
    var by = this.y + this.height; // bottom

    // 装備色（装備中の武器/体のランク色）
    var weaponColor = '#888888';
    var armorColor = jc;
    if (this.equipSystem) {
      var wep = this.equipSystem.getEquippedItem('weapon');
      if (wep) weaponColor = EquipmentData.RANK_COLORS[wep.rank] || '#888';
      var bod = this.equipSystem.getEquippedItem('body');
      if (bod) armorColor = EquipmentData.RANK_COLORS[bod.rank] || jc;
    }

    ctx.save();

    // 走りアニメーション
    var bobY = 0;
    var legPhase = 0;
    if (Math.abs(this.vx) > 10) {
      bobY = Math.sin(Date.now() * 0.012) * 2;
      legPhase = Math.sin(Date.now() * 0.015);
    }

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, by + 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 足 ---
    var legW = 6, legH = 14;
    var leftLegX = cx - 8;
    var rightLegX = cx + 2;
    var legY = by - legH;

    // 左足
    ctx.fillStyle = '#555566';
    ctx.fillRect(leftLegX, legY + legPhase * 3 + bobY, legW, legH - legPhase * 3);
    // 右足
    ctx.fillRect(rightLegX, legY - legPhase * 3 + bobY, legW, legH + legPhase * 3);

    // 靴
    var shoeColor = '#6b5b3a';
    if (this.equipSystem) {
      var ft = this.equipSystem.getEquippedItem('feet');
      if (ft) shoeColor = EquipmentData.RANK_COLORS[ft.rank] || '#6b5b3a';
    }
    ctx.fillStyle = shoeColor;
    ctx.fillRect(leftLegX - 1, by - 4 + bobY, legW + 3, 4);
    ctx.fillRect(rightLegX - 1, by - 4 + bobY, legW + 3, 4);

    // --- 体 ---
    var bodyW = 22, bodyH = 22;
    var bodyX = cx - bodyW / 2;
    var bodyY = by - legH - bodyH + bobY;

    // 鎧（体装備色）
    ctx.fillStyle = armorColor;
    this._roundRect2(ctx, bodyX, bodyY, bodyW, bodyH, 3);

    // ベルト
    ctx.fillStyle = '#3a3322';
    ctx.fillRect(bodyX, bodyY + bodyH - 5, bodyW, 4);

    // 肩パッド
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.arc(bodyX - 2, bodyY + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bodyX + bodyW + 2, bodyY + 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // --- 腕 ---
    var armW = 5;
    // 左腕
    ctx.fillStyle = '#ddb89a';
    ctx.fillRect(bodyX - armW - 2, bodyY + 6 + bobY, armW, 16);
    // 右腕（武器持つ側）
    ctx.fillRect(bodyX + bodyW + 2, bodyY + 4 + bobY, armW, 18);

    // --- 頭 ---
    var headR = 10;
    var headY = bodyY - headR - 2 + bobY;

    // 顔（肌色）
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.arc(cx, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // 髪の毛（職業色）
    ctx.fillStyle = jc;
    ctx.beginPath();
    ctx.arc(cx, headY - 2, headR + 1, Math.PI * 1.15, Math.PI * 1.85, true);
    ctx.fill();

    // 目
    ctx.fillStyle = '#222222';
    var faceDir = this.vx >= 0 ? 1 : -1;
    ctx.fillRect(cx + faceDir * 2 - 1, headY - 2, 2, 3);
    ctx.fillRect(cx + faceDir * 6 - 1, headY - 2, 2, 3);

    // 口
    ctx.fillStyle = '#cc7755';
    ctx.fillRect(cx + faceDir * 3, headY + 3, 3, 1);

    // ヘルメット/帽子（頭装備）
    if (this.equipSystem) {
      var hd = this.equipSystem.getEquippedItem('head');
      if (hd) {
        var hdColor = EquipmentData.RANK_COLORS[hd.rank] || '#666';
        ctx.fillStyle = hdColor;
        ctx.beginPath();
        ctx.arc(cx, headY - 4, headR + 2, Math.PI * 1.0, Math.PI * 2.0, true);
        ctx.fill();
        // ツバ
        ctx.fillRect(cx - headR - 4, headY - 5, headR * 2 + 8, 3);
      }
    }

    // --- 武器 ---
    var weapX = bodyX + bodyW + 5;
    var weapY = bodyY + 2 + bobY;

    ctx.save();
    ctx.translate(weapX + 2, weapY + 18);
    ctx.rotate(-0.4);

    // 剣の柄
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-2, 0, 4, 10);
    // ガード
    ctx.fillStyle = weaponColor;
    ctx.fillRect(-5, -1, 10, 3);
    // 剣身
    ctx.fillStyle = weaponColor;
    ctx.beginPath();
    ctx.moveTo(-3, -1);
    ctx.lineTo(3, -1);
    ctx.lineTo(1, -28);
    ctx.lineTo(-1, -28);
    ctx.closePath();
    ctx.fill();
    // 光沢
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, -26, 1, 22);

    ctx.restore();

    // --- 盾（左手） ---
    if (this.equipSystem) {
      var sh = this.equipSystem.getEquippedItem('shield');
      if (sh) {
        var shColor = EquipmentData.RANK_COLORS[sh.rank] || '#888';
        var shX = bodyX - armW - 7;
        var shY = bodyY + 8 + bobY;
        ctx.fillStyle = shColor;
        this._roundRect2(ctx, shX, shY, 10, 16, 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(shX + 2, shY + 2, 6, 12);
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
