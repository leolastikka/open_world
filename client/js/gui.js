class GUI extends EventTarget {
  constructor(game) {
    super();

    this.game = game;
    this.touchTimer = null;
    this.touchEvent = null;
    this.longTouchTime = 250; // ms
    this.pointerUnitData = {
      pos: null,
      hasActions: false
    };

    this.onClickLogout = this.onClickLogout.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onLongTouch = this.onLongTouch.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.closeDropdownMenu = this.closeDropdownMenu.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);

    this.element = document.getElementById('gui');
    this.menuElement = document.getElementById('menu');
    this.logoutButton = this.menuElement.querySelector('button[name="logout"]');
    this.zoomInButton = this.menuElement.querySelector('button[name="zoomIn"]');
    this.zoomOutButton = this.menuElement.querySelector('button[name="zoomOut"]');
    this.dropdownMenuElement = document.getElementById('dropdownMenu');
    this.dialogElement = document.getElementById('dialog');
    this.dialogCloseButton = this.dialogElement.querySelector('button');
    this.actionElement = document.getElementById('action');
    this.actionSuggestion = this.actionElement.querySelector('p[name="suggestion"]');
    this.actionLast = this.actionElement.querySelector('p[name="last"]');

    this.logoutButton.addEventListener('click', this.onClickLogout);
    this.zoomInButton.addEventListener('click', this.onZoomIn);
    this.zoomOutButton.addEventListener('click', this.onZoomOut);
    this.dialogCloseButton.addEventListener('click', this.closeDialog);

    this.element.addEventListener('mousedown', this.onClick);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('touchstart', this.onTouchStart);
    this.element.addEventListener('touchend', this.onTouchEnd);
    this.element.addEventListener('wheel', this.onWheel);

    this.element.oncontextmenu = () => false; // disable default right click
    this.closeDialog();
    this.closeDropdownMenu();
    this.actionSuggestion.innerHTML = '';
    this.actionLast.innerHTML = '';
  }

  show() {
    this.element.removeAttribute('hidden');
  }

  hide() {
    this.element.setAttribute('hidden', 'hidden');
  }

  onClick(event) {
    if (event.button === 0) { // left click
      if (event.target === this.element) {
        this.closeDropdownMenu();
      }
      else {
        return;
      }

      let e = new Event('click');
      e.unitPos = this.game.display.screenToUnitPosFloor(new Vector2(event.clientX, event.clientY));
      this.dispatchEvent(e);
    }
    else if (event.button === 2) // right click
    {
      this.openDropdownMenu(event.clientX, event.clientY);
    }
  }

  onPointerMove(event) {
    let unitPos = this.game.display.screenToUnitPosFloor(new Vector2(event.clientX, event.clientY));

    let actions = [];
    let clickedEntities = EntityManager.getEntitiesNearPosition(unitPos, 1);
    clickedEntities.forEach(go => {
      actions.unshift.apply(actions, go.actions);
    });

    this.pointerUnitData = {
      pos: unitPos,
      hasActions: false
    };

    if (actions.length === 0) {
      this.actionSuggestion.innerHTML = '';
    }
    else {
      this.actionSuggestion.innerHTML = `> Do action: ${actions[0].text}`;
      this.pointerUnitData.hasActions = true;
    }
  }

  onTouchStart(event)
  {
    if (event.target === this.element)
    {
      this.closeDropdownMenu();
    }
    else{
      return;
    }
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
        e.unitPos = this.game.display.screenToUnitPosFloor(new Vector2(touch.clientX, touch.clientY));
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

  onWheel(event) {
    if (event.deltaY < 0) {
      this.onZoomIn();
    }
    else if (event.deltaY > 0) {
      this.onZoomOut();
    }
  }

  onClickLogout(event) {
    this.dispatchEvent(new Event('logout'));
  }

  openDropdownMenu(x, y) {
    let clickPos = new Vector2(x, y);
    let unitPos = this.game.display.screenToUnitPos(clickPos)
    unitPos.add(new Vector2(0, 0.5));
    unitPos = new Vector2(Math.floor(unitPos.x), Math.floor(unitPos.y));

    let actions = [new Action('Cancel')];
    let clickedEntities = EntityManager.getEntitiesNearPosition(unitPos, 1);
    clickedEntities.forEach(go => {
      actions.unshift.apply(actions, go.actions);
    });

    this.dropdownMenuElement.innerHTML = '';
    actions.forEach(a => {
      let listItem = document.createElement('li');
      listItem.innerHTML = a.text;
      listItem.addEventListener('click', this.clickDropdownMenuItem.bind(this, a));
      listItem.addEventListener('click', this.closeDropdownMenu);
      this.dropdownMenuElement.appendChild(listItem);
    });

    this.dropdownMenuElement.removeAttribute('hidden');
    let menuPos = new Vector2(x, y);
    if (menuPos.x + this.dropdownMenuElement.offsetWidth > this.game.display.width) {
      menuPos.x -= menuPos.x + this.dropdownMenuElement.offsetWidth - this.game.display.width;
    }
    if (menuPos.y + this.dropdownMenuElement.offsetHeight > this.game.display.height) {
      menuPos.y -= menuPos.y + this.dropdownMenuElement.offsetHeight - this.game.display.height;
    }
    this.dropdownMenuElement.style.left = `${menuPos.x}px`;
    this.dropdownMenuElement.style.top = `${menuPos.y}px`;
  }

  clickDropdownMenuItem(action, event) {
    let e = new Event('action');
    e.action = action;
    this.dispatchEvent(e);
    this.pointerUnitData.pos = null;
  }

  closeDropdownMenu() {
    this.dropdownMenuElement.setAttribute('hidden', 'hidden');
    this.dropdownMenuElement.innerHTML = '';
  }

  openDialog(text) {
    this.dialogElement.querySelector('p[name="content"]').innerHTML = text;
    this.dialogElement.removeAttribute('hidden');
  }

  closeDialog() {
    this.dialogElement.setAttribute('hidden', 'hidden');
  }

  setLastAction(text) {
    this.actionLast.innerHTML = `> Last action: ${text}`;
  }

  onZoomIn() {
    this.closeDropdownMenu();
    this.game.display.zoomIn();
  }

  onZoomOut() {
    this.closeDropdownMenu();
   this.game.display.zoomOut(); 
  }

  dispose() {
    this.element.setAttribute('hidden', 'hidden');

    this.logoutButton.removeEventListener('click', this.onClickLogout);
    this.zoomInButton.removeEventListener('click', this.onZoomIn);
    this.zoomOutButton.removeEventListener('click', this.onZoomOut);
    this.dialogCloseButton.removeEventListener('click', this.closeDialog);

    this.element.removeEventListener('mousedown', this.onClick);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('touchstart', this.onTouchStart);
    this.element.removeEventListener('touchend', this.onTouchEnd);
    this.element.removeEventListener('wheel', this.onWheel);
  }
}
