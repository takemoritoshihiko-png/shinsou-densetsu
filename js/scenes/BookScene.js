// 図鑑画面
class BookScene {
  constructor(sceneManager, bookSystem) {
    this.sceneManager = sceneManager;
    this.book = bookSystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };

    // メインタブ
    this.tab = 'monster';
    this.tabs = [
      { label: 'モンスター', tab: 'monster',   x: 150, y: 16, w: 110, h: 34 },
      { label: '装備',       tab: 'equipment',  x: 270, y: 16, w: 80,  h: 34 },
      { label: 'アイテム',   tab: 'item',       x: 360, y: 16, w: 90,  h: 34 },
    ];

    // 装備サブタブ
    this.equipSlot = 'weapon';

    // 詳細ポップアップ
    this.detail = null;
    this.scrollY = 0;
  }

  enter() {
    this.tab = 'monster';
    this.detail = null;
    this.scrollY = 0;
  }

  update(dt) {}

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a20');
    grad.addColorStop(1, '#141028');
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

    if (this.tab === 'monster') this._renderMonsterTab(ctx, W, H);
    else if (this.tab === 'equipment') this._renderEquipTab(ctx, W, H);
    else if (this.tab === 'item') this._renderItemTab(ctx, W, H);

    if (this.detail) this._renderDetail(ctx, W, H);
  }

  // ===== モンスター図鑑 =====
  _renderMonsterTab(ctx, W, H) {
    var gridX = 20, gridY = 58, cellSize = 68, gap = 5;
    var cols = Math.floor((W - 40 + gap) / (cellSize + gap));
    var allMonsters = this._getAllMonsters();

    // 収集率
    var total = allMonsters.length;
    var found = this.book.getMonsterDiscoveredCount();
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('収集: ' + found + ' / ' + total, W - 20, 54);
    ctx.textAlign = 'left';

    ctx.save();
    ctx.beginPath();
    ctx.rect(gridX, gridY, W - 40, H - gridY - 5);
    ctx.clip();

    for (var i = 0; i < allMonsters.length; i++) {
      var m = allMonsters[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = gridX + col * (cellSize + gap);
      var cy = gridY + row * (cellSize + gap) - this.scrollY;

      if (cy + cellSize < gridY || cy > H) continue;

      var encountered = this.book.isMonsterEncountered(m.id);

      ctx.fillStyle = encountered ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)';
      ctx.strokeStyle = encountered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.fillRect(cx, cy, cellSize, cellSize);
      ctx.strokeRect(cx, cy, cellSize, cellSize);

      // アイコン
      ctx.fillStyle = encountered ? m.spriteColor : '#333333';
      ctx.fillRect(cx + 14, cy + 6, 40, 30);

      // 名前
      ctx.font = '9px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = encountered ? '#cccccc' : '#444444';
      var name = encountered ? m.name : '？？？';
      ctx.fillText(name.substring(0, 6), cx + cellSize / 2, cy + 48);

      // 撃破数
      if (encountered) {
        var kills = this.book.getMonsterKills(m.id);
        ctx.font = '8px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#888888';
        ctx.fillText('×' + kills, cx + cellSize / 2, cy + 60);
      }
    }

    ctx.restore();
  }

  _getAllMonsters() {
    var all = [];
    for (var w = 1; w <= 10; w++) {
      var monsters = MonsterData.getMonsters(w);
      for (var m = 0; m < monsters.length; m++) {
        all.push(Object.assign({ world: w }, monsters[m]));
      }
      var boss = MonsterData.getBoss(w);
      if (boss) all.push(Object.assign({ world: w, isBoss: true }, boss));
    }
    return all;
  }

  // ===== 装備図鑑 =====
  _renderEquipTab(ctx, W, H) {
    // 部位サブタブ
    var slots = EquipmentData.SLOTS;
    var slotNames = EquipmentData.SLOT_NAMES;
    var subY = 56;
    for (var s = 0; s < slots.length; s++) {
      var sx = 20 + s * 78;
      var active = this.equipSlot === slots[s];
      ctx.fillStyle = active ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = active ? '#44aaff' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      this._rr(ctx, sx, subY, 72, 24, 4);
      ctx.font = (active ? 'bold ' : '') + '11px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#ffffff' : '#777';
      ctx.fillText(slotNames[slots[s]], sx + 36, subY + 12);
    }

    // 収集率
    var total = this._getEquipListForSlot(this.equipSlot).length;
    var found = 0;
    var eList = this._getEquipListForSlot(this.equipSlot);
    for (var e = 0; e < eList.length; e++) {
      if (this.book.isEquipmentDiscovered(eList[e].baseId)) found++;
    }
    ctx.font = '11px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(found + ' / ' + total, W - 20, subY + 12);

    // グリッド
    var gridY = subY + 34;
    var cellSize = 80;
    var gap = 6;
    var cols = Math.floor((W - 40 + gap) / (cellSize + gap));
    var items = eList;

    ctx.save();
    ctx.beginPath();
    ctx.rect(20, gridY, W - 40, H - gridY - 5);
    ctx.clip();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = 20 + col * (cellSize + gap);
      var cy = gridY + row * (cellSize + gap) - this.scrollY;

      if (cy + cellSize < gridY || cy > H) continue;

      var discovered = this.book.isEquipmentDiscovered(item.baseId);
      var record = this.book.equipment[item.baseId];

      ctx.fillStyle = discovered ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)';
      var rc = discovered && record ? (EquipmentData.RANK_COLORS[record.bestRank] || '#aaa') : 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = discovered ? rc : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = discovered ? 2 : 1;
      ctx.fillRect(cx, cy, cellSize, cellSize);
      ctx.strokeRect(cx, cy, cellSize, cellSize);

      // アイコン
      ctx.fillStyle = discovered ? rc : '#333';
      ctx.fillRect(cx + 20, cy + 6, 40, 28);

      // 名前
      ctx.font = '10px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = discovered ? '#cccccc' : '#444';
      ctx.fillText(discovered ? item.name.substring(0, 6) : '？？？', cx + cellSize / 2, cy + 48);

      // 最高ランク & +値
      if (discovered && record) {
        ctx.font = '9px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = EquipmentData.RANK_COLORS[record.bestRank] || '#888';
        ctx.fillText(EquipmentData.RANK_NAMES[record.bestRank] || '', cx + cellSize / 2, cy + 62);
        if (record.bestUpgrade > 0) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText('+' + record.bestUpgrade, cx + cellSize / 2, cy + 74);
        }
      }
    }

    ctx.restore();
  }

  _getEquipListForSlot(slot) {
    var map = {
      weapon: EquipmentData.WEAPONS,
      shield: EquipmentData.SHIELDS,
      head: EquipmentData.HEADS,
      body: EquipmentData.BODIES,
      feet: EquipmentData.FEET,
      accessory: EquipmentData.ACCESSORIES,
    };
    return map[slot] || [];
  }

  // ===== アイテム図鑑 =====
  _renderItemTab(ctx, W, H) {
    var items = this.book.ALL_ITEM_KEYS;
    var found = this.book.getItemDiscoveredCount();

    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('収集: ' + found + ' / ' + items.length, W - 20, 54);

    var lx = 30, ly = 62, lw = W - 60, itemH = 50;
    ctx.textAlign = 'left';

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var iy = ly + i * itemH;
      var discovered = this.book.isItemDiscovered(it.key);

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx, iy, lw, itemH - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, iy, lw, itemH - 2);

      // ドット
      ctx.beginPath();
      ctx.arc(lx + 18, iy + itemH / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = discovered ? it.color : '#333';
      ctx.fill();

      // 名前
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = discovered ? it.color : '#555';
      ctx.fillText(discovered ? it.name : '？？？', lx + 34, iy + 16);

      // 説明
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = discovered ? '#888' : '#444';
      ctx.fillText(discovered ? it.desc : '未発見', lx + 34, iy + 34);

      // チェック
      if (discovered) {
        ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#44ff44';
        ctx.fillText('✓', lx + lw - 10, iy + itemH / 2);
        ctx.textAlign = 'left';
      }
    }
  }

  // ===== 詳細ポップアップ =====
  _renderDetail(ctx, W, H) {
    var d = this.detail;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    var px = 200, py = 60, pw = 560, ph = 420;
    ctx.fillStyle = '#151530';
    ctx.strokeStyle = d.color || '#888';
    ctx.lineWidth = 2;
    this._rr(ctx, px, py, pw, ph, 12);

    // 閉じる
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('[閉じる]', px + pw - 20, py + 18);

    var lx = px + 25;
    var y = py + 30;

    if (d.type === 'monster') {
      // モンスター名
      ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = d.data.spriteColor || '#ffffff';
      ctx.fillText(d.data.name, lx, y);

      // アイコン
      ctx.fillStyle = d.data.spriteColor;
      ctx.fillRect(lx + 300, py + 20, 60, 50);

      y += 30;
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('出現: W' + d.data.world + (d.data.isBoss ? ' (ボス)' : ''), lx, y);

      y += 20;
      ctx.fillText('撃破数: ' + this.book.getMonsterKills(d.data.id), lx, y);

      // ステータス
      y += 28;
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ステータス', lx, y);

      y += 22;
      var stats = [
        ['HP', d.data.hp], ['ATK', d.data.atk], ['MATK', d.data.matk || 0], ['DEF', d.data.def],
        ['MDEF', d.data.mdef || 0], ['SPD', d.data.spd], ['EXP', d.data.exp], ['GOLD', d.data.gold],
      ];
      ctx.font = '12px ' + CONFIG.FONT_FAMILY;
      for (var i = 0; i < stats.length; i++) {
        var sx = lx + (i % 4) * 130;
        var sy = y + Math.floor(i / 4) * 22;
        ctx.fillStyle = '#888';
        ctx.fillText(stats[i][0], sx, sy);
        ctx.fillStyle = '#fff';
        ctx.fillText('' + stats[i][1], sx + 50, sy);
      }

      // ドロップ
      y += Math.ceil(stats.length / 4) * 22 + 20;
      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffaa44';
      ctx.fillText('ドロップ装備', lx, y);

      y += 20;
      var worldDrops = DropTableData.TABLES[d.data.world];
      if (worldDrops) {
        var allIds = [].concat(worldDrops.weapons, worldDrops.shields, worldDrops.heads, worldDrops.bodies, worldDrops.feet, worldDrops.accessories);
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        for (var di = 0; di < allIds.length && di < 12; di++) {
          var base = EquipmentData.getBase(allIds[di]);
          if (!base) continue;
          var dx = lx + (di % 3) * 180;
          var dy = y + Math.floor(di / 3) * 18;
          ctx.fillStyle = '#cccccc';
          ctx.fillText(base.name, dx, dy);
        }
      }
    }
  }

  onTap(x, y) {
    if (this.detail) {
    if (x >= 890 && x <= 940 && y >= 20 && y <= 50) { this.scrollY = Math.max(0, this.scrollY - 100); return; }
    if (x >= 890 && x <= 940 && y >= 55 && y <= 85) { this.scrollY = this.scrollY + 100; return; }
      var px = 200, py = 60, pw = 560, ph = 420;
      if (x < px || x > px + pw || y < py || y > py + ph || (x > px + pw - 80 && y < py + 30)) {
        this.detail = null;
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

    if (this.tab === 'monster') this._onTapMonster(x, y);
    else if (this.tab === 'equipment') this._onTapEquip(x, y);
  }

  _onTapMonster(x, y) {
    var W = CONFIG.CANVAS_WIDTH;
    var gridX = 20, gridY = 58, cellSize = 68, gap = 5;
    var cols = Math.floor((W - 40 + gap) / (cellSize + gap));
    var all = this._getAllMonsters();

    for (var i = 0; i < all.length; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = gridX + col * (cellSize + gap);
      var cy = gridY + row * (cellSize + gap) - this.scrollY;

      if (x >= cx && x <= cx + cellSize && y >= cy && y <= cy + cellSize) {
        if (this.book.isMonsterEncountered(all[i].id)) {
          this.detail = { type: 'monster', data: all[i], color: all[i].spriteColor };
        }
        return;
      }
    }
  }

  _onTapEquip(x, y) {
    // サブタブ
    var slots = EquipmentData.SLOTS;
    for (var s = 0; s < slots.length; s++) {
      var sx = 20 + s * 78;
      if (x >= sx && x <= sx + 72 && y >= 56 && y <= 80) {
        this.equipSlot = slots[s];
        this.scrollY = 0;
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
