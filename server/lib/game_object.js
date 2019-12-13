const uuidv4 = require('uuid/v4');
const Vector2 = require('./math').Vector2;
const Time = require('./time');
const Navigator = require('./navigator');
const Connection = require('./connection');
const Actions = require('./action');

const Type = Object.freeze({
  None: 'none',
  Player: 'player',
  NPC: 'npc',
  Enemy: 'enemy',
  Interactable: 'interactable',
  Container: 'container'
});

class GameObjectTemplate
{
  constructor(type, name, id, pos)
  {
    this.type = type;
    this.name = name;
    this.id = id;
    this.pos = pos;
  }
}

class GameObject
{
  constructor(pos, name)
  {
    this._isDestroyed = false;
    this._isPublic = true;

    this.nid = GameObjectManager._getNewNID();
    this.pos = Vector2.clone(pos); // position in tile grid
    this.decimalPos = Vector2.clone(this.pos); // position when moving between tiles
    this.name = name;
    this.type = Type.None;
    this.user = null;

    this.speed = 0;
    this.path = null;
    this.nextPath = null;

    this.action = null;
    this._targetOfActions = [];
  }

  get actions()
  {
    return [];
  }

  startAction(action)
  {
    if (action instanceof Actions.MoveAction)
    {
      if (this.action instanceof Actions.MoveAction &&
          this.action.targetPos.equals(action.targetPos)) // if already doing same action
      {
        return;
      }

      // start new action
      this.action = action;
      this._startMoveAction();
    }
    else if (action instanceof Actions.InteractAction)
    {
      if (this.action instanceof Actions.InteractAction &&
          this.action.targetObject.nid === action.targetObject.nid) // if already doing same action
      {
        return;
      }
      else if (this.action instanceof Actions.InteractAction) // end previous action if needed
      {
        this.action.finish(Actions.InterruptCause.InterruptByUser);
      }

      // start new action
      this.action = action;
      this._startInteractAction();
    }
  }

  _startMoveAction()
  {
    let startPos = this.path ? this.path[0] : this.pos; // if on path, start next path from next node
    let path = Navigator.findPath(startPos, this.action.targetPos);
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

  _startInteractAction()
  {
    let diff = Vector2.sub(this.action.targetObject.decimalPos, this.pos);
    if (diff.length <= this.action.range) // if inside interaction range
    {
      this._doActionInRange();
    }
    else // if need to move
    {
      let startPos = this.path ? this.path[0] : this.pos;
      let shortestPath = Navigator.findShortestPath(startPos, this.action.targetObject.getInteractPositions());

      if (this.path) // if already has a path
      {
        if (!this.nextPath) // if no next path
        {
          this.path = [this.path[0]]; // reduce current path to only next node
        }
        this.nextPath = shortestPath;
      }
      else { // if no path
        this.path = shortestPath;

        Connection.broadcast({
          type: 'move',
          nid: this.nid,
          pos: this.decimalPos,
          path: shortestPath,
          speed: this.speed
        });
      }
    }
  }

  _doActionInRange()
  {
    if (this.action instanceof Actions.MoveAction)
    {
      this.action.finish();
      this.action = null;
    }
    else if (this.action instanceof Actions.InteractAction)
    {
      Connection.sendToUser(this.userId, {
        type: 'dialog',
        text: `Interacting with ${this.action.targetObject.name}`
      });
  
      this.action.finish();
      this.action = null;
    }
  }

  update()
  {
    if (!this.action)
    {
      this._updateIdle();
    }
    else
    {
      if (this.action instanceof Actions.MoveAction)
      {
        this._updateMove();
      }
      else if (this.action instanceof Actions.InteractAction)
      {
        this._updateInteractAction();
      }
    }
  }

  _updateIdle() {}

  _updateMove()
  {
    if (!this.path)
    {
      this._doActionInRange();
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
            this._doActionInRange();
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

  _updateInteractAction()
  {
    let target = this.action.targetObject;
    let targetPos = target.decimalPos ? target.decimalPos : target.pos; // static objects don't have decimalPos
    let diff = Vector2.sub(targetPos, this.pos);
    if (diff.length <= this.action.range) // if inside interaction range
    {
      this._doActionInRange();

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
      if (this.action.positionUpdated) // if need to calculate new path
      {
        this.startAction(new Actions.InteractAction(this.action.targetObject, 1));
      }
      else // if continue using old path
      {
        this._updateMove();
      }
    }

    if (this.action) // update interaction if needed
    {
      this.action.updatePosition();
    }
  }

  startAsActionTarget(action)
  {
    this._targetOfActions.push(action);
  }

  _endAsActionTarget(action)
  {
    this._targetOfActions  = this._targetOfActions.filter(a => a !== action);
  }

  getInteractPositions()
  {
    return Navigator.getNeighbors(this.pos);
  }

  toString()
  {
    return JSON.stringify({
      nid: this.nid,
      type: this.type,
      name: this.name,
      pos: this.pos,
      decimalPos: this.decimalPos,
      path: this.path,
      actions: this.actions
    });
  }

  destroy()
  {
    this._isDestroyed = true;
    GameObjectManager._gameObjectDestroyed = true;

    Connection.broadcast({
      type: 'remove',
      nid: this.nid
    });
  }
}

class Character extends GameObject
{
  constructor(pos, name)
  {
    super(pos, name);
    this.speed = 2;
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

  _updateIdle()
  {
    if (this._positions && this._positions.length)
    {
      let newPos = this._positions[Math.floor(Math.random() * (this._positions.length - 1))];
      this.startAction(new Actions.MoveAction(newPos));
    }
  }

  destroy()
  {
    super.destroy();

    if (this._spawnerNID)
    {
      GameObjectManager.getByNID(this._spawnerNID).startCooldown();
    }
  }
}

class Enemy extends NPC
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

class Spawner extends GameObject
{
  constructor(pos, name, gameObjectTemplate, cooldownTime)
  {
    super(pos, name);
    this._isPublic = false;

    this.gameObjectTemplate = gameObjectTemplate;
    this.cooldownTime = cooldownTime;
    this._nextSpawnTime = Time.totalTime;
    this._spawnedGameObject = null;
  }

  update()
  {
    if (!this._spawnedGameObject && Time.totalTime >= this._nextSpawnTime)
    {
      let tmpl = this.gameObjectTemplate;
      let created = null;
      switch (tmpl.type)
      {
        case 'npc':
          created = GameObjectManager.createNPC(tmpl.pos, tmpl.name, tmpl.id);
          break;
        case 'enemy':
          created = GameObjectManager.createEnemy(tmpl.pos, tmpl.name, tmpl.id);
          break;
      }
      created._spawnerNID = this.nid;
      this._spawnedGameObject = created;

      if (tmpl._positions)
      {
        created._positions = tmpl._positions;
      }
    }
  }

  startCooldown()
  {
    this._spawnedGameObject = null;
    this._nextSpawnTime = Time.totalTime + this.cooldownTime;
  }
}

class GameObjectManager
{
  static init()
  {
    this._gameObjects = [];
    this._templates = [];
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

  static getTemplateByID(id)
  {
    return this._templates.find(tmpl => tmpl.id === id);
  }

  static createTemplate(type, name, id, pos)
  {
    let tmpl = new GameObjectTemplate(type, name, id, pos);
    this._templates.push(tmpl);
    return tmpl;
  }

  static createSpawner(pos, name, gameObjectTemplate, cooldownTime)
  {
    let spawner = new Spawner(pos, name, gameObjectTemplate, cooldownTime);
    this._gameObjects.push(spawner);
    return spawner;
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

module.exports.Type = Type;

module.exports.GameObjectManager = GameObjectManager;

module.exports.Spawner = Spawner;
module.exports.Player = Player;
