const FS = require('fs');
const Path = require('path');

class StoryManager {
  static init() {
    this._loadMessages();
    // read dialogs
    // read quests
  }
  static _loadMessages() {
    const messagesFile = FS.readFileSync(Path.join(__dirname, '../resources/messages.json'));
    this._messages = JSON.parse(messagesFile);
    this._messages.forEach(message => Object.freeze(message));
  }

  static get messages() {
    return this._messages;
  }

  static get quests() {
    return [];
  }

  static getDialogFor(npc, playerProgress) {

  }
}

module.exports = StoryManager;
