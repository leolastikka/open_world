class Entity {
  constructor(networkId = null, pos, renderer) {
    this.networkId = networkId;
    this.pos = pos;
    if (renderer) {
      renderer.entity = this;
      this.renderer = renderer;
    }
    this._removed = false;
  }

  dispose() {
    this._removed = true;
    EntityManager._entityRemoved = true;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  update(game) {}
  get actions() {}

  render(display) {
    if (this.renderer && display.isInViewport(this.pos)) {
      this.renderer.render(display, {
        pos: display.getRenderPos(this.pos),
        size: display.pixelsPerUnit
      });
    }
  }

  renderGUI(display) {
    if (this.renderer && this instanceof Character && display.isInViewport(this.pos)) {
      const pos = display.getRenderPos(this.pos);
      pos.add(new Vector2(
        ResourceManager.spriteWidth / 2 * display.zoomLevel,
        ResourceManager.spriteHeight / 6 * display.zoomLevel
        ));

      display.context.font = `${10 * display.zoomLevel}px 'Minecraft Regular', monospace`;
      let fillStyle = 'greenyellow';
      if (this instanceof Player) { fillStyle = 'white'; }
      else if (this instanceof Enemy) { fillStyle = 'red' }
      display.context.fillStyle = fillStyle;
      display.context.textAlign = 'center';
      display.context.fillText(this.name, pos.x, pos.y);

      const hpPos = display.getRenderPos(this.pos);
      const size = ResourceManager.spriteWidth * display.zoomLevel;
      hpPos.add(new Vector2(size / 2, size / 5));

      if (this.inCombat) {
        display.context.fillStyle = 'red';
        display.context.fillRect(
          hpPos.x - size / 2,
          hpPos.y - size / 2,
          size,
          size / 8);

        display.context.fillStyle = 'yellowgreen';
        display.context.fillRect(
          hpPos.x - size / 2,
          hpPos.y - size / 2,
          size * (this.health.value / this.health.max),
          size / 8);
      }
    }
  }
}

class Tile extends Entity {
  constructor(networkId, pos, renderer, isWalkable) {
    super(networkId, pos, renderer);
    this.isWalkable = isWalkable;
  }

  get actions() {
    if (this.isWalkable) {
      return [new WalkAction("Walk to", Vector2.clone(this.pos))];
    }
    else {
      return [];
    }
  }
}

class WallTile extends Tile {
  constructor(networkId, pos, renderer, isWalkable) {
    super(networkId, pos, renderer, isWalkable);
  }
}

class Character extends Entity {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer);
    this.name = name;
    this.isOwned = false;
    this.state = 'none';
    this.path = null;
    this.nextPath = null;
    this.speed = null;
    this._actions = actions;

    this._inCombat = false;
    this._hp = null;
  }

  setPath(path) {
    this.state = 'moving';
    this.path = path;
    this.renderer.setAnimation('walk');
  }

  update(game) {
    switch(this.state) {
      case 'moving':
        this.move();
        break;
      case 'attacking':
        this.attack();
        break;
    }
    if (this.isOwned) {
      game.display.pos = Vector2.clone(this.pos);
    }
  }

  get actions() {
    let actions = [];
    this._actions.forEach(a => {
      if (a === 'talk') {
        actions.push(new TalkAction(`Talk to ${this.name}`, this.networkId));
      }
      else if (a === 'attack') {
        actions.push(new AttackAction(`Attack ${this.name}`, this.networkId));
      }
    });
    return actions;
  }

  move() {
    if (!this.path) {
      this.state = 'idle';
      if (this.renderer) {
        this.renderer.setAnimation('idle');
      }
      return;
    }

    let nextPos = this.path[0];
    let movementDistance = this.speed * Time.deltaTime;

    while(nextPos) {
      let curPos = this.pos;

      let diff = Vector2.sub(nextPos, curPos);
      let distance = diff.length;

      // if next node is not reached
      if (movementDistance < distance) {
        let norm = Vector2.normalize(diff);
        norm.mult(movementDistance);
        this.pos.add(norm);
        return;
      }

      // if next node is reached
      movementDistance -= distance;
      this.pos = Vector2.clone(nextPos);

      this.path.shift(); // remove first element
      if (this.path.length === 0) { // if destination reached
        if (this.nextPath) { // continue to next path if possible
          this.path = this.nextPath;
          this.nextPath = null;
          nextPos = Vector2.clone(this.path[0]);
        }
        else {
          this.state = 'idle';
          if (this.renderer) {
            this.renderer.setAnimation('idle');
          }
          this.path = null;
          return;
        }
      }
      else { // if path continues
        nextPos = Vector2.clone(this.path[0]);
      }
    }
  }

  attack() {}
}

class Player extends Character {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer, name, actions);
  }
}

class NPC extends Character {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer, name, actions);
  }
}

class Enemy extends NPC {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer, name, actions);
  }
}

class AreaLink extends WallTile {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer, true);
    this.name = name;
    this._actions = actions;
  }

  get actions() {
    let actions = [];
    this._actions.forEach(a => {
      if (a === 'goto') {
        actions.push(new AreaLinkAction(this.name, this.networkId));
      }
    });
    return actions;
  }
}

class Reconstructor extends WallTile {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer, true);
    this.name = name;
    this._actions = actions;
  }

  get actions() {
    let actions = [];
    this._actions.forEach(a => {
      if (a === 'configure') {
        actions.push(new ConfigureAction('Configure Reconstructor', this.networkId));
      }
    });
    return actions;
  }
}
