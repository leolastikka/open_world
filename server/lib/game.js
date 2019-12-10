const Area = require('./area').Area;
const Vector2 = require('./math').Vector2;
const GameObjectManager = require('./game_object').GameObjectManager;
const Navigator = require('./navigator');
const Time = require('./time');
const Connection = require('./connection');
const FS = require('fs');
const Path = require('path');
const _ = require('lodash');

class Game
{
  constructor(db, wss)
  {
    this.db = db;
    this.wss = wss;

    this.update = this.update.bind(this);

    this.users = [];
    this.area = null;
    this.pathfinder = null;

    this.frameTime = 100; // ms
  }

  start(onStartedCallback)
  {
    GameObjectManager.init();
    this.loadArea();

    Time.init();
    this.update();
    setTimeout(this.update, this.serverFrameTime);

    onStartedCallback();
  };

  update()
  {
    Time.update();
    GameObjectManager.update();
    setTimeout(this.update, this.serverFrameTime)
  }

  // Server logic functions
  loadArea()
  {
    let mapJson = JSON.parse(FS.readFileSync(Path.join(__dirname, '../maps/open_world_test.json')));

    let mapSize = mapJson.width;
    let tileSize = mapJson.tilewidth;
    let tiles = [];

    let tilesLayer = mapJson.layers.find(layer => layer.name === 'tiles');
    let objectsLayer = mapJson.layers.find(layer => layer.name === 'objects');
    let charactersLayer = mapJson.layers.find(layer => layer.name === 'characters');
    let pathsLayer = mapJson.layers.find(layer => layer.name === 'paths');

    // handle tiles
    for(let i = 0; i < tilesLayer.data.length; i += tilesLayer.width) {
      tiles.push(tilesLayer.data.slice(i, i + tilesLayer.width));
    }

    this.area = new Area(mapSize, tiles, GameObjectManager._gameObjects);
    Navigator.init(this.area);

    // handle objects
    objectsLayer.objects.forEach(obj => {
      if (obj.type === 'container')
      {
        let pos = new Vector2(
          Math.floor(obj.x / tileSize),
          Math.floor(obj.y / tileSize)
        );
        GameObjectManager.createContainer(pos, obj.name, obj.id);
        Navigator.setWalkableAt(pos, false);
      }
      else if (obj.type === 'terminal')
      {
        let pos = new Vector2(
          Math.floor(obj.x / tileSize),
          Math.floor(obj.y / tileSize)
        );
        GameObjectManager.createInteractable(pos, obj.name, obj.id);
        Navigator.setWalkableAt(pos, false);
      }
    });

    // handle characters
    charactersLayer.objects.forEach(obj => {
      if (obj.type === 'npc')
      {
        let pos = new Vector2(
          Math.floor(obj.x / tileSize),
          Math.floor(obj.y / tileSize)
        );
        GameObjectManager.createNPC(pos, obj.name, obj.id);
      }
      else if (obj.type === 'enemy')
      {
        let pos = new Vector2(
          Math.floor(obj.x / tileSize),
          Math.floor(obj.y / tileSize)
        );
        GameObjectManager.createEnemy(pos, obj.name, obj.id);
      }
    });
        
    // handle paths
    pathsLayer.objects.forEach(path => {
      let positions = [];
      path.polygon.forEach(p => {
        positions.push(new Vector2(
          Math.floor((path.x + p.x) / tileSize),
          Math.floor((path.y + p.y) / tileSize)
        ));
      });

      let idProperty = _.find(path.properties, {name: 'for'});
      let character = GameObjectManager.getByID(idProperty.value);
      character.positions = positions;
    });
  }

  // WebSocket functions
  onConnectedUser(user)
  {
    this.users.push(user);

    let x = 10;
    let y = 6;

    let pos = new Vector2(x, y);
    let player = GameObjectManager.createPlayer(pos, user.username);
    user.area = this.area;
    user.character = player;
    player.userId = user.id;

    Connection.broadcastToOthers(user.ws, {
      type: 'add',
      obj: player
    });

    console.log('logged users count: ', this.users.length);
  }

  onReady(user)
  {
    user.ws.send(JSON.stringify({
      type: 'mapData',
      tiles: user.area.tiles,
      walkable: Navigator.getWalkabilityData(),
      objects: user.area.objects
    }));

    user.ws.send(JSON.stringify({
      type: 'player',
      player: user.character
    }));
  }

  onMove(user, data)
  {
    let character = user.character;
    let path = character.moveTo(data.target);

    if (!path) 
    {
      //user.ws.close();
      return;
    }
  }

  onInteract(user, data)
  {
    let character = user.character;
    let target = GameObjectManager.getByNID(data.target);

    let startPos = character.path ? character.path[0] : character.pos;

    let shortestPath = Navigator.findShortestPath(startPos, target.getInteractPositions());
    if (shortestPath)
    {
      character.interactWith(data.target, shortestPath);
    }
  }

  onDisconnectedUser(user)
  {
    this.users.splice(this.users.findIndex(u => {
      return u.id === user.id;
    }), 1);

    this.area.objects.splice(this.area.objects.findIndex(obj => {
      return obj.userId === user.id;
    }), 1);

    Connection.broadcast({
      type: 'remove',
      nid: user.character.nid
    });

    console.log('logged users count: ', this.users.length);
  };
}

module.exports = Game;