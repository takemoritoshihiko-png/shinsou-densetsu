// バトル画面シーン
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

    // ドロップ
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

    // オート攻撃
    this.autoEnabled = false;
    this.autoTimer = 0;
    this.autoInterval = 1000; // ms
  }

  enter() {
    console.log('バトル開始');
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

    // スキルシステム初期化
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
  }

  _spawnEnemy(stats) {
    var enemy = new Enemy(stats);
    enemy._onDamageCallback = this._spawnDmgNum;
    this.enemies.push(enemy);
    // 図鑑: 遭遇登録
    if (this.bookSystem) {
      var bookId = stats.monsterId || stats.monsterName || stats.bossName || null;
      if (bookId) {
        enemy._bookId = bookId;
        this.bookSystem.registerMonsterEncounter(bookId);
      }
    }
  }

  update(dt) {
    this._updateLevelUpEffects(dt);

    if (this.skillSystem) {
      this.skillSystem.update(dt);
    }

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
            self.levelUpEffects.push(
              new LevelUpEffect(self.player.x + self.player.width / 2, self.player.y)
            );
          }
          var ecx = enemy.x + enemy.width / 2;
          self._spawnDrops(enemy, ecx, enemy.y + enemy.height / 2);
          if (self.bookSystem && enemy._bookId) {
            self.bookSystem.registerMonsterKill(enemy._bookId);
          }
        }
      };
    }

    if (this.player.hp <= 0) {
      this.battleEnded = true;
      this.endResult = 'fail';
      this.player.applyBattleRewards();
      return;
    }

    // --- 攻撃入力処理 (物理/魔法/必殺 + オートトグル) ---
    if (this.inputManager.isKeyPressed("auto_toggle")) {
      this.autoEnabled = !this.autoEnabled;
      this.autoTimer = 0;
    }
    if (this.inputManager.isKeyPressed("physical")) {
      this._useAttack("physical");
    }
    if (this.inputManager.isKeyPressed("magical")) {
      this._useAttack("magical");
    }
    if (this.inputManager.isKeyPressed("ultimate")) {
      this._useAttack("ultimate");
    }
    // オート攻撃
    if (this.autoEnabled && this.skillSystem) {
      this.autoTimer += dt;
      if (this.autoTimer >= this.autoInterval) {
        this.autoTimer = 0;
        var autoType = this.skillSystem.getAutoAttackType();
        this._useAttack(autoType);
        // ゲージ満タンなら必殺技も自動発動
        if (this.skillSystem.gauge >= this.skillSystem.gaugeMax) {
          this._useAttack("ultimate");
        }
      }
    }
    }

    // 敵の更新
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var enemy = this.enemies[i];
      enemy.update(dt, this.player);
      if (enemy.isFinished()) this.enemies.splice(i, 1);
    }

    // 画面外に出た敵を除外
    for (var oe = this.enemies.length - 1; oe >= 0; oe--) {
      if (this.enemies[oe].alive && this.enemies[oe].x < -this.enemies[oe].width) {
        this.enemies[oe].alive = false;
        this.enemies.splice(oe, 1);
      }
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
    if (type === "physical") {
      result = this.skillSystem.usePhysical(this.enemies);
    } else if (type === "magical") {
      result = this.skillSystem.useMagical(this.enemies);
    } else if (type === "ultimate") {
      result = this.skillSystem.use("ultimate", this.enemies);
    }
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
          this.levelUpEffects.push(
            new LevelUpEffect(this.player.x + this.player.width / 2, this.player.y)
          );
        }
        this._spawnDrops(enemy, ecx, enemy.y + enemy.height / 2);
        if (this.bookSystem && enemy._bookId) this.bookSystem.registerMonsterKill(enemy._bookId);
      }
    }
    if (result.heal > 0) {
      this.damageNumbers.push(
        new DamageNumber(this.player.x + this.player.width / 2, this.player.y - 10, "+" + result.heal, false)
      );
    }
  }

  _useSkill(slot) {
    var result = this.skillSystem.use(slot, this.enemies);
    if (!result) return;

    // ダメージ適用
    for (var h = 0; h < result.hits.length; h++) {
      var hit = result.hits[h];
      var enemy = this.enemies[hit.enemyIndex];
      if (!enemy || !enemy.alive) continue;

      var killed = enemy.takeDamage(hit.damage);
      var ecx = enemy.x + enemy.width / 2;
      this.damageNumbers.push(new DamageNumber(ecx, enemy.y - 10, hit.damage, hit.critical));

      // ゲージ加算
      this.skillSystem.addGauge(hit.damage);

      // ノックバック
      if (result.knockback && enemy.alive) {
        enemy.x += result.knockback;
      }

      if (killed) {
        this.player.addReward(enemy.exp, enemy.gold);
        var ups = LevelSystem.gainExp(this.player, enemy.exp);
        if (ups > 0) {
          this.levelUpEffects.push(
            new LevelUpEffect(this.player.x + this.player.width / 2, this.player.y)
          );
        }
        this._spawnDrops(enemy, ecx, enemy.y + enemy.height / 2);
        // 図鑑: 撃破登録
        if (this.bookSystem && enemy._bookId) {
          this.bookSystem.registerMonsterKill(enemy._bookId);
        }
      }
    }

    // ヒール数字
    if (result.heal > 0) {
      this.damageNumbers.push(
        new DamageNumber(this.player.x + this.player.width / 2, this.player.y - 10,
          '+' + result.heal, false)
      );
    }
  }

  _spawnDrops(enemy, x, y) {
    var drops = DropSystem.generateDrops(
      enemy, this.currentWorld, this.player.level,
      this.equipSystem, this.partySystem
    );
    for (var d = 0; d < drops.length; d++) {
      var drop = drops[d];
      this.allDrops.push(drop);
      // 図鑑登録
      if (this.bookSystem) {
        if (drop.type === 'equipment' && drop.item) {
          this.bookSystem.registerEquipment(drop.item.baseId, drop.item.rank, drop.item.upgradeLevel || 0);
        }
        if (drop.type === 'core') this.bookSystem.registerItem('core' + drop.rank.charAt(0).toUpperCase() + drop.rank.slice(1));
        if (drop.type === 'rerollStone') this.bookSystem.registerItem('rerollStone');
        if (drop.type === 'eraseStone') this.bookSystem.registerItem('eraseStone');
        if (drop.type === 'enhanceMat') this.bookSystem.registerItem('enhanceMat');
        if (drop.type === 'potion') this.bookSystem.registerItem('hpPotion');
      }
      if (drop.type === 'gold') continue;
      this.dropItems.push(new DropItem(x, y, drop));
      // レア演出
      var tier = DropSystem.getDropTier(drop);
      if (tier >= 2) {
        this.rareDropEffects.push(new RareDropEffect(tier));
      }
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
    // ステージクリア記録
    if (this.endResult === 'clear' && this.stageSelectScene) {
      this.stageSelectScene.markCleared(this.currentWorld, this.currentStage);
    }

    // 自動セーブ
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
    var groundY = CONFIG.BATTLE_GROUND_Y;

    // --- 背景: 空（ワールド別色） ---
    var worldColors = {
      1:  { skyTop: '#87ceeb', skyBot: '#d4eef5', gndTop: '#5a9c4f', gndBot: '#2d5a27' },
      2:  { skyTop: '#6bc5e8', skyBot: '#b8e8f0', gndTop: '#c2a86a', gndBot: '#8a7040' },
      3:  { skyTop: '#4a7a4a', skyBot: '#6a9a5a', gndTop: '#3a6a2a', gndBot: '#1a3a10' },
      4:  { skyTop: '#884422', skyBot: '#cc6633', gndTop: '#5a3020', gndBot: '#3a1a10' },
      5:  { skyTop: '#aaddee', skyBot: '#ddeeff', gndTop: '#aabbcc', gndBot: '#7799aa' },
      6:  { skyTop: '#ddcc88', skyBot: '#eeddaa', gndTop: '#ccaa55', gndBot: '#886633' },
      7:  { skyTop: '#221133', skyBot: '#332244', gndTop: '#2a1a3a', gndBot: '#110a1a' },
      8:  { skyTop: '#ccddff', skyBot: '#eeeeff', gndTop: '#bbccdd', gndBot: '#8899aa' },
      9:  { skyTop: '#331111', skyBot: '#552222', gndTop: '#3a1515', gndBot: '#1a0808' },
      10: { skyTop: '#111111', skyBot: '#222222', gndTop: '#1a1a1a', gndBot: '#0a0a0a' },
    };
    var wc = worldColors[this.currentWorld] || worldColors[1];

    var skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, wc.skyTop);
    skyGrad.addColorStop(1, wc.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY);

    // 遠景の山/建物（シルエット）
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(80, groundY - 60);
    ctx.lineTo(180, groundY - 30);
    ctx.lineTo(300, groundY - 80);
    ctx.lineTo(420, groundY - 20);
    ctx.lineTo(550, groundY - 55);
    ctx.lineTo(700, groundY - 35);
    ctx.lineTo(850, groundY - 70);
    ctx.lineTo(W, groundY - 25);
    ctx.lineTo(W, groundY);
    ctx.closePath();
    ctx.fill();

    // 雲（ワールド7以降は暗いので省略）
    if (this.currentWorld <= 6 || this.currentWorld === 8) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      var cloudOff = (Date.now() * 0.01) % (W + 200) - 100;
      ctx.beginPath();
      ctx.arc(cloudOff, 60, 25, 0, Math.PI * 2);
      ctx.arc(cloudOff + 20, 50, 30, 0, Math.PI * 2);
      ctx.arc(cloudOff + 45, 60, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloudOff + 400, 80, 20, 0, Math.PI * 2);
      ctx.arc(cloudOff + 420, 72, 25, 0, Math.PI * 2);
      ctx.arc(cloudOff + 440, 82, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 背景: 地面 ---
    var groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, wc.gndTop);
    groundGrad.addColorStop(1, wc.gndBot);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // 地面テクスチャ（草/砂のドット）
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var gi = 0; gi < 20; gi++) {
      var gx = (gi * 51 + 17) % W;
      var gy = groundY + 5 + (gi * 37) % (H - groundY - 10);
      ctx.fillRect(gx, gy, 2, 1);
    }

    // 地面ライン（グラデーション風）
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(W, groundY + 1);
    ctx.stroke();

    // --- 敵 ---
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].render(ctx);
    }

    // --- プレイヤー ---
    this.player.render(ctx);

    // --- ドロップアイテム ---
    for (var di = 0; di < this.dropItems.length; di++) {
      this.dropItems[di].render(ctx);
    }

    // --- スキルエフェクト ---
    if (this.skillSystem) {
      this.skillSystem.renderEffects(ctx);
    }

    // --- レアドロップ演出 ---
    for (var ri = 0; ri < this.rareDropEffects.length; ri++) {
      this.rareDropEffects[ri].render(ctx);
    }

    // --- ダメージ数字 ---
    for (var j = 0; j < this.damageNumbers.length; j++) {
      this.damageNumbers[j].render(ctx);
    }

    // --- レベルアップエフェクト ---
    for (var l = 0; l < this.levelUpEffects.length; l++) {
      this.levelUpEffects[l].render(ctx);
    }

    // --- UI: HPバー ---
    this._drawBar(ctx, 20, 20, 200, 18,
      this.player.hp, this.player.hpMax,
      '#22cc44', '#115522', 'HP');

    // --- UI: MPバー ---
    this._drawBar(ctx, 20, 46, 200, 18,
      this.player.mp, this.player.mpMax,
      '#3388ff', '#1a3366', 'MP');

    // --- UI: Lv + EXPバー ---
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Lv.' + this.player.level, 20, 80);

    var expBarX = 70;
    var expBarW = 150;
    var expBarH = 10;
    var expBarY = 75;
    var expRatio = this.player.level >= LevelSystem.MAX_LEVEL ? 1
      : this.player.totalExp / this.player.expToNext;

    ctx.fillStyle = '#333333';
    ctx.fillRect(expBarX, expBarY, expBarW, expBarH);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(expBarX, expBarY, expBarW * expRatio, expBarH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(expBarX, expBarY, expBarW, expBarH);

    ctx.font = '10px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    if (this.player.level >= LevelSystem.MAX_LEVEL) {
      ctx.fillText('MAX', expBarX + expBarW / 2, expBarY + expBarH / 2);
    } else {
      ctx.fillText(this.player.totalExp + '/' + this.player.expToNext,
        expBarX + expBarW / 2, expBarY + expBarH / 2);
    }

    // --- UI: バトルEXP / GOLD ---
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffee55';
    ctx.fillText('EXP: +' + this.player.battleExp, 20, 100);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('GOLD: +' + this.player.battleGold, 20, 118);

    // --- アクティブバフ表示 ---
    if (this.skillSystem && this.skillSystem.activeBuffs.length > 0) {
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      for (var b = 0; b < this.skillSystem.activeBuffs.length; b++) {
        var buff = this.skillSystem.activeBuffs[b];
        ctx.fillStyle = '#88ffaa';
        ctx.fillText(buff.stat.toUpperCase() + '+' + buff.percent + '% (' +
          Math.ceil(buff.remaining) + 's)', 20, 136 + b * 14);
      }
    }

    // --- パーティパッシブバフHUD ---
    if (this.partySystem) {
      var pDescs = this.partySystem.getPassiveBuffDescriptions();
      if (pDescs.length > 0) {
        var hudX = 240;
        var hudY = 20;
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (var pb = 0; pb < pDescs.length; pb++) {
          var pd = pDescs[pb];
          // 小さい色ドット + バフ名
          ctx.fillStyle = pd.color;
          ctx.beginPath();
          ctx.arc(hudX, hudY + pb * 16, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText(pd.desc, hudX + 10, hudY + pb * 16);
        }
      }
    }

    // --- ボスHPバー ---
    var boss = this._findBoss();
    if (boss) {
      this._renderBossHP(ctx, boss);
    }

    // --- ウェーブUI ---
    if (!boss) {
      this.waveManager.renderWaveUI(ctx);
    }

    this.waveManager.renderAnnounce(ctx);

    if (this.battleEnded) {
      this._renderEndText(ctx);
    }

    // --- スキルボタンUI ---
    if (this.skillSystem) {
      this.skillSystem.renderSkillUI(ctx, this.autoEnabled);
    }

    // --- 操作ヒント ---
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('[Z]物理攻撃 [X]魔法攻撃 [V]必殺技 [A]オート  [←→]移動 [↑]ジャンプ', W - 20, 20);

    // --- 仮想パッド ---
    this.inputManager.renderVirtualPad(ctx);
  }

  _renderBossHP(ctx, boss) {
    var cx = CONFIG.CANVAS_WIDTH / 2;
    var barW = 400;
    var barH = 22;
    var barX = cx - barW / 2;
    var barY = 38;
    var ratio = boss.hpMax > 0 ? boss.hp / boss.hpMax : 0;

    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6666';
    ctx.fillText(boss.bossName, cx, 22);

    ctx.fillStyle = '#441111';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(boss.hp + ' / ' + boss.hpMax, cx, barY + barH / 2);
  }

  _renderEndText(ctx) {
    var progress = Math.min(this.endTimer / 600, 1);
    var cx = CONFIG.CANVAS_WIDTH / 2;
    var cy = CONFIG.CANVAS_HEIGHT / 2 - 30;

    ctx.save();
    ctx.globalAlpha = progress;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;

    if (this.endResult === 'clear') {
      ctx.font = 'bold 56px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffd700';
      ctx.fillText('STAGE CLEAR!', cx, cy);
    } else {
      ctx.font = 'bold 56px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ff4444';
      ctx.fillText('GAME OVER', cx, cy);
    }

    ctx.restore();
  }

  _drawBar(ctx, x, y, w, h, current, max, fgColor, bgColor, label) {
    var ratio = max > 0 ? current / max : 0;
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fgColor;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 6, y + h / 2);
    ctx.textAlign = 'right';
    ctx.fillText(current + '/' + max, x + w - 6, y + h / 2);
  }

  onTap(x, y) {}

  exit() {
    this.inputManager.virtualPadEnabled = false;
  }
}
