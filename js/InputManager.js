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
    var mr = 70; // 移動ボタン半径
    var ar = 65; // 攻撃ボタン半径

    // 左側: 十字移動ボタン
    var dpadCx = 120, dpadCy = H - 130;
    var dpadSpread = 80;

    return {
      // 移動 (左側)
      left:  { x: dpadCx - dpadSpread, y: dpadCy,              r: mr, label: '←', key: 'left',  color: '#ffffff' },
      right: { x: dpadCx + dpadSpread, y: dpadCy,              r: mr, label: '→', key: 'right', color: '#ffffff' },
      up:    { x: dpadCx,              y: dpadCy - dpadSpread,  r: mr, label: '↑', key: 'up',    color: '#ffffff' },
      down:  { x: dpadCx,              y: dpadCy + dpadSpread,  r: mr, label: '↓', key: 'down',  color: '#ffffff' },

      // 攻撃 (右側)
      physical: { x: W - 250, y: H - 90,  r: ar, label: '物理', key: 'physical',    color: '#cc4444' },
      magical:  { x: W - 100, y: H - 90,  r: ar, label: '魔法', key: 'magical',     color: '#4488ff' },
      ultimate: { x: W - 175, y: H - 220, r: ar, label: '必殺', key: 'ultimate',    color: '#ffd700' },
      autoBtn:  { x: W - 60,  y: H - 220, r: 45, label: 'AUTO', key: 'auto_toggle', color: '#44ff88' },
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
    var cx = (touch.clientX - rect.left) / scale;
    var cy = (touch.clientY - rect.top) / scale;
    return { x: cx, y: cy };
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
