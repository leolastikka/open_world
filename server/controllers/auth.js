const _ = require('lodash');
const uuidv4 = require('uuid/v4'); // random

// const dummy_users = [
//   {id:1, username:'user1', password:'pw1', token:null},
//   {id:2, username:'user2', password:'pw2', token:null},
//   {id:3, username:'asd', password:'asd', token:null},
//   {id:4, username:'qwe', password:'qwe', token:null}
// ];

let users = [];
let userId = 0;

module.exports = function(db) {
  let exports = {};

  exports.login = function(req, res) {
    let response = {
      success: 0
    };
  
    let username = req.body.username;
    let password = req.body.password;
  
    if (username && password) {
      //let user = _.find(dummy_users, {'username': username, 'password': password});
      let user = {id: userId++, username: username, token: null};
      if (user){
        let token = uuidv4();
        user.token = token;
        response = {
          success: 1,
          id: user.id,
          token: token
        };
        users.push(user);
      }
    }
  
    res.send(JSON.stringify(response));
  };
  
  exports.authenticateWebSocket = function(ws, data) {
    //let user = _.find(dummy_users, {token: data.token});
    let user = _.find(users, {token: data.token});
    if (user) {
      user.token = null;
      user.ws = ws;
    }

    return user;
  };

  exports.removeUser = function(user) {
    users = users.filter(u => u.id !== user.id);
  }

  return exports;
};
