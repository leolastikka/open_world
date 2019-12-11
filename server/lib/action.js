const Vector2 = require('./math').Vector2;

const InterruptCause = Object.freeze({
  InterruptByUser: 1,
  ActionDone: 2,
  TargetRemoved: 3,
  TargetBlocked: 4
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
  constructor(targetObject, range)
  {
    super();
    this.targetObject = targetObject;
    this.range = range;

    this._lastTargetPosition = this.targetObject.pos;
  }

  updatePosition()
  {
    this._lastTargetPosition = this.targetObject.pos;
  }

  get positionUpdated()
  {
    return !Vector2.equals(this.targetObject.pos, this._lastTargetPosition);
  }

  finish(interruptCause)
  {
    super.finish(interruptCause);
    this.targetObject._endAsActionTarget(this);
  }
}

class TalkAction extends InteractAction
{
  constructor(targetObject, range)
  {
    super(targetObject, range);
  }
}

class TradeAction extends InteractAction
{
  constructor(targetObject, range)
  {
    super(targetObject, range);
  }
}

class AttackAction extends InteractAction
{
  constructor(targetObject, range)
  {
    super(targetObject, range);
  }
}

module.exports.InterruptCause = InterruptCause;
module.exports.Action = Action;
module.exports.MoveAction = MoveAction;
module.exports.InteractAction = InteractAction;
module.exports.TalkAction = TalkAction;
module.exports.TradeAction = TradeAction;
module.exports.AttackAction = AttackAction;
