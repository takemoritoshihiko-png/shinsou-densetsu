// スキル実行・管理システム
class SkillSystem {
  constructor(player) {
    this.player = player;

    // クールダウン管理 { skill1: 残り秒, skill2: ..., skill3: ..., ultimate: 0 }
    this.cooldowns = { skill1: 0, skill2: 0, skill3: 0, ultimate: 0 };

    // 必殺技ゲージ (0〜100)
    this.gauge = 0;
    this.gaugeMax = 100;

    // アクティブバフ一覧 [{ stat, percent, remaining }]
    this.activeBuffs = [];

    // グローバルクールダウン（連射防止）
    this._globalCD = 0;
    this._globalCDMax = 0.4; // 秒

    // 元ステータスバックアップ（バフ解除用）
    this._baseStats = {};

    // エフェクトリスト（BattleSceneが描画する）
    this.effects = [];
    this._globalCD = 0;
  }

  reset() {
    this.cooldowns = { skill1: 0, skill2: 0, skill3: 0, ultimate: 0 };
    this.gauge = 0;
    this.activeBuffs = [];

    // グローバルクールダウン（連射防止）
    this._globalCD = 0;
    this._globalCDMax = 0.4; // 秒
    this.effects = [];
    this._globalCD = 0;
    this._baseStats = {};
  }

  // 与ダメージ時にゲージ加算
  addGauge(damage) {
    this.gauge = Math.min(this.gaugeMax, this.gauge + damage / 10);
  }

  // スキルが使用可能か判定
  canUse(slot) {
// グローバルCD中は使用不可    if (this._globalCD > 0) return false;
    var skill = SkillData.getBySlot(this.player.job, slot);
    if (!skill) return false;

    // 職業レベル解放チェック
    var classLv = this.player.getClassLevel();
    if (classLv < skill.unlockLevel) return false;

    // クールダウン中
    if (this.cooldowns[slot] > 0) return false;

    // 必殺技はゲージ判定
    if (slot === 'ultimate') {
      return this.gauge >= (skill.gaugeCost || 100);
    }

    // MP判定
    if (skill.mpCost && this.player.mp < skill.mpCost) return false;

    return true;
  }

  // スキル使用（BattleSceneから呼ばれる）— ダメージ適用は返り値で行う
  // returns: { hits: [{enemyIndex, damage, critical}], heal: number } or null
  use(slot, enemies) {
    if (!this.canUse(slot)) return null;

    var skill = SkillData.getBySlot(this.player.job, slot);
    if (!skill) return null;

    var p = this.player;

    // コスト消費
    if (slot === 'ultimate') {
      this.gauge -= (skill.gaugeCost || 100);
    } else {
      p.mp -= (skill.mpCost || 0);
    }

    // クールダウン設定
    if (skill.cooldown) {
      this.cooldowns[slot] = skill.cooldown;
this._globalCD = this._globalCDMax;
    }

    var result = { hits: [], heal: 0, knockback: skill.knockback || 0 };

    // --- ヒール ---
    if (skill.type === 'heal' || skill.healPercent) {
      var healAmt = Math.floor(p.hpMax * (skill.healPercent || 0) / 100);
      p.hp = Math.min(p.hpMax, p.hp + healAmt);
      result.heal = healAmt;
    }

    // --- バフ ---
    if (skill.type === 'buff') {
      this._applyBuff(skill.buffStat, skill.buffPercent, skill.buffDuration);
      this._spawnEffect(skill, p.x + p.width / 2, p.y + p.height / 2);
      return result;
    }

    // --- 必殺技(自己回復型: shielder/priest) ---
    if (skill.type === 'ultimate' && skill.target === 'self') {
      this._spawnEffect(skill, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
      return result;
    }

    // --- ダメージ系 ---
    var pcx = p.x + p.width / 2;
    var hitCount = skill.hits || 1;
    var range = skill.range || 9999;
    var isAll = skill.target === 'all';
    var useMATK = skill.useMATK || false;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy.alive) continue;

      var ecx = enemy.x + enemy.width / 2;      var ecy = enemy.y + enemy.height / 2;      var pcy = p.y + p.height / 2;      var dist = Math.sqrt((pcx - ecx) * (pcx - ecx) + (pcy - ecy) * (pcy - ecy));

      if (isAll || dist <= range) {
        for (var h = 0; h < hitCount; h++) {
          var baseStat = useMATK ? p.matk : p.atk;
          var rawDmg = baseStat * (skill.multiplier || 1.0);
          var defStat = useMATK ? enemy.mdef : enemy.def;
          var reduction = defStat / (defStat + 100);
          var dmg = rawDmg * (1 - reduction) * (0.9 + Math.random() * 0.2);

          var isCrit = skill.forceCrit || (Math.random() * 100 < p.crit);
          if (isCrit) dmg *= 1.5;
          dmg = Math.max(1, Math.floor(dmg));

          result.hits.push({ enemyIndex: i, damage: dmg, critical: isCrit });
        }
      }
    }

    // エフェクト生成
    if (isAll || skill.effectType === 'fullscreen') {
      this._spawnEffect(skill, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    } else {
      this._spawnEffect(skill, pcx + 60, p.y + p.height / 2);
    }

    return result;
  }

  _applyBuff(stat, percent, duration) {
    // 既存の同じステータスバフを上書き
    for (var i = this.activeBuffs.length - 1; i >= 0; i--) {
      if (this.activeBuffs[i].stat === stat) {
        this._removeBuff(i);
      }
    }

    var p = this.player;
    var baseVal = p[stat];
    var bonus = Math.floor(baseVal * percent / 100);
    p[stat] = baseVal + bonus;

    this.activeBuffs.push({
      stat: stat,
      percent: percent,
      bonus: bonus,
      remaining: duration,
    });
  }

  _removeBuff(index) {
    var buff = this.activeBuffs[index];
    this.player[buff.stat] -= buff.bonus;
    this.activeBuffs.splice(index, 1);
  }

  _spawnEffect(skill, x, y) {
    this.effects.push(new SkillEffect(
      x, y,
      skill.effectType || 'slash',
      skill.effectColor || '#ffffff',
      skill.target === 'all' || skill.effectType === 'fullscreen'
    ));
  }

  update(dt) {
    var sec = dt / 1000;

    // グローバルクールダウン減算
    if (this._globalCD > 0) this._globalCD = Math.max(0, this._globalCD - sec);

    // クールダウン減少
    for (var slot in this.cooldowns) {
      if (this.cooldowns[slot] > 0) {
        this.cooldowns[slot] = Math.max(0, this.cooldowns[slot] - sec);
      }
    }

    // バフ残り時間減少
    for (var i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].remaining -= sec;
      if (this.activeBuffs[i].remaining <= 0) {
        this._removeBuff(i);
      }
    }

    // エフェクト更新
    for (var j = this.effects.length - 1; j >= 0; j--) {
      this.effects[j].update(dt);
      if (!this.effects[j].alive) {
        this.effects.splice(j, 1);
      }
    }
  }

  // 職業が物理型か魔法型かを判定
  isPhysicalJob() {
    var magicJobs = ['mage', 'priest'];
    return magicJobs.indexOf(this.player.job) < 0;
  }

  // 物理攻撃: 使える最強の物理スキルを選ぶ。なければ通常攻撃
  findBestPhysical(enemies) {
    var skills = SkillData.getSkills(this.player.job);
    var classLv = this.player.getClassLevel();
    var best = null;
    var bestMul = 0;
    for (var i = 0; i < skills.length; i++) {
      var sk = skills[i];
      if (sk.slot === 'ultimate') continue;
      if (sk.type === 'buff' || sk.type === 'heal') continue;
      if (sk.useMATK) continue;
      if (classLv < sk.unlockLevel) continue;
      if (this.cooldowns[sk.slot] > 0) continue;
      if (sk.mpCost && this.player.mp < sk.mpCost) continue;
      var totalMul = (sk.multiplier || 1) * (sk.hits || 1);
      if (totalMul > bestMul) { bestMul = totalMul; best = sk; }
    }
    return best; // null = 通常攻撃にフォールバック
  }

  // 魔法攻撃: 使える最強の魔法/回復/バフスキルを選ぶ
  findBestMagical(enemies) {
    var skills = SkillData.getSkills(this.player.job);
    var classLv = this.player.getClassLevel();
    var best = null;
    var bestPriority = -1;
    for (var i = 0; i < skills.length; i++) {
      var sk = skills[i];
      if (sk.slot === 'ultimate') continue;
      if (classLv < sk.unlockLevel) continue;
      if (this.cooldowns[sk.slot] > 0) continue;
      if (sk.mpCost && this.player.mp < sk.mpCost) continue;
      var priority = 0;
      if (sk.type === 'heal' || sk.healPercent) {
        if (this.player.hp < this.player.hpMax * 0.7) priority = 100;
        else continue;
      } else if (sk.type === 'buff') {
        priority = 50;
      } else if (sk.useMATK || sk.type === 'magical') {
        priority = 10 + (sk.multiplier || 1) * (sk.hits || 1);
      } else {
        priority = 5 + (sk.multiplier || 1) * (sk.hits || 1);
      }
      if (priority > bestPriority) { bestPriority = priority; best = sk; }
    }
    return best;
  }

  // オート攻撃で使うべき攻撃タイプ
  getAutoAttackType() {
    return this.isPhysicalJob() ? 'physical' : 'magical';
  }

  // 物理攻撃を実行 (スキルまたは通常攻撃)
  usePhysical(enemies) {
    var skill = this.findBestPhysical(enemies);
    if (skill) return this.use(skill.slot, enemies);
    return this._doBasicAttack(enemies, false);
  }

  // 魔法攻撃を実行
  useMagical(enemies) {
    var skill = this.findBestMagical(enemies);
    if (skill) return this.use(skill.slot, enemies);
    return this._doBasicAttack(enemies, true);
  }

  // 通常攻撃 (スキルなし)
  _doBasicAttack(enemies, useMagic) {
if (this._globalCD > 0) return null;    this._globalCD = this._globalCDMax;
    var p = this.player;
    var pcx = p.x + p.width / 2;
    var result = { hits: [], heal: 0, knockback: 0 };
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) continue;
      var ecx = enemies[i].x + enemies[i].width / 2;
      var ecy = enemies[i].y + enemies[i].height / 2;
      var pcy = p.y + p.height / 2;
      var dist = Math.sqrt((pcx - ecx) * (pcx - ecx) + (pcy - ecy) * (pcy - ecy));


      if (dist < nearestDist) { nearestDist = dist; nearest = enemies[i]; }
    }
    if (!nearest || nearestDist > (useMagic ? 120 : 80)) return null;    if (useMagic) {      if (p.mp < 3) return null;      p.mp -= 3;    }
    var idx = enemies.indexOf(nearest);
    var baseStat = useMagic ? p.matk : p.atk;
    var defStat = useMagic ? nearest.mdef : nearest.def;
    var reduction = defStat / (defStat + 100);
    var dmg = baseStat * (1 - reduction) * (0.9 + Math.random() * 0.2);
    var isCrit = Math.random() * 100 < p.crit;
    if (isCrit) dmg *= 1.5;
    dmg = Math.max(1, Math.floor(dmg));
    result.hits.push({ enemyIndex: idx, damage: dmg, critical: isCrit });
    this.addGauge(dmg);    if (useMagic && nearest) {      var ex = nearest.x + nearest.width / 2;      var ey = nearest.y + nearest.height / 2;      this.effects.push(new SkillEffect(ex, ey, "burst", "#4488ff", false));    }    return result;
  }





  // --- 操作ガイド付きHUD ---
  renderSkillUI(ctx, autoEnabled) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 下部パネル背景
    var panelH = 48;
    var panelY = H - panelH;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, panelY, W, panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, panelY); ctx.lineTo(W, panelY); ctx.stroke();

    // 操作ボタンガイド（丸型アイコン+ラベル）
    var btns = [
      { key: 'Z', label: '物理攻撃', color: '#cc4444', usable: true },
      { key: 'X', label: '魔法攻撃', color: '#4488ff', usable: this.player.mp >= 3 },
      { key: 'V', label: '必殺技',   color: '#ffd700', usable: this.gauge >= this.gaugeMax },
      { key: 'Q', label: autoEnabled ? 'AUTO ON' : 'AUTO OFF', color: autoEnabled ? '#44ff88' : '#888888', usable: true },
    ];

    var btnStartX = 20;
    var btnGap = 8;
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var bx = btnStartX + i * 155;
      var by = panelY + 8;
      var bw = 148;
      var bh = 32;

      // 背景
      ctx.fillStyle = b.usable ? (b.color + '22') : 'rgba(40,40,40,0.5)';
      ctx.strokeStyle = b.usable ? b.color : 'rgba(80,80,80,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + 4, by); ctx.lineTo(bx + bw - 4, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 4);
      ctx.lineTo(bx + bw, by + bh - 4);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 4, by + bh);
      ctx.lineTo(bx + 4, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 4);
      ctx.lineTo(bx, by + 4);
      ctx.quadraticCurveTo(bx, by, bx + 4, by);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // キー丸アイコン
      var circX = bx + 18;
      var circY = by + bh / 2;
      ctx.beginPath(); ctx.arc(circX, circY, 11, 0, Math.PI * 2);
      ctx.fillStyle = b.usable ? b.color : '#555555';
      ctx.fill();
      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(b.key, circX, circY);

      // ラベル
      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = b.usable ? '#ffffff' : '#666666';
      ctx.fillText(b.label, bx + 34, circY);
    }

    // 必殺ゲージバー（4番目ボタンの右）
    var gaugeX = btnStartX + 4 * 155 + 10;
    var gaugeW = W - gaugeX - 20;
    var gaugeH = 10;
    var gaugeY = panelY + 12;
    var gaugeRatio = this.gauge / this.gaugeMax;

    ctx.font = '9px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('必殺ゲージ', gaugeX, gaugeY - 2);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(gaugeX, gaugeY + 6, gaugeW, gaugeH);
    ctx.fillStyle = this.gauge >= this.gaugeMax ? '#ffd700' : '#ff8844';
    ctx.fillRect(gaugeX, gaugeY + 6, gaugeW * gaugeRatio, gaugeH);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX, gaugeY + 6, gaugeW, gaugeH);

    ctx.font = 'bold 8px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.floor(this.gauge) + '%', gaugeX + gaugeW / 2, gaugeY + 6 + gaugeH / 2);

    // MP残量
    ctx.font = '10px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4488ff';
    ctx.fillText('MP: ' + this.player.mp + '/' + this.player.mpMax, gaugeX, panelY + 38);
  }

  // エフェクト描画
  renderEffects(ctx) {
    for (var i = 0; i < this.effects.length; i++) {
      this.effects[i].render(ctx);
    }
  }
}

class SkillEffect {
  constructor(x, y, type, color, fullscreen) {
    this.x = x;
    this.y = y;
    this.type = type;       // 'slash' | 'impact' | 'burst' | 'aura' | 'fullscreen'
    this.color = color;
    this.fullscreen = fullscreen;
    this.elapsed = 0;
    this.duration = fullscreen ? 400 : 250;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) this.alive = false;
  }

  render(ctx) {
    if (!this.alive) return;
    var progress = this.elapsed / this.duration;
    var alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.fullscreen) {
      // 全画面フラッシュ
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    } else if (this.type === 'slash') {
      // 斬撃: 横長の矩形
      var w = 80 + 40 * progress;
      var h = 20 * (1 - progress * 0.5);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - w / 2, this.y - h / 2, w, h);

    } else if (this.type === 'impact') {
      // 衝撃: 拡大する円
      var radius = 30 + 50 * progress;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.stroke();

    } else if (this.type === 'burst') {
      // 爆発: 拡大する塗りつぶし円
      var r2 = 20 + 40 * progress;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r2, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'aura') {
      // オーラ: 縮小する円
      var r3 = 40 * (1 - progress);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
