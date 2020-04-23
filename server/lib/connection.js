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
    this.ws = ws;
    this.game = game;
    this.user = null;
    this.playerObject = null;
  }

  onMessage = (msg) => {
    let data = null;

    try {
      data = JSON.parse(msg);
    } catch (ex) {
      console.log(ex);
      ws.close();
      return;
    };

    if (!this.ws.isAuthenticated) {
      let authenticatedUser = ConnectionManager._authController.authenticateWebSocket(this.ws, data);
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

  onClose = (event) => {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.user) {
      this.game.onDisconnectedUser(this.user);
      ConnectionManager._authController.removeUser(this.user); // temporary

      if (this.user.character) {
        this.user.character.destroy();
        this.user.character = null;
      }
      this.user = null;
    }

    this.game = null;
  }

  respawnPlayer = () => {
    this.game.respawnPlayer(this);
  }
}

module.exports.Connection = Connection;
module.exports.ConnectionManager = ConnectionManager;
