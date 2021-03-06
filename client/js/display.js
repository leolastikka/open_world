class Display {
  constructor() {
    this.onResize = this.onResize.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);

    this.pos = new Vector2();
    this.drawDistance = 25;

    this.maxInZoom = 1;
    this.maxOutZoom = 3;
    this.zoomLevel = 2;

    let canvas = document.getElementById('mainCanvas');
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this.onResize();

    window.addEventListener('resize', this.onResize);

    const mobileUserAgents = [
        /Android/i
    ];
    const isMobile = mobileUserAgents.some(ua => navigator.userAgent.match(ua));
    if(isMobile) {
      this.drawDistance = 7; // show less tiles on mobile to increase performance
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    let lowestWidth = this.width < this.height ? this.width : this.height;

    this.pixelsPerUnit = lowestWidth / this.unitsPerLowestWidth * this.zoomLevel;

    this.unitWidth = this.width / this.pixelsPerUnit;
    this.unitHeight = this.height / this.pixelsPerUnit;
  }

  zoomIn() {
    this.zoomLevel += 1;
    if (this.zoomLevel > this.maxOutZoom) {
      this.zoomLevel = this.maxOutZoom;
    }
    this.onResize();
  }

  zoomOut() {
    this.zoomLevel -= 1;
    if (this.zoomLevel < this.maxInZoom) {
      this.zoomLevel = this.maxInZoom;
    }
    this.onResize();
  }

  isInViewport(worldPos) {
    const diff = Vector2.sub(worldPos, this.pos);
    return diff.x > -this.drawDistance &&
        diff.x < this.drawDistance &&
        diff.y > -this.drawDistance &&
        diff.y < this.drawDistance;
  }

  getRenderPos(worldPos) {
    const diff = Vector2.sub(worldPos, this.pos);
    const x = diff.x * (ResourceManager.tileWidth / 2) - (diff.y * (ResourceManager.tileWidth / 2));
    const y = diff.x * (ResourceManager.tileHeight / 2) + (diff.y * (ResourceManager.tileHeight / 2));
    const pos = new Vector2(x, y);
    pos.mult(this.zoomLevel);
    pos.add(new Vector2(this.width/2.0, this.height/2.0));
    const halfSprite = ResourceManager.halfSpriteVector;
    halfSprite.mult(this.zoomLevel);
    pos.sub(halfSprite);
    return pos;
  }

  screenToUnitPos(screenPos) {
    const screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    const halfSprite = ResourceManager.halfSpriteVector;
    halfSprite.mult(this.zoomLevel);
    screenUnitPos.add(halfSprite);
    const tileX = (screenUnitPos.x + (2 * screenUnitPos.y) - (ResourceManager.tileWidth / 2)) / ResourceManager.tileWidth;
    const tileY = (screenUnitPos.x - (2 * screenUnitPos.y) - (ResourceManager.tileHeight / 2)) / - ResourceManager.tileWidth;
    const pos = new Vector2(tileX, tileY);
    pos.div(this.zoomLevel);
    pos.add(this.pos);
    pos.add(new Vector2(-2, -2)); // fix something
    return pos;
  }

  screenToUnitPosFloor(screenPos) {
    const screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    const halfSprite = ResourceManager.halfSpriteVector;
    halfSprite.mult(this.zoomLevel);
    screenUnitPos.add(halfSprite);
    const tileX = (screenUnitPos.x + (2 * screenUnitPos.y) - (ResourceManager.tileWidth / 2)) / ResourceManager.tileWidth;
    const tileY = (screenUnitPos.x - (2 * screenUnitPos.y) - (ResourceManager.tileHeight / 2)) / - ResourceManager.tileWidth;
    const pos = new Vector2(tileX, tileY);
    pos.div(this.zoomLevel);
    pos.add(this.pos);
    pos.add(new Vector2(-2, -1.5)); // fix something
    return new Vector2(Math.floor(pos.x), Math.floor(pos.y));
  }
}