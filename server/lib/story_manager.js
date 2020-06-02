const FS = require('fs');
const Path = require('path');

class StoryManager {
  static init() {
    this._messages = [];
    this._quests = [];
    this._dialogs = [];

    this._loadMessages();
    this._loadQuests();
    this._loadDialogs();
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
  static _loadDialogs() {
    const dialogsFile = FS.readFileSync(Path.join(__dirname, '../resources/dialogs.json'));
    this._dialogs = JSON.parse(dialogsFile);
    this._dialogs.forEach(dialog => Object.freeze(dialog));
  }

  static get messages() {
    return this._messages;
  }

  static get quests() {
    return this._quests;
  }

  static getDialogForNpc(npcType, playerProgress) {
    const npcDialogs = this._dialogs.find(d => d.type === npcType).dialogs;
    for (let i = 0; i < npcDialogs.length; i++) {
      const d = npcDialogs[i];
      let valid = false;
      if (!d.conditions) {
        valid = true;
      }
      else {
        valid = !d.conditions.some(c => {
          return !(playerProgress.getQuestStage(c.quest) === c.stage);
        });
      }
      if (valid) {
        return d.text;
      }
    };
    throw new Error(`No default dialog found for ${npcType}`);
  }
}

module.exports = StoryManager;
