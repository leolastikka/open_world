const FS = require('fs');
const Path = require('path');
const { Vector2 } = require('../math');
const { Area } = require('./area');
const { EntityManager } = require('../entity/entity_manager');
const { Player } = require('../entity/character');

class AreaManager {
  static init() {
    this._areas = [];
    this._loadAreas();
  }

  static getByName(name) {
    return this._areas.find(a => a.name === name);
  }

  static update() {
    this._areas.forEach(area => area.update());
  }

  static changeEntityArea(entity, targetArea) {
    const originalArea = entity.area;
    entity.area.removeEntity(entity);
    entity.area.despawnEntity(entity);
    originalArea.broadcast({
      type: 'remove',
      networkId: entity.networkId
    });
    entity.area = targetArea;
    const targetLink = targetArea.getLinkByType(`enter_${originalArea.name}`);
    entity.pos = Vector2.clone(targetLink.pos);
    entity.lastIntPos = Vector2.clone(targetLink.pos);
    targetArea.addExistingEntity(entity);
    targetArea.spawnEntity(entity);
    targetArea.broadcast({
      type: 'add',
      entity: entity
    })

    if (entity instanceof Player) {
      const conn = entity.typeData.connection;
      originalArea.removeConnection(conn);
      targetArea.addConnection(conn);
      conn.user.area = targetArea;
    }
  }

  static _loadAreas() {
    const areasDir = '../../resources/areas';
    const areaFiles = FS.readdirSync(Path.join(__dirname, areasDir));

    //create area for each area file
    areaFiles.forEach(areaFile => {
      const areaJson = JSON.parse(FS.readFileSync(Path.join(__dirname, `${areasDir}/${areaFile}`)));
      const areaName = areaFile.slice(0, -('.json'.length));

      const areaSize = areaJson.width;
      const tileHeight = areaJson.tileheight; // only this is used when parsing isometric object positions
      const floor = [];
      const walls = [];

      const floorLayer = areaJson.layers.find(layer => layer.name === 'floor');
      const wallsLayer = areaJson.layers.find(layer => layer.name === 'walls');
      const linksLayer = areaJson.layers.find(layer => layer.name === 'links');
      const objectsLayer = areaJson.layers.find(layer => layer.name === 'objects');
      const charactersLayer = areaJson.layers.find(layer => layer.name === 'characters');
      const movementAreasLayer = areaJson.layers.find(layer => layer.name === 'movementAreas');

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

      // create new area
      const area = new Area(areaName, areaSize, floor, walls);

      // Use tileHeight also for x axis, because editor handles isometric object grid as squares

      // handle links
      linksLayer.objects.forEach(obj => {
        const pos = new Vector2(
          Math.floor(obj.x / tileHeight),
          Math.floor(obj.y / tileHeight)
        );
        const typeData = {
          type: obj.type,
          baseType: 'link',
          direction: obj.type.slice(0, obj.type.indexOf('_')),
          targetName: obj.type.slice(obj.type.indexOf('_') + 1, obj.type.length),
          pos: pos
        };
        area.addEntity(typeData, obj.name, pos);
      });

      // Gather all data to temp objects that needs to be linked by editor id
      // and link them here to avoid needing editor id later
      let movementAreas = {};
      if (movementAreasLayer) {
        movementAreasLayer.objects.forEach(movementArea => {
          let positions = [];
          movementArea.polygon.forEach(p => {
            positions.push(new Vector2(
              Math.floor((movementArea.x + p.x) / tileHeight),
              Math.floor((movementArea.y + p.y) / tileHeight)
            ));
          });

          let forProperty = movementArea.properties.find(prop => prop.name === 'for');
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
              Math.floor(obj.x / tileHeight),
              Math.floor(obj.y / tileHeight)
            );
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
            Math.floor(obj.x / tileHeight),
            Math.floor(obj.y / tileHeight)
          );
          let typeData = EntityManager.getDataByType(obj.type);
          let char = area.addEntity(typeData, obj.name, pos);
          let movementArea = movementAreas[obj.id];
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
