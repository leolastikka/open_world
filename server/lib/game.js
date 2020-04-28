const { AreaManager } = require('./area/area_manager');
const { EntityManager } = require('./entity/entity_manager');
const { Vector2 } = require('./math');
const { Navigator } = require('./navigator');
const { Time } = require('./time');
const ConnectionManager = require('./connection').ConnectionManager;
const Actions = require('./action');

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
      tiles: user.area.tiles,
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
        action = new Actions.MoveAction(Vector2.fromObject(data.target));
        break;
      case 'talk':
        action = new Actions.TalkAction(character, user.area.getEntityByNetworkId(data.target), 1);
        break;
      case 'attack':
        action = new Actions.AttackAction(character, user.area.getEntityByNetworkId(data.target), 1);
        break;
      default:
        user.ws.close();
        return;
    }
    character.startAction(action);
  }

  onDisconnectedUser = (user) => {
    ConnectionManager.broadcast({
      type: 'remove',
      networkId: user.character.networkId
    });
    ConnectionManager.logUserCount();

    user.character.dispose();
    user.character = null;
    user.area = null;
  }

  spawnPlayer = (connection) => {
    let area = AreaManager.getByName('start');
    let startLink = area.getLinkByType('enter_start');

    let typeData = EntityManager.getDataByType('player');
    let player = area.addEntity(typeData, connection.user.username, Vector2.clone(startLink.pos));
    player.connection = connection;
    connection.user.area = area;
    connection.user.character = player;

    ConnectionManager.broadcastToOthers(connection.user.ws, {
      type: 'add',
      entity: player
    });
  }
}

module.exports = Game;