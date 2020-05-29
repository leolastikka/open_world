const StoryManager = require('./story_manager');

class ProgressCondition {
  constructor(progressItem, condition, done = false) {
    this._progressItem = progressItem;
    this._type = condition.type;
    this._value = condition.value;
    this._text = condition.text;
    if (!done) {
      this._progressItem.eventEmitter.addListener(this._type, this._onEvent);
    }
    this._done = done;
  }

  _onEvent = (value) => {
    if (value === this._value) {
      this._done = true;
      this._progressItem.passCondition(this);
    }
  }

  dispose() {
    this._progressItem.eventEmitter.removeListener(this._type, this._onEvent);
    this._progressItem = null;
  }

  toJSON() {
    return {
      text: this._text,
      done: this._done
    }; 
  }
}

class ProgressItem {
  constructor(user, data) {
    this._user = user;
    this._key = data.key;
    this._title = data.title;
    this._text = data.text;
    this._conditions = [];
    data.conditions.forEach(cond => {
      this._conditions.push(new ProgressCondition(this, cond));
    });
  }

  get eventEmitter() {
    return this._user;
  }

  passCondition(progressCondition) {
    this._conditions = this._conditions.filter(cond => cond != progressCondition);
    progressCondition.dispose();

    if (this._conditions.length === 0) {
      this._onConditionsPassed();
    }
  }

  _onConditionsPassed() {}

  dispose() {
    this._user = null;
  }
}

class Quest extends ProgressItem {
  constructor(user, data) {
    super (user, data);
  }

  toJSON() {
    return {
      type: 'quest',
      title: this._title,
      text: this._text,
      conditions: this._conditions
    };
  }
}

class Message extends ProgressItem {
  constructor(user, data) {
    super(user, data);
    this._shown = false;
  }

  get shown() {
    return this._shown;
  }

  _onConditionsPassed() {
    this._user.connection.send({
      type: 'dialog',
      title: this._title,
      text: this._text
    });
    this._shown = true;

    this._user.connection.send({
      type: 'logUpdate',
      item: this
    });
  }

  toJSON() {
    return {
      type: 'message',
      key: this._key,
      title: this._title,
      text: this._text
    };
  }
}

class ProgressManager {
  constructor(user, progress) {
    this._user = user;

    this._messages = [];
    StoryManager.messages.forEach(msgData => {
      this._messages.push(new Message(user, msgData));
    });

    this._quests = [];
  }

  get quests() {
    return this._quests;
  }

  get messages() {
    return this._messages.filter(msg => msg.shown);
  }

  dispose() {
    this._user = null;
  }
}

module.exports = ProgressManager;
