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
      walkable: Navigator.getWalkabilityData(),
      objects: GameObjectManager.getPublicObjects()
    }));

    user.ws.send(JSON.stringify({
      type: 'player',
      player: user.character
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
        action = new Actions.TalkAction(character, GameObjectManager.getByNID(data.target), 1);
        break;
      case 'attack':
        action = new Actions.AttackAction(character, GameObjectManager.getByNID(data.target), 1);
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
      nid: user.character.nid
    });

    ConnectionManager.logUserCount();
  }

  spawnPlayer = (connection) => {
    let x = 10;
    let y = 6;

    let pos = new Vector2(x, y);
    let player = GameObjectManager.createPlayer(pos, connection.user.username, connection);
    connection.user.area = this.area;
    connection.user.character = player;

    ConnectionManager.broadcastToOthers(connection.user.ws, {
      type: 'add',
      obj: player
    });
  }

  respawnPlayer = (connection) => {
    setTimeout(() => {
      connection.user.character = null;

      let x = 10;
      let y = 6;

      let pos = new Vector2(x, y);
      let player = GameObjectManager.createPlayer(pos, connection.user.username, connection);
      connection.user.area = this.area;
      connection.user.character = player;

      ConnectionManager.broadcast({
        type: 'add',
        obj: player
      });

      connection.user.ws.send(JSON.stringify({
        type: 'player',
        player: player
      }));

      console.log(`Respawn Player "${player.name}" with nid ${player.nid}`);
    }, 1000);
  }
}

module.exports = Game;