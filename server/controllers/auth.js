const uuidv4 = require('uuid/v4'); // random
const User = require('../lib/user');

let users = [];
let userId = 0;

module.exports = function(db) {
  let exports = {};

  exports.login = function(req, res) {
    let response = {
      success: 0
    };
  
    const username = req.body.username;
    const password = req.body.password;
  
    if (username && password) {
      const user = new User(userId++, username);
      const token = uuidv4();
      user.token = token;
      response = {
        success: 1,
        id: user.id,
        token: token
      };
      users.push(user);
    }
  
    res.send(JSON.stringify(response));
  };
  
  exports.authenticateWebSocket = function(connection, data) {
    if (!data.token) {
      return null;
    }
    const user = users.find(u => u.token === data.token);
    if (user) {
      user.token = null;
      user.connection = connection;
    }
    return user;
  };

  exports.removeUser = function(user) {
    users = users.filter(u => u.id !== user.id);
  }

  return exports;
};
