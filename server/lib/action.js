const { Vector2 } = require('./math');
const { Time } = require('./time');

class Action {
  constructor() {
    this._finished = false;
  }

  update = () => {}

  finish = () => {
    this._finished = true;
  }

  get isFinished() {
    return this._finished;
  }
}

class MoveAction extends Action {
  constructor(targetPos) {
    super();
    this.targetPos = targetPos;
  }
}

class OptionAction extends Action {
  constructor(option) {
    super();
    this.option = option;
  }
}

class EquipmentAction extends Action {
  constructor(actionType, itemType) {
    super();
    this.actionType = actionType;
    this.itemType = itemType;
  }
}

class InteractAction extends Action {
  constructor(ownerEntity, targetEntity, range) {
    super();
    this.ownerEntity = ownerEntity;
    this.targetEntity = targetEntity;
    this.range = range;

    this._lastTargetIntPos = Vector2.clone(this.targetEntity.lastIntPos);
  }

  updatePosition() {
    this._lastTargetIntPos = Vector2.clone(this.targetEntity.lastIntPos);
  }

  get isPositionUpdated() {
    return !this.targetEntity.lastIntPos.equals(this._lastTargetIntPos);
  }

  finish() {
    super.finish();
    // remove this action from target
    this.targetEntity._targetOfEntities = this.targetEntity._targetOfEntities.filter(ent => ent !== this.ownerEntity);
    this.targetEntity = null;

    if (this.ownerEntity.isSpawned) {
      this.ownerEntity.area.broadcast({
        type: 'update',
        networkId: this.ownerEntity.networkId,
        inCombat: false
      });
    }

    this.ownerEntity = null;
  }
}

class TalkAction extends InteractAction {
  constructor(ownerObject, targetObject, range) {
    super(ownerObject, targetObject, range);
    this.clientGuiOpened = false;
  }
}

class TradeAction extends InteractAction {
  constructor(ownerObject, targetObject, range) {
    super(ownerObject, targetObject, range);
  }
}

class AttackAction extends InteractAction {
  constructor(ownerObject, targetObject, range) {
    super(ownerObject, targetObject, range);
  }
}

class AreaLinkAction extends InteractAction {
  constructor(ownerObject, targetObject, range) {
    super(ownerObject, targetObject, range);
  }
}

class ConfigureAction extends InteractAction {
  constructor(ownerObject, targetObject, range) {
    super(ownerObject, targetObject, range);
    this.clientGuiOpened = false;
  }
}

class CombatController {
  constructor(ownerEntity, damage) {
    this.ownerEntity = ownerEntity;

    this.hp = 10;
    this.damage = damage;

    this._nextAttackTime = Time.totalTime;
    this._attackIntervalTime = 1;
  }

  startAttack() {
    this.ownerEntity.area.broadcast({
      type: 'status',
      networkId: this.ownerEntity.networkId,
      inCombat: true,
      hp: this.hp
    });
  }

  attack() {
    // if this is first actual attack
    if (this.ownerEntity.action.targetEntity._startAsTargetOfObject(this.ownerEntity)) {
      // start combat for target too
      this.ownerEntity.action.targetEntity.startAction(
        new AttackAction(this.ownerEntity.action.targetEntity, this.ownerEntity, 1)
      );
    }
    if (Time.totalTime >= this._nextAttackTime) {
      this.ownerEntity.action.targetEntity.combatController.doDamage(this.damage);
      this._nextAttackTime = Time.totalTime + this._attackIntervalTime;
    }
  }

  doDamage(damage) {
    this.hp -= damage;

    if (this.hp < 0) {
      this.hp = 0;
    }

    if (!this.ownerEntity.isSpawned) {
      throw new Error(`trying to despawn despawned object with networkId: ${this.ownerEntity.networkId}`)
    }
    this.ownerEntity.area.broadcast({
      type: 'status',
      networkId: this.ownerEntity.networkId,
      inCombat: true,
      hp: this.hp
    });

    if (this.hp === 0) {
      this.ownerEntity.despawn();
    }
  }

  dispose() {
    this.ownerEntity = null;
  }
}

module.exports = {
  MoveAction,
  OptionAction,
  EquipmentAction,
  InteractAction,
  TalkAction,
  TradeAction,
  AttackAction,
  AreaLinkAction,
  ConfigureAction,

  CombatController
};
