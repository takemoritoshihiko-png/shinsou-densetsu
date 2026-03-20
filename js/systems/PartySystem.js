// パーティ管理システム
class PartySystem {
  constructor() {
    // 所持キャラ一覧
    this.characters = [];
    this._nextId = 1;

    // パーティ編成: 前衛3枠(index 0=操作キャラ) + 馬車3枠
    this.frontLine = [null, null, null]; // charId or null
    this.reserve = [null, null, null];   // charId or null

    // レアリティ倍率
    this.RARITY_MUL = { N: 1.0, R: 1.2, SR: 1.5, SSR: 2.0 };

    // 強化素材
    this.enhanceMaterials = 0;
  }

  // キャラクターを追加
  addCharacter(name, job, rarity) {
    var ch = {
      id: this._nextId++,
      name: name,
      job: job,
      rarity: rarity,
      level: 1,
      classLevel: 1,
      enhanceLevel: 1, // 強化段階 1〜10
    };
    this.characters.push(ch);
    return ch;
  }

  // IDでキャラ取得
  getCharById(id) {
    for (var i = 0; i < this.characters.length; i++) {
      if (this.characters[i].id === id) return this.characters[i];
    }
    return null;
  }

  // 前衛メンバー一覧を取得（キャラオブジェクト配列、null含む）
  getFrontLineChars() {
    var result = [];
    for (var i = 0; i < this.frontLine.length; i++) {
      result.push(this.frontLine[i] ? this.getCharById(this.frontLine[i]) : null);
    }
    return result;
  }

  // 馬車メンバー一覧
  getReserveChars() {
    var result = [];
    for (var i = 0; i < this.reserve.length; i++) {
      result.push(this.reserve[i] ? this.getCharById(this.reserve[i]) : null);
    }
    return result;
  }

  // キャラがパーティのどこかに配置されているか
  getSlotOf(charId) {
    for (var i = 0; i < this.frontLine.length; i++) {
      if (this.frontLine[i] === charId) return { zone: 'front', index: i };
    }
    for (var j = 0; j < this.reserve.length; j++) {
      if (this.reserve[j] === charId) return { zone: 'reserve', index: j };
    }
    return null;
  }

  // スロットにキャラを配置（以前のスロットからは外す）
  setSlot(zone, index, charId) {
    // 元の位置から外す
    if (charId) {
      var prev = this.getSlotOf(charId);
      if (prev) {
        if (prev.zone === 'front') this.frontLine[prev.index] = null;
        else this.reserve[prev.index] = null;
      }
    }

    // 配置先に既にいるキャラがいたら外す
    if (zone === 'front') {
      this.frontLine[index] = charId;
    } else {
      this.reserve[index] = charId;
    }
  }

  // スロットからキャラを外す
  clearSlot(zone, index) {
    if (zone === 'front') {
      // 操作キャラ（index 0）は外せない
      if (index === 0) return;
      this.frontLine[index] = null;
    } else {
      this.reserve[index] = null;
    }
  }

  // キャラの強化済みパッシブバフを取得
  getCharPassiveBuff(ch) {
    if (!ch) return {};
    var base = ClassData.getPassiveBuff(ch.job);
    var elvl = ch.enhanceLevel || 1;
    var charLv = ch.level || 1;
    var rarity = ch.rarity || 'N';

    // 強化レベル倍率: Lv1=100%, Lv10=190%
    var enhanceMul = 1 + (elvl - 1) * 0.1;

    // レアリティ倍率: N=1.0, R=1.3, SR=1.6, SSR=2.2, UR=3.0
    var rarityMul = { N: 1.0, R: 1.3, SR: 1.6, SSR: 2.2, UR: 3.0 };
    var rMul = rarityMul[rarity] || 1.0;

    // キャラレベル倍率: Lv1=100%, Lv50で150%, Lv99で200%
    var lvMul = 1 + (charLv - 1) * 0.01;

    var totalMul = enhanceMul * rMul * lvMul;

    var result = {};
    for (var key in base) {
      result[key] = Math.round(base[key] * totalMul * 10) / 10;
    }
    return result;
  }


  // 前衛全員のパッシブバフを統合して返す（強化倍率込み）
  getCombinedPassiveBuffs() {
    var combined = {};
    var chars = this.getFrontLineChars();
    for (var i = 0; i < chars.length; i++) {
      var passive = this.getCharPassiveBuff(chars[i]);
      for (var key in passive) {
        combined[key] = (combined[key] || 0) + passive[key];
      }
    }
    return combined;
  }

  // 強化に必要な素材数
  getEnhanceCost(currentLevel) {
    return currentLevel * 5;
  }

  // キャラを強化
  enhanceCharacter(charId) {
    var ch = this.getCharById(charId);
    if (!ch || ch.enhanceLevel >= 10) return false;
    var cost = this.getEnhanceCost(ch.enhanceLevel);
    if (this.enhanceMaterials < cost) return false;
    this.enhanceMaterials -= cost;
    ch.enhanceLevel++;
    return true;
  }

  // パッシブバフの説明テキスト配列を返す（強化込み）
  getPassiveBuffDescriptions() {
    var descs = [];
    var chars = this.getFrontLineChars();
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (!ch) continue;
      var jobData = ClassData.get(ch.job);
      if (!jobData) continue;
      var buff = this.getCharPassiveBuff(ch);
      // 値を文字列化
      var parts = [];
      if (buff.atk_percent) parts.push('ATK+' + buff.atk_percent + '%');
      if (buff.matk_percent) parts.push('MATK+' + buff.matk_percent + '%');
      if (buff.spd_percent) parts.push('SPD+' + buff.spd_percent + '%');
      if (buff.crit_percent) parts.push('CRIT+' + buff.crit_percent + '%');
      if (buff.damage_reduction) parts.push('被ダメ-' + buff.damage_reduction + '%');
      if (buff.hp_regen_per_sec) parts.push('HP回復' + buff.hp_regen_per_sec + '%/s');
      var desc = parts.join(' ');
      desc += ' [' + ch.rarity + ' Lv.' + (ch.level || 1) + ' 強化' + (ch.enhanceLevel || 1) + ']';
      descs.push({ name: ch.name, job: jobData.name, desc: desc, color: jobData.color });
    }
    return descs;
  }

  // 未配置の所持キャラ一覧
  getUnassigned() {
    var assigned = {};
    for (var i = 0; i < this.frontLine.length; i++) {
      if (this.frontLine[i]) assigned[this.frontLine[i]] = true;
    }
    for (var j = 0; j < this.reserve.length; j++) {
      if (this.reserve[j]) assigned[this.reserve[j]] = true;
    }
    var result = [];
    for (var k = 0; k < this.characters.length; k++) {
      if (!assigned[this.characters[k].id]) result.push(this.characters[k]);
    }
    return result;
  }
}
