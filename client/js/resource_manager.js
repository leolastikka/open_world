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
    this._wallsTiles = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28, 32,33,34,35,36,37,38];
    this._linkTile = 13;

    const Rect = ResourceManager.getSpriteRectByIndex;

    // animation frames = [[Rect(spriteIndex), frame time in seconds], ...]
    this._animationsData = {
      enemy: [
        {
          name: 'idle',
          frames: [[Rect(50), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(50), 0.2], [Rect(66), 0.2]]
        }
      ],
      npc_guard: [
        {
          name: 'idle',
          frames: [[Rect(51), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(51), 0.2], [Rect(67), 0.2]]
        }
      ],
      npc_worker: [
        {
          name: 'idle',
          frames: [[Rect(49), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(49), 0.3], [Rect(65), 0.3]]
        }
      ],
      player: [
        {
          name: 'idle',
          frames: [[Rect(48), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(48), 0.2], [Rect(64), 0.2]]
        }
      ]
    };
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

  static get halfSpriteVector() {
    return new Vector2(this._spriteWidth / 2, this._spriteHeight / 2);
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

  static get linkTile() {
    return this._linkTile;
  }

  static getSpriteRectByIndex = (index) => {
    const maxPos = this._textureSize / this._spriteWidth;
    return {
      x: this._spriteWidth * (index % maxPos),
      y: this._spriteHeight * Math.floor(index / maxPos),
      w: this._spriteWidth,
      h: this._spriteHeight
    }
  }

  static getAnimationsByType(type) {
    const entityAnimations = this._animationsData[type];
    let animations = {};
    for (let i = 0; i < entityAnimations.length; i++) {
      let animation = entityAnimations[i];
      let frames = [];
      for (let j = 0; j < animation.frames.length; j++) {
        frames.push({
          rect: animation.frames[j][0],
          time: animation.frames[j][1]
        });
      }
      animations[animation.name] = new Animation(animation.name, frames);
    }
    return animations;
  }
}