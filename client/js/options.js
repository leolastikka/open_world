class Options {
  static init() {
    this.toggleFullscreen = this.toggleFullscreen.bind(this);

    this._optionsElement = document.getElementById('options');
    this._toggleFullscreenButton = this._optionsElement.querySelector('button[name="fullscreen"]');
    this._toggleFullscreenInProgress = false;
    this._toggleFullscreenButton.addEventListener('click', this.toggleFullscreen)
  }

  static toggleFullscreen() {
    if (!this._toggleFullscreenInProgress) {
      this._toggleFullscreenInProgress = true;
      const isFullscreen = window.fullScreen ||
          (window.innerWidth == screen.width &&
            window.innerHeight == screen.height);
      if (!isFullscreen) {
        document.body.requestFullscreen()
        .then(() => {
          this._toggleFullscreenInProgress = false;
        })
        .catch(err => {
          console.log(err);
        });
      }
      else {
        document.exitFullscreen()
        .then(() => {
          this._toggleFullscreenInProgress = false;
        })
        .catch(err => {
          console.log(err);
        });
      }
    }
  }
}
