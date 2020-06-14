const { Entity } = require('./entity');
const { Time } = require('../time');
const { Vector2 } = require('../math');
const {
  MoveAction,
  OptionAction,
  EquipmentAction,
  InteractAction,
  TalkAction,
  AttackAction,
  AreaLinkAction,
  ConfigureAction
} = require('../action');
const StoryManager = require('../story_manager');
const { Equipment, ItemManager } = require('../item');

class Character extends Entity {
  constructor(area, data, name, pos) {
    super(area, data, name, pos);
    this.equipment = new Equipment(data.equipment);

    this.movementArea = null;
    this._nextSpawnTime = Time.totalTime;
    this._nextMoveTime = Time.totalTime;

    this._action = null;
    this._targetEntity = null;
    this._targetOfEntities = [];

    this.lastIntPos = Vector2.clone(this.pos);
    this._path = null;
    this._nextPath = null;
  }

  get speed() {
    return this._data.speed;
  }

  update() {
    if (this._isSpawned) {
      if (!this._action) {
        this._updateIdle();
      }
      else {
        if (this._action instanceof MoveAction) {
          this._updateMove();
        }
        else if (this._action instanceof InteractAction) {
          this._updateInteractAction();
        }
      }
    }
    else {
      if (Time.totalTime >= this._nextSpawnTime) {
        this.spawn();
      }
    }
  }

  startAction(action) {
    if (action instanceof MoveAction) {
      if (this._action instanceof MoveAction &&
          this._action.targetPos.equals(action.targetPos)) { // if already doing same action
        return;
      }
      else if (this._action instanceof InteractAction) {
        this.finishAction();
      }

      // start new action
      this._action = action;
      this._startMoveAction();
    }
    else if (action instanceof TalkAction) {
      if (this._action instanceof TalkAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        if (this._action.clientGuiOpened) {
          this.finishAction();
        }
        else {
          return;
        }
      }
      else if (this._action instanceof InteractAction) { // end previous action if needed
        this.finishAction();
      }

      // start new action
      this._action = action;
      this._startInteractAction();
    }
    else if (action instanceof AttackAction) {
      if (this._action instanceof AttackAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        return;
      }
      else if (this._action instanceof InteractAction) { // end previous action if needed
        this.finishAction();
      }
      else if (this._action instanceof MoveAction) {
        this.finishAction();
      }

      this._action = action;
      this._combatController.startAttack();
      this._startInteractAction();
    }
    else if (action instanceof AreaLinkAction) {
      if (this._action instanceof AreaLinkAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        return;
      }
      else if (this.area.name === action.targetEntity.data.targetName) { // if already in the same area
        return;
      }
      else if (this._action instanceof InteractAction) {
        this.finishAction();
      }
      else if (this._action instanceof MoveAction) {
        this.finishAction();
      }

      this._action = action;
      this._startInteractAction();
    }
    else if (action instanceof ConfigureAction) {
      if (this._action instanceof ConfigureAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        if (this._action.clientGuiOpened) {
          this.finishAction();
        }
        else {
          return;
        }
      }
      else if (this._action instanceof InteractAction) {
        this.finishAction();
      }
      else if (this._action instanceof MoveAction) {
        this.finishAction();
      }

      this._action = action;
      this._startInteractAction();

    }
    else if (action instanceof OptionAction) {
      if (this._action instanceof ConfigureAction && this._action.clientGuiOpened) { // if option action can be received
        if (action.option === 'setSpawn') {
          this.data.connection.user.spawnLink = this._action.targetEntity.data.areaLink;
          this.data.connection.send({
            type: 'reconstructor',
            insuredGear: {
              armor: null,
              weapon: null
            },
            insurableGear: [],
            spawnSetHere: true
          });
        }
      }
    }
    else if (action instanceof EquipmentAction) {
      let equipmentUpdated = false;
      const item = ItemManager.getByType(action.itemType);

      if (action.actionType === 'equip') {
        equipmentUpdated = this.equipment.equip(action.itemType);
      }
      else if (action.actionType === 'unequip') {
        equipmentUpdated = this.equipment.unequip(action.itemType);
      }
      else if (action.actionType === 'use') {
        equipmentUpdated = this.equipment.use(action.itemType);
      }

      if (equipmentUpdated) {
        this.data.connection.send({
          type: 'equipment',
          equipment: this.equipment
        });

        if (item.baseType === 'armor') {
          this.area.broadcast({
            type: 'update',
            networkId: this.networkId,
            armorType: this.equipment.armor ? this.equipment.armor.type : 'none',
            speed: this.speed
          });
        }
        else if (item.baseType === 'weapon') {
          this.area.broadcast({
            type: 'update',
            networkId: this.networkId,
            weaponType: this.equipment.weapon ? this.equipment.weapon.type : 'none'
          });
        }
      }
    }
  }

  finishAction() {
    this._action.finish();
    this._action = null;
  }

  _updateIdle() {}

  _updateMove() {
    if (!this._path) {
      this._doActionInRange();
      return;
    }

    let nextPos = this._path[0];
    let movementDistance = this.speed * Time.deltaTime;

    while(nextPos) {
      let curPos = this.pos;

      let diff = Vector2.sub(nextPos, curPos);
      let distance = diff.length;

      if (movementDistance < distance) { // if next node is not reached
        diff.normalize();
        diff.mult(movementDistance);
        this.pos.add(diff);
        return;
      }

      // if next node is reached
      movementDistance -= distance;
      this.lastIntPos = Vector2.clone(nextPos); // move to next pos in tile grid
      this.pos = Vector2.clone(this.lastIntPos);

      this._path.shift(); // remove first element
      if (this._path.length === 0) { // if destination reached
        if (this._nextPath) { // continue to next path if possible
          this._path = this._nextPath;
          this._nextPath = null;
          nextPos = this._path[0];

          this.area.broadcast({
            type: 'move',
            networkId: this.networkId,
            pos: this.pos,
            path: this._path,
            speed: this.speed
          });
        }
        else {
          this._path = null;
          this._doActionInRange();
          return;
        }
      }
      else { // if path continues
        nextPos = this._path[0];
      }
    }
  }

  _updateInteractAction() {
    let diff = Vector2.sub(this._action.targetEntity.pos, this.pos);
    if (diff.length <= this._action.range) { // if inside interaction range
      this._doActionInRange();

      if (this._path && this._path.length > 1) { // if still have path left, end it
        this._path = [this._path[0]];
        this.area.broadcast({
          type: 'move',
          networkId: this.networkId,
          pos: this.pos,
          path: this._path,
          speed: this.speed
        });
      }
    }
    else { // if have to move closer
      if (this._action.isPositionUpdated || !this._path) { // if need to calculate new path
        this._startInteractAction();
      }
      else { // if continue using old path
        this._updateMove();
      }
    }

    if (this._action) {// update interaction if needed
      this._action.updatePosition();
    }
  }

  _doActionInRange() {
    if (this._action instanceof MoveAction) {
      this._action.finish();
      this._action = null;
    }
    else if (this._action instanceof TalkAction) {
        if (!this._action.clientGuiOpened) {
        this.data.connection.send({
          type: 'dialog',
          title: this._action.targetEntity.name,
          text: StoryManager.getDialogForNpc(
            this._action.targetEntity.data.type,
            this.data.connection.user.progress
            )
        });
        this._action.clientGuiOpened = true;
        this.data.connection.user.emit('talk', this._action.targetEntity.data.type);
      }
    }
    else if (this._action instanceof AttackAction) {
      this._combatController.attack();
      if (this._action.isFinished) {
        this._action = null;
      }
    }
    else if (this._action instanceof AreaLinkAction) {
      const AreaManager = require('../area/area_manager'); // define here, otherwise undefined
      AreaManager.changeEntityArea(
        this,
        AreaManager.getByName(this._action.targetEntity.data.targetName
        ));
      this.data.connection.send({
        type: 'changeArea'
      });
      this._action.finish();
      this._action = null;
    }
    else if (this._action instanceof ConfigureAction) {
      const type = this._action.targetEntity.data.baseType;
      if (type === 'reconstructor') {
        if (!this._action.clientGuiOpened) {
          this.data.connection.send({
            type: 'reconstructor',
            insuredGear: {
              armor: null,
              weapon: null
            },
            insurableGear: [],
            spawnSetHere: this._action.targetEntity.data.areaLink === this.data.connection.user.spawnLink
          });
          this._action.clientGuiOpened = true;
        }
      }
    }
  }

  _startMoveAction() {
    // if on path, start next path from next node
    let startPos = this._path ? this._path[0] : this.lastIntPos;
    let path = this.area.navigator.findPath(startPos, this._action.targetPos);
    if (Array.isArray(path) && path.length === 0) {
      return null;
    }

    if (this._path) { // if already has a path
      if (!this._nextPath) { // if no next path{
        this._path = [this._path[0]]; // reduce current path to only next node
      }
      this._nextPath = path;
    }
    else { // if no path
      this._path = path;

      this.area.broadcast({
        type: 'move',
        networkId: this.networkId,
        pos: this.pos,
        path: path,
        speed: this.speed
      });
    }
  }

  _startInteractAction() {
    let diff = Vector2.sub(this._action.targetEntity.lastIntPos, this.pos);
    if (diff.length <= this._action.range) { // if inside interaction range
      this._doActionInRange();
    }
    else { // if need to move
      let startPos = (this._path && this._path.length) ? this._path[0] : this.lastIntPos;
      let shortestPath = this.area.navigator.findShortestPath(
        Vector2.clone(startPos),
        this._action.targetEntity.interactPositions
      );
      if (!shortestPath || shortestPath.length === 0) {
        return;
      }
      if (this._path) { // if already has a path
        if (!this._nextPath) { // if no next path
          this._path = [this._path[0]]; // reduce current path to only next node
        }
        this._nextPath = shortestPath;
      }
      else { // if no path
        this._path = shortestPath;

        this.area.broadcast({
          type: 'move',
          networkId: this.networkId,
          pos: this.pos,
          path: shortestPath,
          speed: this.speed
        });
      }
    }
  }

  despawn() {
    super.despawn();

    this._nextSpawnTime = Time.totalTime + this._data.respawnTime;

    if (this.combatController) {
      this.combatController.dispose()
      this.combatController = null;
    }

    this._targetOfEntities.forEach(entity => {
      entity.finishAction();
    });
    this._targetOfEntities = [];

    this.area.broadcast({
      type: 'remove',
      networkId: this.networkId
    });
  }

  dispose() {
    super.dispose();
    this.equipment.dispose();
    this.equipment = null;
  }

  toJSON() {
    return {
      networkId: this.networkId,
      type: this._data.type,
      baseType: this._data.baseType,
      name: this._name,
      pos: this.pos,
      path: this._path,
      speed: this.speed,
      actions: this.actions,
      equipment: {
        armor: this.equipment.armor,
        weapon: this.equipment.weapon,
        ammo: this.equipment.ammo
      }
    };
  }
}

class Player extends Character {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }

  get speed() {
    if (this.equipment.armor) {
      if (this.equipment.armor.type === 'sairaan_nopee_outfit') {
        return 5;
      }
    }
    return 2;
  }

  dispose() {
    super.dispose();
  }
}

class NPC extends Character {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }

  get actions() {
    return ['talk'];
  }

  _updateIdle() {
    if (this.movementArea && this.movementArea.length) {
      let newPos = this.movementArea[Math.floor(Math.random() * (this.movementArea.length - 1))];
      this.startAction(new MoveAction(newPos));
    }
  }
}

class Enemy extends NPC {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }

  get actions() {
    return [];
    //return ['attack'];
  }
}

module.exports = {
  Character,
  NPC,
  Enemy,
  Player
};
