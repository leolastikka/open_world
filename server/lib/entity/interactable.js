const { Entity, EntityVisibility } = require('./entity');

/**
 * Static entity that serves as a link to some other area.
 * Link target name is stored in typeData.
 */
class AreaLink extends Entity {
  constructor(area, typeData, name, pos) {
    super(area, typeData, name, pos); 
    this._visibleFor = typeData.direction === 'enter' ?  EntityVisibility.None : EntityVisibility.All;
  }

  get actions() {
    return ['goto'];
  }

  toJSON() {
    return {
      networkId: this._networkId,
      type: this._typeData.type,
      baseType: this._typeData.baseType,
      name: this._name,
      pos: this.pos,
      actions: this.actions
    };
  }
}

/**
 * Static entity that contains item or items.
 */
class Container extends Entity {
  constructor(area, typeData, name, pos) {
    super(area, typeData, name, pos);
  }

  get actions() {
    return ['search'];
  }
}

module.exports = {
  AreaLink,
  Container
};
