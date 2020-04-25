const FS = require('fs');
const Path = require('path');
const _ = require('lodash');
const { Vector2 } = require('../math');
const { Area } = require('./area');
const { EntityManager } = require('../entity/entity_manager');

class AreaManager {
  static init() {
    this._areas = [];
    this._loadAreas();
  }

  static update() {
    this._areas.forEach(area => area.update());
  }

  static _loadAreas() {
    const areasDir = '../../resources/areas';
    let areaFiles = FS.readdirSync(Path.join(__dirname, areasDir));

    // create area for each area file
    areaFiles.forEach(areaFile => {
      let areaJson = JSON.parse(FS.readFileSync(Path.join(__dirname, `${areasDir}/${areaFile}`)));
      let areaName = areaFile.slice(0, -('.json'.length));

      let areaSize = areaJson.width;
      let tileSize = areaJson.tilewidth;
      let tiles = [];

      let tilesLayer = areaJson.layers.find(layer => layer.name === 'tiles');
      let objectsLayer = areaJson.layers.find(layer => layer.name === 'objects');
      let charactersLayer = areaJson.layers.find(layer => layer.name === 'characters');
      let movementAreasLayer = areaJson.layers.find(layer => layer.name === 'movementAreas');
      let linksLayer = areaJson.layers.find(layer => layer.name === 'links');

      // handle tiles
      for(let i = 0; i < tilesLayer.data.length; i += tilesLayer.width) {
        tiles.push(tilesLayer.data.slice(i, i + tilesLayer.width));
      }

      // create new area
      let area = new Area(areaName, areaSize, tiles);

      
      // Gather all data to temp objects that needs to be linked by editor id
      // and link them here to avoid needing editor id later
      let movementAreas = {};
      movementAreasLayer.objects.forEach(movementArea => {
        let positions = [];
        movementArea.polygon.forEach(p => {
          positions.push(new Vector2(
            Math.floor((movementArea.x + p.x) / tileSize),
            Math.floor((movementArea.y + p.y) / tileSize)
          ));
        });

        let forProperty = _.find(movementArea.properties, {name: 'for'});
        let forIds = JSON.parse(forProperty.value);
        forIds.forEach(id => {
          movementAreas[id] = positions;
        });
      });
        
      // handle objects
      objectsLayer.objects.forEach(obj => {
        if (obj.type === 'container') {
          let pos = new Vector2(
            Math.floor(obj.x / tileSize),
            Math.floor(obj.y / tileSize)
          );
          let typeData = EntityManager.getDataByType(obj.type);
          area.addEntity(typeData, obj.name, pos);
          area.navigator.setWalkableAt(pos, false);
        }
      });

      // handle characters
      charactersLayer.objects.forEach(obj => {
        let pos = new Vector2(
          Math.floor(obj.x / tileSize),
          Math.floor(obj.y / tileSize)
        );
        let typeData = EntityManager.getDataByType(obj.type);
        let char = area.addEntity(typeData, obj.name, pos);
        let movementArea = movementAreas[char.id];
        if (movementArea && movementArea.length) {
          char.movementArea = movementArea;
        }
      });

      // list the new area
      this._areas.push(area);
    });
  }
}

module.exports = {
  AreaManager
};
