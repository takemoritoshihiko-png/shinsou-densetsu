// パーティ編成画面
class PartyScene {
  constructor(sceneManager, player, partySystem) {
    this.sceneManager = sceneManager;
    this.player = player;
    this.party = partySystem;

    this.backButton = { x: 20, y: 20, w: 100, h: 40 };

    // 選択中のキャラID（キャラ一覧から選んだもの）
    this.selectedCharId = null;

    // スクロール
    this.listScrollY = 0;
  }

  enter() {
    this.selectedCharId = null;
    this.listScrollY = 0;
  }

  update(dt) {}

  render(ctx) {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0c0c2a');
    grad.addColorStop(1, '#1a1035');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // タイトル
    ctx.font = 'bold 26px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('パーティ編成', W / 2, 30);

    // 戻るボタン
    var bb = this.backButton;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bb.x, bb.y, bb.w, bb.h, 6);
    ctx.font = '15px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← 戻る', bb.x + bb.w / 2, bb.y + bb.h / 2);

    // --- 前衛枠（3枠） ---
    this._renderSlotSection(ctx, '前衛', 20, 65, this.party.frontLine, 'front');

    // --- 馬車枠（3枠） ---
    this._renderSlotSection(ctx, '馬車', 20, 210, this.party.reserve, 'reserve');

    // --- 所持キャラ一覧 ---
    this._renderCharacterList(ctx);

    // --- パッシブバフまとめ ---
    this._renderPassiveSummary(ctx);
  }

  _renderSlotSection(ctx, label, sx, sy, slots, zone) {
    ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(label, sx, sy + 10);

    var slotW = 150;
    var slotH = 110;
    var gap = 12;
    var startX = sx + 60;

    for (var i = 0; i < slots.length; i++) {
      var x = startX + i * (slotW + gap);
      var y = sy;
      var ch = slots[i] ? this.party.getCharById(slots[i]) : null;
      var isLeader = zone === 'front' && i === 0;

      // 枠
      ctx.fillStyle = ch ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = isLeader ? '#ffcc00' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isLeader ? 2 : 1;
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);

      if (isLeader) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('LEADER', x + 4, y + 12);
      }

      if (ch) {
        var jobData = ClassData.get(ch.job);
        // キャラアイコン（色ブロック）
        ctx.fillStyle = jobData ? jobData.color : '#888888';
        ctx.fillRect(x + 10, y + 22, 30, 40);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, y + 22, 30, 40);

        // 名前
        ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ch.name, x + 48, y + 32);

        // 職業
        ctx.font = '11px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = jobData ? jobData.color : '#aaa';
        ctx.fillText(jobData ? jobData.name : ch.job, x + 48, y + 48);

        // レアリティ + Lv
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(ch.rarity + '  Lv.' + ch.level, x + 48, y + 64);

        // パッシブ
        if (jobData) {
          ctx.font = '10px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#88ccff';
          ctx.fillText(jobData.passiveDesc, x + 6, y + slotH - 10);
        }

        // 外すボタン（リーダー以外）
        if (!isLeader) {
          ctx.font = '10px ' + CONFIG.FONT_FAMILY;
          ctx.textAlign = 'right';
          ctx.fillStyle = '#ff6666';
          ctx.fillText('[外す]', x + slotW - 6, y + 12);
        }
      } else {
        // 空スロット
        ctx.font = '14px ' + CONFIG.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555555';
        ctx.fillText('空き', x + slotW / 2, y + slotH / 2);

        if (this.selectedCharId) {
          ctx.font = '11px ' + CONFIG.FONT_FAMILY;
          ctx.fillStyle = '#88ff88';
          ctx.fillText('[配置]', x + slotW / 2, y + slotH / 2 + 18);
        }
      }
    }
  }

  _renderCharacterList(ctx) {
    var listX = 560;
    var listY = 65;
    var listW = 380;
    var listH = 280;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.font = 'bold 14px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('所持キャラ一覧（タップで選択）', listX + 10, listY + 16);

    var chars = this.party.characters;
    var itemH = 38;
    var startY = listY + 34;

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, startY, listW, listH - 34);
    ctx.clip();

    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var iy = startY + i * itemH - this.listScrollY;
      if (iy + itemH < startY || iy > listY + listH) continue;

      var jobData = ClassData.get(ch.job);
      var isSelected = this.selectedCharId === ch.id;
      var slot = this.party.getSlotOf(ch.id);

      // 背景
      ctx.fillStyle = isSelected ? 'rgba(100, 200, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(listX + 2, iy, listW - 4, itemH - 2);

      if (isSelected) {
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX + 2, iy, listW - 4, itemH - 2);
      }

      // 色ブロック
      ctx.fillStyle = jobData ? jobData.color : '#888';
      ctx.fillRect(listX + 8, iy + 6, 20, 26);

      // 名前
      ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ch.name, listX + 36, iy + 14);

      // 職業 + レアリティ
      ctx.font = '11px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#aaaaaa';
      var enhLv = ch.enhanceLevel || 1;
      ctx.fillText((jobData ? jobData.name : ch.job) + '  ' + ch.rarity + '  Lv.' + ch.level +
        '  強化' + enhLv, listX + 36, iy + 28);

      // 配置状況 + 強化ボタン
      ctx.textAlign = 'right';
      if (slot) {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#88ff88';
        var slotLabel = slot.zone === 'front' ? '前衛' + (slot.index + 1) : '馬車' + (slot.index + 1);
        ctx.fillText(slotLabel, listX + listW - 60, iy + 14);
      }
      // 強化ボタン
      if (enhLv < 10) {
        var eCost = this.party.getEnhanceCost(enhLv);
        var canEnhance = this.party.enhanceMaterials >= eCost;
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = canEnhance ? '#ffaa44' : '#555555';
        ctx.fillText('[強化 ' + eCost + '個]', listX + listW - 10, iy + 28);
      } else {
        ctx.font = '10px ' + CONFIG.FONT_FAMILY;
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('MAX', listX + listW - 10, iy + 28);
      }
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  _renderPassiveSummary(ctx) {
    var px = 560;
    var py = 360;
    var pw = 380;

    ctx.font = 'bold 13px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#88ccff';
    ctx.fillText('前衛パッシブバフ合計:', px, py);

    var descs = this.party.getPassiveBuffDescriptions();
    ctx.font = '12px ' + CONFIG.FONT_FAMILY;
    for (var i = 0; i < descs.length; i++) {
      var d = descs[i];
      ctx.fillStyle = d.color;
      ctx.fillText(d.job + ': ' + d.desc, px + 10, py + 18 + i * 16);
    }

    if (descs.length === 0) {
      ctx.fillStyle = '#555555';
      ctx.fillText('なし', px + 10, py + 18);
    }

    // 統合値
    var combined = this.party.getCombinedPassiveBuffs();
    var parts = [];
    if (combined.atk_percent) parts.push('ATK+' + combined.atk_percent + '%');
    if (combined.matk_percent) parts.push('MATK+' + combined.matk_percent + '%');
    if (combined.spd_percent) parts.push('SPD+' + combined.spd_percent + '%');
    if (combined.crit_percent) parts.push('CRIT+' + combined.crit_percent + '%');
    if (combined.damage_reduction) parts.push('被ダメ-' + combined.damage_reduction + '%');
    if (combined.hp_regen_per_sec) parts.push('HP回復' + combined.hp_regen_per_sec + '%/s');

    if (parts.length > 0) {
      var row = py + 18 + descs.length * 16 + 8;
      ctx.font = 'bold 12px ' + CONFIG.FONT_FAMILY;
      ctx.fillStyle = '#ffcc44';
      ctx.fillText('合計: ' + parts.join('  '), px + 10, row);
    }
  }

  onTap(x, y) {
    // 戻る
    var bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.player._applyStats();
      this.player.hp = Math.min(this.player.hp, this.player.hpMax);
      this.player.mp = Math.min(this.player.mp, this.player.mpMax);
      this.sceneManager.changeScene('home');
      return;
    }

    // 前衛スロット
    this._handleSlotTap(x, y, 80, 65, this.party.frontLine, 'front');
    // 馬車スロット
    this._handleSlotTap(x, y, 80, 210, this.party.reserve, 'reserve');

    // キャラ一覧
    this._handleListTap(x, y);
  }

  _handleSlotTap(tapX, tapY, startX, startY, slots, zone) {
    var slotW = 150;
    var slotH = 110;
    var gap = 12;

    for (var i = 0; i < slots.length; i++) {
      var sx = startX + i * (slotW + gap);
      var sy = startY;

      if (tapX >= sx && tapX <= sx + slotW && tapY >= sy && tapY <= sy + slotH) {
        var ch = slots[i] ? this.party.getCharById(slots[i]) : null;
        var isLeader = zone === 'front' && i === 0;

        if (ch && !isLeader) {
          // 「外す」タップ判定（右上）
          if (tapX > sx + slotW - 50 && tapY < sy + 25) {
            this.party.clearSlot(zone, i);
            return;
          }
        }

        if (!ch && this.selectedCharId) {
          // 選択キャラを配置
          if (isLeader) return; // リーダー枠は自動
          this.party.setSlot(zone, i, this.selectedCharId);
          this.selectedCharId = null;
          return;
        }
        return;
      }
    }
  }

  _handleListTap(tapX, tapY) {
    var listX = 560;
    var listY = 65 + 34;
    var listW = 380;
    var listH = 280 - 34;

    if (tapX < listX || tapX > listX + listW || tapY < listY || tapY > listY + listH) return;

    var chars = this.party.characters;
    var itemH = 38;

    for (var i = 0; i < chars.length; i++) {
      var iy = listY + i * itemH - this.listScrollY;
      if (tapY >= iy && tapY <= iy + itemH) {
        // 強化ボタン（右端の領域）
        if (tapX > listX + listW - 90 && tapY > iy + 18) {
          var ch = chars[i];
          if (ch.enhanceLevel < 10 && this.party.enhanceCharacter(ch.id)) {
            console.log(ch.name + ' 強化Lv.' + ch.enhanceLevel);
          }
          return;
        }
        // 選択/選択解除
        if (this.selectedCharId === chars[i].id) {
          this.selectedCharId = null;
        } else {
          this.selectedCharId = chars[i].id;
        }
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
