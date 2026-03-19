// ウェーブ制の敵出現管理システム
class WaveManager {
  constructor(onSpawnEnemy, world, stage) {
    this.onSpawnEnemy = onSpawnEnemy;
    this.world = world || 1;
    this.stage = stage || 1;

    // ウェーブ定義（3通常 + 1ボス = 計4ウェーブ）
    this.waves = [];
    this.currentWave = 0;
    this.totalWaves = 4;

    // スポーン管理
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 800;   // ms
    this.spawnedCount = 0;
    this.totalEnemiesInWave = 0;

    // 状態
    this.state = 'idle'; // idle | spawning | waiting | interval | cleared
    this.intervalTimer = 0;
    this.intervalDuration = 1500;

    // ウェーブ開始演出
    this.announceTimer = 0;
    this.announceDuration = 1500;
    this.showAnnounce = false;
  }

  start() {
    this._buildWaves();
    this.currentWave = 0;
    this.state = 'interval';
    this.intervalTimer = 0;
    this.showAnnounce = true;
    this.announceTimer = 0;
  }

  _buildWaves() {
    this.waves = [];
    var world = this.world;
    var stage = this.stage;
    // ステージ内スケーリング(1〜5)
    var stageMul = 1 + (stage - 1) * 0.25;

    // MonsterDataからモンスター取得
    var monsterPool = MonsterData.getMonsters(world);

    // Wave 1〜3: 通常ウェーブ（3〜5体）
    for (var w = 0; w < 3; w++) {
      var count = 3 + Math.floor(Math.random() * 3);
      var enemies = [];
      for (var i = 0; i < count; i++) {
        var m = monsterPool.length > 0
          ? monsterPool[Math.floor(Math.random() * monsterPool.length)]
          : { hp: 30, atk: 5, matk: 0, def: 2, mdef: 0, spd: 50, exp: 10, gold: 5, spriteColor: '#cc4444' };
        enemies.push({
          hp: Math.floor(m.hp * stageMul),
          mp: 0,
          atk: Math.floor(m.atk * stageMul),
          matk: Math.floor((m.matk || 0) * stageMul),
          def: Math.floor(m.def * stageMul),
          mdef: Math.floor((m.mdef || 0) * stageMul),
          spd: m.spd || 50,
          crit: 0,
          exp: Math.floor(m.exp * stageMul),
          gold: Math.floor(m.gold * stageMul),
          spriteColor: m.spriteColor,
          monsterName: m.name,
        });
      }
      this.waves.push({ enemies: enemies, isBoss: false });
    }

    // Wave 4: ボス戦
    var bossData = MonsterData.getBoss(world);
    var fallbackBoss = { hp: 200, atk: 12, matk: 0, def: 8, mdef: 3, spd: 30, exp: 50, gold: 30, spriteColor: '#882222', name: 'ボス' };
    if (!bossData) bossData = fallbackBoss;
    if (stage < 5) {
      // 中ボス（雑魚の強化版）
      var midBoss = monsterPool.length > 0 ? monsterPool[monsterPool.length - 1] : bossData;
      var mbMul = stageMul * 1.5;
      this.waves.push({
        enemies: [{
          hp: Math.floor(midBoss.hp * mbMul * 3),
          mp: 0,
          atk: Math.floor(midBoss.atk * mbMul * 1.3),
          matk: Math.floor((midBoss.matk || 0) * mbMul * 1.3),
          def: Math.floor(midBoss.def * mbMul * 1.2),
          mdef: Math.floor((midBoss.mdef || 0) * mbMul),
          spd: midBoss.spd || 30,
          crit: 3,
          exp: Math.floor(midBoss.exp * mbMul * 3),
          gold: Math.floor(midBoss.gold * mbMul * 3),
          isBoss: true,
          bossName: 'W' + world + '-' + stage + ' 中ボス',
          spriteColor: midBoss.spriteColor,
          width: 70, height: 90,
          speed: 50,
          attackInterval: 1.8,
        }],
        isBoss: true,
      });
    } else if (bossData) {
      // ワールドボス
      this.waves.push({
        enemies: [{
          hp: bossData.hp,
          mp: 0,
          atk: bossData.atk,
          matk: bossData.matk || 0,
          def: bossData.def,
          mdef: bossData.mdef || 0,
          spd: bossData.spd || 30,
          crit: 5,
          exp: bossData.exp,
          gold: bossData.gold,
          isBoss: true,
          bossName: bossData.name,
          spriteColor: bossData.spriteColor,
          width: bossData.width || 80,
          height: bossData.height || 100,
          speed: bossData.speed || 50,
          attackInterval: bossData.attackInterval || 1.5,
        }],
        isBoss: true,
      });
    }

    this.totalWaves = this.waves.length;
  }

  update(dt, aliveEnemyCount) {
    switch (this.state) {

      case 'interval':
        this.intervalTimer += dt;
        this.announceTimer += dt;
        if (this.announceTimer >= this.announceDuration) {
          this.showAnnounce = false;
        }
        if (this.intervalTimer >= this.intervalDuration) {
          this._startWave();
        }
        break;

      case 'spawning':
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval && this.spawnQueue.length > 0) {
          this.spawnTimer = 0;
          var stats = this.spawnQueue.shift();
          stats.spawnOffset = Math.floor(Math.random() * 100);
          this.onSpawnEnemy(stats);
          this.spawnedCount++;
        }
        if (this.spawnQueue.length === 0) {
          this.state = 'waiting';
        }
        break;

      case 'waiting':
        if (aliveEnemyCount === 0) {
          this.currentWave++;
          if (this.currentWave >= this.totalWaves) {
            this.state = 'cleared';
            console.log('全ウェーブクリア!');
          } else {
            this.state = 'interval';
            this.intervalTimer = 0;
            this.showAnnounce = true;
            this.announceTimer = 0;
          }
        }
        break;

      case 'cleared':
        break;
    }
  }

  _startWave() {
    var wave = this.waves[this.currentWave];
    this.spawnQueue = wave.enemies.slice();
    this.spawnTimer = this.spawnInterval;
    this.spawnedCount = 0;
    this.totalEnemiesInWave = wave.enemies.length;
    this.state = 'spawning';
    console.log('Wave ' + (this.currentWave + 1) + ' 開始 (' + this.totalEnemiesInWave + '体)');
  }

  getWaveDisplay() {
    return Math.min(this.currentWave + 1, this.totalWaves);
  }

  isCleared() {
    return this.state === 'cleared';
  }

  isBossWave() {
    return this.currentWave < this.totalWaves &&
           this.waves[this.currentWave] &&
           this.waves[this.currentWave].isBoss;
  }

  renderAnnounce(ctx) {
    if (!this.showAnnounce) return;

    var progress = this.announceTimer / this.announceDuration;
    var alpha;
    if (progress < 0.2) {
      alpha = progress / 0.2;
    } else if (progress < 0.6) {
      alpha = 1;
    } else {
      alpha = 1 - (progress - 0.6) / 0.4;
    }

    var cx = CONFIG.CANVAS_WIDTH / 2;
    var cy = CONFIG.CANVAS_HEIGHT / 2 - 40;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;

    if (this.waves[this.currentWave] && this.waves[this.currentWave].isBoss) {
      ctx.font = 'bold 52px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ff4444';
      ctx.fillText('BOSS WAVE', cx, cy);
    } else {
      ctx.font = 'bold 52px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('WAVE ' + (this.currentWave + 1), cx, cy);
    }

    ctx.restore();
  }

  renderWaveUI(ctx) {
    var cx = CONFIG.CANVAS_WIDTH / 2;
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Wave ' + this.getWaveDisplay() + ' / ' + this.totalWaves, cx, 20);
  }
}
