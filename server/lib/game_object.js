const uuidv4 = require('uuid/v4');
const Vector2 = require('./math').Vector2;
const Time = require('./time');
const Navigator = require('./navigator');
const Connection = require('./connection');

class GameObject
{
  constructor(pos, name)
  {
    this._isDestroyed = false;
    this.nid = GameObjectManager._getNewNID();
    this.pos = pos;
    this.name = name;
    this.type = 'none';
    this.user = null;
  }

  update(game) {}
  getActions() {}
  getInteractPositions() {}
  destroy()
  {
    this._isDestroyed = true;
    GameObjectManager._gameObjectDestroyed = true;
  }
}

class Character extends GameObject
{
  constructor(pos, name)
  {
    super(pos, name);
    this.pos = pos; // position in tile grid
    this.decimalPos = this.pos; // position when moving between tiles

    this.type = 'character';

    this.speed = 2;
    this.path = null;
    this.nextPath = null;

    this.state = 'idle';
  }

  moveTo(targetPos)
  {
    let startPos = this.path ? this.path[0] : this.pos; // if on path, start next path from next node
    //console.log(`move from (${startPos.x},${startPos.y}) to (${targetPos.x},${targetPos.y})`);
    
    let path = Navigator.findPath(startPos, targetPos);
    if (Array.isArray(path) && path.length === 0)
    {
      return null;
    }

    if (this.path) // if already has a path
    {
      if (!this.nextPath) // if no next path
      {
        this.path = [this.path[0]]; // reduce current path to only next node
      }
      this.nextPath = path;
    }
    else { // if no path
      this.state = 'moving';
      this.path = path;

      Connection.broadcast({
        type: 'move',
        nid: this.nid,
        pos: this.decimalPos,
        path: path,
        speed: this.speed
      });
    }

    return path;
  }

  move(game)
  {
    if (!this.path)
    {
      this.state = 'idle';
      return;
    }

    let nextPos = this.path[0];
    let movementDistance = this.speed * Time.deltaTime;

    while(nextPos)
    {
      let curPos = this.decimalPos;

      let diff = Vector2.sub(nextPos, curPos);
      let distance = diff.length;

      if (movementDistance < distance) // if next node is not reached
      {
        let norm = Vector2.normalize(diff);
        norm.mult(movementDistance);
        this.decimalPos.add(norm);
        return;
      }
      else // if next node is reached
      {
        movementDistance -= distance;
        this.pos = Vector2.clone(nextPos); // move to next pos in tile grid
        this.decimalPos = Vector2.clone(this.pos);

        this.path.shift(); // remove first element
        if (this.path.length === 0) // if destination reached
        {
          if (this.nextPath) // continue to next path if possible
          {
            this.path = this.nextPath;
            this.nextPath = null;
            nextPos = this.path[0];

            Connection.broadcast({
              type: 'move',
              nid: this.nid,
              pos: this.decimalPos,
              path: this.path,
              speed: this.speed
            });
          }
          else {
            this.state = 'idle';
            this.path = null;
            return;
          }
        }
        else // if path continues
        {
          nextPos = this.path[0];
        }
      }
    }
  }

  idle()
  {
    if (this.positions && this.positions.length)
    {
      let newPos = this.positions[Math.floor(Math.random() * (this.positions.length - 1))];
      this.moveTo(newPos);
    }
  }

  attack()
  {

  }

  update()
  {
    switch(this.state)
    {
      case 'idle':
        this.idle();
        break;
      case 'moving':
        this.move();
        break;
      case 'following':
        break;
      case 'interacting':
        break;
      case 'attacking':
        this.attack();
        break;
    }
  }
}

class Player extends Character
{
  constructor(pos, name)
  {
    super(pos, name);
    this.type = 'player';
  }
}

class NPC extends Character
{
  constructor(pos, name, id)
  {
    super(pos, name);
    this.id = id;
    this.type = 'npc';
    this.speed = 1;
  }
}

class Enemy extends Character
{
  constructor(pos, name, id)
  {
    super(pos, name);
    this.id = id;
    this.type = 'enemy';
    this.speed = 1;

    this.nextMoveTime = Time.totalTime;
  }
}

class GameObjectManager
{
  static init()
  {
    this._gameObjects = [];
    this._gameObjectDestroyed = false;
    this._currentNID = 0;
  }

  static getByNID(nid)
  {
    return this._gameObjects.find(go => go.nid === nid);
  }

  static getByID(id)
  {
    return this._gameObjects.find(go => go.id === id);
  }

  static createPlayer(pos, name)
  {
    let player = new Player(pos, name);
    this._gameObjects.push(player);
    return player;
  }

  static createNPC(pos, name, id)
  {
    let npc = new NPC(pos, name, id);
    this._gameObjects.push(npc);
    return npc;
  }

  static createEnemy(pos, name, id)
  {
    let enemy = new Enemy(pos, name, id);
    this._gameObjects.push(enemy);
    return enemy;
  }

  static update()
  {
    this._gameObjects.forEach(go => {
      go.update();
    });
    this.removeDestroyed();
  }

  static removeDestroyed()
  {
    if (this._gameObjectDestroyed)
    {
      this._gameObjects  = this._gameObjects.filter(go => go._isDestroyed);
    }
  }

  static _getNewNID()
  {
    return this._currentNID++;
  }
}

module.exports.GameObjectManager = GameObjectManager;
module.exports.Player = Player;
module.exports.NPC = NPC;
