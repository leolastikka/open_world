class ConnectState extends State {
  constructor(game, succesCallback, failCallback) {
    super();
    this.cancelConnect = this.cancelConnect.bind(this);

    this.game = game;
    this.succesCallback = succesCallback;
    this.failCallback = failCallback;

    this.connectingElement = document.getElementById('connecting');
    this.connectingElement.removeAttribute('hidden');

    this.connectCancelButton = this.connectingElement.querySelector('button');
    this.connectCancelButton.addEventListener('click', this.cancelConnect);

    this.game.connection.openWs(() => {
      this.succesCallback();
    }, (message) => {
      this.failCallback(message);
    });
  }

  cancelConnect() {
    this.game.connection.closeWs();
    this.failCallback();
  }

  dispose() {
    this.connectCancelButton.removeEventListener('click', this.cancelConnect);
    this.connectingElement.setAttribute('hidden', 'hidden');
  }
}