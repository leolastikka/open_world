class LoginState extends State {
  constructor(game, onLoginCallback, message = null) {
    super();
    this.login = this.login.bind(this);
    this.succeedLogin = this.succeedLogin.bind(this);
    this.failLogin = this.failLogin.bind(this);
    this.cancelLogin = this.cancelLogin.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);

    this.game = game;
    this.onLoginCallback = onLoginCallback;
    
    this.isLoggingIn = false;
    this.loginRequest = null;

    this.loginElement = document.getElementById('login');
    this.loginElement.removeAttribute('hidden');

    this.loginElement.querySelector('button[name="fullscreen"]').addEventListener('click', Options.toggleFullscreen);
    this.loginElement.querySelector('button[name="audio"]').addEventListener('click', this.toggleAudio);

    this.loginCancel = document.getElementById('loginCancel');
    this.loginCancel.setAttribute('hidden', 'hidden');

    this.loginCancelButton = this.loginCancel.querySelector('button');
    this.loginCancelButton.addEventListener('click', this.cancelLogin);

    this.loginError = document.getElementById('loginError');
    this.loginError.setAttribute('hidden', 'hidden');

    this.loginMessage = document.getElementById('loginMessage');
    if(message) {
      this.loginMessage.innerHTML = message;
      this.loginMessage.removeAttribute('hidden');
    }
    else {
      this.loginMessage.setAttribute('hidden', 'hidden');
    }

    this.loginForm = document.getElementById('loginForm');
    this.loginForm.removeAttribute('hidden');

    this.loginForm.onsubmit = () => {return false};
    this.loginForm.addEventListener('submit', this.login);

    this._updateAudioButton();
    ResourceManager.playMusic('menu');
  }

  login() {
    if (this.isLoggingIn) {
      return false;
    }
    this.loginError.setAttribute('hidden', 'hidden');
    this.loginMessage.setAttribute('hidden', 'hidden');
    this.loginForm.setAttribute('hidden', 'hidden');
    this.loginCancel.removeAttribute('hidden');

    this.isLoggingIn = true;

    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    this.loginRequest = this.game.connection.login({
      'username': username,
      'password': password
    }, (res) => {
      if (res.success === 1) {
        this.succeedLogin(res);
      }
      else {
        this.failLogin(res);
      }
    }, (res) => {
      this.failLogin(res);
    });

    return false;
  }

  succeedLogin(response) {
    this.onLoginCallback();
  }

  failLogin(response) {
    this.loginError.removeAttribute('hidden');
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  cancelLogin() {
    this.loginRequest.abort();
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  toggleAudio() {
    Options.toggleAudio();
    this._updateAudioButton();
  }

  _updateAudioButton() {
    const audioButton = this.loginElement.querySelector('button[name="audio"]');
    if (Options.audioEnabled) {
      audioButton.innerHTML = 'Disable Audio';
    }
    else {
      audioButton.innerHTML = 'Enable Audio';
    }
  }

  dispose() {
    this.loginForm.removeEventListener('submit', this.login);
    this.loginCancelButton.removeEventListener('click', this.cancelLogin);
    this.loginElement.querySelector('button[name="fullscreen"]').removeEventListener('click', Options.toggleFullscreen);
    this.loginElement.querySelector('button[name="audio"]').removeEventListener('click', this.toggleAudio);
    this.loginElement.setAttribute('hidden', 'hidden');
  }
}