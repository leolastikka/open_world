const AreaManager = require('./area/area_manager');
const { EntityManager } = require('./entity/entity_manager');
const { Vector2 } = require('./math');
const Time = require('./time');
const ConnectionManager = require('./connection').ConnectionManager;
const StoryManager = require('./story_manager');
const { ItemManager } = require('./item');
const {
  MoveAction,
  OptionAction,
  CombatSettingsAction,
  EquipmentAction,
  TalkAction,
  AttackAction,
  AreaLinkAction,
  ConfigureAction
} = require('./action');

class Game {
  constructor(db, wss) {
    this.db = db;
    this.wss = wss;

    this.frameTime = 100; // ms
  }

  start = (onStartCallback) => {
    Time.init();

    ItemManager.init(); // load item related information from disk
    EntityManager.init(); // load entity related data from disk
    AreaManager.init(); // load all areas from disk
    StoryManager.init(); // load messages, dialogs and quests from disk

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
    user.connection.send({
      type: 'areaData',
      floor: user.area.floor,
      walls: user.area.walls,
      walkable: user.area.navigator.getWalkabilityData(),
      entities: user.area.spawnedEntities,
      music: user.area.music
    });

    user.connection.send({
      type: 'logData',
      quests: user.progress.quests,
      messages: user.progress.messages
    });

    user.connection.send({
      type: 'equipment',
      equipment: user.character.equipment
    });

    user.connection.send({
      type: 'combatSettings',
      combatSettings: user.character.combatSettings
    });

    user.connection.send({
      type: 'player',
      entity: user.character
    });

    user.emit('enterArea', user.area.name);
  }

  onAction = (user, data) => {
    let character = user.character;
    let action = null;
    let target = null;
    if (['move'].includes(data.action)) {
      target = Vector2.fromObject(data.target);
    }
    else if (['talk', 'attack', 'link', 'configure'].includes(data.action)) {
      target = user.area.getEntityByNetworkId(data.target);
      if (!target) { // if target does not exist
        return;
      }
      const path = user.area.navigator.findPath(character.lastIntPos, target.lastIntPos);
      if (!path) { // if target is not reachable
        return;
      }
    }
    switch(data.action) {
      case 'move':
        action = new MoveAction(target);
        break;
      case 'talk':
        action = new TalkAction(character, target, 1);
        break;
      case 'attack':
        action = new AttackAction(character, target, 1);
        break;
      case 'equipment':
        action = new EquipmentAction(data.actionType, data.itemType);
        break;
      case 'link':
        action = new AreaLinkAction(character, target, 0);
        break;
      case 'configure':
        action = new ConfigureAction(character, target, 0);
        break;
      case 'option':
        action = new OptionAction(data.target);
        break;
      case 'combatSettings':
        action = new CombatSettingsAction(data.combatSettings);
        break;
      default:
        user.connection.close();
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

    const data = Object.assign({
      connection: connection,
      equipment: {
        weapon: 'unarmed',
        inventory: [
          'survival_outfit',
          'military_armor',
          'worker_outfit',
          'sairaan_nopee_outfit',
          'standard_baton',
          'standard_mace',
          'standard_pole_hammer',
          'standard_pistol',
          'standard_smg',
          'standard_coil'
        ]
      }
    }, EntityManager.getDataByType('player'));
    const player = area.addEntity(data, connection.user.username, Vector2.clone(startLink.pos));
    area.addConnection(connection);
    connection.user.area = area;
    connection.user.character = player;
    connection.user.spawnLink = startLink;
  }
}

module.exports = Game;