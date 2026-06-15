# Drako Lair Cinematic 2.5D Slice

Interactive Drako Lair prototype with two separated views:

- **Vue jeu**: a PixiJS asset-based 2.5D slice of The Bent Court, built from transparent sprites, layered fog, particles, parallax, hotspots, and camera pan/zoom.
- **Atlas**: a temporary macro-map concept view kept separate from the playable scene.

The current visual direction favors deep violet atmosphere, black stone, smoky organic forms, curved serpent/dragon-mask silhouettes, tiny ember points, and restrained pistachio signal accents.

## Run

Serve the folder locally:

```sh
python3 -m http.server 8765
```

Then visit:

```text
http://127.0.0.1:8765/
```

## Controls

- Drag or touch-drag to pan the scene.
- Mouse wheel or mobile pinch to zoom.
- Click/tap hotspots to inspect sector functions.
- Use `Centre` to refocus the selected place.
- Use `Atlas` / `Vue jeu` to switch between the macro concept and the asset-based 2.5D scene.
- Use `Suiv.` to cycle through hotspots.
