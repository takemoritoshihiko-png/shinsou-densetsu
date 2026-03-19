// レベルアップシステム
var LevelSystem = {

  MAX_LEVEL: 99,

  /**
   * 必要経験値 = floor(10 × level^1.5)
   * @param {number} level - 現在のレベル
   * @returns {number} 次のレベルに必要なEXP
   */
  expToNext: function (level) {
    return Math.floor(10 * Math.pow(level, 1.5));
  },

  /**
   * EXPを付与してレベルアップ処理を行う（連続レベルアップ対応）
   * @param {object} player - Playerオブジェクト
   * @param {number} amount - 獲得EXP
   * @returns {number} レベルアップした回数
   */
  gainExp: function (player, amount) {
    if (player.level >= this.MAX_LEVEL) return 0;

    player.totalExp += amount;
    var levelUps = 0;

    while (player.level < this.MAX_LEVEL && player.totalExp >= player.expToNext) {
      player.totalExp -= player.expToNext;
      player.level++;
      levelUps++;

      // ステータス再計算
      player._applyStats();
      player.expToNext = this.expToNext(player.level);

      // HP/MP全回復
      player.hp = player.hpMax;
      player.mp = player.mpMax;

      console.log('レベルアップ! Lv.' + player.level +
        ' (HP:' + player.hpMax + ' ATK:' + player.atk + ' DEF:' + player.def + ')');
    }

    // 最大レベルに達したら余りEXPを0に
    if (player.level >= this.MAX_LEVEL) {
      player.totalExp = 0;
    }

    return levelUps;
  },
};

// レベルアップエフェクト（バトル画面上に表示）
class LevelUpEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.elapsed = 0;
    this.duration = 1500; // ms
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    var progress = this.elapsed / this.duration;

    // 上に浮く
    var offsetY = -60 * progress;

    // フェード: 最初0.3秒でフェードイン、最後0.4秒でフェードアウト
    var alpha;
    if (progress < 0.2) {
      alpha = progress / 0.2;
    } else if (progress < 0.6) {
      alpha = 1;
    } else {
      alpha = 1 - (progress - 0.6) / 0.4;
    }

    // スケール（最初少し大きく → 通常サイズ）
    var scale = progress < 0.15 ? 1 + 0.3 * (1 - progress / 0.15) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y + offsetY);
    ctx.scale(scale, scale);

    // 金色テキスト
    ctx.font = 'bold 32px ' + CONFIG.FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 光彩
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 15;

    ctx.fillStyle = '#ffd700';
    ctx.fillText('LEVEL UP!', 0, 0);

    ctx.restore();
  }
}
