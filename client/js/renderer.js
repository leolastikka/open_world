const RenderLayer = Object.freeze({
  Floor: 0,
  Walls: 1
});

class Renderer {
  constructor(layer) {
    this.layer = layer;
    this.entity = null; // needs to be set by the parent entity
  }
  render(display) {}
  dispose() {
    this.entity = null;
  }
}

class SpriteRenderer extends Renderer {
  constructor(layer, texture, rect) {
    super(layer);
    this._texture = texture;
    this._rect = rect;
  }

  get rect() {
    return this._rect;
  }

  render(display) {
    const src = this.rect;
    const destPos = display.getRenderPos(this.entity.pos);
    const dest = {
      x: destPos.x,
      y: destPos.y,
      w: ResourceManager.spriteWidth * display.zoomLevel,
      h: ResourceManager.spriteHeight * display.zoomLevel
    };
    //display.context.imageSmoothingEnabled = false;
    if (this.layer === RenderLayer.Walls && !this.entity.isOwned) {
      const diff = Vector2.sub(display.pos, this.entity.pos);
      if (diff.x > -3 &&
          diff.x < 1 &&
          diff.y > -3 &&
          diff.y < 1) {
        display.context.globalAlpha = 0.5;
      }
      else {
        display.context.globalAlpha = 1;
      }
    }
    // use antialiasing when pixel art isn't scaled properly
    display.context.imageSmoothingEnabled = !(display.zoomLevel % 1 === 0);
    display.context.drawImage(this._texture, src.x, src.y, src.w, src.h, dest.x, dest.y, dest.w, dest.h);
    display.context.globalAlpha = 1;
  }
}

class AnimatedSpriteRenderer extends SpriteRenderer {
  constructor(layer, texture, animations) {
    super(layer, texture, null);
    this._animations = animations;
    this._animation = animations['idle'];
  }

  get rect() {
    return this._animation.frame.rect;
  }

  setAnimation(name) {
    this._animation = this._animations[name];
  }
}

class Animation {
  constructor(name, frames) {
    this._name = name;
    this._frames = frames;

    this._animationTime = 0; // progress time
    this._animationLength = 0;
    for (let i = 0; i < frames.length; i++) {
      this._animationLength += frames[i].time;
    }
  }

  get name() {
    return this._name;
  }

  get frame() {
    this._animationTime += Time.deltaTime;
    const progress = this._animationTime / this._animationLength;
    if (progress > 1) {
      this._animationTime -= this._animationLength;
    }

    let i = 0;
    let t = this._frames[i].time;
    while (t < this._animationTime) {
      t += this._frames[i++].time;
    }
    return this._frames[i];
  }
}
