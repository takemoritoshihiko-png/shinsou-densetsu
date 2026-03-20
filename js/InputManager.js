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
    var mr = 70;
    var ar = 65;
    var dpadCx = 120, dpadCy = H - 130;
    var dpadSpread = 80;
    return {
      left:  { x: dpadCx - dpadSpread, y: dpadCy, r: mr, label: '<', key: 'left', color: '#ffffff' },
      right: { x: dpadCx + dpadSpread, y: dpadCy, r: mr, label: '>', key: 'right', color: '#ffffff' },
      up:    { x: dpadCx, y: dpadCy - dpadSpread, r: mr, label: '^', key: 'up', color: '#ffffff' },
      down:  { x: dpadCx, y: dpadCy + dpadSpread, r: mr, label: 'v', key: 'down', color: '#ffffff' },
      physical: { x: W - 250, y: H - 90, r: ar, label: 'ATK', key: 'physical', color: '#cc4444' },
      magical:  { x: W - 100, y: H - 90, r: ar, label: 'MAG', key: 'magical', color: '#4488ff' },
      ultimate: { x: W - 175, y: H - 220, r: ar, label: 'ULT', key: 'ultimate', color: '#ffd700' },
      autoBtn:  { x: W - 60, y: H - 220, r: 45, label: 'AUTO', key: 'auto_toggle', color: '#44ff88' },
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

    var dpadCx = 120, dpadCy = CONFIG.CANVAS_HEIGHT - 130;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dpadCx, dpadCy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var isActive = this.isKeyDown(btn.key);
      ctx.save();
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? (btn.color + '99') : (btn.color + '44');
      ctx.fill();
      ctx.strokeStyle = isActive ? btn.color : (btn.color + '99');
      ctx.lineWidth = 2;
      ctx.stroke();
      var fontSize = (name === 'autoBtn') ? 18 : (btn.label.length > 3 ? 22 : 28);
      ctx.font = 'bold ' + fontSize + 'px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : (btn.color + 'dd');
      ctx.fillText(btn.label, btn.x, btn.y);
      ctx.restore();
    }
  }
}
