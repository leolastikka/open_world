class Display {
  constructor() {
    this.unitsPerLowestWidth = 15;
    this.pos = new Vector2();

    this.maxInZoom = 1;
    this.maxOutZoom = 3;
    this.zoomLevel = 1;

    let canvas = document.getElementById('mainCanvas');
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this.onResize();

    window.addEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    let lowestWidth = this.width < this.height ? this.width : this.height;

    this.pixelsPerUnit = lowestWidth / this.unitsPerLowestWidth * this.zoomLevel;

    this.unitWidth = this.width / this.pixelsPerUnit;
    this.unitHeight = this.height / this.pixelsPerUnit;
  }

  zoomIn = () => {
    this.zoomLevel += 0.1;
    if (this.zoomLevel > this.maxOutZoom) {
      this.zoomLevel = this.maxOutZoom;
    }
    this.onResize();
  }

  zoomOut = () => {
    this.zoomLevel -= 0.1;
    if (this.zoomLevel < this.maxInZoom) {
      this.zoomLevel = this.maxInZoom;
    }
    this.onResize();
  }

  isInViewport(worldPos) {
    // let diff = Vector2.sub(worldPos, this.pos);
    // return (diff.x > -this.unitWidth * 0.6 &&
    //     diff.x < this.unitWidth * 0.6 &&
    //     diff.y > -this.unitHeight * 0.6 &&
    //     diff.y < this.unitHeight * 0.6);
    const maxTiles = 10;
    const diff = Vector2.sub(worldPos, this.pos);
    return diff.x > -maxTiles &&
        diff.x < maxTiles &&
        diff.y > -maxTiles &&
        diff.y < maxTiles;
  }

  getRenderPos(worldPos) {
    const diff = Vector2.sub(worldPos, this.pos);
    const x = diff.x * (ResourceManager.tileWidth / 2) - (diff.y * (ResourceManager.tileWidth / 2));
    const y = diff.x * (ResourceManager.tileHeight / 2) + (diff.y * (ResourceManager.tileHeight / 2));
    const pos = new Vector2(x, y);
    pos.mult(this.zoomLevel);
    pos.add(new Vector2(this.width/2.0, this.height/2.0));
    return pos;
    // let diff = Vector2.sub(worldPos, this.pos);
    // diff = Vector2.mult(diff, this.pixelsPerUnit);
    // return Vector2.add(diff, new Vector2(this.width/2.0, this.height/2.0));
  }

  screenToUnitPos(screenPos) {
    const screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    const tileX = (screenUnitPos.x + (2 * screenUnitPos.y) - (ResourceManager.tileWidth / 2)) / ResourceManager.tileWidth;
    const tileY = (screenUnitPos.x - (2 * screenUnitPos.y) - (ResourceManager.tileHeight / 2)) / - ResourceManager.tileWidth;
    const pos = new Vector2(tileX, tileY);
    pos.div(this.zoomLevel);
    pos.add(this.pos);
    return pos;
    // let screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    // screenUnitPos = Vector2.div(screenUnitPos, this.pixelsPerUnit);
    // return Vector2.add(screenUnitPos, this.pos);
  }

  screenToUnitPosFloor(screenPos) {
    const screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    const tileX = (screenUnitPos.x + (2 * screenUnitPos.y) - (ResourceManager.tileWidth / 2)) / ResourceManager.tileWidth;
    const tileY = (screenUnitPos.x - (2 * screenUnitPos.y) - (ResourceManager.tileHeight / 2)) / - ResourceManager.tileWidth;
    const pos = new Vector2(tileX, tileY);
    pos.div(this.zoomLevel);
    pos.add(this.pos);
    pos.add(new Vector2(-2, -2)); // fix something
    return new Vector2(Math.floor(pos.x), Math.floor(pos.y));
    // let screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    // screenUnitPos.div(this.pixelsPerUnit);
    // screenUnitPos.add(this.pos);
    // screenUnitPos.add(new Vector2(0.5, 0.5));
    // return new Vector2(Math.floor(screenUnitPos.x), Math.floor(screenUnitPos.y));
  }
}