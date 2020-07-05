const FS = require('fs');
const Path = require('path');

class ItemManager {
  static init() {
    this._items = [];
    this._loadItems();
  }

  static _loadItems() {
    let itemsJson = JSON.parse(FS.readFileSync(Path.join(__dirname, '../resources/items.json')));

    itemsJson.forEach(item => {
      if (item.baseType === "weapon") {
        this._items.push(new Weapon(
          item.type,
          item.baseType,
          item.name,
          item.damage,
          item.speed,
          item.range,
          item.skill
        ));
      }
      else if (item.baseType === "ammo") {
        this._items.push(new Ammo(
          item.type,
          item.baseType,
          item.name,
          item.damage
        ));
      }
      else if (item.baseType === "armor") {
        this._items.push(new Armor(
          item.type,
          item.baseType,
          item.name,
          item.defence
        ));
      }
    });
  }

  static getByType(type) {
    return this._items.find(item => item.type === type);
  }
}

class Equipment {
  constructor(ownerEntity, equipmentData) {
    this._ownerEntity = ownerEntity;
    this._armor = null;
    this._weapon = ItemManager.getByType('unarmed');
    this._ammo = null;
    this._inventory = [];

    if (equipmentData) {
      if (equipmentData.armor) {
        this._armor = ItemManager.getByType(equipmentData.armor);
      }
      if (equipmentData.weapon) {
        this._weapon = ItemManager.getByType(equipmentData.weapon);
      }
      if (equipmentData.ammo) {
        this._ammo = ItemManager.getByType(equipmentData.ammo);
      }
      if (equipmentData.inventory && equipmentData.inventory.length) {
        equipmentData.inventory.forEach(itemType => {
          this._inventory.push(ItemManager.getByType(itemType));
        });
      }
    }
  }

  get armor() {
    return this._armor;
  }

  get weapon() {
    return this._weapon;
  }

  hasItemInInventory(itemType, count = 1) {
    return this._inventory.some(item => item.type === itemType);
  }

  removeFromInventory(itemType) {
    for (let i = 0; i < this._inventory.length; i++) {
      if (this._inventory[i].type === itemType) {
        this._inventory.splice(i, 1);
        return;
      }
    }
  }

  addToInventory(itemType) {
    const item = ItemManager.getByType(itemType);
    this._inventory.push(item);
  }
  
  equip(itemType) {
    if (!this.hasItemInInventory(itemType)) {
      return false;
    }
    const item = ItemManager.getByType(itemType);
    
    if (item.baseType === 'armor') {
      if (this._armor) {
        this.unequip(this._armor.type);
      }
      this._armor = item;
    }
    else if (item.baseType === 'weapon') {
      if (this._weapon) {
        this.unequip(this._weapon.type);
      }
      this._weapon = item;
    }
    else if (item.baseType === 'ammo') {
      if (this._ammo) {
        this.unequip(this._ammo.type);
      }
      this._ammo = item;
    }
    else {
      return false;
    }

    this.removeFromInventory(item.type);
    return true;
  }

  unequip(itemType) {
    const item = ItemManager.getByType(itemType);
    if (!item) {
      return false;
    }

    if (item.baseType === 'armor' && this._armor.type === itemType) {
      this._armor = null;
    }
    else if (item.baseType === 'weapon' && this._weapon.type === itemType) {
      this._weapon = ItemManager.getByType('unarmed');
    }
    else if (item.baseType === 'ammo' && this._ammo.type === itemType) {
      this._ammo = null;
    }
    else {
      return false;
    }

    if (item.type !== 'unarmed') {
      this.addToInventory(item.type);
    }
    return true;
  }

  use(itemType) {

  }

  dispose() {
    this._ownerEntity = null;
    this._armor = null;
    this._weapon = null;
    this._ammo = null;
    this._inventory = [];
  }

  toJSON() {
    return {
      armor: this._armor,
      weapon: this._weapon,
      ammo: this._ammo,
      inventory: this._inventory
    };
  }
}

class Item {
  constructor(type, baseType, name, stackable = false) {
    this._type = type;
    this._baseType = baseType;
    this._name = name;
    this._stackable = stackable;
  }

  get type() {
    return this._type;
  }

  get baseType() {
    return this._baseType;
  }

  get name() {
    return this._name;
  }

  get stackable() {
    return this._stackable;
  }

  toJSON() {
    return {
      type: this._type,
      baseType: this._baseType,
      name: this._name
    };
  }
}

class Weapon extends Item {
  constructor(type, baseType, name, damage, speed, range, skill) {
    super(type, baseType, name);
    this._damage = damage;
    this._speed = speed;
    this._range = range;
    this._skill = skill;
  }

  get damage() {
    return this._damage;
  }

  get speed() {
    return this._speed;
  }

  get range() {
    return this._range;
  }

  get skill() {
    return this._skill;
  }

  toJSON() {
    return {
      type: this._type,
      baseType: this._baseType,
      name: this._name,
      info: `Damage ${this._damage}<br>Speed ${this._speed}<br>Range ${this._range}`
    };
  }
}

class Ammo extends Item {
  constructor(type, baseType, name, damage) {
    super(type, baseType, name, true);
    this._damage = damage;
  }

  toJSON() {
    return {
      type: this._type,
      baseType: this._baseType,
      name: this._name,
      info: `Damage ${this._damage}`
    };
  }
}

class Armor extends Item {
  constructor(type, baseType, name, defence) {
    super(type, baseType, name);
    this._defence = defence;
  }

  get defence() {
    return this._defence;
  }

  toJSON() {
    return {
      type: this._type,
      baseType: this._baseType,
      name: this._name,
      info: `Defence ${this._defence}`
    };
  }
}

module.exports = {
  ItemManager,
  Equipment,
  Item
};
