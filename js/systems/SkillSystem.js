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

    // 元ステータスバックアップ（バフ解除用）
    this._baseStats = {};

    // エフェクトリスト（BattleSceneが描画する）
    this.effects = [];
  }

  reset() {
    this.cooldowns = { skill1: 0, skill2: 0, skill3: 0, ultimate: 0 };
    this.gauge = 0;
    this.activeBuffs = [];
    this.effects = [];
    this._baseStats = {};
  }

  // 与ダメージ時にゲージ加算
  addGauge(damage) {
    this.gauge = Math.min(this.gaugeMax, this.gauge + damage / 10);
  }

  // スキルが使用可能か判定
  canUse(slot) {
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

      var ecx = enemy.x + enemy.width / 2;
      var dist = Math.abs(pcx - ecx);

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
    var p = this.player;
    var pcx = p.x + p.width / 2;
    var result = { hits: [], heal: 0, knockback: 0 };
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) continue;
      var ecx = enemies[i].x + enemies[i].width / 2;
      var dist = Math.abs(pcx - ecx);
      if (dist < nearestDist) { nearestDist = dist; nearest = enemies[i]; }
    }
    if (!nearest || nearestDist > (useMagic ? 200 : 80)) return null;
    var idx = enemies.indexOf(nearest);
    var baseStat = useMagic ? p.matk : p.atk;
    var defStat = useMagic ? nearest.mdef : nearest.def;
    var reduction = defStat / (defStat + 100);
    var dmg = baseStat * (1 - reduction) * (0.9 + Math.random() * 0.2);
    var isCrit = Math.random() * 100 < p.crit;
    if (isCrit) dmg *= 1.5;
    dmg = Math.max(1, Math.floor(dmg));
    result.hits.push({ enemyIndex: idx, damage: dmg, critical: isCrit });
    this.addGauge(dmg);
    return result;
  }


  // --- 新スキルボタンUI描画 (物理/魔法/必殺 + AUTO) ---
  renderSkillUI(ctx, autoEnabled) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var p = this.player;
    var btnSize = 56;
    var gap = 10;
    var btnY = H - btnSize - 55;
    var startX = W - (btnSize * 3 + gap * 2) - 20;

    var buttons = [
      { label: '物理', subLabel: '[Z]', type: 'physical', color: '#cc4444' },
      { label: '魔法', subLabel: '[X]', type: 'magical', color: '#4488ff' },
      { label: '必殺', subLabel: '[V]', type: 'ultimate', color: '#ffd700' },
    ];

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var bx = startX + i * (btnSize + gap);
      var usable = false;

      if (btn.type === 'physical') {
        usable = !!this.findBestPhysical([]) || true; // basic attack always available
      } else if (btn.type === 'magical') {
        usable = !!this.findBestMagical([]) || p.matk > 0;
      } else if (btn.type === 'ultimate') {
        var ultSkill = SkillData.getBySlot(p.job, 'ultimate');
        var classLv = p.getClassLevel();
        var locked = !ultSkill || classLv < ultSkill.unlockLevel;
        usable = !locked && this.gauge >= (ultSkill ? ultSkill.gaugeCost || 100 : 100);
      }

      ctx.save();
      // Button background
      if (usable) {
        ctx.fillStyle = btn.color + '33';
        ctx.strokeStyle = btn.color;
      } else {
        ctx.fillStyle = 'rgba(60,60,60,0.5)';
        ctx.strokeStyle = 'rgba(100,100,100,0.4)';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(bx, btnY, btnSize, btnSize);
      ctx.strokeRect(bx, btnY, btnSize, btnSize);

      // Label
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = usable ? '#ffffff' : '#666666';
      ctx.fillText(btn.label, bx + btnSize / 2, btnY + btnSize / 2 - 6);

      // Sub label
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = usable ? '#aaaaaa' : '#555555';
      ctx.fillText(btn.subLabel, bx + btnSize / 2, btnY + btnSize / 2 + 12);

      // Ultimate gauge overlay
      if (btn.type === 'ultimate' && !usable) {
        var ultSkill2 = SkillData.getBySlot(p.job, 'ultimate');
        if (ultSkill2 && p.getClassLevel() >= ultSkill2.unlockLevel) {
          var gRatio = this.gauge / this.gaugeMax;
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(bx, btnY, btnSize, btnSize * (1 - gRatio));
        }
      }

      ctx.restore();
    }

    // AUTO toggle button
    var autoBtnX = startX - btnSize - gap;
    ctx.save();
    ctx.fillStyle = autoEnabled ? 'rgba(0,200,100,0.25)' : 'rgba(60,60,60,0.5)';
    ctx.strokeStyle = autoEnabled ? '#44ff88' : 'rgba(100,100,100,0.4)';
    ctx.lineWidth = 2;
    ctx.fillRect(autoBtnX, btnY, btnSize, btnSize);
    ctx.strokeRect(autoBtnX, btnY, btnSize, btnSize);
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = autoEnabled ? '#44ff88' : '#666666';
    ctx.fillText('AUTO', autoBtnX + btnSize / 2, btnY + btnSize / 2 - 6);
    ctx.font = '10px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = autoEnabled ? '#88ffaa' : '#555555';
    ctx.fillText(autoEnabled ? 'ON' : 'OFF [A]', autoBtnX + btnSize / 2, btnY + btnSize / 2 + 12);
    ctx.restore();

    // Gauge bar
    var gaugeW = btnSize * 3 + gap * 2;
    var gaugeH = 8;
    var gaugeX = startX;
    var gaugeY = btnY + btnSize + 4;
    var gaugeRatio = this.gauge / this.gaugeMax;

    ctx.fillStyle = '#222222';
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);
    ctx.fillStyle = this.gauge >= this.gaugeMax ? '#ffd700' : '#ff8844';
    ctx.fillRect(gaugeX, gaugeY, gaugeW * gaugeRatio, gaugeH);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX, gaugeY, gaugeW, gaugeH);
    ctx.font = '8px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('GAUGE ' + Math.floor(this.gauge) + '%', gaugeX + gaugeW / 2, gaugeY + gaugeH / 2);
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
