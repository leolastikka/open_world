class ResourceManager {
  static init() {
    this.getSpriteRectByIndex = this.getSpriteRectByIndex.bind(this);

    this._texture = document.getElementById('spriteSheet');

    this._textureSize = 512;
    this._tileWidth = 32;
    this._tileHeight = 16;
    this._spriteWidth = this._tileWidth;
    this._spriteHeight = 48;
    
    this._floorTiles = [0,1,2,3,4,5];
    this._wallsTiles = [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46];
    this._greenGlowTile = 13;
    this._blueGlowTile = 12;

    const Rect = ResourceManager.getSpriteRectByIndex;

    // animation frames = [[Rect(spriteIndex), frame time in seconds], ...]
    this._animationsData = {
      none: [
        {
          name: 'idle',
          frames: [[Rect(64), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(64), 0.2], [Rect(80), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(96), 0.25]]
        }
      ],
      none_enemy: [
        {
          name: 'idle',
          frames: [[Rect(67), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(67), 0.2], [Rect(83), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(99), 0.25]]
        }
      ],
      military_armor: [
        {
          name: 'idle',
          frames: [[Rect(68), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(68), 0.2], [Rect(84), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(100), 0.25]]
        }
      ],
      worker_outfit: [
        {
          name: 'idle',
          frames: [[Rect(66), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(66), 0.2], [Rect(82), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(98), 0.25]]
        }
      ],
      survival_outfit: [
        {
          name: 'idle',
          frames: [[Rect(65), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(65), 0.2], [Rect(81), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(97), 0.25]]
        }
      ],
      sairaan_nopee_outfit: [
        {
          name: 'idle',
          frames: [[Rect(69), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(69), 0.2], [Rect(85), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(101), 0.25]]
        }
      ],
      standard_baton: [
        {
          name: 'idle',
          frames: [[Rect(70), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(70), 0.2], [Rect(86), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(102), 0.25]]
        }
      ],
      standard_mace: [
        {
          name: 'idle',
          frames: [[Rect(71), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(71), 0.2], [Rect(87), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(103), 0.25]]
        }
      ],
      standard_pole_hammer: [
        {
          name: 'idle',
          frames: [[Rect(72), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(72), 0.2], [Rect(88), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(104), 0.25]]
        }
      ],
      standard_pistol: [
        {
          name: 'idle',
          frames: [[Rect(73), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(73), 0.2], [Rect(89), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(105), 0.25]]
        }
      ],
      standard_smg: [
        {
          name: 'idle',
          frames: [[Rect(74), 1]]
        },
        {
          name: 'walk',
          frames: [[Rect(74), 0.2], [Rect(90), 0.2]]
        },
        {
          name: 'attack',
          frames: [[Rect(106), 0.25]]
        }
      ]
    };

    this._audioEnabled = false;
    this._audioContext = new AudioContext();

    const audioDir = '../res';
    this._audioClips = [
      new AudioClip('menu', `${audioDir}/Loop-Menu.mp3`),
      new AudioClip('start', `${audioDir}/Shinsei.mp3`),
      new AudioClip('wasteland', `${audioDir}/Factory.mp3`),
      new AudioClip('city', `${audioDir}/Flare-Main.mp3`)
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

  static get greenGlowTile() {
    return this._greenGlowTile;
  }

  static get blueGlowTile() {
    return this._blueGlowTile;
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
    if (!entityAnimations) console.log(type);
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

  static updateVolume() {
    this._audioClips.forEach(ac => {
      ac.volume = Options.audioVolume;
    });
  }

  static playMusic(name) {
    if (this._audioEnabled) {
      if (!this._crossfading) {
        this._crossfading = true;
      }
      else {
        if (this._currentMusic) {
          this._currentMusic.stop();
          this._currentMusic = null;
        }
        if (this._nextMusic) {
          this._nextMusic.stop();
          this._nextMusic = null;
        }
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
    var gain1 = Math.cos(progress * 0.5 * Math.PI) * Options.audioVolume;
    var gain2 = Math.cos((1.0 - progress) * 0.5 * Math.PI) * Options.audioVolume;

    if (this._currentMusic && this._currentMusic.isReady) {
      this._currentMusic.volume = gain1;
    }
    if (this._nextMusic.isReady) {
      this._nextMusic.volume = gain2;
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
    this._volume = Options.audioVolume;

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

  set volume(value) {
    this._volume = value;
    if (this._gainNode) {
      this._gainNode.gain.value = this._volume;
    }
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
      this._gainNode.gain.value = this._volume;
      this._audioSource.start(0);
    }
    else {
      this._playWhenReady = true;
    }
  }

  stop() {
    if (this._isReady) {
      if (this._audioSource) {
        this._audioSource.stop(0);
      }
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
