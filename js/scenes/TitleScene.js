// タイトル画面シーン
class TitleScene {
  constructor(sceneManager, onNewGame, onContinue) {
    this.sceneManager = sceneManager;
    this.onNewGame = onNewGame;     // function() — 新規ゲーム開始
    this.onContinue = onContinue;   // function() — セーブデータロード
    this.elapsed = 0;

    this.newGameBtn   = { x: 330, y: 360, w: 300, h: 50 };
    this.continueBtn  = { x: 330, y: 420, w: 300, h: 50 };
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

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, '#0a1628');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // タイトル
    ctx.save();
    ctx.font = 'bold 64px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var goldGrad = ctx.createLinearGradient(cx - 150, 160, cx + 150, 220);
    goldGrad.addColorStop(0, '#ffd700');
    goldGrad.addColorStop(0.5, '#fff4a3');
    goldGrad.addColorStop(1, '#ffd700');
    ctx.fillStyle = goldGrad;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText('神装伝説', cx, 170);
    ctx.restore();

    // サブタイトル
    ctx.font = '24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('- しんそうでんせつ -', cx, 240);

    // バージョン
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#555555';
    ctx.fillText('v1.0', cx, 280);

    // フェードイン（ボタン）
    var btnAlpha = Math.min(Math.max((this.elapsed - 500) / 500, 0), 1);
    ctx.globalAlpha = btnAlpha;

    var hasSave = SaveSystem.hasSaveData();

    // はじめから
    var nb = this.newGameBtn;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    this._rr(ctx, nb.x, nb.y, nb.w, nb.h, 10);
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('はじめから', nb.x + nb.w / 2, nb.y + nb.h / 2);

    // つづきから
    var cb = this.continueBtn;
    ctx.fillStyle = hasSave ? 'rgba(100,200,255,0.12)' : 'rgba(50,50,50,0.3)';
    ctx.strokeStyle = hasSave ? '#44aaff' : '#444444';
    ctx.lineWidth = 2;
    this._rr(ctx, cb.x, cb.y, cb.w, cb.h, 10);
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = hasSave ? '#ffffff' : '#555555';
    ctx.fillText('つづきから', cb.x + cb.w / 2, cb.y + cb.h / 2);

    if (hasSave) {
      // セーブ日時表示
      try {
        var raw = localStorage.getItem(SaveSystem.SAVE_KEY);
        if (raw) {
          var sd = JSON.parse(raw);
          if (sd.timestamp) {
            var d = new Date(sd.timestamp);
            var dateStr = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
              ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
            ctx.font = '11px ' + CONFIG.FONT_FAMILY;
            ctx.fillStyle = '#888888';
            ctx.fillText('Lv.' + (sd.player ? sd.player.level : '?') + '  ' + dateStr, cb.x + cb.w / 2, cb.y + cb.h + 14);
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
      if (this.onNewGame) this.onNewGame();
      this.sceneManager.changeScene('home');
      return;
    }

    var cb = this.continueBtn;
    if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
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
