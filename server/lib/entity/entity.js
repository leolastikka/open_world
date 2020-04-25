const { EntityManager } = require('./entity_manager');
const { Vector2 } = require('../math');

// eg NPC1, NPC2, ...
class Entity {
  constructor(area, typeData, name, pos) {
    this._area = area;
    this._typeData = typeData;
    this._name = name; // name set from editor
    this._networkId = EntityManager.getNewNetworkId();
    this._isSpawned = false;
    this.pos = Vector2.clone(pos);
    this._isDestroyed = false;
  }

  get name() {
    return this._name;
  }

  get networkId() {
    return this._networkId;
  }

  get actions() {
    return [];
  }

  get interactPositions() {
    return this._area.navigator.getNeighbors(this.pos);
  }

  update = () => {}

  spawn = () => {
    this._isSpawned = true;
  }

  /**
   * Called when entity is removed from spawned entities
   */
  despawn = () => {
    this._isSpawned = false;
  }

  /**
   * Called when entity is completely removed from entities
   */
  dispose = () => {
    if (this._isSpawned) {
      this.despawn();
    }
    this._area = null;
  }

  toJSON() {
    return {
      networkId: this._networkId,
      baseType: this._typeData.baseType,
      name: this._name,
      pos: this.pos
    };
  }
}

module.exports = {
  Entity
};
