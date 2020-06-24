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
    this._range = range;
  }

  get range() {
    return this._range;
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
  constructor(ownerEntity, targetObject, range) {
    super(ownerEntity, targetObject, range);
    this.clientGuiOpened = false;
  }
}

class TradeAction extends InteractAction {
  constructor(ownerEntity, targetObject, range) {
    super(ownerEntity, targetObject, range);
  }
}

class AttackAction extends InteractAction {
  constructor(ownerEntity, targetObject, range) {
    super(ownerEntity, targetObject, range);
  }

  get range() {
    return this.ownerEntity.equipment.weapon.range;
  }
}

class AreaLinkAction extends InteractAction {
  constructor(ownerEntity, targetObject, range) {
    super(ownerEntity, targetObject, range);
  }
}

class ConfigureAction extends InteractAction {
  constructor(ownerEntity, targetObject, range) {
    super(ownerEntity, targetObject, range);
    this.clientGuiOpened = false;
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
  ConfigureAction
};
