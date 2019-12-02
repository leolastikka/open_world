class Renderer
{
  static get RenderLayer()
  {
    return {
      Tile: 0,
      Object: 1
    };
  }

  constructor() {}
  render(canvasContext, data) {}
  renderGUI(canvasContext, data) {}
}

class TileRenderer extends Renderer
{
  constructor(color, borderColor='black')
  {
    super();
    this.color = color;
    this.borderColor = borderColor;
  }

  render(canvasContext, data)
  {
    canvasContext.beginPath();
    canvasContext.fillStyle = this.color;
    canvasContext.fillRect(
      data.pos.x - data.size / 2 +1,
      data.pos.y - data.size / 2 +1,
      data.size -2,
      data.size -2);
    canvasContext.fill();

    // canvasContext.strokeStyle = this.borderColor;
    // canvasContext.strokeRect(
    //   data.pos.x - data.size / 2,
    //   data.pos.y - data.size / 2,
    //   data.size,
    //   data.size);
  }
}

class TileTriangleRenderer extends Renderer
{
  constructor(color)
  {
    super();
    this.color = color;
    this.borderColor = 'white';
  }

  render(canvasContext, data)
  {
    canvasContext.beginPath();
    canvasContext.fillStyle = this.color;

    // bottom right
    canvasContext.moveTo(
      data.pos.x + data.size / 2 -1,
      data.pos.y + data.size / 2 -1
    );
    // bottom left
    canvasContext.lineTo(
      data.pos.x - data.size / 2 +1,
      data.pos.y + data.size / 2 -1
    );
    // top center
    canvasContext.lineTo(
      data.pos.x -1,
      data.pos.y - data.size / 2
    );
    canvasContext.fill();

    // canvasContext.strokeStyle = this.borderColor;
    // canvasContext.stroke();
  }
}

class TileBoxRenderer extends Renderer
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
    canvasContext.fillRect(
      data.pos.x - data.size / 2 +5,
      data.pos.y - data.size / 2 +5,
      data.size -10,
      data.size -10);
    canvasContext.fill();
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
  }
}
