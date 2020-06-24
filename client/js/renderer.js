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
    // render entities near and below player transparent
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
    display.context.imageSmoothingEnabled = false;
    display.context.drawImage(this._texture, src.x, src.y, src.w, src.h, dest.x, dest.y, dest.w, dest.h);
    display.context.globalAlpha = 1;
  }
}

class AnimatedSpriteRenderer extends SpriteRenderer {
  constructor(layer, texture, animations, startAnimationName = 'idle') {
    super(layer, texture, null);

    this._playingOneTimeAnimation = false;
    this._currentAnimationName = startAnimationName;

    this._animations = animations;
    this._animation = animations[this._currentAnimationName];
  }

  get currentAnimationName() {
    return this._currentAnimationName;
  }

  get rect() {
    return this._animation.frame.rect;
  }

  setAnimation(name) {
    this._currentAnimationName = name;
    if (!this._playingOneTimeAnimation) {
      this._animation = this._animations[this._currentAnimationName];
      this._animation.reset();
    }
  }

  playAnimationOnce(name) {
    this._animation = this._animations[name];
    this._animation.reset();

    this._playingOneTimeAnimation = true;
    setTimeout(() => {
      this._playingOneTimeAnimation = false;
      this._animation = this._animations[this._currentAnimationName];
      this._animation.reset();
    }, this._animation.animationLength * 1000);
  }
}

class CharacterRenderer {
  constructor(armorType, weaponType) {
    this._entity = null;
    this._armorRenderer = null;
    this._weaponRenderer = null;

    this.setArmor(armorType);
    this.setWeapon(weaponType);
  }

  get layer() {
    return this._armorRenderer.layer;
  }

  set entity(entity) {
    this._entity = entity;
    this._armorRenderer.entity = entity;
    if (this._weaponRenderer) {
      this._weaponRenderer.entity = entity;
    }
  }

  get entity() {
    return this._entity;
  }

  setAnimation(name) {
    this._armorRenderer.setAnimation(name);
    if (this._weaponRenderer) {
      this._weaponRenderer.setAnimation(name);
    }
  }

  playAnimationOnce(name) {
    this._armorRenderer.playAnimationOnce(name);
    if (this._weaponRenderer) {
      this._weaponRenderer.playAnimationOnce(name);
    }
  }

  setArmor(armorType) {
    if (this._armorRenderer) {
      this._armorRenderer.dispose();
    }

    const currentAnimationName = this._armorRenderer ? this._armorRenderer.currentAnimationName : 'idle';
    this._armorRenderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType(armorType)
      );
    this._armorRenderer.entity = this.entity;
    // sync armor and weapon animations
    this._armorRenderer.setAnimation(currentAnimationName);
    if (this._weaponRenderer) {
      this._weaponRenderer.setAnimation(currentAnimationName);
    }
  }

  setWeapon(weaponType) {
    if (this._weaponRenderer) {
      this._weaponRenderer.dispose();
    }

    if (weaponType !== 'unarmed') {
      const currentAnimationName = this._armorRenderer ? this._armorRenderer.currentAnimationName : 'idle';
      this._weaponRenderer = new AnimatedSpriteRenderer(
        RenderLayer.Walls,
        ResourceManager.texture,
        ResourceManager.getAnimationsByType(weaponType)
        );
      this._weaponRenderer.entity = this.entity;
      // sync armor and weapon animations
      this._weaponRenderer.setAnimation(currentAnimationName);
      this._armorRenderer.setAnimation(currentAnimationName);
    }
    else {
      this._weaponRenderer = null;
    }
  }

  render(display) {
    this._armorRenderer.render(display);
    if (this._weaponRenderer) {
      this._weaponRenderer.render(display);
    }
  }

  dispose() {
    this.entity = null;
    if (this._armorRenderer) {
      this._armorRenderer.dispose();
      this._armorRenderer = null;
    }
    if (this._weaponRenderer) {
      this._weaponRenderer.dispose();
      this._weaponRenderer = null;
    }
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

  get animationLength() {
    return this._animationLength;
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
      if (i === this._frames.length) {
        i--;
        break;
      }
    }
    return this._frames[i];
  }

  reset() {
    this._animationTime = 0;
  }
}
