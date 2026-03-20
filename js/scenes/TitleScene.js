// タイトル画面シーン
class TitleScene {
  constructor(sceneManager, onNewGame, onContinue) {
    this.sceneManager = sceneManager;
    this.onNewGame = onNewGame;
    this.onContinue = onContinue;
    this.elapsed = 0;

    this.newGameBtn   = { x: 330, y: 380, w: 300, h: 50 };
    this.continueBtn  = { x: 330, y: 445, w: 300, h: 50 };

    // 背景画像プリロード
    this._bgImg = new Image();
    this._bgImg.src = './img/title_bg.png';
    this._bgLoaded = false;
    var self = this;
    this._bgImg.onload = function() { self._bgLoaded = true; };
  }

  enter() {
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var cx = W / 2;

    // 背景画像
    if (this._bgLoaded) {
      // キャンバス全体に画像をカバー表示
      var img = this._bgImg;
      var imgRatio = img.width / img.height;
      var canvasRatio = W / H;
      var sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      // 暗めのオーバーレイ（テキストを読みやすく）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, W, H);
    } else {
      // フォールバック背景
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(1, '#0a1628');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // タイトル
    ctx.save();
    ctx.font = 'bold 64px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 影（読みやすさ）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    var goldGrad = ctx.createLinearGradient(cx - 150, 140, cx + 150, 200);
    goldGrad.addColorStop(0, '#ffd700');
    goldGrad.addColorStop(0.5, '#fff4a3');
    goldGrad.addColorStop(1, '#ffd700');
    ctx.fillStyle = goldGrad;
    ctx.fillText('神装伝説', cx, 160);
    ctx.restore();

    // サブタイトル
    ctx.save();
    ctx.font = '24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('- しんそうでんせつ -', cx, 225);
    ctx.restore();

    // バージョン
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('v1.0', cx, 260);

    // フェードイン（ボタン）
    var btnAlpha = Math.min(Math.max((this.elapsed - 500) / 500, 0), 1);
    ctx.globalAlpha = btnAlpha;

    var hasSave = SaveSystem.hasSaveData();

    // はじめから
    var nb = this.newGameBtn;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    this._rr(ctx, nb.x, nb.y, nb.w, nb.h, 10);
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('はじめから', nb.x + nb.w / 2, nb.y + nb.h / 2);

    // つづきから
    var cb = this.continueBtn;
    ctx.fillStyle = hasSave ? 'rgba(0,0,0,0.5)' : 'rgba(30,30,30,0.5)';
    ctx.strokeStyle = hasSave ? 'rgba(100,200,255,0.6)' : 'rgba(80,80,80,0.4)';
    ctx.lineWidth = 2;
    this._rr(ctx, cb.x, cb.y, cb.w, cb.h, 10);
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = hasSave ? '#ffffff' : '#555555';
    ctx.fillText('つづきから', cb.x + cb.w / 2, cb.y + cb.h / 2);

    if (hasSave) {
      try {
        var summaries = SaveSystem.getSlotSummaries();
        for (var si = 0; si < summaries.length; si++) {
          if (summaries[si]) {
            var s = summaries[si];
            ctx.font = '11px ' + CONFIG.FONT_FAMILY;
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('Lv.' + s.level + '  ' + s.date, cb.x + cb.w / 2, cb.y + cb.h + 14);
            break;
          }
        }
      } catch (e) {}
    }

    ctx.globalAlpha = 1;
  }

  onTap(x, y) {
    if (this.elapsed < 500) return;

    var nb = this.newGameBtn;
    if (x >= nb.x && x <= nb.x + nb.w && y >= nb.y && y <= nb.y + nb.h) {
      SoundSystem.resume();
      if (this.onNewGame) this.onNewGame();
      this.sceneManager.changeScene('home');
      return;
    }

    var cb = this.continueBtn;
    if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
      SoundSystem.resume();
      if (SaveSystem.hasSaveData() && this.onContinue) {
        this.onContinue();
        this.sceneManager.changeScene('home');
      }
      return;
    }
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
