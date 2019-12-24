const Vector2 = require('./math').Vector2;
const Time = require('./time');
const Connection = require('./connection');
const GameObjectManger = require('./game_object').GameObjectManager;

const InterruptCause = Object.freeze({
  InterruptByUser: 1,
  ActionDone: 2,
  TargetRemoved: 3,
  TargetBlocked: 4,
  HigherPriorityOverride: 5
});

class Action
{
  constructor()
  {
    this._finished = false;
    this._interruptCause = null;
  }

  update () {}

  finish(interruptCause = InterruptCause.ActionDone)
  {
    this._finished = true;
    this._interruptCause = interruptCause;
  }

  get isFinished()
  {
    return this._finished;
  }
}

class MoveAction extends Action
{
  constructor(targetPos)
  {
    super();
    this.targetPos = targetPos;
  }
}

class InteractAction extends Action
{
  constructor(ownerObject, targetObject, range)
  {
    super();
    this.ownerObject = ownerObject;
    this.targetObject = targetObject;
    this.range = range;

    this._lastTargetPosition = Vector2.clone(this.targetObject.pos);
  }

  updatePosition()
  {
    this._lastTargetPosition = Vector2.clone(this.targetObject.pos);
  }

  get positionUpdated()
  {
    return !this.targetObject.pos.equals(this._lastTargetPosition);
  }

  finish(interruptCause)
  {
    super.finish(interruptCause);
    // remove this action from target
    this.targetObject._targetOfObjects = this.targetObject._targetOfObjects.filter(obj => obj !== this.ownerObject);
    this.targetObject = null;

    if (!this.ownerObject._isDestroyed) {
      Connection.broadcast({
        type: 'status',
        nid: this.ownerObject.nid,
        inCombat: false
      });
    }

    this.ownerObject = null;
  }
}

class TalkAction extends InteractAction
{
  constructor(ownerObject, targetObject, range)
  {
    super(ownerObject, targetObject, range);
  }
}

class TradeAction extends InteractAction
{
  constructor(ownerObject, targetObject, range)
  {
    super(ownerObject, targetObject, range);
  }
}

class AttackAction extends InteractAction
{
  constructor(ownerObject, targetObject, range)
  {
    super(ownerObject, targetObject, range);
  }
}

class DialogController
{

}

class CombatController
{
  constructor(ownerObject, damage)
  {
    this.ownerObject = ownerObject;

    this.hp = 10;
    this.damage = damage;

    this._action = null;

    this._nextAttackTime = Time.totalTime;
    this._attackIntervalTime = 1;
  }

  startAttack()
  {
    Connection.broadcast({
      type: 'status',
      nid: this.ownerObject.nid,
      inCombat: true,
      hp: this.hp
    });
  }

  attack()
  {
    if (this.ownerObject.action.targetObject._startAsTargetOfObject(this.ownerObject)) // if this is first actual attack
    {
      // start combat for target too
      this.ownerObject.action.targetObject.startAction(
        new AttackAction(this.ownerObject.action.targetObject, this.ownerObject, 1)
      );
    }
    if (Time.totalTime >= this._nextAttackTime)
    {
      this.ownerObject.action.targetObject.combatController.doDamage(this.damage);
      this._nextAttackTime = Time.totalTime + this._attackIntervalTime;
    }
  }

  doDamage(damage)
  {
    this.hp -= damage;

    if (this.hp < 0)
    {
      this.hp = 0;
    }

    if (this.ownerObject._isDestroyed)
    {
      throw new Error(`trying to destroy destroyed object with nid: ${this.ownerObject.nid}`)
    }
    Connection.broadcast({
      type: 'status',
      nid: this.ownerObject.nid,
      inCombat: true,
      hp: this.hp
    });

    if (this.hp === 0)
    {
      this.ownerObject.destroy();
    }
  }

  dispose()
  {
    this.ownerObject = null;
  }
}

module.exports.InterruptCause = InterruptCause;

module.exports.MoveAction = MoveAction;
module.exports.InteractAction = InteractAction;
module.exports.TalkAction = TalkAction;
module.exports.TradeAction = TradeAction;
module.exports.AttackAction = AttackAction;

module.exports.DialogController = DialogController;
module.exports.CombatController = CombatController;
