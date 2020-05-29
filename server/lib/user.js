const EventEmitter = require('events');
const ProgressManager = require('./progress_manager');

class User extends EventEmitter {
  constructor(id, username) {
    super();
    this._id = id;
    this._username = username;

    this.connection = null;
    this.token = null;

    this.area = null;
    this.character = null;

    this._progressManager = new ProgressManager(this);
  }

  get id() {
    return this._id;
  }

  get username() {
    return this._username;
  }

  get progressManager() {
    return this._progressManager;
  }

  dispose() {
    this._progressManager.dispose();
    this._connection = null;
  }
}

module.exports = User;
