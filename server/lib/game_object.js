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

  getInteractPositions()
  {
    return Navigator.getNeighbors(this.pos);
  }

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
    this.targetNID = null;

    this.state = 'idle';

    this._doInteraction = this._doInteraction.bind(this);
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

      if (this.state === 'interacting') // if moving to interaction
      {
        this.state = 'moving';
        this.interaction = null;
      }
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

  interactWith(targetNID, path)
  {
    this.interaction = new Interaction(GameObjectManager.getByNID(targetNID));
    this.state = 'interacting';

    if (path.length === 0) // if already next to target
    {
      this._doInteraction();
    }
    else // if there is a path before target
    {
      if (this.path) // if already has a path
      {
        if (!this.nextPath) // if no next path
        {
          this.path = [this.path[0]]; // reduce current path to only next node
        }
        this.nextPath = path;
      }
      else { // if no path
        this.path = path;

        Connection.broadcast({
          type: 'move',
          nid: this.nid,
          pos: this.decimalPos,
          path: path,
          speed: this.speed
        });
      }
    }
  }

  _move(nextState, nextStateCallback)
  {
    if (!this.path)
    {
      this.state = nextState;
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
            this.path = null;
            this.state = nextState;
            if (nextStateCallback)
            {
              nextStateCallback();
            }
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

  _interact()
  {
    let target = this.interaction.target;
    let targetPos = target.decimalPos ? target.decimalPos : target.pos; // static objects don't have decimalPos
    let diff = Vector2.sub(targetPos, this.pos);
    if (diff.length < this.interaction.range) // if inside interaction range
    {
      this._doInteraction();

      if (this.path) // if still have path left, end it
      {
        this.path = [this.path[0]];
        this.state = 'moving';
        Connection.broadcast({
          type: 'move',
          nid: this.nid,
          pos: this.decimalPos,
          path: this.path,
          speed: this.speed
        });
      }
    }
    else // if have to move closer
    {
      if (this.interaction.positionUpdated) // if need to calculate new path
      {
        let startPos = this.path ? this.path[0] : this.pos;
        let newPath = Navigator.findShortestPath(startPos, this.interaction.target.getInteractPositions());
        this.interactWith(this.interaction.target.nid, newPath);
      }
      else // if continue using old path
      {
        this._move('interacting', this._doInteraction);
      }

      if (this.interaction) // update interaction if needed
      {
        this.interaction.update();
      }
    }
  }

  _doInteraction()
  {
    Connection.sendToUser(this.userId, {
      type: 'dialog',
      text: `Interacting with ${this.interaction.target.name}`
    });

    this.state = 'idle';
    this.interaction = null;
  }

  _idle()
  {
    if (this.positions && this.positions.length)
    {
      let newPos = this.positions[Math.floor(Math.random() * (this.positions.length - 1))];
      this.moveTo(newPos);
    }
  }

  _attack()
  {

  }

  update()
  {
    switch(this.state)
    {
      case 'idle':
        this._idle();
        break;
      case 'moving':
        this._move('idle');
        break;
      case 'following':
        break;
      case 'interacting':
        this._interact();
        break;
      case 'attacking':
        this._attack();
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

class Interactable extends GameObject
{
  constructor(pos, name, id)
  {
    super(pos, name);
    this.id = id;
    this.type = 'interactable';
  }
}

class Container extends Interactable
{
  constructor(pos, name, id)
  {
    super(pos, name, id);
    this.type = 'container';
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
  
  static createContainer(pos, name, id)
  {
    let container = new Container(pos, name, id);
    this._gameObjects.push(container);
    return container;
  }

  static createInteractable(pos, name, id)
  {
    let interactable = new Interactable(pos, name, id);
    this._gameObjects.push(interactable);
    return interactable;
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

class Interaction
{
  constructor(target, range=1)
  {
    this.target = target;
    this.range = range;

    this._lastTargetPosition = this.target.pos;
  }

  update()
  {
    this._lastTargetPosition = this.target.pos;
  }

  get positionUpdated()
  {
    return !Vector2.equals(this.target.pos, this._lastTargetPosition);
  }
}
