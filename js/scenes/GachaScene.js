// ガチャ（仲間召喚）画面
class GachaScene {
  constructor(sceneManager, player, partySystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.party = partySystem;

    // ガチャ定数
    this.SINGLE_COST = 300;
    this.MULTI_COST = 2700;
    this.RATES = [
      { rarity: 'N',   weight: 60 },
      { rarity: 'R',   weight: 30 },
      { rarity: 'SR',  weight: 8 },
      { rarity: 'SSR', weight: 2 },
    ];
    this.RARITY_COLORS = { N: '#cccccc', R: '#44cc44', SR: '#bb44ff', SSR: '#ffd700' };
    this.DUP_MATERIALS = { N: 1, R: 3, SR: 10, SSR: 30 };

    // 状態: 'menu' | 'animating' | 'result'
    this.state = 'menu';

    // 演出
    this.animTimer = 0;
    this.animDuration = 0;
    this.animOrbs = [];

    // 結果
    this.results = [];

    // ボタン
    this.singleBtn = { x: 260, y: 350, w: 190, h: 55 };
    this.multiBtn  = { x: 510, y: 350, w: 190, h: 55 };
    this.againBtn  = { x: 260, y: 440, w: 190, h: 45 };
    this.backBtn   = { x: 510, y: 440, w: 190, h: 45 };
    this.menuBackBtn = { x: 20, y: 20, w: 100, h: 40 };
  }

  enter() {
    this.state = 'menu';
    this.results = [];
    this.animOrbs = [];
    this.animTimer = 0;
  }

  // レアリティ抽選
  _rollRarity() {
    var roll = Math.random() * 100;
    var cumulative = 0;
    for (var i = 0; i < this.RATES.length; i++) {
      cumulative += this.RATES[i].weight;
      if (roll < cumulative) return this.RATES[i].rarity;
    }
    return 'N';
  }

  // 1体分のガチャ結果を生成
  _rollOne() {
    var rarity = this._rollRarity();
    var jobKeys = ClassData.JOB_KEYS;
    var job = jobKeys[Math.floor(Math.random() * jobKeys.length)];
    var jobData = ClassData.get(job);
    var name = rarity + ' ' + (jobData ? jobData.name : job);

    // 重複チェック: 同名キャラが既に存在するか
    var isDuplicate = false;
    for (var i = 0; i < this.party.characters.length; i++) {
      if (this.party.characters[i].name === name) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      var matAmount = this.DUP_MATERIALS[rarity] || 1;
      return { type: 'material', name: name, rarity: rarity, job: job, materials: matAmount };
    } else {
      return { type: 'character', name: name, rarity: rarity, job: job };
    }
  }

  // ガチャ実行
  _doGacha(count) {
    this.results = [];
    for (var i = 0; i < count; i++) {
      this.results.push(this._rollOne());
    }

    // 結果を適用
    var totalMaterials = 0;
    for (var j = 0; j < this.results.length; j++) {
      var r = this.results[j];
      if (r.type === 'character') {
        this.party.addCharacter(r.name, r.job, r.rarity);
      } else {
        totalMaterials += r.materials;
      }
    }
    if (totalMaterials > 0) {
      this.party.enhanceMaterials = (this.party.enhanceMaterials || 0) + totalMaterials;
    }

    // 最高レアリティ判定（演出時間に影響）
    var hasSSR = false;
    for (var k = 0; k < this.results.length; k++) {
      if (this.results[k].rarity === 'SSR') { hasSSR = true; break; }
    }

    // 演出開始
    this.state = 'animating';
    this.animTimer = 0;
    this.animDuration = hasSSR ? 2500 : 1200;
    this._buildOrbs(hasSSR);

    // 自動セーブ
    if (window._saveGame) window._saveGame();
  }

  _buildOrbs(hasSSR) {
    this.animOrbs = [];
    var cx = CONFIG.CANVAS_WIDTH / 2;
    for (var i = 0; i < this.results.length; i++) {
      var r = this.results[i];
      var delay = i * 80;
      var ox = cx - ((this.results.length - 1) * 35) + i * 70;
      this.animOrbs.push({
        x: ox,
        startY: -40 - i * 20,
        targetY: 200,
        y: -40 - i * 20,
        delay: delay,
        rarity: r.rarity,
        color: this.RARITY_COLORS[r.rarity],
        burst: false,
        burstTimer: 0,
      });
    }
    this._animHasSSR = hasSSR;
    this._ssrFlash = 0;
  }

  update(dt) {
    if (this.state !== 'animating') return;

    this.animTimer += dt;

    // オーブ落下アニメ
    for (var i = 0; i < this.animOrbs.length; i++) {
      var orb = this.animOrbs[i];
      var elapsed = this.animTimer - orb.delay;
      if (elapsed < 0) continue;

      if (!orb.burst) {
        var t = Math.min(elapsed / 400, 1);
        // イージング
        var ease = 1 - Math.pow(1 - t, 3);
        orb.y = orb.startY + (orb.targetY - orb.startY) * ease;

        if (t >= 1) {
          orb.burst = true;
          orb.burstTimer = 0;
        }
      } else {
        orb.burstTimer += dt;
      }
    }

    // SSRフラッシュ
    if (this._animHasSSR && this.animTimer > 300) {
      this._ssrFlash = Math.max(0, 1 - (this.animTimer - 300) / 800);
    }

    // 演出完了
    if (this.animTimer >= this.animDuration) {
      this.state = 'result';
    }
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var cx = W / 2;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(1, '#1a0a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (this.state === 'menu') {
      this._renderMenu(ctx, W, H, cx);
    } else if (this.state === 'animating') {
      this._renderAnimation(ctx, W, H, cx);
    } else if (this.state === 'result') {
      this._renderResult(ctx, W, H, cx);
    }
  }

  _renderMenu(ctx, W, H, cx) {
    // タイトル
    ctx.font = 'bold 36px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText('仲間召喚', cx, 60);
    ctx.shadowBlur = 0;

    // 所持ゴールド
    ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('所持GOLD: ' + this.player.ownedGold, cx, 110);

    // 強化素材
    ctx.font = '16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('強化素材: ' + (this.party.enhanceMaterials || 0) + '個', cx, 138);

    // 排出率
    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#888888';
    ctx.fillText('排出率  N:60%  R:30%  SR:8%  SSR:2%', cx, 175);

    // ガチャ演出エリア（装飾）
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 200, 200, 400, 120);
    ctx.font = '18px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillText('召喚の間', cx, 260);

    // 単発ボタン
    var sb = this.singleBtn;
    var canSingle = this.player.ownedGold >= this.SINGLE_COST;
    ctx.fillStyle = canSingle ? 'rgba(100, 200, 255, 0.15)' : 'rgba(80, 80, 80, 0.3)';
    ctx.strokeStyle = canSingle ? '#44aaff' : '#555555';
    ctx.lineWidth = 2;
    this._roundRect(ctx, sb.x, sb.y, sb.w, sb.h, 8);
    ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = canSingle ? '#ffffff' : '#666666';
    ctx.fillText('単発召喚', sb.x + sb.w / 2, sb.y + 22);
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canSingle ? '#ffcc00' : '#555555';
    ctx.fillText(this.SINGLE_COST + ' GOLD', sb.x + sb.w / 2, sb.y + 42);

    // 10連ボタン
    var mb = this.multiBtn;
    var canMulti = this.player.ownedGold >= this.MULTI_COST;
    ctx.fillStyle = canMulti ? 'rgba(255, 200, 50, 0.15)' : 'rgba(80, 80, 80, 0.3)';
    ctx.strokeStyle = canMulti ? '#ffaa22' : '#555555';
    ctx.lineWidth = 2;
    this._roundRect(ctx, mb.x, mb.y, mb.w, mb.h, 8);
    ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canMulti ? '#ffffff' : '#666666';
    ctx.fillText('10連召喚', mb.x + mb.w / 2, mb.y + 22);
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canMulti ? '#ffcc00' : '#555555';
    ctx.fillText(this.MULTI_COST + ' GOLD (10%OFF)', mb.x + mb.w / 2, mb.y + 42);

    // 戻るボタン
    var bb = this.menuBackBtn;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);
  }

  _renderAnimation(ctx, W, H, cx) {
    // SSR全画面フラッシュ
    if (this._ssrFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this._ssrFlash * 0.5;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    ctx.font = 'bold 24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('召喚中...', cx, 80);

    // オーブ描画
    for (var i = 0; i < this.animOrbs.length; i++) {
      var orb = this.animOrbs[i];
      if (this.animTimer < orb.delay) continue;

      ctx.save();
      if (orb.burst) {
        // 弾けるエフェクト
        var bp = Math.min(orb.burstTimer / 300, 1);
        var radius = 15 + 25 * bp;
        ctx.globalAlpha = 1 - bp;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 落下中の光の玉
        ctx.fillStyle = orb.color;
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _renderResult(ctx, W, H, cx) {
    ctx.font = 'bold 26px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('召喚結果', cx, 35);

    // 結果カード
    var cols = Math.min(this.results.length, 5);
    var rows = Math.ceil(this.results.length / 5);
    var cardW = 160;
    var cardH = rows > 1 ? 130 : 160;
    var gap = 8;
    var startX = cx - (cols * (cardW + gap) - gap) / 2;
    var startY = 65;

    for (var i = 0; i < this.results.length; i++) {
      var r = this.results[i];
      var col = i % 5;
      var row = Math.floor(i / 5);
      var x = startX + col * (cardW + gap);
      var y = startY + row * (cardH + gap);
      var color = this.RARITY_COLORS[r.rarity];
      var jobData = ClassData.get(r.job);

      // カード背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeStyle = color;
      ctx.lineWidth = r.rarity === 'SSR' ? 3 : (r.rarity === 'SR' ? 2 : 1);
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      // レアリティ
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      ctx.fillText(r.rarity, x + cardW / 2, y + 18);

      // キャラアイコン（色ブロック）
      ctx.fillStyle = jobData ? jobData.color : '#888';
      ctx.fillRect(x + cardW / 2 - 15, y + 28, 30, 40);

      // 職業名
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(jobData ? jobData.name : r.job, x + cardW / 2, y + 84);

      // NEW or 素材
      if (r.type === 'character') {
        ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#44ff44';
        ctx.fillText('NEW!', x + cardW / 2, y + 102);
      } else {
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('素材 +' + r.materials, x + cardW / 2, y + 102);
      }
    }

    // ボタン
    var btnY = startY + rows * (cardH + gap) + 20;
    this.againBtn.y = btnY;
    this.backBtn.y = btnY;

    var ab = this.againBtn;
    ctx.fillStyle = 'rgba(100, 200, 255, 0.12)';
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, ab.x, ab.y, ab.w, ab.h, 8);
    ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('もう一度', ab.x + ab.w / 2, ab.y + ab.h / 2);

    var bk = this.backBtn;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this._roundRect(ctx, bk.x, bk.y, bk.w, bk.h, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('戻る', bk.x + bk.w / 2, bk.y + bk.h / 2);
  }

  onTap(x, y) {
    if (this.state === 'animating') return;

    if (this.state === 'menu') {
      // 戻る
      var bb = this.menuBackBtn;
      if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
        this.sceneManager.changeScene('home');
        return;
      }

      // 単発
      var sb = this.singleBtn;
      if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
        if (this.player.ownedGold >= this.SINGLE_COST) {
          this.player.ownedGold -= this.SINGLE_COST;
          this._doGacha(1);
        }
        return;
      }

      // 10連
      var mb = this.multiBtn;
      if (x >= mb.x && x <= mb.x + mb.w && y >= mb.y && y <= mb.y + mb.h) {
        if (this.player.ownedGold >= this.MULTI_COST) {
          this.player.ownedGold -= this.MULTI_COST;
          this._doGacha(10);
        }
        return;
      }
    }

    if (this.state === 'result') {
      var ab = this.againBtn;
      if (x >= ab.x && x <= ab.x + ab.w && y >= ab.y && y <= ab.y + ab.h) {
        this.state = 'menu';
        this.results = [];
        return;
      }

      var bk = this.backBtn;
      if (x >= bk.x && x <= bk.x + bk.w && y >= bk.y && y <= bk.y + bk.h) {
        this.sceneManager.changeScene('home');
        return;
      }
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
