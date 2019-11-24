const PF = require('pathfinding');
const Vector2 = require('./math').Vector2;

class Navigator
{
  static init(area)
  {
    this.area = area;
    this.grid = new PF.Grid(area.size, area.size);
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });

    for (let i=0; i<area.tiles.length; i++)
    {
      for (let j=0; j<area.tiles[i].length; j++)
      {
        let isWalkable = area.tiles[i][j] < 5;
        this.grid.setWalkableAt(j, i, isWalkable);
      }
    }
  }

  static findPath(startPos, endPos)
  {
    if (!this._isValidPos(startPos) || !this._isValidPos(endPos))
    {
      return null;
    }

    let grid = this.grid.clone();
    let path = [];
    let arr = this.finder.findPath(startPos.x, startPos.y, endPos.x, endPos.y, grid);
    for (let i=1; i<arr.length; i++)
    {
      path.push(new Vector2(arr[i][0], arr[i][1]));
    }
    return path;
  }

  static _isValidPos(pos)
  {
    return (pos.x >= 0 && pos.x <= this.area.size) &&
           (pos.y >= 0 && pos.y <= this.area.size);
  }
}

module.exports = Navigator;
