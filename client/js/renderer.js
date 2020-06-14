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
    this._animation = this._animations[this._currentAnimationName];
    this._animation.reset();
  }
}

class CharacterRenderer {
  constructor(armorType, weaponType) {
    this._entity = null;
    this.armorRenderer = null;
    this.weaponRenderer = null;

    this.setArmor(armorType);
    this.setWeapon(weaponType);
  }

  get layer() {
    return this.armorRenderer.layer;
  }

  set entity(entity) {
    this._entity = entity;
    this.armorRenderer.entity = entity;
    if (this.weaponRenderer) {
      this.weaponRenderer.entity = entity;
    }
  }

  get entity() {
    return this._entity;
  }

  setAnimation(name) {
    this.armorRenderer.setAnimation(name);
    if (this.weaponRenderer) {
      this.weaponRenderer.setAnimation(name);
    }
  }

  setArmor(armorType) {
    if (this.armorRenderer) {
      this.armorRenderer.dispose();
    }

    const currentAnimationName = this.armorRenderer ? this.armorRenderer.currentAnimationName : 'idle';
    this.armorRenderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType(armorType)
      );
    this.armorRenderer.entity = this.entity;
    // sync armor and weapon animations
    this.armorRenderer.setAnimation(currentAnimationName);
    if (this.weaponRenderer) {
      this.weaponRenderer.setAnimation(currentAnimationName);
    }
  }

  setWeapon(weaponType) {
    if (this.weaponRenderer) {
      this.weaponRenderer.dispose();
    }

    if (weaponType !== 'none') {
      const currentAnimationName = this.armorRenderer ? this.armorRenderer.currentAnimationName : 'idle';
      this.weaponRenderer = new AnimatedSpriteRenderer(
        RenderLayer.Walls,
        ResourceManager.texture,
        ResourceManager.getAnimationsByType(weaponType)
        );
      this.weaponRenderer.entity = this.entity;
      // sync armor and weapon animations
      this.weaponRenderer.setAnimation(currentAnimationName);
      this.armorRenderer.setAnimation(currentAnimationName);
    }
    else {
      this.weaponRenderer = null;
    }
  }

  render(display) {
    this.armorRenderer.render(display);
    if (this.weaponRenderer) {
      this.weaponRenderer.render(display);
    }
  }

  dispose() {
    this.entity = null;
    if (this.armorRenderer) {
      this.armorRenderer.dispose();
      this.armorRenderer = null;
    }
    if (this.weaponRenderer) {
      this.weaponRenderer.dispose();
      this.weaponRenderer = null;
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
