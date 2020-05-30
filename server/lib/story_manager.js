const FS = require('fs');
const Path = require('path');

class StoryManager {
  static init() {
    this._loadMessages();
    this._loadQuests();
    // read dialogs
  }
  static _loadMessages() {
    const messagesFile = FS.readFileSync(Path.join(__dirname, '../resources/messages.json'));
    this._messages = JSON.parse(messagesFile);
    this._messages.forEach(message => Object.freeze(message));
  }
  static _loadQuests() {
    const questsFile = FS.readFileSync(Path.join(__dirname, '../resources/quests.json'));
    this._quests = JSON.parse(questsFile);
    this._quests.forEach(quest => Object.freeze(quest));
  }

  static get messages() {
    return this._messages;
  }

  static get quests() {
    return this._quests;
  }

  static getDialogFor(npc, playerProgress) {

  }
}

module.exports = StoryManager;
