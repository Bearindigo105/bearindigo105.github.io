# bearindigo105.github.io

Personal site. Plain HTML/CSS/JS, no build step.

- `index.html` / `style.css`: page and styles
- `world.js`: the page is a 3x3 grid of rooms that scrolls in 2D (minimap, edge links)
- `bg.js`: physics background. Each room is its own physics box; the screen is a camera over the grid, so scrolling moves the view, not the balls. Cursor pushes balls, clicking drops more.
- `physics/`: JS copy of [TypescriptPhysics](https://github.com/Bearindigo105/TypescriptPhysics) (`vector`, `force`, `particle`, `physics`). Re-sync it if the engine changes.

Run locally (ES modules don't load over `file://`):

```
python -m http.server
```
