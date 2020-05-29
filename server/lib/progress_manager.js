const StoryManager = require('./story_manager');

class ProgressCondition {
  constructor(progressItem, condition) {
    this._progressItem = progressItem;
    this._type = condition.type;
    this._value = condition.value;
    this._progressItem.eventEmitter.addListener(this._type, this._onEvent);
  }

  _onEvent = (value) => {
    if (value === this._value) {
      this._progressItem.passCondition(this);
    }
  }

  dispose() {
    this._progressItem.eventEmitter.removeListener(this._type, this._onEvent);
    this._progressItem = null;
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

  _onConditionsPassed() {

  }

  dispose() {
    this._user = null;
  }
}

class Quest extends ProgressItem {
  constructor(user, data) {
    super (user, data);
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

    // user.connection.send({
    //   type: 'logUpdate/message',
    //   value: 'key'
    // });
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

  get shownMessages() {
    return this._messages.filter(msg => msg.shown);
  }

  dispose() {
    this._user = null;
  }
}

module.exports = ProgressManager;
