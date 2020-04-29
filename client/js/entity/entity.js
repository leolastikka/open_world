class Entity {
  constructor(networkId = null, pos, renderer) {
    this.networkId = networkId;
    this.pos = pos;
    this.renderer = renderer;
    this._removed = false;
  }

  dispose() {
    this._removed = true;
    EntityManager._entityRemoved = true;
  }

  update(game) {}
  get actions() {}

  render(canvasContext, camera) {
    if (this.renderer && camera.isInViewport(this.pos)) {
      this.renderer.render(canvasContext, {
        pos: camera.getRenderPos(this.pos),
        size: camera.pixelsPerUnit
      });
    }
  }

  renderGUI(canvasContext, camera) {
    if (this.renderer && this instanceof Character && camera.isInViewport(this.pos)) {
      let pos = camera.getRenderPos(this.pos);
      pos.add(new Vector2(0, -camera.pixelsPerUnit));

      let hpPos = camera.getRenderPos(this.pos);
      hpPos.add(new Vector2(0, -camera.pixelsPerUnit * 0.25));

      this.renderer.renderGUI(canvasContext, {
        pos: pos,
        text: this.name,
        inCombat: this._inCombat,
        hp: this._hp,
        hpPos: hpPos,
        size: camera.pixelsPerUnit
      });
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

class Container extends Entity {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer);
    this.name = name;
    this.actions = actions;
  }

  get actions() {
    return [new TalkAction(`Interact with ${this.name}`, this.networkId)];
  }
}

class Interactable extends Entity {
  constructor(networkId, pos, renderer, name, actions) {
    super(networkId, pos, renderer);
    this.name = name;
    this.actions = actions;
  }

  get actions() {
    return [new InteractAction(`Interact with ${this.name}`, this.networkId)];
  }
}
