const Time = require('./time');

class Attacker {
  constructor(networkId) {
    this._networkId = networkId;
    this._damage = 0;
    this._lastAttackTime = null;
  }

  get networkId() {
    return this._networkId;
  }

  get damage() {
    return this._damage;
  }

  get lastAttackTime() {
    return this._lastAttackTime;
  }

  doDamage(damage) {
    this._damage += damage;
    this._lastAttackTime = Time.totalTime;
  }
}

class AggroList {
  constructor() {
    this._attackers = [];
    this._oldAttackerTresholdTime = 5; // seconds
  }

  get top() {
    this._removeOld();
    if (!this._attackers.length) {
      return null;
    }
    this._attackers.sort((a, b) => b.damage - a.damage);
    return this._attackers[0];
  }

  add(attackerNetworkId, damage) {
    let attacker = this._attackers.find(a => a.networkId === attackerNetworkId);
    if (!attacker) {
      attacker = new Attacker(attackerNetworkId);
      this._attackers.push(attacker);
    }
    attacker.doDamage(damage);
  }

  remove(attackerNetworkId) {
    this._attackers = this._attackers.filter(a => a.networkId !== attackerNetworkId);
  }

  _removeOld() {
    this._attackers = this._attackers.filter(a => {
      return a.lastAttackTime + this._oldAttackerTresholdTime > Time.totalTime;
    });
  }

  clear() {
    this._attackers = [];
  }
}

module.exports = {
  AggroList
};
