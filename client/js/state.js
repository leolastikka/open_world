class State
{
  update() {};
  render() {};
  dispose() {};
}

class LoginState extends State
{
  constructor(game, onLoginCallback, message=undefined)
  {
    super();

    this.game = game;
    this.onLoginCallback = onLoginCallback;
    
    this.isLoggingIn = false;
    this.loginRequest = null;

    this.login = this.login.bind(this);
    this.cancelLogin = this.cancelLogin.bind(this);

    this.loginElement = document.getElementById('login');
    this.loginElement.removeAttribute('hidden');

    this.loginCancel = document.getElementById('loginCancel');
    this.loginCancel.setAttribute('hidden', 'hidden');

    this.loginCancelButton = this.loginCancel.querySelector('button');
    this.loginCancelButton.addEventListener('click', this.cancelLogin);

    this.loginError = document.getElementById('loginError');
    this.loginError.setAttribute('hidden', 'hidden');

    this.loginMessage = document.getElementById('loginMessage');
    if(message) {
      this.loginMessage.innerHTML = message;
      this.loginMessage.removeAttribute('hidden');
    }
    else {
      this.loginMessage.setAttribute('hidden', 'hidden');
    }

    this.loginForm = document.getElementById('loginForm');
    this.loginForm.removeAttribute('hidden');

    this.loginForm.onsubmit = () => {return false};
    this.loginForm.addEventListener('submit', this.login);
  }

  login()
  {
    if (this.isLoggingIn) {
      return false;
    }
    this.loginError.setAttribute('hidden', 'hidden');
    this.loginMessage.setAttribute('hidden', 'hidden');
    this.loginForm.setAttribute('hidden', 'hidden');
    this.loginCancel.removeAttribute('hidden');

    this.isLoggingIn = true;

    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    this.loginRequest = this.game.connection.login({
      'username': username,
      'password': password
    }, (res) => {
      if (res.success === 1)
      {
        this.succeedLogin(res);
      }
      else
      {
        this.failLogin(res);
      }
    }, (res) => {
      this.failLogin(res);
    });

    return false;
  }

  succeedLogin(response)
  {
    this.onLoginCallback();
  }

  failLogin(response)
  {
    this.loginError.removeAttribute('hidden');
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  cancelLogin()
  {
    this.loginRequest.abort();
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  dispose()
  {
    this.loginForm.removeEventListener('submit', this.login);
    this.loginCancelButton.removeEventListener('click', this.cancelLogin);
    this.loginElement.setAttribute('hidden', 'hidden');
  }
}

class ConnectState extends State
{
  constructor(game, succesCallback, failCallback)
  {
    super();

    this.game = game;
    this.succesCallback = succesCallback;
    this.failCallback = failCallback;

    this.cancelConnect = this.cancelConnect.bind(this);

    this.connectingElement = document.getElementById('connecting');
    this.connectingElement.removeAttribute('hidden');

    this.connectCancelButton = this.connectingElement.querySelector('button');
    this.connectCancelButton.addEventListener('click', this.cancelConnect);

    this.game.connection.openWs(() => {
      this.succesCallback();
    }, (message) => {
      this.failCallback(message);
    });
  }

  cancelConnect()
  {
    this.game.connection.closeWs();
    this.failCallback();
  }

  dispose()
  {
    this.connectCancelButton.removeEventListener('click', this.cancelConnect);
    this.connectingElement.setAttribute('hidden', 'hidden');
  }
}

class GameState extends State
{
  constructor(game, logoutCallback)
  {
    super();
    GameObjectManager.init();
    Time.init();

    this.game = game;
    this.logoutCallback = logoutCallback;
    this.isLoading = true;

    this.playerObject = null;

    this.mapSize = null;

    this.loadingElement = document.getElementById('loading');
    this.loadingElement.removeAttribute('hidden');

    this.gui = new GUI(this.game);

    this.onWsMessage = this.onWsMessage.bind(this);
    this.onWsClose = this.onWsClose.bind(this);
    this.onWsError = this.onWsError.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onAction = this.onAction.bind(this);

    this.game.connection.ws.onmessage = this.onWsMessage;
    this.game.connection.ws.onclose = this.onWsClose;
    this.game.connection.ws.onerror = this.onWsClose;

    this.gui.addEventListener('logout', this.onLogout);
    this.gui.addEventListener('click', this.onClick);
    this.gui.addEventListener('action', this.onAction);

    this.game.connection.ws.send(JSON.stringify({type:'ready'}));
  }

  update()
  {
    Time.update();
    GameObjectManager._gameObjects.forEach(go => {
      go.update(this.game);
    });
    GameObjectManager.deleteRemovedGameObjects();
  }

  render()
  {
    GameObjectManager._gameObjects.forEach(go => {
      go.render(this.game.display.context, this.game.display);
    });

    
    GameObjectManager._gameObjects.forEach(go => {
      go.renderGUI(this.game.display.context, this.game.display);
    });
  }

  onClick(event)
  {
    let unitPos = event.unitPos;

    let actions = [];
    let clickedObjects = GameObjectManager.getObjectsNearPosition(unitPos, 1);
    clickedObjects.forEach(go => {
      actions.unshift.apply(actions, go.getActions());
    });

    if (actions.length !== 0)
    {
      let e = new Event('action');
      e.action = actions[0];
      this.onAction(e);
    }
  }

  onAction(event)
  {
    let action = event.action;

    if (action instanceof WalkAction)
    {
      this.sendWsAction({
        type: 'action',
        action: 'move',
        target: action.unitPos
      });
    }
    else if (action instanceof TalkAction)
    {
      this.sendWsAction({
        type: 'action',
        action: 'talk',
        target: action.networkId
      });
    }
    else if (action instanceof AttackAction)
    {
      this.sendWsAction({
        type: 'action',
        action: 'attack',
        target: action.networkId
      });
    }
    this.gui.setLastAction(event.action.text);
  }

  sendWsAction(data)
  {
    this.game.connection.ws.send(JSON.stringify(data));
  }

  onWsMessage(msg)
  {
    let data = JSON.parse(msg.data);
    switch(data.type){
      case 'player':
        this.onPlayer(data);
        break;
      case 'mapData':
        this.onMapData(data);
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
    }
  }

  onMapData(data)
  {
    this.mapSize = data.tiles.length;

    let tiles = data.tiles;
    let walkable = data.walkable;
    for(let i=0; i<tiles.length; i++)
    {
      for(let j=0; j<tiles[i].length; j++){
        let pos = new Vector2(j, i);
        GameObjectManager.createTile(pos, tiles[i][j], walkable[i][j]);
      }
    }

    
    let objNetworkIds = [];
    data.objects.forEach(obj => objNetworkIds.push(obj.networkId));
    console.log('objects: ', objNetworkIds);

    let objects = data.objects;
    for(let i=0; i<objects.length; i++)
    {
      let obj = objects[i];
      let created = null;
      switch(obj.type)
      {
        case 'player':
          created = GameObjectManager.createPlayer(obj);
          break;
        case 'npc':
          created = GameObjectManager.createNPC(obj);
          break;
        case 'enemy':
          created = GameObjectManager.createEnemy(obj);
          break;
        case 'container':
          created = GameObjectManager.createContainer(obj);
          break;
        case 'interactable':
          created = GameObjectManager.createInteractable(obj);
          break;
      }

      if(created && obj.path) // if object is moving
      {
        this.onMove({
          networkId: obj.networkId,
          speed: obj.speed,
          pos: obj.decimalPos,
          path: obj.path
        });
      }
    }
  }

  onStatus(data)
  {
    console.log(`onStatus networkId: ${data.networkId}`);
    let go = GameObjectManager.getByNetworkId(data.networkId);
    go._inCombat = data.inCombat;
    if (data.hp)
    {
      go._hp = data.hp;
    }
  }

  onPlayer(data)
  {
    console.log(`onPlayer ${data.player.name} networkId: ${data.player.networkId}`);
    GameObjectManager._gameObjects.forEach(go => {
      if (go.networkId === data.player.networkId)
      {
        go._isOwned = true;
        this.playerObject = go;
      }
    });

    this.loadingElement.setAttribute('hidden', 'hidden');
    this.gui.show();
  }

  onMove(data)
  {
    console.log(`onMove networkId: ${data.networkId}`);
    let go = GameObjectManager.getByNetworkId(data.networkId);
    console.log(`- onMove object: ${go.name}`);
    go.speed = data.speed;
    go.pos = Vector2.fromObject(data.pos);
    
    let path = [];
    data.path.forEach(point => {
      path.push(Vector2.fromObject(point));
    });
    go.setPath(path);
  }

  onAdd(data)
  {
    console.log(`onAdd ${data.obj.type} ${data.obj.name} networkId: ${data.obj.networkId}`);
    switch(data.obj.type)
    {
      case 'player':
        GameObjectManager.createPlayer(data.obj);
        break;
      case 'npc':
        GameObjectManager.createNPC(data.obj);
        break;
      case 'enemy':
        GameObjectManager.createEnemy(data.obj);
        break;
    }
  }

  onRemove(data)
  {
    console.log(`onRemove networkId: ${data.networkId}`);
    let go = GameObjectManager.getByNetworkId(data.networkId);

    if (go === this.playerObject)
    {
      this.loadingElement.removeAttribute('hidden');
      this.gui.hide();

      this.playerObject = null;
    }

    go.destroy();
  }

  onDialog(data)
  {
    this.gui.openDialog(data.text);
  }

  onWsClose(event)
  {
    this.logoutCallback();
  }

  onWsError(event)
  {
    this.logoutCallback();
  }

  onLogout()
  {
    this.game.connection.closeWs();
    this.logoutCallback();
  }

  dispose()
  {
    GameObjectManager.dispose();

    this.gui.removeEventListener('logout', this.onLogout);
    this.gui.removeEventListener('click', this.onClick);
    this.gui.removeEventListener('action', this.onAction);

    this.gui.dispose();
  }
}