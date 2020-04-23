const { Entity, EntityType } = require('./entity');
const { Vector2 } = require('../math');

/**
 * Static entity that contains item or items.
 */
class Container extends Entity {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
    //this.baseType? = EntityType.Container; // get this from EntityManager?
  }

  get actions()
  {
    return ['search'];
  }
}

module.exports = {
  Container
};
