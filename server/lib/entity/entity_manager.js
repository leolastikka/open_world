const FS = require('fs');
const Path = require('path');
const _ = require('lodash');

/**
 * Global manager for entity related data and network ids
 */
class EntityManager {
  static init() {
    this._entityData = {}; // list of entities by entityId
    this._currentNetworkId = 0;

    this._loadEntityData();
  }

  static _loadEntityData() {
    let entitiesFile = FS.readFileSync(Path.join(__dirname, '../../resources/entities.json'));
    this._entityData = JSON.parse(entitiesFile);
    this._entityData.forEach(entity => Object.freeze(entity));
  }

  static getDataByType(type) {
    return _.find(this._entityData, {type: type});
  }

  static getNewNetworkId() {
    return this._currentNetworkId++;
  }
}

module.exports = {
  EntityManager
};
