class EntityManager {
  static init(game, gameState) {
    this._game = game;
    this._gameState = gameState;
    this._entities = [];
    this._entityRemoved = false;
  }

  static update() {
    this._entities.forEach(ent => {
      ent.update(this._game);
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
      this._entityRemoved = false;
    }

    // sort entities
    this._entities.sort((a, b) => {
      const layer = a.renderer.layer - b.renderer.layer;
      if (layer != 0) {
        return layer;
      }
      const y = a.pos.y - b.pos.y;
      if (y != 0) {
        return y;
      }
      return a.pos.x - b.pos.x;
      // const posA = Vector2.clone(a.pos);
      // const posB = Vector2.clone(b.pos);
      // if (a instanceof Tile) {
      //   posA.add(new Vector2(-0.5, -0.5));
      // }
      // if (b instanceof Tile) {
      //   posB.add(new Vector2(-0.5, -0.5));
      // }
      // const y = posA.y - posB.y;

      // if (y != 0) {
      //   return y;
      // }
      // return posA.x - posB.x;
    });
  }

  static render(gameState) {
    this._entities.forEach(ent => {
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
      this._add(new Tile(null, pos, renderer, isWalkable));
    }
  }

  static createPlayer(data) {
    const pos = Vector2.fromObject(data.pos);
    const renderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType('player')
      );
    const player = new Character(data.networkId, pos, renderer, data.name, data.actions);
    this._add(player);
    return player;
  }

  static createNPC(data) {
    const pos = Vector2.fromObject(data.pos);
    let renderer = null;

    if (['npc_station_guard'].includes(data.type)) {
      renderer = new AnimatedSpriteRenderer(
        RenderLayer.Walls,
        ResourceManager.texture,
        ResourceManager.getAnimationsByType('npc_guard')
        );
    }
    else if (['npc_info', 'npc_station_worker'].includes(data.type)) {
      renderer = new AnimatedSpriteRenderer(
        RenderLayer.Walls,
        ResourceManager.texture,
        ResourceManager.getAnimationsByType('npc_worker')
        );
    }

    const npc = new Character(data.networkId, pos, renderer, data.name, data.actions);
    this._add(npc, false);
    return npc;
  }

  static createLink(data) {
    const pos = Vector2.fromObject(data.pos);
    const renderer = new SpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getSpriteRectByIndex(ResourceManager.linkTile)
      );
    this._add(new AreaLink(data.networkId, pos, renderer, data.name, data.actions));
  }

  static createEnemy(data) {
    const pos = new Vector2(data.pos.x, data.pos.y);
    const renderer = new AnimatedSpriteRenderer(
      RenderLayer.Walls,
      ResourceManager.texture,
      ResourceManager.getAnimationsByType('enemy')
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

  static dispose() {
    this._entities.forEach(ent => ent.dispose());
    this._entities = [];

    this._game = null;
    this._gameState = null;
  }
}