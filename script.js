const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- cursor glow ---------- */
const glow = document.querySelector('.cursor-glow');
addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

/* ---------- name scramble ---------- */
(() => {
  const el = document.querySelector('.scramble');
  const final = el.dataset.final;
  const chars = '!<>-_\\/[]{}=+*^?#01';
  if (reduceMotion) return;
  let frame = 0;
  const total = final.length * 3;
  const tick = () => {
    el.textContent = final.split('').map((ch, i) =>
      ch === ' ' ? ' ' : (frame / 3 > i ? ch : chars[Math.floor(Math.random() * chars.length)])
    ).join('');
    if (frame++ < total) requestAnimationFrame(tick);
  };
  tick();
})();

/* ---------- typed roles ---------- */
(() => {
  const el = document.querySelector('.typed');
  const roles = [
    'study Electrical Engineering @ Penn State.',
    'lead avionics for a VTOL aircraft.',
    'design PCBs.',
    'drive an FPV car with a steering wheel.',
    'teach robots to see.',
  ];
  if (reduceMotion) { el.textContent = roles[0]; return; }
  let r = 0, i = 0, deleting = false;
  (function loop() {
    const word = roles[r];
    el.textContent = word.slice(0, i);
    if (!deleting && i === word.length) { deleting = true; return setTimeout(loop, 1600); }
    if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; }
    i += deleting ? -1 : 1;
    setTimeout(loop, deleting ? 35 : 70);
  })();
})();

/* ---------- scroll reveal + counters ---------- */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    const num = e.target.querySelector('[data-count]');
    if (num) countUp(num);
    io.unobserve(e.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  io.observe(el);
});

function countUp(el) {
  const target = +el.dataset.count;
  if (reduceMotion) { el.textContent = target; return; }
  const start = performance.now(), dur = 1400;
  (function step(t) {
    const p = Math.min((t - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

/* ---------- card tilt + spotlight ---------- */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty('--mx', x + 'px');
    card.style.setProperty('--my', y + 'px');
    if (reduceMotion) return;
    const rx = ((y / r.height) - 0.5) * -8, ry = ((x / r.width) - 0.5) * 8;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ---------- active nav link ---------- */
const links = [...document.querySelectorAll('.nav nav a')];
const navIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }
}, { rootMargin: '-50% 0px -50% 0px' });
document.querySelectorAll('main section').forEach(s => navIO.observe(s));
