const EventEmitter = require('events');
const Progress = require('./progress');

class User extends EventEmitter {
  constructor(id, username) {
    super();
    this._id = id;
    this._username = username;

    this.connection = null;
    this.token = null;

    this.area = null;
    this.character = null;
    this.spawnLink = null;

    this._progress = new Progress(this);
  }

  get id() {
    return this._id;
  }

  get username() {
    return this._username;
  }

  get progress() {
    return this._progress;
  }

  dispose() {
    this._progress.dispose();
    this._connection = null;
  }
}

module.exports = User;
