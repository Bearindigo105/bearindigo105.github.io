// 2D page navigation: the rooms form a 3x3 grid, laid out row by row in index.html.
const rooms = [...document.querySelectorAll('.room')];
const label = r => r.id === 'home' ? 'Home' : r.querySelector('h2').textContent.replace(' projects', '');
const at = (row, col) => (row >= 0 && row < 3 && col >= 0 && col < 3) ? rooms[row * 3 + col] : null;

function go(room, smooth = true) {
  scrollTo({ left: room.offsetLeft, top: room.offsetTop, behavior: smooth ? 'smooth' : 'instant' });
  history.replaceState(null, '', '#' + room.id);
}

// Doors: small labelled links on each room's edges pointing to its neighbours.
const dirs = { up: [-1, 0, '↑ '], down: [1, 0, '↓ '], left: [0, -1, '← '], right: [0, 1, ''] };
rooms.forEach((room, i) => {
  const row = Math.floor(i / 3), col = i % 3;
  for (const [dir, [dr, dc, pre]] of Object.entries(dirs)) {
    const next = at(row + dr, col + dc);
    if (!next) continue;
    const a = document.createElement('a');
    a.className = 'door ' + dir;
    a.href = '#' + next.id;
    a.textContent = pre + label(next) + (dir === 'right' ? ' →' : '');
    room.appendChild(a);
  }
});

// Minimap.
const map = document.querySelector('.minimap');
const cells = rooms.map(room => {
  const a = document.createElement('a');
  a.href = '#' + room.id;
  a.textContent = label(room);
  a.title = label(room);
  map.appendChild(a);
  return a;
});

// All in-page links scroll in 2D to the target room.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const room = document.getElementById(a.getAttribute('href').slice(1));
  if (!room || !room.classList.contains('room')) return;
  e.preventDefault();
  go(room);
});

// Highlight the room under the centre of the screen.
function current() {
  const cx = scrollX + innerWidth / 2, cy = scrollY + innerHeight / 2;
  return rooms.find(r => cx >= r.offsetLeft && cx < r.offsetLeft + r.offsetWidth &&
                         cy >= r.offsetTop && cy < r.offsetTop + r.offsetHeight) || rooms[4];
}
function mark() {
  const r = current();
  cells.forEach((c, i) => c.classList.toggle('here', rooms[i] === r));
}
addEventListener('scroll', mark, { passive: true });

// Start in the middle (or at the room named in the URL).
const start = document.getElementById(location.hash.slice(1));
const first = start && start.classList.contains('room') ? start : rooms[4];
go(first, false);
mark();
// Fonts can change room heights after first layout; re-centre once if the visitor hasn't moved yet.
addEventListener('load', () => { if (current() === first) go(first, false); });
// Re-centre only when the width changes (e.g. rotating the phone). Mobile browsers also fire
// resize whenever the address bar slides in or out while you swipe; re-centring on those
// yanked you back to the room you were leaving.
let lastWidth = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  lastWidth = innerWidth;
  go(current(), false);
});

document.getElementById('year').textContent = new Date().getFullYear();
