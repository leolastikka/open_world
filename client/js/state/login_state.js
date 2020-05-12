class LoginState extends State {
  constructor(game, onLoginCallback, message = null) {
    console.log('new LoginState()');
    super();

    this.game = game;
    this.onLoginCallback = onLoginCallback;
    
    this.isLoggingIn = false;
    this.loginRequest = null;

    this.loginElement = document.getElementById('login');
    this.loginElement.removeAttribute('hidden');
    console.log('loginElement set to visible');

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
  }

  login = () => {
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

  succeedLogin = (response) => {
    this.onLoginCallback();
  }

  failLogin = (response) => {
    this.loginError.removeAttribute('hidden');
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  cancelLogin = () => {
    this.loginRequest.abort();
    this.loginForm.removeAttribute('hidden');
    this.loginCancel.setAttribute('hidden', 'hidden');
    this.isLoggingIn = false;
  }

  dispose = () => {
    this.loginForm.removeEventListener('submit', this.login);
    this.loginCancelButton.removeEventListener('click', this.cancelLogin);
    this.loginElement.setAttribute('hidden', 'hidden');
  }
}