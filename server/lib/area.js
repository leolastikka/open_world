const uuidv4 = require('uuid/v4');
const Vector2 = require('./math').Vector2;

class Area
{
  constructor(size, tiles, entities)
  {
    this.size = size;
    this.tiles = tiles;
    this.entities = entities;
  }
}

class AreaManager
{
  static init()
  {

  }

  static getAreaForEntity()
  {

  }

  static removeUser()
  {
    
  }
}

module.exports.Area = Area;
module.exports.AreaManager = AreaManager;
