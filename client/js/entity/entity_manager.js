class EntityManager {
  static init() {
    this._entities = [];
    this._entityRemoved = false;
  }

  static update(game) {
    this._entities.forEach(ent => {
      ent.update(game);
    });

    // delete removed entities if needed
    if (this._entityRemoved) {
      this._entities  = this._entities.filter(ent => {
        if (!ent._removed) {
          return true;
        }
        ent.dispose();
        return false;
      });
    }
  }

  static render(context, display) {
    this._entities.forEach(ent => {
      ent.render(context, display);
    });

    
    this._entities.forEach(ent => {
      ent.renderGUI(context, display);
    });
  }

  static _add(entity) {
    if (entity instanceof Tile) {
      this._entities.unshift(entity);
    }
    else {
      this._entities.push(entity);
    }
  }

  static createTile(pos, type, isWalkable) {
    switch(type) {
      case 2: // walkable rock
        this._add(new Tile(null, pos, new TileRenderer('#2e2e2e', 'black'), isWalkable));
        break;
      case 3: // walkable dirt
        this._add(new Tile(null, pos, new TileRenderer('#383727', 'black'), isWalkable));
        break;
      case 4: // walkable grass
        this._add(new Tile(null, pos, new TileRenderer('#0e3612', 'black'), isWalkable));
        break;
      case 5: // water
        this._add(new Tile(null, pos, new TileRenderer('#0e8eb8', 'white'), isWalkable));
        break;
      case 6: // stone wall
        this._add(new Tile(null, pos, new TileRenderer('#8e8e8e', 'white'), isWalkable));
        break;
      case 7: // stone object
        this._add(new Tile(null, pos, new TileTriangleRenderer('#8e8e8e'), isWalkable));
        break;
      case 8: // tree object
        this._add(new Tile(null, pos, new TileTriangleRenderer('#1a5f20'), isWalkable));
        break;
    }
  }

  static createPlayer(data) {
    let pos = new Vector2(data.pos.x, data.pos.y);
    let player = new Character(data.networkId, pos, new CharacterRenderer('white'), data.name, data.actions);
    this._add(player);
    return player;
  }

  static createNPC(data) {
    let pos = new Vector2(data.pos.x, data.pos.y);
    let npc = new Character(data.networkId, pos, new CharacterRenderer('yellow'), data.name, data.actions);
    this._add(npc, false);
    return npc;
  }

  static createEnemy(data) {
    let pos = new Vector2(data.pos.x, data.pos.y);
    let enemy = new Character(data.networkId, pos, new CharacterRenderer('red'), data.name, data.actions);
    this._add(enemy, false);
    return enemy;
  }

  static createContainer(data) {
    let pos = new Vector2(data.pos.x, data.pos.y);
    let container = new Container(data.networkId, pos, new TileBoxRenderer('#706d40'), data.name, data.actions);
    this._add(container, false);
    return container;
  }

  static createInteractable(data) {
    let pos = new Vector2(data.pos.x, data.pos.y);
    let interactable = new Interactable(data.networkId, pos, new TileBoxRenderer('#16e700'), data.name, data.actions);
    this._add(interactable, false);
    return interactable;
  }

  static getByNetworkId(networkId) {
    return this._entities.find(ent => ent.networkId === networkId);
  }

  static getEntitiesNearPosition(pos, range) {
    return this._entities.filter(ent => {
      return ent.pos.isInRange(pos, range);
    });
  }

  static dispose() {
    this._entities.forEach(ent => ent.dispose());
    this._entities = [];
  }
}