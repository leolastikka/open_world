const { Entity } = require('./entity');
const { Time } = require('../time');

class Character extends Entity {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
    this.movementArea = null;

    this.nextSpawnTime = Time.totalTime;
  }

  update = () => {
    if () {
      
    }
  }
}

class NPC extends Character {
  constructor(area, type, name, pos) {
    super(area, type, name, pos);
  }
}

module.exports = {
  Character,
  NPC
};
