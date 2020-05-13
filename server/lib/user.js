class User {
  constructor(id, username) {
    this._id = id;
    this._username = username;

    this.connection = null;
    this.token = null;

    this.area = null;
    this.character = null;

    this._spawnMessageShown = false;
    this._spawnMessage = `Hello ${username}!<br><br>` +
        'Welcome to your first reserach station.<br>' +
        'Here you will learn how to get the best out of your new mechanical body with our latest training methods and equipment.<br>' +
        'As you already know, the more you benefit our cause, the more you benefit yourself.<br>' +
        'Please follow the green line on the floor to the training area.<br><br>' +
        'Sincerely yours<br>Research Artificial Intelligence Department';
  }

  get id() {
    return this._id;
  }

  get username() {
    return this._username;
  }

  get spawnMessage() {
    if (!this._spawnMessageShown) {
      this._spawnMessageShown = true;
      return this._spawnMessage;
    }
    return null;
  }

  dispose() {
    this._connection = null;
  }
}

module.exports = User;
