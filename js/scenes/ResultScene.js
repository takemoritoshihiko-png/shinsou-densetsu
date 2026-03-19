// リザルト画面シーン
class ResultScene {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.cleared = false;
    this.exp = 0;
    this.gold = 0;
    this.drops = [];
    this.elapsed = 0;
    this.homeButton = { x: 380, y: 490, w: 200, h: 45 };
    this.scrollY = 0;
  }

  setResult(data) {
    this.cleared = data.cleared;
    this.exp = data.exp;
    this.gold = data.gold;
    this.drops = data.drops || [];
  }

  enter() {
    this.elapsed = 0;
    this.scrollY = 0;
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
    if (this.cleared) {
      grad.addColorStop(0, '#0c1445');
      grad.addColorStop(1, '#1a0a3e');
    } else {
      grad.addColorStop(0, '#1a0505');
      grad.addColorStop(1, '#0a0a1e');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var fadeIn = Math.min(this.elapsed / 500, 1);
    ctx.save();
    ctx.globalAlpha = fadeIn;

    // タイトル
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 40px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = this.cleared ? '#ffd700' : '#ff4444';
    ctx.fillText(this.cleared ? 'ステージクリア！' : 'ステージ失敗...', cx, 45);
    ctx.shadowBlur = 0;

    // 区切り線
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 250, 75);
    ctx.lineTo(cx + 250, 75);
    ctx.stroke();

    // EXP / GOLD（左上コンパクト）
    var countP = Math.max(0, Math.min((this.elapsed - 300) / 800, 1));
    ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ffee55';
    ctx.fillText('EXP: +' + Math.floor(this.exp * countP), 40, 100);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('GOLD: +' + Math.floor(this.gold * countP), 230, 100);

    // --- ドロップアイテム一覧 ---
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ドロップアイテム', 40, 135);

    // ドロップをゴールド以外でフィルタ
    var displayDrops = [];
    for (var i = 0; i < this.drops.length; i++) {
      if (this.drops[i].type !== 'gold') displayDrops.push(this.drops[i]);
    }

    var listX = 30;
    var listY = 155;
    var listW = W - 60;
    var listH = 310;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    if (displayDrops.length === 0) {
      ctx.font = '14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('ドロップなし', cx, listY + 40);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(listX, listY, listW, listH);
      ctx.clip();

      // 装備を先に、その他を後に
      var equipDrops = [];
      var otherDrops = [];
      for (var d = 0; d < displayDrops.length; d++) {
        if (displayDrops[d].type === 'equipment') {
          equipDrops.push(displayDrops[d]);
        } else {
          otherDrops.push(displayDrops[d]);
        }
      }
      var sorted = equipDrops.concat(otherDrops);

      var itemH = 36;
      var maxCols = 2;
      var colW = (listW - 20) / maxCols;

      for (var s = 0; s < sorted.length; s++) {
        var drop = sorted[s];
        var col = s % maxCols;
        var row = Math.floor(s / maxCols);
        var ix = listX + 10 + col * colW;
        var iy = listY + 8 + row * itemH - this.scrollY;

        if (iy + itemH < listY || iy > listY + listH) continue;

        var dColor = DropSystem.getDropColor(drop);
        var dName = DropSystem.getDropName(drop);

        // ドットアイコン
        ctx.beginPath();
        ctx.arc(ix + 8, iy + itemH / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = dColor;
        ctx.fill();

        // 名前
        ctx.font = '13px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'left';
        ctx.fillStyle = dColor;
        ctx.fillText(dName, ix + 20, iy + 12);

        // 装備の詳細（レア以上）
        if (drop.type === 'equipment' && drop.item) {
          var item = drop.item;
          var tier = DropSystem.getDropTier(drop);
          ctx.font = '10px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#888888';
          var detail = 'スロット' + (item.slots ? item.slots.length : 0);
          if (item.innateTraits && item.innateTraits.length > 0) {
            detail += ' 特性' + item.innateTraits.length;
          }
          ctx.fillText(detail, ix + 20, iy + 27);

          // レア以上は特性プレビュー
          if (tier >= 2 && item.slots) {
            var prev = [];
            for (var st = 0; st < item.slots.length && st < 3; st++) {
              if (item.slots[st]) {
                var sd = SlotTraitData.getDef(item.slots[st].id);
                if (sd) prev.push(sd.label + '+' + item.slots[st].value);
              }
            }
            if (prev.length > 0) {
              ctx.fillStyle = '#666666';
              ctx.fillText(prev.join(' '), ix + 140, iy + 27);
            }
          }
        }
      }

      ctx.restore();
    }

    // ホームに戻るボタン
    var btn = this.homeButton;
    var btnVisible = this.elapsed > 1200;
    if (btnVisible) {
      ctx.globalAlpha = Math.min((this.elapsed - 1200) / 400, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
      ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ホームに戻る', btn.x + btn.w / 2, btn.y + btn.h / 2);
    }

    ctx.restore();
  }

  onTap(x, y) {
    if (this.elapsed < 1200) return;
    var btn = this.homeButton;
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      this.sceneManager.changeScene('home');
    }
  }

  exit() {}

  _roundRect(ctx, x, y, w, h, r) {
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
