class Time
{
  static init()
  {
    this._startMs = Date.now();
    this._deltaMs = 0;
    this._totalMs = 0;
    this._prevMs = this._startMs;
  }

  static update()
  {
    let newMs = Date.now();
    this._deltaMs = newMs - this._prevMs;
    this._totalMs = newMs - this._startMs;
    this._prevMs = newMs;
  }

  static get deltaTime()
  {
    if (this._deltaMs > 1000) return 0;
    return this._deltaMs / 1000;
  }

  static get totalTime()
  {
    return this._totalMs / 1000;
  }
}
