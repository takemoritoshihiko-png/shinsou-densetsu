// ホーム画面シーン（RPG UI風）
class HomeScene {
  constructor(sceneManager, inputManager, player, partySystem) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.player = player;
    this.party = partySystem;
    this.elapsed = 0;

    // 8メニューボタン (2行×4列)
    var bw = 190, bh = 55, gx = 16, gy = 10;
    var row1y = 295, row2y = row1y + bh + gy, row3y = row2y + bh + gy;
    var sx = 40;
    this.buttons = [
      { label: '出撃',     icon: '剣',  scene: 'stageSelect', x: sx,                y: row1y, w: bw, h: bh, grad: ['#4a6a8a','#3a5070'] },
      { label: 'パーティ', icon: '人', scene: 'party',       x: sx+(bw+gx),        y: row1y, w: bw, h: bh, grad: ['#5a5a7a','#4a4a6a'] },
      { label: '装備',     icon: '盾',  scene: 'equip',       x: sx+(bw+gx)*2,      y: row1y, w: bw, h: bh, grad: ['#6a6a7a','#555568'] },
      { label: '強化',     icon: '鍛', scene: 'upgrade',     x: sx+(bw+gx)*3,      y: row1y, w: bw, h: bh, grad: ['#7a5a3a','#6a4a2a'] },
      { label: 'ガチャ',   icon: '★', scene: 'gacha',       x: sx,                y: row2y, w: bw, h: bh, grad: ['#7a6a3a','#6a5a2a'] },
      { label: 'ショップ', icon: '買', scene: 'shop',        x: sx+(bw+gx),        y: row2y, w: bw, h: bh, grad: ['#5a6a6a','#4a5a5a'] },
      { label: 'バッグ',   icon: '袋', scene: 'bag',         x: sx+(bw+gx)*2,      y: row2y, w: bw, h: bh, grad: ['#5a7a6a','#4a6a5a'] },
{ label: 'セーブ',   icon: '保',  scene: 'saveload_save', x: sx,           y: row3y, w: bw, h: bh, grad: ['#6a6a3a','#5a5a2a'] },
      { label: 'ロード',   icon: '読',  scene: 'saveload_load', x: sx+(bw+gx),   y: row3y, w: bw, h: bh, grad: ['#3a5a6a','#2a4a5a'] },
      { label: '設定',     icon: '歯',  scene: 'settings',      x: sx+(bw+gx)*2, y: row3y, w: bw, h: bh, grad: ['#5a5a5a','#4a4a4a'] },
    ];
    // セーブ/ロードはボタン配列の外
    this.saveBtn = null;
    this.loadBtn = null;
  }

  enter() {
    this.inputManager.virtualPadEnabled = false;
    this.elapsed = 0;
  }

  update(dt) { this.elapsed += dt; }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    var p = this.player;
    var jobData = ClassData.get(p.job);

    // === 背景 ===
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0e1e');
    bg.addColorStop(0.5, '#101428');
    bg.addColorStop(1, '#0a0e1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 背景の装飾（光の粒子）
    ctx.globalAlpha = 0.04;
    for (var pi = 0; pi < 20; pi++) {
      var px = (pi * 53 + this.elapsed * 0.008 * (pi % 3 + 1)) % W;
      var py = (pi * 37 + this.elapsed * 0.004 * (pi % 2 + 1)) % H;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // === タイトル ===
    ctx.save();
    ctx.font = 'bold 28px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,215,0,0.3)'; ctx.shadowBlur = 10;
    var tg = ctx.createLinearGradient(W/2-80, 0, W/2+80, 0);
    tg.addColorStop(0, '#ffd700'); tg.addColorStop(0.5, '#fff4a3'); tg.addColorStop(1, '#ffd700');
    ctx.fillStyle = tg;
    ctx.fillText('◇ 神装伝説 ◇', W / 2, 26);
    ctx.restore();

    // 区切り線
    ctx.strokeStyle = 'rgba(255,215,0,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2-180, 44); ctx.lineTo(W/2+180, 44); ctx.stroke();

    // === 左パネル: キャラ情報 ===
    var panelX = 30, panelY = 56, panelW = 420, panelH = 230;
    this._drawPanel(ctx, panelX, panelY, panelW, panelH);

    // Lvバッジ（紫の円）
    var badgeX = panelX + 55, badgeY = panelY + 55;
    ctx.fillStyle = '#2a1a4a';
    ctx.beginPath(); ctx.arc(badgeX, badgeY, 38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8866aa'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(badgeX, badgeY, 38, 0, Math.PI * 2); ctx.stroke();
    // 宝石装飾
    var gems = [[0,-40],[0,40],[-40,0],[40,0]];
    for (var gi = 0; gi < gems.length; gi++) {
      ctx.fillStyle = '#44ddff';
      ctx.beginPath(); ctx.arc(badgeX+gems[gi][0]*0.95, badgeY+gems[gi][1]*0.95, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Lv', badgeX, badgeY - 12);
    ctx.font = 'bold 28px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('' + p.level, badgeX, badgeY + 10);

    // 名前・職業
    var infoX = panelX + 110;
    ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.name, infoX, panelY + 28);

    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = jobData ? jobData.color : '#aaa';
    ctx.fillText(p.rarity + ' ' + (jobData ? jobData.name : p.job), infoX, panelY + 50);

    // EXPバー（装飾付き）
    var expX = infoX, expY = panelY + 65, expW = 280, expH = 18;
    var expR = p.level >= LevelSystem.MAX_LEVEL ? 1 : p.totalExp / p.expToNext;
    ctx.fillStyle = '#1a1a2e';
    this._rr(ctx, expX, expY, expW, expH, 4);
    var expGrad = ctx.createLinearGradient(expX, 0, expX + expW, 0);
    expGrad.addColorStop(0, '#22aadd'); expGrad.addColorStop(1, '#ffcc44');
    ctx.fillStyle = expGrad;
    if (expR > 0) ctx.fillRect(expX + 2, expY + 2, (expW - 4) * expR, expH - 4);
    ctx.strokeStyle = '#4488aa'; ctx.lineWidth = 1.5;
    ctx.strokeRect(expX, expY, expW, expH);
    ctx.font = '10px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(p.level >= LevelSystem.MAX_LEVEL ? 'MAX' : p.totalExp + '/' + p.expToNext, expX + expW / 2, expY + expH / 2);

    // ゴールド・素材・石
    var resY = panelY + 100;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700'; ctx.fillText('G ' + p.ownedGold + ' G', panelX + 20, resY);
    ctx.fillStyle = '#ff8844'; ctx.fillText('素材:' + (this.party ? (this.party.enhanceMaterials || 0) : 0), panelX + 160, resY);
    ctx.fillStyle = '#44aaff'; ctx.fillText('石:' + (p.equipSystem ? p.equipSystem.rerollStones : 0), panelX + 310, resY);

    // === 右パネル: ステータス ===
    var spX = 470, spY = 56, spW = 460, spH = 230;
    this._drawPanel(ctx, spX, spY, spW, spH);

    var stats = [
      { label: 'HP',   val: p.hpMax, color: '#ff4466', barMax: 2000 },
      { label: 'DEF',  val: p.def,   color: '#4488cc', barMax: 200 },
      { label: 'MP',   val: p.mpMax, color: '#4488ff', barMax: 200 },
      { label: 'ATK',  val: p.atk,   color: '#ff6644', barMax: 300 },
      { label: 'SPD',  val: p.spd,   color: '#44cc88', barMax: 200 },
      { label: 'CRIT', val: p.crit + '%', color: '#ffcc44', barMax: 30, isCrit: true },
    ];

    var col1x = spX + 20, col2x = spX + spW / 2 + 10;
    for (var si = 0; si < stats.length; si++) {
      var s = stats[si];
      var col = si % 2 === 0 ? col1x : col2x;
      var row = Math.floor(si / 2);
      var sy = spY + 20 + row * 70;

      // アイコン背景
      ctx.fillStyle = s.color + '33';
      ctx.strokeStyle = s.color + '66';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(col + 18, sy + 18, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // ラベル
      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left'; ctx.fillStyle = '#aaaaaa';
      ctx.fillText(s.label, col + 40, sy + 10);

      // 値
      ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText('' + s.val, col + 190, sy + 12);

      // ミニバー
      if (!s.isCrit) {
        var bw2 = 150, bh2 = 6, bx2 = col + 40, by2 = sy + 24;
        var ratio = Math.min((typeof s.val === 'number' ? s.val : 0) / s.barMax, 1);
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(bx2, by2, bw2, bh2);
        ctx.fillStyle = s.color; ctx.fillRect(bx2, by2, bw2 * ratio, bh2);
      } else {
        var critVal = parseFloat(s.val);
        var bw3 = 150, bh3 = 6, bx3 = col + 40, by3 = sy + 24;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(bx3, by3, bw3, bh3);
        ctx.fillStyle = s.color; ctx.fillRect(bx3, by3, bw3 * Math.min(critVal / s.barMax, 1), bh3);
      }
    }

    // === メニューボタン ===
    for (var i = 0; i < this.buttons.length; i++) {
      this._drawMenuBtn(ctx, this.buttons[i]);
    }
  }

  _drawPanel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(15,15,30,0.85)';
    this._rr(ctx, x, y, w, h, 10);
    ctx.strokeStyle = 'rgba(100,120,160,0.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    // 角の宝石
    ctx.fillStyle = '#44ddff';
    ctx.beginPath(); ctx.arc(x+6, y+6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w-6, y+6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+6, y+h-6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w-6, y+h-6, 2, 0, Math.PI*2); ctx.fill();
  }

  _drawMenuBtn(ctx, btn) {
    // ボタン背景グラデーション
    var g = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    g.addColorStop(0, btn.grad[0]); g.addColorStop(1, btn.grad[1]);
    ctx.fillStyle = g;
    this._rr(ctx, btn.x, btn.y, btn.w, btn.h, 8);

    // 枠
    ctx.strokeStyle = 'rgba(180,180,200,0.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    // 上部ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h / 3);

    // 角の宝石
    ctx.fillStyle = '#44ddff';
    ctx.beginPath(); ctx.arc(btn.x+6, btn.y+btn.h/2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(btn.x+btn.w-6, btn.y+btn.h/2, 2, 0, Math.PI*2); ctx.fill();

    // アイコン
    ctx.font = '24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(btn.icon, btn.x + 40, btn.y + btn.h / 2);

    // ラベル
    ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(btn.label, btn.x + btn.w / 2 + 15, btn.y + btn.h / 2);
  }

  onTap(x, y) {
    for (var i = 0; i < this.buttons.length; i++) {
      var b = this.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.scene === "saveload_save" || b.scene === "saveload_load") {
          var sl = this.sceneManager.scenes["saveload"];
          if (sl) sl.mode = b.scene === "saveload_save" ? "save" : "load";
          this.sceneManager.changeScene("saveload");
        } else {
          this.sceneManager.changeScene(b.scene);
        }
        return;
      }
    }
  }

  exit() {}

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}
