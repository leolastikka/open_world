class ResourceManager {
  static init() {
    // this._texture = new Image();
    // this._texture.src = '../img/tiles.png';
    this._texture = document.getElementById('spriteSheet');

    this._textureSize = 512;
    this._tileWidth = 32;
    this._tileHeight = 16;
    this._spriteWidth = this._tileWidth;
    this._spriteHeight = 48;
    
    this._floorTiles = [0,1,2,3,4];
    this._wallsTiles = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28, 34,35, 38, 49, 51];
    this._playerTile = 48;
  }

  static get texture() {
    return this._texture;
  }

  static get tileWidth() {
    return this._tileWidth;
  }

  static get tileHeight() {
    return this._tileHeight;
  }

  static get spriteWidth() {
    return this._spriteWidth;
  }

  static get spriteHeight() {
    return this._spriteHeight;
  }

  static get floorTiles() {
    return this._floorTiles;
  }

  static get wallsTiles() {
    return this._wallsTiles;
  }

  static get playerTile() {
    return this._playerTile;
  }

  static getSpriteRectByIndex(index) {
    const maxPos = this._textureSize / this._spriteWidth;
    return {
      x: this._spriteWidth * (index % maxPos),
      y: this._spriteHeight * Math.floor(index / maxPos),
      w: this._spriteWidth,
      h: this._spriteHeight
    }
  }
}