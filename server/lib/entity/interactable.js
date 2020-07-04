const { Entity } = require("./entity");
const Time  = require('../time');
const { Vector2 } = require('../math');
const {
  MoveAction,
  OptionAction,
  EquipmentAction,
  InteractAction,
  TalkAction,
  AttackAction,
  AreaLinkAction,
  ConfigureAction,
  CombatSettingsAction
} = require('../action');
const StoryManager = require('../story_manager');
const { Equipment, ItemManager } = require('../item');
const Skills = require('../skill');
const { AggroList, CombatSettings } = require('../combat');

class Interactable extends Entity {
  constructor(area, data, name, pos) {
    super(area, data, name, pos);
    this._equipment = new Equipment(this, data.equipment);
    this._skills = new Skills(data.skills);

    this.movementArea = null;
    this._originalSpawnPos = Vector2.clone(this.pos);
    this._nextSpawnTime = Time.totalTime;
    this._nextMoveTime = Time.totalTime;

    this._action = null;
    this._nextInteractionTime = null;
    this._targetLastIntPos = null;
    this._targetPosUpdated = false;
    this._targetOfEntities = [];
    this._aggroList = new AggroList();
    this._combatSettings = new CombatSettings(data.combatSettings);
    this._attackable = false;

    this.lastIntPos = Vector2.clone(this.pos);
    this._path = null;
    this._nextPath = null;
  }

  get equipment() {
    return this._equipment;
  }

  get skills() {
    return this._skills;
  }

  get speed() {
    return this._data.speed;
  }

  get attackable() {
    return this._attackable;
  }

  get action() {
    return this._action;
  }

  get combatSettings() {
    return this._combatSettings;
  }

  get damage() {
    const weapon = this._equipment.weapon;
    let damage = weapon.damage;
    if (weapon.skill === 'melee' || !weapon.skill) {
      damage += this.skills.melee.level;
    }
    else if (weapon.skill === 'guns') {
      damage += this.skills.guns.level;
    }
    else if (weapon.skill === 'energy') {
      damage += this.skills.energy.level;
    }
    return damage;
  }

  get defence() {
    const armor = this._equipment.armor;
    let defence = this.skills.defence.level;
    if (armor) {
      defence += armor.defence;
    }
    return defence;
  }

  get _pathEndReached() {
    return this.pos.equals(this.lastIntPos) && !this._path;
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

  /**
   * Called by an entity that targets this entity.
   * Returns true if entity was added to list.
   */
  startAsTargetOfEntity(entity) {
    if (this._targetOfEntities.includes(entity)) {
      return false;
    }
    this._targetOfEntities.push(entity);
    return true;
  }

  endAsTargetOfEntity(entity) {
    this._targetOfEntities = this._targetOfEntities.filter(ent => ent !== entity);
  }

  /**
   * Called by the target entity that was removed.
   */
  targetEntityRemoved(targetEntity) {
    if (this._action instanceof AttackAction) {
      this._action.dispose();
      this._action = null;
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
      this._action.targetEntity.startAsTargetOfEntity(this);
      this._startInteractAction();
    }
    else if (action instanceof AttackAction) {
      const { Player } = require("./character");
      // prevent player's from attacking each other
      if (action.targetEntity instanceof Player && action.ownerEntity instanceof Player) {
        return;
      }
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
      this._action.targetEntity.startAsTargetOfEntity(this);
      this._startAttack();
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
    else if (action instanceof CombatSettingsAction) {
      this._combatSettings.autoRetaliate = action.combatSettings.autoRetaliate === true;

      this.data.connection.send({
        type: 'combatSettings',
        combatSettings: this._combatSettings
      });
    }
  }

  finishAction() {
    if (this._action instanceof AttackAction) {
      this._aggroList.remove(this._action.targetEntity.networkId);
    }

    this._action.dispose();
    this._action = null;

    this._targetLastIntPos = null;
  }

  _updateIdle() {}

  _updateMove(onlyMove = false) {
    if (!this._path && !onlyMove) {
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
          if (!onlyMove) {
            this._doActionInRange();
          }
          return;
        }
      }
      else { // if path continues
        nextPos = this._path[0];
      }
    }
  }

  _updateInteractAction() {
    const diff = Vector2.sub(this._action.targetEntity.pos, this.pos);
    const distance = diff.length;
    const insideRange = this._action.minRange <= distance && distance <= this._action.range;
    if (insideRange) { // if inside interaction range
      this._doActionInRange();

      if (!this._pathEndReached) {
        this._updateMove(true);
      }
    }
    else { // if have to move closer or further
      const targetPosUpdated = !this._action.targetEntity.lastIntPos.equals(this._targetLastIntPos);
      if (targetPosUpdated || !this._path) { // if need to calculate new path
        this._startInteractAction();
      }
      else { // if continue using old path
        this._updateMove();
      }
    }

    if (this._action instanceof InteractAction) { // update interaction if needed
      this._targetLastIntPos = Vector2.clone(this._action.targetEntity.lastIntPos);
    }
  }

  _doActionInRange() {
    if (this._action instanceof MoveAction) {
      this.finishAction();
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
      this._attack();
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

      this._targetOfEntities.forEach(entity => {
        entity.finishAction();
      });
      this._targetOfEntities = [];
      this._aggroList.clear();

      this.finishAction();
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
    if (!this._targetLastIntPos) {
      this._targetLastIntPos = this._action.targetEntity.lastIntPos;
    }

    const diff = Vector2.sub(this._action.targetEntity.pos, this.pos);
    const distance = diff.length;
    const insideRange = this._action.minRange <= distance && distance <= this._action.range;
    if (insideRange) { // if inside interaction range
      this._doActionInRange();

      if (!this._pathEndReached) {
        this._updateMove(true);
      }
    }
    else { // if need to move
      const targetPosUpdated = !this._action.targetEntity.lastIntPos.equals(this._targetLastIntPos);
      if (targetPosUpdated || !this._path) { // if need to calculate new path
        let startPos = (this._path && this._path.length) ? this._path[0] : this.lastIntPos;
        let shortestPath = this.area.navigator.findShortestPath(
          Vector2.clone(startPos),
          this._action.targetEntity.interactPositions,
          this._action.minRange
        );
        if (!shortestPath || shortestPath.length === 0) {
          this.finishAction();
          return;
        }
        if (this._path) { // if already has a path
          if (!this._nextPath) { // if no next path
            this._path = [this._path[0]]; // reduce current path to only next node
            this._nextPath = null;

            this.area.broadcast({
              type: 'move',
              networkId: this.networkId,
              pos: this.pos,
              path: this._path,
              speed: this.speed
            });
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
      else { // if continue using old path
        this._updateMove();
      }
    }
  }

  _startAttack() {
    // preserve old _nextInteractionTime so attack time cannot be reset by starting new attack
    if (!this._nextInteractionTime) {
      this._nextInteractionTime = Time.totalTime;
    }
    this.area.broadcast({
      type: 'update',
      networkId: this.networkId,
      inCombat: true,
      health: {
        value: this.skills.health.value,
        max: this.skills.health.level
      }
    });
  }

  _attack() {
    if (Time.totalTime >= this._nextInteractionTime) {
      if (!this._action) { // move this?
        return;
      }

      this.area.broadcast({
        type: 'attack',
        networkId: this.networkId
      });

      this._action.targetEntity.doDamage(this.networkId, this.damage, this._equipment.weapon.skill);
      this._nextInteractionTime = Time.totalTime + this._equipment.weapon.speed;

      if (this._action) {
        // if this is first actual attack
        if (!this._action.targetEntity.action || !(this._action.targetEntity.action instanceof AttackAction)) {
          // if autoRetaliate is on
          if (this._action.targetEntity.combatSettings.autoRetaliate) {
            // start combat for target too
            this._action.targetEntity.startAction(
              new AttackAction(this._action.targetEntity, this)
            );
          }
        }
      }
    }
  }

  /**
   * Attacking entity calls target's doDamage.
   */
  doDamage(attackerNetworkId, damage, damageType) {
    if (!this.isSpawned) { // if target is already despawned
      return;
    }

    let damageRoll = Math.round(Math.random() * damage);
    let defenceRoll = Math.round(Math.random() * this.defence);

    let damageValue = damageRoll - defenceRoll;
    if (damageValue < 0) {
      damageValue = 0;
    }

    this.skills.health.value -= damageValue;
    this._aggroList.add(attackerNetworkId, damageValue);

    if (this.skills.health.value < 0) {
      this.skills.health.value = 0;
    }

    this.area.broadcast({
      type: 'update',
      networkId: this.networkId,
      inCombat: true,
      damage: damageValue,
      damageType: damageType,
      health: {
        value: this.skills.health.value,
        max: this.skills.health.level
      }
    });

    if (this.skills.health.value === 0) {
      this.despawn();
    }
  }

  clearPaths() {
    this._path = null;
    this._nextPath = null;
  }

  spawn() {
    super.spawn();
    this._skills.health.restore();
    this.pos = Vector2.clone(this._originalSpawnPos);
    this.lastIntPos = Vector2.clone(this.pos);

    this.area.broadcast({
      type: 'add',
      entity: this
    });
  }

  despawn() {
    super.despawn();

    this._nextSpawnTime = Time.totalTime + this._data.respawnTime;
    if (this._action) {
      this.finishAction();
    }
    this.clearPaths();

    this._targetOfEntities.forEach(entity => {
      entity.finishAction();
    });
    this._targetOfEntities = [];
    this._aggroList.clear();

    this.area.broadcast({
      type: 'remove',
      networkId: this.networkId
    });
  }

  dispose() {
    super.dispose();
    this._equipment.dispose();
    this._equipment = null;
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

module.exports = Interactable;
