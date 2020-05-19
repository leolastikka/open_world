class Options {
  static init() {
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
    this.changeVolume = this.changeVolume.bind(this);

    this._defaultVolume = 50; // 0 ... 100
    this._maxVolume = 100;
    this._audioVolume = this._defaultVolume / this._maxVolume; // 0 ... 1
  }

  static get audioEnabled() {
    return ResourceManager.audioEnabled;
  }

  static get audioVolume() {
    return this._audioVolume;
  }

  static get audioSliderValue() {
    return this._audioVolume * this._maxVolume;
  }

  static toggleAudio() {
    if (ResourceManager.audioEnabled) {
      ResourceManager.disableAudio();
    }
    else {
      ResourceManager.enableAudio();
    }
  }

  static changeVolume(event) {
    this._audioVolume = parseInt(event.target.value) / this._maxVolume;
    ResourceManager.updateVolume();
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
