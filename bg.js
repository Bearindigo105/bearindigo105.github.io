// Page background, powered by my own engine: github.com/Bearindigo105/TypescriptPhysics
//
// The balls live in the world, not on the screen. Each room is its own physics box (its
// edges are the walls, gravity piles its balls on its own floor), and the screen is a camera
// over the 3x3 world: scrolling just moves the camera, so the balls slide by exactly the
// distance you scrolled, like the text does. No force is applied by scrolling.
import { Physics } from "./physics/physics.js";
import { Particle } from "./physics/particle.js";
import { Force } from "./physics/force.js";
import { Vector } from "./physics/vector.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const sc = document.querySelector(".scroller"); // the camera
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const G = 0.35;
const COLORS = ["#d9481c", "#e8b931", "#2a7f7a", "#2f5bd3", "#e59bb0"];
const MAX_PER_ROOM = 45;
let gravityOn = true;

// One physics world per room. `bounds` is what Physics.update reads (.width/.height).
const boxes = [...document.querySelectorAll(".room")].map(room => ({
  room, physics: new Physics([], new Vector(0, G)), bounds: { width: 0, height: 0 },
}));

function measure() {
  for (const b of boxes) {
    b.x = b.room.offsetLeft; b.y = b.room.offsetTop;
    b.bounds.width = b.room.offsetWidth; b.bounds.height = b.room.offsetHeight;
  }
}

function spawn(box, x, y, vx = (Math.random() - 0.5) * 6, vy = 0) {
  const m = 24 + Math.random() * 60; // in this engine, mass == diameter
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const p = new Particle(new Vector(x, y), new Vector(vx, vy), m, 0.9, color);
  p.forces.push(new Force(new Vector(0, gravityOn ? G * m : 0))); // same as Physics.fromJSON
  box.physics.particles.push(p);
  if (box.physics.particles.length > MAX_PER_ROOM) box.physics.particles.shift();
}

// Rooms overlapping the screen right now (with a little margin).
function onScreen(b, margin = 100) {
  const l = sc.scrollLeft, t = sc.scrollTop, w = sc.clientWidth, h = sc.clientHeight;
  return b.x < l + w + margin && b.x + b.bounds.width > l - margin &&
         b.y < t + h + margin && b.y + b.bounds.height > t - margin;
}
// The room under a point on the screen, plus that point in the room's own coordinates.
function roomAt(clientX, clientY) {
  const wx = clientX + sc.scrollLeft, wy = clientY + sc.scrollTop;
  const b = boxes.find(b => wx >= b.x && wx < b.x + b.bounds.width && wy >= b.y && wy < b.y + b.bounds.height);
  return b ? { box: b, x: wx - b.x, y: wy - b.y } : null;
}

function resize() {
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  measure();
  if (reduceMotion) draw();
}
addEventListener("resize", resize);
addEventListener("load", () => { measure(); if (reduceMotion) draw(); }); // fonts can change room sizes

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const b of boxes) {
    if (!onScreen(b, 0)) continue;
    ctx.setTransform(dpr, 0, 0, dpr, (b.x - sc.scrollLeft) * dpr, (b.y - sc.scrollTop) * dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, b.bounds.width, b.bounds.height); // a room's balls never draw outside it
    ctx.clip();
    b.physics.draw(ctx);
    ctx.restore();
  }
}

resize();
for (const b of boxes) {
  const n = Math.min(24, Math.floor((b.bounds.width * b.bounds.height) / 45000) + 4);
  for (let i = 0; i < n; i++) spawn(b, Math.random() * b.bounds.width, Math.random() * b.bounds.height * 0.5);
}

// The cursor pushes balls; clicking empty space drops a new one into that room.
const mouse = { x: -1e4, y: -1e4 };
addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });
addEventListener("click", e => {
  if (e.target.closest("a, button, .panel, .top, .minimap")) return;
  const hit = roomAt(e.clientX, e.clientY);
  if (!hit) return;
  spawn(hit.box, hit.x, hit.y, (Math.random() - 0.5) * 4, -4);
  if (reduceMotion) draw();
});

// Sandbox controls in the Engine room.
document.querySelectorAll("[data-engine]").forEach(btn => btn.addEventListener("click", () => {
  const action = btn.dataset.engine;
  if (action === "gravity") {
    gravityOn = !gravityOn;
    for (const b of boxes) for (const p of b.physics.particles) p.forces[0].s.y = gravityOn ? G * p.m : 0;
    btn.textContent = "gravity: " + (gravityOn ? "on" : "off");
  } else if (action === "drop") {
    const b = roomAt(innerWidth / 2, innerHeight / 2)?.box || boxes[7];
    for (let i = 0; i < 10; i++) spawn(b, Math.random() * b.bounds.width, 40 + Math.random() * 80);
  } else if (action === "clear") {
    for (const b of boxes) b.physics.particles.length = 0;
  }
  if (reduceMotion) draw();
}));

if (reduceMotion) {
  // No animation: let every room settle, then just redraw as the camera moves.
  for (const b of boxes) for (let i = 0; i < 600; i++) b.physics.update(b.bounds);
  sc.addEventListener("scroll", draw, { passive: true });
  draw();
} else {
  (function frame() {
    for (const b of boxes) {
      if (!onScreen(b)) continue; // off-screen rooms hold still until you come back
      const mx = mouse.x + sc.scrollLeft - b.x, my = mouse.y + sc.scrollTop - b.y;
      for (const p of b.physics.particles) {
        const dx = p.s.x - mx, dy = p.s.y - my, d = Math.hypot(dx, dy) || 1;
        const r = 70 + p.m / 2;
        if (d < r) p.v.add(new Vector(dx / d, dy / d).multiply((1 - d / r) * 2));
      }
      b.physics.update(b.bounds);
    }
    draw();
    requestAnimationFrame(frame);
  })();
}
