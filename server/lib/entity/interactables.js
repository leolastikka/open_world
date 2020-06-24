const { EntityVisibility } = require('./entity');
const Interactable = require('./interactable');

/**
 * Static entity that serves as a link to some other area.
 * Link target name is stored in typeData.
 */
class AreaLink extends Interactable {
  constructor(area, data, name, pos) {
    super(area, data, name, pos); 
    this._visibleFor = data.direction === 'enter' ?  EntityVisibility.None : EntityVisibility.All;
  }

  get actions() {
    return ['goto'];
  }

  get interactPositions() {
    return [this.lastIntPos];
  }

  toJSON() {
    return {
      networkId: this._networkId,
      type: this._data.type,
      baseType: this._data.baseType,
      name: this._name,
      pos: this.pos,
      actions: this.actions
    };
  }
}

class Reconstructor extends Interactable {
  constructor(area, data, name, pos) {
    super(area, data, name, pos); 
  }

  get actions() {
    return ['configure'];
  }

  get interactPositions() {
    return [this.lastIntPos];
  }

  toJSON() {
    return {
      networkId: this._networkId,
      type: this._data.type,
      baseType: this._data.baseType,
      name: this._name,
      pos: this.pos,
      actions: this.actions
    };
  }
}

/**
 * Static entity that contains item or items.
 */
class Container extends Interactable {
  constructor(area, typeData, name, pos) {
    super(area, typeData, name, pos);
  }

  get actions() {
    return ['search'];
  }
}

module.exports = {
  AreaLink,
  Reconstructor,
  Container
};
