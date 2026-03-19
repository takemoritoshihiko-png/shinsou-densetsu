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
    this._isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

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

    // ジョイスティック状態
    this._joyActive = false;
    this._joyTouchId = null;
    this._joyCenterX = 0;
    this._joyCenterY = 0;
    this._joyDx = 0;
    this._joyDy = 0;

    this.padButtons = this._createPadButtons();
    this._bindKeyboard();
    this._bindTouch();
  }

  _createPadButtons() {
    var W = CONFIG.CANVAS_WIDTH;
    var H = CONFIG.CANVAS_HEIGHT;
    var r = 30;
    return {
      physical:  { x: W - 170, y: H - 90,  r: r, label: '物理',  key: 'physical', color: '#cc4444' },
      magical:   { x: W - 90,  y: H - 90,  r: r, label: '魔法',  key: 'magical',  color: '#4488ff' },
      ultimate:  { x: W - 130, y: H - 160, r: r, label: '必殺',  key: 'ultimate', color: '#ffd700' },
      autoBtn:   { x: W - 50,  y: H - 160, r: 22, label: 'AUTO', key: 'auto_toggle', color: '#44ff88' },
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

  _isLeftSide(x) {
    return x < CONFIG.CANVAS_WIDTH * 0.4;
  }

  _bindTouch() {
    var self = this;

    this.canvas.addEventListener('touchstart', function(e) {
      if (!self.virtualPadEnabled) return;
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);

        // 右側: 攻撃ボタン判定
        var key = self._hitTestPad(pos.x, pos.y);
        if (key) {
          self._activeTouches[t.identifier] = key;
          self._down[key] = true;
          continue;
        }

        // 左側: ジョイスティック開始
        if (self._isLeftSide(pos.x) && !self._joyActive) {
          self._joyActive = true;
          self._joyTouchId = t.identifier;
          self._joyCenterX = pos.x;
          self._joyCenterY = pos.y;
          self._joyDx = 0;
          self._joyDy = 0;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', function(e) {
      if (!self.virtualPadEnabled) return;
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var pos = self._getCanvasPos(t);

        // ジョイスティック移動
        if (self._joyActive && t.identifier === self._joyTouchId) {
          self._joyDx = pos.x - self._joyCenterX;
          self._joyDy = pos.y - self._joyCenterY;
          var deadzone = 12;
          self._down['left'] = self._joyDx < -deadzone;
          self._down['right'] = self._joyDx > deadzone;
          self._down['up'] = self._joyDy < -deadzone;
          self._down['down'] = self._joyDy > deadzone;
          continue;
        }

        // 攻撃ボタンのスライド
        var prev = self._activeTouches[t.identifier];
        var nk = self._hitTestPad(pos.x, pos.y);
        if (prev && prev !== nk) self._down[prev] = false;
        if (nk) { self._activeTouches[t.identifier] = nk; self._down[nk] = true; }
        else if (prev) delete self._activeTouches[t.identifier];
      }
    }, { passive: false });

    var onEnd = function(e) {
      if (!self.virtualPadEnabled) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];

        // ジョイスティック終了
        if (self._joyActive && t.identifier === self._joyTouchId) {
          self._joyActive = false;
          self._joyTouchId = null;
          self._joyDx = 0;
          self._joyDy = 0;
          self._down['left'] = false;
          self._down['right'] = false;
          self._down['up'] = false;
          self._down['down'] = false;
          continue;
        }

        // 攻撃ボタン終了
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

  isKeyDown(key) { return !!this._down[key]; }
  isKeyPressed(key) { return !!this._pressed[key]; }

  renderVirtualPad(ctx) {
    if (!this.virtualPadEnabled) return;

    // === 左: バーチャルジョイスティック ===
    var joyR = 50;
    var joyX, joyY;
    if (this._joyActive) {
      joyX = this._joyCenterX;
      joyY = this._joyCenterY;
    } else {
      joyX = 100;
      joyY = CONFIG.CANVAS_HEIGHT - 100;
    }

    // 外枠
    ctx.save();
    ctx.globalAlpha = this._joyActive ? 0.4 : 0.2;
    ctx.beginPath();
    ctx.arc(joyX, joyY, joyR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();

    // スティック
    var stickR = 20;
    var stickDx = this._joyDx;
    var stickDy = this._joyDy;
    var stickDist = Math.sqrt(stickDx * stickDx + stickDy * stickDy);
    if (stickDist > joyR) {
      stickDx = stickDx / stickDist * joyR;
      stickDy = stickDy / stickDist * joyR;
    }
    ctx.globalAlpha = this._joyActive ? 0.7 : 0.3;
    ctx.beginPath();
    ctx.arc(joyX + stickDx, joyY + stickDy, stickR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // === 右: 攻撃ボタン ===
    for (var name in this.padButtons) {
      var btn = this.padButtons[name];
      var isActive = this.isKeyDown(btn.key);

      ctx.save();
      // 背景円
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? (btn.color + '88')
        : (btn.color + '33');
      ctx.fill();
      ctx.strokeStyle = isActive ? btn.color : (btn.color + '88');
      ctx.lineWidth = 2;
      ctx.stroke();

      // ラベル
      ctx.font = name === 'autoBtn' ? 'bold 10px ' + CONFIG.FONT_FAMILY : 'bold 14px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.7)';
      ctx.fillText(btn.label, btn.x, btn.y);
      ctx.restore();
    }
  }
}
