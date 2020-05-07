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

  get isSpawned() {
    return this._isSpawned;
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  update() {}

  spawn() {
    this._area.spawnEntity(this);
    this._isSpawned = true;
  }

  /**
   * Called when entity is removed from spawned entities
   */
  despawn() {
    this._isSpawned = false;
    this._area.despawnEntity(this);
  }

  /**
   * Called when entity is completely removed from entities
   */
  dispose() {
    if (this._isSpawned) {
      this.despawn();
    }
    this._area.removeEntity(this);
    this._area = null;
  }

  toJSON() {
    return {
      networkId: this._networkId,
      type: this._typeData.type,
      baseType: this._typeData.baseType,
      name: this._name,
      pos: this.pos
    };
  }
}

module.exports = {
  Entity
};
