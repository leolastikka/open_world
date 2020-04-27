const _ = require('lodash');
const { Navigator } = require('../navigator');
const { Container } = require('../entity/container');
const { NPC, Enemy, Player } = require('../entity/character');

class Area {
  constructor(name, size, tiles, links) {
    this._name = name;
    this._size = size;
    this._tiles = tiles;
    this._links = links;
    this._navigator = new Navigator(this);

    this._entities = [];
    this._spawnedEntities = [];
    this._entityDestroyed = false;
  }

  get name() {
    return this._name;
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

  get spawnedEntities() {
    return this._spawnedEntities;
  }

  getLinkByType = (type) => {
    return _.find(this._links, {type: type});
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
      case 'container':
        entity = new Container(this, typeData, name, pos);
        break;
      case 'enemy':
        entity = new Enemy(this, typeData, name, pos);
        break;
      case 'npc':
        entity = new NPC(this, typeData, name, pos);
        break;
      case 'player':
        entity = new Player(this, typeData, name, pos);
        break;
      default:
        throw new Error(`Unknown Entity Type: ${typeData.baseType}, for: ${name}`);
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
