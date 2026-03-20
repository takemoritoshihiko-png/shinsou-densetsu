// 装備強化画面（タブ: 強化 / スロット操作）
class UpgradeScene {
  constructor(sceneManager, player, equipSystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.equip = equipSystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };

    // タブ: 'upgrade' | 'slot'
    this.tab = 'upgrade';
    this.tabButtons = [
      { label: '強化',       tab: 'upgrade', x: 160, y: 16, w: 110, h: 34 },
      { label: 'スロット操作', tab: 'slot',  x: 280, y: 16, w: 130, h: 34 },
    ];

    // === 強化タブ ===
    this.selectedItemUid = null;
    this.selectedCore = null;
    this.upgradeButton = { x: 370, y: 440, w: 220, h: 50 };

    // === スロット操作タブ ===
    this.slotItemUid = null;
    this.slotSelectedIndex = -1;
    this.slotAction = null; // 'reroll' | 'erase' | null

    // 確認ダイアログ
    this.confirmDialog = null; // { message, onConfirm }

    // 演出
    this.animState = 'none';
    this.animTimer = 0;
    this.animDuration = 0;
    this.lastResult = null;
    this.animMessage = '';
    this.animColor = '#ffffff';

    this.equipScrollY = 0;
  }

  enter() {
    this.tab = 'upgrade';
    this._resetAll();
  }

  _resetAll() {
    this.selectedItemUid = null;
    this.selectedCore = null;
    this.slotItemUid = null;
    this.slotSelectedIndex = -1;
    this.slotAction = null;
    this.confirmDialog = null;
    this.animState = 'none';
    this.animTimer = 0;
    this.lastResult = null;
    this.equipScrollY = 0;
  }

  update(dt) {
    if (this.animState !== 'none') {
      this.animTimer += dt;
      if (this.animState === 'processing' && this.animTimer >= 500) {
        this.animState = 'result';
        this.animTimer = 0;
        this.animDuration = 1200;
      }
      if (this.animState === 'result' && this.animTimer >= this.animDuration) {
        this.animState = 'none';
      }
    }
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a28');
    grad.addColorStop(1, '#18102e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 所持ゴールド + アイテム
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('GOLD: ' + this.player.ownedGold, W - 20, 16);
    ctx.fillStyle = '#88ccff';
    ctx.fillText('再抽選の石: ' + this.equip.rerollStones + '  消去の石: ' + this.equip.eraseStones, W - 20, 34);
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
    for (var t = 0; t < this.tabButtons.length; t++) {
      var tb = this.tabButtons[t];
      var active = this.tab === tb.tab;
      ctx.fillStyle = active ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = active ? '#44aaff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = active ? 2 : 1;
      this._roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 5);
      ctx.font = (active ? 'bold ' : '') + '14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#ffffff' : '#888888';
      ctx.fillText(tb.label, tb.x + tb.w / 2, tb.y + tb.h / 2);
    }

    if (this.tab === 'upgrade') {
      this._renderUpgradeTab(ctx, W, H);
    } else {
      this._renderSlotTab(ctx, W, H);
    }

    // 確認ダイアログ（最前面）
    if (this.confirmDialog) {
      this._renderConfirmDialog(ctx, W, H);
    }

    // 演出オーバーレイ
    this._renderAnimation(ctx, W, H);
  }

  // ===================== 強化タブ =====================
  _renderUpgradeTab(ctx, W, H) {
    this._renderEquipList(ctx, this.selectedItemUid, 20, 55);
    this._renderUpgradeCenter(ctx);
    this._renderCoreList(ctx);
  }

  _renderEquipList(ctx, selUid, lx, ly) {
    var lw = 300, lh = 370;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, lw, lh);

    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('装備を選択', lx + 8, ly + 14);

    var items = this.equip.inventory;
    var itemH = 52;
    var startY = ly + 30;

    ctx.save();
    ctx.beginPath();
    ctx.rect(lx, startY, lw, lh - 30);
    ctx.clip();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iy = startY + i * itemH - this.equipScrollY;
      if (iy + itemH < startY || iy > ly + lh) continue;

      var isSel = selUid === item.uid;
      var rc = EquipmentData.RANK_COLORS[item.rank];

      ctx.fillStyle = isSel ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(lx + 2, iy, lw - 4, itemH - 2);
      if (isSel) { ctx.strokeStyle = '#44aaff'; ctx.lineWidth = 1; ctx.strokeRect(lx + 2, iy, lw - 4, itemH - 2); }

      ctx.fillStyle = rc;
      ctx.fillRect(lx + 4, iy + 2, 4, itemH - 6);

      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = rc;
      ctx.fillText(item.name, lx + 14, iy + 14);

      ctx.font = '10px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(EquipmentData.RANK_NAMES[item.rank] + '  slot' + (item.slots ? item.slots.length : 0), lx + 14, iy + 30);
      // 装備中表示
      if (this.equip.isEquipped(item.uid)) {
        ctx.font = 'bold 10px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#44ff44';
        ctx.fillText('装備中', lx + lw - 10, iy + 14);
        ctx.textAlign = 'left';
      }
      // スロット特性テキスト（全スロット表示）
      if (item.slots && item.slots.length > 0) {
        var stx2 = lx + 14;
        ctx.font = '8px ' + CONFIG.FONT_FAMILY;
        for (var si2 = 0; si2 < item.slots.length; si2++) {
          var sl2 = item.slots[si2];
          if (sl2) {
            var sd2 = SlotTraitData.getDef(sl2.id);
            if (sd2) {
              ctx.fillStyle = SlotTraitData.getColor(sl2.id);
              ctx.fillText(sd2.label + '+' + sl2.value, stx2, iy + 40);
              stx2 += 60;
            }
          }
        }
      }
    }
    ctx.restore();
  }

  _renderUpgradeCenter(ctx) {
    var cx = 380, cy = 55, cw = 200, ch = 370;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cw, ch);

    var item = this.selectedItemUid ? this.equip.getByUid(this.selectedItemUid) : null;
    var midX = cx + cw / 2;

    if (!item) {
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('装備を選択', midX, cy + ch / 2);
      return;
    }

    var rc = EquipmentData.RANK_COLORS[item.rank];
    var lvl = item.upgradeLevel || 0;
    var isMax = lvl >= UpgradeSystem.MAX_LEVEL;

    ctx.font = 'bold 15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = rc;
    ctx.fillText(item.name, midX, cy + 25);

    ctx.font = 'bold 26px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = isMax ? '#ffd700' : '#ffffff';
    ctx.fillText(isMax ? '+8 MAX' : '+' + lvl + ' → +' + (lvl + 1), midX, cy + 60);

    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('倍率: ×' + UpgradeSystem.getUpgradeMultiplier(lvl).toFixed(2) +
      (!isMax ? ' → ×' + UpgradeSystem.getUpgradeMultiplier(lvl + 1).toFixed(2) : ''), midX, cy + 90);

    if (!isMax && this.selectedCore) {
      var rate = UpgradeSystem.getSuccessRate(item, this.selectedCore);
      var goldCost = UpgradeSystem.getGoldCost(item);
      ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = rate >= 70 ? '#44ff44' : rate >= 40 ? '#ffcc00' : '#ff4444';
      ctx.fillText('成功率: ' + rate + '%', midX, cy + 130);
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(goldCost + ' GOLD', midX, cy + 155);
    } else if (!isMax) {
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#555555';
      ctx.fillText('コアを選択', midX, cy + 130);
    }

    ctx.font = '10px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#666666';
    ctx.fillText('失敗: コアのみ消費', midX, cy + 260);

    // 強化ボタン
    var canUp = !isMax && this.selectedCore && this.animState === 'none';
    if (canUp) {
      canUp = this.player.ownedGold >= UpgradeSystem.getGoldCost(item) && (this.equip.cores[this.selectedCore] || 0) >= 1;
    }
    var ub = this.upgradeButton;
    ctx.fillStyle = canUp ? 'rgba(255,200,50,0.2)' : 'rgba(80,80,80,0.3)';
    ctx.strokeStyle = canUp ? '#ffcc00' : '#555555';
    ctx.lineWidth = 2;
    this._roundRect(ctx, ub.x, ub.y, ub.w, ub.h, 10);
    ctx.font = 'bold 20px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canUp ? '#ffffff' : '#555555';
    ctx.fillText('強化する', ub.x + ub.w / 2, ub.y + ub.h / 2);
  }

  _renderCoreList(ctx) {
    var rx = 640, ry = 55, rw = 300, rh = 370;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('コア', rx + 8, ry + 14);

    var ranks = UpgradeSystem.CORE_RANKS;
    var coreH = 52;
    var startY = ry + 32;
    var item = this.selectedItemUid ? this.equip.getByUid(this.selectedItemUid) : null;

    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      var cy = startY + i * (coreH + 3);
      var count = this.equip.cores[rank] || 0;
      var isSel = this.selectedCore === rank;
      var cc = UpgradeSystem.CORE_COLORS[rank];
      var canUse = item && UpgradeSystem.canUseCore(item, rank) && count > 0;

      ctx.fillStyle = isSel ? 'rgba(255,200,50,0.12)' : 'rgba(255,255,255,0.02)';
      ctx.strokeStyle = isSel ? cc : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.fillRect(rx + 2, cy, rw - 4, coreH);
      ctx.strokeRect(rx + 2, cy, rw - 4, coreH);

      ctx.save();
      ctx.translate(rx + 22, cy + coreH / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = cc;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();

      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = canUse ? cc : '#555555';
      ctx.fillText(UpgradeSystem.CORE_NAMES[rank], rx + 42, cy + 16);
      ctx.font = '12px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = count > 0 ? '#ffffff' : '#444444';
      ctx.fillText('×' + count, rx + 42, cy + 36);
    }
  }

  // ===================== スロット操作タブ =====================
  _renderSlotTab(ctx, W, H) {
    this._renderEquipList(ctx, this.slotItemUid, 20, 55);
    this._renderSlotCenter(ctx);
    this._renderSlotActions(ctx);
  }

  _renderSlotCenter(ctx) {
    var cx = 340, cy = 55, cw = 280, ch = 430;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cw, ch);

    var item = this.slotItemUid ? this.equip.getByUid(this.slotItemUid) : null;
    var midX = cx + cw / 2;

    if (!item) {
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('装備を選択してスロットを操作', midX, cy + ch / 2);
      return;
    }

    var rc = EquipmentData.RANK_COLORS[item.rank];
    ctx.font = 'bold 15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = rc;
    ctx.fillText(item.name, midX, cy + 22);

    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('スロット数: ' + (item.slots ? item.slots.length : 0), midX, cy + 44);

    if (!item.slots || item.slots.length === 0) {
      ctx.fillStyle = '#555555';
      ctx.fillText('この装備にスロットはありません', midX, cy + 100);
      return;
    }

    // スロット一覧
    var slotStartY = cy + 65;
    var slotH = 70;
    ctx.textAlign = 'left';

    for (var i = 0; i < item.slots.length; i++) {
      var sy = slotStartY + i * (slotH + 6);
      var trait = item.slots[i];
      var isSel = this.slotSelectedIndex === i;
      var isEmpty = trait === null;

      ctx.fillStyle = isSel ? 'rgba(100,200,255,0.12)' : 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = isSel ? '#44aaff' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.fillRect(cx + 8, sy, cw - 16, slotH);
      ctx.strokeRect(cx + 8, sy, cw - 16, slotH);

      // スロット番号アイコン
      var circleX = cx + 30;
      var circleY = sy + slotH / 2;
      ctx.beginPath();
      ctx.arc(circleX, circleY, 12, 0, Math.PI * 2);
      if (isEmpty) {
        ctx.fillStyle = '#333333';
        ctx.fill();
        ctx.strokeStyle = '#555555';
      } else {
        ctx.fillStyle = SlotTraitData.getColor(trait.id);
        ctx.fill();
        ctx.strokeStyle = '#ffffff44';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      // スロット番号
      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('' + (i + 1), circleX, circleY);
      ctx.textAlign = 'left';

      if (isEmpty) {
        ctx.font = '13px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#555555';
        ctx.fillText('空スロット', cx + 50, sy + 22);
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#444444';
        ctx.fillText('再抽選の石で特性を付与可能', cx + 50, sy + 42);
      } else {
        var sDef = SlotTraitData.getDef(trait.id);
        var sColor = SlotTraitData.getColor(trait.id);
        ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = sColor;
        ctx.fillText(sDef.label, cx + 50, sy + 18);

        ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
        ctx.fillText('+' + trait.value + sDef.unit, cx + 50, sy + 40);

        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#888888';
        var catDef = SlotTraitData.CATEGORIES[sDef.category];
        ctx.fillText(catDef ? catDef.label : '', cx + 50, sy + 58);
      }

      // 選択ラベル
      if (isSel) {
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#44aaff';
        ctx.fillText('選択中', cx + cw - 18, sy + 12);
        ctx.textAlign = 'left';
      }
    }
  }

  _renderSlotActions(ctx) {
    var ax = 640, ay = 55, aw = 300, ah = 430;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(ax, ay, aw, ah);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax, ay, aw, ah);

    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('アクション', ax + 8, ay + 14);

    var item = this.slotItemUid ? this.equip.getByUid(this.slotItemUid) : null;
    var slotSel = this.slotSelectedIndex >= 0 && item && item.slots && this.slotSelectedIndex < item.slots.length;
    var isEmpty = slotSel && item.slots[this.slotSelectedIndex] === null;

    // 再抽選の石
    var ry1 = ay + 38;
    var rh1 = 120;
    var canReroll = slotSel && this.equip.rerollStones > 0 && this.animState === 'none';
    ctx.fillStyle = canReroll ? 'rgba(80,180,255,0.08)' : 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = canReroll ? '#44aaff' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.fillRect(ax + 4, ry1, aw - 8, rh1);
    ctx.strokeRect(ax + 4, ry1, aw - 8, rh1);

    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canReroll ? '#44aaff' : '#555555';
    ctx.fillText('再抽選の石', ax + 16, ry1 + 22);

    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('所持: ' + this.equip.rerollStones + '個', ax + 170, ry1 + 22);

    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#888888';
    ctx.fillText(isEmpty ? '空スロットに新しい特性を付与' : '特性をランダムに入れ替え', ax + 16, ry1 + 48);
    ctx.fillText('ショップ: 500 GOLD', ax + 16, ry1 + 66);

    if (canReroll) {
      ctx.fillStyle = 'rgba(68,170,255,0.2)';
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 2;
      this._roundRect(ctx, ax + 60, ry1 + 80, 180, 32, 6);
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(isEmpty ? '特性を付与する' : '再抽選する', ax + 150, ry1 + 96);
      ctx.textAlign = 'left';
    }

    // 消去の石
    var ry2 = ry1 + rh1 + 12;
    var rh2 = 120;
    var canErase = slotSel && !isEmpty && this.equip.eraseStones > 0 && this.animState === 'none';
    ctx.fillStyle = canErase ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = canErase ? '#ff6666' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.fillRect(ax + 4, ry2, aw - 8, rh2);
    ctx.strokeRect(ax + 4, ry2, aw - 8, rh2);

    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = canErase ? '#ff6666' : '#555555';
    ctx.fillText('消去の石', ax + 16, ry2 + 22);

    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('所持: ' + this.equip.eraseStones + '個', ax + 170, ry2 + 22);

    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#888888';
    ctx.fillText('特性を削除（空スロットにする）', ax + 16, ry2 + 48);
    ctx.fillText('ショップ: 5000 GOLD  |  貴重アイテム', ax + 16, ry2 + 66);

    if (canErase) {
      ctx.fillStyle = 'rgba(255,80,80,0.2)';
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2;
      this._roundRect(ctx, ax + 60, ry2 + 80, 180, 32, 6);
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('消去する', ax + 150, ry2 + 96);
      ctx.textAlign = 'left';
    }

    // ショップ購入セクション
    var shopY = ry2 + rh2 + 16;
    ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('ショップ', ax + 8, shopY);

    var buyReroll = { x: ax + 10, y: shopY + 18, w: 135, h: 34 };
    var buyErase  = { x: ax + 155, y: shopY + 18, w: 135, h: 34 };

    var canBuyR = this.player.ownedGold >= 500;
    ctx.fillStyle = canBuyR ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = canBuyR ? '#44aaff' : '#444';
    ctx.lineWidth = 1;
    this._roundRect(ctx, buyReroll.x, buyReroll.y, buyReroll.w, buyReroll.h, 5);
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = canBuyR ? '#ffffff' : '#555';
    ctx.fillText('再抽選の石', buyReroll.x + buyReroll.w / 2, buyReroll.y + 12);
    ctx.fillStyle = canBuyR ? '#ffcc00' : '#555';
    ctx.fillText('500G', buyReroll.x + buyReroll.w / 2, buyReroll.y + 26);

    var canBuyE = this.player.ownedGold >= 5000;
    ctx.fillStyle = canBuyE ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.strokeStyle = canBuyE ? '#ff6666' : '#444';
    this._roundRect(ctx, buyErase.x, buyErase.y, buyErase.w, buyErase.h, 5);
    ctx.fillStyle = canBuyE ? '#ffffff' : '#555';
    ctx.fillText('消去の石', buyErase.x + buyErase.w / 2, buyErase.y + 12);
    ctx.fillStyle = canBuyE ? '#ffcc00' : '#555';
    ctx.fillText('5000G', buyErase.x + buyErase.w / 2, buyErase.y + 26);
    ctx.textAlign = 'left';
  }

  // ===================== 確認ダイアログ =====================
  _renderConfirmDialog(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    var dx = 280, dy = 180, dw = 400, dh = 180;
    ctx.fillStyle = '#1a1a3a';
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    this._roundRect(ctx, dx, dy, dw, dh, 10);

    ctx.font = '16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.confirmDialog.message, dx + dw / 2, dy + 50);

    // はい
    ctx.fillStyle = 'rgba(255,120,50,0.2)';
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    this._roundRect(ctx, dx + 60, dy + 110, 120, 40, 8);
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('はい', dx + 120, dy + 130);

    // いいえ
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    this._roundRect(ctx, dx + 220, dy + 110, 120, 40, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('いいえ', dx + 280, dy + 130);
  }

  // ===================== 演出 =====================
  _renderAnimation(ctx, W, H) {
    if (this.animState === 'none') return;

    if (this.animState === 'processing') {
      var pulse = (Math.sin(this.animTimer * 0.015) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = 0.3 + pulse * 0.3;
      ctx.fillStyle = this.animColor;
      ctx.beginPath();
      ctx.arc(480, 270, 30 + pulse * 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.animState === 'result') {
      var p = Math.min(this.animTimer / 300, 1);
      ctx.save();
      ctx.globalAlpha = (1 - Math.min(this.animTimer / this.animDuration, 1)) * 0.3;
      ctx.fillStyle = this.animColor;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      var alpha = p < 0.2 ? p / 0.2 : (this.animTimer < 800 ? 1 : 1 - (this.animTimer - 800) / 400);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = 'bold 36px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.animColor;
      ctx.fillText(this.animMessage, 480, 260);
      ctx.restore();
    }
  }

  // ===================== タップ処理 =====================
  onTap(x, y) {
    // 確認ダイアログ
    if (this.confirmDialog) {
      var dx = 280, dy = 180;
      if (x >= dx + 60 && x <= dx + 180 && y >= dy + 110 && y <= dy + 150) {
        this.confirmDialog.onConfirm();
        this.confirmDialog = null;
        return;
      }
      if (x >= dx + 220 && x <= dx + 340 && y >= dy + 110 && y <= dy + 150) {
        this.confirmDialog = null;
        return;
      }
      return;
    }

    if (this.animState !== 'none') return;

    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.player._applyStats();
      this.sceneManager.changeScene('home');
      return;
    }

    // タブ切替
    for (var t = 0; t < this.tabButtons.length; t++) {
      var tb = this.tabButtons[t];
      if (x >= tb.x && x <= tb.x + tb.w && y >= tb.y && y <= tb.y + tb.h) {
        if (this.tab !== tb.tab) {
          this.tab = tb.tab;
          this._resetAll();
          this.tab = tb.tab;
        }
        return;
      }
    }

    if (this.tab === 'upgrade') {
      this._onTapUpgrade(x, y);
    } else {
      this._onTapSlot(x, y);
    }
  }

  _onTapUpgrade(x, y) {
    // 装備一覧
    var lx = 20, ly = 55, lw = 300, lh = 370;
    var startY = ly + 30;
    var itemH = 44;
    if (x >= lx && x <= lx + lw && y >= startY && y <= ly + lh) {
      var items = this.equip.inventory;
      for (var i = 0; i < items.length; i++) {
        var iy = startY + i * itemH - this.equipScrollY;
        if (y >= iy && y <= iy + itemH) { this.selectedItemUid = items[i].uid; this.selectedCore = null; return; }
      }
    }

    // コア
    var rx = 640, ry = 55, rw = 300;
    var coreStartY = ry + 32;
    var coreH = 52;
    var ranks = UpgradeSystem.CORE_RANKS;
    for (var j = 0; j < ranks.length; j++) {
      var cy = coreStartY + j * (coreH + 3);
      if (x >= rx && x <= rx + rw && y >= cy && y <= cy + coreH) {
        var rank = ranks[j];
        var item = this.selectedItemUid ? this.equip.getByUid(this.selectedItemUid) : null;
        if (item && UpgradeSystem.canUseCore(item, rank) && (this.equip.cores[rank] || 0) > 0) {
          this.selectedCore = rank;
        }
        return;
      }
    }

    // 強化ボタン
    var ub = this.upgradeButton;
    if (x >= ub.x && x <= ub.x + ub.w && y >= ub.y && y <= ub.y + ub.h) {
      this._attemptUpgrade();
    }
  }

  _onTapSlot(x, y) {
    // 装備一覧
    var lx = 20, ly = 55, lw = 300, lh = 370;
    var startY = ly + 30;
    var itemH = 44;
    if (x >= lx && x <= lx + lw && y >= startY && y <= ly + lh) {
      var items = this.equip.inventory;
      for (var i = 0; i < items.length; i++) {
        var iy = startY + i * itemH - this.equipScrollY;
        if (y >= iy && y <= iy + itemH) {
          this.slotItemUid = items[i].uid;
          this.slotSelectedIndex = -1;
          return;
        }
      }
    }

    // スロット選択（中央パネル）
    var cx = 340, cy2 = 55;
    var item = this.slotItemUid ? this.equip.getByUid(this.slotItemUid) : null;
    if (item && item.slots) {
      var slotStartY = cy2 + 65;
      var slotH = 70;
      for (var s = 0; s < item.slots.length; s++) {
        var sy = slotStartY + s * (slotH + 6);
        if (x >= cx + 8 && x <= cx + 272 && y >= sy && y <= sy + slotH) {
          this.slotSelectedIndex = s;
          return;
        }
      }
    }

    // アクションボタン（右パネル）
    var ax = 640;

    // 再抽選ボタン
    var slotSel = this.slotSelectedIndex >= 0 && item && item.slots && this.slotSelectedIndex < item.slots.length;
    var isEmpty = slotSel && item.slots[this.slotSelectedIndex] === null;
    if (x >= ax + 60 && x <= ax + 240 && y >= 55 + 38 + 80 && y <= 55 + 38 + 112) {
      if (slotSel && this.equip.rerollStones > 0) {
        var self = this;
        var msg = isEmpty ? 'この空スロットに特性を付与しますか？' : 'この特性を再抽選しますか？';
        this.confirmDialog = {
          message: msg,
          onConfirm: function () { self._doReroll(); },
        };
        return;
      }
    }

    // 消去ボタン
    if (x >= ax + 60 && x <= ax + 240 && y >= 55 + 38 + 120 + 12 + 80 && y <= 55 + 38 + 120 + 12 + 112) {
      if (slotSel && !isEmpty && this.equip.eraseStones > 0) {
        var self2 = this;
        var trait = item.slots[this.slotSelectedIndex];
        var tDef = SlotTraitData.getDef(trait.id);
        this.confirmDialog = {
          message: tDef.label + '+' + trait.value + ' を消去しますか？',
          onConfirm: function () { self2._doErase(); },
        };
        return;
      }
    }

    // ショップ購入
    var shopY = 55 + 38 + 120 + 12 + 120 + 16;
    if (y >= shopY + 18 && y <= shopY + 52) {
      if (x >= ax + 10 && x <= ax + 145 && this.player.ownedGold >= 500) {
        this.player.ownedGold -= 500;
        this.equip.rerollStones++;
        return;
      }
      if (x >= ax + 155 && x <= ax + 290 && this.player.ownedGold >= 5000) {
        this.player.ownedGold -= 5000;
        this.equip.eraseStones++;
        return;
      }
    }
  }

  _doReroll() {
    var item = this.slotItemUid ? this.equip.getByUid(this.slotItemUid) : null;
    if (!item) return;
    var idx = this.slotSelectedIndex;
    var isEmpty = item.slots[idx] === null;

    var result;
    if (isEmpty) {
      result = this.equip.fillEmptySlot(this.slotItemUid, idx);
    } else {
      result = this.equip.rerollSlot(this.slotItemUid, idx);
    }

    if (result) {
      this.animState = 'processing';
      this.animTimer = 0;
      this.animColor = '#44aaff';
      var newT = result.new || result;
      var def = SlotTraitData.getDef(newT.id);
      this.animMessage = (def ? def.label : '') + ' +' + newT.value + (def ? def.unit : '');
      this.player._applyStats();
    }
  }

  _doErase() {
    var result = this.equip.eraseSlot(this.slotItemUid, this.slotSelectedIndex);
    if (result) {
      this.animState = 'processing';
      this.animTimer = 0;
      this.animColor = '#ff4444';
      this.animMessage = '特性を消去しました';
      this.player._applyStats();
    }
  }

  _attemptUpgrade() {
    var item = this.selectedItemUid ? this.equip.getByUid(this.selectedItemUid) : null;
    if (!item || !this.selectedCore) return;
    if ((item.upgradeLevel || 0) >= UpgradeSystem.MAX_LEVEL) return;

    var goldCost = UpgradeSystem.getGoldCost(item);
    if (this.player.ownedGold < goldCost) return;
    if ((this.equip.cores[this.selectedCore] || 0) < 1) return;

    this.player.ownedGold -= goldCost;
    this.equip.cores[this.selectedCore]--;

    this.lastResult = UpgradeSystem.attempt(item, this.selectedCore, Infinity, { [this.selectedCore]: 999 });

    this.animState = 'processing';
    this.animTimer = 0;

    if (this.lastResult && this.lastResult.success) {
      this.animColor = '#ffd700';
      this.animMessage = '強化成功! ' + item.name;
      this.player._applyStats();
    } else {
      this.animColor = '#ff4444';
      this.animMessage = '強化失敗...';
    }

    if ((this.equip.cores[this.selectedCore] || 0) <= 0) {
      this.selectedCore = null;
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
