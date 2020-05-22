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
    this.gui.setLastAction(event.action.text);
  }

  sendWsAction(data) {
    this.game.connection.ws.send(JSON.stringify(data));
  }

  onWsMessage(msg) {
    let data = JSON.parse(msg.data);
    switch(data.type){
      case 'player':
        this.onPlayer(data);
        break;
      case 'mapData':
        this.onAreaData(data);
        break;
      case 'status':
        this.onStatus(data);
        break;
      case 'add':
        this.onAdd(data);
        break;
      case 'remove':
        this.onRemove(data);
        break;
      case 'move':
        this.onMove(data);
        break;
      case 'dialog':
        this.onDialog(data);
        break;
      case 'changeArea':
        this.onChangeArea();
        break;
    }
  }

  onAreaData(data) {
    EntityManager.createArea(data);
    ResourceManager.playMusic(data.music);
  }

  onStatus(data) {
    let go = EntityManager.getByNetworkId(data.networkId);
    go._inCombat = data.inCombat;
    if (data.hp) {
      go._hp = data.hp;
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
    this.gui.openDialog(data.text);
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