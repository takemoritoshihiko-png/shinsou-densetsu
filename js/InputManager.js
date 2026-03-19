// 入力管理システム（キーボード＋仮想パッド）
class InputManager {
  constructor(canvas, getScale) {
    this.canvas = canvas;
    this.getScale = getScale; // () => currentScale を返す関数

    // キー状態
    this._down = {};      // 現在押されているか
    this._pressed = {};   // 今フレームで押されたか
    this._downPrev = {};  // 前フレームの状態

    // 仮想パッド表示フラグ
    this.virtualPadEnabled = false;

    // 仮想パッドのアクティブなタッチ
    this._activeTouches = {}; // touchId -> buttonName

    // キーマッピング（物理キー → 論理名）
    this.keyMap = {
      'ArrowLeft':  'left',
      'ArrowRight': 'right',
      'ArrowUp':    'jump',
      ' ':          'jump',
      'z':          'skill1',
      'Z':          'skill1',
      'x':          'skill2',
      'X':          'skill2',
      'c':          'skill3',
      'C':          'skill3',
      'v':          'ultimate',
      'V':          'ultimate',
    };

    // 仮想パッドのボタン定義（Canvas座標）
    this.padButtons = this._createPadButtons();

    // イベント登録
    this._bindKeyboard();
    this._bindTouch();
  }

  // 仮想パッドのボタン配置を生成
  _createPadButtons() {
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const r = 40; // 半径40px = 直径80px

    return {
      // 左下: 移動パッド
      left:  { x: 80,  y: H - 80,  r: r, label: '←', key: 'left' },
      right: { x: 200, y: H - 80,  r: r, label: '→', key: 'right' },
      jump:  { x: 140, y: H - 160, r: r, label: '↑', key: 'jump' },

      // 右下: スキルボタン
      skill1:   { x: W - 260, y: H - 80,  r: r, label: 'Z',  key: 'skill1' },
      skill2:   { x: W - 140, y: H - 80,  r: r, label: 'X',  key: 'skill2' },
      skill3:   { x: W - 260, y: H - 160, r: r, label: 'C',  key: 'skill3' },
      ultimate: { x: W - 140, y: H - 160, r: r, label: 'V',  key: 'ultimate' },
    };
  }

  // --- キーボード ---

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const name = this.keyMap[e.key];
      if (name) {
        this._down[name] = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const name = this.keyMap[e.key];
      if (name) {
        this._down[name] = false;
        e.preventDefault();
      }
    });
  }

  // --- タッチ（仮想パッド） ---

  _getCanvasPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.getScale();
    return {
      x: (touch.clientX - rect.left) / scale,
      y: (touch.clientY - rect.top) / scale,
    };
  }

  _hitTestPad(x, y) {
    if (!this.virtualPadEnabled) return null;
    for (const name in this.padButtons) {
      const btn = this.padButtons[name];
      const dx = x - btn.x;
      const dy = y - btn.y;
      if (dx * dx + dy * dy <= btn.r * btn.r) {
        return btn.key;
      }
    }
    return null;
  }

  _bindTouch() {
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.virtualPadEnabled) return;
      for (const touch of e.changedTouches) {
        const pos = this._getCanvasPos(touch);
        const key = this._hitTestPad(pos.x, pos.y);
        if (key) {
          this._activeTouches[touch.identifier] = key;
          this._down[key] = true;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.virtualPadEnabled) return;
      for (const touch of e.changedTouches) {
        const pos = this._getCanvasPos(touch);
        const prevKey = this._activeTouches[touch.identifier];
        const newKey = this._hitTestPad(pos.x, pos.y);

        // 指がボタン間を移動した場合
        if (prevKey && prevKey !== newKey) {
          this._down[prevKey] = false;
        }
        if (newKey) {
          this._activeTouches[touch.identifier] = newKey;
          this._down[newKey] = true;
        } else {
          delete this._activeTouches[touch.identifier];
        }
      }
    }, { passive: true });

    const onTouchEnd = (e) => {
      if (!this.virtualPadEnabled) return;
      for (const touch of e.changedTouches) {
        const key = this._activeTouches[touch.identifier];
        if (key) {
          this._down[key] = false;
          delete this._activeTouches[touch.identifier];
        }
      }
    };

    this.canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    this.canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  // --- 毎フレーム呼ぶ ---

  // フレーム先頭で呼ぶ: pressed判定の更新
  update() {
    for (const key in this._down) {
      this._pressed[key] = this._down[key] && !this._downPrev[key];
    }
    // 前フレーム状態を保存
    for (const key in this._down) {
      this._downPrev[key] = this._down[key];
    }
  }

  // 押している間 true
  isKeyDown(key) {
    return !!this._down[key];
  }

  // 押した瞬間だけ true
  isKeyPressed(key) {
    return !!this._pressed[key];
  }

  // --- 仮想パッド描画 ---

  renderVirtualPad(ctx) {
    if (!this.virtualPadEnabled) return;

    for (const name in this.padButtons) {
      const btn = this.padButtons[name];
      const isActive = this.isKeyDown(btn.key);

      ctx.save();

      // 円形ボタン
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? 'rgba(255, 255, 255, 0.35)'
        : 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ラベル
      ctx.font = 'bold 22px ' + CONFIG.FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(btn.label, btn.x, btn.y);

      ctx.restore();
    }
  }
}
