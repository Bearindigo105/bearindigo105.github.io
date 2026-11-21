// Transpiled from github.com/Bearindigo105/TypescriptPhysics (src/force.ts)
import { Vector } from "./vector.js";

export class Force {
    constructor(s = new Vector()) { this.s = s; }
    fromJSON(json) { return new Force(Vector.fromJSON(json.s)); }
}
