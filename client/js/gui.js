class GUI extends EventTarget
{
  constructor(game)
  {
    super();

    this.game = game;
    this.onClickLogout = this.onClickLogout.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouch = this.onTouch.bind(this);
    this.onWheel = this.onWheel.bind(this);

    this.element = document.getElementById('gui');
    this.menuElement = document.getElementById('menu');
    this.logoutButton = this.menuElement.querySelector('button[name="logout"]');
    this.zoomInButton = this.menuElement.querySelector('button[name="zoomIn"]');
    this.zoomOutButton = this.menuElement.querySelector('button[name="zoomOut"]');
    this.dropdownMenuElement = document.getElementById('dropdownMenu');

    this.logoutButton.addEventListener('click', this.onClickLogout);
    this.zoomInButton.addEventListener('click', this.onZoomIn);
    this.zoomOutButton.addEventListener('click', this.onZoomOut);

    this.element.addEventListener('pointerdown', this.onClick);
    this.element.addEventListener('touchstart', this.onTouch);
    this.element.addEventListener('wheel', this.onWheel);

    this.element.oncontextmenu = () => false; // disable default right click
  }

  show()
  {
    this.element.removeAttribute('hidden');
  }

  hide()
  {
    this.element.setAttribute('hidden', 'hidden');
  }

  onClick(event)
  {
    if (event.button === 0) // left click
    {
      this.dropdownMenuElement.setAttribute('hidden', 'hidden');

      let e = new Event('click');
      e.clientX = event.clientX;
      e.clientY = event.clientY;
      this.dispatchEvent(e);
    }
    else if (event.button === 2) // right click
    {
      this.dropdownMenuElement.removeAttribute('hidden');
      this.dropdownMenuElement.style.left = `${event.clientX}px`;
      this.dropdownMenuElement.style.top = `${event.clientY}px`;

      let clickPos = new Vector2(event.clientX, event.clientY);
      let unitPos = this.game.display.screenToUnitPos(clickPos)
      unitPos.add(new Vector2(0.5, 0.5));
      unitPos = new Vector2(Math.floor(unitPos.x), Math.floor(unitPos.y));

      let actions = [];
      let clickedObjects = GameObjectManager.getObjectsInPosition(unitPos);
      clickedObjects.forEach(go => {
        actions.push.apply(actions, go.getActions());
      });
      if (actions.length === 0)
      {
        actions.push('Nothing');
      }

      let listElement = this.dropdownMenuElement.querySelector('ul');
      listElement.innerHTML = '';
      actions.forEach(a => {
        let listItem = document.createElement('li');
        listItem.innerHTML = a;
        listElement.appendChild(listItem);
      });
    }
  }

  onTouch(event)
  {
    let touch = event.touches[0];

    let e = new Event('click');
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
    this.dispatchEvent(e);
  }

  onWheel(event)
  {
    if (event.deltaY < 0)
    {
      this.game.display.zoomIn();
    }
    else if (event.deltaY > 0)
    {
      this.game.display.zoomOut();
    }
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

    this.element.removeEventListener('pointerdown', this.onClick);
    this.element.removeEventListener('touchstart', this.onTouch);
    this.element.removeEventListener('wheel', this.onWheel);
  }
}
