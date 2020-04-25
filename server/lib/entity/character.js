const { Entity } = require('./entity');
const { Time } = require('../time');
const { Vector2 } = require('../math');

class Character extends Entity {
  constructor(area, typeData, name, pos) {
    super(area, typeData, name, pos);
    this.movementArea = null;

    this._nextSpawnTime = Time.totalTime;
    this._nextMoveTime = Time.totalTime;

    this._action = null;
    this._targetEntity = null;
    this._targetOfEntities = [];

    this._decimalPos = Vector2.clone(this.pos);
    this._path = null;
    this._nextPath = null;
  }

  get decimalPos() {
    return this._decimalPos;
  }

  get speed() {
    return this._typeData.speed;
  }

  update = () => {
    if (!this._action) {
      this._updateIdle();
    }
    else {
      if (this._action instanceof Actions.MoveAction) {
        this._updateMove();
      }
      else if (this._action instanceof Actions.InteractAction) {
        this._updateInteractAction();
      }
    }
  }

  startAction = (action) => {
    if (action instanceof Actions.MoveAction) {
      if (this._action instanceof Actions.MoveAction &&
          this._action.targetPos.equals(action.targetPos)) { // if already doing same action
        return;
      }
      else if (this._action instanceof Actions.InteractAction) {
        this.finishAction();
      }

      // start new action
      this._action = action;
      this._startMoveAction();
    }
    else if (action instanceof Actions.TalkAction) {
      if (this._action instanceof Actions.TalkAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        return;
      }
      else if (this._action instanceof Actions.InteractAction) { // end previous action if needed
        this.finishAction();
      }

      // start new action
      this._action = action;
      this._startInteractAction();
    }
    else if (action instanceof Actions.AttackAction)
    {
      if (this._action instanceof Actions.AttackAction &&
          this._action.targetEntity.networkId === action.targetEntity.networkId) { // if already doing same action
        return;
      }
      else if (this._action instanceof Actions.InteractAction) { // end previous action if needed
        this.finishAction();
      }
      else if (this._action instanceof Actions.MoveAction) {
        this.finishAction();
      }

      console.log(`starting ${action.constructor.name} for ${this._name}`);
      this._action = action;
      this._combatController.startAttack();
      this._startInteractAction();
    }
  }

  finishAction = () => {
    this._action.finish();
    this._action = null;
  }

  _updateIdle = () => {}

  _updateMove = () => {
    if (!this._path) {
      this._doActionInRange();
      return;
    }

    let nextPos = this._path[0];
    let movementDistance = this.speed * Time.deltaTime;

    while(nextPos) {
      let curPos = this._decimalPos;

      let diff = Vector2.sub(nextPos, curPos);
      let distance = diff.length;

      if (movementDistance < distance) { // if next node is not reached
        diff.normalize();
        diff.mult(movementDistance);
        this._decimalPos.add(diff);
        return;
      }

      // if next node is reached
      movementDistance -= distance;
      this._pos = Vector2.clone(nextPos); // move to next pos in tile grid
      this._decimalPos = Vector2.clone(this.pos);

      this._path.shift(); // remove first element
      if (this._path.length === 0) { // if destination reached
        if (this.nextPath) { // continue to next path if possible
          this._path = this._nextPath;
          this._nextPath = null;
          nextPos = this._path[0];

          Connection.broadcast({
            type: 'move',
            networkId: this.networkId,
            decimalPos: this.decimalPos,
            path: this._path,
            speed: this.speed
          });
        }
        else {
          this._path = null;
          this._doActionInRange();
        }
      }
      else { // if path continues
        nextPos = this._path[0];
      }
    }
  }

  _updateInteractAction = () => {
    let diff = Vector2.sub(this._action.targetEntity.decimalPos, this._decimalPos);
    if (diff.length <= this._action.range) { // if inside interaction range
      this._doActionInRange();

      if (this._path && this._path.length > 1) { // if still have path left, end it
        this._path = [this._path[0]];
        Connection.broadcast({
          type: 'move',
          networkId: this.networkId,
          decimalPos: this._decimalPos,
          path: this._path,
          speed: this.speed
        });
      }
    }
    else { // if have to move closer
      if (this.action.isPositionUpdated || !this._path) { // if need to calculate new path
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

  _doActionInRange = () => {
    if (this._action instanceof Actions.MoveAction) {
      this._action.finish();
      this._action = null;
    }
    else if (this._action instanceof Actions.TalkAction) {
      this._connection.user.ws.send(JSON.stringify({
        type: 'dialog',
        text: `Talking with ${this._action.targetEntity.name}`
      }));
  
      this._action.finish();
      this._action = null;
    }
    else if (this._action instanceof Actions.AttackAction) {
      this._combatController.attack();
      if (this._action.isFinished) {
        this._action = null;
      }
    }
  }

  _startMoveAction = () => {
    // if on path, start next path from next node
    let startPos = this._path ? this._path[0] : this.pos; 
    let path = this._area.navigator.findPath(startPos, this._action.targetPos);
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

      Connection.broadcast({
        type: 'move',
        networkId: this.networkId,
        decimalPos: this._decimalPos,
        path: path,
        speed: this.speed
      });
    }
  }

  _startInteractAction = () => {
    let diff = Vector2.sub(this._action.targetEntity.pos, this._decimalPos);
    if (diff.length <= this._action.range) // if inside interaction range
    {
      this._doActionInRange();
    }
    else // if need to move
    {
      let startPos = (this._path && this._path.length) ? this._path[0] : this.pos;
      let shortestPath = this._area.navigator.findShortestPath(
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

        Connection.broadcast({
          type: 'move',
          networkId: this.networkId,
          decimalPos: this._decimalPos,
          path: shortestPath,
          speed: this.speed
        });
      }
    }
  }

  despawn = () => {
    this._isSpawned = false;

    if (this.combatController) {
      this.combatController.dispose()
      this.combatController = null;
    }

    this._targetOfEntities.forEach(entity => {
      entity.finishAction();
    });
    this._targetOfEntities = [];

    Connection.broadcast({
      type: 'remove',
      nid: this.nid
    });
  }

  toJSON() {
    return {
      networkId: this.networkId,
      baseType: this._typeData.baseType,
      name: this._name,
      pos: this.pos,
      decimalPos: this._decimalPos,
      path: this.path,
      actions: this.actions
    };
  }
}

class Player extends Character {
  constructor(area, type, name, pos, equipment) {
    super(area, type, name, pos);
    this._equipment = equipment;
  }

  get speed() {
    return 2;
  }
}

class NPC extends Character {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }

  get actions() {
    return ['talk'];
  }

  _updateIdle = () => {
    if (this.movementArea && this.movementArea.length) {
      let newPos = this.movementArea[Math.floor(Math.random() * (this.movementArea.length - 1))];
      this.startAction(new Actions.MoveAction(newPos));
    }
  }
}

class Enemy extends NPC {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }

  get actions() {
    return ['attack'];
  }
}

module.exports = {
  Character,
  NPC,
  Enemy,
  Player
};
