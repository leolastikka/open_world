const { EntityManager } = require('./entity_manager');
const { Vector2 } = require('../math');

const EntityVisibility = Object.freeze({
  All: -1,
  None: 0
});

class Entity {
  constructor(area, typeData, name, pos) {
    this.area = area;
    this._typeData = typeData;
    this._name = name; // name set from editor
    this._networkId = EntityManager.getNewNetworkId();
    this._isSpawned = false;
    this.pos = Vector2.clone(pos);
    this.lastIntPos = Vector2.clone(this.pos);
    this._isDestroyed = false;
    this._visibleFor = EntityVisibility.All;
  }

  get name() {
    return this._name;
  }

  get networkId() {
    return this._networkId;
  }

  get visibleFor() {
    return this._visibleFor;
  }

  get typeData() {
    return this._typeData;
  }

  get actions() {
    return [];
  }

  get interactPositions() {
    return this.area.navigator.getNeighbors(this.pos);
  }

  get isSpawned() {
    return this._isSpawned;
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  update() {
    if (!this._isSpawned) {
      this.spawn();
    }
  }

  spawn() {
    this.area.spawnEntity(this);
    this._isSpawned = true;
  }

  /**
   * Called when entity is removed from spawned entities
   */
  despawn() {
    this._isSpawned = false;
    this.area.despawnEntity(this);
  }

  /**
   * Called when entity is completely removed from entities
   */
  dispose() {
    if (this._isSpawned) {
      this.despawn();
    }
    this.area.removeEntity(this);
    this.area = null;
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
  Entity,
  EntityVisibility
};
