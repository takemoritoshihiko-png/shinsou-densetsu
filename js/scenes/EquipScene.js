// 装備画面
class EquipScene {
  constructor(sceneManager, player, equipSystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.equip = equipSystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };
    this.selectedSlot = 'weapon';
    this.previewUid = null;
    this.scrollY = 0;

    // 詳細ポップアップ
    this.detailItem = null;

    // プリセットUI
    this.showPresetPanel = false;
    this.presetNameInput = '';
  }

  enter() {
    this.selectedSlot = 'weapon';
    this.previewUid = null;
    this.scrollY = 0;
    this.detailItem = null;
    this.showPresetPanel = false;
  }

  update(dt) {}

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a28');
    grad.addColorStop(1, '#14102e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.font = 'bold 26px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('装備', W / 2, 30);

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

    this._renderSlots(ctx);
    this._renderStatPreview(ctx);
    this._renderBag(ctx);

    // プリセットボタン
    var pbx = 140, pby = 22;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,200,50,0.5)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, pbx, pby, 80, 30, 5);
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc44';
    ctx.fillText('プリセット', pbx + 40, pby + 15);

    // プリセットパネル
    if (this.showPresetPanel) {
      this._renderPresetPanel(ctx, W, H);
    }

    // 詳細ポップアップ（最前面）
    if (this.detailItem) {
      this._renderDetail(ctx, W, H);
    }
  }

  // --- 左: 6部位スロット ---
  _renderSlots(ctx) {
    var slots = EquipmentData.SLOTS;
    var sx = 25, sy = 65, sw = 180, sh = 65, gap = 6;

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var y = sy + i * (sh + gap);
      var isSel = this.selectedSlot === slot;
      var item = this.equip.getEquippedItem(slot);

      ctx.fillStyle = isSel ? 'rgba(100,200,255,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = isSel ? '#44aaff' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.fillRect(sx, y, sw, sh);
      ctx.strokeRect(sx, y, sw, sh);

      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#888888';
      ctx.fillText(EquipmentData.SLOT_NAMES[slot], sx + 6, y + 14);

      if (item) {
        var rc = EquipmentData.RANK_COLORS[item.rank];
        ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = rc;
        ctx.fillText(item.name, sx + 6, y + 32);

        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(EquipmentData.RANK_NAMES[item.rank], sx + 6, y + 48);

        // 特性 + スロット数
        var infoX = sx + 80;
        if (item.innateTraits && item.innateTraits.length > 0) {
          ctx.fillStyle = '#ffaa44';
          ctx.fillText('特性×' + item.innateTraits.length, infoX, y + 48);
          infoX += 55;
        }
        if (item.slots && item.slots.length > 0) {
          for (var sd = 0; sd < item.slots.length; sd++) {
            ctx.beginPath();
            ctx.arc(infoX + sd * 12, y + 48, 4, 0, Math.PI * 2);
            ctx.fillStyle = item.slots[sd] ? SlotTraitData.getColor(item.slots[sd].id) : '#333333';
            ctx.fill();
          }
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#cccccc';
        ctx.font = '9px ' + CONFIG.FONT_FAMILY;
        ctx.fillText(this._itemStatBrief(item), sx + sw - 6, y + 48);
        ctx.textAlign = 'left';
      } else {
        ctx.font = '13px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#444444';
        ctx.fillText('---', sx + 6, y + 38);
      }
    }
  }

  // --- 中央: ステータスプレビュー ---
  _renderStatPreview(ctx) {
    var px = 220, py = 65, pw = 210, ph = 430;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('ステータス', px + pw / 2, py + 16);

    var curBonus = this.equip.getTotalEquipBonus();
    var curStats = StatusSystem.calc(this.player.level, this.player.job, this.player.rarity, curBonus);
    var preBonus = this.previewUid ? this.equip.previewEquipBonus(this.previewUid) : curBonus;
    var preStats = StatusSystem.calc(this.player.level, this.player.job, this.player.rarity, preBonus);

    var labels = ['HP', 'MP', 'ATK', 'MATK', 'DEF', 'MDEF', 'SPD', 'CRIT'];
    var keys = EquipmentData.STAT_KEYS;
    ctx.textAlign = 'left';
    var y = py + 40;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var cur = curStats[key];
      var pre = preStats[key];
      var diff = key === 'crit' ? Math.round((pre - cur) * 10) / 10 : pre - cur;

      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(labels[i], px + 12, y + i * 28);

      ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(key === 'crit' ? cur.toFixed(1) + '%' : '' + cur, px + 60, y + i * 28);

      if (this.previewUid && diff !== 0) {
        ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = diff > 0 ? '#44ff44' : '#ff4444';
        ctx.fillText((diff > 0 ? '+' : '') + (key === 'crit' ? diff.toFixed(1) : diff), px + 130, y + i * 28);
      }
    }
  }

  // --- 右: バッグ一覧 ---
  _renderBag(ctx) {
    var bx = 445, by = 65, bw = 500, bh = 430;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('バッグ — ' + EquipmentData.SLOT_NAMES[this.selectedSlot], bx + 10, by + 16);

    var eqItem = this.equip.getEquippedItem(this.selectedSlot);
    if (eqItem) {
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff6666';
      ctx.fillText('[装備解除]', bx + bw - 10, by + 16);
      ctx.textAlign = 'left';
    }

    var items = this.equip.getInventoryBySlot(this.selectedSlot);
    var itemH = 58;
    var listY = by + 34;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, listY, bw, bh - 34);
    ctx.clip();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iy = listY + i * itemH - this.scrollY;
      if (iy + itemH < listY || iy > by + bh) continue;

      var isEquipped = this.equip.isEquipped(item.uid);
      var isPreview = this.previewUid === item.uid;
      var rc = EquipmentData.RANK_COLORS[item.rank];
      var lvOk = this.player.level >= item.requiredLevel;

      ctx.fillStyle = isPreview ? 'rgba(100,200,255,0.12)' :
                      isEquipped ? 'rgba(100,255,100,0.08)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(bx + 2, iy, bw - 4, itemH - 2);

      if (isPreview) {
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 2, iy, bw - 4, itemH - 2);
      }

      // ランクバー
      ctx.fillStyle = rc;
      ctx.fillRect(bx + 4, iy + 2, 4, itemH - 6);

      // 名前
      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = lvOk ? rc : '#555555';
      ctx.fillText(item.name, bx + 16, iy + 14);

      // ランク + Lv
      ctx.font = '10px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888888';
      ctx.fillText(EquipmentData.RANK_NAMES[item.rank] + '  Lv.' + item.requiredLevel + '〜', bx + 16, iy + 30);

      // 特性バッジ
      if (item.innateTraits && item.innateTraits.length > 0) {
        var traitX = bx + 160;
        for (var t = 0; t < item.innateTraits.length; t++) {
          var tr = item.innateTraits[t];
          var tDef = EquipmentData.getTraitDef(tr.id);
          ctx.font = '9px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#ffaa44';
          ctx.fillText(tDef.label + '+' + tr.value + tDef.unit, traitX, iy + 30);
          traitX += 70;
        }
      }

      // スロット丸アイコン（バッグ一覧）
      if (item.slots && item.slots.length > 0) {
        var dotX = bx + 16;
        for (var di = 0; di < item.slots.length; di++) {
          ctx.beginPath();
          ctx.arc(dotX + di * 14, iy + 46, 4, 0, Math.PI * 2);
          ctx.fillStyle = item.slots[di] ? SlotTraitData.getColor(item.slots[di].id) : '#333333';
          ctx.fill();
        }
      }

      // ステ概要
      ctx.fillStyle = '#cccccc';
      ctx.font = '9px ' + CONFIG.FONT_FAMILY;
      ctx.fillText(this._itemStatBrief(item), bx + 16 + ((item.slots ? item.slots.length : 0) * 14 + 8), iy + 46);

      // 右側ラベル
      ctx.textAlign = 'right';
      if (isEquipped) {
        ctx.font = 'bold 11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#44ff44';
        ctx.fillText('装備中', bx + bw - 12, iy + 14);
      } else if (!lvOk) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ff4444';
        ctx.fillText('Lv不足', bx + bw - 12, iy + 14);
      } else {
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#88ccff';
        ctx.fillText('[装備する]', bx + bw - 12, iy + 14);
      }

      // 詳細ボタン
      ctx.font = '10px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('[詳細]', bx + bw - 12, iy + 44);
      ctx.textAlign = 'left';
    }

    ctx.restore();

    if (items.length === 0) {
      ctx.font = '14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555555';
      ctx.fillText('この部位の装備がありません', bx + bw / 2, listY + 40);
    }
  }

  // --- 装備詳細ポップアップ ---
  _renderDetail(ctx, W, H) {
    var item = this.detailItem;
    var rc = EquipmentData.RANK_COLORS[item.rank];

    // 背景オーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);

    // ポップアップ
    var px = 200, py = 50, pw = 560, ph = 440;
    ctx.fillStyle = '#151530';
    ctx.strokeStyle = rc;
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, pw, ph, 12);

    var lx = px + 25;
    var y = py + 30;

    // 閉じるボタン
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('[閉じる]', px + pw - 20, py + 20);

    // 装備名
    ctx.font = 'bold 24px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.fillStyle = rc;
    ctx.fillText(item.name, lx, y);

    // ランク + ベース名
    y += 30;
    ctx.font = '14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(EquipmentData.RANK_NAMES[item.rank] + '  |  ' +
      EquipmentData.SLOT_NAMES[item.slot] + '  |  Lv.' + item.requiredLevel + '〜', lx, y);

    // 区切り線
    y += 22;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(px + pw - 25, y);
    ctx.stroke();

    // 基本ステータス
    y += 20;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('基本ステータス', lx, y);

    y += 22;
    var keys = EquipmentData.STAT_KEYS;
    var labels = ['HP', 'MP', 'ATK', 'MATK', 'DEF', 'MDEF', 'SPD', 'CRIT'];
    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    var col = 0;
    for (var i = 0; i < keys.length; i++) {
      var val = item.baseStats[keys[i]] || 0;
      if (val === 0) continue;
      var cx2 = lx + (col % 4) * 130;
      var cy2 = y + Math.floor(col / 4) * 22;
      ctx.fillStyle = '#888888';
      ctx.fillText(labels[i], cx2, cy2);
      ctx.fillStyle = '#ffffff';
      var vStr = keys[i] === 'crit' ? '+' + val.toFixed(1) : '+' + val;
      ctx.fillText(vStr, cx2 + 50, cy2);
      col++;
    }

    // 固有特性セクション
    y += Math.ceil(col / 4) * 22 + 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(px + pw - 25, y);
    ctx.stroke();

    y += 18;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#ffaa44';
    ctx.fillText('固有特性', lx, y);

    y += 22;
    if (item.innateTraits && item.innateTraits.length > 0) {
      for (var t = 0; t < item.innateTraits.length; t++) {
        var tr = item.innateTraits[t];
        var tDef = EquipmentData.getTraitDef(tr.id);
        ctx.font = '13px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffcc44';
        ctx.fillText('● ' + tDef.label + ' +' + tr.value + tDef.unit, lx + 10, y + t * 24);

        // 実効値
        var mapping = {
          atk_pct: 'atk', matk_pct: 'matk', def_pct: 'def', mdef_pct: 'mdef',
          hp_pct: 'hp', spd_pct: 'spd', crit_pct: 'crit',
        };
        if (mapping[tr.key]) {
          var baseVal = item.baseStats[mapping[tr.key]] || 0;
          if (baseVal > 0) {
            var addVal = mapping[tr.key] === 'crit'
              ? (baseVal * tr.value / 100).toFixed(1)
              : Math.floor(baseVal * tr.value / 100);
            ctx.fillStyle = '#888888';
            ctx.font = '11px ' + CONFIG.FONT_FAMILY;
            ctx.fillText('(実効: +' + addVal + ')', lx + 200, y + t * 24);
          }
        }
      }
    } else {
      ctx.font = '13px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#555555';
      ctx.fillText('なし', lx + 10, y);
    }

    // --- スロット特性セクション ---
    var slotSectionY = y + Math.max(1, (item.innateTraits ? item.innateTraits.length : 0)) * 24 + 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(lx, slotSectionY);
    ctx.lineTo(px + pw - 25, slotSectionY);
    ctx.stroke();

    slotSectionY += 18;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#88ccff';
    ctx.fillText('スロット (' + (item.slots ? item.slots.length : 0) + ')', lx, slotSectionY);

    // スロット丸アイコン横並び
    var circleY = slotSectionY;
    var circleStartX = lx + 120;
    var circleR = 8;
    var circleGap = 24;
    var maxSlots = 4;

    for (var si = 0; si < maxSlots; si++) {
      var cx3 = circleStartX + si * circleGap;
      ctx.beginPath();
      ctx.arc(cx3, circleY, circleR, 0, Math.PI * 2);
      if (item.slots && si < item.slots.length) {
        var slotColor = (item.slots[si]) ? SlotTraitData.getColor(item.slots[si].id) : '#333333';
        ctx.fillStyle = slotColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff44';
      } else {
        ctx.fillStyle = '#333333';
        ctx.fill();
        ctx.strokeStyle = '#555555';
      }
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // スロット特性詳細
    slotSectionY += 24;
    if (item.slots && item.slots.length > 0) {
      for (var sj = 0; sj < item.slots.length; sj++) {
        var st = item.slots[sj];
        var sDef = SlotTraitData.getDef(st.id);
        var sColor = SlotTraitData.getColor(st.id);

        // 丸アイコン
        ctx.beginPath();
        ctx.arc(lx + 20, slotSectionY + sj * 22, 5, 0, Math.PI * 2);
        ctx.fillStyle = sColor;
        ctx.fill();

        // ラベル + 値
        ctx.font = '12px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = sColor;
        ctx.textAlign = 'left';
        ctx.fillText(sDef.label + ' +' + st.value + sDef.unit, lx + 32, slotSectionY + sj * 22);

        // 実効値（ステ%系のみ）
        var sMapping = {
          atk_pct: 'atk', matk_pct: 'matk', def_pct: 'def', mdef_pct: 'mdef',
          hp_pct: 'hp', spd_pct: 'spd', crit_pct: 'crit',
        };
        if (sMapping[st.key]) {
          var sBase = item.baseStats[sMapping[st.key]] || 0;
          if (sBase > 0) {
            var sAdd = sMapping[st.key] === 'crit'
              ? (sBase * st.value / 100).toFixed(1)
              : Math.floor(sBase * st.value / 100);
            ctx.fillStyle = '#666666';
            ctx.font = '10px ' + CONFIG.FONT_FAMILY;
            ctx.fillText('(実効: +' + sAdd + ')', lx + 220, slotSectionY + sj * 22);
          }
        }
      }
    } else {
      ctx.font = '12px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#555555';
      ctx.fillText('スロットなし', lx + 10, slotSectionY);
    }

    // --- 強化値（後で実装） ---
    var upgSectionY = slotSectionY + Math.max(1, (item.slots ? item.slots.length : 0)) * 22 + 16;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(lx, upgSectionY);
    ctx.lineTo(px + pw - 25, upgSectionY);
    ctx.stroke();
    upgSectionY += 16;
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.fillStyle = '#666666';
    ctx.fillText('強化 +' + (item.upgradeLevel || 0) + '（未実装）', lx, upgSectionY);
  }

  _itemStatBrief(item) {
    var parts = [];
    var s = item.baseStats;
    if (s.atk) parts.push('ATK+' + s.atk);
    if (s.matk) parts.push('MATK+' + s.matk);
    if (s.crit) parts.push('CRIT+' + s.crit.toFixed(1));
    return parts.join(' ');
  }

  _renderPresetPanel(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    var ppx = 250, ppy = 80, ppw = 460, pph = 380;
    ctx.fillStyle = '#151530';
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    this._roundRect(ctx, ppx, ppy, ppw, pph, 10);

    ctx.font = 'bold 18px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcc44';
    ctx.fillText('装備プリセット', ppx + ppw / 2, ppy + 22);

    ctx.font = '13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('[閉じる]', ppx + ppw - 15, ppy + 22);

    var canSave = this.equip.presets.length < this.equip.MAX_PRESETS;
    var sbx = ppx + 20, sby = ppy + 44;
    ctx.fillStyle = canSave ? 'rgba(100,200,50,0.15)' : 'rgba(80,80,80,0.2)';
    ctx.strokeStyle = canSave ? '#44cc44' : '#555';
    ctx.lineWidth = 1;
    this._roundRect(ctx, sbx, sby, 420, 32, 6);
    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = canSave ? '#ffffff' : '#555';
    ctx.fillText('現在の装備を保存 (' + this.equip.presets.length + '/' + this.equip.MAX_PRESETS + ')', sbx + 210, sby + 16);

    var listY = sby + 44;
    var itemH = 52;
    ctx.textAlign = 'left';

    for (var pi = 0; pi < this.equip.MAX_PRESETS; pi++) {
      var iy = listY + pi * itemH;
      var preset = this.equip.presets[pi];

      ctx.fillStyle = preset ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.15)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.fillRect(ppx + 20, iy, 420, itemH - 4);
      ctx.strokeRect(ppx + 20, iy, 420, itemH - 4);

      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#888';
      ctx.fillText('セット ' + (pi + 1), ppx + 30, iy + 14);

      if (preset) {
        ctx.font = 'bold 15px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(preset.name, ppx + 90, iy + 14);

        var eqCount = 0;
        for (var s in preset.equipped) { if (preset.equipped[s]) eqCount++; }
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#aaa';
        ctx.fillText(eqCount + '部位', ppx + 90, iy + 34);

        ctx.fillStyle = 'rgba(100,200,255,0.15)';
        ctx.strokeStyle = '#44aaff';
        this._roundRect(ctx, ppx + 300, iy + 6, 60, 24, 4);
        ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('読込', ppx + 330, iy + 18);

        ctx.fillStyle = 'rgba(255,80,80,0.12)';
        ctx.strokeStyle = '#ff4444';
        this._roundRect(ctx, ppx + 370, iy + 6, 60, 24, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('削除', ppx + 400, iy + 18);
        ctx.textAlign = 'left';
      } else {
        ctx.font = '13px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#444';
        ctx.fillText('--- 空き ---', ppx + 90, iy + 24);
      }
    }
  }

  onTap(x, y) {
    // プリセットパネル
    if (this.showPresetPanel) {
      var ppx = 250, ppy = 80, ppw = 460, pph = 380;
      if (x > ppx + ppw - 80 && x <= ppx + ppw && y >= ppy && y <= ppy + 35) {
        this.showPresetPanel = false;
        return;
      }
      var sby = ppy + 44;
      if (x >= ppx + 20 && x <= ppx + 440 && y >= sby && y <= sby + 32) {
        if (this.equip.presets.length < this.equip.MAX_PRESETS) {
          this.equip.savePreset('プリセット ' + (this.equip.presets.length + 1));
          if (window._saveGame) window._saveGame();
        }
        return;
      }
      var pListY = sby + 44;
      var pItemH = 52;
      for (var pi = 0; pi < this.equip.MAX_PRESETS; pi++) {
        var piy = pListY + pi * pItemH;
        if (!this.equip.presets[pi]) continue;
        if (x >= ppx + 300 && x <= ppx + 360 && y >= piy + 6 && y <= piy + 30) {
          this.equip.loadPreset(pi);
          this.player._applyStats();
          this.showPresetPanel = false;
          if (window._saveGame) window._saveGame();
          return;
        }
        if (x >= ppx + 370 && x <= ppx + 430 && y >= piy + 6 && y <= piy + 30) {
          this.equip.deletePreset(pi);
          if (window._saveGame) window._saveGame();
          return;
        }
      }
      if (x < ppx || x > ppx + ppw || y < ppy || y > ppy + pph) {
        this.showPresetPanel = false;
      }
      return;
    }

    // 詳細ポップアップが開いている場合
    if (this.detailItem) {
      var dpx = 200, dpy = 50, dpw = 560, dph = 440;
      if (x < dpx || x > dpx + dpw || y < dpy || y > dpy + dph ||
          (x > dpx + dpw - 80 && y < dpy + 35)) {
        this.detailItem = null;
      }
      return;
    }

    // プリセットボタン
    if (x >= 140 && x <= 220 && y >= 22 && y <= 52) {
      this.showPresetPanel = true;
      return;
    }

    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.player._applyStats();
      this.player.hp = Math.min(this.player.hp, this.player.hpMax);
      this.player.mp = Math.min(this.player.mp, this.player.mpMax);
      this.sceneManager.changeScene('home');
      return;
    }

    // スロット選択
    var slots = EquipmentData.SLOTS;
    var sx = 25, sy = 65, sw = 180, sh = 65, gap = 6;
    for (var i = 0; i < slots.length; i++) {
      var slotY = sy + i * (sh + gap);
      if (x >= sx && x <= sx + sw && y >= slotY && y <= slotY + sh) {
        this.selectedSlot = slots[i];
        this.previewUid = null;
        this.scrollY = 0;
        return;
      }
    }

    // 装備解除
    var bx = 445, by = 65, bw = 500;
    if (x > bx + bw - 100 && x <= bx + bw && y >= by && y <= by + 30) {
      if (this.equip.getEquippedItem(this.selectedSlot)) {
        this.equip.unequip(this.selectedSlot);
        this.player._applyStats();
        this.previewUid = null;
        return;
      }
    }

    // バッグ一覧タップ
    var items = this.equip.getInventoryBySlot(this.selectedSlot);
    var itemH = 58;
    var listY = by + 34;
    var listH = 430 - 34;

    if (x >= bx && x <= bx + bw && y >= listY && y <= listY + listH) {
      for (var j = 0; j < items.length; j++) {
        var iy = listY + j * itemH - this.scrollY;
        if (y >= iy && y <= iy + itemH) {
          var item = items[j];

          // [詳細] ボタン領域（右下あたり）
          if (x > bx + bw - 60 && y > iy + 34) {
            this.detailItem = item;
            return;
          }

          var isEquipped = this.equip.isEquipped(item.uid);
          var lvOk = this.player.level >= item.requiredLevel;

          if (isEquipped) {
            this.equip.unequip(this.selectedSlot);
            this.player._applyStats();
            this.previewUid = null;
          } else if (lvOk) {
            if (this.previewUid === item.uid) {
              this.equip.equip(item.uid);
              this.player._applyStats();
              this.previewUid = null;
            } else {
              this.previewUid = item.uid;
            }
          }
          return;
        }
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
