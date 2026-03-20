// バッグ（インベントリ）画面
class BagScene {
  constructor(sceneManager, player, equipSystem, partySystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.equip = equipSystem;
    this.party = partySystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };
    this.MAX_EQUIP = 200;

    // タブ
    this.tab = 'equip';
    this.tabs = [
      { label: '装備',   tab: 'equip',      x: 140, y: 16, w: 80, h: 34 },
      { label: '消耗品', tab: 'consumable',  x: 230, y: 16, w: 80, h: 34 },
      { label: '素材',   tab: 'material',    x: 320, y: 16, w: 80, h: 34 },
      { label: 'コア',   tab: 'core',        x: 410, y: 16, w: 80, h: 34 },
    ];

    // ソート/フィルター
    this.sortMode = 'rank'; // 'rank' | 'slot' | 'upgrade'
    this.filterSlot = 'all'; // 'all' | 'weapon' | 'shield' | ...
    this.sortButtons = [
      { label: 'ランク', mode: 'rank' },
      { label: '部位',   mode: 'slot' },
      { label: '+値',    mode: 'upgrade' },
    ];
    this.filterOptions = ['all'].concat(EquipmentData.SLOTS);

    // 装備詳細
    this.detailItem = null;
    this.scrollY = 0;
  }

  enter() {
    this.tab = 'equip';
    this.detailItem = null;
    this.scrollY = 0;
    this.sortMode = 'rank';
    this.filterSlot = 'all';
  }

  update(dt) {}

  // ソート済み・フィルタ済みの装備リスト
  _getFilteredItems() {
    var items = this.equip.inventory.slice();
    // フィルター
    if (this.filterSlot !== 'all') {
      items = items.filter(function (it) { return it.slot === this.filterSlot; }.bind(this));
    }
    // ソート
    var rankOrder = { legend: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    var slotOrder = {};
    for (var i = 0; i < EquipmentData.SLOTS.length; i++) slotOrder[EquipmentData.SLOTS[i]] = i;
    var mode = this.sortMode;
    items.sort(function (a, b) {
      if (mode === 'rank') {
        var ra = rankOrder[a.rank] || 9;
        var rb = rankOrder[b.rank] || 9;
        if (ra !== rb) return ra - rb;
        return (b.upgradeLevel || 0) - (a.upgradeLevel || 0);
      } else if (mode === 'slot') {
        var sa = slotOrder[a.slot] || 9;
        var sb = slotOrder[b.slot] || 9;
        if (sa !== sb) return sa - sb;
        return (rankOrder[a.rank] || 9) - (rankOrder[b.rank] || 9);
      } else {
        return (b.upgradeLevel || 0) - (a.upgradeLevel || 0);
      }
    });
    return items;
  }

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#08081e');
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

    // タブ
    for (var t = 0; t < this.tabs.length; t++) {
      var tb = this.tabs[t];
      var active = this.tab === tb.tab;
      ctx.fillStyle = active ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = active ? '#44aaff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = active ? 2 : 1;
      this._rr(ctx, tb.x, tb.y, tb.w, tb.h, 5);
      ctx.font = (active ? 'bold ' : '') + '13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#ffffff' : '#888888';
      ctx.fillText(tb.label, tb.x + tb.w / 2, tb.y + tb.h / 2);
    }

    // コンテンツ
    if (this.tab === 'equip') this._renderEquipTab(ctx, W, H);
    else if (this.tab === 'consumable') this._renderConsumableTab(ctx);
    else if (this.tab === 'material') this._renderMaterialTab(ctx);
    else if (this.tab === 'core') this._renderCoreTab(ctx);

    // 装備詳細ポップアップ
    if (this.detailItem) this._renderDetail(ctx, W, H);
  }

  // ===== 装備タブ =====
  _renderEquipTab(ctx, W, H) {
    var topY = 58;

    // ソートボタン
    var sortX = 30;
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888888';
    ctx.fillText('ソート:', sortX, topY + 10);
    for (var s = 0; s < this.sortButtons.length; s++) {
      var sb = this.sortButtons[s];
      var sx = sortX + 50 + s * 65;
      var active = this.sortMode === sb.mode;
      ctx.fillStyle = active ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = active ? '#44aaff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      this._rr(ctx, sx, topY, 58, 22, 4);
      ctx.font = (active ? 'bold ' : '') + '11px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#ffffff' : '#888888';
      ctx.fillText(sb.label, sx + 29, topY + 11);
    }

    // フィルター
    var filterX = 300;
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888888';
    ctx.fillText('部位:', filterX, topY + 10);
    var fNames = { all: '全て', weapon: '武器', shield: '盾', head: '頭', body: '体', feet: '足', accessory: 'アクセ' };
    for (var f = 0; f < this.filterOptions.length; f++) {
      var fo = this.filterOptions[f];
      var fx = filterX + 40 + f * 58;
      var fActive = this.filterSlot === fo;
      ctx.fillStyle = fActive ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = fActive ? '#44aaff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      this._rr(ctx, fx, topY, 52, 22, 4);
      ctx.font = (fActive ? 'bold ' : '') + '10px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = fActive ? '#ffffff' : '#888888';
      ctx.fillText(fNames[fo] || fo, fx + 26, topY + 11);
    }

    // 所持数
    var count = this.equip.inventory.length;
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillStyle = count >= this.MAX_EQUIP ? '#ff4444' : '#aaaaaa';
    ctx.fillText(count + ' / ' + this.MAX_EQUIP, W - 30, topY + 10);

    // グリッド
    var gridX = 30;
    var gridY = topY + 30;
    var gridW = W - 60;
    var gridH = H - gridY - 10;
    var cellSize = 72;
    var gap = 6;
    var cols = Math.floor((gridW + gap) / (cellSize + gap));

    var items = this._getFilteredItems();

    ctx.save();
    ctx.beginPath();
    ctx.rect(gridX, gridY, gridW, gridH);
    ctx.clip();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = gridX + col * (cellSize + gap);
      var cy = gridY + row * (cellSize + gap) - this.scrollY;

      if (cy + cellSize < gridY || cy > gridY + gridH) continue;

      var rc = EquipmentData.RANK_COLORS[item.rank];
      var isEq = this.equip.isEquipped(item.uid);

      // セル背景
      ctx.fillStyle = isEq ? 'rgba(100,255,100,0.08)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = rc;
      ctx.lineWidth = item.rank === 'legend' ? 2 : (item.rank === 'epic' ? 2 : 1);
      ctx.fillRect(cx, cy, cellSize, cellSize);
      ctx.strokeRect(cx, cy, cellSize, cellSize);

      // アイテムアイコン（色ブロック）
      ctx.fillStyle = rc;
      ctx.fillRect(cx + 16, cy + 8, 40, 32);

      // 部位名
      ctx.font = '9px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(EquipmentData.SLOT_NAMES[item.slot] || '?', cx + cellSize / 2, cy + 50);

      // 名前（短縮）
      ctx.font = '9px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#cccccc';
      var shortName = (item.baseName || item.name).substring(0, 5);
      ctx.fillText(shortName, cx + cellSize / 2, cy + 62);

      // +値（右下）
      if (item.upgradeLevel > 0) {
        ctx.font = 'bold 11px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('+' + item.upgradeLevel, cx + cellSize - 4, cy + cellSize - 6);
        ctx.textAlign = 'center';
      }

      // スロットドット（左下）
      if (item.slots) {
        for (var sd = 0; sd < item.slots.length; sd++) {
          ctx.beginPath();
          ctx.arc(cx + 6 + sd * 10, cy + cellSize - 8, 3, 0, Math.PI * 2);
          ctx.fillStyle = item.slots[sd] ? SlotTraitData.getColor(item.slots[sd].id) : '#333';
          ctx.fill();
        }
      }

      // 装備中バッジ
      if (isEq) {
        ctx.font = 'bold 8px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#44ff44';
        ctx.fillText('E', cx + 3, cy + 10);
      }
    }

    ctx.restore();

    if (items.length === 0) {
      ctx.font = '14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('装備がありません', W / 2, gridY + 60);
    }
  }

  // ===== 消耗品タブ =====
  _renderConsumableTab(ctx) {
    var items = [
      { name: 'HPポーション',  count: this.equip.hpPotions, color: '#44ff88', desc: 'HP 30%回復' },
      { name: 'MPポーション',  count: this.equip.mpPotions, color: '#4488ff', desc: 'MP 30%回復' },
      { name: '再抽選の石',    count: this.equip.rerollStones, color: '#44aaff', desc: 'スロット特性を再抽選' },
      { name: '消去の石',      count: this.equip.eraseStones, color: '#ff6666', desc: 'スロット特性を消去' },
    ];
    this._renderItemList(ctx, items, '消耗品');
  }

  // ===== 素材タブ =====
  _renderMaterialTab(ctx) {
    var items = [
      { name: '強化素材', count: this.party ? (this.party.enhanceMaterials || 0) : 0, color: '#ff8844', desc: '仲間のパッシブバフ強化に使用' },
    ];
    this._renderItemList(ctx, items, '素材');
  }

  // ===== コアタブ =====
  _renderCoreTab(ctx) {
    var ranks = ['common', 'uncommon', 'rare', 'epic', 'legend'];
    var items = [];
    for (var i = 0; i < ranks.length; i++) {
      var r = ranks[i];
      items.push({
        name: UpgradeSystem.CORE_NAMES[r],
        count: this.equip.cores[r] || 0,
        color: UpgradeSystem.CORE_COLORS[r],
        desc: '装備の+値を強化',
      });
    }
    this._renderItemList(ctx, items, 'アップグレードコア');
  }

  _renderItemList(ctx, items, header) {
    var lx = 30, ly = 60, lw = 900, itemH = 55;

    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(header, lx, ly + 10);

    var startY = ly + 28;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iy = startY + i * itemH;

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx, iy, lw, itemH - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, iy, lw, itemH - 2);

      // ドット
      ctx.beginPath();
      ctx.arc(lx + 20, iy + itemH / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();

      // 名前
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = item.color;
      ctx.fillText(item.name, lx + 40, iy + 18);

      // 説明
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(item.desc, lx + 40, iy + 38);

      // 所持数
      ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'right';
      ctx.fillStyle = item.count > 0 ? '#ffffff' : '#444444';
      ctx.fillText('×' + item.count, lx + lw - 20, iy + itemH / 2);
      ctx.textAlign = 'left';
    }
  }

  // ===== 装備詳細ポップアップ =====
  _renderDetail(ctx, W, H) {
    var item = this.detailItem;
    var rc = EquipmentData.RANK_COLORS[item.rank];

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    var px = 180, py = 30, pw = 600, ph = 480;
    ctx.fillStyle = '#151530';
    ctx.strokeStyle = rc;
    ctx.lineWidth = 2;
    this._rr(ctx, px, py, pw, ph, 12);

    var lx = px + 25;
    var y = py + 28;

    // 閉じる
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('[閉じる]', px + pw - 20, py + 18);

    // 名前
    ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = rc;
    ctx.fillText(item.name, lx, y);

    // ランク | 部位 | Lv
    y += 26;
    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(EquipmentData.RANK_NAMES[item.rank] + '  |  ' +
      EquipmentData.SLOT_NAMES[item.slot] + '  |  Lv.' + item.requiredLevel + '〜' +
      (item.upgradeLevel > 0 ? '  |  +' + item.upgradeLevel : ''), lx, y);

    // 区切り
    y += 18;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(px + pw - 25, y); ctx.stroke();

    // 基本ステ（+値適用後）
    y += 16;
    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('基本ステータス' + (item.upgradeLevel > 0 ? ' (×' + UpgradeSystem.getUpgradeMultiplier(item.upgradeLevel).toFixed(2) + ')' : ''), lx, y);

    y += 20;
    var upgMul = UpgradeSystem.getUpgradeMultiplier(item.upgradeLevel);
    var keys = EquipmentData.STAT_KEYS;
    var labels = ['HP', 'MP', 'ATK', 'MATK', 'DEF', 'MDEF', 'SPD', 'CRIT'];
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    var col = 0;
    for (var i = 0; i < keys.length; i++) {
      var raw = item.baseStats[keys[i]] || 0;
      if (raw === 0) continue;
      var val = keys[i] === 'crit' ? Math.round(raw * upgMul * 10) / 10 : Math.floor(raw * upgMul);
      var cx2 = lx + (col % 4) * 140;
      var cy2 = y + Math.floor(col / 4) * 20;
      ctx.fillStyle = '#888';
      ctx.fillText(labels[i], cx2, cy2);
      ctx.fillStyle = '#fff';
      ctx.fillText('+' + (keys[i] === 'crit' ? val.toFixed(1) : val), cx2 + 45, cy2);
      if (item.upgradeLevel > 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillText('(元' + raw + ')', cx2 + 90, cy2);
        ctx.font = '12px ' + CONFIG.FONT_FAMILY;
      }
      col++;
    }

    // 固有特性
    y += Math.ceil(col / 4) * 20 + 16;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(px + pw - 25, y); ctx.stroke();
    y += 14;
    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffaa44';
    ctx.fillText('固有特性 (' + (item.innateTraits ? item.innateTraits.length : 0) + ')', lx, y);
    y += 18;
    if (item.innateTraits && item.innateTraits.length > 0) {
      for (var t = 0; t < item.innateTraits.length; t++) {
        var tr = item.innateTraits[t];
        var tDef = EquipmentData.getTraitDef(tr.id);
        ctx.font = '12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffcc44';
        ctx.fillText('● ' + tDef.label + ' +' + tr.value + tDef.unit, lx + 8, y + t * 18);
      }
    } else {
      ctx.font = '12px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#555';
      ctx.fillText('なし', lx + 8, y);
    }

    // スロット特性
    var traitH = Math.max(1, item.innateTraits ? item.innateTraits.length : 0) * 18;
    y += traitH + 12;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(px + pw - 25, y); ctx.stroke();
    y += 14;
    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#88ccff';
    ctx.fillText('スロット (' + (item.slots ? item.slots.length : 0) + ')', lx, y);

    // 丸アイコン
    for (var si = 0; si < 4; si++) {
      ctx.beginPath();
      ctx.arc(lx + 100 + si * 22, y, 7, 0, Math.PI * 2);
      if (item.slots && si < item.slots.length && item.slots[si]) {
        ctx.fillStyle = SlotTraitData.getColor(item.slots[si].id);
      } else if (item.slots && si < item.slots.length) {
        ctx.fillStyle = '#333';
      } else {
        ctx.fillStyle = '#1a1a1a';
      }
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    y += 18;
    if (item.slots && item.slots.length > 0) {
      for (var sj = 0; sj < item.slots.length; sj++) {
        var st = item.slots[sj];
        if (!st) {
          ctx.font = '11px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#444';
          ctx.fillText('空スロット', lx + 8, y + sj * 18);
          continue;
        }
        var sDef = SlotTraitData.getDef(st.id);
        ctx.font = '12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = SlotTraitData.getColor(st.id);
        ctx.fillText('● ' + sDef.label + ' +' + st.value + sDef.unit, lx + 8, y + sj * 18);
      }
    }

    // 売却額
    var sellY = py + ph - 30;
    var sellPrice = this.equip.getSellPrice(item);
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#888';
    ctx.fillText('売却額: ' + sellPrice + ' G', lx, sellY);

    // 装備中
    if (this.equip.isEquipped(item.uid)) {
      ctx.fillStyle = '#44ff44';
      ctx.fillText('装備中', lx + 150, sellY);
    }
  }

  onTap(x, y) {
    // 詳細ポップアップ
    if (x >= 890 && x <= 940 && y >= 20 && y <= 50) { this.scrollY = Math.max(0, this.scrollY - 100); return; }
    if (x >= 890 && x <= 940 && y >= 55 && y <= 85) { this.scrollY = this.scrollY + 100; return; }
    if (this.detailItem) {
      var px = 180, py = 30, pw = 600, ph = 480;
      if (x < px || x > px + pw || y < py || y > py + ph || (x > px + pw - 80 && y < py + 30)) {
        this.detailItem = null;
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
  }

  _onTapEquip(x, y) {
    var topY = 58;

    // ソートボタン
    for (var s = 0; s < this.sortButtons.length; s++) {
      var sx = 80 + s * 65;
      if (x >= sx && x <= sx + 58 && y >= topY && y <= topY + 22) {
        this.sortMode = this.sortButtons[s].mode;
        return;
      }
    }

    // フィルターボタン
    for (var f = 0; f < this.filterOptions.length; f++) {
      var fx = 340 + f * 58;
      if (x >= fx && x <= fx + 52 && y >= topY && y <= topY + 22) {
        this.filterSlot = this.filterOptions[f];
        this.scrollY = 0;
        return;
      }
    }

    // グリッドタップ
    var gridX = 30;
    var gridY = topY + 30;
    var gridW = CONFIG.CANVAS_WIDTH - 60;
    var cellSize = 72;
    var gap = 6;
    var cols = Math.floor((gridW + gap) / (cellSize + gap));
    var items = this._getFilteredItems();

    for (var i = 0; i < items.length; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = gridX + col * (cellSize + gap);
      var cy = gridY + row * (cellSize + gap) - this.scrollY;

      if (x >= cx && x <= cx + cellSize && y >= cy && y <= cy + cellSize) {
        this.detailItem = items[i];
        return;
      }
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
