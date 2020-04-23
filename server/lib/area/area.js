const { Navigator } = require('../navigator');
const { Container } = require('./container');
const { NPC, Enemy } = require('./character');

class Area {
  constructor(size, tiles) {
    this._size = size;
    this._tiles = tiles;
    this._navigator = new Navigator(this);

    this._entities = [];
    this._spawnedEntities = [];
    this._entityDestroyed = false;
  }

  get size() {
    return this._size;
  }

  get tiles() {
    return this._tiles;
  }

  get objects() {
    return this._objects;
  }

  get navigator() {
    return this._navigator;
  }

  get entityManager() {
    return this._entityManager;
  }

  update = () => {
    this._entities.forEach(entity => entity.update());
    if (this._entityDestroyed) {
      this._entities = this._entities.filter(entity => {
        if (!entity._isDestroyed)
        {
          return true; 
        }

        entity._dispose();
        return false;
      });
      this._entityDestroyed = false;
    }
  }

  addEntity = (typeData, name, pos) => {
    let entity = null;
  
    switch (typeData.baseType) {
      case 'npc':
        entity = new NPC(this, typeData, name, pos);
        break;
      case 'enemy':
        entity = new Enemy(this, typeData, name, pos);
        break;
      case 'container':
        entity = new Container(this, typeData, name, pos);
        break;
      default:
        throw new Error(`Unknown Entity Type: ${typeData.baseType}`);
    }

    this._entities.push(entity);
    return entity;
  }

  removeEntity = (entity) => {

  }
}

module.exports = {
  Area
};
