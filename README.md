# bearindigo105.github.io

Personal site. Plain HTML/CSS/JS, no build step.

- `index.html` / `style.css` / `script.js`: page, styles, UI effects
- `bg.js`: interactive background (scroll to kick the balls, click to spawn more)
- `physics/`: JS copy of [TypescriptPhysics](https://github.com/Bearindigo105/TypescriptPhysics) (`vector`, `force`, `particle`, `physics`). Re-sync it if the engine changes.

Run locally (ES modules don't load over `file://`):

```
python -m http.server
```
