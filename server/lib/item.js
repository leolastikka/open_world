class ItemManager {
  static init() {
    this._items = [];
    this._loadItems();
  }

  static _loadItems() {
    let itemsJson = JSON.parse(FS.readFileSync(Path.join(__dirname, '../resources/items_test.json')));

    itemsJson.forEach(item => {
      if (item.type === "weapon") {
        this._items.push(new Weapon(
          item.id,
          item.name,
          item.damage,
          item.speed,
          item.range
        ));
      }
      else if (item.type === "ammo") {
        this._items.push(new Ammo(
          item.id,
          item.name,
          item.damage
        ));
      }
      else if (item.type === "armor") {
        this._items.push(new Armor(
          item.id,
          item.name,
          item.defence
        ));
      }
    });
  }

  static getById(id) {
    return this._items.find(item => item._id === id);
  }

  static getByName(name) {
    return this._items.find(item => item._name === name);
  }
}

const EquipmentSlot = Object.freeze({
  Weapon: 0,
  Armor: 1
});

class Equipment {
  constructor() {
    this._armor = null;
    this._weapon = null;
    this._ammo = null;
    this._bag = null;
  }

  get damage() {
    
  }

  get attack() {

  }

  get defence() {

  }

  wield(item) {
    if (item instanceof Weapon) {
      if (this._weapon) {
        this.replace(item);
      }
      else {
        
      }
    }
    else if (item instanceof Armor) {

    }
  }

  replace(item) {
    if (item instanceof Weapon) {

    }
    else if (item instanceof Armor) {

    }
  }

  remove(equipmentSlot) { // target: inventory?
    if (equipmentSlot === EquipmentSlot.Weapon) {
      if (!this._bag.isFull) { // can move weapon to inventory

      }
    }
    else if (equipmentSlot === EquipmentSlot.Armor) {

    }
  }

  dispose() {
    this._armor = null;
    this._weapon = null;
    this._ammo = null;
    this._bag = null;
  }

  toJSON() {
    return {

    };
  }
}

class Bag {
  constructor(size) {
    this._size = size;
    this._items = [];
  }

  get isFull() {
    return this._items.length === this._size;
  }

  get size() {
    return this._size;
  }
}

class Item {
  constructor(id, name, stackable = false, count = 1) {
    this._id = id;
    this._name = name;
    this._stackable = stackable;
    this._count = count;
  }
}

class Weapon extends Item {
  constructor(id, name, damage, speed, range) {
    super(id, name);
    this._damage = damage;
    this._speed = speed;
    this._range = range;
  }

  get damage() {
    return this._damage;
  }

  get range() {
    return this._range;
  }
}

class Ammo extends Item {
  constructor(id, name, damage) {
    super(id, name, true);
    this._damage = damage;
  }
}

class Armor extends Item {
  constructor(id, name, defence) {
    super(id, name);
    this._defence = defence;
  }

  get defence() {
    return this._defence;
  }
}

module.exports.ItemManager = ItemManager;
module.exports.Item = Item;
module.exports.Equipment = Equipment;
