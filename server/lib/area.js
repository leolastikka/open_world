const uuidv4 = require('uuid/v4');
const Vector2 = require('./math').Vector2;

class Area
{
  constructor(size, tiles, objects)
  {
    this.size = size;
    this.tiles = tiles;
    this.objects = objects;
  }

  get publicObjects()
  {
    return this.objects.filter(obj => obj._isPublic);
  }
}

class AreaManager
{
  static init()
  {

  }

  static getAreaForObject()
  {

  }

  static removeUser()
  {
    
  }
}

module.exports.Area = Area;
module.exports.AreaManager = AreaManager;
