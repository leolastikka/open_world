class EntityManager {
  static init(game, gameState) {
    this._game = game;
    this._gameState = gameState;
    this._entities = [];
    this._upperEntities = []; // characters and walls
    this._lowerEntities = []; // floors
    this._entityRemoved = false;
  }

  static update() {
    this._entities.forEach(ent => {
      ent.update(this._game);
    });

    // delete removed entities if needed
    if (this._entityRemoved) {
      this._entities = this._entities.filter(ent => {
        if (!ent._removed) {
          return true;
        }
        if (ent instanceof Character || ent instanceof WallTile) {
          this._upperEntities = this._upperEntities.filter(e => e != ent);
        }
        else {
          this._lowerEntities = this._lowerEntities.filter(e => e != ent);
        }
        ent.dispose();
        return false;
      });
      this._entityRemoved = false;
    }

    // sort entities that may have changed position
    this._sort(this._upperEntities);
  }

  static render(gameState) {
    this._lowerEntities.forEach(ent => {
      ent.render(this._game.display);
    });
    this._upperEntities.forEach(ent => {
      ent.render(this._game.display);
    });

    this._entities.forEach(ent => {
      ent.renderGUI(this._game.display);
    });

    const pointerUnitData = gameState.gui.pointerUnitData;
    if (pointerUnitData.pos) {
      let hoverPos = Vector2.clone(pointerUnitData.pos);
      hoverPos.add(new Vector2(2, 2)); // counterfix for screenToUnitPos
      hoverPos = this._game.display.getRenderPos(hoverPos);
      const ctx = this._game.display.context;
      ctx.strokeStyle = pointerUnitData.hasActions ? 'greenyellow' : 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        hoverPos.x,
        hoverPos.y + ResourceManager.tileHeight * this._game.display.zoomLevel * 0.5
        );
      ctx.lineTo(
        hoverPos.x + ResourceManager.tileWidth * this._game.display.zoomLevel * 0.5,
        hoverPos.y
        );
      ctx.lineTo(
        hoverPos.x + ResourceManager.tileWidth * this._game.display.zoomLevel,
        hoverPos.y + ResourceManager.tileHeight * this._game.display.zoomLevel * 0.5
        );
      ctx.lineTo(
        hoverPos.x + ResourceManager.tileWidth * this._game.display.zoomLevel * 0.5,
        hoverPos.y + ResourceManager.tileHeight * this._game.display.zoomLevel
        );
      ctx.closePath();
      ctx.stroke();
    }
  }

  static _add(entity) {
    this._entities.push(entity);
    if (entity instanceof Character || entity instanceof WallTile) {
      this._upperEntities.push(entity);
    }
    else {
      this._lowerEntities.push(entity);
    }
  }

  static createArea(data) {
    const floor = data.floor;
    const walls = data.walls;
    const walkable = data.walkable;
    for (let i = 0; i < floor.length; i++) {
      for (let j = 0; j < floor[i].length; j++) {
        let pos = new Vector2(j, i);
        this.createTile(pos, floor[i][j], walkable[i][j]);
        this.createTile(pos, walls[i][j], false);
      }
    }
    
    let objNetworkIds = [];
    data.entities.forEach(obj => objNetworkIds.push(obj.networkId));

    for(let i = 0; i < data.entities.length; i++) {
      let ent = data.entities[i];
      let created = null;
      switch(ent.baseType) {
        case 'player':
          created = this.createPlayer(ent);
          break;
        case 'npc':
          created = this.createNPC(ent);
          break;
        case 'enemy':
          created = this.createEnemy(ent);
          break;
        case 'container':
          created = this.createContainer(ent);
          break;
        case 'link':
          created = this.createLink(ent);
          break;
        case 'reconstructor':
          created = this.createReconstructor(ent);
          break;
      }

      if(created && ent.path) { // if object is moving
        this._gameState.onMove({
          networkId: ent.networkId,
          speed: ent.speed,
          pos: ent.pos,
          path: ent.path
        });
      }
    }

    // sort everything
    this._sort(this._lowerEntities);
    this._sort(this._upperEntities);
  }

  static createTile(pos, type, isWalkable) {
    if (ResourceManager.floorTiles.includes(type)) {
      const renderer = new SpriteRenderer(
        RenderLayer.Floor,
        ResourceManager.texture,
        ResourceManager.getSpriteRectByIndex(type)
        );
      this._add(new Tile(null, pos, renderer, isWalkable));
    }
    else if (ResourceManager.wallsTiles.includes(type)) {
      const renderer = new SpriteRenderer(
        RenderLayer.Walls,
        ResourceManager.texture,
        ResourceManager.getSpriteRectByIndex(type)
        );
      this._add(new WallTile(null, pos, renderer, isWalkable));
    }
  }

  static createPlayer(data) {
    const pos = Vector2.fromObject(data.pos);
    const armorType = data.equipment.armor ? data.equipment.armor.type : 'none'; 
    const renderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType(armorType)
      );
    const player = new Character(data.networkId, pos, renderer, data.name, data.actions);
    this._add(player);
    return player;
  }

  static createNPC(data) {
    const pos = Vector2.fromObject(data.pos);
    const armorType = data.equipment.armor ? data.equipment.armor.type : 'none'; 
    const renderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType(armorType)
      );
    const npc = new Character(data.networkId, pos, renderer, data.name, data.actions);
    this._add(npc, false);
    return npc;
  }

  static createLink(data) {
    const pos = Vector2.fromObject(data.pos);
    const renderer = new SpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getSpriteRectByIndex(ResourceManager.greenGlowTile)
      );
    this._add(new AreaLink(data.networkId, pos, renderer, data.name, data.actions));
  }

  static createReconstructor(data) {
    const pos = Vector2.fromObject(data.pos);
    const renderer = new SpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getSpriteRectByIndex(ResourceManager.blueGlowTile)
      );
    this._add(new Reconstructor(data.networkId, pos, renderer, data.name, data.actions));
  }

  static createEnemy(data) {
    const pos = new Vector2(data.pos.x, data.pos.y);
    const renderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType('none_enemy')
      );
    let enemy = new Character(data.networkId, pos, renderer, data.name, data.actions);
    this._add(enemy, false);
    return enemy;
  }

  // static createContainer(data) {
  //   let pos = new Vector2(data.pos.x, data.pos.y);
  //   let container = new Container(data.networkId, pos, new TileBoxRenderer('#706d40'), data.name, data.actions);
  //   this._add(container, false);
  //   return container;
  // }

  // static createInteractable(data) {
  //   let pos = new Vector2(data.pos.x, data.pos.y);
  //   let interactable = new Interactable(data.networkId, pos, new TileBoxRenderer('#16e700'), data.name, data.actions);
  //   this._add(interactable, false);
  //   return interactable;
  // }

  static getByNetworkId(networkId) {
    return this._entities.find(ent => ent.networkId === networkId);
  }

  static getEntitiesNearPosition(pos, range) {
    return this._entities.filter(ent => {
      return ent.pos.isInRange(pos, range);
    });
  }

  static _sort(entityList) {
    entityList.sort((a, b) => {
      const layer = a.renderer.layer - b.renderer.layer;
      if (layer != 0) {
        return layer;
      }
      const posA = Vector2.clone(a.pos);
      const posB = Vector2.clone(b.pos);
      if (a instanceof Tile && b instanceof Character && posA.x <= posB.x && posA.y >= posB.y) {
        posA.add(new Vector2(-0.5, -0.5));
      }
      else if (b instanceof Tile && a instanceof Character && posB.x <= posA.x && posB.y >= posA.y) {
        posB.add(new Vector2(-0.5, -0.5));
      }
      const y = posA.y - posB.y;
      if (y != 0) {
        return y;
      }
      return posA.x - posB.x;
    });
  }

  static dispose() {
    this._entities.forEach(ent => ent.dispose());
    this._entities = [];

    this._game = null;
    this._gameState = null;
  }
}