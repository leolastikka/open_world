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
    this._onToggleAudio = this._onToggleAudio.bind(this);
    this._onToggleLog = this._onToggleLog.bind(this);
    this.closeLog = this.closeLog.bind(this);
    this._onToggleEquipment = this._onToggleEquipment.bind(this);
    this.closeEquipment = this.closeEquipment.bind(this);
    this._onToggleSettings = this._onToggleSettings.bind(this);
    this.closeSettings = this.closeSettings.bind(this);
    this._onChangeDistance = this._onChangeDistance.bind(this);
    this.closeDropdownMenu = this.closeDropdownMenu.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.closeReconstructor = this.closeReconstructor.bind(this);
    this._onSetSpawn = this._onSetSpawn.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onLongTouch = this.onLongTouch.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);

    this.element = document.getElementById('gui');
    this.menuElement = document.getElementById('menu');
    this.logoutButton = this.menuElement.querySelector('button[name="logout"]');
    this.fullscreenButton = this.menuElement.querySelector('button[name="fullscreen"]');
    this.zoomInButton = this.menuElement.querySelector('button[name="zoomIn"]');
    this.zoomOutButton = this.menuElement.querySelector('button[name="zoomOut"]');
    this.audioButton = this.menuElement.querySelector('button[name="audio"]');
    this.logButton = this.menuElement.querySelector('button[name="log"]');
    this.logElement = document.getElementById('log');
    this.logMessagesElement = document.getElementById('messages');
    this.logQuestsElement = document.getElementById('quests');
    this.equipmentButton = this.menuElement.querySelector('button[name="equipment"]');
    this.equipmentElement = document.getElementById('equipment');
    this.settingsButton = this.menuElement.querySelector('button[name="settings"]');
    this.settingsElement = document.getElementById('settings');
    this.settingsVolumeSlider = this.settingsElement.querySelector('input[name="volume"]');
    this.settingsDistanceSlider = this.settingsElement.querySelector('input[name="distance"]');
    this.dropdownMenuElement = document.getElementById('dropdownMenu');
    this.dialogElement = document.getElementById('dialog');
    this.dialogCloseButton = this.dialogElement.querySelector('button[name="close"]');
    this.reconstructorElement = document.getElementById('reconstructor');
    this.actionElement = document.getElementById('action');
    this.actionSuggestion = this.actionElement.querySelector('p[name="suggestion"]');
    this.actionLast = this.actionElement.querySelector('p[name="last"]');

    this.logoutButton.addEventListener('click', this.onClickLogout);
    this.fullscreenButton.addEventListener('click', Options.toggleFullscreen);
    this.zoomInButton.addEventListener('click', this.onZoomIn);
    this.zoomOutButton.addEventListener('click', this.onZoomOut);
    this.audioButton.addEventListener('click', this._onToggleAudio);
    this.logButton.addEventListener('click', this._onToggleLog);
    this.logElement.querySelector('button[name="close-x"]').addEventListener('click', this.closeLog);
    this.equipmentButton.addEventListener('click', this._onToggleEquipment);
    this.equipmentElement.querySelector('button[name="close-x"]').addEventListener('click', this.closeEquipment);
    this.settingsButton.addEventListener('click', this._onToggleSettings);
    this.settingsElement.querySelector('button[name="close-x"]').addEventListener('click', this.closeSettings);
    this.settingsVolumeSlider.addEventListener('input', Options.changeVolume);
    this.settingsDistanceSlider.addEventListener('input', this._onChangeDistance);
    this.dialogElement.querySelector('button[name="close-x"]').addEventListener('click', this.closeDialog);
    this.dialogCloseButton.addEventListener('click', this.closeDialog);
    this.reconstructorElement.querySelector('button[name="close-x"]').addEventListener('click', this.closeReconstructor);

    this.element.addEventListener('mousedown', this.onClick);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('touchstart', this.onTouchStart);
    this.element.addEventListener('touchend', this.onTouchEnd);
    this.element.addEventListener('wheel', this.onWheel);

    this.element.oncontextmenu = () => false; // disable default right click
    this.actionSuggestion.innerHTML = '';
    this.actionLast.innerHTML = '';
    this._updateAudioIcon();
    this._updateDrawDistance();
    this.settingsVolumeSlider.value = Options.audioSliderValue;
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
    const dontScrollOver = [this.dialogElement, this.logElement, this.settingsElement, this.equipmentElement];
    let target = event.target;
    while (target) {
      // prevent zoom when scrolling in dialog window
      if (dontScrollOver.includes(target)) {
        return;
      }
      target = target.parentElement;
    }

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

  openDialog(title, text) {
    this.dialogElement.querySelector('h3[name="title"]').innerHTML = title;
    this.dialogElement.querySelector('p[name="content"]').innerHTML = text;
    this.dialogElement.removeAttribute('hidden');

    this.closeDropdownMenu();
    this.closeLog();
    this.closeEquipment();
    this.closeSettings();
    this.closeReconstructor();
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

  _onToggleAudio() {
    Options.toggleAudio();
    this._updateAudioIcon();
  }
  _onToggleLog() {
    const isOpen = !this.logElement.hasAttribute('hidden');
    if (isOpen) {
      this.closeLog();
    }
    else {
      this.openLog();
      if (this.logButton.classList.contains('flashing')) {
        this.logButton.classList.remove('flashing');
      }
    }
  }
  openLog() {
    this.logElement.removeAttribute('hidden');

    this.closeDialog();
    this.closeDropdownMenu();
    this.closeEquipment();
    this.closeSettings();
    this.closeReconstructor();
  }
  closeLog() {
    this.logElement.setAttribute('hidden', 'hidden');
  }
  updateLog() {
    this.logMessagesElement.innerHTML = '';
    this.logQuestsElement.innerHTML = '';

    this.game.state.log.quests.forEach(q => {
      const quest = document.createElement('div');
      quest.classList.add('content');
      const titleButton = document.createElement('button');
      titleButton.innerHTML = q.title;
      if (q.done) {
        titleButton.classList.add('done');
      }
      quest.appendChild(titleButton);
      const questContent = document.createElement('div');
      //questContent.classList.add('closed');
      const text = document.createElement('p');
      text.innerHTML = q.text;
      questContent.appendChild(text);
      const stages = document.createElement('div');
      q.stages.forEach(s => {
        const stage = document.createElement('div');
        stage.classList.add('content');
        const sText = document.createElement('p');
        sText.innerHTML = s.text;
        stage.appendChild(sText);
        const conditions = document.createElement('ul');
        s.conditions.forEach(c => {
          const condition = document.createElement('li');
          condition.innerHTML = c.text;
          if (c.done) {
            condition.classList.add('done');
          }
          conditions.appendChild(condition);
        });
        stage.appendChild(conditions);
        stages.appendChild(stage);
      });
      questContent.appendChild(stages);
      quest.appendChild(questContent);
      titleButton.addEventListener('click', () => {
        const contentElement = questContent;
        if (contentElement.classList.contains('closed')) {
          contentElement.classList.remove('closed');
        }
        else {
          contentElement.classList.add('closed');
        }
      });
      this.logQuestsElement.appendChild(quest);
    });

    this.game.state.log.messages.forEach(m => {
      const message = document.createElement('div');
      message.classList.add('content');
      const titleButton = document.createElement('button');
      titleButton.innerHTML = m.title;
      message.appendChild(titleButton);
      const text = document.createElement('p');
      text.classList.add('closed');
      text.innerHTML = m.text;
      message.appendChild(text);
      titleButton.addEventListener('click', () => {
        const contentElement = text;
        if (contentElement.classList.contains('closed')) {
          contentElement.classList.remove('closed');
        }
        else {
          contentElement.classList.add('closed');
        }
      });
      this.logMessagesElement.appendChild(message);
    });
  }
  flashLog() {
    if (this.logElement.hasAttribute('hidden')) {
      this.logButton.classList.add('flashing');
    }
  }
  _onToggleEquipment() {
    const isOpen = !this.equipmentElement.hasAttribute('hidden');
    if (isOpen) {
      this.closeEquipment();
    }
    else {
      this.openEquipment();
    }
  }
  openEquipment() {
    this.equipmentElement.removeAttribute('hidden');

    this.closeDialog();
    this.closeDropdownMenu();
    this.closeLog();
    this.closeSettings();
    this.closeReconstructor();
  }
  closeEquipment() {
    this.equipmentElement.setAttribute('hidden', 'hidden');
  }
  updateEquipment(equipment) {
    const armorName = this.equipmentElement.querySelector('td[name="armorName"]');
    armorName.innerHTML = equipment.armor ? equipment.armor.name : '-';
    const armorInfo = this.equipmentElement.querySelector('td[name="armorInfo"]');
    armorInfo.innerHTML = equipment.armor ? equipment.armor.info : '-';
    const armorButton = this.equipmentElement.querySelector('button[name="armor"]');
    armorButton.disabled = equipment.armor ? false : true;
    if (equipment.armor) {
      armorButton.onclick = () => {
        const itemType = equipment.armor.type;
        this.game.state.unequipItem(itemType);
      };
    }

    const weaponName = this.equipmentElement.querySelector('td[name="weaponName"]');
    weaponName.innerHTML = equipment.weapon.name;
    const weaponInfo = this.equipmentElement.querySelector('td[name="weaponInfo"]');
    weaponInfo.innerHTML = equipment.weapon.info;
    const weaponButton = this.equipmentElement.querySelector('button[name="weapon"]');
    weaponButton.disabled = equipment.weapon.type !== 'unarmed' ? false : true;
    if (equipment.weapon) {
      weaponButton.onclick =  () => {
        const itemType = equipment.weapon.type;
        this.game.state.unequipItem(itemType);
      };
    }

    const ammoName = this.equipmentElement.querySelector('td[name="ammoName"]');
    ammoName.innerHTML = equipment.ammo ? equipment.ammo.name : '-';
    const ammoInfo = this.equipmentElement.querySelector('td[name="ammoInfo"]');
    ammoInfo.innerHTML = equipment.ammo ? equipment.ammo.info : '-';
    const ammoButton = this.equipmentElement.querySelector('button[name="ammo"]');
    ammoButton.disabled = equipment.ammo ? false : true;
    if (equipment.ammo) {
      ammoButton.onclick = () => {
        const itemType = equipment.ammo.type;
        this.game.state.unequipItem(itemType);
      };
    }

    const inventory = this.equipmentElement.querySelector('table[name="inventory"]');
    // remove all rows other than header row
    for(let i = 1; i < inventory.rows.length;) {
      inventory.deleteRow(i);
    }

    equipment.inventory.forEach(item => {
      const itemRow = document.createElement('tr');
      const typeTd = document.createElement('td');
      typeTd.innerHTML = item.baseType.charAt(0).toUpperCase() + item.baseType.substr(1);
      const nameTd = document.createElement('td');
      nameTd.innerHTML = item.name;
      const infoTd = document.createElement('td');
      infoTd.innerHTML = item.info;
      const actionsTd = document.createElement('td');
      const actionButton = document.createElement('button');
      if (['armor', 'weapon', 'ammo'].includes(item.baseType)) {
        actionButton.innerHTML = 'Equip';
        actionButton.onclick = () => {
          const itemType = item.type;
          this.game.state.equipItem(itemType);
        };
      }
      else if (['consumable'].includes(item.baseType)) {
        actionButton.innerHTML = 'Use';
        actionButton.onclick = () => {
          const itemType = item.type;
          this.game.state.useItem(itemType);
        };
      }
      actionsTd.appendChild(actionButton);
      itemRow.appendChild(typeTd);
      itemRow.appendChild(nameTd);
      itemRow.appendChild(infoTd);
      itemRow.appendChild(actionsTd);
      inventory.appendChild(itemRow);
    });
  }

  _onToggleSettings() {
    const isOpen = !this.settingsElement.hasAttribute('hidden');
    if (isOpen) {
      this.closeSettings();
    }
    else {
      this.openSettings();
    }
  }
  openSettings() {
    this.settingsElement.removeAttribute('hidden');

    this.closeDialog();
    this.closeDropdownMenu();
    this.closeLog();
    this.closeEquipment();
    this.closeReconstructor();
  }
  closeSettings() {
    this.settingsElement.setAttribute('hidden', 'hidden');
  }
  _onChangeDistance(event) {
    this.game.display.drawDistance = parseInt(event.target.value);
    this._updateDrawDistance();
  }
  _updateAudioIcon() {
    const iconElement = this.audioButton.querySelector('i');
    if (Options.audioEnabled) {
      iconElement.classList.remove('icon-volume-off');
      iconElement.classList.add('icon-volume-up');
    }
    else {
      iconElement.classList.remove('icon-volume-up');
      iconElement.classList.add('icon-volume-off');
    }
  }
  _updateDrawDistance() {
    let value = this.game.display.drawDistance;
    if (value < 10) {
      value = ` ${value}`;
    } 
    this.settingsElement.querySelector('span[name="distanceNumeric"]').innerHTML = value;
    this.settingsDistanceSlider.value = this.game.display.drawDistance;
  }
  openReconstructor(data) {
    this.reconstructorElement.querySelector('span[name="armor"]').innerHTML = data.armor ? data.armor.name : 'none';
    this.reconstructorElement.querySelector('span[name="weapon"]').innerHTML = data.weapon ? data.weapon.name : 'none';

    const spawnElement = this.reconstructorElement.querySelector('p[name="spawn"]');
    spawnElement.innerHTML = '';
    if (data.spawnSetHere) {
      spawnElement.innerHTML = 'Respawn point is set here';
    }
    else {
      const spawnButton = document.createElement('button');
      spawnButton.innerHTML = 'Set respawn point here';
      spawnButton.addEventListener('click', this._onSetSpawn);
      spawnElement.appendChild(spawnButton);
    }

    const insurableList = this.reconstructorElement.querySelector('ul');
    insurableList.innerHTML = '';
    data.insurableGear.forEach(ig => {
      const li = document.createElement('li');
      li.innerHTML = ig.name;
      insurableList.appendChild(li);
    });

    this.reconstructorElement.removeAttribute('hidden');

    this.closeDialog();
    this.closeDropdownMenu();
    this.closeLog();
    this.closeEquipment();
    this.closeSettings();
  }
  closeReconstructor() {
    this.reconstructorElement.setAttribute('hidden', 'hidden');
  }
  _onSetSpawn() {
    this.game.state.sendWsAction({
      type: 'action',
      action: 'option',
      target: 'setSpawn'
    });
  }

  dispose() {
    this.element.setAttribute('hidden', 'hidden');
    this.closeDialog();
    this.closeDropdownMenu();
    this.closeLog();
    this.closeEquipment();
    this.closeSettings();

    this.logoutButton.removeEventListener('click', this.onClickLogout);
    this.fullscreenButton.removeEventListener('click', Options.toggleFullscreen);
    this.zoomInButton.removeEventListener('click', this.onZoomIn);
    this.zoomOutButton.removeEventListener('click', this.onZoomOut);
    this.audioButton.removeEventListener('click', this._onToggleAudio);
    this.logButton.removeEventListener('click', this._onToggleLog);
    this.logElement.querySelector('button[name="close-x"]').removeEventListener('click', this.closeLog);
    this.equipmentButton.removeEventListener('click', this._onToggleEquipment);
    this.equipmentElement.querySelector('button[name="close-x"]').removeEventListener('click', this.closeEquipment);
    this.settingsButton.removeEventListener('click', this._onToggleSettings);
    this.settingsElement.querySelector('button[name="close-x"]').removeEventListener('click', this.closeSettings);
    this.settingsVolumeSlider.removeEventListener('input', Options.changeVolume);
    this.settingsDistanceSlider.removeEventListener('input', this._onChangeDistance);
    this.dialogElement.querySelector('button[name="close-x"]').removeEventListener('click', this.closeDialog);
    this.dialogCloseButton.removeEventListener('click', this.closeDialog);
    this.reconstructorElement.querySelector('button[name="close-x"]').removeEventListener('click', this.closeReconstructor);

    this.element.removeEventListener('mousedown', this.onClick);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('touchstart', this.onTouchStart);
    this.element.removeEventListener('touchend', this.onTouchEnd);
    this.element.removeEventListener('wheel', this.onWheel);
  }
}
