// ステージ選択画面（ソシャゲ型マップ）
class StageSelectScene {
  constructor(sceneManager, player) {
    this.sceneManager = sceneManager;
    this.player = player;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };

    // ワールドデータ
    this.worlds = [
      { id: 1,  name: '草原',   color: '#44aa44', bgTop: '#88cc88', bgBot: '#2d5a27' },
      { id: 2,  name: '海岸',   color: '#44aadd', bgTop: '#88ccee', bgBot: '#1a5577' },
      { id: 3,  name: '森',     color: '#228833', bgTop: '#446633', bgBot: '#1a3318' },
      { id: 4,  name: '火山',   color: '#cc4422', bgTop: '#883322', bgBot: '#441111' },
      { id: 5,  name: '氷原',   color: '#66ccee', bgTop: '#aaddee', bgBot: '#335566' },
      { id: 6,  name: '砂漠',   color: '#ccaa44', bgTop: '#ddcc88', bgBot: '#665522' },
      { id: 7,  name: '暗黒城', color: '#8844aa', bgTop: '#442266', bgBot: '#1a0a2e' },
      { id: 8,  name: '天空',   color: '#ccccee', bgTop: '#ddeeff', bgBot: '#8899bb' },
      { id: 9,  name: '魔界',   color: '#aa2233', bgTop: '#551122', bgBot: '#220a0a' },
      { id: 10, name: '終焉',   color: '#ffd700', bgTop: '#222222', bgBot: '#0a0a0a' },
    ];

    // 進行状況: { 'W1-S1': { cleared: true, stars: 3 }, ... }
    this.progress = {};
    // W1-S1を初期解放
    this._ensureUnlocked(1, 1);

    this.selectedWorld = 1;
    this.worldScrollX = 0;
  }

  _stageKey(world, stage) {
    return 'W' + world + '-S' + stage;
  }

  _ensureUnlocked(world, stage) {
    var key = this._stageKey(world, stage);
    if (!this.progress[key]) {
      this.progress[key] = { cleared: false, stars: 0 };
    }
  }

  _isUnlocked(world, stage) {
    return !!this.progress[this._stageKey(world, stage)];
  }

  _isCleared(world, stage) {
    var p = this.progress[this._stageKey(world, stage)];
    return p && p.cleared;
  }

  // ステージクリア処理（リザルトから呼ばれる）
  markCleared(world, stage) {
    var key = this._stageKey(world, stage);
    if (!this.progress[key]) this.progress[key] = { cleared: false, stars: 0 };
    this.progress[key].cleared = true;
    this.progress[key].stars = 3;

    // 次のステージを解放
    if (stage < 5) {
      this._ensureUnlocked(world, stage + 1);
    } else if (world < 10) {
      // 次のワールドのステージ1を解放
      this._ensureUnlocked(world + 1, 1);
    }
  }

  // 推奨レベル（W1=1, W2=8, W3=15, W4=22, W5=30, W6=38, W7=46, W8=55, W9=65, W10=80）
  _getRecLevel(world, stage) {
    var worldBase = [0, 1, 8, 15, 22, 30, 38, 46, 55, 65, 80];
    var base = worldBase[world] || 1;
    var nextBase = worldBase[Math.min(world + 1, 10)] || base + 8;
    var stageStep = Math.floor((nextBase - base) / 5);
    return base + (stage - 1) * stageStep;
  }

  // ワールド別ストーリーテキスト
  WORLD_STORIES = {
    1: 'かつて平和だった王国に、魔物の脅威が迫っている。\n勇者よ、旅立ちの時だ。',
    2: '海岸に打ち上げられた古代の遺物。\n海の底から異形の者たちが現れ始めた。',
    3: '深い森の奥、エルフたちの結界が崩れ始めている。\n森に潜む闇を払え。',
    4: '灼熱の火山地帯。炎の精霊たちが暴走を始めた。\n地の底から甦る古の炎帝を止めろ。',
    5: '永久凍土に閉ざされた氷の大地。\n千年の眠りから覚めた氷姫が世界を凍てつかせる。',
    6: '果てなき砂漠に眠る古代王朝の遺跡。\n砂に封じられた王の呪いが解き放たれた。',
    7: '闇に包まれた暗黒城。かつての英雄が闇に堕ちた。\n彼を止められるのはお前だけだ。',
    8: '雲の上の天空城。天使たちが人間を裁こうとしている。\n神の試練を乗り越えよ。',
    9: '魔界の門が開かれた。魔王の軍勢が押し寄せる。\nこれが最後の戦いだ。',
    10: '世界の終焉。全てを飲み込む虚無が迫る。\n神装の力で、終焉の神を討て。',
  };

  enter() {
    this.storyText = null;
    this.storyTimer = 0;
  }

  update(dt) {
    if (this.storyText) {
      this.storyTimer += dt;
    }
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var wd = this.worlds[this.selectedWorld - 1];

    // 背景グラデーション（ワールド別）
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, wd.bgTop);
    grad.addColorStop(1, wd.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 半透明オーバーレイ
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    // 戻る
    var bb = this.backButton;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    this._rr(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);

    // ===== ワールド選択バー =====
    this._renderWorldBar(ctx, W);

    // ===== ステージノード =====
    this._renderStageNodes(ctx, W, H);

    // ワールド名
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = wd.color;
    ctx.fillText('W' + wd.id + ' ' + wd.name, W / 2, 100);

    // ストーリーオーバーレイ
    if (this.storyText) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, W, H);

      var alpha = Math.min(this.storyTimer / 500, 1);
      ctx.globalAlpha = alpha;

      ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('W' + (this._pendingWorld || 1) + ' ' + (this.worlds[(this._pendingWorld || 1) - 1].name), W / 2, 150);

      var lines = this.storyText.split('\n');
      ctx.font = '16px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#cccccc';
      for (var li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], W / 2, 210 + li * 30);
      }

      ctx.font = '14px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = 'rgba(255,255,255,' + ((Math.sin(this.storyTimer * 0.004) + 1) / 2) + ')';
      ctx.fillText('タップでスキップ', W / 2, 400);

      ctx.globalAlpha = 1;
    }
  }

  _renderWorldBar(ctx, W) {
    var barY = 55;
    var barH = 32;
    var tabW = 80;
    var gap = 6;
    var totalW = this.worlds.length * (tabW + gap) - gap;
    var startX = W / 2 - totalW / 2 + this.worldScrollX;

    // バー背景
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, barY - 4, W, barH + 8);

    for (var i = 0; i < this.worlds.length; i++) {
      var wd = this.worlds[i];
      var tx = startX + i * (tabW + gap);
      var isSel = this.selectedWorld === wd.id;
      var isUnlocked = this._isUnlocked(wd.id, 1);

      // ワールドがクリア済みか（最終ステージクリア）
      var allCleared = this._isCleared(wd.id, 5);

      ctx.fillStyle = isSel ? 'rgba(255,255,255,0.2)' :
                      isUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)';
      ctx.strokeStyle = isSel ? wd.color : (isUnlocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)');
      ctx.lineWidth = isSel ? 2 : 1;
      this._rr(ctx, tx, barY, tabW, barH, 5);

      ctx.font = (isSel ? 'bold ' : '') + '12px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isUnlocked ? (isSel ? '#ffffff' : '#aaaaaa') : '#444444';
      ctx.fillText('W' + wd.id, tx + tabW / 2, barY + barH / 2);

      // クリア済みチェック
      if (allCleared) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★', tx + tabW - 10, barY + 8);
      }
    }
  }

  _renderStageNodes(ctx, W, H) {
    var world = this.selectedWorld;
    var nodeR = 32;
    var startY = 160;
    var endY = H - 60;
    var cx = W / 2;

    // ステージ1〜5を蛇行配置
    var positions = [
      { x: cx - 140, y: startY },
      { x: cx + 100, y: startY + (endY - startY) * 0.2 },
      { x: cx - 80,  y: startY + (endY - startY) * 0.42 },
      { x: cx + 120, y: startY + (endY - startY) * 0.65 },
      { x: cx,       y: endY },
    ];

    // 接続線を先に描画
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    for (var p = 1; p < positions.length; p++) {
      ctx.lineTo(positions[p].x, positions[p].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // ノード描画
    for (var s = 0; s < 5; s++) {
      var stage = s + 1;
      var pos = positions[s];
      var unlocked = this._isUnlocked(world, stage);
      var cleared = this._isCleared(world, stage);
      var isBoss = stage === 5;
      var recLv = this._getRecLevel(world, stage);
      var wd = this.worlds[world - 1];

      // ノード円
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isBoss ? nodeR + 6 : nodeR, 0, Math.PI * 2);

      if (!unlocked) {
        ctx.fillStyle = 'rgba(40,40,40,0.8)';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 鍵アイコン
        ctx.font = '18px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#555555';
        ctx.fillText('🔒', pos.x, pos.y);
      } else if (cleared) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = wd.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 星
        ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★', pos.x, pos.y - 4);

        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(stage + '-' + (isBoss ? 'BOSS' : stage), pos.x, pos.y + 14);
      } else {
        // 未クリア（解放済み）
        var glowAlpha = 0.15 + Math.sin(Date.now() * 0.003) * 0.08;
        ctx.fillStyle = isBoss ? 'rgba(200,50,50,' + glowAlpha + ')' : 'rgba(100,200,255,' + glowAlpha + ')';
        ctx.fill();
        ctx.strokeStyle = isBoss ? '#ff4444' : wd.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // ステージ番号
        ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isBoss ? 'BOSS' : '' + stage, pos.x, pos.y - 2);

        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#cccccc';
        ctx.fillText('Lv.' + recLv, pos.x, pos.y + 16);
      }

      // ステージラベル（ノードの横）
      if (unlocked) {
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = s % 2 === 0 ? 'right' : 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        var labelX = s % 2 === 0 ? pos.x - nodeR - 12 : pos.x + nodeR + 12;
        ctx.fillText(isBoss ? 'ボス戦' : 'ステージ ' + stage, labelX, pos.y - 8);
        ctx.fillText('推奨Lv.' + recLv, labelX, pos.y + 6);
      }
    }
  }

  onTap(x, y) {
    // ストーリー表示中→スキップ
    if (this.storyText) {
      this.storyText = null;
      if (this._pendingWorld && this._pendingStage) {
        this._launchBattle(this._pendingWorld, this._pendingStage);
      }
      return;
    }

    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.sceneManager.changeScene('home');
      return;
    }

    // ワールド選択バー
    var barY = 55, barH = 32, tabW = 80, gap = 6;
    var W = CONFIG.CANVAS_WIDTH;
    var totalW = this.worlds.length * (tabW + gap) - gap;
    var startX = W / 2 - totalW / 2 + this.worldScrollX;

    for (var i = 0; i < this.worlds.length; i++) {
      var tx = startX + i * (tabW + gap);
      if (x >= tx && x <= tx + tabW && y >= barY && y <= barY + barH) {
        if (this._isUnlocked(this.worlds[i].id, 1)) {
          this.selectedWorld = this.worlds[i].id;
        }
        return;
      }
    }

    // ステージノードタップ
    var world = this.selectedWorld;
    var H = CONFIG.CANVAS_HEIGHT;
    var cx = W / 2;
    var startY = 160;
    var endY = H - 60;
    var positions = [
      { x: cx - 140, y: startY },
      { x: cx + 100, y: startY + (endY - startY) * 0.2 },
      { x: cx - 80,  y: startY + (endY - startY) * 0.42 },
      { x: cx + 120, y: startY + (endY - startY) * 0.65 },
      { x: cx,       y: endY },
    ];

    for (var s = 0; s < 5; s++) {
      var pos = positions[s];
      var stage = s + 1;
      var dx = x - pos.x;
      var dy = y - pos.y;
      var hitR = stage === 5 ? 38 : 32;

      if (dx * dx + dy * dy <= hitR * hitR) {
        if (this._isUnlocked(world, stage) && !this._isCleared(world, stage)) {
          this._startBattle(world, stage);
        } else if (this._isCleared(world, stage)) {
          // クリア済みでも再挑戦可能
          this._startBattle(world, stage);
        }
        return;
      }
    }
  }

  _startBattle(world, stage) {
    // ステージ1で初回アクセス時にストーリー表示
    if (stage === 1 && !this._isCleared(world, 1) && this.WORLD_STORIES[world]) {
      this.storyText = this.WORLD_STORIES[world];
      this.storyTimer = 0;
      this._pendingWorld = world;
      this._pendingStage = stage;
      return;
    }
    this._launchBattle(world, stage);
  }

  _launchBattle(world, stage) {
    var battleScene = this.sceneManager.scenes['battle'];
    battleScene.currentWorld = world;
    battleScene.currentStage = stage;
    battleScene.stageSelectScene = this;
    this.sceneManager.changeScene('battle');
  }

  exit() {}

  _rr(ctx, x, y, w, h, r) {
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
    ctx.stroke();
  }
}
