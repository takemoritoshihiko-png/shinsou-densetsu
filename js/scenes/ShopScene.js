// ショップ画面
class ShopScene {
  constructor(sceneManager, player, equipSystem, partySystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.equip = equipSystem;
    this.party = partySystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };

    // タブ: 'equip' | 'consumable' | 'material' | 'sell'
    this.tab = 'equip';
    this.tabs = [
      { label: '装備',   tab: 'equip',      x: 140, y: 16, w: 90,  h: 34 },
      { label: '消耗品', tab: 'consumable',  x: 240, y: 16, w: 90,  h: 34 },
      { label: '素材',   tab: 'material',    x: 340, y: 16, w: 90,  h: 34 },
      { label: '売却',   tab: 'sell',        x: 440, y: 16, w: 90,  h: 34 },
    ];

    this.scrollY = 0;
    this.confirmDialog = null;
    this.message = '';
    this.messageTimer = 0;

    // ワールド進行度（仮: 1固定、将来的にゲーム進行と連動）
    this.worldProgress = 1;
  }

  enter() {
    this.tab = 'equip';
    this.scrollY = 0;
    this.confirmDialog = null;
    this.message = '';
    this.messageTimer = 0;
  }

  update(dt) {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }
  }

  _showMsg(msg) {
    this.message = msg;
    this.messageTimer = 1500;
  }

  // 装備ショップの商品リスト生成
  _getEquipShopItems() {
    var items = [];
    var weapons = EquipmentData.WEAPONS;
    // ワールドに応じて開放される武器数
    var maxIdx = Math.min(Math.floor(this.worldProgress * 1.5) + 1, weapons.length);
    for (var i = 0; i < maxIdx; i++) {
      var w = weapons[i];
      // 価格: reqLv × 20 + ATK × 5
      var price = w.reqLv * 20 + (w.atk || 0) * 5 + 50;
      items.push({
        baseId: w.baseId,
        name: w.name,
        rank: 'common',
        reqLv: w.reqLv,
        price: price,
        slot: 'weapon',
      });
    }
    return items;
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a1028');
    grad.addColorStop(1, '#141030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 所持ゴールド
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('GOLD: ' + this.player.ownedGold, W - 20, 30);
    ctx.textAlign = 'left';

    // 戻る
    var bb = this.backButton;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);

    // タブ
    for (var t = 0; t < this.tabs.length; t++) {
      var tb = this.tabs[t];
      var active = this.tab === tb.tab;
      ctx.fillStyle = active ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = active ? '#44aaff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = active ? 2 : 1;
      this._roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 5);
      ctx.font = (active ? 'bold ' : '') + '13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#ffffff' : '#888888';
      ctx.fillText(tb.label, tb.x + tb.w / 2, tb.y + tb.h / 2);
    }

    // コンテンツ
    if (this.tab === 'equip') this._renderEquipTab(ctx);
    else if (this.tab === 'consumable') this._renderConsumableTab(ctx);
    else if (this.tab === 'material') this._renderMaterialTab(ctx);
    else if (this.tab === 'sell') this._renderSellTab(ctx);

    // メッセージ
    if (this.message) {
      ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#44ff88';
      ctx.globalAlpha = Math.min(this.messageTimer / 300, 1);
      ctx.fillText(this.message, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 30);
      ctx.globalAlpha = 1;
    }

    // 確認ダイアログ
    if (this.confirmDialog) this._renderConfirm(ctx);
  }

  // ===== 装備タブ =====
  _renderEquipTab(ctx) {
    var items = this._getEquipShopItems();
    var lx = 30, ly = 60, lw = 900, itemH = 50;

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('装備購入（コモンランク・スロットはランダム）', lx, ly + 10);

    var startY = ly + 28;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iy = startY + i * itemH;
      var canBuy = this.player.ownedGold >= item.price && this.player.level >= item.reqLv;

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx, iy, lw, itemH - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, iy, lw, itemH - 2);

      // ランクバー
      ctx.fillStyle = EquipmentData.RANK_COLORS['common'];
      ctx.fillRect(lx + 2, iy + 2, 4, itemH - 6);

      // 名前
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = canBuy ? '#ffffff' : '#555555';
      ctx.fillText(item.name, lx + 14, iy + 16);

      // Lv制限 + 基礎ステ
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      var base = EquipmentData.getBase(item.baseId);
      ctx.fillText('Lv.' + item.reqLv + '〜  ATK+' + (base.atk || 0) + (base.matk ? ' MATK+' + base.matk : ''), lx + 14, iy + 34);

      // 価格
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'right';
      ctx.fillStyle = canBuy ? '#ffcc00' : '#555555';
      ctx.fillText(item.price + ' G', lx + lw - 100, iy + itemH / 2);

      // 購入ボタン
      if (canBuy) {
        ctx.fillStyle = 'rgba(100,200,50,0.15)';
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 1;
        this._roundRect(ctx, lx + lw - 80, iy + 8, 70, 30, 5);
        ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('購入', lx + lw - 45, iy + 23);
      } else {
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555555';
        ctx.fillText(this.player.level < item.reqLv ? 'Lv不足' : 'G不足', lx + lw - 45, iy + 23);
      }
      ctx.textAlign = 'left';
    }
  }

  // ===== 消耗品タブ =====
  _renderConsumableTab(ctx) {
    var items = [
      { id: 'hpPot',    name: 'HPポーション',  price: 50,   desc: 'HP 30%回復',     count: this.equip.hpPotions },
      { id: 'mpPot',    name: 'MPポーション',  price: 80,   desc: 'MP 30%回復',     count: this.equip.mpPotions },
      { id: 'reroll',   name: '再抽選の石',    price: 3000,  desc: 'スロット特性を再抽選', count: this.equip.rerollStones },
      { id: 'erase',    name: '消去の石',      price: 5000, desc: 'スロット特性を消去',   count: this.equip.eraseStones },
    ];
    this._renderShopList(ctx, items, '消耗品');
  }

  // ===== 素材タブ =====
  _renderMaterialTab(ctx) {
  _renderMaterialTab(ctx) {
    var items = [
      { id: 'enhMat',   name: '強化素材',        price: 200,   desc: '仲間の強化に使用', count: this.party ? (this.party.enhanceMaterials || 0) : 0 },
      { id: 'coreC',    name: 'コモンコア',      price: 300,   desc: '装備強化+値', count: this.equip.cores.common },
      { id: 'coreU',    name: 'アンコモンコア',  price: 800,   desc: '装備強化+値', count: this.equip.cores.uncommon },
      { id: 'coreR',    name: 'レアコア',        price: 2000,  desc: '装備強化+値', count: this.equip.cores.rare },
      { id: 'coreE',    name: 'エピックコア',    price: 5000,  desc: '装備強化+値', count: this.equip.cores.epic },
      { id: 'coreL',    name: 'レジェンドコア',  price: 10000, desc: '装備強化+値', count: this.equip.cores.legend },
    ];
    this._renderShopList(ctx, items, '素材・コア');
  }


  _renderShopList(ctx, items, header) {
    var lx = 30, ly = 60, lw = 900, itemH = 65;

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(header, lx, ly + 10);

    var startY = ly + 28;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iy = startY + i * itemH;
      var canBuy = this.player.ownedGold >= item.price;

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx, iy, lw, itemH - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, iy, lw, itemH - 2);

      // 名前
      ctx.font = 'bold 15px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = canBuy ? '#ffffff' : '#555555';
      ctx.fillText(item.name, lx + 14, iy + 18);

      // 説明
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(item.desc, lx + 14, iy + 38);

      // 所持数
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('所持: ' + item.count, lx + 350, iy + 38);

      // 価格
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'right';
      ctx.fillStyle = canBuy ? '#ffcc00' : '#555555';
      ctx.fillText(item.price + ' G', lx + lw - 100, iy + 22);

      // 購入ボタン
      if (canBuy) {
        ctx.fillStyle = 'rgba(100,200,50,0.15)';
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 1;
        this._roundRect(ctx, lx + lw - 80, iy + 10, 70, 32, 5);
        ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('購入', lx + lw - 45, iy + 26);
      }
      ctx.textAlign = 'left';
    }
  }

  // ===== 売却タブ =====
  _renderSellTab(ctx) {
    var lx = 30, ly = 60, lw = 900, itemH = 48;

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('装備売却（装備中のアイテムは売却不可）', lx, ly + 10);

    var unequipped = this.equip.getUnequippedInventory();
    var startY = ly + 28;

    ctx.save();
    ctx.beginPath();
    ctx.rect(lx, startY, lw, 400);
    ctx.clip();

    for (var i = 0; i < unequipped.length; i++) {
      var item = unequipped[i];
      var iy = startY + i * itemH - this.scrollY;
      if (iy + itemH < startY || iy > startY + 400) continue;

      var rc = EquipmentData.RANK_COLORS[item.rank];
      var price = this.equip.getSellPrice(item);

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx, iy, lw, itemH - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, iy, lw, itemH - 2);

      ctx.fillStyle = rc;
      ctx.fillRect(lx + 2, iy + 2, 4, itemH - 6);

      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = rc;
      ctx.fillText(item.name, lx + 14, iy + 14);

      ctx.font = '10px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(EquipmentData.RANK_NAMES[item.rank] + '  スロット' + (item.slots ? item.slots.length : 0), lx + 14, iy + 32);

      // 売却額
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(price + ' G', lx + lw - 100, iy + itemH / 2);

      // 売却ボタン
      ctx.fillStyle = 'rgba(255,80,80,0.12)';
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 1;
      this._roundRect(ctx, lx + lw - 80, iy + 8, 70, 30, 5);
      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('売却', lx + lw - 45, iy + 23);
      ctx.textAlign = 'left';
    }

    ctx.restore();

    // スクロールボタン
    var listH = 400;
    var maxScroll = Math.max(0, unequipped.length * itemH - listH);
    if (maxScroll > 0) {
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = this.scrollY > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(lx + lw - 35, startY, 30, 24);
      ctx.fillStyle = this.scrollY > 0 ? '#ffffff' : '#555';
      ctx.fillText('^', lx + lw - 20, startY + 12);
      ctx.fillStyle = this.scrollY < maxScroll ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(lx + lw - 35, startY + listH - 24, 30, 24);
      ctx.fillStyle = this.scrollY < maxScroll ? '#ffffff' : '#555';
      ctx.fillText('v', lx + lw - 20, startY + listH - 12);
      var barH2 = Math.max(20, listH * listH / (unequipped.length * itemH));
      var barY2 = startY + (this.scrollY / maxScroll) * (listH - barH2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(lx + lw - 4, barY2, 3, barH2);
    }
    this._sellScrollMax = maxScroll;
    this._sellStartY = startY;
    this._sellLx = lx;
    this._sellLw = lw;


    if (unequipped.length === 0) {
      ctx.font = '14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('売却可能な装備がありません', CONFIG.CANVAS_WIDTH / 2, startY + 40);
    }
  }

  // ===== 確認ダイアログ =====
  _renderConfirm(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    var dx = 280, dy = 190, dw = 400, dh = 160;
    ctx.fillStyle = '#1a1a3a';
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    this._roundRect(ctx, dx, dy, dw, dh, 10);

    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.confirmDialog.message, dx + dw / 2, dy + 45);

    ctx.fillStyle = 'rgba(255,120,50,0.2)';
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    this._roundRect(ctx, dx + 60, dy + 95, 120, 40, 8);
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('はい', dx + 120, dy + 115);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    this._roundRect(ctx, dx + 220, dy + 95, 120, 40, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('いいえ', dx + 280, dy + 115);
  }

  onTap(x, y) {
    // 確認ダイアログ
    if (this.confirmDialog) {
      var dx = 280, dy = 190;
      if (x >= dx + 60 && x <= dx + 180 && y >= dy + 95 && y <= dy + 135) {
        this.confirmDialog.onConfirm();
        this.confirmDialog = null;
        return;
      }
      if (x >= dx + 220 && x <= dx + 340 && y >= dy + 95 && y <= dy + 135) {
        this.confirmDialog = null;
        return;
      }
      return;
    }

    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.sceneManager.changeScene('home');
      return;
    }

    // タブ
    for (var t = 0; t < this.tabs.length; t++) {
      var tb = this.tabs[t];
      if (x >= tb.x && x <= tb.x + tb.w && y >= tb.y && y <= tb.y + tb.h) {
        this.tab = tb.tab;
        this.scrollY = 0;
        return;
      }
    }

    if (this.tab === 'equip') this._onTapEquip(x, y);
    else if (this.tab === 'consumable') this._onTapConsumable(x, y);
    else if (this.tab === 'material') this._onTapMaterial(x, y);
    else if (this.tab === 'sell') this._onTapSell(x, y);
  }

  _onTapEquip(x, y) {
    var items = this._getEquipShopItems();
    var lx = 30, lw = 900, startY = 88, itemH = 50;
    for (var i = 0; i < items.length; i++) {
      var iy = startY + i * itemH;
      if (x >= lx + lw - 80 && x <= lx + lw - 10 && y >= iy + 8 && y <= iy + 38) {
        var item = items[i];
        if (this.player.ownedGold >= item.price && this.player.level >= item.reqLv) {
          this.player.ownedGold -= item.price;
          // コモンランク、固有特性なし、スロットはランダム
          var eq = this.equip.addEquipment(item.baseId, 'common');
          // 固有特性をクリア（ショップ品は特性なし）
          eq.innateTraits = [];
          eq.name = eq.baseName;
          this._showMsg(eq.name + ' を購入しました');
        }
        return;
      }
    }
  }

  _onTapConsumable(x, y) {
    var items = [
      { id: 'hpPot', price: 50 },
      { id: 'mpPot', price: 80 },
      { id: 'reroll', price: 3000 },
      { id: 'erase', price: 5000 },
    ];
    var lx = 30, lw = 900, startY = 88, itemH = 65;
    for (var i = 0; i < items.length; i++) {
      var iy = startY + i * itemH;
      if (x >= lx + lw - 80 && x <= lx + lw - 10 && y >= iy + 10 && y <= iy + 42) {
        var it = items[i];
        if (this.player.ownedGold >= it.price) {
          this.player.ownedGold -= it.price;
          if (it.id === 'hpPot') { this.equip.hpPotions++; this._showMsg('HPポーション を購入'); }
          else if (it.id === 'mpPot') { this.equip.mpPotions++; this._showMsg('MPポーション を購入'); }
          else if (it.id === 'reroll') { this.equip.rerollStones++; this._showMsg('再抽選の石 を購入'); }
          else if (it.id === 'erase') { this.equip.eraseStones++; this._showMsg('消去の石 を購入'); }
        }
        return;
      }
    }
  }

  _onTapMaterial(x, y) {
    var items = [
      { id: 'enhMat', price: 200 },
      { id: 'coreC', price: 300 },
      { id: 'coreU', price: 800 },
      { id: 'coreR', price: 2000 },
      { id: 'coreE', price: 5000 },
      { id: 'coreL', price: 10000 },
    ];
    var lx = 30, lw = 900, startY = 88, itemH = 65;
    for (var i = 0; i < items.length; i++) {
      var iy = startY + i * itemH;
      if (x >= lx + lw - 80 && x <= lx + lw - 10 && y >= iy + 10 && y <= iy + 42) {
        var it = items[i];
        if (this.player.ownedGold >= it.price) {
          this.player.ownedGold -= it.price;
          if (it.id === 'enhMat') {
            if (this.party) this.party.enhanceMaterials = (this.party.enhanceMaterials || 0) + 1;
            this._showMsg('強化素材 を購入');
          }
          else if (it.id === 'coreC') { this.equip.cores.common++; this._showMsg('コモンコア を購入'); }
          else if (it.id === 'coreU') { this.equip.cores.uncommon++; this._showMsg('アンコモンコア を購入'); }
          else if (it.id === 'coreR') { this.equip.cores.rare++; this._showMsg('レアコア を購入'); }
          else if (it.id === 'coreE') { this.equip.cores.epic++; this._showMsg('エピックコア を購入'); }
          else if (it.id === 'coreL') { this.equip.cores.legend++; this._showMsg('レジェンドコア を購入'); }
        }
        return;
      }
    }
  }

  }

  _onTapSell(x, y) {
    // スクロールボタン処理
    if (this._sellScrollMax > 0 && this._sellLx) {
      var sbx2 = this._sellLx + this._sellLw - 35;
      if (x >= sbx2 && x <= sbx2 + 30 && y >= this._sellStartY && y <= this._sellStartY + 24) {
        this.scrollY = Math.max(0, this.scrollY - 120);
        return;
      }
      if (x >= sbx2 && x <= sbx2 + 30 && y >= this._sellStartY + 400 - 24 && y <= this._sellStartY + 400) {
        this.scrollY = Math.min(this._sellScrollMax, this.scrollY + 120);
        return;
      }
    }

    var unequipped = this.equip.getUnequippedInventory();
    var lx = 30, lw = 900, startY = 88, itemH = 48;
    for (var i = 0; i < unequipped.length; i++) {
      var iy = startY + i * itemH - this.scrollY;
      if (x >= lx + lw - 80 && x <= lx + lw - 10 && y >= iy + 8 && y <= iy + 38) {
        var item = unequipped[i];
        var price = this.equip.getSellPrice(item);
        var self = this;
        var uid = item.uid;
        this.confirmDialog = {
          message: item.name + ' を ' + price + 'G で売却しますか？',
          onConfirm: function () {
            var got = self.equip.sellEquipment(uid);
            if (got > 0) {
              self.player.ownedGold += got;
              self._showMsg(got + 'G で売却しました');
            }
          },
        };
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
