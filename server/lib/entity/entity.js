const { EntityManager } = require('./entity_manager');
const { Vector2 } = require('../math');

const BaseType = Object.freeze({
  Player: 'player',
  NPC: 'npc',
  Enemy: 'enemy',
  Container: 'container'
});

// eg NPC1, NPC2, ...
class Entity {
  constructor(area, typeData, name, pos) {
    this._area = area;
    this._typeData = typeData;
    this._name = name; // name set from editor
    this._networkId = EntityManager.getNewNID();
    this._isSpawned = false;
    this.pos = Vector2.clone(pos);
    this._isDestroyed = false;
  }

  update = () => {}

  spawn = () => {
    this._isSpawned = true;
  }

  despawn = () => {
    this._isSpawned = false;
  }

  get actions() {
    throw new Error('Not Implemented');
  }

  dispose = () => {
    if (this._isSpawned) {

    }
    this._area = null;
  }
}

module.exports = {
  Entity,
  BaseType
};
