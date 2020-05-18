class Options {
  static init() {
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
  }

  static get audioEnabled() {
    return ResourceManager.audioEnabled;
  }

  static toggleAudio() {
    if (ResourceManager.audioEnabled) {
      ResourceManager.disableAudio();
    }
    else {
      ResourceManager.enableAudio();
    }
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
