# Drako Direction Lock

This file locks the current approved direction so future work does not confuse old experiments with final intent.

## Core Separation

- **Accueil / homepage**: premium gothic 3D concept entry screen.
- **Atlas**: temporary macro-map / overview.
- **Playable map view**: real lightweight 3D scene presented with an orthographic / isometric camera.

The homepage target is for the home screen only. It should not automatically define the full map, relic systems, creature systems, cards, inventory, expedition logic, backend, or monetization.

## Old Files

Old uploaded files, screenshots, generated images, and local experiment assets are context only. They are not automatic instructions.

Before using an old asset or old file as direction, decide whether it is:

- current approved direction
- temporary experiment
- visual reference
- technical test
- obsolete

## Technical Correction

The phrase "2.5D map" was misleading.

The target is:

- 3D construction
- orthographic camera
- isometric / 2.5D visual feeling
- controlled camera pan and zoom
- real spatial depth
- HTML UI overlay separate from the scene

The point is not to copy another game. The point is the technical camera idea: a real 3D scene shown through a controlled orthographic/isometric view.

## Playable Map Direction

The playable map should become a lightweight 3D scene with:

- orthographic camera
- terrain / ground volumes
- rocks, arches, ruins, roots, crystals as 3D objects or lightweight meshes
- layered fog or depth fog
- lighting
- real spatial depth
- controlled camera pan and zoom
- click/tap hotspots
- separate HTML UI overlay

PixiJS can be used for overlays, effects, or temporary experiments. It should not be the main playable map engine unless there is a clear written justification.

## Engine Direction

Given the current codebase is plain HTML/CSS/JS with no React, the safest next engine path is:

1. **Three.js vanilla**: best fit for the smallest safe migration from a static app.
2. **React Three Fiber**: good later if the project moves to React/Vite.
3. **Babylon.js**: powerful, but heavier and less minimal for this current repo.

Recommendation: use Three.js first, with a small orthographic prototype in a new branch or isolated module.

## Visual DNA

Keep:

- deep dark purple / violet-black atmosphere
- black stone
- smoky premium mood
- organic, fluid, serpentine forms
- low, curved, harmonious architecture
- subtle jester-dragon DNA through masks, scale texture, curved court geometry, strange paths, ruins, traces, and silhouettes
- some angular edges and scale texture as controlled accents
- rare pistachio green as cursed energy, markings, crystals, or secret glow
- tiny ember orange as detail only

Avoid:

- generic fantasy map feeling
- cartoon tile-map look
- cute mobile-game asset-pack feeling
- aggressive spikes everywhere
- tall medieval castle silhouettes as the main language
- royal gold as main identity
- shiny saturated purple everywhere
- literal clown faces everywhere
- literal dragons everywhere
- copied League-like map structure, theme, or layout

Important nuance: angular texture is allowed. The problem is only when sharpness becomes extremely dominant everywhere.

## Current PixiJS Slice Status

The current PixiJS slice may be kept as:

- interaction prototype
- mood experiment
- asset layering test
- temporary preview

It should not be mistaken for the final playable map architecture.

## Smallest Safe Migration Plan

1. Freeze the current PixiJS slice as a reference/temporary prototype.
2. Create a new isolated Three.js scene file without deleting the current app.
3. Build only one small 3D orthographic test area first.
4. Use primitive low-poly/soft organic meshes before generating final assets.
5. Add camera pan/zoom and depth fog.
6. Add 3 clickable hotspots.
7. Compare mobile and desktop screenshots.
8. Only after approval, replace the PixiJS playable view.

Do not rewrite the whole app at once.

## Approval Gate

Before modifying architecture or replacing PixiJS, provide:

1. what currently exists
2. what is temporary
3. what should be kept
4. what should be replaced
5. whether Three.js, React Three Fiber, or Babylon.js fits better
6. the smallest safe migration plan
7. exact git commands to save and push the Mac work
8. exact Windows commands to clone, install, run, and preview

Wait for approval before the engine migration.
