class Action {
  constructor(text) {
    this.text = text;
  }
}

class WalkAction extends Action {
  constructor(text, unitPos) {
    super(text);
    this.unitPos = unitPos;
  }
}

class EquipmentAction extends Action {
  constructor(text, actionType, itemSource, itemType) {
    super(text);
    this.actionType = actionType;
    this.itemSource = itemSource;
    this.itemType = itemType;
  }
}

class InteractAction extends Action {
  constructor(text, networkId) {
    super(text);
    this.networkId = networkId;
  }
}

class TalkAction extends InteractAction {
  constructor(text, networkId) {
    super(text, networkId);
  }
}

class AttackAction extends InteractAction {
  constructor(text, networkId) {
    super(text, networkId);
  }
}

class AreaLinkAction extends InteractAction {
  constructor(text, networkId) {
    super(text, networkId);
  }
}

class ConfigureAction extends InteractAction {
  constructor(text, networkId) {
    super(text, networkId);
  }
}
