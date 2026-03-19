// 入力管理システム（キーボード＋仮想パッド）トップダウン版
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
      'ArrowLeft':  'left',
      'ArrowRight': 'right',
      'ArrowUp':    'up',
      'ArrowDown':  'down',
      'w': 'up',   'W': 'up',
      'a': 'left', 'A': 'left',
      's': 'down', 'S': 'down',
      'd': 'right','D': 'right',
      'z': 'physical', 'Z': 'physical',
      'x': 'magical',  'X': 'magical',
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
    var r = 34;
    return {
      left:     { x: 60,  y: H - 70,  r: r, label: '←',   key: 'left' },
      right:    { x: 180, y: H - 70,  r: r, label: '→',   key: 'right' },
      up:       { x: 120, y: H - 130, r: r, label: '↑',   key: 'up' },
      down:     { x: 120, y: H - 10,  r: r, label: '↓',   key: 'down' },
      physical: { x: W - 220, y: H - 70,  r: r, label: '物理', key: 'physical' },
      magical:  { x: W - 120, y: H - 70,  r: r, label: '魔法', key: 'magical' },
      autoBtn:  { x: W - 220, y: H - 140, r: r, label: 'AUTO', key: 'auto_toggle' },
      ultimate: { x: W - 120, y: H - 140, r: r, label: '必殺', key: 'ultimate' },
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
    if (!this.virtualPadEnabled) return null;
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
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);
        var key = self._hitTestPad(pos.x, pos.y);
        if (key) { self._activeTouches[t.identifier] = key; self._down[key] = true; }
      }
    }, { passive: true });
    this.canvas.addEventListener('touchmove', function(e) {
      if (!self.virtualPadEnabled) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);
        var prev = self._activeTouches[t.identifier];
        var nk = self._hitTestPad(pos.x, pos.y);
        if (prev && prev !== nk) self._down[prev] = false;
        if (nk) { self._activeTouches[t.identifier] = nk; self._down[nk] = true; }
        else delete self._activeTouches[t.identifier];
      }
    }, { passive: true });
    var onEnd = function(e) {
      if (!self.virtualPadEnabled) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var key = self._activeTouches[t.identifier];
        if (key) { self._down[key] = false; delete self._activeTouches[t.identifier]; }
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

  isKeyDown(key)    { return !!this._down[key]; }
  isKeyPressed(key) { return !!this._pressed[key]; }

  renderVirtualPad(ctx) {
    if (!this.virtualPadEnabled) return;
    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var isActive = this.isKeyDown(btn.key);
      ctx.save();
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 16px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)';
      ctx.fillText(btn.label, btn.x, btn.y);
      ctx.restore();
    }
  }
}
