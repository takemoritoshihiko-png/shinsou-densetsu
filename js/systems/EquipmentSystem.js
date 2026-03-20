// 装備管理システム
class EquipmentSystem {
  constructor() {
    // 所持装備一覧（インスタンス）
    this.inventory = [];
    this._nextUid = 1;

    // アップグレードコア所持数
    this.cores = { common: 0, uncommon: 0, rare: 0, epic: 0, legend: 0 };

    // スロット操作アイテム所持数
    this.rerollStones = 0;
    this.eraseStones = 0;

    // ポーション所持数
    this.hpPotions = 3;
    this.mpPotions = 2;

    // 売却基本価格
    this.SELL_PRICES = { common: 80, uncommon: 300, rare: 1000, epic: 4000, legend: 15000 };

    // 装備プリセット（最大5セット）
    this.presets = []; // [{ name, equipped: {weapon:uid,...} }]
    this.MAX_PRESETS = 5;

    // 装備中のスロット
    this.equipped = {
      weapon: null,
      shield: null,
      head: null,
      body: null,
      feet: null,
      accessory: null,
    };
  }

  // 装備インスタンスを生成してインベントリに追加（特性ランダム付与）
  addEquipment(baseId, rank) {
    var base = EquipmentData.getBase(baseId);
    if (!base) return null;
    var stats = EquipmentData.calcStats(baseId, rank);
    var traits = EquipmentData.generateTraits(rank);
    var displayName = EquipmentData.buildName(base.name, traits);
    var slots = SlotTraitData.generateSlots(rank);
    var item = {
      uid: this._nextUid++,
      baseId: baseId,
      baseName: base.name,
      name: displayName,
      slot: base.slot || 'weapon',
      rank: rank,
      requiredLevel: base.reqLv,
      baseStats: stats,
      innateTraits: traits,
      slots: slots,
      upgradeLevel: 0,
    };
    this.inventory.push(item);
    return item;
  }

  // UIDで装備を取得
  getByUid(uid) {
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].uid === uid) return this.inventory[i];
    }
    return null;
  }

  // 装備する
  equip(uid) {
    var item = this.getByUid(uid);
    if (!item) return false;
    // 同スロットの既存を外す
    this.equipped[item.slot] = uid;
    return true;
  }

  // 装備を外す
  unequip(slot) {
    this.equipped[slot] = null;
  }

  // 装備中かどうか
  isEquipped(uid) {
    for (var slot in this.equipped) {
      if (this.equipped[slot] === uid) return true;
    }
    return false;
  }

  // スロットの装備を取得
  getEquippedItem(slot) {
    var uid = this.equipped[slot];
    return uid ? this.getByUid(uid) : null;
  }

  // ステ%キー → 基本ステキーのマッピング
  get _STAT_PCT_MAP() {
    return {
      atk_pct: 'atk', matk_pct: 'matk', def_pct: 'def', mdef_pct: 'mdef',
      hp_pct: 'hp', spd_pct: 'spd', crit_pct: 'crit',
    };
  }

  // トレイト配列からステータスボーナスを加算
  _applyTraitBonuses(bonus, traitList, baseStats, upgMul) {
    if (!traitList) return;
    for (var t = 0; t < traitList.length; t++) {
      var tr = traitList[t];
      if (!tr) continue; // 消去済みnullスロット対応
      var statKey = this._STAT_PCT_MAP[tr.key];
      if (statKey) {
        var baseVal = baseStats[statKey] || 0;
        var boostedValue = tr.value * (upgMul || 1);
        var addVal = baseVal * boostedValue / 100;
        if (statKey === 'crit') {
          bonus[statKey] = Math.round((bonus[statKey] + addVal) * 10) / 10;
        } else {
          bonus[statKey] += Math.floor(addVal);
        }
      }
    }
  }

  // 装備1個の実効ボーナス（基本ステ×第3層+値＋第1層特性＋第2層スロット特性）
  _calcItemBonus(item) {
    var bonus = {};
    var keys = EquipmentData.STAT_KEYS;
    // 第3層: +値による基礎ステ倍率
    var upgMul = UpgradeSystem.getUpgradeMultiplier(item.upgradeLevel);
    var upgradedBase = {};
    for (var i = 0; i < keys.length; i++) {
      var raw = item.baseStats[keys[i]] || 0;
      if (keys[i] === 'crit') {
        upgradedBase[keys[i]] = Math.round(raw * upgMul * 10) / 10;
      } else {
        upgradedBase[keys[i]] = Math.floor(raw * upgMul);
      }
      bonus[keys[i]] = upgradedBase[keys[i]];
    }
    // 第1層: 固有特性（強化後の基礎ステに対して%計算）
    this._applyTraitBonuses(bonus, item.innateTraits, upgradedBase, upgMul);
    // 第2層: スロット特性（同上）
    this._applyTraitBonuses(bonus, item.slots, upgradedBase, upgMul);
    return bonus;
  }

  // 全装備のスロット特性の合計（バトル中の特殊効果用）
  getTotalSlotEffects() {
    var effects = {};
    for (var slot in this.equipped) {
      var item = this.getEquippedItem(slot);
      if (!item || !item.slots) continue;
      for (var s = 0; s < item.slots.length; s++) {
        var tr = item.slots[s];
        if (!tr) continue;
        effects[tr.key] = (effects[tr.key] || 0) + tr.value;
      }
    }
    // 固有特性の特殊効果も合算
    for (var slot2 in this.equipped) {
      var item2 = this.getEquippedItem(slot2);
      if (!item2 || !item2.innateTraits) continue;
      for (var t = 0; t < item2.innateTraits.length; t++) {
        var tr2 = item2.innateTraits[t];
        // 特殊系のみ（ステ%系はbaseStatsに反映済み）
        if (!this._STAT_PCT_MAP[tr2.key]) {
          effects[tr2.key] = (effects[tr2.key] || 0) + tr2.value;
        }
      }
    }
    return effects;
  }

  // === プリセット ===
  savePreset(name) {
    if (this.presets.length >= this.MAX_PRESETS) return false;
    var snapshot = {};
    for (var s in this.equipped) {
      snapshot[s] = this.equipped[s]; // uid or null
    }
    this.presets.push({ name: name, equipped: snapshot });
    return true;
  }

  loadPreset(index) {
    if (index < 0 || index >= this.presets.length) return false;
    var preset = this.presets[index];
    for (var s in preset.equipped) {
      var uid = preset.equipped[s];
      if (uid && this.getByUid(uid)) {
        this.equipped[s] = uid;
      } else {
        this.equipped[s] = null;
      }
    }
    return true;
  }

  deletePreset(index) {
    if (index < 0 || index >= this.presets.length) return false;
    this.presets.splice(index, 1);
    return true;
  }

  // 売却額を計算
  getSellPrice(item) {
    var base = this.SELL_PRICES[item.rank] || 80;
    var upgMul = 1 + (item.upgradeLevel || 0) * 0.5;
    // ステータス合計に応じたボーナス
    var statTotal = 0;
    var keys = EquipmentData.STAT_KEYS;
    for (var i = 0; i < keys.length; i++) {
      statTotal += (item.baseStats[keys[i]] || 0);
    }
    // スロット特性数ボーナス
    var slotBonus = item.slots ? item.slots.length * 50 : 0;
    // 固有特性ボーナス
    var traitBonus = item.innateTraits ? item.innateTraits.length * 100 : 0;
    return Math.floor((base + statTotal * 2 + slotBonus + traitBonus) * upgMul);
  }

  // 装備を売却（インベントリから削除）
  sellEquipment(uid) {
    var item = this.getByUid(uid);
    if (!item) return 0;
    if (this.isEquipped(uid)) return 0; // 装備中は売れない
    var price = this.getSellPrice(item);
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].uid === uid) {
        this.inventory.splice(i, 1);
        break;
      }
    }
    return price;
  }

  // スロット特性を再抽選
  rerollSlot(itemUid, slotIndex) {
    var item = this.getByUid(itemUid);
    if (!item || !item.slots) return null;
    if (slotIndex < 0 || slotIndex >= item.slots.length) return null;
    if (this.rerollStones < 1) return null;

    this.rerollStones--;
    var oldTrait = item.slots[slotIndex];
    var newTrait = SlotTraitData.rollOneTrait(item.rank);
    item.slots[slotIndex] = newTrait;
    return { old: oldTrait, new: newTrait };
  }

  // 空スロットに再抽選の石で新特性を付与
  fillEmptySlot(itemUid, slotIndex) {
    var item = this.getByUid(itemUid);
    if (!item || !item.slots) return null;
    if (slotIndex < 0 || slotIndex >= item.slots.length) return null;
    if (item.slots[slotIndex] !== null) return null;
    if (this.rerollStones < 1) return null;

    this.rerollStones--;
    var newTrait = SlotTraitData.rollOneTrait(item.rank);
    item.slots[slotIndex] = newTrait;
    return { new: newTrait };
  }

  // スロット特性を消去（穴は残る=null）
  eraseSlot(itemUid, slotIndex) {
    var item = this.getByUid(itemUid);
    if (!item || !item.slots) return null;
    if (slotIndex < 0 || slotIndex >= item.slots.length) return null;
    if (item.slots[slotIndex] === null) return null;
    if (this.eraseStones < 1) return null;

    this.eraseStones--;
    var oldTrait = item.slots[slotIndex];
    item.slots[slotIndex] = null;
    return { old: oldTrait };
  }

  // 全装備ボーナスの合計を返す（StatusSystem.calcのequipBonusに渡す）
  getTotalEquipBonus() {
    var bonus = {};
    var keys = EquipmentData.STAT_KEYS;
    for (var i = 0; i < keys.length; i++) bonus[keys[i]] = 0;

    for (var slot in this.equipped) {
      var item = this.getEquippedItem(slot);
      if (!item) continue;
      var ib = this._calcItemBonus(item);
      for (var j = 0; j < keys.length; j++) {
        bonus[keys[j]] += (ib[keys[j]] || 0);
      }
    }
    return bonus;
  }

  // 特定スロットの装備可能な所持装備一覧
  getInventoryBySlot(slot) {
    var result = [];
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].slot === slot) result.push(this.inventory[i]);
    }
    return result;
  }

  // 装備中でないバッグ内装備
  getUnequippedInventory() {
    var result = [];
    for (var i = 0; i < this.inventory.length; i++) {
      if (!this.isEquipped(this.inventory[i].uid)) {
        result.push(this.inventory[i]);
      }
    }
    return result;
  }

  // ステータスプレビュー計算（装備を仮に変更した場合のボーナス）
  previewEquipBonus(uidToEquip) {
    var item = this.getByUid(uidToEquip);
    if (!item) return this.getTotalEquipBonus();

    // 現在の装備をコピーして仮変更
    var tempEquipped = {};
    for (var slot in this.equipped) {
      tempEquipped[slot] = this.equipped[slot];
    }
    tempEquipped[item.slot] = uidToEquip;

    var bonus = {};
    var keys = EquipmentData.STAT_KEYS;
    for (var i = 0; i < keys.length; i++) bonus[keys[i]] = 0;

    for (var s in tempEquipped) {
      var uid = tempEquipped[s];
      if (!uid) continue;
      var eq = this.getByUid(uid);
      if (!eq) continue;
      var ib = this._calcItemBonus(eq);
      for (var j = 0; j < keys.length; j++) {
        bonus[keys[j]] += (ib[keys[j]] || 0);
      }
    }
    return bonus;
  }
}
