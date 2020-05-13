class Game {
  constructor() {
    this.loginSuccess = this.loginSuccess.bind(this);
    this.connectSuccess = this.connectSuccess.bind(this);
    this.returnToLogin = this.returnToLogin.bind(this);

    this.connected = false;

    this.display = new Display();
    this.connection = new Connection();

    Options.init();
    ResourceManager.init();
  }

  start() {
    this.state = new LoginState(this, this.loginSuccess);
    window.requestAnimationFrame(() => this.update());
  }

  loginSuccess() {
    this.state.dispose();
    this.state = new ConnectState(this, this.connectSuccess, this.returnToLogin);
  }

  connectSuccess() {
    this.state.dispose();
    this.state = new GameState(this, this.returnToLogin);
  }

  returnToLogin(message = null) {
    this.state.dispose();
    this.state = new LoginState(this, this.loginSuccess, message);
  }

  update() {
    this.state.update();
    this.render();
    window.requestAnimationFrame(() => this.update());
  }

  render() {
    let ctx = this.display.context;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.display.width, this.display.height);

    this.state.render();
  }
}
