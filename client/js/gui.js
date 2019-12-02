class GUI extends EventTarget
{
  constructor(game)
  {
    super();

    this.game = game;
    this.touchTimer = null;
    this.touchEvent = null;
    this.longTouchTime = 250; // ms

    this.onClickLogout = this.onClickLogout.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onLongTouch = this.onLongTouch.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.closeDropdownMenu = this.closeDropdownMenu.bind(this);

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
    this.element.addEventListener('touchstart', this.onTouchStart);
    this.element.addEventListener('touchend', this.onTouchEnd);
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
      if (event.target === this.element)
      {
        this.closeDropdownMenu();
      }
      else{
        return;
      }

      let e = new Event('click');
      e.clientX = event.clientX;
      e.clientY = event.clientY;
      this.dispatchEvent(e);
    }
    else if (event.button === 2) // right click
    {
      this.openDropdownMenu(event.clientX, event.clientY);
    }
  }

  onTouchStart(event)
  {
    this.touchEvent = event;
    if (!this.touchTimer)
    {
      this.touchTimer = setTimeout(this.onLongTouch, this.longTouchTime);
    }
  }

  onTouchEnd(event)
  {
    if (this.touchTimer)
    {
      if (this.dropdownMenuElement.hasAttribute('hidden')) // don't move if menu was opened
      {
        let e = new Event('click');
        let touch = this.touchEvent.touches[0];
        e.clientX = touch.clientX;
        e.clientY = touch.clientY;
        this.dispatchEvent(e);
      }

      this.touchTimer = clearTimeout(this.touchTimer);
    }
    this.touchEvent = null;
  }

  onLongTouch()
  {
    let touch = this.touchEvent.touches[0];
    this.openDropdownMenu(touch.clientX, touch.clientY);
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

  openDropdownMenu(x, y)
  {
    let clickPos = new Vector2(x, y);
    let unitPos = this.game.display.screenToUnitPos(clickPos)
    unitPos.add(new Vector2(0.5, 0.5));
    unitPos = new Vector2(Math.floor(unitPos.x), Math.floor(unitPos.y));

    let actions = ["Cancel"];
    let clickedObjects = GameObjectManager.getObjectsNearPosition(unitPos, 1);
    clickedObjects.forEach(go => {
      actions.unshift.apply(actions, go.getActions());
    });

    this.dropdownMenuElement.innerHTML = '';
    actions.forEach(a => {
      let listItem = document.createElement('li');
      listItem.innerHTML = a;
      listItem.addEventListener('click', (event) => {
        let originalUnitPos = Vector2.clone(unitPos);
        let action = a;
        console.log(`clicked ${action}`);
      });
      listItem.addEventListener('click', this.closeDropdownMenu);
      this.dropdownMenuElement.appendChild(listItem);
    });

    this.dropdownMenuElement.removeAttribute('hidden');
    let menuPos = new Vector2(x, y);
    if (menuPos.x + this.dropdownMenuElement.offsetWidth > this.game.display.width)
    {
      menuPos.x -= menuPos.x + this.dropdownMenuElement.offsetWidth - this.game.display.width;
    }
    if (menuPos.y + this.dropdownMenuElement.offsetHeight > this.game.display.height)
    {
      menuPos.y -= menuPos.y + this.dropdownMenuElement.offsetHeight - this.game.display.height;
    }
    this.dropdownMenuElement.style.left = `${menuPos.x}px`;
    this.dropdownMenuElement.style.top = `${menuPos.y}px`;
  }

  closeDropdownMenu()
  {
    this.dropdownMenuElement.innerHTML = '';
    this.dropdownMenuElement.setAttribute('hidden', 'hidden');
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
