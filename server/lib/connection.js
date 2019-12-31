const _ = require('lodash');
const WebSocket = require('ws');
const GameObjectManager = require('./game_object').GameObjectManager;

class Connection
{
  static init(db, game, wss, authController)
  {
    this._game = game;
    this._wss = wss;
    this._authController = authController;

    this.onConnection = this.onConnection.bind(this);
  }

  constructor(ws, game)
  {
    this.ws = ws;
    this.game = game;
    this.user = null;
    this.playerObject = null;

    this.onMessage = this.onMessage.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  onMessage(msg)
  {
    let data = null;

    try {
      data = JSON.parse(msg);
    } catch (ex) {
      console.log(ex);
      ws.close();
      return;
    };

    if (!this.ws.isAuthenticated) {
      let authenticatedUser = Connection._authController.authenticateWebSocket(this.ws, data);
      if (authenticatedUser) {
        this.user = authenticatedUser;
        this.game.onConnectedUser(this);

        this.ws.isAuthenticated = true;
        this.ws.send(JSON.stringify({success:1}));
      }
      else {
        this.ws.close();
      }
    }
    else {
      switch(data.type) {
        case 'ready':
          this.game.onReady(this.user);
          break;
        case 'action':
          this.game.onAction(this.user, data);
          break;
        default:
          this.ws.close();
      }
    }
  }

  onClose(event)
  {
    if (this.ws)
    {
      this.ws.close();
      this.ws = null;
    }

    if (this.user)
    {
      this.game.onDisconnectedUser(this.user);
      Connection._authController.removeUser(this.user); // temporary

      if (this.user.character)
      {
        this.user.character.destroy();
        this.user.character = null;
      }
      this.user = null;
    }

    this.game = null;
  }

  respawnPlayer()
  {
    this.game.respawnPlayer(this);
  }

  static onConnection(ws, req)
  {
    let connection = new Connection(ws, this._game);

    ws.on('message', connection.onMessage);
    ws.on('close', connection.onClose);

    ws.on('error', (e) => {
      console.log('error: ', e);
    });
  }

  static sendToUser(userId, data)
  {
    let user = this._game.users.find(u => u.id === userId);
    user.ws.send(JSON.stringify(data));
  }
  
  static broadcast(data)
  {
    Connection._wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  static broadcastToOthers(ws, data)
  {
    Connection._wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  static logUserCount()
  {
    console.log(`Logged users: ${this._wss.clients.size}`);
  }
}

module.exports = Connection;
