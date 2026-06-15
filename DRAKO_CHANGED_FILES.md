# Drako Changed Files

This file explains the current changed files and why they changed.

## Latest Local Commit

Latest commit:

```text
a03d037 Build cinematic 2.5D Drako Lair slice
```

This commit pushed the project from a flat/poster-like prototype toward a layered PixiJS vertical slice. It is now considered a temporary prototype, not the final engine direction.

## Files Changed In `a03d037`

### `README.md`

Updated the project description and local run instructions for the PixiJS slice.

### `index.html`

Updated script loading so the page loads:

- `vendor/pixi.min.js`
- `app.js`

Also added cache-busting query strings.

### `styles.css`

Adjusted HUD, mobile layout, labels, inspector, and Atlas/game view styling.

### `app.js`

Replaced the older canvas/poster-style map renderer with a PixiJS prototype:

- layers
- pan/zoom camera
- Atlas toggle
- hotspots
- labels
- minimap
- fog/particles
- transparent sprite placement

Important: this is not final architecture. Future playable view should move to a real 3D orthographic scene.

### `vendor/pixi.min.js`

Bundled PixiJS locally so the static page can run without installing npm dependencies.

### `design-qa.md`

Added QA notes and capture paths for the current prototype.

## Added Current Prototype Assets

### `assets/cinematic/curved-scale-wall.png`

Transparent curved wall sprite with scale texture.

### `assets/cinematic/dragon-mask-relief.png`

Transparent mask/relief sprite for jester-dragon DNA.

### `assets/cinematic/ember-bowl.png`

Transparent tiny ember accent sprite.

### `assets/cinematic/far-serpentine-wall.png`

Transparent far silhouette sprite. Should stay subtle; it has some sharper details and must not dominate the final language.

### `assets/cinematic/foreground-ribbon-center.png`

Transparent foreground curved stone/ribbon sprite.

### `assets/cinematic/foreground-ribbon-left.png`

Transparent foreground curved stone/ribbon sprite.

### `assets/cinematic/foreground-ribbon-right.png`

Transparent foreground curved stone/ribbon sprite.

### `assets/cinematic/low-arch-left.png`

Transparent low organic arch sprite.

### `assets/cinematic/low-arch-right.png`

Transparent low organic arch sprite.

### `assets/cinematic/pistachio-signal-crystal.png`

Transparent rare pistachio signal/crystal sprite.

### `assets/cinematic/rift-basin.png`

Transparent violet basin/rift sprite.

### `assets/slice/ground-base-v1.png`

Ground/base image for the current prototype. It is acceptable as a temporary base but should become real terrain/geometry in the future 3D direction.

### `assets/slice/fluid/curved-path-slabs.png`

Transparent support sprite used as low ground detail.

### `assets/slice/fluid/moss-root-bridge.png`

Transparent support sprite used as organic structure detail.

### `assets/slice/fluid/oval-mask-stone.png`

Transparent support sprite used as mask/stone detail.

### `assets/slice/fluid/root-ribbon-cluster.png`

Transparent support sprite used as organic root/ribbon detail.

## Current Uncommitted Change

`app.js` has an uncommitted light-grade adjustment made after the user said the map looked like a black hole.

The adjustment:

- raises ground visibility
- reduces black overlay opacity
- increases sprite opacity/tints
- adds subtle violet bloom zones
- keeps the scene dark but more readable

This change should be reviewed visually before committing.

## Untracked Old / Experimental Files

There are untracked old experiment files in the workspace. They should not be treated as final direction and should not be deleted without explicit approval.

Examples include:

- old macro-map PNGs
- old gameplay-view PNGs
- unused sprite sheets
- unused extracted sprite experiments

## Git / Push Status

Local commit exists, but push fails:

```text
remote: Permission to Drakovor/jester-dragon-iso-map.git denied to Drakovor.
fatal: unable to access 'https://github.com/Drakovor/jester-dragon-iso-map.git/': The requested URL returned error: 403
```

GitHub credentials or repository permissions must be fixed before Mac work can become the GitHub source of truth.

## Save Mac Work

After reviewing the uncommitted light-grade tweak and documentation:

```sh
git status
git add PROJECT_CONTEXT.md DRAKO_DIRECTION_LOCK.md DRAKO_CHANGED_FILES.md app.js
git commit -m "Document Drako direction and improve map readability"
git push origin main
```

If push still fails, fix GitHub auth first.

## Windows Setup After Push Works

```powershell
git clone https://github.com/Drakovor/jester-dragon-iso-map.git
cd jester-dragon-iso-map
py -3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/
```
