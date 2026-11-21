// Transpiled from github.com/Bearindigo105/TypescriptPhysics (src/physics.ts)
import { Force } from "./force.js";
import { Particle } from "./particle.js";
import { Vector } from "./vector.js";

export class Physics {
    constructor(particles = [], gravconst = new Vector()) {
        this.particles = [];
        this.particles = this.particles.concat(particles);
        this.gravconst = gravconst;
    }

    update(canvas) {
        this.particles.forEach((particle) => {
            particle.update();
            particle.applyBoundary(0, canvas.width, 0, canvas.height);
            this.particles.forEach((otherParticle) => {
                if (particle !== otherParticle) {
                    if (particle.collision(otherParticle)) {
                        particle.resolveCollision(otherParticle);
                    }
                }
            });
        });
    }

    draw(ctx) {
        this.particles.forEach((particle) => { particle.draw(ctx); });
    }

    static fromJSON(json) {
        const particles = json.particles?.map((p) => Particle.fromJSON(p)) || [];
        const gravconst = Vector.fromJSON(json.gravconst);
        particles.forEach((particle) => {
            particle.forces.push(new Force(new Vector(gravconst.x * particle.m, gravconst.y * particle.m)));
        });
        return new Physics(particles, gravconst);
    }
}
