// セーブ/ロード画面
class SaveLoadScene {
  constructor(sceneManager, gameState) {
    this.sceneManager = sceneManager;
    this.gameState = gameState;
    this.mode = 'save'; // 'save' | 'load'
    this.backButton = { x: 20, y: 20, w: 100, h: 40 };
    this.message = '';
    this.messageTimer = 0;
    this.confirmSlot = -1;
  }

  enter(mode) {
    this.mode = mode || 'save';
    this.message = '';
    this.messageTimer = 0;
    this.confirmSlot = -1;
    SaveSystem._migrateOldSave();
  }

  update(dt) {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0c0a1e'); grad.addColorStop(1, '#12102a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // 戻る
    var bb = this.backButton;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    this._rr(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('< 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);

    // タイトル
    ctx.font = 'bold 30px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = this.mode === 'save' ? '#ffd700' : '#44aaff';
    ctx.fillText(this.mode === 'save' ? 'セーブ' : 'ロード', W / 2, 50);
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#888888';
    ctx.fillText(this.mode === 'save' ? 'スロットを選んでセーブ' : 'スロットを選んでロード', W / 2, 80);

    // スロット一覧
    var summaries = SaveSystem.getSlotSummaries();
    var slotW = 700, slotH = 100, startX = (W - slotW) / 2, startY = 110;

    for (var i = 0; i < SaveSystem.MAX_SLOTS; i++) {
      var sx = startX, sy = startY + i * (slotH + 15);
      var s = summaries[i];
      var isConfirm = this.confirmSlot === i;

      // スロット背景
      ctx.fillStyle = isConfirm ? 'rgba(255,200,50,0.1)' : (s ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)');
      ctx.strokeStyle = isConfirm ? '#ffd700' : (s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)');
      ctx.lineWidth = isConfirm ? 2 : 1;
      this._rr(ctx, sx, sy, slotW, slotH, 10);

      // スロット番号
      ctx.fillStyle = s ? '#ffd700' : '#555555';
      ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillText('SLOT ' + (i + 1), sx + 20, sy + 25);

      if (s) {
        // データあり
        var jobData = ClassData.get(s.job);
        var jobName = jobData ? jobData.name : s.job;
        var jobColor = jobData ? jobData.color : '#888';

        // キャラ情報
        ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(s.name, sx + 130, sy + 25);

        ctx.font = '14px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = jobColor;
        ctx.fillText(jobName, sx + 130, sy + 48);

        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Lv.' + s.level, sx + 230, sy + 48);

        ctx.fillStyle = '#ffaa44';
        ctx.fillText(s.gold + ' G', sx + 300, sy + 48);

        // 日時
        ctx.font = '12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#888888';
        ctx.fillText(s.date, sx + 130, sy + 70);

        // アクションボタン
        if (isConfirm) {
          // 確認状態
          ctx.fillStyle = 'rgba(255,200,50,0.15)';
          ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
          this._rr(ctx, sx + slotW - 240, sy + 20, 100, 40, 6);
          ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
          ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
          ctx.fillText('OK', sx + slotW - 190, sy + 40);

          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this._rr(ctx, sx + slotW - 120, sy + 20, 100, 40, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('キャンセル', sx + slotW - 70, sy + 40);

          ctx.font = '11px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
          ctx.fillText(this.mode === 'save' ? '上書きしますか？' : 'ロードしますか？', sx + slotW - 155, sy + 75);
        } else {
          var btnLabel = this.mode === 'save' ? '上書き保存' : 'ロード';
          var btnColor = this.mode === 'save' ? '#ffd700' : '#44aaff';
          ctx.fillStyle = btnColor + '22';
          ctx.strokeStyle = btnColor; ctx.lineWidth = 1.5;
          this._rr(ctx, sx + slotW - 140, sy + 25, 120, 36, 6);
          ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
          ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
          ctx.fillText(btnLabel, sx + slotW - 80, sy + 43);

          // 削除ボタン
          ctx.fillStyle = 'rgba(255,50,50,0.1)';
          ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
          this._rr(ctx, sx + slotW - 140, sy + 66, 120, 24, 4);
          ctx.font = '11px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#ff6666';
          ctx.fillText('削除', sx + slotW - 80, sy + 78);
        }
      } else {
        // 空スロット
        ctx.font = '16px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#555555';
        ctx.fillText('--- 空き ---', sx + 130, sy + 45);

        if (this.mode === 'save') {
          ctx.fillStyle = 'rgba(100,200,50,0.15)';
          ctx.strokeStyle = '#44cc44'; ctx.lineWidth = 1.5;
          this._rr(ctx, sx + slotW - 140, sy + 30, 120, 36, 6);
          ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
          ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
          ctx.fillText('新規セーブ', sx + slotW - 80, sy + 48);
        }
      }
    }

    // メッセージ
    if (this.message) {
      ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#44ff88';
      ctx.globalAlpha = Math.min(this.messageTimer / 400, 1);
      ctx.fillText(this.message, W / 2, H - 30);
      ctx.globalAlpha = 1;
    }
  }

  onTap(x, y) {
    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.sceneManager.changeScene('home');
      return;
    }

    var summaries = SaveSystem.getSlotSummaries();
    var W = CONFIG.CANVAS_WIDTH;
    var slotW = 700, slotH = 100, startX = (W - slotW) / 2, startY = 110;

    for (var i = 0; i < SaveSystem.MAX_SLOTS; i++) {
      var sx = startX, sy = startY + i * (slotH + 15);
      var s = summaries[i];

      if (this.confirmSlot === i) {
        // OK
        if (x >= sx + slotW - 240 && x <= sx + slotW - 140 && y >= sy + 20 && y <= sy + 60) {
          if (this.mode === 'save') {
            SaveSystem.save(this.gameState, i);
            this.message = 'スロット' + (i + 1) + 'にセーブしました';
            this.messageTimer = 1500;
          } else {
            var data = SaveSystem.load(i);
            if (data) {
              SaveSystem.applyLoad(data, this.gameState);
              this.message = 'スロット' + (i + 1) + 'をロードしました';
              this.messageTimer = 1500;
            }
          }
          this.confirmSlot = -1;
          return;
        }
        // キャンセル
        if (x >= sx + slotW - 120 && x <= sx + slotW - 20 && y >= sy + 20 && y <= sy + 60) {
          this.confirmSlot = -1;
          return;
        }
        return;
      }

      if (x < sx || x > sx + slotW || y < sy || y > sy + slotH) continue;

      if (s) {
        // メイン操作ボタン
        if (x >= sx + slotW - 140 && x <= sx + slotW - 20 && y >= sy + 25 && y <= sy + 61) {
          this.confirmSlot = i;
          return;
        }
        // 削除ボタン
        if (x >= sx + slotW - 140 && x <= sx + slotW - 20 && y >= sy + 66 && y <= sy + 90) {
          SaveSystem.deleteSave(i);
          this.message = 'スロット' + (i + 1) + 'を削除しました';
          this.messageTimer = 1500;
          return;
        }
      } else if (this.mode === 'save') {
        // 空スロットに新規セーブ
        if (x >= sx + slotW - 140 && x <= sx + slotW - 20 && y >= sy + 30 && y <= sy + 66) {
          SaveSystem.save(this.gameState, i);
          this.message = 'スロット' + (i + 1) + 'にセーブしました';
          this.messageTimer = 1500;
          return;
        }
      }
    }
  }

  exit() {}

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}
