// バトル画面シーン（トップダウン版）
class BattleScene {
  constructor(sceneManager, inputManager, player, partySystem, equipSystem, bookSystem) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.player = player;
    this.partySystem = partySystem;
    this.equipSystem = equipSystem;
    this.bookSystem = bookSystem;
    this.enemies = [];
    this.damageNumbers = [];
    this.levelUpEffects = [];
    this.waveManager = null;
    this.skillSystem = null;
    this.dropItems = [];
    this.rareDropEffects = [];
    this.allDrops = [];
    this.currentWorld = 1;
    this.currentStage = 1;
    this.stageSelectScene = null;
    this.battleEnded = false;
    this.endTimer = 0;
    this.endDelay = 1500;
    this.endResult = '';
    this.autoEnabled = false;
    this.autoTimer = 0;
    this.autoInterval = 1200;
    // フィールド装飾
    this._grassTiles = [];
    this._treeTiles = [];
  }

  enter() {
    this.inputManager.virtualPadEnabled = true;
    this.player.reset();
    this.enemies = [];
    this.damageNumbers = [];
    this.levelUpEffects = [];
    this.dropItems = [];
    this.rareDropEffects = [];
    this.allDrops = [];
    this.battleEnded = false;
    this.endTimer = 0;
    this.endResult = '';
    this.autoTimer = 0;

    this.skillSystem = new SkillSystem(this.player);
    this.skillSystem.reset();

    var self = this;
    this._spawnDmgNum = function (x, y, damage, critical) {
      self.damageNumbers.push(new DamageNumber(x, y, damage, critical));
    };

    this.waveManager = new WaveManager(function (stats) {
      self._spawnEnemy(stats);
    }, this.currentWorld, this.currentStage);
    this.waveManager.start();

    // フィールド装飾を生成
    this._generateField();
  }

  _generateField() {
    this._grassTiles = [];
    this._treeTiles = [];
    // 草の模様
    for (var i = 0; i < 40; i++) {
      this._grassTiles.push({
        x: Math.random() * CONFIG.FIELD_W,
        y: Math.random() * CONFIG.FIELD_H,
        size: 2 + Math.random() * 3,
        shade: Math.random() * 0.15,
      });
    }
    // 木/岩
    for (var j = 0; j < 6; j++) {
      this._treeTiles.push({
        x: 40 + Math.random() * (CONFIG.FIELD_W - 80),
        y: 40 + Math.random() * (CONFIG.FIELD_H - 80),
        type: Math.random() > 0.5 ? 'tree' : 'rock',
        size: 8 + Math.random() * 8,
      });
    }
  }

  _spawnEnemy(stats) {
    var enemy = new Enemy(stats);
    enemy._onDamageCallback = this._spawnDmgNum;
    this.enemies.push(enemy);
    if (this.bookSystem) {
      var bookId = stats.monsterId || stats.monsterName || stats.bossName || null;
      if (bookId) { enemy._bookId = bookId; this.bookSystem.registerMonsterEncounter(bookId); }
    }
  }

  update(dt) {
    this._updateLevelUpEffects(dt);
    if (this.skillSystem) this.skillSystem.update(dt);

    if (this.battleEnded) {
      this.endTimer += dt;
      this._updateDamageNumbers(dt);
      this._updateDropItems(dt);
      for (var e = this.enemies.length - 1; e >= 0; e--) {
        this.enemies[e].update(dt, this.player);
        if (this.enemies[e].isFinished()) this.enemies.splice(e, 1);
      }
      if (this.endTimer >= this.endDelay) this._goToResult();
      return;
    }

    this.player.update(dt);

    // プレイヤーに敵配列とコールバックを渡す
    this.player._enemies = this.enemies;
    if (!this.player._onAttackCallback) {
      var self = this;
      this.player._onAttackCallback = function (x, y, damage, critical, enemy, killed) {
        self.damageNumbers.push(new DamageNumber(x, y, damage, critical));
        if (self.skillSystem) self.skillSystem.addGauge(damage);
        if (killed) {
          self.player.addReward(enemy.exp, enemy.gold);
          var ups = LevelSystem.gainExp(self.player, enemy.exp);
          if (ups > 0) {
            self.levelUpEffects.push(new LevelUpEffect(self.player.x + self.player.width / 2, self.player.y));
          }
          var ecx = enemy.x + enemy.width / 2;
          self._spawnDrops(enemy, ecx, enemy.y + enemy.height / 2);
          if (self.bookSystem && enemy._bookId) self.bookSystem.registerMonsterKill(enemy._bookId);
        }
      };
    }

    if (this.player.hp <= 0) {
      this.battleEnded = true;
      this.endResult = 'fail';
      this.player.applyBattleRewards();
      return;
    }

    // 攻撃入力
    if (this.inputManager.isKeyPressed('auto_toggle')) {
      this.autoEnabled = !this.autoEnabled;
      this.autoTimer = 0;
    }
    if (this.inputManager.isKeyPressed('physical')) this._useAttack('physical');
    if (this.inputManager.isKeyPressed('magical')) this._useAttack('magical');
    if (this.inputManager.isKeyPressed('ultimate')) this._useAttack('ultimate');

    // オート攻撃
    if (this.autoEnabled && this.skillSystem) {
      this.autoTimer += dt;
      if (this.autoTimer >= this.autoInterval) {
        this.autoTimer = 0;
        this._useAttack(this.skillSystem.getAutoAttackType());
        if (this.skillSystem.gauge >= this.skillSystem.gaugeMax) this._useAttack('ultimate');
      }
    }

    // 敵更新
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(dt, this.player);
      if (this.enemies[i].isFinished()) this.enemies.splice(i, 1);
    }

    // 生存敵数
    var aliveCount = 0;
    for (var j = 0; j < this.enemies.length; j++) {
      if (this.enemies[j].alive) aliveCount++;
    }

    this.waveManager.update(dt, aliveCount);

    if (this.waveManager.isCleared()) {
      this.battleEnded = true;
      this.endResult = 'clear';
      this.player.applyBattleRewards();
    }

    this._updateDamageNumbers(dt);
    this._updateDropItems(dt);
  }

  _useAttack(type) {
    if (!this.skillSystem) return;
    var result = null;
    if (type === 'physical') result = this.skillSystem.usePhysical(this.enemies);
    else if (type === 'magical') result = this.skillSystem.useMagical(this.enemies);
    else if (type === 'ultimate') result = this.skillSystem.use('ultimate', this.enemies);
    if (!result) return;
    this._applySkillResult(result);
  }

  _applySkillResult(result) {
    for (var h = 0; h < result.hits.length; h++) {
      var hit = result.hits[h];
      var enemy = this.enemies[hit.enemyIndex];
      if (!enemy || !enemy.alive) continue;
      var killed = enemy.takeDamage(hit.damage);
      var ecx = enemy.x + enemy.width / 2;
      this.damageNumbers.push(new DamageNumber(ecx, enemy.y - 10, hit.damage, hit.critical));
      if (this.skillSystem) this.skillSystem.addGauge(hit.damage);
      if (result.knockback && enemy.alive) enemy.x += result.knockback;
      if (killed) {
        this.player.addReward(enemy.exp, enemy.gold);
        var ups = LevelSystem.gainExp(this.player, enemy.exp);
        if (ups > 0) {
          this.levelUpEffects.push(new LevelUpEffect(this.player.x + this.player.width / 2, this.player.y));
        }
        this._spawnDrops(enemy, ecx, enemy.y + enemy.height / 2);
        if (this.bookSystem && enemy._bookId) this.bookSystem.registerMonsterKill(enemy._bookId);
      }
    }
    if (result.heal > 0) {
      this.damageNumbers.push(new DamageNumber(this.player.x + this.player.width / 2, this.player.y - 10, '+' + result.heal, false));
    }
  }

  _spawnDrops(enemy, x, y) {
    var drops = DropSystem.generateDrops(enemy, this.currentWorld, this.player.level, this.equipSystem, this.partySystem);
    for (var d = 0; d < drops.length; d++) {
      var drop = drops[d];
      this.allDrops.push(drop);
      if (this.bookSystem) {
        if (drop.type === 'equipment' && drop.item) this.bookSystem.registerEquipment(drop.item.baseId, drop.item.rank, drop.item.upgradeLevel || 0);
        if (drop.type === 'core') this.bookSystem.registerItem('core' + drop.rank.charAt(0).toUpperCase() + drop.rank.slice(1));
        if (drop.type === 'rerollStone') this.bookSystem.registerItem('rerollStone');
        if (drop.type === 'eraseStone') this.bookSystem.registerItem('eraseStone');
        if (drop.type === 'enhanceMat') this.bookSystem.registerItem('enhanceMat');
        if (drop.type === 'potion') this.bookSystem.registerItem('hpPotion');
      }
      if (drop.type === 'gold') continue;
      this.dropItems.push(new DropItem(x, y, drop));
      var tier = DropSystem.getDropTier(drop);
      if (tier >= 2) this.rareDropEffects.push(new RareDropEffect(tier));
    }
  }

  _updateDropItems(dt) {
    var pcx = this.player.x + this.player.width / 2;
    var pcy = this.player.y + this.player.height / 2;
    for (var i = this.dropItems.length - 1; i >= 0; i--) {
      this.dropItems[i].update(dt, pcx, pcy);
      if (!this.dropItems[i].alive) this.dropItems.splice(i, 1);
    }
    for (var j = this.rareDropEffects.length - 1; j >= 0; j--) {
      this.rareDropEffects[j].update(dt);
      if (!this.rareDropEffects[j].alive) this.rareDropEffects.splice(j, 1);
    }
  }

  _updateDamageNumbers(dt) {
    for (var k = this.damageNumbers.length - 1; k >= 0; k--) {
      this.damageNumbers[k].update(dt);
      if (!this.damageNumbers[k].alive) this.damageNumbers.splice(k, 1);
    }
  }

  _updateLevelUpEffects(dt) {
    for (var i = this.levelUpEffects.length - 1; i >= 0; i--) {
      this.levelUpEffects[i].update(dt);
      if (!this.levelUpEffects[i].alive) this.levelUpEffects.splice(i, 1);
    }
  }

  _goToResult() {
    var resultScene = this.sceneManager.scenes['result'];
    if (this.endResult === 'clear' && this.stageSelectScene) {
      this.stageSelectScene.markCleared(this.currentWorld, this.currentStage);
    }
    if (window._saveGame) window._saveGame();
    resultScene.setResult({
      cleared: this.endResult === 'clear',
      exp: this.player.battleExp,
      gold: this.player.battleGold,
      level: this.player.level,
      drops: this.allDrops,
      world: this.currentWorld,
      stage: this.currentStage,
    });
    this.sceneManager.changeScene('result');
  }

  _findBoss() {
    for (var i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].isBoss && this.enemies[i].alive) return this.enemies[i];
    }
    return null;
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // === フィールド背景 ===
    var worldColors = {
      1:  { base: '#3a7a2e', accent: '#2d6a22' },
      2:  { base: '#c2a86a', accent: '#a89050' },
      3:  { base: '#2a5a1a', accent: '#1a4010' },
      4:  { base: '#5a3020', accent: '#4a2010' },
      5:  { base: '#8899aa', accent: '#7788aa' },
      6:  { base: '#aa9944', accent: '#887730' },
      7:  { base: '#2a1a3a', accent: '#1a0a2a' },
      8:  { base: '#aabbcc', accent: '#99aacc' },
      9:  { base: '#3a1515', accent: '#2a0808' },
      10: { base: '#1a1a1a', accent: '#0a0a0a' },
    };
    var wc = worldColors[this.currentWorld] || worldColors[1];

    ctx.fillStyle = wc.base;
    ctx.fillRect(0, 0, W, H);

    // 草模様
    for (var gi = 0; gi < this._grassTiles.length; gi++) {
      var g = this._grassTiles[gi];
      ctx.fillStyle = 'rgba(0,0,0,' + g.shade + ')';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 木/岩
    for (var ti = 0; ti < this._treeTiles.length; ti++) {
      var t = this._treeTiles[ti];
      if (t.type === 'tree') {
        ctx.fillStyle = 'rgba(0,40,0,0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a5a1a';
        ctx.beginPath();
        ctx.arc(t.x, t.y - 2, t.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, t.size, t.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.ellipse(t.x - 2, t.y - 2, t.size * 0.4, t.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // フィールド境界線
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // === ドロップアイテム ===
    for (var di = 0; di < this.dropItems.length; di++) {
      this.dropItems[di].render(ctx);
    }

    // === 敵 ===
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].render(ctx);
    }

    // === プレイヤー ===
    this.player.render(ctx);

    // === スキルエフェクト ===
    if (this.skillSystem) this.skillSystem.renderEffects(ctx);

    // === レアドロップ演出 ===
    for (var ri = 0; ri < this.rareDropEffects.length; ri++) {
      this.rareDropEffects[ri].render(ctx);
    }

    // === ダメージ数字 ===
    for (var j = 0; j < this.damageNumbers.length; j++) {
      this.damageNumbers[j].render(ctx);
    }

    // === レベルアップ ===
    for (var l = 0; l < this.levelUpEffects.length; l++) {
      this.levelUpEffects[l].render(ctx);
    }

    // === UI: HPバー ===
    this._drawBar(ctx, 20, 16, 180, 16, this.player.hp, this.player.hpMax, '#22cc44', '#115522', 'HP');
    this._drawBar(ctx, 20, 38, 180, 16, this.player.mp, this.player.mpMax, '#3388ff', '#1a3366', 'MP');

    // Lv + EXP
    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Lv.' + this.player.level, 20, 68);
    var expR = this.player.level >= LevelSystem.MAX_LEVEL ? 1 : this.player.totalExp / this.player.expToNext;
    ctx.fillStyle = '#333'; ctx.fillRect(58, 62, 142, 10);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(58, 62, 142 * expR, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(58, 62, 142, 10);

    // EXP/GOLD
    ctx.font = 'bold 11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffee55'; ctx.fillText('EXP +' + this.player.battleExp, 20, 86);
    ctx.fillStyle = '#ffcc00'; ctx.fillText('GOLD +' + this.player.battleGold, 110, 86);

    // ボスHP
    var boss = this._findBoss();
    if (boss) this._renderBossHP(ctx, boss);

    // ウェーブUI
    if (!boss) this.waveManager.renderWaveUI(ctx);
    this.waveManager.renderAnnounce(ctx);

    // 終了テキスト
    if (this.battleEnded) this._renderEndText(ctx);

    // スキルUI
    if (this.skillSystem) this.skillSystem.renderSkillUI(ctx, this.autoEnabled);

    // 操作ヒント
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('[Z]物理 [X]魔法 [V]必殺 [Q]AUTO  [矢印/WASD]移動', W - 20, 16);

    // 仮想パッド
  }

  _renderBossHP(ctx, boss) {
    var cx = CONFIG.CANVAS_WIDTH / 2;
    var barW = 350, barH = 18, barX = cx - barW / 2, barY = 34;
    var ratio = boss.hpMax > 0 ? boss.hp / boss.hpMax : 0;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6666'; ctx.fillText(boss.bossName, cx, 20);
    ctx.fillStyle = '#441111'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255,100,100,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
    ctx.font = 'bold 11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff'; ctx.fillText(boss.hp + ' / ' + boss.hpMax, cx, barY + barH / 2);
  }

  _renderEndText(ctx) {
    var progress = Math.min(this.endTimer / 600, 1);
    var cx = CONFIG.CANVAS_WIDTH / 2, cy = CONFIG.CANVAS_HEIGHT / 2 - 20;
    ctx.save(); ctx.globalAlpha = progress;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 15;
    if (this.endResult === 'clear') {
      ctx.font = 'bold 48px ' + CONFIG.FONT_FAMILY; ctx.fillStyle = '#ffd700';
      ctx.fillText('STAGE CLEAR!', cx, cy);
    } else {
      ctx.font = 'bold 48px ' + CONFIG.FONT_FAMILY; ctx.fillStyle = '#ff4444';
      ctx.fillText('GAME OVER', cx, cy);
    }
    ctx.restore();
  }

  _drawBar(ctx, x, y, w, h, current, max, fgColor, bgColor, label) {
    var ratio = max > 0 ? current / max : 0;
    ctx.fillStyle = bgColor; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fgColor; ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.font = 'bold 11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; ctx.fillText(label, x + 4, y + h / 2);
    ctx.textAlign = 'right'; ctx.fillText(current + '/' + max, x + w - 4, y + h / 2);
  }

  onTap(x, y) {}
  exit() { this.inputManager.virtualPadEnabled = false; }
}
