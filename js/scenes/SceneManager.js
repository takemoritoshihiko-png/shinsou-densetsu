// シーン管理システム（フェード遷移付き）
class SceneManager {
  constructor() {
    this.scenes = {};
    this.currentScene = null;
    this.currentName = '';

    // フェード遷移
    this.fadeState = 'none'; // 'none' | 'out' | 'in'
    this.fadeAlpha = 0;
    this.fadeDuration = 300; // ms
    this.fadeTimer = 0;
    this._pendingScene = null;
  }

  register(name, scene) {
    this.scenes[name] = scene;
  }

  changeScene(name) {
    if (!this.scenes[name]) {
      console.error('シーンが見つかりません: ' + name);
      return;
    }
    if (this.fadeState !== 'none') return; // フェード中は無視

    this._pendingScene = name;
    this.fadeState = 'out';
    this.fadeTimer = 0;
  }

  // フェードなしで即座に切替（初回用）
  changeSceneImmediate(name) {
    if (!this.scenes[name]) return;
    if (this.currentScene) this.currentScene.exit();
    this.currentName = name;
    this.currentScene = this.scenes[name];
    this.currentScene.enter();
  }

  update(dt) {
    // フェード更新
    if (this.fadeState === 'out') {
      this.fadeTimer += dt;
      this.fadeAlpha = Math.min(this.fadeTimer / this.fadeDuration, 1);
      if (this.fadeAlpha >= 1) {
        // フェードアウト完了 → シーン切替 → フェードイン開始
        if (this.currentScene) this.currentScene.exit();
        this.currentName = this._pendingScene;
        this.currentScene = this.scenes[this._pendingScene];
        this.currentScene.enter();
        this._pendingScene = null;
        this.fadeState = 'in';
        this.fadeTimer = 0;
      }
    } else if (this.fadeState === 'in') {
      this.fadeTimer += dt;
      this.fadeAlpha = 1 - Math.min(this.fadeTimer / this.fadeDuration, 1);
      if (this.fadeAlpha <= 0) {
        this.fadeState = 'none';
        this.fadeAlpha = 0;
      }
    }

    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene) {
      this.currentScene.render(ctx);
    }

    // フェードオーバーレイ
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, ' + this.fadeAlpha + ')';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
  }

  handleTap(x, y) {
    if (this.fadeState !== 'none') return; // フェード中はタップ無視
    if (this.currentScene && this.currentScene.onTap) {
      this.currentScene.onTap(x, y);
    }
  }
}
