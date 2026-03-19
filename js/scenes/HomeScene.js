// ホーム画面シーン（ダークファンタジーテーマ）
class HomeScene {
  constructor(sceneManager, inputManager, player, partySystem) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.player = player;
    this.party = partySystem;

    var bw = 100, bh = 80, gx = 8;
    var row1y = 240, row2y = 335;
    var startX = 80;
    this.buttons = [
      { label: '出撃',     icon: '⚔', x: startX,               y: row1y, w: bw, h: bh, scene: 'stageSelect', color: '#cc4444' },
      { label: 'パーティ', icon: '👥', x: startX + (bw+gx)*1,  y: row1y, w: bw, h: bh, scene: 'party',       color: '#44aacc' },
      { label: '装備',     icon: '🛡', x: startX + (bw+gx)*2,  y: row1y, w: bw, h: bh, scene: 'equip',       color: '#8888cc' },
      { label: '強化',     icon: '🔨', x: startX + (bw+gx)*3,  y: row1y, w: bw, h: bh, scene: 'upgrade',     color: '#ffaa22' },
      { label: 'ガチャ',   icon: '✨', x: startX + (bw+gx)*4,  y: row1y, w: bw, h: bh, scene: 'gacha',       color: '#bb44ff' },
      { label: 'ショップ', icon: '🛒', x: startX + (bw+gx)*5,  y: row1y, w: bw, h: bh, scene: 'shop',        color: '#44cc66' },
      { label: 'バッグ',   icon: '🎒', x: startX + (bw+gx)*6,  y: row1y, w: bw, h: bh, scene: 'bag',         color: '#aa8844' },
      { label: '図鑑',     icon: '📖', x: startX,               y: row2y, w: bw, h: bh, scene: 'book',        color: '#88aacc' },
    ];

    this.settingsBtn = { x: startX + (bw+gx)*1, y: row2y, w: bw, h: bh };
    this.elapsed = 0;
  }

  enter() {
    this.inputManager.virtualPadEnabled = false;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var cx = W / 2;

    // ダークファンタジー背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0c0a1e');
    grad.addColorStop(0.5, '#12102a');
    grad.addColorStop(1, '#0a0818');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 装飾パーティクル
    ctx.globalAlpha = 0.06;
    for (var pi = 0; pi < 15; pi++) {
      var px = (pi * 71 + this.elapsed * 0.01 * (pi % 3 + 1)) % W;
      var py = (pi * 47 + this.elapsed * 0.005 * (pi % 2 + 1)) % H;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- ヘッダー: ゲームタイトル ---
    ctx.save();
    ctx.font = 'bold 28px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var titleGrad = ctx.createLinearGradient(30, 0, 200, 0);
    titleGrad.addColorStop(0, '#ffd700');
    titleGrad.addColorStop(1, '#ffaa44');
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(255,215,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText('神装伝説', 30, 28);
    ctx.restore();

    // --- プレイヤー情報バー ---
    this._renderPlayerBar(ctx, W);

    // --- 区切り線 ---
    ctx.strokeStyle = 'rgba(255,215,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 225);
    ctx.lineTo(W - 30, 225);
    ctx.stroke();

    // --- メニューボタン ---
    for (var i = 0; i < this.buttons.length; i++) {
      this._renderButton(ctx, this.buttons[i]);
    }

    // --- 設定ボタン ---
    var sb = this.settingsBtn;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    this._rr(ctx, sb.x, sb.y, sb.w, sb.h, 8);
    ctx.font = '22px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#888888';
    ctx.fillText('⚙', sb.x + sb.w / 2, sb.y + 30);
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillText('設定', sb.x + sb.w / 2, sb.y + 56);
  }

  _renderPlayerBar(ctx, W) {
    var p = this.player;
    var jobData = ClassData.get(p.job);

    // パネル背景
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    this._rr(ctx, 25, 55, W - 50, 160, 8);
    ctx.strokeStyle = 'rgba(255,215,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 55, W - 50, 160);

    var lx = 40;

    // キャラアイコン
    ctx.fillStyle = jobData ? jobData.color : '#4488ff';
    this._rr(ctx, lx, 70, 50, 60, 6);
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Lv', lx + 25, 85);
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.fillText('' + p.level, lx + 25, 110);

    // 名前・職業
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.name, lx + 65, 80);

    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = jobData ? jobData.color : '#aaa';
    ctx.fillText(p.rarity + ' ' + (jobData ? jobData.name : p.job), lx + 65, 100);

    // EXPバー
    var expBarX = lx + 65, expBarW = 200, expBarH = 12, expBarY = 115;
    var expRatio = p.level >= LevelSystem.MAX_LEVEL ? 1 : p.totalExp / p.expToNext;
    ctx.fillStyle = '#1a1a2e';
    this._rr(ctx, expBarX, expBarY, expBarW, expBarH, 3);
    ctx.fillStyle = '#ffd700';
    if (expRatio > 0) {
      ctx.fillRect(expBarX + 1, expBarY + 1, (expBarW - 2) * expRatio, expBarH - 2);
    }
    ctx.font = '9px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.level >= LevelSystem.MAX_LEVEL ? 'MAX' : p.totalExp + '/' + p.expToNext, expBarX + expBarW / 2, expBarY + expBarH / 2);

    // ゴールド
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffd700';
    ctx.fillText(p.ownedGold + ' G', lx + 65, 145);

    // 右側: ステータス
    var rx = 380;
    var statPairs = [
      ['HP', p.hpMax, 'ATK', p.atk],
      ['DEF', p.def, 'SPD', p.spd],
      ['MP', p.mpMax, 'CRIT', p.crit + '%'],
    ];
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    for (var r = 0; r < statPairs.length; r++) {
      var sy = 75 + r * 22;
      ctx.fillStyle = '#666';
      ctx.fillText(statPairs[r][0], rx, sy);
      ctx.fillStyle = '#ddd';
      ctx.fillText('' + statPairs[r][1], rx + 40, sy);
      ctx.fillStyle = '#666';
      ctx.fillText(statPairs[r][2], rx + 110, sy);
      ctx.fillStyle = '#ddd';
      ctx.fillText('' + statPairs[r][3], rx + 155, sy);
    }

    // 素材数
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ff8844';
    ctx.fillText('素材:' + (this.party ? (this.party.enhanceMaterials || 0) : 0), rx, 145);
    ctx.fillStyle = '#44aaff';
    ctx.fillText('石:' + (this.player.equipSystem ? this.player.equipSystem.rerollStones : 0), rx + 70, 145);
  }

  _renderButton(ctx, btn) {
    ctx.save();

    // ボタン背景
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = btn.color + '66';
    ctx.lineWidth = 1.5;
    this._rr(ctx, btn.x, btn.y, btn.w, btn.h, 8);

    // 上部に色付きバー
    ctx.fillStyle = btn.color + '44';
    ctx.fillRect(btn.x + 2, btn.y + 2, btn.w - 4, 3);

    // アイコン
    ctx.font = '24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = btn.color;
    ctx.fillText(btn.icon, btn.x + btn.w / 2, btn.y + 32);

    // ラベル
    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#cccccc';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + 62);

    ctx.restore();
  }

  onTap(x, y) {
    for (var i = 0; i < this.buttons.length; i++) {
      var btn = this.buttons[i];
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this.sceneManager.changeScene(btn.scene);
        return;
      }
    }
    // 設定ボタン
    var sb = this.settingsBtn;
    if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
      this.sceneManager.changeScene('settings');
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
