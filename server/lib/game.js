const { AreaManager } = require('./area/area_manager');
const { EntityManager } = require('./entity/entity_manager');
const { Vector2 } = require('./math');
const { Time } = require('./time');
const ConnectionManager = require('./connection').ConnectionManager;
const { MoveAction, TalkAction, AttackAction, AreaLinkAction } = require('./action');

class Game {
  constructor(db, wss) {
    this.db = db;
    this.wss = wss;

    this.frameTime = 100; // ms
  }

  start = (onStartCallback) => {
    Time.init();

    //ItemManager.init(); // load item related information from disk
    EntityManager.init(); // load entity related data from disk
    AreaManager.init(); // load all areas from disk

    // start server update loop
    this.update();
    setTimeout(this.update, this.serverFrameTime);

    onStartCallback(); // start accepting client connections TODO
  }

  update = () => {
    Time.update();
    AreaManager.update();
    setTimeout(this.update, this.serverFrameTime)
  }

  // WebSocket functions
  onConnectedUser = (connection) => {
    this.spawnPlayer(connection);
    ConnectionManager.logUserCount();
  }

  onReady = (user) => {
    user.ws.send(JSON.stringify({
      type: 'mapData',
      floor: user.area.floor,
      walls: user.area.walls,
      walkable: user.area.navigator.getWalkabilityData(),
      entities: user.area.spawnedEntities
    }));

    user.ws.send(JSON.stringify({
      type: 'player',
      entity: user.character
    }));
  }

  onAction = (user, data) => {
    let character = user.character;
    let action = null;
    switch(data.action) {
      case 'move':
        action = new MoveAction(Vector2.fromObject(data.target));
        break;
      case 'talk':
        action = new TalkAction(character, user.area.getEntityByNetworkId(data.target), 1);
        break;
      case 'attack':
        action = new AttackAction(character, user.area.getEntityByNetworkId(data.target), 1);
        break;
      case 'link':
        action = new AreaLinkAction(character, user.area.getEntityByNetworkId(data.target), 1);
        break;
      default:
        user.ws.close();
        return;
    }
    character.startAction(action);
  }

  onDisconnectedUser = (user) => {
    user.area.removeConnection();
    user.area.broadcast({
      type: 'remove',
      networkId: user.character.networkId
    });
    ConnectionManager.logUserCount();

    user.character.dispose();
    user.character = null;
    user.area = null;
  }

  spawnPlayer = (connection) => {
    const area = AreaManager.getByName('start');
    const startLink = area.getLinkByType('enter_start');

    const typeData = Object.assign({
      connection: connection
    }, EntityManager.getDataByType('player'));
    const player = area.addEntity(typeData, connection.user.username, Vector2.clone(startLink.pos));
    area.addConnection(connection);
    connection.user.area = area;
    connection.user.character = player;

    area.broadcastToOthers(connection, {
      type: 'add',
      entity: player
    });
  }
}

module.exports = Game;