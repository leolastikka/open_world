const uuidv4 = require('uuid/v4');
const Vector2 = require('./math').Vector2;
const Time = require('./time');
const Navigator = require('./navigator');
const Connection = require('./connection');
const Actions = require('./action');
const Equipment = require('./item').Equipment;

const Type = Object.freeze({
  None: 'none',
  Player: 'player',
  NPC: 'npc',
  Enemy: 'enemy',
  Interactable: 'interactable',
  Container: 'container'
});

class GameObject
{
  constructor(pos, name)
  {
    this._isDestroyed = false;
    this._isPublic = true; // is sent to client

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
    this._targetOfObjects = [];
  }

  get actions()
  {
    return [];
  }

  

  /** Returns true if this is not a target of the same object already */
  _startAsTargetOfObject(object)
  {
    if (!this._targetOfObjects.find(obj => obj === object))
    {
      this._targetOfObjects.push(object);
      return true;
    }
    return false;
  }

  

  


  toJSON()
  {
    return {
      nid: this.nid,
      type: this.type,
      name: this.name,
      pos: this.pos,
      decimalPos: this.decimalPos,
      path: this.path,
      actions: this.actions
    };
  }

  destroy()
  {
    if (this._isDestroyed)
    {
      return;
    }

    console.log(`Destroying ${this.constructor.name} "${this.name}" with nid: ${this.nid}`);

    this._isDestroyed = true;
    GameObjectManager._gameObjectDestroyed = true;
  }

  
}

class Character extends GameObject
{
  constructor(pos, name)
  {
    super(pos, name);
    this._equipment = new Equipment();
  }
}

class Player extends Character
{
  constructor(pos, name, connection)
  {
    super(pos, name);
    this.type = 'player';
    this._connection = connection;
    this._isRespawning = false;

    this.speed = 2;
    this.combatController = new Actions.CombatController(this, 3);
  }

  get actions()
  {
    return [];
  }

  _dispose()
  {
    super._dispose();

    if (this._connection.ws && !this._isRespawning)
    {
      this._isRespawning = true;
      this._connection.respawnPlayer();
      this._connection = null;
    }
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
    this.combatController = new Actions.CombatController(this, 1);
  }

  _updateIdle()
  {
    if (this._positions && this._positions.length)
    {
      let newPos = this._positions[Math.floor(Math.random() * (this._positions.length - 1))];
      this.startAction(new Actions.MoveAction(newPos));
    }
  }

  get actions()
  {
    return ['talk'];
  }

  _dispose()
  {
    super._dispose();

    if (this._spawnerNID)
    {
      GameObjectManager.getByNID(this._spawnerNID).startCooldown();
    }
  }
}


module.exports.Type = Type;

module.exports.Player = Player;
