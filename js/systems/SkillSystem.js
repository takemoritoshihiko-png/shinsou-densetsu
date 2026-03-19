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

  // --- スキルボタンUI描画 ---
  renderSkillUI(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var p = this.player;
    var classLv = p.getClassLevel();
    var slots = ['skill1', 'skill2', 'skill3', 'ultimate'];
    var keys = ['Z', 'X', 'C', 'V'];
    var btnSize = 50;
    var gap = 8;
    var startX = W - (btnSize * 4 + gap * 3) - 20;
    var btnY = H - btnSize - 55;

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var skill = SkillData.getBySlot(p.job, slot);
      var bx = startX + i * (btnSize + gap);
      var usable = this.canUse(slot);
      var locked = !skill || classLv < skill.unlockLevel;
      var onCooldown = this.cooldowns[slot] > 0;
      var noMp = skill && slot !== 'ultimate' && skill.mpCost && p.mp < skill.mpCost;
      var noGauge = slot === 'ultimate' && skill && this.gauge < (skill.gaugeCost || 100);

      ctx.save();

      // ボタン背景
      if (locked) {
        ctx.fillStyle = 'rgba(60, 60, 60, 0.5)';
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
      } else if (!usable) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = skill ? (skill.effectColor + '88') : 'rgba(255, 255, 255, 0.5)';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(bx, btnY, btnSize, btnSize);
      ctx.strokeRect(bx, btnY, btnSize, btnSize);

      // キーラベル
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = usable ? '#ffffff' : '#666666';
      ctx.fillText(keys[i], bx + btnSize / 2, btnY + 4);

      // スキル名（短縮）
      if (skill && !locked) {
        ctx.font = '9px ' + CONFIG.FONT_FAMILY;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = usable ? '#cccccc' : '#555555';
        var shortName = skill.name.length > 5 ? skill.name.substring(0, 5) + '..' : skill.name;
        ctx.fillText(shortName, bx + btnSize / 2, btnY + btnSize / 2 + 2);
      }

      // クールダウン表示
      if (onCooldown) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(bx, btnY, btnSize, btnSize);

        ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff8888';
        ctx.fillText(Math.ceil(this.cooldowns[slot]) + 's', bx + btnSize / 2, btnY + btnSize / 2);
      }

      // MP不足表示
      if (!onCooldown && noMp && !locked) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('MP不足', bx + btnSize / 2, btnY + btnSize - 2);
      }

      // 必殺技ゲージ不足
      if (slot === 'ultimate' && !locked && noGauge && !onCooldown) {
        // ゲージ量をオーバーレイ
        var gRatio = this.gauge / this.gaugeMax;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(bx, btnY, btnSize, btnSize * (1 - gRatio));
      }

      // ロック表示
      if (locked) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#555555';
        if (skill) {
          ctx.fillText('Lv.' + skill.unlockLevel, bx + btnSize / 2, btnY + btnSize / 2);
        } else {
          ctx.fillText('---', bx + btnSize / 2, btnY + btnSize / 2);
        }
      }

      ctx.restore();
    }

    // --- 必殺技ゲージバー ---
    var gaugeW = btnSize * 4 + gap * 3;
    var gaugeH = 8;
    var gaugeX = startX;
    var gaugeY = btnY + btnSize + 4;
    var gaugeRatio = this.gauge / this.gaugeMax;

    ctx.fillStyle = '#222222';
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    var gColor = this.gauge >= this.gaugeMax ? '#ffd700' : '#ff8844';
    ctx.fillStyle = gColor;
    ctx.fillRect(gaugeX, gaugeY, gaugeW * gaugeRatio, gaugeH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

// スキルエフェクト
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
