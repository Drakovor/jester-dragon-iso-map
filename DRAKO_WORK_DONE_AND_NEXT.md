# Drako Work Done And Next

This is the short handoff file for continuing on Windows.

## What Was Done

- Created the initial Drako Lair static web prototype.
- Built an Atlas / macro-map overview.
- Built a temporary PixiJS playable slice for `The Bent Court`.
- Added camera pan and zoom.
- Added mobile touch support.
- Added `Atlas` / `Vue jeu` switching.
- Added clickable hotspots:
  - `The Bent Court`
  - `Pistachio Signal`
  - `Low Serpent Arch`
- Added an HTML HUD separate from the scene:
  - top controls
  - sector panel
  - mini-map
  - labels
- Added transparent PNG sprites for the temporary slice.
- Removed visible chroma-green from used sprites.
- Added project documentation:
  - `PROJECT_CONTEXT.md`
  - `DRAKO_DIRECTION_LOCK.md`
  - `DRAKO_CHANGED_FILES.md`
  - `design-qa.md`
- Clarified the important direction change:
  - do not continue toward a flat PixiJS sprite map as the final solution
  - the future playable view should be a real lightweight 3D scene with an orthographic/isometric camera

## Current State

- Current repo branch: `main`
- Current latest local commit before this file: `f668144 Add Drako Windows handoff context`
- Current app type: static HTML/CSS/JS
- Current engine in app: PixiJS temporary prototype
- Current final direction: Three.js / real 3D orthographic map prototype
- Backend: none
- Package manager: none
- `package.json`: none

## Important Problems Found

- `git push origin main` from the Mac failed with GitHub `403`.
- SSH also failed because the Mac SSH key is not authorized on GitHub.
- GitHub connector has admin/push permission, but local terminal Git auth is separate.
- `gh` was installed to connect local GitHub auth.

## What Should Be Kept

- The Drako Lair dark violet identity.
- The Atlas as temporary overview only.
- The HTML UI overlay concept.
- The idea of hotspots changing the side panel.
- The documents explaining direction and current state.
- The existing PixiJS slice only as a reference/prototype, not final architecture.

## What Should Be Replaced Later

- Replace PixiJS as the main playable map engine.
- Replace flat/sprite-based playable map with real 3D geometry.
- Replace temporary prototype assets with better 3D meshes/materials.
- Replace temporary landmark names later.
- Replace the macro-map image later with a better Atlas system.

## Next Task On Windows

Build one small real 3D prototype only:

- Area: `The Bent Court / central violet basin`
- Engine recommendation: Three.js vanilla first
- Camera: orthographic/isometric
- Include:
  - 3D terrain/ground
  - a few low curved rocks/ruins/arches
  - a few crystals
  - subtle fog/depth atmosphere
  - controlled pan/zoom
  - 3 clickable hotspots
  - HTML side panel updates
  - desktop preview
  - mobile preview

Do not expand the whole map yet.

## Avoid Next

- Do not copy League of Legends layout or theme.
- Do not build a gacha/reward/card/backend/account system.
- Do not make the map a flat zoomed image.
- Do not make everything too black to read.
- Do not use gold as a main identity.
- Do not make aggressive spikes everywhere.
- Do not make cartoon/mobile-game assets.

## Run On Mac

```sh
cd "/Users/drakovor/Documents/emergent Drako-Lair/jester-dragon-iso-map"
python3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/
```

## Run On Windows After Clone

```powershell
git clone https://github.com/Drakovor/jester-dragon-iso-map.git
cd jester-dragon-iso-map
py -3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/
```

## If Continuing With Three.js On Windows

Create the 3D prototype in a small, isolated way first. Do not delete the current PixiJS slice until the Three.js slice is visibly better.

Suggested first files:

- keep `index.html`
- keep `styles.css`
- add `vendor/three.min.js`
- replace or isolate `app.js` only after testing

Definition of done for the next Windows pass:

- desktop screenshot
- mobile screenshot
- pan works
- zoom works
- 3D objects have real depth
- hotspots work
- side panel updates
- Atlas still exists separately
