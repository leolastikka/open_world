class Display
{
  constructor()
  {
    this.unitsPerLowestWidth = 15;
    this.pos = new Vector2();

    this.maxInZoom = 0.5;
    this.maxOutZoom = 2;
    this.zoomLevel = 1;

    let canvas = document.getElementById('mainCanvas');
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this.onResize();

    window.addEventListener('resize', () => this.onResize());
  }

  onResize()
  {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    let lowestWidth = this.width < this.height ? this.width : this.height;

    this.pixelsPerUnit = lowestWidth / this.unitsPerLowestWidth * this.zoomLevel;

    this.unitWidth = this.width / this.pixelsPerUnit;
    this.unitHeight = this.height / this.pixelsPerUnit;
  }

  zoomIn()
  {
    this.zoomLevel -= 0.1;
    if (this.zoomLevel < this.maxInZoom)
    {
      this.zoomLevel = this.maxInZoom;
    }
    this.onResize();
  }

  zoomOut()
  {
    this.zoomLevel += 0.1;
    if (this.zoomLevel > this.maxOutZoom)
    {
      this.zoomLevel = this.maxOutZoom;
    }
    this.onResize();
  }

  isInViewport(worldPos)
  {
    let diff = Vector2.sub(worldPos, this.pos);
    return ((diff.x > -this.unitWidth &&
        diff.x < this.unitWidth) ||
        (diff.y > -this.unitHeight &&
        diff.y < this.unitHeight));
  }

  getRenderPos(worldPos)
  {
    let diff = Vector2.sub(worldPos, this.pos);
    diff = Vector2.mult(diff, this.pixelsPerUnit);
    return Vector2.add(diff, new Vector2(this.width/2.0, this.height/2.0));
  }

  screenToUnitPos(screenPos)
  {
    let screenUnitPos = Vector2.sub(screenPos, new Vector2(this.width/2.0, this.height/2.0));
    screenUnitPos = Vector2.div(screenUnitPos, this.pixelsPerUnit);
    return Vector2.add(screenUnitPos, this.pos);
  }
}