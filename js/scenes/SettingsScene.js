// 設定画面
class SettingsScene {
  constructor(sceneManager, gameState) {
    this.sceneManager = sceneManager;
    this.gameState = gameState;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };
    this.deleteBtn = { x: 330, y: 400, w: 300, h: 45 };
    this.confirmDialog = null;

    // スライダー
    this.bgmSlider = { x: 350, y: 160, w: 300, h: 20 };
    this.seSlider  = { x: 350, y: 220, w: 300, h: 20 };
  }

  enter() {
    this.confirmDialog = null;
  }

  update(dt) {}

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0c0a1e');
    grad.addColorStop(1, '#12102a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 戻る
    var bb = this.backButton;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    this._rr(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);

    // タイトル
    ctx.font = 'bold 28px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('設定', W / 2, 80);

    // 区切り線
    ctx.strokeStyle = 'rgba(255,215,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 150, 110);
    ctx.lineTo(W / 2 + 150, 110);
    ctx.stroke();

    // BGM音量
    ctx.font = '16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('BGM音量', 200, this.bgmSlider.y + this.bgmSlider.h / 2);
    this._renderSlider(ctx, this.bgmSlider, this.gameState.settings.bgmVolume || 0.7);

    // SE音量
    ctx.fillText('SE音量', 200, this.seSlider.y + this.seSlider.h / 2);
    this._renderSlider(ctx, this.seSlider, this.gameState.settings.seVolume || 0.8);

    // 注記
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555555';
    ctx.fillText('※ 音声は今後のアップデートで実装予定', W / 2, 280);

    // バージョン情報
    ctx.fillStyle = '#444444';
    ctx.fillText('神装伝説 v1.0 | Canvas 960×540', W / 2, 340);
    ctx.fillText('セーブデータ: LocalStorage', W / 2, 360);

    // セーブデータ削除
    var db = this.deleteBtn;
    ctx.fillStyle = 'rgba(255,50,50,0.1)';
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    this._rr(ctx, db.x, db.y, db.w, db.h, 8);
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('セーブデータを削除', db.x + db.w / 2, db.y + db.h / 2);

    // 確認ダイアログ
    if (this.confirmDialog) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);

      var dx = 230, dy = 180, dw = 500, dh = 180;
      ctx.fillStyle = '#1a1a3a';
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      this._rr(ctx, dx, dy, dw, dh, 10);

      ctx.font = '16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('セーブデータを削除しますか？', dx + dw / 2, dy + 40);
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ff8888';
      ctx.fillText('この操作は取り消せません', dx + dw / 2, dy + 65);

      ctx.fillStyle = 'rgba(255,50,50,0.2)';
      ctx.strokeStyle = '#ff4444';
      this._rr(ctx, dx + 80, dy + 110, 140, 40, 8);
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('削除する', dx + 150, dy + 130);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      this._rr(ctx, dx + 280, dy + 110, 140, 40, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('キャンセル', dx + 350, dy + 130);
    }
  }

  _renderSlider(ctx, slider, value) {
    var x = slider.x, y = slider.y, w = slider.w, h = slider.h;
    // トラック
    ctx.fillStyle = '#1a1a2e';
    this._rr(ctx, x, y + h / 2 - 4, w, 8, 4);
    // 値
    ctx.fillStyle = '#ffd700';
    var valW = w * Math.max(0, Math.min(value, 1));
    if (valW > 4) {
      ctx.fillRect(x + 2, y + h / 2 - 3, valW - 4, 6);
    }
    // ツマミ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + valW, y + h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    // 値表示
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(Math.round(value * 100) + '%', x + w + 15, y + h / 2);
  }

  onTap(x, y) {
    if (this.confirmDialog) {
      var dx = 230, dy = 180;
      if (x >= dx + 80 && x <= dx + 220 && y >= dy + 110 && y <= dy + 150) {
        SaveSystem.deleteSave();
        this.confirmDialog = null;
        this.sceneManager.changeScene('title');
        return;
      }
      if (x >= dx + 280 && x <= dx + 420 && y >= dy + 110 && y <= dy + 150) {
        this.confirmDialog = null;
        return;
      }
      return;
    }

    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      if (window._saveGame) window._saveGame();
      this.sceneManager.changeScene('home');
      return;
    }

    // スライダー操作
    this._handleSlider(x, y, this.bgmSlider, 'bgmVolume');
    this._handleSlider(x, y, this.seSlider, 'seVolume');

    // 削除
    var db = this.deleteBtn;
    if (x >= db.x && x <= db.x + db.w && y >= db.y && y <= db.y + db.h) {
      this.confirmDialog = true;
    }
  }

  _handleSlider(tapX, tapY, slider, settingKey) {
    if (tapX >= slider.x - 10 && tapX <= slider.x + slider.w + 10 &&
        tapY >= slider.y - 5 && tapY <= slider.y + slider.h + 5) {
      var val = (tapX - slider.x) / slider.w;
      this.gameState.settings[settingKey] = Math.max(0, Math.min(1, val));
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
