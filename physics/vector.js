// Transpiled from github.com/Bearindigo105/TypescriptPhysics (src/vector.ts)
export class Vector {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    subtract(v) { this.x -= v.x; this.y -= v.y; return this; }
    multiply(scalar) { this.x *= scalar; this.y *= scalar; return this; }
    divide(scalar) {
        if (scalar === 0) throw new Error("Division by zero is not allowed.");
        this.x /= scalar; this.y /= scalar; return this;
    }
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const mag = this.magnitude(); if (mag !== 0) this.divide(mag); return this; }
    dot(v) { return this.x * v.x + this.y * v.y; }
    angle() { return Math.atan2(this.y, this.x); }
    copy() { return new Vector(this.x, this.y); }
    static fromJSON(v) { return new Vector(v.x, v.y); }
}
