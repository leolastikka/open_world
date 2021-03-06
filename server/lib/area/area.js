const { Navigator } = require('../navigator');
const { AreaLink, Reconstructor } = require('../entity/interactables');
const { NPC, Enemy, Player } = require('../entity/character');
const { EntityVisibility } = require('../entity/entity');

class Area {
  constructor(type, name, size, music, floor, walls) {
    this._type = type; // underscored id name
    this._name = name; // visible name
    this._size = size;
    this._music = music;
    this._floor = floor;
    this._walls = walls;
    this._navigator = new Navigator(this);

    this._entities = [];
    this._spawnedEntities = [];
    this._entityDestroyed = false;

    this._connections = [];
  }

  get type() {
    return this._type;
  }

  get name() {
    return this._name;
  }

  get size() {
    return this._size;
  }

  get music() {
    return this._music;
  }

  get floor() {
    return this._floor;
  }

  get walls() {
    return this._walls;
  }

  get navigator() {
    return this._navigator;
  }

  get entityManager() {
    return this._entityManager;
  }

  get spawnedEntities() {
    return this._spawnedEntities.filter(ent => ent.visibleFor === EntityVisibility.All);
  }

  getLinkByType(type) {
    return this._entities.find((ent) => {
      return ent.data.type === type;
    });
  }

  getEntityByNetworkId(networkId) {
    return this._entities.find(ent => ent.networkId === networkId);
  }

  update() {
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

  /**
   * Called when entity is added to area
   */
  addEntity(data, name, pos) {
    let entity = null;
  
    switch (data.baseType) {
      case 'enemy':
        entity = new Enemy(this, data, name, pos);
        break;
      case 'npc':
        entity = new NPC(this, data, name, pos);
        break;
      case 'player':
        entity = new Player(this, data, name, pos);
        break;
      case 'link':
        entity = new AreaLink(this, data, name, pos);
        break;
      case 'reconstructor':
        entity = new Reconstructor(this, data, name, pos);
        break;
      default:
        throw new Error(`Unknown Entity Type: ${data.baseType}, for: ${name}`);
    }

    this._entities.push(entity);
    return entity;
  }

  addExistingEntity(entity) {
    this._entities.push(entity);
  }

  removeEntity(entity) {
    this._entities = this._entities.filter(ent => ent != entity);
  }

  /**
   * Called when existing entity is spawned in area
   */
  spawnEntity(entity) {
    this._spawnedEntities.push(entity);
  }

  despawnEntity(entity) {
    this._spawnedEntities = this._spawnedEntities.filter(ent => ent != entity);
  }

  addConnection(connection) {
    this._connections.push(connection);
  }

  removeConnection(connection) {
    this._connections = this._connections.filter(conn => conn !== connection);
  }

  broadcast(data) {
    this._connections.forEach(conn => conn.send(data));
  }

  broadcastToOthers(connection, data) {
    this._connections.forEach(conn => {
      if (conn != connection) {
        conn.send(data);
      }
    });
  }
}

module.exports = {
  Area
};
