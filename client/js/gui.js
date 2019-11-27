class GUI extends EventTarget
{
  constructor(game)
  {
    super();

    this.game = game;
    this.onClickLogout = this.onClickLogout.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);

    this.element = document.getElementById('gui');
    this.menuElement = document.getElementById('menu');
    this.logoutButton = this.menuElement.querySelector('button[name="logout"]');
    this.zoomInButton = this.menuElement.querySelector('button[name="zoomIn"]');
    this.zoomOutButton = this.menuElement.querySelector('button[name="zoomOut"]');

    this.element.removeAttribute('hidden');

    this.logoutButton.addEventListener('click', this.onClickLogout);
    this.zoomInButton.addEventListener('click', this.onZoomIn);
    this.zoomOutButton.addEventListener('click', this.onZoomOut);
  }

  onClickLogout(event)
  {
    this.dispatchEvent(new Event('logout'));
  }

  onZoomIn()
  {
    this.game.display.zoomIn();
  }

  onZoomOut()
  {
   this.game.display.zoomOut(); 
  }

  dispose()
  {
    this.element.setAttribute('hidden', 'hidden');

    this.logoutButton.removeEventListener('click', this.onClickLogout);
    this.zoomInButton.removeEventListener('click', this.onZoomIn);
    this.zoomOutButton.removeEventListener('click', this.onZoomOut);
  }
}
