const ExperienceTresholds = Object.freeze({
  2: 20,
  3: 50,
  4: 125,
  5: 313,
  6: 781,
  7: 1953,
  8: 4883,
  9: 12207,
  10: 30518
});

const ExperienceEvents = Object.freeze({
  hit_melee: {
    health: 1,
    melee: 1
  },
  hit_gun: {
    health: 1,
    guns: 1
  },
  get_hit: {
    defence: 1
  }
});

class Skills {
  constructor(skillsData) {
    this._health = new Health('Health', 10, 0, 10);
    this._melee = new Skill('Melee', 1, 0);
    this._guns = new Skill('Guns', 1, 0);
    this._defence = new Skill('Defence', 1 ,0);
  }

  get health() {
    return this._health;
  }

  get melee() {
    return this._melee;
  }

  get guns() {
    return this._guns;
  }

  get defence() {
    return this._defence;
  }

  toJSON() {
    return {
      health: this._health,
      melee: this._melee,
      guns: this._guns,
      defence: this._defence
    };
  }
}

class Skill {
  constructor(name, level, experience) {
    this._name = name;
    this._level = level;
    this._experience = experience;
  }

  get name() {
    return this._name;
  }

  get level() {
    return this._level;
  }

  get experience() {
    return this._experience;
  }

  toJSON() {
    return {
      name: this._name,
      level: this._level,
      experience: this._experience
    }
  }
}

class Health extends Skill {
  constructor(name, level, experience, value) {
    super(name, level, experience);
    this.value = value;
  }

  restore() {
    this.value = this._level;
  }

  toJSON() {
    return {
      name: this._name,
      level: this._level,
      experience: this._experience,
      value: this.value
    }
  }
}

module.exports = Skills;
