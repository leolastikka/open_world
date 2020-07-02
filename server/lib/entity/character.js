const Interactable = require('./interactable');
const { MoveAction, AttackAction } = require('../action');
const { Vector2 } = require('../math');

class Player extends Interactable {
  constructor(area, data, name, pos) {
    super(area, data, name, pos);
  }

  get speed() {
    if (this.equipment.armor) {
      if (this.equipment.armor.type === 'sairaan_nopee_outfit') {
        return 5;
      }
    }
    return 2;
  }

  spawn() {
    const spawnLink = this._data.connection.user.spawnLink;

    this.area.spawnEntity(this);
    this._isSpawned = true;

    this.clearPaths();
    this._skills.health.restore();

    if (spawnLink.area.name !== this.area.name) {
      const AreaManager = require('../area/area_manager');
      AreaManager.changeEntityAreaByLink(this, spawnLink);

      this._data.connection.send({
        type: 'changeArea'
      });
    }
    else {
      this.pos = Vector2.clone(spawnLink.pos);
      this.lastIntPos = Vector2.clone(this.pos);

      this.area.broadcast({
        type: 'add',
        entity: this
      });

      this._data.connection.send({
        type: 'player',
        entity: this
      });
    }
  }
}

class NPC extends Interactable {
  constructor(area, data, name, pos) {
    super(area, data, name, pos);
  }

  get actions() {
    return ['talk'];
  }

  _updateIdle() {
    if (this.movementArea && this.movementArea.length) {
      let newPos = this.movementArea[Math.floor(Math.random() * (this.movementArea.length - 1))];
      this.startAction(new MoveAction(newPos));
    }
    else if (!this.pos.equals(this._originalSpawnPos)) {
      this.startAction(new MoveAction(this._originalSpawnPos));
    }
  }
}

class Enemy extends NPC {
  constructor(area, data, name, pos) {
    super(area, data, name, pos);
    this._attackable = true;
  }

  _updateInteractAction() {
    if (this._action instanceof AttackAction) {
      const top = this._aggroList.top;
      if (top && top.networkId !== this._action.targetEntity.networkId) {
        const target = this.area.getEntityByNetworkId(top.networkId);
        this.startAction(new AttackAction(this, target));
        return;
      }
    }
    super._updateInteractAction();
  }

  _updateIdle() {
    const top = this._aggroList.top
    if (top) {
      console.log(`take new target: `, top);
      const target = this.area.getEntityByNetworkId(top.networkId);
      this.startAction(new AttackAction(this, target));
    }
    super._updateIdle();
  }

  get actions() {
    return ['attack'];
  }
}

module.exports = {
  NPC,
  Enemy,
  Player
};
