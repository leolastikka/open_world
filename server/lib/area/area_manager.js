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

  static getByName(name) {
    return _.find(this._areas, {name: name});
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
      let tileWidth = areaJson.tilewidth;
      let tileHeight = areaJson.tileheight;
      let floor = [];
      let walls = [];
      let links = [];

      let floorLayer = areaJson.layers.find(layer => layer.name === 'floor');
      let wallsLayer = areaJson.layers.find(layer => layer.name === 'walls');
      let linksLayer = areaJson.layers.find(layer => layer.name === 'links');
      let objectsLayer = areaJson.layers.find(layer => layer.name === 'objects');
      let charactersLayer = areaJson.layers.find(layer => layer.name === 'characters');
      let movementAreasLayer = areaJson.layers.find(layer => layer.name === 'movementAreas');

      // handle tiles
      for(let i = 0; i < floorLayer.data.length; i += floorLayer.width) {
        floor.push(floorLayer.data.slice(i, i + floorLayer.width));
      }
      for(let i = 0; i < wallsLayer.data.length; i += wallsLayer.width) {
        walls.push(wallsLayer.data.slice(i, i + wallsLayer.width));
      }

      // fix editor bug/feature
      for (let i = 0; i < floor.length; i++) {
        for (let j = 0; j < floor[i].length; j++) {
          floor[i][j]--;
          walls[i][j]--;
        }
      }

      // handle links
      linksLayer.objects.forEach(obj => {
        let pos = new Vector2(
          Math.floor(obj.x / tileWidth),
          Math.floor(obj.y / tileHeight)
        );
        pos.add(new Vector2(3,0)); // fix editor bug/feature
        console.log(pos);

        links.push({
          type: obj.type,
          direction: obj.type.slice(0, obj.type.indexOf('_')),
          name: obj.type.slice(obj.type.indexOf('_') + 1, obj.type.length),
          pos: pos
        });
      });

      // create new area
      let area = new Area(areaName, areaSize, floor, walls, links);

      // Gather all data to temp objects that needs to be linked by editor id
      // and link them here to avoid needing editor id later
      let movementAreas = {};
      if (movementAreasLayer) {
        movementAreasLayer.objects.forEach(movementArea => {
          let positions = [];
          movementArea.polygon.forEach(p => {
            positions.push(new Vector2(
              Math.floor((movementArea.x + p.x) / tileWidth) + 2, // fix editor bug/feature
              Math.floor((movementArea.y + p.y) / tileHeight) + 2 // fix editor bug/feature
            ));
          });

          let forProperty = _.find(movementArea.properties, {name: 'for'});
          let forIds = JSON.parse(forProperty.value);
          forIds.forEach(id => {
            movementAreas[id] = positions;
          });
        });
      }

      // handle objects
      if (objectsLayer) {
        objectsLayer.objects.forEach(obj => {
          if (obj.type === 'container') {
            let pos = new Vector2(
              Math.floor(obj.x / tileWidth),
              Math.floor(obj.y / tileHeight)
            );
            pos.add(new Vector2(2,2)); // fix editor bug/feature
            let typeData = EntityManager.getDataByType(obj.type);
            area.addEntity(typeData, obj.name, pos);
            area.navigator.setWalkableAt(pos, false);
          }
        });
      }

      // handle characters
      if (charactersLayer) {
        charactersLayer.objects.forEach(obj => {
          let pos = new Vector2(
            Math.floor(obj.x / tileWidth),
            Math.floor(obj.y / tileHeight)
          );
          pos.add(new Vector2(2,2)); // fix editor bug/feature
          let typeData = EntityManager.getDataByType(obj.type);
          let char = area.addEntity(typeData, obj.name, pos);
          let movementArea = movementAreas[char.id];
          if (movementArea && movementArea.length) {
            char.movementArea = movementArea;
          }
        });
      }

      // list the new area
      this._areas.push(area);
    });
  }
}

module.exports = {
  AreaManager
};
