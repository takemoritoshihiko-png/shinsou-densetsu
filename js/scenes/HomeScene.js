// ホーム画面シーン（RPG UI風 v3）
class HomeScene {
  constructor(sceneManager, inputManager, player, partySystem) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.player = player;
    this.party = partySystem;
    this.elapsed = 0;

    var W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    // メニューボタン 2行×4列
    var bw = 200, bh = 58, gx = 12, gy = 8;
    var row1y = 300, row2y = row1y + bh + gy, row3y = row2y + bh + gy;
    var sx = 30;
    this.buttons = [
      { label: '出撃',     icon: 'X',  scene: 'stageSelect', x: sx,              y: row1y, w: bw, h: bh, c1: '#3a5a80', c2: '#2a4060' },
      { label: 'パーティ', icon: 'P',  scene: 'party',       x: sx+(bw+gx),      y: row1y, w: bw, h: bh, c1: '#4a4a70', c2: '#3a3a58' },
      { label: '装備',     icon: 'E',  scene: 'equip',       x: sx+(bw+gx)*2,    y: row1y, w: bw, h: bh, c1: '#5a5a6a', c2: '#484858' },
      { label: '強化',     icon: 'U',  scene: 'upgrade',     x: sx+(bw+gx)*3,    y: row1y, w: bw, h: bh, c1: '#6a4a2a', c2: '#5a3a1a' },
      { label: 'ガチャ',   icon: 'G',  scene: 'gacha',       x: sx,              y: row2y, w: bw, h: bh, c1: '#6a5a2a', c2: '#5a4a1a' },
      { label: 'ショップ', icon: 'S',  scene: 'shop',        x: sx+(bw+gx),      y: row2y, w: bw, h: bh, c1: '#4a5a5a', c2: '#3a4a4a' },
      { label: 'バッグ',   icon: 'B',  scene: 'bag',         x: sx+(bw+gx)*2,    y: row2y, w: bw, h: bh, c1: '#4a6a5a', c2: '#3a5a4a' },
      { label: '設定',     icon: 'O',  scene: 'settings',    x: sx+(bw+gx)*3,    y: row2y, w: bw, h: bh, c1: '#4a4a4a', c2: '#3a3a3a' },
      // 3行目
      { label: 'セーブ',   icon: 'W',  scene: 'saveload_save', x: sx,            y: row3y, w: bw, h: bh, c1: '#5a5a30', c2: '#4a4a20' },
      { label: 'ロード',   icon: 'R',  scene: 'saveload_load', x: sx+(bw+gx),    y: row3y, w: bw, h: bh, c1: '#305a6a', c2: '#204a5a' },
    ];
  }

  enter() { this.inputManager.virtualPadEnabled = false; this.elapsed = 0; }
  update(dt) { this.elapsed += dt; }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    var p = this.player;
    var jobData = ClassData.get(p.job);
    var jc = jobData ? jobData.color : '#aaa';
    var jn = jobData ? jobData.name : p.job;

    // === 背景 ===
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#080c1a'); bg.addColorStop(0.5, '#0e1228'); bg.addColorStop(1, '#080c1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // 背景パーティクル
    ctx.globalAlpha = 0.03;
    for (var pi = 0; pi < 25; pi++) {
      var px = (pi * 41 + this.elapsed * 0.006 * (pi % 3 + 1)) % W;
      var py = (pi * 31 + this.elapsed * 0.003 * (pi % 2 + 1)) % H;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // === タイトル ===
    ctx.save();
    ctx.font = 'bold 26px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tg = ctx.createLinearGradient(W/2-80, 0, W/2+80, 0);
    tg.addColorStop(0, '#c8a030'); tg.addColorStop(0.5, '#fff4a3'); tg.addColorStop(1, '#c8a030');
    ctx.fillStyle = tg;
    ctx.shadowColor = 'rgba(255,200,0,0.2)'; ctx.shadowBlur = 8;
    ctx.fillText('-- 神装伝説 --', W / 2, 22);
    ctx.restore();

    // 区切り線
    ctx.strokeStyle = 'rgba(200,180,100,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2-200, 40); ctx.lineTo(W/2+200, 40); ctx.stroke();

    // === 左パネル: キャラ情報 ===
    var lpx = 25, lpy = 50, lpw = 430, lph = 230;
    this._panel(ctx, lpx, lpy, lpw, lph);

    // Lvバッジ (装飾付き円)
    var bx = lpx + 60, by = lpy + 60;
    // 外枠装飾
    ctx.strokeStyle = '#6a5a8a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx, by, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#8a7aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, 46, 0, Math.PI * 2); ctx.stroke();
    // 内円
    ctx.fillStyle = '#1a1030';
    ctx.beginPath(); ctx.arc(bx, by, 40, 0, Math.PI * 2); ctx.fill();
    // 4つの宝石
    var gems = [[0,-46],[0,46],[-46,0],[46,0]];
    for (var gi = 0; gi < 4; gi++) {
      ctx.fillStyle = '#44ccee';
      ctx.beginPath(); ctx.arc(bx + gems[gi][0], by + gems[gi][1], 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(68,204,238,0.3)';
      ctx.beginPath(); ctx.arc(bx + gems[gi][0], by + gems[gi][1], 6, 0, Math.PI * 2); ctx.fill();
    }
    // Lv テキスト
    ctx.font = '12px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#999'; ctx.fillText('Lv', bx, by - 14);
    ctx.font = 'bold 30px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#fff'; ctx.fillText('' + p.level, bx, by + 8);

    // 名前+職業
    var ix = lpx + 120;
    ctx.font = 'bold 20px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.fillText(p.name, ix, lpy + 28);
    ctx.font = '14px "Noto Sans JP", sans-serif';
    ctx.fillStyle = jc; ctx.fillText(p.rarity + ' ' + jn, ix, lpy + 50);

    // EXPバー (装飾枠)
    var ebx = ix, eby = lpy + 65, ebw = 285, ebh = 20;
    var expR = p.level >= 99 ? 1 : p.totalExp / p.expToNext;
    // 枠
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(ebx, eby, ebw, ebh);
    ctx.strokeStyle = '#4488aa'; ctx.lineWidth = 1.5;
    ctx.strokeRect(ebx, eby, ebw, ebh);
    // バー
    var eg = ctx.createLinearGradient(ebx, 0, ebx + ebw, 0);
    eg.addColorStop(0, '#22aacc'); eg.addColorStop(1, '#ddaa33');
    ctx.fillStyle = eg;
    if (expR > 0) ctx.fillRect(ebx + 2, eby + 2, (ebw - 4) * expR, ebh - 4);
    // 宝石装飾(左右端)
    ctx.fillStyle = '#44ccee';
    ctx.beginPath(); ctx.arc(ebx, eby + ebh/2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ebx + ebw, eby + ebh/2, 3, 0, Math.PI*2); ctx.fill();
    // EXPテキスト
    ctx.font = '10px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(p.level >= 99 ? 'MAX' : p.totalExp + '/' + p.expToNext, ebx + ebw/2, eby + ebh/2);

    // ゴールド/素材/石 (丸アイコン+テキスト)
    var ry = lpy + 105;
    this._resIcon(ctx, lpx + 40, ry, '#ffd700', 'G'); ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px "Noto Sans JP", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(p.ownedGold + ' G', lpx + 58, ry);

    this._resIcon(ctx, lpx + 175, ry, '#ff8844', 'M'); ctx.fillStyle = '#ff8844';
    ctx.fillText('素材:' + (this.party ? (this.party.enhanceMaterials || 0) : 0), lpx + 193, ry);

    this._resIcon(ctx, lpx + 320, ry, '#44aaff', 'S'); ctx.fillStyle = '#44aaff';
    ctx.fillText('石:' + (p.equipSystem ? p.equipSystem.rerollStones : 0), lpx + 338, ry);

    // === 右パネル: ステータス ===
    var rpx = 475, rpy = 50, rpw = 460, rph = 230;
    this._panel(ctx, rpx, rpy, rpw, rph);

    var stats = [
      { l: 'HP',   v: p.hpMax,       c: '#ee3355', max: 2000 },
      { l: 'ATK',  v: p.atk,         c: '#ee6633', max: 300 },
      { l: 'DEF',  v: p.def,         c: '#3366cc', max: 200 },
      { l: 'SPD',  v: p.spd,         c: '#33aa66', max: 200 },
      { l: 'MP',   v: p.mpMax,       c: '#3388ee', max: 200 },
      { l: 'CRIT', v: p.crit + '%',  c: '#eeaa33', max: 30, crit: true },
    ];

    for (var si = 0; si < 6; si++) {
      var st = stats[si];
      var col = si % 2, row = Math.floor(si / 2);
      var stx = rpx + 20 + col * 225;
      var sty = rpy + 20 + row * 70;

      // アイコン背景 (四角+色付き)
      ctx.fillStyle = st.c + '22';
      ctx.strokeStyle = st.c + '55'; ctx.lineWidth = 1.5;
      this._rr(ctx, stx, sty, 36, 36, 6);
      // アイコン文字
      ctx.font = 'bold 11px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = st.c; ctx.fillText(st.l, stx + 18, sty + 18);

      // ラベル+値
      ctx.font = '12px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'left'; ctx.fillStyle = '#999';
      ctx.fillText(st.l, stx + 44, sty + 10);
      ctx.font = 'bold 22px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
      ctx.fillText('' + st.v, stx + 200, sty + 12);

      // ミニバー
      var bw2 = 155, bh2 = 6, bx2 = stx + 44, by2 = sty + 26;
      var ratio = st.crit ? Math.min(parseFloat(st.v) / st.max, 1) : Math.min(st.v / st.max, 1);
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(bx2, by2, bw2, bh2);
      ctx.fillStyle = st.c; ctx.fillRect(bx2, by2, bw2 * ratio, bh2);
    }

    // === メニューボタン ===
    for (var i = 0; i < this.buttons.length; i++) {
      this._btn(ctx, this.buttons[i]);
    }
  }

  _panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(12,12,25,0.88)';
    this._rr(ctx, x, y, w, h, 8);
    ctx.strokeStyle = 'rgba(120,140,180,0.3)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    // 角の宝石
    var pts = [[x+5,y+5],[x+w-5,y+5],[x+5,y+h-5],[x+w-5,y+h-5]];
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = '#44ccee';
      ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  _resIcon(ctx, x, y, color, letter) {
    ctx.fillStyle = color + '33'; ctx.strokeStyle = color + '66'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 10px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(letter, x, y);
  }

  _btn(ctx, b) {
    var g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
    ctx.fillStyle = g;
    this._rr(ctx, b.x, b.y, b.w, b.h, 6);
    // 枠
    ctx.strokeStyle = 'rgba(200,200,220,0.25)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // 上部ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h * 0.35);
    // 左右の宝石
    ctx.fillStyle = '#44ccee';
    ctx.beginPath(); ctx.arc(b.x + 6, b.y + b.h/2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.w - 6, b.y + b.h/2, 2, 0, Math.PI * 2); ctx.fill();
    // ラベル
    ctx.font = 'bold 20px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
  }

  onTap(x, y) {
    for (var i = 0; i < this.buttons.length; i++) {
      var b = this.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.scene === 'saveload_save' || b.scene === 'saveload_load') {
          var sl = this.sceneManager.scenes['saveload'];
          if (sl) sl.mode = b.scene === 'saveload_save' ? 'save' : 'load';
          this.sceneManager.changeScene('saveload');
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
