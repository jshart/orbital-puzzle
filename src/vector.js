export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  normalize() {
    const m = this.mag();
    if (m > 0.000001) {
      this.x /= m;
      this.y /= m;
    }
    return this;
  }

  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dist(v) {
    return Math.sqrt(this.distSq(v));
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  static fromAngle(angle, length = 1) {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  static add(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }

  static sub(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  }

  static scale(v, s) {
    return new Vector2(v.x * s, v.y * s);
  }

  static lerp(v1, v2, t) {
    return new Vector2(
      v1.x + (v2.x - v1.x) * t,
      v1.y + (v2.y - v1.y) * t
    );
  }
}
