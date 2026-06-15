# Project Context

This file is the current handoff state for Drako Lair. Do not treat every existing asset or old experiment as final direction.

## Current Git State

- Repository path on Mac: `/Users/drakovor/Documents/emergent Drako-Lair/jester-dragon-iso-map`
- Branch: `main`
- Remote: `https://github.com/Drakovor/jester-dragon-iso-map.git`
- Latest local commit: `a03d037 Build cinematic 2.5D Drako Lair slice`
- Push status: `git push origin main` currently fails with GitHub `403 Permission denied`.
- Working tree note: after `a03d037`, `app.js` has an uncommitted light-grade tweak to reduce the "too black / trou noir" problem.

## Project Structure

- `index.html`: single static page shell.
- `styles.css`: fixed fullscreen HUD, mobile layout, labels, inspector, minimap panel.
- `app.js`: current PixiJS prototype renderer.
- `vendor/pixi.min.js`: bundled PixiJS runtime.
- `assets/drako-lair-macro-map-v4-retina.webp`: temporary Atlas / macro concept image.
- `assets/cinematic/`: transparent PNG sprites used by the current PixiJS slice.
- `assets/slice/ground-base-v1.png`: painted ground/base layer used in the current PixiJS slice.
- `assets/slice/fluid/`: a few transparent support sprites used by the current PixiJS slice.
- `design-qa.md`: QA notes for the current prototype.

## Frontend Framework

There is no frontend framework yet. The app is plain static HTML, CSS, and JavaScript.

Current renderer:

- PixiJS, loaded from `vendor/pixi.min.js`.
- PixiJS is now considered temporary for the playable map direction.

There is no `package.json`, no Vite, no React, no TypeScript, and no build step.

## Backend Situation

There is no backend.

There are no accounts, database, API routes, persistence, payments, inventory systems, gacha systems, or expedition backend.

## Homepage Implementation

There is no separate homepage implementation in this repo yet.

Important distinction:

- The dark gothic/premium homepage reference is a visual target for the future Accueil / home screen.
- It is not automatic direction for every map, card, asset, or product system.
- Do not use homepage references as permission to flatten the playable map into a static image.

## Map / Atlas Implementation

The Atlas is currently a temporary macro overview image:

- File: `assets/drako-lair-macro-map-v4-retina.webp`
- Displayed through the PixiJS scene when the user clicks `Atlas`.
- It is useful as a concept / overview only.
- It is not the final map system.

## Playable View Implementation

The current playable view is a PixiJS vertical slice:

- Fullscreen canvas: `#iso-map`
- Separate HTML UI overlay: header, buttons, inspector, labels, minimap.
- Camera supports pan and zoom.
- Hotspots update the inspector panel.
- Layers exist in code: far, ground, low, mid, foreground, fog, effects.
- Some parallax/fog/particle behavior exists.

Important: this is not the approved final engine direction anymore. It is a temporary prototype proving pan/zoom, layering, labels, and interaction.

## Current Assets

Currently used by the PixiJS slice:

- `assets/cinematic/far-serpentine-wall.png`
- `assets/cinematic/low-arch-left.png`
- `assets/cinematic/low-arch-right.png`
- `assets/cinematic/foreground-ribbon-left.png`
- `assets/cinematic/foreground-ribbon-center.png`
- `assets/cinematic/foreground-ribbon-right.png`
- `assets/cinematic/dragon-mask-relief.png`
- `assets/cinematic/curved-scale-wall.png`
- `assets/cinematic/rift-basin.png`
- `assets/cinematic/ember-bowl.png`
- `assets/cinematic/pistachio-signal-crystal.png`
- `assets/slice/ground-base-v1.png`
- `assets/slice/fluid/curved-path-slabs.png`
- `assets/slice/fluid/moss-root-bridge.png`
- `assets/slice/fluid/oval-mask-stone.png`
- `assets/slice/fluid/root-ribbon-cluster.png`

Temporary / experimental assets may also exist untracked in the workspace. They should not be treated as final instruction.

## Placeholder Assets

The current macro Atlas image is placeholder/concept.

The current PixiJS sprites are prototype assets. They help test mood and layering, but the future playable scene should replace them with real lightweight 3D objects or meshes.

The current names are placeholders:

- `The Bent Court`
- `Pistachio Signal`
- `Low Serpent Arch`

## Known Bugs / Risks

- GitHub push is blocked by permission error `403`.
- The committed PixiJS slice can read too dark on mobile. There is an uncommitted `app.js` light-grade adjustment after commit `a03d037`.
- The current playable view is still sprite-based, not true 3D.
- Some old/untracked experiment files remain in the folder and should be cleaned only after explicit approval.
- The Atlas is a single image and can look poster-like when zoomed.
- There is no production deployment setup.

## What Works

- Static local preview works with a Python HTTP server.
- PixiJS loads locally.
- Game view fills desktop and mobile canvas.
- Desktop pan and zoom work.
- Hotspot clicking updates the inspector.
- `Atlas` / `Vue jeu` toggle works.
- UI is separate from the scene.
- Project PNG assets were scanned with no visible chroma-green pixels in used transparent sprites.

## What Does Not Work Yet

- Final orthographic 3D playable map does not exist yet.
- No Three.js / React Three Fiber / Babylon.js scene exists yet.
- No true terrain mesh, real 3D rocks, real 3D arches, lighting rig, depth fog, or 3D camera rig exists yet.
- No final homepage exists yet.
- No backend or persistent product systems exist yet.
- GitHub push does not work with current credentials.

## Run Locally On Mac

From the project folder:

```sh
cd "/Users/drakovor/Documents/emergent Drako-Lair/jester-dragon-iso-map"
python3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/
```

For phone preview on the same Wi-Fi:

```sh
ipconfig getifaddr en0
python3 -m http.server 8765 --bind 0.0.0.0
```

Then open this on the phone, replacing the IP:

```text
http://MAC_IP:8765/
```

If the phone is on 5G, use a tunnel instead of localhost. Example if `cloudflared` is installed:

```sh
cloudflared tunnel --url http://127.0.0.1:8765
```

## Run Locally On Windows

Clone the repo after GitHub access is fixed:

```powershell
git clone https://github.com/Drakovor/jester-dragon-iso-map.git
cd jester-dragon-iso-map
py -3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/
```

There is currently no `npm install` step because this repo has no `package.json`.

## Preview Method

Use local browser preview first:

```text
http://127.0.0.1:8765/
```

Then validate mobile through same-Wi-Fi IP or a tunnel. Do not expect `127.0.0.1` on the phone to reach the Mac.

## What To Visually Verify

- The scene is not too black on mobile.
- The map feels spatial, not like a flat poster.
- The camera can pan and zoom without getting stuck.
- The UI does not cover the main scene.
- The Atlas and playable view feel separate.
- Purple/black remains the atmosphere, but terrain and props are readable.
- Pistachio green stays rare.
- Ember orange stays tiny.
- Angular/scale texture exists, but does not dominate the entire architecture.
