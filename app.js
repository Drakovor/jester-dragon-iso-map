(async function () {
  const canvas = document.getElementById("iso-map");
  const miniCanvas = document.getElementById("mini-map");
  const labelsRoot = document.getElementById("labels");
  const resetButton = document.getElementById("reset-view");
  const modeButton = document.getElementById("camera-mode");
  const cycleButton = document.getElementById("cycle-point");
  const placeName = document.getElementById("place-name");
  const placeType = document.getElementById("place-type");
  const placeFunction = document.getElementById("place-function");
  const placeCopy = document.getElementById("place-copy");

  if (!window.PIXI) {
    throw new Error("PixiJS is required for the Drako Lair scene.");
  }

  const PIXI = window.PIXI;
  const GAME_W = 1513;
  const GAME_H = 1039;
  const ATLAS_W = 1254;
  const ATLAS_H = 1254;
  const DEFAULT_GAME_FOCUS = { x: 912, y: 515 };
  const ADD_BLEND = PIXI.BLEND_MODES?.ADD || "add";
  const SCREEN_BLEND = PIXI.BLEND_MODES?.SCREEN || "screen";
  const NORMAL_BLEND = PIXI.BLEND_MODES?.NORMAL || "normal";

  const ASSETS = {
    atlas: "./assets/drako-lair-macro-map-v4-retina.webp",
    ground: "./assets/slice/ground-base-v1.png",
    farWall: "./assets/cinematic/far-serpentine-wall.png",
    archLeft: "./assets/cinematic/low-arch-left.png",
    archRight: "./assets/cinematic/low-arch-right.png",
    ribbonLeft: "./assets/cinematic/foreground-ribbon-left.png",
    ribbonCenter: "./assets/cinematic/foreground-ribbon-center.png",
    ribbonRight: "./assets/cinematic/foreground-ribbon-right.png",
    mask: "./assets/cinematic/dragon-mask-relief.png",
    scaleWall: "./assets/cinematic/curved-scale-wall.png",
    basin: "./assets/cinematic/rift-basin.png",
    ember: "./assets/cinematic/ember-bowl.png",
    crystal: "./assets/cinematic/pistachio-signal-crystal.png",
    rootRibbon: "./assets/slice/fluid/root-ribbon-cluster.png",
    rootBridge: "./assets/slice/fluid/moss-root-bridge.png",
    ovalStone: "./assets/slice/fluid/oval-mask-stone.png",
    curvedPath: "./assets/slice/fluid/curved-path-slabs.png",
  };

  const hotspots = [
    {
      id: "rift",
      name: "The Bent Court",
      type: "central violet basin",
      x: 940,
      y: 535,
      r: 155,
      functionText: "Hub d'anomalie: ouvre, ferme ou deforme les routes proches.",
      copy: "La cour centrale sert de test jouable: profondeur, brume, rift violet, chemins courbes et objets separes.",
    },
    {
      id: "crystal",
      name: "Pistachio Signal",
      type: "muted energy marker",
      x: 1156,
      y: 646,
      r: 72,
      functionText: "Relique: reactive les signaux anciens et revele des passages scelles.",
      copy: "Le vert reste rare et mystique: un signal ancien, pas une foret lumineuse.",
    },
    {
      id: "arch",
      name: "Low Serpent Arch",
      type: "curved court gate",
      x: 632,
      y: 468,
      r: 105,
      functionText: "Verrou de passage: change la profondeur visible selon la position de la camera.",
      copy: "Architecture basse, fluide et harmonieuse: la silhouette evoque le dragon sans devenir un chateau a pics.",
    },
  ];

  const state = {
    mode: "game",
    scale: 1,
    x: 0,
    y: 0,
    selectedId: "rift",
    hoveredId: null,
    didDrag: false,
    isPinching: false,
    lastMoveAt: 0,
  };

  const pointerMap = new Map();
  const labelEls = new Map();
  const cinematicSprites = [];
  const emberSprites = [];
  const particleSprites = [];
  const fogPlanes = [];
  let pixiApp;
  let gameRoot;
  let atlasRoot;
  let farLayer;
  let groundLayer;
  let lowLayer;
  let midLayer;
  let foregroundLayer;
  let fogLayer;
  let effectsLayer;
  let riftPulse;
  let crystalPulse;
  let selectedRing;
  let groundImage;
  let atlasImage;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function viewport() {
    return {
      w: pixiApp.screen.width,
      h: pixiApp.screen.height,
    };
  }

  function worldSize() {
    return state.mode === "atlas"
      ? { w: ATLAS_W, h: ATLAS_H }
      : { w: GAME_W, h: GAME_H };
  }

  function activeRoot() {
    return state.mode === "atlas" ? atlasRoot : gameRoot;
  }

  function coverScale() {
    const vp = viewport();
    const size = worldSize();
    return Math.max(vp.w / size.w, vp.h / size.h);
  }

  function fitScale() {
    const vp = viewport();
    const size = worldSize();
    return Math.min(vp.w / size.w, vp.h / size.h);
  }

  function minScale() {
    return Math.max(0.28, fitScale() * 0.96);
  }

  function maxScale() {
    return Math.max(2.75, coverScale() * 3.4);
  }

  function screenToWorld(screenX, screenY) {
    return {
      x: (screenX - state.x) / state.scale,
      y: (screenY - state.y) / state.scale,
    };
  }

  function worldToScreen(worldX, worldY) {
    return {
      x: state.x + worldX * state.scale,
      y: state.y + worldY * state.scale,
    };
  }

  function clampCamera() {
    const vp = viewport();
    const size = worldSize();
    const scaledW = size.w * state.scale;
    const scaledH = size.h * state.scale;

    if (scaledW <= vp.w) {
      state.x = (vp.w - scaledW) / 2;
    } else {
      state.x = clamp(state.x, vp.w - scaledW, 0);
    }

    if (scaledH <= vp.h) {
      state.y = (vp.h - scaledH) / 2;
    } else {
      state.y = clamp(state.y, vp.h - scaledH, 0);
    }
  }

  function zoomAt(screenX, screenY, nextScale) {
    const before = screenToWorld(screenX, screenY);
    state.scale = clamp(nextScale, minScale(), maxScale());
    state.x = screenX - before.x * state.scale;
    state.y = screenY - before.y * state.scale;
    clampCamera();
    applyCamera();
  }

  function focusWorld(worldX, worldY, zoomBoost = 1.4) {
    const vp = viewport();
    const base = state.mode === "atlas" ? fitScale() * 1.02 : coverScale() * zoomBoost;
    state.scale = clamp(base, minScale(), maxScale());
    state.x = vp.w * 0.52 - worldX * state.scale;
    state.y = vp.h * 0.48 - worldY * state.scale;
    clampCamera();
    applyCamera();
  }

  function selectedHotspot() {
    return hotspots.find((spot) => spot.id === state.selectedId) || hotspots[0];
  }

  function applyCamera() {
    if (!gameRoot || !atlasRoot) return;

    gameRoot.visible = state.mode === "game";
    atlasRoot.visible = state.mode === "atlas";
    activeRoot().scale.set(state.scale);
    activeRoot().position.set(state.x, state.y);

    const bodyMode = state.mode === "game" ? "game" : "atlas";
    document.body.dataset.camera = bodyMode;
    modeButton.textContent = state.mode === "game" ? "Atlas" : "Vue jeu";

    updateParallax();
    updateLabels();
    drawMiniMap();
  }

  function updateParallax() {
    if (state.mode !== "game") return;

    const vp = viewport();
    const center = screenToWorld(vp.w / 2, vp.h / 2);
    const dx = center.x - DEFAULT_GAME_FOCUS.x;
    const dy = center.y - DEFAULT_GAME_FOCUS.y;
    const layers = [
      [farLayer, 0.05],
      [groundLayer, 0.0],
      [lowLayer, 0.018],
      [midLayer, 0.035],
      [foregroundLayer, 0.055],
      [fogLayer, 0.08],
      [effectsLayer, 0.02],
    ];

    for (const [layer, amount] of layers) {
      if (!layer) continue;
      layer.position.set(dx * amount, dy * amount * 0.65);
    }
  }

  function selectHotspot(id, focus = false) {
    const spot = hotspots.find((item) => item.id === id);
    if (!spot) return;
    state.selectedId = spot.id;
    placeName.textContent = spot.name;
    placeType.textContent = spot.type;
    placeFunction.textContent = spot.functionText;
    placeCopy.textContent = spot.copy;
    if (focus) focusWorld(spot.x, spot.y, state.mode === "atlas" ? 1.0 : 1.55);
    updateLabels();
    drawMiniMap();
  }

  function createLabel(spot) {
    const el = document.createElement("div");
    el.className = "map-label";
    el.textContent = spot.name;
    labelsRoot.appendChild(el);
    labelEls.set(spot.id, el);
  }

  function updateLabels() {
    if (!pixiApp) return;
    const vp = viewport();
    for (const spot of hotspots) {
      const el = labelEls.get(spot.id);
      if (!el) continue;
      const pos = state.mode === "atlas"
        ? { x: -1000, y: -1000 }
        : worldToScreen(spot.x, spot.y - 44);
      const visible = state.mode === "game" && pos.x > -80 && pos.x < vp.w + 80 && pos.y > -80 && pos.y < vp.h + 80;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.classList.toggle("visible", visible);
      el.classList.toggle("selected", spot.id === state.selectedId);
      el.classList.toggle("hovered", spot.id === state.hoveredId);
    }
  }

  function findHotspot(worldX, worldY) {
    if (state.mode !== "game") return null;
    for (const spot of hotspots) {
      const dx = worldX - spot.x;
      const dy = worldY - spot.y;
      if (Math.sqrt(dx * dx + dy * dy) <= spot.r) return spot;
    }
    return null;
  }

  function addSprite(layer, textureKey, options) {
    const sprite = PIXI.Sprite.from(ASSETS[textureKey]);
    sprite.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 1);
    sprite.position.set(options.x, options.y);
    sprite.scale.set(options.scale ?? 1);
    sprite.alpha = options.alpha ?? 1;
    sprite.tint = options.tint ?? 0xffffff;
    sprite.rotation = options.rotation ?? 0;
    sprite.depthY = options.depthY ?? options.y;
    sprite.zIndex = sprite.depthY;
    if (options.blendMode) sprite.blendMode = options.blendMode;
    if (options.hotspot) sprite.hotspot = options.hotspot;
    layer.addChild(sprite);
    cinematicSprites.push(sprite);
    if (options.ember) emberSprites.push(sprite);
    return sprite;
  }

  function drawGraphicEllipse(graphic, color, alpha, x, y, w, h) {
    graphic.beginFill(color, alpha);
    graphic.drawEllipse(x, y, w, h);
    graphic.endFill();
  }

  function createFogPlane(x, y, w, h, tint, alpha, drift, layer) {
    const fog = new PIXI.Graphics();
    fog.alpha = alpha;
    fog.baseAlpha = alpha;
    fog.drift = drift;
    fog.tint = tint;
    drawGraphicEllipse(fog, 0xffffff, 1, 0, 0, w, h);
    fog.position.set(x, y);
    fog.blendMode = SCREEN_BLEND;
    layer.addChild(fog);
    fogPlanes.push(fog);
  }

  function buildGameScene() {
    gameRoot = new PIXI.Container();
    farLayer = new PIXI.Container();
    groundLayer = new PIXI.Container();
    lowLayer = new PIXI.Container();
    midLayer = new PIXI.Container();
    foregroundLayer = new PIXI.Container();
    fogLayer = new PIXI.Container();
    effectsLayer = new PIXI.Container();
    midLayer.sortableChildren = true;
    foregroundLayer.sortableChildren = true;

    gameRoot.addChild(farLayer, groundLayer, lowLayer, midLayer, foregroundLayer, fogLayer, effectsLayer);
    pixiApp.stage.addChild(gameRoot);

    const backdrop = new PIXI.Graphics();
    backdrop.beginFill(0x050208, 1);
    backdrop.drawRect(-200, -200, GAME_W + 400, GAME_H + 400);
    backdrop.endFill();
    groundLayer.addChild(backdrop);

    const ground = PIXI.Sprite.from(ASSETS.ground);
    ground.anchor.set(0, 0);
    ground.width = GAME_W;
    ground.height = GAME_H;
    ground.alpha = 0.72;
    ground.tint = 0x837095;
    groundLayer.addChild(ground);

    const shade = new PIXI.Graphics();
    shade.beginFill(0x06030b, 0.42);
    shade.drawRect(0, 0, GAME_W, GAME_H);
    shade.endFill();
    groundLayer.addChild(shade);

    const far = addSprite(farLayer, "farWall", {
      x: GAME_W * 0.5,
      y: 222,
      scale: 0.75,
      alpha: 0.34,
      tint: 0x4b405f,
      depthY: 120,
    });
    far.blendMode = NORMAL_BLEND;

    addSprite(lowLayer, "archLeft", {
      x: 617,
      y: 424,
      scale: 0.84,
      alpha: 0.78,
      tint: 0x75657f,
      depthY: 428,
      hotspot: "arch",
    });
    addSprite(lowLayer, "archRight", {
      x: 1062,
      y: 392,
      scale: 0.64,
      alpha: 0.48,
      tint: 0x51465f,
      depthY: 350,
    });

    addSprite(lowLayer, "curvedPath", {
      x: 580,
      y: 675,
      scale: 0.68,
      alpha: 0.18,
      tint: 0x5c4b6c,
      depthY: 350,
    });

    addSprite(midLayer, "basin", {
      x: 947,
      y: 615,
      scale: 1.02,
      alpha: 0.68,
      tint: 0x6f5d82,
      depthY: 610,
      hotspot: "rift",
      blendMode: SCREEN_BLEND,
    });
    addSprite(midLayer, "scaleWall", {
      x: 1020,
      y: 648,
      scale: 0.84,
      alpha: 0.58,
      tint: 0x50475b,
      depthY: 650,
    });
    addSprite(midLayer, "mask", {
      x: 808,
      y: 650,
      scale: 0.54,
      alpha: 0.62,
      tint: 0x62536f,
      depthY: 652,
    });
    addSprite(midLayer, "rootRibbon", {
      x: 493,
      y: 688,
      scale: 0.72,
      alpha: 0.42,
      tint: 0x4f4056,
      depthY: 692,
    });
    addSprite(midLayer, "rootBridge", {
      x: 684,
      y: 772,
      scale: 0.6,
      alpha: 0.28,
      tint: 0x493d50,
      depthY: 775,
    });
    addSprite(midLayer, "ovalStone", {
      x: 1168,
      y: 786,
      scale: 0.42,
      alpha: 0.48,
      tint: 0x51465b,
      depthY: 790,
    });
    addSprite(midLayer, "crystal", {
      x: 1160,
      y: 672,
      scale: 0.58,
      alpha: 0.86,
      tint: 0xb3d49a,
      depthY: 676,
      hotspot: "crystal",
      blendMode: SCREEN_BLEND,
    });
    addSprite(midLayer, "ember", {
      x: 510,
      y: 545,
      scale: 0.42,
      alpha: 0.76,
      tint: 0xbd6f3a,
      depthY: 548,
      ember: true,
      blendMode: ADD_BLEND,
    });
    addSprite(midLayer, "ember", {
      x: 1260,
      y: 560,
      scale: 0.32,
      alpha: 0.46,
      tint: 0xbd6f3a,
      depthY: 563,
      ember: true,
      blendMode: ADD_BLEND,
    });

    addSprite(foregroundLayer, "ribbonLeft", {
      x: 274,
      y: 890,
      scale: 1.18,
      alpha: 0.58,
      tint: 0x4b4053,
      depthY: 900,
    });
    addSprite(foregroundLayer, "ribbonCenter", {
      x: 744,
      y: 915,
      scale: 0.98,
      alpha: 0.44,
      tint: 0x403747,
      depthY: 920,
    });
    addSprite(foregroundLayer, "ribbonRight", {
      x: 1100,
      y: 920,
      scale: 1.15,
      alpha: 0.64,
      tint: 0x42384d,
      depthY: 925,
    });

    riftPulse = new PIXI.Graphics();
    riftPulse.blendMode = ADD_BLEND;
    effectsLayer.addChild(riftPulse);

    crystalPulse = new PIXI.Graphics();
    crystalPulse.blendMode = SCREEN_BLEND;
    effectsLayer.addChild(crystalPulse);

    selectedRing = new PIXI.Graphics();
    selectedRing.blendMode = SCREEN_BLEND;
    effectsLayer.addChild(selectedRing);

    createFogPlane(298, 257, 450, 70, 0x4c3d6d, 0.14, 0.18, fogLayer);
    createFogPlane(870, 356, 610, 92, 0x6d4b86, 0.12, -0.12, fogLayer);
    createFogPlane(600, 802, 820, 105, 0x342c44, 0.2, 0.08, fogLayer);
    createFogPlane(1140, 722, 460, 88, 0x4e385e, 0.16, -0.18, fogLayer);

    for (let i = 0; i < 54; i += 1) {
      const particle = new PIXI.Sprite(PIXI.Texture.WHITE);
      particle.anchor.set(0.5);
      particle.position.set(120 + Math.random() * 1290, 150 + Math.random() * 720);
      particle.width = 1 + Math.random() * 2.2;
      particle.height = particle.width;
      particle.tint = Math.random() > 0.86 ? 0xbde48b : 0x8c63ad;
      particle.alpha = 0.05 + Math.random() * 0.18;
      particle.seed = Math.random() * 1000;
      particle.speed = 0.15 + Math.random() * 0.34;
      particle.blendMode = SCREEN_BLEND;
      effectsLayer.addChild(particle);
      particleSprites.push(particle);
    }
  }

  function buildAtlasScene() {
    atlasRoot = new PIXI.Container();
    pixiApp.stage.addChild(atlasRoot);
    const atlas = PIXI.Sprite.from(ASSETS.atlas);
    atlas.anchor.set(0, 0);
    atlas.width = ATLAS_W;
    atlas.height = ATLAS_H;
    atlas.alpha = 0.92;
    atlasRoot.addChild(atlas);
  }

  function drawPulse(time) {
    const selected = selectedHotspot();
    const riftBeat = 0.5 + Math.sin(time * 0.0018) * 0.5;
    const crystalBeat = 0.5 + Math.sin(time * 0.0027 + 2.1) * 0.5;

    riftPulse.clear();
    drawGraphicEllipse(riftPulse, 0x8f2cff, 0.035 + riftBeat * 0.035, 938, 558, 118 + riftBeat * 18, 46 + riftBeat * 8);
    drawGraphicEllipse(riftPulse, 0x2b1238, 0.055, 940, 570, 176, 56);

    crystalPulse.clear();
    drawGraphicEllipse(crystalPulse, 0xbbe98c, 0.02 + crystalBeat * 0.04, 1160, 608, 44 + crystalBeat * 9, 58 + crystalBeat * 10);

    selectedRing.clear();
    selectedRing.lineStyle(2, selected.id === "crystal" ? 0xbbe98c : 0xc98cff, 0.32);
    selectedRing.drawEllipse(selected.x, selected.y, selected.r * 0.72, selected.r * 0.28);
  }

  function tick(delta) {
    const time = performance.now();
    midLayer.children.sort((a, b) => (a.depthY || a.y) - (b.depthY || b.y));
    foregroundLayer.children.sort((a, b) => (a.depthY || a.y) - (b.depthY || b.y));

    for (const sprite of emberSprites) {
      sprite.alpha = 0.42 + Math.sin(time * 0.007 + sprite.x * 0.01) * 0.08 + Math.random() * 0.05;
      sprite.scale.set((sprite.x > 1000 ? 0.32 : 0.42) * (0.98 + Math.sin(time * 0.006) * 0.025));
    }

    for (const fog of fogPlanes) {
      fog.x += Math.sin(time * 0.00015 + fog.y * 0.01) * fog.drift * delta;
      fog.alpha = fog.baseAlpha + Math.sin(time * 0.0007 + fog.y) * 0.025;
    }

    for (const particle of particleSprites) {
      particle.y -= particle.speed * delta;
      particle.x += Math.sin(time * 0.001 + particle.seed) * 0.08 * delta;
      if (particle.y < 95) particle.y = 890 + Math.random() * 30;
      particle.alpha = 0.05 + Math.sin(time * 0.0014 + particle.seed) * 0.05 + 0.08;
    }

    if (state.mode === "game") drawPulse(time);
  }

  function drawMiniMap() {
    if (!miniCanvas) return;
    const ctx = miniCanvas.getContext("2d");
    const w = miniCanvas.width;
    const h = miniCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#06030b";
    ctx.fillRect(0, 0, w, h);

    const img = state.mode === "atlas" ? atlasImage : groundImage;
    const size = worldSize();
    const scale = Math.min(w / size.w, h / size.h);
    const ox = (w - size.w * scale) / 2;
    const oy = (h - size.h * scale) / 2;

    if (img?.complete) {
      ctx.globalAlpha = state.mode === "atlas" ? 0.72 : 0.55;
      ctx.drawImage(img, ox, oy, size.w * scale, size.h * scale);
      ctx.globalAlpha = 1;
    }

    if (state.mode === "game") {
      ctx.strokeStyle = "rgba(185,239,114,0.38)";
      ctx.lineWidth = 1;
      for (const spot of hotspots) {
        ctx.beginPath();
        ctx.arc(ox + spot.x * scale, oy + spot.y * scale, spot.id === state.selectedId ? 4 : 2.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const vp = viewport();
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(vp.w, vp.h);
    ctx.strokeStyle = "rgba(255,235,190,0.82)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      ox + topLeft.x * scale,
      oy + topLeft.y * scale,
      (bottomRight.x - topLeft.x) * scale,
      (bottomRight.y - topLeft.y) * scale
    );
  }

  function setupPointerControls() {
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      zoomAt(event.clientX, event.clientY, state.scale * factor);
    }, { passive: false });

    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture?.(event.pointerId);
      pointerMap.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
      });
      state.didDrag = false;
      state.isPinching = pointerMap.size > 1;
    });

    canvas.addEventListener("pointermove", (event) => {
      const point = pointerMap.get(event.pointerId);
      if (!point) {
        const world = screenToWorld(event.clientX, event.clientY);
        const hot = findHotspot(world.x, world.y);
        state.hoveredId = hot?.id || null;
        updateLabels();
        return;
      }

      const prevX = point.x;
      const prevY = point.y;
      point.x = event.clientX;
      point.y = event.clientY;
      state.lastMoveAt = performance.now();

      if (pointerMap.size >= 2) {
        const values = Array.from(pointerMap.values()).slice(0, 2);
        const [a, b] = values;
        const prevDistance = Math.hypot((a.x - (a === point ? prevX : a.x)) - (b.x - (b === point ? prevX : b.x)), (a.y - (a === point ? prevY : a.y)) - (b.y - (b === point ? prevY : b.y)));
        const currentDistance = Math.hypot(a.x - b.x, a.y - b.y);
        const lastA = a === point ? { x: prevX, y: prevY } : a;
        const lastB = b === point ? { x: prevX, y: prevY } : b;
        const lastDistance = Math.hypot(lastA.x - lastB.x, lastA.y - lastB.y);
        const centerX = (a.x + b.x) / 2;
        const centerY = (a.y + b.y) / 2;
        if (lastDistance > 0 && currentDistance > 0 && Number.isFinite(prevDistance)) {
          zoomAt(centerX, centerY, state.scale * (currentDistance / lastDistance));
        }
        state.didDrag = true;
        state.isPinching = true;
        return;
      }

      const dx = event.clientX - prevX;
      const dy = event.clientY - prevY;
      if (Math.abs(event.clientX - point.startX) + Math.abs(event.clientY - point.startY) > 7) {
        state.didDrag = true;
      }
      state.x += dx;
      state.y += dy;
      clampCamera();
      applyCamera();
    });

    function endPointer(event) {
      const point = pointerMap.get(event.pointerId);
      pointerMap.delete(event.pointerId);

      if (point && !state.didDrag && !state.isPinching) {
        const world = screenToWorld(event.clientX, event.clientY);
        const hot = findHotspot(world.x, world.y);
        if (hot) selectHotspot(hot.id, false);
      }

      if (pointerMap.size < 2) {
        state.isPinching = false;
      }
    }

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", () => {
      state.hoveredId = null;
      updateLabels();
    });

    miniCanvas?.addEventListener("click", (event) => {
      const rect = miniCanvas.getBoundingClientRect();
      const mx = (event.clientX - rect.left) * (miniCanvas.width / rect.width);
      const my = (event.clientY - rect.top) * (miniCanvas.height / rect.height);
      const size = worldSize();
      const scale = Math.min(miniCanvas.width / size.w, miniCanvas.height / size.h);
      const ox = (miniCanvas.width - size.w * scale) / 2;
      const oy = (miniCanvas.height - size.h * scale) / 2;
      focusWorld((mx - ox) / scale, (my - oy) / scale, state.mode === "atlas" ? 1.0 : state.scale / coverScale());
    });
  }

  function setupButtons() {
    resetButton.addEventListener("click", () => {
      const spot = selectedHotspot();
      focusWorld(state.mode === "atlas" ? ATLAS_W * 0.5 : spot.x, state.mode === "atlas" ? ATLAS_H * 0.5 : spot.y, state.mode === "atlas" ? 1.0 : 1.42);
    });

    modeButton.addEventListener("click", () => {
      state.mode = state.mode === "game" ? "atlas" : "game";
      if (state.mode === "atlas") {
        focusWorld(ATLAS_W * 0.5, ATLAS_H * 0.5, 1.0);
      } else {
        const spot = selectedHotspot();
        focusWorld(spot.x, spot.y, 1.42);
      }
      applyCamera();
    });

    cycleButton.addEventListener("click", () => {
      const current = hotspots.findIndex((spot) => spot.id === state.selectedId);
      const next = hotspots[(current + 1) % hotspots.length];
      selectHotspot(next.id, true);
    });
  }

  function preparePreviewImages() {
    groundImage = new Image();
    groundImage.src = ASSETS.ground;
    groundImage.addEventListener("load", drawMiniMap);
    atlasImage = new Image();
    atlasImage.src = ASSETS.atlas;
    atlasImage.addEventListener("load", drawMiniMap);
  }

  async function createPixiApp() {
    const app = new PIXI.Application();
    if (typeof app.init === "function") {
      await app.init({
        canvas,
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      return app;
    }

    return new PIXI.Application({
      view: canvas,
      resizeTo: window,
      transparent: true,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
  }

  async function init() {
    for (const spot of hotspots) createLabel(spot);
    preparePreviewImages();
    pixiApp = await createPixiApp();
    await PIXI.Assets.load(Object.values(ASSETS));
    buildGameScene();
    buildAtlasScene();
    setupPointerControls();
    setupButtons();
    pixiApp.ticker.add(tick);
    window.addEventListener("resize", () => {
      clampCamera();
      applyCamera();
    });
    selectHotspot("rift", false);
    focusWorld(DEFAULT_GAME_FOCUS.x, DEFAULT_GAME_FOCUS.y, 1.42);
  }

  init().catch((error) => {
    console.error(error);
    document.body.dataset.camera = "error";
  });
})();
