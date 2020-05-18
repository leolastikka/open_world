class ResourceManager {
  static init() {
    this.getSpriteRectByIndex = this.getSpriteRectByIndex.bind(this);

    this._texture = document.getElementById('spriteSheet');

    this._textureSize = 512;
    this._tileWidth = 32;
    this._tileHeight = 16;
    this._spriteWidth = this._tileWidth;
    this._spriteHeight = 48;
    
    this._floorTiles = [0,1,2,3,4];
    this._wallsTiles = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28, 32,33,34,35,36,37,38];
    this._linkTile = 13;

    const Rect = ResourceManager.getSpriteRectByIndex;

    // animation frames = [[Rect(spriteIndex), frame time in seconds], ...]
    this._animationsData = {
      enemy: [
        {
          name: 'idle',
          frames: [[Rect(50), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(50), 0.2], [Rect(66), 0.2]]
        }
      ],
      npc_guard: [
        {
          name: 'idle',
          frames: [[Rect(51), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(51), 0.2], [Rect(67), 0.2]]
        }
      ],
      npc_worker: [
        {
          name: 'idle',
          frames: [[Rect(49), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(49), 0.3], [Rect(65), 0.3]]
        }
      ],
      player: [
        {
          name: 'idle',
          frames: [[Rect(48), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(48), 0.2], [Rect(64), 0.2]]
        }
      ]
    };

    this._audioEnabled = false;
    this._audioContext = new AudioContext();
    this.audioVolume = 0.5; // 0 ... 1

    const audioDir = '../res';
    this._audioClips = [
      new AudioClip('menu', `${audioDir}/LoadingLoop.mp3`),
      new AudioClip('start', `${audioDir}/Shinsei.mp3`)
    ];
    this._currentMusic = null;
    this._nextMusic = null;

    this._crossfading = false;
    this._crossfadeStartTime = null;
    this._crossfadeDuration = 1;
  }

  static get texture() {
    return this._texture;
  }

  static get tileWidth() {
    return this._tileWidth;
  }

  static get tileHeight() {
    return this._tileHeight;
  }

  static get halfSpriteVector() {
    return new Vector2(this._spriteWidth / 2, this._spriteHeight / 2);
  }

  static get spriteWidth() {
    return this._spriteWidth;
  }

  static get spriteHeight() {
    return this._spriteHeight;
  }

  static get floorTiles() {
    return this._floorTiles;
  }

  static get wallsTiles() {
    return this._wallsTiles;
  }

  static get linkTile() {
    return this._linkTile;
  }

  static get audioContext() {
    return this._audioContext;
  }

  static get audioEnabled() {
    return this._audioEnabled;
  }

  static getSpriteRectByIndex(index) {
    const maxPos = this._textureSize / this._spriteWidth;
    return {
      x: this._spriteWidth * (index % maxPos),
      y: this._spriteHeight * Math.floor(index / maxPos),
      w: this._spriteWidth,
      h: this._spriteHeight
    }
  }

  static getAnimationsByType(type) {
    const entityAnimations = this._animationsData[type];
    let animations = {};
    for (let i = 0; i < entityAnimations.length; i++) {
      let animation = entityAnimations[i];
      let frames = [];
      for (let j = 0; j < animation.frames.length; j++) {
        frames.push({
          rect: animation.frames[j][0],
          time: animation.frames[j][1]
        });
      }
      animations[animation.name] = new Animation(animation.name, frames);
    }
    return animations;
  }

  static enableAudio() {
    this._audioEnabled = true;
    if (this._currentMusic) {
      this._currentMusic.play();
    }
    if (this._nextMusic) {
      this._nextMusic.play();
    }
  }

  static disableAudio() {
    this._audioEnabled = false;
    if (this._currentMusic) {
      this._currentMusic.stop();
    }
    if (this._nextMusic) {
      this._nextMusic.stop();
    }
  }

  static updateAudio() {
    if (this._crossfading) {
      this._updateCrossfade();
    }
  }

  static setVolume(value) {

  }

  static playMusic(name) {
    if (this._audioEnabled) {
      if (!this._crossfading) {
        this._crossfading = true;
      }
      else {
        this._currentMusic.stop();
        this._currentMusic = null;
        this._nextMusic.stop();
        this._nextMusic = null;
      }

      this._crossfadeStartTime = Time.totalTime;
      this._nextMusic = this._audioClips.find(a => a.name === name);
      this._nextMusic.play();
      this._updateCrossfade();
    }
    else {
      this._currentMusic = this._audioClips.find(a => a.name === name);
    }
  }

  static _updateCrossfade() {
    const elapsedTime = Time.totalTime - this._crossfadeStartTime;
    let progress = 0;
    if (elapsedTime != 0) {
      progress = Math.min(elapsedTime / this._crossfadeDuration, 1);
    }
    // Use an equal-power crossfading curve
    var gain1 = Math.cos(progress * 0.5 * Math.PI) * this.audioVolume;
    var gain2 = Math.cos((1.0 - progress) * 0.5 * Math.PI) * this.audioVolume;

    if (this._currentMusic && this._currentMusic.isReady) {
      this._currentMusic.gain.value = gain1;
    }
    if (this._nextMusic.isReady) {
      this._nextMusic.gain.value = gain2;
    }

    if (progress === 1) {
      if (this._currentMusic) {
        this._currentMusic.stop();
      }
      this._currentMusic = this._nextMusic;
      this._nextMusic = null;
      this._crossfading = false;
    }
  }
}

class AudioClip {
  constructor(name, url) {
    this._name = name;
    this._url = url;

    this._audioSource = null; // AudioBufferSourceNode, AudioScheduledSourceNode interface
    this._gainNode = null; // GainNode
    this._buffer = null; // AudioBuffer

    this._isReady = false;
    this._playWhenReady = false;

    this._load();
  }

  get name() {
    return this._name;
  }

  get gain() {
    return this._gainNode.gain;
  }
  get isReady() {
    return this._isReady;
  }

  play() {
    if (this.isReady) {
      this._audioSource = ResourceManager.audioContext.createBufferSource();
      this._audioSource.buffer = this._buffer;
      this._audioSource.loop = true;
      this._gainNode = ResourceManager.audioContext.createGain();
      this._audioSource.connect(this._gainNode);
      this._gainNode.connect(ResourceManager.audioContext.destination);
      this._gainNode.gain.value = ResourceManager.audioVolume;
      this._audioSource.start(0);
    }
    else {
      this._playWhenReady = true;
    }
  }

  stop() {
    if (this._isReady) {
      this._audioSource.stop(0);
      this._audioSource = null;
      this._gainNode = null;
    }
    else {
      this._playWhenReady = false;
    }
  }

  _load() {
    const request = new XMLHttpRequest();
    request.open('GET', this._url, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      ResourceManager.audioContext.decodeAudioData(
        request.response,
        (buffer) => {
          this._buffer = buffer;
          this._isReady = true;

          if (this._playWhenReady) {
            this.play();
          }
        },
        (error) => console.error('decodeAudioData error', error)
        );
    }
    request.onerror = () => {
      alert('BufferLoader: XHR error');
    }
    request.send();
  }
}

class AudioShort extends AudioClip {
}

class AudioLong extends AudioClip {
  constructor(name, audioSource, gainNode, loop) {
  }
}
