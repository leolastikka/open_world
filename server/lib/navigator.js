const PF = require('pathfinding');
const { Vector2 } = require('./math');

class Navigator {
  constructor(area) {
    this._area = area;
    this._walkableTiles = [1,2,3,4,5, 32,33]; // walkable tile indexes

    this._grid = new PF.Grid(area.size, area.size);
    this._finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });

    for (let i=0; i<area.floor.length; i++) {
      for (let j=0; j<area.floor[i].length; j++) {
        let isWalkable = this._walkableTiles.includes(area.floor[i][j]) &&
            (area.walls[i][j] == -1 || this._walkableTiles.includes(area.walls[i][j]));
        this._grid.setWalkableAt(j, i, isWalkable);
      }
    }
  }

  findPath = (startPos, endPos) => {
    if (!this._isValidPos(startPos) || !this._isValidPos(endPos)) {
      return null;
    }

    let grid = this._grid.clone();
    let path = [];
    let arr = this._finder.findPath(startPos.x, startPos.y, endPos.x, endPos.y, grid);
    if (!arr.length && Vector2.sub(endPos, startPos).lengthSquared) {
      // if endPos is unreachable, an empty array is returned but distance is greater than 0
      return null;
    }
    for (let i=1; i<arr.length; i++) {
      path.push(new Vector2(arr[i][0], arr[i][1]));
    }
    return path;
  }

  findShortestPath = (startPos, endPositions) => {
    let resultPath = null;

    if (!this._isValidPos(startPos)) {
      return resultPath;
    }

    let paths = [];
    endPositions.forEach(pos => {
      paths.push(this.findPath(startPos, pos));
    });

    paths.forEach(path => {
      if (!resultPath) {
        resultPath = path;
      }
      else if (path.length < resultPath.length) {
        resultPath = path;
      }
    });

    return resultPath;
  }

  setWalkableAt = (pos, walkable=true) => {
    this._grid.setWalkableAt(pos.x, pos.y, walkable);
  }

  getNeighbors = (pos) => {
    let node = this._grid.getNodeAt(pos.x, pos.y);
    let neighbors = this._grid.getNeighbors(node, PF.DiagonalMovement.Never);
    return neighbors.map(point => new Vector2(point.x, point.y));
  }

  getWalkabilityData = () => {
    let result = [];
    for (let i=0; i<this._area.size; i++) {
      let row = [];
      for (let j=0; j<this._area.size; j++) {
        row[j] = this._grid.getNodeAt(j, i).walkable ? 1 : 0;
      }
      result.push(row);
    }
    return result;
  }

  _isValidPos = (pos) => {
    return pos &&
           (pos.x >= 0 && pos.x <= this._area.size) &&
           (pos.y >= 0 && pos.y <= this._area.size);
  }

  dispose = () => {
    this._area = null;
    this._grid = null;
    this._finder = null;
  }
}

module.exports = {
  Navigator
};
