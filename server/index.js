const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const WebSocket = require('ws');
const Game = require('./lib/game');
const Connection = require('./lib/connection');

const port = process.env.PORT;
if (port == null || port == "") {
  port = 80;
}
const app = express();
const server = http.Server(app);
const wss = new WebSocket.Server({server: server});

const game = new Game(null, wss);
const authController = require('./controllers/auth')(null);
Connection.init(null, game, wss, authController);

app.use('/', express.static(path.join(__dirname, '../client')));

app.use(bodyParser.json());
app.post('/login', authController.login);

wss.on('connection', Connection.onConnection);

game.start(() => {
  server.listen(port, function listen() {
    console.log(`Starting server on port ${port}`);
  });
});
