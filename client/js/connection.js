class Connection
{
  constructor()
  {
    this.domain = 'localhost';
    this.baseUrl = `http://${this.domain}`;
    this.baseWSUrl = `ws://${this.domain}`;
    this.ws = null;
    this.token = null;

    this.failWsOpenMessage = '> Connection to game server failed!<br>> Please try again later';
  }

  login(data, successCallback, failCallback)
  {
    let request = new XMLHttpRequest();
    request.onreadystatechange = () => { 
      if (request.readyState == 4)
      {
        if(request.status == 200)
        {
          let response = JSON.parse(request.responseText);
          if (response.success === 1) {
            this.token = response.token;
            console.log(this.token);
            successCallback(response);
          }
          else {
            failCallback(request.responseText);
          }
        }
        else {
          failCallback(request);
        }
      }
    }
    request.open('POST', `${this.baseUrl}/login`, true);
    request.setRequestHeader('content-type','application/json');
    request.send(JSON.stringify(data));

    return request;
  }

  openWs(successCallback, failCallback)
  {
    this.ws = new WebSocket(this.baseWSUrl);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({token:this.token}));
    };
    this.ws.onclose = () => {failCallback(this.failWsOpenMessage)};
    this.ws.onerror = () => {failCallback(this.failWsOpenMessage)};

    this.ws.onmessage = (msg) => {
      let json = JSON.parse(msg.data);
      if (json.success === 1) {
        successCallback();
      }
      else {
        failCallback(this.failWsOpenMessage);
      }
    };
  }

  closeWs()
  {
    if(this.ws) {
      this.ws.close();
    }

    this.ws = null;
  }
}