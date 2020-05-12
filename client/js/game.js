class Game {
  constructor() {
    this.connected = false;

    this.display = new Display();
    this.connection = new Connection();

    ResourceManager.init();
  }

  start = () => {
    this.state = new LoginState(this, this.loginSuccess);
    window.requestAnimationFrame(() => this.update());
  }

  loginSuccess = () => {
    this.state.dispose();
    this.state = new ConnectState(this, this.connectSuccess, this.returnToLogin);
  }

  connectSuccess = () => {
    this.state.dispose();
    this.state = new GameState(this, this.returnToLogin);
  }

  returnToLogin = (message = null) => {
    this.state.dispose();
    this.state = new LoginState(this, this.loginSuccess, message);
  }

  update = () => {
    this.state.update();
    this.render();
    window.requestAnimationFrame(() => this.update());
  }

  render = () => {
    let ctx = this.display.context;
    ctx.fillStyle = 'black';
    //ctx.fillStyle = '#012009'; // dark green
    ctx.fillRect(0, 0, this.display.width, this.display.height);

    this.state.render();
  }
}
