// 入力管理システム（キーボード＋スマホタッチ対応）
class InputManager {
  constructor(canvas, getScale) {
    this.canvas = canvas;
    this.getScale = getScale;
    this._down = {};
    this._pressed = {};
    this._downPrev = {};
    this.virtualPadEnabled = false;
    this._activeTouches = {};

    this.keyMap = {
      'ArrowLeft': 'left', 'ArrowRight': 'right',
      'ArrowUp': 'up', 'ArrowDown': 'down',
      'w': 'up', 'W': 'up', 'a': 'left', 'A': 'left',
      's': 'down', 'S': 'down', 'd': 'right', 'D': 'right',
      'z': 'physical', 'Z': 'physical',
      'x': 'magical', 'X': 'magical',
      'c': 'ultimate', 'C': 'ultimate',
      'v': 'auto_toggle', 'V': 'auto_toggle',
    };

    this.padButtons = this._createPadButtons();
    this._bindKeyboard();
    this._bindTouch();
  }

  _createPadButtons() {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;

    // === 左側: 十字キー（ダイヤモンド配置） ===
    var dr = 36;         // 移動ボタン半径
    var dcx = 110;       // 十字キー中心X
    var dcy = H - 110;   // 十字キー中心Y
    var ds = 56;          // 中心からの距離

    // === 右側: 攻撃ボタン（ダイヤモンド配置） ===
    var ar = 36;          // 攻撃ボタン半径
    var acx = W - 130;    // 攻撃中心X
    var acy = H - 110;    // 攻撃中心Y
    var as = 56;           // 中心からの距離

    return {
      // 十字キー
      left:  { x: dcx - ds, y: dcy,      r: dr, label: '<',    key: 'left',  color: '#bbbbcc' },
      right: { x: dcx + ds, y: dcy,      r: dr, label: '>',    key: 'right', color: '#bbbbcc' },
      up:    { x: dcx,      y: dcy - ds,  r: dr, label: '^',    key: 'up',    color: '#bbbbcc' },
      down:  { x: dcx,      y: dcy + ds,  r: dr, label: 'v',    key: 'down',  color: '#bbbbcc' },

      // 攻撃ボタン（ダイヤモンド配置: 左=物理, 右=魔法, 上=必殺, 下=AUTO）
      physical: { x: acx - as, y: acy,      r: ar, label: 'ATK',  key: 'physical',    color: '#cc4444' },
      magical:  { x: acx + as, y: acy,      r: ar, label: 'MAG',  key: 'magical',     color: '#4488ff' },
      ultimate: { x: acx,      y: acy - as,  r: ar, label: 'ULT',  key: 'ultimate',    color: '#ffd700' },
      autoBtn:  { x: acx,      y: acy + as,  r: ar, label: 'AUTO', key: 'auto_toggle', color: '#44dd88' },
    };
  }

  _bindKeyboard() {
    var self = this;
    window.addEventListener('keydown', function(e) {
      var name = self.keyMap[e.key];
      if (name) { self._down[name] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', function(e) {
      var name = self.keyMap[e.key];
      if (name) { self._down[name] = false; e.preventDefault(); }
    });
  }

  _getCanvasPos(touch) {
    var rect = this.canvas.getBoundingClientRect();
    var scale = this.getScale();
    return {
      x: (touch.clientX - rect.left) / scale,
      y: (touch.clientY - rect.top) / scale
    };
  }

  _hitTestPad(x, y) {
    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var dx = x - btn.x, dy = y - btn.y;
      if (dx * dx + dy * dy <= btn.r * btn.r) return btn.key;
    }
    return null;
  }

  _bindTouch() {
    var self = this;

    this.canvas.addEventListener('touchstart', function(e) {
      if (!self.virtualPadEnabled) return;
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);
        var key = self._hitTestPad(pos.x, pos.y);
        if (key) {
          self._activeTouches[t.identifier] = key;
          self._down[key] = true;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', function(e) {
      if (!self.virtualPadEnabled) return;
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);
        var prev = self._activeTouches[t.identifier];
        var nk = self._hitTestPad(pos.x, pos.y);
        if (prev && prev !== nk) self._down[prev] = false;
        if (nk) { self._activeTouches[t.identifier] = nk; self._down[nk] = true; }
        else if (prev) { delete self._activeTouches[t.identifier]; }
      }
    }, { passive: false });

    var onEnd = function(e) {
      if (!self.virtualPadEnabled) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var key = self._activeTouches[t.identifier];
        if (key) {
          self._down[key] = false;
          delete self._activeTouches[t.identifier];
        }
      }
    };
    this.canvas.addEventListener('touchend', onEnd, { passive: true });
    this.canvas.addEventListener('touchcancel', onEnd, { passive: true });
  }

  update() {
    for (var key in this._down) {
      this._pressed[key] = this._down[key] && !this._downPrev[key];
    }
    for (var key2 in this._down) {
      this._downPrev[key2] = this._down[key2];
    }
  }

  isKeyDown(key) { return !!this._down[key]; }
  isKeyPressed(key) { return !!this._pressed[key]; }

  renderVirtualPad(ctx) {
    if (!this.virtualPadEnabled) return;

    // 左側: 十字キー中心ドット
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#aaaacc';
    ctx.beginPath();
    ctx.arc(110, CONFIG.CANVAS_HEIGHT - 110, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 右側: 攻撃中心ドット
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ccaa88';
    ctx.beginPath();
    ctx.arc(CONFIG.CANVAS_WIDTH - 130, CONFIG.CANVAS_HEIGHT - 110, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 全ボタン描画
    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var isActive = this.isKeyDown(btn.key);

      ctx.save();

      // 背景円
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      if (isActive) {
        ctx.fillStyle = btn.color + '88';
        ctx.strokeStyle = btn.color;
      } else {
        ctx.fillStyle = btn.color + '22';
        ctx.strokeStyle = btn.color + '55';
      }
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // ラベル
      ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : (btn.color + 'cc');
      ctx.fillText(btn.label, btn.x, btn.y);

      ctx.restore();
    }
  }
}
