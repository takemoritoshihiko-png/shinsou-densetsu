// 入力管理システム（キーボード＋スマホタッチ対応 v3）
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
      'v': 'ultimate', 'V': 'ultimate',
      'q': 'auto_toggle', 'Q': 'auto_toggle',
    };

    this.padButtons = this._createPadButtons();
    this._bindKeyboard();
    this._bindTouch();
  }

  _createPadButtons() {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var mr = 32; // 移動ボタン半径
    var ar = 30; // 攻撃ボタン半径

    // 左側: 十字移動ボタン
    var dpadCx = 100, dpadCy = H - 100;
    var dpadSpread = 52;

    return {
      // 移動 (左側)
      left:  { x: dpadCx - dpadSpread, y: dpadCy,              r: mr, label: '←', key: 'left',  color: '#ffffff' },
      right: { x: dpadCx + dpadSpread, y: dpadCy,              r: mr, label: '→', key: 'right', color: '#ffffff' },
      up:    { x: dpadCx,              y: dpadCy - dpadSpread,  r: mr, label: '↑', key: 'up',    color: '#ffffff' },
      down:  { x: dpadCx,              y: dpadCy + dpadSpread,  r: mr, label: '↓', key: 'down',  color: '#ffffff' },

      // 攻撃 (右側)
      physical: { x: W - 180, y: H - 80,  r: ar, label: '物理', key: 'physical',    color: '#cc4444' },
      magical:  { x: W - 100, y: H - 80,  r: ar, label: '魔法', key: 'magical',     color: '#4488ff' },
      ultimate: { x: W - 140, y: H - 150, r: ar, label: '必殺', key: 'ultimate',    color: '#ffd700' },
      autoBtn:  { x: W - 55,  y: H - 150, r: 22, label: 'AUTO', key: 'auto_toggle', color: '#44ff88' },
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
    return { x: (touch.clientX - rect.left) / scale, y: (touch.clientY - rect.top) / scale };
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

    // 十字キー中央のガイド
    var dpadCx = 100, dpadCy = CONFIG.CANVAS_HEIGHT - 100;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dpadCx, dpadCy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 全ボタン描画
    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var isActive = this.isKeyDown(btn.key);

      ctx.save();
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);

      if (isActive) {
        ctx.fillStyle = btn.color + '66';
        ctx.fill();
        ctx.strokeStyle = btn.color;
      } else {
        ctx.fillStyle = btn.color + '1a';
        ctx.fill();
        ctx.strokeStyle = btn.color + '66';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      // ラベル
      var fontSize = (name === 'autoBtn') ? 10 : (name.length > 3 ? 13 : 18);
      ctx.font = 'bold ' + fontSize + 'px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : (btn.color + 'aa');
      ctx.fillText(btn.label, btn.x, btn.y);

      ctx.restore();
    }
  }
}
