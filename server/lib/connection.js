const _ = require('lodash');
const WebSocket = require('ws');

class ConnectionManager {
  static init(db, game, wss, authController) {
    this._game = game;
    this._wss = wss;
    this._authController = authController;

    this.onConnection = this.onConnection.bind(this);
  }

  static onConnection(ws, req) {
    let connection = new Connection(ws, this._game);

    ws.on('message', connection.onMessage);
    ws.on('close', connection.onClose);

    ws.on('error', (e) => {
      console.log('error: ', e);
    });
  }

  static sendToUser(userId, data) {
    let user = this._game.users.find(u => u.id === userId);
    user.ws.send(JSON.stringify(data));
  }
  
  static broadcast(data) {
    ConnectionManager._wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  static broadcastToOthers(ws, data) {
    ConnectionManager._wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  static logUserCount() {
    console.log(`Logged users: ${this._wss.clients.size}`);
  }
}

class Connection {
  constructor(ws, game) {
    this._ws = ws;
    this._game = game;
    this._user = null;
    this.playerObject = null;
  }

  get user() {
    return this._user;
  }

  send(data) {
    if (this._ws) {
      this._ws.send(JSON.stringify(data));
    }
  }

  onMessage = (msg) => {
    let data = null;

    try {
      data = JSON.parse(msg);
    } catch (ex) {
      console.log(ex);
      this._ws.close();
      return;
    };

    if (!this._ws.isAuthenticated) {
      let authenticatedUser = ConnectionManager._authController.authenticateWebSocket(this._ws, data);
      if (authenticatedUser) {
        this._user = authenticatedUser;
        this._game.onConnectedUser(this);

        this._ws.isAuthenticated = true;
        this._ws.send(JSON.stringify({success:1}));
      }
      else {
        this._ws.close();
      }
    }
    else {
      switch(data.type) {
        case 'ready':
          this._game.onReady(this._user);
          break;
        case 'action':
          this._game.onAction(this._user, data);
          break;
        default:
          this._ws.close();
      }
    }
  }

  onClose = (event) => {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }

    if (this._user) {
      this._user.area.removeConnection(this);
      this._game.onDisconnectedUser(this._user);
      ConnectionManager._authController.removeUser(this._user); // temporary

      if (this._user.character) {
        this._user.character.dispose();
        this._user.character = null;
      }
      this._user = null;
    }

    this._game = null;
  }
}

module.exports = {
  Connection,
  ConnectionManager
};
