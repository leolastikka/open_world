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

  render(display) {
    const src = this._rect;
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

class CharacterRenderer extends Renderer
{
  constructor(color)
  {
    super();
    this.color = color;
  }

  render(canvasContext, data)
  {
    canvasContext.beginPath();
    canvasContext.fillStyle = this.color;
    canvasContext.arc(data.pos.x, data.pos.y, data.size/2 * 0.75, 0, 2 * Math.PI, false);
    canvasContext.fill();
  }

  renderGUI(canvasContext, data)
  {
    canvasContext.font = "1em 'Courier New'";
    canvasContext.fillStyle = 'yellowgreen';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(data.text, data.pos.x, data.pos.y);

    if (data.inCombat)
    {
      canvasContext.beginPath();
      canvasContext.fillStyle = 'red';
      canvasContext.fillRect(
        data.hpPos.x - data.size / 2,
        data.hpPos.y - data.size / 2,
        data.size,
        data.size / 5);
      canvasContext.fill();

      canvasContext.beginPath();
      canvasContext.fillStyle = 'yellowgreen';
      canvasContext.fillRect(
        data.hpPos.x - data.size / 2,
        data.hpPos.y - data.size / 2,
        data.size * (data.hp / 10),
        data.size / 5);
      canvasContext.fill();
    }
  }
}
