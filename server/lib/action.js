const { Vector2 } = require('./math');

class Action {
  constructor() {}
  dispose() {}
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

class CombatSettingsAction extends Action {
  constructor(combatSettings) {
    super();
    this.combatSettings = combatSettings;
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
  constructor(ownerEntity, targetEntity, range = 1, minRange = 0) {
    super();
    this.ownerEntity = ownerEntity;
    this.targetEntity = targetEntity;
    this._range = range;
    this._minRange = minRange;
  }

  get range() {
    return this._range;
  }

  get minRange() {
    return this._minRange;
  }

  get insideRange() {
    const diff = Vector2.sub(this.targetEntity.pos, this.ownerEntity.pos);
    const distance = diff.length;
    return this._minRange <= distance && distance <= this._range;
  }

  dispose() {
    super.dispose();
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
  constructor(ownerEntity, targetObject, range, minRange) {
    super(ownerEntity, targetObject, range, minRange);
    this.clientGuiOpened = false;
  }
}

class TradeAction extends InteractAction {
  constructor(ownerEntity, targetObject, range, minRange) {
    super(ownerEntity, targetObject, range, minRange);
  }
}

class AttackAction extends InteractAction {
  constructor(ownerEntity, targetObject, range, minRange = 0.5) {
    super(ownerEntity, targetObject, range, minRange);
  }

  get range() {
    return this.ownerEntity.equipment.weapon.range;
  }
}

class AreaLinkAction extends InteractAction {
  constructor(ownerEntity, targetObject, range, minRange) {
    super(ownerEntity, targetObject, range, minRange);
  }
}

class ConfigureAction extends InteractAction {
  constructor(ownerEntity, targetObject, range, minRange) {
    super(ownerEntity, targetObject, range, minRange);
    this.clientGuiOpened = false;
  }
}

module.exports = {
  MoveAction,
  OptionAction,
  CombatSettingsAction,
  EquipmentAction,
  InteractAction,
  TalkAction,
  TradeAction,
  AttackAction,
  AreaLinkAction,
  ConfigureAction
};
