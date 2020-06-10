class GameState extends State {
  constructor(game, logoutCallback) {
    super();
    this.onClick = this.onClick.bind(this);
    this.onAction = this.onAction.bind(this);
    this.onWsMessage = this.onWsMessage.bind(this);
    this.onWsClose = this.onWsClose.bind(this);
    this.onWsError = this.onWsError.bind(this);
    this.onLogout = this.onLogout.bind(this);

    Time.init();
    EntityManager.init(game, this);

    this.game = game;
    this.logoutCallback = logoutCallback;
    this.isLoading = true;

    this.playerEntity = null;
    this.log = {
      messages: [],
      quests: []
    };
    this.equipment = {
      armor: null,
      weapon: null,
      ammo: null,
      inventory: []
    };

    this.loadingElement = document.getElementById('loading');
    this.loadingElement.removeAttribute('hidden');

    this.gui = new GUI(this.game);

    this.game.connection.ws.onmessage = this.onWsMessage;
    this.game.connection.ws.onclose = this.onWsClose;
    this.game.connection.ws.onerror = this.onWsClose;

    this.gui.addEventListener('logout', this.onLogout);
    this.gui.addEventListener('click', this.onClick);
    this.gui.addEventListener('action', this.onAction);

    this.game.connection.ws.send(JSON.stringify({type:'ready'}));
  }

  update() {
    EntityManager.update();
  }

  render() {
    EntityManager.render(this);
  }

  onClick(event) {
    let unitPos = event.unitPos;

    let actions = [];
    let clickedEntities = EntityManager.getEntitiesNearPosition(unitPos, 1);
    clickedEntities.forEach(ent => {
      actions.unshift.apply(actions, ent.actions);
    });

    if (actions.length !== 0) {
      let e = new Event('action');
      e.action = actions[0];
      this.onAction(e);
    }

    this.gui.pointerUnitData = {
      pos: unitPos,
      hasActions: actions.length !== 0
    };
  }

  onAction(event) {
    let action = event.action;

    if (action instanceof WalkAction) {
      this.sendWsAction({
        type: 'action',
        action: 'move',
        target: action.unitPos
      });
    }
    else if (action instanceof TalkAction) {
      this.sendWsAction({
        type: 'action',
        action: 'talk',
        target: action.networkId
      });
    }
    else if (action instanceof AttackAction) {
      this.sendWsAction({
        type: 'action',
        action: 'attack',
        target: action.networkId
      });
    }
    else if (action instanceof AreaLinkAction) {
      this.sendWsAction({
        type: 'action',
        action: 'link',
        target: action.networkId
      });
    }
    else if (action instanceof ConfigureAction) {
      this.sendWsAction({
        type: 'action',
        action: 'configure',
        target: action.networkId
      });
    }
    this.gui.setLastAction(event.action.text);
  }

  sendWsAction(data) {
    if (this.game.connection.ws) {
      this.game.connection.ws.send(JSON.stringify(data));
    }
  }

  onWsMessage(msg) {
    let data = JSON.parse(msg.data);
    switch(data.type){
      case 'move':
        this.onMove(data);
        break;
      case 'update':
        this.onEntityUpdate(data);
        break;
      case 'add':
        this.onAdd(data);
        break;
      case 'remove':
        this.onRemove(data);
        break;
      case 'dialog':
        this.onDialog(data);
        break;
      case 'player':
        this.onPlayer(data);
        break;
      case 'areaData':
        this.onAreaData(data);
        break;
      case 'logData':
        this.onLogData(data);
        break;
      case 'logUpdate':
        this.onLogUpdate(data);
        break;
      case 'equipment':
        this.onEquipment(data);
        break;
      case 'changeArea':
        this.onChangeArea();
        break;
      case 'reconstructor':
        this.onReconstructor(data);
        break;
      case 'option':
        console.log(data);
        break;
    }
  }

  onAreaData(data) {
    EntityManager.createArea(data);
    ResourceManager.playMusic(data.music);
  }

  onEntityUpdate(data) {
    let entity = EntityManager.getByNetworkId(data.networkId);
    // entity._inCombat = data.inCombat;
    // if (data.hp) {
    //   entity._hp = data.hp;
    // }
    if (data.armorType) {
      entity.changeRenderer(data.armorType);
    }
    if (data.speed) {
      entity.speed = data.speed;
    }
  }

  onPlayer(data) {
    let player = EntityManager.getByNetworkId(data.entity.networkId);
    player.isOwned = true;
    this.playerEntity = player;

    this.loadingElement.setAttribute('hidden', 'hidden');
    this.gui.show();
  }

  onMove(data) {
    let ent = EntityManager.getByNetworkId(data.networkId);
    if (!ent) { // ignore moving not existing entities temporarily here
      return;
    }
    ent.speed = data.speed;
    ent.pos = Vector2.fromObject(data.pos);
    
    let path = [];
    data.path.forEach(point => {
      path.push(Vector2.fromObject(point));
    });
    ent.setPath(path);
  }

  onAdd(data) {
    switch(data.entity.baseType) {
      case 'player':
        EntityManager.createPlayer(data.entity);
        break;
      case 'npc':
        EntityManager.createNPC(data.entity);
        break;
      case 'enemy':
        EntityManager.createEnemy(data.entity);
        break;
    }
  }

  onRemove(data) {
    let ent = EntityManager.getByNetworkId(data.networkId);

    if (ent === this.playerEntity) {
      this.loadingElement.removeAttribute('hidden');
      this.gui.hide();

      this.playerEntity = null;
    }

    ent.dispose();
  }

  onDialog(data) {
    this.gui.openDialog(data.title, data.text);
  }
  closeDialog() {
    this.sendWsAction({
      type: 'action',
      action: 'close',
      target: 'dialog'
    });
  }

  onChangeArea() {
    this.loadingElement.removeAttribute('hidden');
    this.gui.hide();
    this.gui.closeDialog();
    this.gui.closeDropdownMenu();
    EntityManager.dispose();
    EntityManager.init(this.game, this);
    this.game.connection.ws.send(JSON.stringify({type:'ready'}));
  }

  onLogData(data) {
    if (data.messages) {
      this.log.messages = data.messages;
    }
    if (data.quests) {
      this.log.quests = data.quests;
    }
    this.gui.updateLog();
  }

  onLogUpdate(data) {
    if (data.item.type === 'message') {
      this.log.messages.push(data.item);
    }
    else if (data.item.type === 'quest') {
      this.log.quests = this.log.quests.filter(q => q.key !== data.item.key);
      this.log.quests.unshift(data.item);
    }
    this.gui.updateLog();
    this.gui.flashLog();
  }

  onEquipment(data) {
    this.equipment = data.equipment;
    this.gui.updateEquipment(data.equipment);
  }
  equipItem(itemType) {
    this.sendWsAction({
      type: 'action',
      action: 'equipment',
      actionType: 'equip',
      itemType: itemType
    });
  }
  unequipItem(itemType) {
    this.sendWsAction({
      type: 'action',
      action: 'equipment',
      actionType: 'unequip',
      itemType: itemType
    });
  }
  useItem(itemType) {
    this.sendWsAction({
      type: 'action',
      action: 'equipment',
      actionType: 'use',
      itemType: itemType
    });
  }

  onReconstructor(data) {
    this.gui.openReconstructor(data);
  }
  closeReconstructor() {
    this.sendWsAction({
      type: 'action',
      action: 'close',
      target: 'reconstructor'
    });
  }

  onWsClose(event) {
    this.logoutCallback();
  }

  onWsError(event) {
    this.logoutCallback();
  }

  onLogout() {
    this.game.connection.closeWs();
  }

  dispose() {
    EntityManager.dispose();

    this.gui.removeEventListener('logout', this.onLogout);
    this.gui.removeEventListener('click', this.onClick);
    this.gui.removeEventListener('action', this.onAction);

    this.gui.dispose();
  }
}