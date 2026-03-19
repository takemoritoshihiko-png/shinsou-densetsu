// 図鑑データ管理システム
class BookSystem {
  constructor() {
    // モンスター図鑑 { monsterId: { encountered: true, kills: number } }
    this.monsters = {};
    // 装備図鑑 { baseId: { discovered: true, bestRank: 'common', bestUpgrade: 0 } }
    this.equipment = {};
    // アイテム図鑑 { itemKey: true }
    this.items = {};
  }

  // === モンスター ===
  registerMonsterEncounter(monsterId) {
    if (!this.monsters[monsterId]) {
      this.monsters[monsterId] = { encountered: true, kills: 0 };
    }
  }

  registerMonsterKill(monsterId) {
    this.registerMonsterEncounter(monsterId);
    this.monsters[monsterId].kills++;
  }

  isMonsterEncountered(monsterId) {
    return !!(this.monsters[monsterId] && this.monsters[monsterId].encountered);
  }

  getMonsterKills(monsterId) {
    return this.monsters[monsterId] ? this.monsters[monsterId].kills : 0;
  }

  getMonsterDiscoveredCount() {
    var count = 0;
    for (var id in this.monsters) {
      if (this.monsters[id].encountered) count++;
    }
    return count;
  }

  // === 装備 ===
  registerEquipment(baseId, rank, upgradeLevel) {
    var rankOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legend: 4 };
    if (!this.equipment[baseId]) {
      this.equipment[baseId] = { discovered: true, bestRank: rank, bestUpgrade: upgradeLevel || 0 };
    } else {
      var cur = this.equipment[baseId];
      if ((rankOrder[rank] || 0) > (rankOrder[cur.bestRank] || 0)) {
        cur.bestRank = rank;
      }
      if ((upgradeLevel || 0) > cur.bestUpgrade) {
        cur.bestUpgrade = upgradeLevel;
      }
    }
  }

  isEquipmentDiscovered(baseId) {
    return !!(this.equipment[baseId] && this.equipment[baseId].discovered);
  }

  getEquipmentDiscoveredCount() {
    var count = 0;
    for (var id in this.equipment) {
      if (this.equipment[id].discovered) count++;
    }
    return count;
  }

  // === アイテム ===
  registerItem(itemKey) {
    this.items[itemKey] = true;
  }

  isItemDiscovered(itemKey) {
    return !!this.items[itemKey];
  }

  getItemDiscoveredCount() {
    var count = 0;
    for (var k in this.items) {
      if (this.items[k]) count++;
    }
    return count;
  }

  // 全アイテムキー一覧
  ALL_ITEM_KEYS: [
    { key: 'hpPotion', name: 'HPポーション', color: '#44ff88', desc: 'HP 30%回復' },
    { key: 'mpPotion', name: 'MPポーション', color: '#4488ff', desc: 'MP 30%回復' },
    { key: 'rerollStone', name: '再抽選の石', color: '#44aaff', desc: 'スロット特性を再抽選' },
    { key: 'eraseStone', name: '消去の石', color: '#ff6666', desc: 'スロット特性を消去' },
    { key: 'enhanceMat', name: '強化素材', color: '#ff8844', desc: '仲間パッシブ強化' },
    { key: 'coreCommon', name: 'コモンコア', color: '#aaaaaa', desc: '装備+値強化' },
    { key: 'coreUncommon', name: 'アンコモンコア', color: '#44cc44', desc: '装備+値強化' },
    { key: 'coreRare', name: 'レアコア', color: '#4488ff', desc: '装備+値強化' },
    { key: 'coreEpic', name: 'エピックコア', color: '#bb44ff', desc: '装備+値強化' },
    { key: 'coreLegend', name: 'レジェンドコア', color: '#ffd700', desc: '装備+値強化' },
  ],
}
