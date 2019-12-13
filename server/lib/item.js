class Inventory
{
  constructor(size)
  {
    this.size = size;
    this.items = [];
  }
}

class Equipment
{
  constructor()
  {
    this.armor = null;
    this.weapon = null;
  }
}

class Item
{
  static get Type()
  {
    return {
      Weapon: 0
    };
  }

  constructor(id, name, type)
  {
    this.id = id;
    this.name = name;
    this.type = type;
  }
}

module.exports.Inventory = Inventory;
module.exports.Item = Item;
