// Site background, powered by my own engine: github.com/Bearindigo105/TypescriptPhysics
import { Physics } from "./physics/physics.js";
import { Particle } from "./physics/particle.js";
import { Force } from "./physics/force.js";
import { Vector } from "./physics/vector.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const bounds = { width: innerWidth, height: innerHeight }; // Physics.update reads .width/.height
const GRAVITY = new Vector(0, 0.25);
const COLORS = ["92,255,176", "124,92,255", "255,92,138", "230,241,234"];
const MAX = 50;

const physics = new Physics([], GRAVITY);

function spawn(x, y, vx = (Math.random() - 0.5) * 8, vy = (Math.random() - 0.5) * 8) {
  const m = 10 + Math.random() * 36; // in this engine, mass == diameter
  const rgb = COLORS[Math.floor(Math.random() * COLORS.length)];
  const p = new Particle(new Vector(x, y), new Vector(vx, vy), m, 0.9, `rgba(${rgb},${0.06 + Math.random() * 0.1})`);
  p.forces.push(new Force(new Vector(GRAVITY.x * m, GRAVITY.y * m))); // same as Physics.fromJSON
  physics.particles.push(p);
  if (physics.particles.length > MAX) physics.particles.shift();
}

function resize() {
  bounds.width = innerWidth;
  bounds.height = innerHeight;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const count = Math.min(28, Math.floor((innerWidth * innerHeight) / 45000) + 8);
for (let i = 0; i < count; i++) spawn(Math.random() * bounds.width, Math.random() * bounds.height * 0.6);

// The engine's original interaction: scrolling kicks every ball (bigger balls move less).
// This uses the page's scroll delta so it also works with touch and the keyboard.
function kick(dx, dy) {
  for (const p of physics.particles) {
    p.v.y -= Math.min(Math.sqrt(Math.abs((dy * 20) / p.m)), 25) * Math.sign(dy);
    p.v.x -= Math.min(Math.sqrt(Math.abs((dx * 10) / p.m)), 25) * Math.sign(dx);
  }
}
let lastY = scrollY;
addEventListener("scroll", () => { kick(0, scrollY - lastY); lastY = scrollY; }, { passive: true });
addEventListener("wheel", e => { if (e.deltaX) kick(e.deltaX, 0); }, { passive: true });

// The cursor pushes balls away.
const mouse = { x: -1e4, y: -1e4 };
addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });

// Click on empty space to drop in a new ball.
addEventListener("click", e => {
  if (e.target.closest("a, button, .card, .nav, input")) return;
  spawn(e.clientX, e.clientY, (Math.random() - 0.5) * 6, -6);
});

function frame() {
  for (const p of physics.particles) {
    const dx = p.s.x - mouse.x, dy = p.s.y - mouse.y, d = Math.hypot(dx, dy) || 1;
    const r = 120 + p.m / 2;
    if (d < r) p.v.add(new Vector(dx / d, dy / d).multiply((1 - d / r) * 1.5));
  }
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  if (!reduceMotion) physics.update(bounds);
  physics.draw(ctx);
  if (!reduceMotion) requestAnimationFrame(frame);
}
frame();
