// Page background, powered by my own engine: github.com/Bearindigo105/TypescriptPhysics
import { Physics } from "./physics/physics.js";
import { Particle } from "./physics/particle.js";
import { Force } from "./physics/force.js";
import { Vector } from "./physics/vector.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const bounds = { width: 0, height: 0 }; // Physics.update reads .width/.height
const G = 0.35;
const COLORS = ["#d9481c", "#e8b931", "#2a7f7a", "#2f5bd3", "#e59bb0"];
const MAX = 90;

const physics = new Physics([], new Vector(0, G));
let gravityOn = true;

function spawn(x, y, vx = (Math.random() - 0.5) * 6, vy = 0) {
  const m = 24 + Math.random() * 60; // in this engine, mass == diameter
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const p = new Particle(new Vector(x, y), new Vector(vx, vy), m, 0.9, color);
  p.forces.push(new Force(new Vector(0, gravityOn ? G * m : 0))); // same as Physics.fromJSON
  physics.particles.push(p);
  if (physics.particles.length > MAX) physics.particles.shift();
}

function resize() {
  bounds.width = innerWidth;
  bounds.height = innerHeight;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (reduceMotion) draw();
}
addEventListener("resize", resize);

function draw() {
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  physics.draw(ctx);
}

resize();
const count = Math.min(40, Math.floor((bounds.width * bounds.height) / 26000) + 6);
for (let i = 0; i < count; i++) spawn(Math.random() * bounds.width, Math.random() * bounds.height * 0.5);

// Scrolling moves the balls by exactly the scrolled distance, the other way (scroll down 100px,
// they move up 100px), without changing their speed. The shift is applied at the start of the
// next tick, and the normal physics step (gravity, collisions, walls) still runs in that tick,
// so a ball shifted into a wall stops there.
const sc = document.querySelector(".scroller");
let lastX = sc.scrollLeft, lastY = sc.scrollTop, shiftX = 0, shiftY = 0;
sc.addEventListener("scroll", () => {
  shiftX += sc.scrollLeft - lastX; shiftY += sc.scrollTop - lastY;
  lastX = sc.scrollLeft; lastY = sc.scrollTop;
}, { passive: true });

// Apply a scroll shift in small steps, and after each step push balls out of the walls and
// out of each other (positions only, speeds untouched). Shifting everything at once in one
// go let balls near a wall get crammed deep into each other, which the engine's one-pass
// collision step then took many ticks to undo, so piles looked squishy.
const STEP = 4;   // px per sub-step
const PASSES = 12; // max separation passes per sub-step (stops early once nothing overlaps)
function separate() {
  const ps = physics.particles;
  for (let pass = 0; pass < PASSES; pass++) {
    let worst = 0;
    for (const p of ps) {
      const r = p.m / 2;
      p.s.x = Math.min(Math.max(p.s.x, r), bounds.width - r);
      p.s.y = Math.min(Math.max(p.s.y, r), bounds.height - r);
    }
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        const dx = a.s.x - b.s.x, dy = a.s.y - b.s.y, d = Math.hypot(dx, dy);
        const overlap = (a.m + b.m) / 2 - d;
        if (overlap <= 0 || d === 0) continue;
        if (overlap > worst) worst = overlap;
        const nx = dx / d, ny = dy / d, half = overlap / 2;
        a.s.x += nx * half; a.s.y += ny * half;
        b.s.x -= nx * half; b.s.y -= ny * half;
      }
    }
    if (worst < 0.5) break;
  }
}
function shift(dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / STEP));
  for (let k = 0; k < steps; k++) {
    for (const p of physics.particles) { p.s.x -= dx / steps; p.s.y -= dy / steps; }
    separate();
  }
}

// The cursor pushes balls; clicking empty space drops a new one.
const mouse = { x: -1e4, y: -1e4 };
addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });
addEventListener("click", e => {
  if (e.target.closest("a, button, .panel, .top, .minimap")) return;
  spawn(e.clientX, e.clientY, (Math.random() - 0.5) * 4, -4);
  if (reduceMotion) draw();
});

// Sandbox controls in the Engine room.
document.querySelectorAll("[data-engine]").forEach(btn => btn.addEventListener("click", () => {
  const action = btn.dataset.engine;
  if (action === "gravity") {
    gravityOn = !gravityOn;
    for (const p of physics.particles) p.forces[0].s.y = gravityOn ? G * p.m : 0;
    btn.textContent = "gravity: " + (gravityOn ? "on" : "off");
  } else if (action === "drop") {
    for (let i = 0; i < 10; i++) spawn(Math.random() * bounds.width, 40 + Math.random() * 80);
  } else if (action === "clear") {
    physics.particles.length = 0;
  }
  if (reduceMotion) draw();
}));

if (reduceMotion) {
  // No animation: let the balls settle, then draw them once.
  for (let i = 0; i < 600; i++) physics.update(bounds);
  draw();
} else {
  (function frame() {
    if (shiftX || shiftY) shift(shiftX, shiftY);
    shiftX = shiftY = 0;
    for (const p of physics.particles) {
      const dx = p.s.x - mouse.x, dy = p.s.y - mouse.y, d = Math.hypot(dx, dy) || 1;
      const r = 70 + p.m / 2;
      if (d < r) p.v.add(new Vector(dx / d, dy / d).multiply((1 - d / r) * 2));
    }
    physics.update(bounds);
    draw();
    requestAnimationFrame(frame);
  })();
}
