// Hero background, powered by my own engine: github.com/Bearindigo105/TypescriptPhysics
import { Physics } from "./physics/physics.js";
import { Particle } from "./physics/particle.js";
import { Force } from "./physics/force.js";
import { Vector } from "./physics/vector.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("bg");
const hero = canvas.parentElement;
const ctx = canvas.getContext("2d");
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const bounds = { width: 0, height: 0 }; // Physics.update reads .width/.height
const GRAVITY = new Vector(0, 0.35);
const COLORS = ["#d9481c", "#e8b931", "#2a7f7a", "#2f5bd3", "#e59bb0"];
const MAX = 80;

const physics = new Physics([], GRAVITY);

function spawn(x, y, vx = (Math.random() - 0.5) * 6, vy = 0) {
  const m = 24 + Math.random() * 66; // in this engine, mass == diameter
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const p = new Particle(new Vector(x, y), new Vector(vx, vy), m, 0.9, color);
  p.forces.push(new Force(new Vector(GRAVITY.x * m, GRAVITY.y * m))); // same as Physics.fromJSON
  physics.particles.push(p);
  if (physics.particles.length > MAX) physics.particles.shift();
}

function resize() {
  const r = hero.getBoundingClientRect();
  bounds.width = r.width;
  bounds.height = r.height;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const count = Math.min(45, Math.floor((bounds.width * bounds.height) / 22000) + 6);
for (let i = 0; i < count; i++) spawn(Math.random() * bounds.width, Math.random() * bounds.height * 0.5);

// The engine's original interaction: scrolling kicks every ball (bigger balls move less).
// Uses the page scroll delta so it also works with touch and the keyboard.
function kick(dx, dy) {
  for (const p of physics.particles) {
    p.v.y -= Math.min(Math.sqrt(Math.abs((dy * 20) / p.m)), 22) * Math.sign(dy);
    p.v.x -= Math.min(Math.sqrt(Math.abs((dx * 10) / p.m)), 22) * Math.sign(dx);
  }
}
let lastY = scrollY;
addEventListener("scroll", () => { kick(0, scrollY - lastY); lastY = scrollY; }, { passive: true });
addEventListener("wheel", e => { if (e.deltaX) kick(e.deltaX, 0); }, { passive: true });

// The cursor pushes balls; clicking drops a new one.
const mouse = { x: -1e4, y: -1e4 };
hero.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
hero.addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });
hero.addEventListener("click", e => {
  if (e.target.closest("a")) return;
  const r = canvas.getBoundingClientRect();
  spawn(e.clientX - r.left, e.clientY - r.top, (Math.random() - 0.5) * 4, -4);
});

function step() {
  for (const p of physics.particles) {
    const dx = p.s.x - mouse.x, dy = p.s.y - mouse.y, d = Math.hypot(dx, dy) || 1;
    const r = 70 + p.m / 2;
    if (d < r) p.v.add(new Vector(dx / d, dy / d).multiply((1 - d / r) * 2));
  }
  physics.update(bounds);
}

function draw() {
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  physics.draw(ctx);
}

if (reduceMotion) {
  // No animation: let the balls settle off-screen, then draw them once.
  for (let i = 0; i < 600; i++) physics.update(bounds);
  draw();
} else {
  let visible = true;
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) requestAnimationFrame(frame);
  }).observe(hero);
  function frame() {
    step();
    draw();
    if (visible) requestAnimationFrame(frame);
  }
  frame();
}
