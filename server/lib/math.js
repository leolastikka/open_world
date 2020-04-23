class Vector2 {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  get lengthSquared() {
    return Math.pow(this.x, 2) + Math.pow(this.y, 2);;
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }

  sub(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
  }

  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }

  div(scalar) {
    this.x /= scalar;
    this.y /= scalar;
  }

  equals(vector) {
    return this.x === vector.x && this.y === vector.y;
  }

  static add(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }

  static sub(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  }

  static mult(vector, scalar) {
    return new Vector2(vector.x * scalar, vector.y * scalar);
  }

  static div(vector, scalar) {
    return new Vector2(vector.x / scalar, vector.y / scalar);
  }

  static normalize(vector) {
    return this.div(vector, vector.length);
  }

  static clone(vector) {
    return new Vector2(vector.x, vector.y);
  }

  static fromObject(obj) {
    return new Vector2(obj.x, obj.y);
  }
}

module.exports = {
  Vector2
};
