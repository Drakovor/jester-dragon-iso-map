(function () {
  const canvas = document.getElementById("iso-map");
  const ctx = canvas.getContext("2d");
  const miniCanvas = document.getElementById("mini-map");
  const miniCtx = miniCanvas.getContext("2d");
  const labelsRoot = document.getElementById("labels");
  const paintedMap = new Image();
  const gameplayMap = new Image();

  const ui = {
    reset: document.getElementById("reset-view"),
    camera: document.getElementById("camera-mode"),
    cycle: document.getElementById("cycle-point"),
    name: document.getElementById("place-name"),
    type: document.getElementById("place-type"),
    effect: document.getElementById("place-function"),
    copy: document.getElementById("place-copy"),
  };

  const TILE_W = 78;
  const TILE_H = 39;
  const HEIGHT = 28;
  const MAP_RX = 18;
  const MAP_RZ = 18;
  const PAINTED_MAP_SIZE = 1254;
  const GAMEPLAY_MAP_W = 1536;
  const GAMEPLAY_MAP_H = 1024;

  const palette = {
    void: [6, 3, 11],
    ground: [39, 30, 50],
    high: [77, 61, 84],
    road: [99, 75, 78],
    roadLight: [142, 108, 98],
    rift: [31, 8, 55],
    riftHot: [173, 76, 255],
    purpleHot: [184, 117, 255],
    water: [25, 56, 72],
    waterHot: [102, 198, 215],
    court: [72, 45, 96],
    courtAlt: [40, 28, 54],
    dragon: [74, 35, 54],
    grove: [37, 62, 45],
    stone: [83, 82, 91],
    gold: [219, 163, 75],
    acid: [185, 239, 114],
    ruby: [178, 58, 94],
    ink: [243, 234, 255],
  };

  const landmarks = [
    {
      id: "rift",
      name: "The Bent Court",
      type: "district central",
      x: 0,
      z: 1.2,
      sceneX: 1030,
      sceneY: 420,
      scale: 1.1,
      effect: "Hub d'anomalie: ouvre, ferme ou deforme les routes proches.",
      copy: "La premiere cour reste un district local: masques devines dans l'architecture, rift violet, routes croches et matiere vivante.",
    },
    {
      id: "jester-throne",
      name: "The Rule Seat",
      type: "architecture de cour",
      x: -2.1,
      z: -1.6,
      sceneX: 820,
      sceneY: 535,
      scale: 1,
      effect: "Decision: peut modifier les regles d'une expedition.",
      copy: "Un reste de tribunal masque sans nommer le masque. Les bannieres, pointes et angles cassent volontairement la geometrie.",
    },
    {
      id: "wyrm-nest",
      name: "Molt-Crown Hollow",
      type: "trace de creature",
      x: 3.6,
      z: 3.4,
      sceneX: 1240,
      sceneY: 615,
      scale: 1,
      effect: "Pression creature: augmente le risque mais peut reveler des traces rares.",
      copy: "Un creux d'ossements et de mues. La creature n'est pas encore nommee; on la comprend par ses traces.",
    },
    {
      id: "pistachio-grove",
      name: "Viridian Quiet",
      type: "foret maudite",
      x: -7.6,
      z: -8.7,
      sceneX: 430,
      sceneY: 360,
      scale: 0.9,
      effect: "Relique: reactive les racines et revele des passages scelles.",
      copy: "Racines anciennes, lueurs pistache et autels tordus. Ici le vert n'est pas une foret saine, c'est une energie ancienne.",
    },
    {
      id: "root-crown",
      name: "Crownroot Quiet",
      type: "sanctuaire vegetal",
      x: -10.1,
      z: -11.5,
      sceneX: 525,
      sceneY: 145,
      scale: 0.9,
      effect: "Seuil: demande une offrande ou action collective pour stabiliser la zone.",
      copy: "Un cercle de racines-couronnes. Les traces de creature sont lentes, hautes, presque ceremoniales.",
    },
    {
      id: "ember-caldera",
      name: "Ash Scar",
      type: "region volcanique",
      x: 6.4,
      z: -9.5,
      sceneX: 1130,
      sceneY: 185,
      scale: 0.95,
      effect: "Instabilite: routes chaudes, cout d'expedition variable.",
      copy: "Pierre noire, fissures orange et citadelles chauffees par dessous. L'ember reste rare: signal de danger, pas palette principale.",
    },
    {
      id: "ember-bastion",
      name: "Black Furnace Gate",
      type: "forteresse brulee",
      x: 11.2,
      z: -10.5,
      sceneX: 1410,
      sceneY: 225,
      scale: 0.88,
      effect: "Verrou: bloque une route tant que la chaleur n'est pas abaissee.",
      copy: "Une ligne fortifiee au bord de la caldera. Les tours sont plus militaires, plus seches, moins cour.",
    },
    {
      id: "mirror-reaches",
      name: "The Drowned Mirror",
      type: "region aquatique",
      x: -11.3,
      z: -2.4,
      sceneX: 190,
      sceneY: 525,
      scale: 0.95,
      effect: "Route menteuse: peut afficher une destination avant d'en reveler une autre.",
      copy: "Ponts rompus, eau bleu-noir, ruines englouties. Les creatures ici laissent des sillons et des remous, pas des nids.",
    },
    {
      id: "drowned-bridge",
      name: "Sunken Bridgeworks",
      type: "ruines noyees",
      x: -13.4,
      z: 1.0,
      sceneX: 85,
      sceneY: 675,
      scale: 0.82,
      effect: "Raccourci: peut ouvrir une traverse si le niveau d'eau change.",
      copy: "Un ancien reseau de passerelles noyees qui pourra devenir zone communautaire, donjon ou route cachee.",
    },
    {
      id: "crystal-maw",
      name: "Crystal Maw",
      type: "mineral vivant",
      x: 9.5,
      z: -1.7,
      sceneX: 1310,
      sceneY: 405,
      scale: 0.94,
      effect: "Echo mineral: amplifie les reliques mais attire les fouisseurs.",
      copy: "Cristaux violets et pistache, fractures minerales, traces de creature fouisseuse dans la pierre.",
    },
    {
      id: "green-spire",
      name: "Viridian Fang Spire",
      type: "cristal maudit",
      x: 11.6,
      z: 4.6,
      sceneX: 1370,
      sceneY: 695,
      scale: 0.86,
      effect: "Signal: revele les fractures proches sur la carte.",
      copy: "Une dent de cristal verte qui donne une silhouette differente du rift violet central.",
    },
    {
      id: "scalegrave",
      name: "Scalegrave Flats",
      type: "champ de traces",
      x: -1.8,
      z: 8.4,
      sceneX: 720,
      sceneY: 760,
      scale: 1,
      effect: "Lecture de traces: choisit entre prudence, chasse ou recolte.",
      copy: "Os, plaques d'ecailles, griffures et peaux mues. Les creatures dominent le terrain sans apparaitre frontalement.",
    },
    {
      id: "rib-path",
      name: "Rib Road",
      type: "route fossile",
      x: 1.8,
      z: 12.0,
      sceneX: 825,
      sceneY: 900,
      scale: 0.83,
      effect: "Passage: relie surface et couches basses.",
      copy: "Une route bordee de restes immenses. Elle relie la surface aux zones plus basses du monde.",
    },
    {
      id: "undercroft",
      name: "Obsidian Undercroft",
      type: "entree souterraine",
      x: -10.4,
      z: 11.2,
      sceneX: 250,
      sceneY: 850,
      scale: 0.94,
      effect: "Descente: ouvre une couche souterraine quand elle sera implementee.",
      copy: "Cavernes, champignons froids et architecture enterree. Cette zone peut devenir la premiere couche underground.",
    },
    {
      id: "fungal-vault",
      name: "Fungal Vault",
      type: "biome souterrain",
      x: -6.7,
      z: 12.9,
      sceneX: 475,
      sceneY: 915,
      scale: 0.82,
      effect: "Risque toxique: ressources rares, expedition instable.",
      copy: "Une poche lumineuse sous la carte: pistache plus humide, plus toxique, moins noble.",
    },
    {
      id: "rootglass",
      name: "Rootglass Wilds",
      type: "foret cristalline",
      x: 9.1,
      z: 9.3,
      sceneX: 1195,
      sceneY: 845,
      scale: 0.94,
      effect: "Mutation: change les traces et les recompenses d'une expedition.",
      copy: "Arbres vitreux, brume verte, os pris dans les racines. Une nature qui a appris les formes des cristaux.",
    },
    {
      id: "crooked-bastion",
      name: "Crooked Bastion",
      type: "citadelle gothique",
      x: 13.1,
      z: -8.6,
      sceneX: 1460,
      sceneY: 250,
      scale: 0.92,
      effect: "Revelation verticale: peut exposer une grande portion du fog.",
      copy: "La partie la plus architecturale de la macro-map: tours hautes, portails deformes, routes de siege.",
    },
  ];

  const roadPaths = [
    {
      width: 0.75,
      points: [
        [-13.4, 1.0],
        [-9.0, -1.0],
        [-4.2, 0.2],
        [0, 1.2],
        [4.4, 0.2],
        [9.5, -1.7],
        [13.1, -8.6],
      ],
    },
    {
      width: 0.68,
      points: [
        [-10.1, -11.5],
        [-7.6, -8.7],
        [-4.1, -4.3],
        [0, 1.2],
        [3.8, 5.2],
        [9.1, 9.3],
      ],
    },
    {
      width: 0.48,
      points: [
        [6.4, -9.5],
        [3.9, -5.4],
        [0, 1.2],
        [-1.8, 8.4],
        [1.8, 12.0],
      ],
    },
    {
      width: 0.56,
      points: [
        [-11.3, -2.4],
        [-8.2, 0.7],
        [-3.2, 2.4],
        [0, 1.2],
        [3.6, 3.4],
        [9.1, 9.3],
      ],
    },
    {
      width: 0.44,
      points: [
        [-10.4, 11.2],
        [-6.7, 12.9],
        [-1.8, 8.4],
        [0, 1.2],
        [6.4, -9.5],
      ],
    },
  ];

  const riverPath = [
    [-15.6, -3.4],
    [-12.5, -1.2],
    [-10.8, 2.0],
    [-8.7, 5.2],
    [-10.4, 11.2],
  ];

  const props = [];
  const labels = new Map();
  const tiles = [];
  const activePointers = new Map();
  const pinch = {
    active: false,
    lastDistance: 0,
    lastCenterX: 0,
    lastCenterY: 0,
  };
  const touchGesture = {
    mode: "none",
    moved: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastDistance: 0,
    lastCenterX: 0,
    lastCenterY: 0,
  };

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
    cameraMode: "game",
    selectedId: "rift",
    hoverId: null,
    dragging: false,
    moved: false,
    pointerStartX: 0,
    pointerStartY: 0,
    lastX: 0,
    lastY: 0,
    time: 0,
    paintedMapReady: false,
    gameplayMapReady: false,
  };

  paintedMap.addEventListener("load", () => {
    state.paintedMapReady = true;
    resetView();
    focusLandmark(selectedLandmark());
    updateLabels();
  });
  paintedMap.src = "./assets/drako-lair-macro-map-v4-retina.webp";

  gameplayMap.addEventListener("load", () => {
    state.gameplayMapReady = true;
    resetView();
    focusLandmark(selectedLandmark());
    updateLabels();
  });
  gameplayMap.src = "./assets/drako-lair-gameplay-view-v2.png";

  function usePaintedAtlas() {
    return state.paintedMapReady && state.cameraMode === "atlas";
  }

  function useGameplayScene() {
    return state.gameplayMapReady && state.cameraMode === "game";
  }

  function worldToGameplay(x, z) {
    return {
      x: ((x + MAP_RX) / (MAP_RX * 2)) * GAMEPLAY_MAP_W,
      y: ((z + MAP_RZ) / (MAP_RZ * 2)) * GAMEPLAY_MAP_H,
    };
  }

  function gameplayToWorld(x, y) {
    return {
      x: (x / GAMEPLAY_MAP_W) * MAP_RX * 2 - MAP_RX,
      z: (y / GAMEPLAY_MAP_H) * MAP_RZ * 2 - MAP_RZ,
    };
  }

  function landmarkGameplayPoint(landmark) {
    if (typeof landmark.sceneX === "number" && typeof landmark.sceneY === "number") {
      return { x: landmark.sceneX, y: landmark.sceneY };
    }
    return worldToGameplay(landmark.x, landmark.z);
  }

  function gameplayToScreen(x, y, lift) {
    return {
      x: state.offsetX + (x - GAMEPLAY_MAP_W * 0.5) * state.scale,
      y: state.offsetY + (y - GAMEPLAY_MAP_H * 0.5) * state.scale - (lift || 0) * state.scale,
    };
  }

  function gameplayCoverScale() {
    return Math.max(state.width / GAMEPLAY_MAP_W, state.height / GAMEPLAY_MAP_H);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hash(value) {
    const x = Math.sin(value * 91.73) * 43758.5453123;
    return x - Math.floor(x);
  }

  function hash2(x, z) {
    return hash(x * 13.17 + z * 41.91);
  }

  function rgb(color) {
    return `rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])})`;
  }

  function rgba(color, alpha) {
    return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha})`;
  }

  function mix(a, b, t) {
    const k = clamp(t, 0, 1);
    return [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k,
    ];
  }

  function shade(color, amount) {
    if (amount >= 0) return mix(color, [255, 255, 255], amount);
    return mix(color, [0, 0, 0], -amount);
  }

  function distanceToSegment(px, pz, ax, az, bx, bz) {
    const vx = bx - ax;
    const vz = bz - az;
    const wx = px - ax;
    const wz = pz - az;
    const lenSq = vx * vx + vz * vz || 1;
    const t = clamp((wx * vx + wz * vz) / lenSq, 0, 1);
    const x = ax + vx * t;
    const z = az + vz * t;
    return Math.hypot(px - x, pz - z);
  }

  function distanceToPath(x, z, points) {
    let best = Infinity;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      best = Math.min(best, distanceToSegment(x, z, a[0], a[1], b[0], b[1]));
    }
    return best;
  }

  function roadDistance(x, z) {
    let best = Infinity;
    for (const road of roadPaths) {
      best = Math.min(best, distanceToPath(x, z, road.points) - road.width);
    }
    return best;
  }

  function waterDistance(x, z) {
    return distanceToPath(x, z, riverPath);
  }

  function inMap(x, z) {
    const oval = (x * x) / (MAP_RX * MAP_RX) + (z * z) / (MAP_RZ * MAP_RZ);
    const bite = Math.max(0, Math.hypot(x + 11.7, z - 9.8) - 2.5);
    return oval < 1.05 && bite > 0.15;
  }

  function noise(x, z) {
    return (
      Math.sin(x * 0.72 + z * 0.34) * 0.36 +
      Math.cos(z * 0.88 - x * 0.22) * 0.31 +
      Math.sin((x - z) * 1.65) * 0.16
    );
  }

  function terrainHeight(x, z) {
    const edge = Math.sqrt((x * x) / (MAP_RX * MAP_RX) + (z * z) / (MAP_RZ * MAP_RZ));
    const center = Math.hypot(x * 0.78, z * 1.02);
    const road = roadDistance(x, z);
    const river = waterDistance(x, z);
    let h = noise(x, z) * 0.33;

    h += Math.max(0, edge - 0.62) * 1.4;
    h += Math.max(0, 1 - Math.hypot(x - 7.2, z + 4.7) / 4.4) * 0.34;
    h += Math.max(0, 1 - Math.hypot(x + 7.4, z + 4.7) / 4.2) * 0.24;
    h -= Math.max(0, 1 - center / 2.6) * 1.32;

    if (river < 0.95) h = Math.min(h, -0.72 + river * 0.12);
    if (road < 0.65) h = h * 0.35 - 0.02;
    return h;
  }

  function terrainType(x, z) {
    const center = Math.hypot(x * 0.72, z * 1.0);
    if (center < 2.15) return "rift";
    if (waterDistance(x, z) < 0.95) return "water";
    if (roadDistance(x, z) < 0.62) return "road";
    if (Math.hypot(x + 7.2, z + 4.8) < 3.4) return "court";
    if (Math.hypot(x - 7.4, z + 4.9) < 3.5) return "dragon";
    if (Math.hypot(x + 8.6, z - 4.9) < 3.0) return "grove";
    return "ground";
  }

  function terrainColor(x, z, h, type) {
    let color = mix(palette.ground, palette.high, clamp(h * 0.42 + 0.28, 0, 0.7));
    color = mix(color, [50, 35, 61], hash2(x, z) * 0.08);

    if (type === "road") {
      color = mix(palette.road, palette.roadLight, hash2(x * 2, z * 2) * 0.32);
    } else if (type === "water") {
      color = mix(palette.water, palette.waterHot, hash2(x, z) * 0.2);
    } else if (type === "rift") {
      color = mix(palette.rift, [81, 19, 117], hash2(x, z) * 0.32);
    } else if (type === "court") {
      const distance = Math.hypot(x * 0.72, z * 1.0);
      const slab = Math.sin(x * 1.15 + z * 0.35) * 0.5 + Math.cos(z * 0.95 - x * 0.2) * 0.5;
      color = mix(palette.court, palette.courtAlt, 0.26 + slab * 0.16);
      color = mix(color, palette.gold, distance < 3.8 ? 0.04 : 0.015);
    } else if (type === "dragon") {
      color = mix(palette.dragon, [96, 48, 62], hash2(x, z) * 0.34);
    } else if (type === "grove") {
      color = mix(palette.grove, palette.acid, hash2(x, z) * 0.12);
    }

    return color;
  }

  function project(x, z, h) {
    if (usePaintedAtlas()) {
      const half = PAINTED_MAP_SIZE * 0.5 * state.scale;
      return {
        x: state.offsetX + (x / MAP_RX) * half,
        y: state.offsetY + (z / MAP_RZ) * half - h * 8 * state.scale,
      };
    }
    if (useGameplayScene()) {
      const point = worldToGameplay(x, z);
      return gameplayToScreen(point.x, point.y, h * 16);
    }
    return {
      x: state.offsetX + (x - z) * (TILE_W * 0.5) * state.scale,
      y: state.offsetY + (x + z) * (TILE_H * 0.5) * state.scale - h * HEIGHT * state.scale,
    };
  }

  function drawPoly(points, fill, stroke, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
  }

  function drawTile(tile) {
    const x = tile.x;
    const z = tile.z;
    const h = tile.h;
    const top = project(x, z - 0.5, h);
    const right = project(x + 0.5, z, h);
    const bottom = project(x, z + 0.5, h);
    const left = project(x - 0.5, z, h);
    const isGameView = state.cameraMode === "game";
    const courtDistance = Math.hypot(x * 0.72, z * 1.0);
    const isRaisedGround = isGameView && tile.type === "court" && courtDistance < 5.1;
    const isCliff = tile.edge > 0.82 || h > 0.46 || isRaisedGround;
    const sideDepth =
      (isCliff ? 9 + Math.max(0, h + 0.4) * 12 : tile.type === "road" ? 5 : 3) * state.scale;
    const bottomDrop = { x: bottom.x, y: bottom.y + sideDepth };
    const rightDrop = { x: right.x, y: right.y + sideDepth };
    const leftDrop = { x: left.x, y: left.y + sideDepth };
    const color = tile.color;

    if (tile.type !== "water" && isCliff) {
      drawPoly([left, bottom, bottomDrop, leftDrop], rgba(shade(color, -0.24), 0.86), null);
      drawPoly([bottom, right, rightDrop, bottomDrop], rgba(shade(color, -0.36), 0.9), null);
    }

    const topFill = ctx.createLinearGradient(top.x, top.y, bottom.x, bottom.y);
    topFill.addColorStop(0, rgb(shade(color, 0.06)));
    topFill.addColorStop(0.48, rgb(color));
    topFill.addColorStop(1, rgb(shade(color, -0.08)));

    drawPoly(
      [top, right, bottom, left],
      topFill,
      rgba(tile.type === "rift" ? palette.riftHot : palette.ink, tile.type === "water" ? 0.04 : 0.028),
      Math.max(0.35, 0.52 * state.scale),
    );

    if (isGameView && tile.type !== "water" && (tile.edge > 0.82 || tile.type === "road" || tile.type === "rift")) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      drawPoly(
        [left, bottom, right],
        rgba([5, 2, 8], tile.type === "road" ? 0.08 : 0.045),
        null,
      );
      ctx.restore();
    }

    if (tile.type === "water") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawPoly([top, right, bottom, left], rgba(palette.waterHot, 0.09 + Math.sin(state.time + x) * 0.025), null);
      ctx.restore();
    } else if (isGameView && hash2(x + 4.7, z - 9.1) > 0.48) {
      const crackA = project(x - 0.28, z - 0.08, h + 0.012);
      const crackB = project(x + 0.24, z + 0.12, h + 0.012);
      ctx.save();
      ctx.strokeStyle = rgba(tile.type === "rift" ? palette.riftHot : palette.ink, tile.type === "road" ? 0.08 : 0.06);
      ctx.lineWidth = Math.max(0.45, 0.75 * state.scale);
      ctx.beginPath();
      ctx.moveTo(crackA.x, crackA.y);
      ctx.lineTo(crackB.x, crackB.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTileField() {
    for (const tile of tiles) {
      const courtDistance = Math.hypot(tile.x * 0.72, tile.z * 1.0);
      const structural =
        courtDistance < 5.8 ||
        tile.edge > 0.83 ||
        tile.type === "rift";
      if (structural) drawTile(tile);
    }
  }

  function worldBlobPoints(cx, cz, rx, rz, count, heightOffset, seed) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 3.1 + seed) * 0.055 + Math.cos(a * 5.4 - seed * 0.7) * 0.04;
      const x = cx + Math.cos(a) * rx * wobble;
      const z = cz + Math.sin(a) * rz * wobble;
      points.push(project(x, z, terrainHeight(x, z) + heightOffset));
    }
    return points;
  }

  function drawWorldBlob(cx, cz, rx, rz, color, alpha, heightOffset, seed, strokeColor) {
    const points = worldBlobPoints(cx, cz, rx, rz, 96, heightOffset, seed);
    drawPoly(points, rgba(color, alpha), strokeColor ? rgba(strokeColor, alpha * 0.45) : null, Math.max(0.8, state.scale));
  }

  function drawMapSilhouette() {
    const border = [];
    const lower = [];
    for (let i = 0; i < 180; i += 1) {
      const a = (i / 180) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 4.0) * 0.025 + Math.cos(a * 7.0) * 0.018;
      const x = Math.cos(a) * MAP_RX * wobble;
      const z = Math.sin(a) * MAP_RZ * wobble;
      const p = project(x, z, terrainHeight(x, z) - 0.08);
      border.push(p);
      lower.unshift({ x: p.x, y: p.y + (56 + Math.max(0, Math.sin(a)) * 22) * state.scale });
    }

    const center = project(0, 0, 0);
    const shadow = border.map((p) => ({ x: p.x + 18 * state.scale, y: p.y + 42 * state.scale }));
    ctx.save();
    ctx.globalAlpha = 0.6;
    drawPoly(shadow, "rgba(0, 0, 0, 0.42)", null);
    ctx.restore();

    drawPoly([...border, ...lower], rgba([13, 9, 18], 0.96), rgba([82, 63, 93], 0.34), Math.max(1, state.scale));

    const groundGradient = ctx.createRadialGradient(center.x, center.y, 20 * state.scale, center.x, center.y, 620 * state.scale);
    groundGradient.addColorStop(0, "rgba(55, 37, 72, 0.98)");
    groundGradient.addColorStop(0.55, "rgba(38, 29, 48, 0.98)");
    groundGradient.addColorStop(1, "rgba(20, 15, 27, 0.98)");
    drawPoly(border, groundGradient, rgba([168, 133, 188], 0.16), Math.max(1, state.scale));
  }

  function drawCliffFacets() {
    for (let i = 0; i < 76; i += 1) {
      const a = (i / 76) * Math.PI * 2;
      const x = Math.cos(a) * MAP_RX * (0.96 + hash(i + 12) * 0.08);
      const z = Math.sin(a) * MAP_RZ * (0.96 + hash(i + 31) * 0.07);
      if (!inMap(x * 0.94, z * 0.94)) continue;
      const h = terrainHeight(x, z);
      const top = project(x, z, h + 0.04);
      const width = (18 + hash(i + 2) * 30) * state.scale;
      const drop = (30 + hash(i + 5) * 54) * state.scale;
      const slant = (hash(i + 7) - 0.5) * 24 * state.scale;
      const color = mix(palette.stone, [40, 31, 51], hash(i + 9) * 0.55);
      drawPoly(
        [
          { x: top.x - width * 0.45, y: top.y },
          { x: top.x + width * 0.5, y: top.y + 2 * state.scale },
          { x: top.x + width * 0.25 + slant, y: top.y + drop },
          { x: top.x - width * 0.52 + slant * 0.3, y: top.y + drop * 0.82 },
        ],
        rgba(shade(color, -0.24), 0.72),
        rgba([188, 163, 208], 0.08),
        Math.max(0.7, state.scale * 0.7),
      );
    }
  }

  function drawTerrainPatches() {
    drawWorldBlob(-8.4, 4.9, 4.2, 2.4, [44, 78, 48], 0.54, 0.03, 11, palette.acid);
    drawWorldBlob(-5.7, 1.6, 3.1, 1.6, [52, 83, 46], 0.34, 0.04, 13);
    drawWorldBlob(-7.1, -4.8, 4.1, 2.6, [71, 43, 94], 0.48, 0.05, 21, palette.gold);
    drawWorldBlob(7.4, -4.8, 4.5, 2.8, [87, 38, 58], 0.44, 0.05, 25, palette.ruby);
    drawWorldBlob(2.0, -8.1, 2.8, 1.8, [54, 31, 77], 0.42, 0.06, 29, palette.riftHot);
    drawWorldBlob(5.9, 6.5, 4.6, 1.9, [31, 58, 70], 0.38, 0.04, 33, palette.waterHot);
    drawWorldBlob(0, 0, 3.2, 2.2, [24, 11, 39], 0.72, 0.02, 37, palette.riftHot);
  }

  function drawTerrainBrushwork() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < 260; i += 1) {
      const x = -MAP_RX + hash(i + 101) * MAP_RX * 2;
      const z = -MAP_RZ + hash(i + 203) * MAP_RZ * 2;
      if (!inMap(x, z) || waterDistance(x, z) < 0.85 || Math.hypot(x, z) < 2.2) continue;
      const type = terrainType(x, z);
      const h = terrainHeight(x, z) + 0.08;
      const p = project(x, z, h);
      const len = (8 + hash(i + 3) * 28) * state.scale;
      const angle = -0.22 + hash(i + 8) * 0.44;
      let color = [92, 72, 101];
      if (type === "grove") color = [77, 118, 62];
      if (type === "court") color = [117, 83, 126];
      if (type === "dragon") color = [127, 65, 79];
      if (type === "road") color = [156, 119, 96];
      ctx.strokeStyle = rgba(color, 0.12 + hash(i + 6) * 0.14);
      ctx.lineWidth = (0.7 + hash(i + 10) * 2.2) * state.scale;
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle) * len * 0.5, p.y - Math.sin(angle) * len * 0.5);
      ctx.lineTo(p.x + Math.cos(angle) * len * 0.5, p.y + Math.sin(angle) * len * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCentralCraterWalls() {
    for (let i = 0; i < 46; i += 1) {
      const a = (i / 46) * Math.PI * 2;
      const next = ((i + 0.68) / 46) * Math.PI * 2;
      const outer = 2.55 + hash(i + 4) * 0.34;
      const inner = 1.75 + hash(i + 7) * 0.16;
      const x1 = Math.cos(a) * outer;
      const z1 = Math.sin(a) * outer * 0.72;
      const x2 = Math.cos(next) * outer;
      const z2 = Math.sin(next) * outer * 0.72;
      const x3 = Math.cos(next) * inner;
      const z3 = Math.sin(next) * inner * 0.72;
      const x4 = Math.cos(a) * inner;
      const z4 = Math.sin(a) * inner * 0.72;
      const lift = 0.2 + hash(i + 11) * 0.34;
      const color = mix(palette.stone, [53, 39, 67], hash(i + 17) * 0.55);
      drawPoly(
        [
          project(x1, z1, terrainHeight(x1, z1) + lift),
          project(x2, z2, terrainHeight(x2, z2) + lift * 0.95),
          project(x3, z3, terrainHeight(x3, z3) + 0.05),
          project(x4, z4, terrainHeight(x4, z4) + 0.05),
        ],
        rgba(color, 0.9),
        rgba(palette.gold, 0.08),
        Math.max(0.8, state.scale),
      );
    }
  }

  function drawGameCourtDetails() {
    drawEllipseRing(0, 0, 2.95, 2.05, palette.gold, 0.2);
    drawEllipseRing(0, 0, 1.72, 1.18, palette.riftHot, 0.18);

    const spokes = [
      [
        [-2.3, -0.95],
        [-0.9, -0.28],
        [0.1, 0.95],
      ],
      [
        [2.25, -0.75],
        [0.92, -0.1],
        [0.1, 0.92],
      ],
      [
        [-1.95, 1.45],
        [-0.82, 0.8],
        [0.05, 0.5],
      ],
    ];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const spoke of spokes) {
      drawIsoStroke(spoke, 9, palette.riftHot, 0.16, 0.3);
      drawIsoStroke(spoke, 2.2, palette.acid, 0.22, 0.34);
    }
    ctx.restore();
  }

  function drawWorldBase() {
    drawCliffFacets();
    drawMapSilhouette();
    drawTerrainPatches();
    drawTileField();
    drawTerrainBrushwork();
    drawCentralCraterWalls();
    drawGameCourtDetails();
  }

  function drawPaintedMapLayer() {
    const center = project(0, 0, -0.06);
    const size = PAINTED_MAP_SIZE * state.scale;
    const x = center.x - size * 0.5;
    const y = center.y - size * 0.5;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 18 * state.scale;
    ctx.shadowOffsetY = 10 * state.scale;
    ctx.drawImage(paintedMap, x, y, size, size);
    ctx.restore();

    const vignette = ctx.createRadialGradient(center.x, center.y, 120 * state.scale, center.x, center.y, 1260 * state.scale);
    vignette.addColorStop(0, "rgba(42, 12, 75, 0.03)");
    vignette.addColorStop(0.62, "rgba(6, 3, 12, 0)");
    vignette.addColorStop(1, "rgba(2, 1, 5, 0.44)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(center.x, center.y + 18 * state.scale, 5, center.x, center.y + 18 * state.scale, 185 * state.scale);
    glow.addColorStop(0, rgba(palette.riftHot, 0.42));
    glow.addColorStop(0.32, rgba([103, 41, 164], 0.24));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(center.x - 220 * state.scale, center.y - 160 * state.scale, 440 * state.scale, 360 * state.scale);
    ctx.restore();
  }

  function drawGameplayMapLayer() {
    const w = GAMEPLAY_MAP_W * state.scale;
    const h = GAMEPLAY_MAP_H * state.scale;
    const x = state.offsetX - w * 0.5;
    const y = state.offsetY - h * 0.5;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 20 * state.scale;
    ctx.drawImage(gameplayMap, x, y, w, h);
    ctx.restore();

    drawGameplayRiftEffects();
    drawGameplayDepthMotes();
  }

  function drawGameplayRiftEffects() {
    const center = gameplayToScreen(1030, 420, 0);
    const pulse = 0.5 + Math.sin(state.time * 1.8) * 0.5;
    const rx = (168 + pulse * 18) * state.scale;
    const ry = (92 + pulse * 8) * state.scale;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(center.x, center.y, 8 * state.scale, center.x, center.y, rx * 1.35);
    glow.addColorStop(0, rgba(palette.riftHot, 0.2));
    glow.addColorStop(0.45, rgba([91, 20, 142], 0.11));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, rx * 1.15, ry * 1.2, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    for (let i = 0; i < 16; i += 1) {
      const angle = i * 2.399 + state.time * 0.28;
      const inner = 24 + hash(i) * 42;
      const outer = 92 + hash(i + 10) * 92;
      ctx.strokeStyle = rgba(i % 3 === 0 ? palette.acid : palette.riftHot, 0.07 + hash(i + 7) * 0.08);
      ctx.lineWidth = (1.2 + hash(i + 2) * 2.8) * state.scale;
      ctx.beginPath();
      ctx.moveTo(center.x + Math.cos(angle) * inner * state.scale, center.y + Math.sin(angle) * inner * 0.55 * state.scale);
      ctx.bezierCurveTo(
        center.x + Math.cos(angle + 0.7) * outer * 0.55 * state.scale,
        center.y + Math.sin(angle + 0.7) * outer * 0.33 * state.scale,
        center.x + Math.cos(angle + 1.4) * outer * 0.82 * state.scale,
        center.y + Math.sin(angle + 1.4) * outer * 0.5 * state.scale,
        center.x + Math.cos(angle + 1.9) * outer * state.scale,
        center.y + Math.sin(angle + 1.9) * outer * 0.55 * state.scale,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGameplayDepthMotes() {
    const anchors = [
      [650, 330, palette.acid],
      [840, 560, palette.riftHot],
      [1170, 520, palette.acid],
      [1285, 710, palette.acid],
      [450, 610, palette.riftHot],
      [1010, 840, palette.riftHot],
    ];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 34; i += 1) {
      const anchor = anchors[i % anchors.length];
      const driftX = Math.sin(state.time * (0.8 + hash(i) * 0.8) + i) * (18 + hash(i + 2) * 32);
      const driftY = Math.cos(state.time * (0.6 + hash(i + 4) * 0.7) + i * 1.7) * (9 + hash(i + 6) * 18);
      const point = gameplayToScreen(anchor[0] + driftX + (hash(i + 8) - 0.5) * 160, anchor[1] + driftY + (hash(i + 10) - 0.5) * 80, 0);
      const r = (1.1 + hash(i + 12) * 2.2) * state.scale;
      ctx.fillStyle = rgba(anchor[2], 0.12 + hash(i + 13) * 0.16);
      ctx.beginPath();
      ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function clampPaintedCamera() {
    if (!usePaintedAtlas()) return;
    const half = PAINTED_MAP_SIZE * 0.5 * state.scale;
    if (half <= 0) return;
    const padding = state.cameraMode === "game" ? Math.max(state.width, state.height) * 0.38 : 36;
    const minX = state.width - half - padding;
    const maxX = half + padding;
    const minY = state.height - half - padding;
    const maxY = half + padding;
    state.targetOffsetX = clamp(state.targetOffsetX, minX, maxX);
    state.targetOffsetY = clamp(state.targetOffsetY, minY, maxY);
    state.offsetX = clamp(state.offsetX, minX, maxX);
    state.offsetY = clamp(state.offsetY, minY, maxY);
  }

  function clampGameplayCamera() {
    if (!useGameplayScene()) return;
    const halfW = GAMEPLAY_MAP_W * 0.5 * state.scale;
    const halfH = GAMEPLAY_MAP_H * 0.5 * state.scale;

    if (halfW <= state.width * 0.5) {
      state.targetOffsetX = state.width * 0.5;
      state.offsetX = state.width * 0.5;
    } else {
      const minX = state.width - halfW;
      const maxX = halfW;
      state.targetOffsetX = clamp(state.targetOffsetX, minX, maxX);
      state.offsetX = clamp(state.offsetX, minX, maxX);
    }

    if (halfH <= state.height * 0.5) {
      state.targetOffsetY = state.height * 0.5;
      state.offsetY = state.height * 0.5;
    } else {
      const minY = state.height - halfH;
      const maxY = halfH;
      state.targetOffsetY = clamp(state.targetOffsetY, minY, maxY);
      state.offsetY = clamp(state.offsetY, minY, maxY);
    }
  }

  function samplePath(points, samplesPerSegment) {
    const out = [];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      for (let s = 0; s < samplesPerSegment; s += 1) {
        const t = s / samplesPerSegment;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }

  function drawIsoStroke(points, width, color, alpha, heightOffset) {
    const samples = samplePath(points, 18);
    ctx.beginPath();
    for (let i = 0; i < samples.length; i += 1) {
      const point = samples[i];
      const h = terrainHeight(point[0], point[1]) + heightOffset;
      const screen = project(point[0], point[1], h);
      if (i === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    }
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = width * state.scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function routeForLandmark(landmark) {
    if (!landmark || landmark.id === "rift") return null;
    const origin = landmarks[0];
    const bendX = origin.x + (landmark.x - origin.x) * 0.46 + Math.sin(landmark.z) * 0.55;
    const bendZ = origin.z + (landmark.z - origin.z) * 0.46 + Math.cos(landmark.x) * 0.42;
    return [
      [origin.x, origin.z],
      [bendX, bendZ],
      [landmark.x, landmark.z],
    ];
  }

  function drawSelectedRoute() {
    const landmark = selectedLandmark();
    const route = routeForLandmark(landmark);
    if (!route) return;
    const pulse = 0.5 + Math.sin(state.time * 2.4) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawIsoStroke(route, 28, [25, 8, 45], 0.34, 0.22);
    drawIsoStroke(route, 12, palette.riftHot, 0.34 + pulse * 0.18, 0.25);
    drawIsoStroke(route, 3.5, palette.gold, 0.28 + pulse * 0.22, 0.28);

    const samples = samplePath(route, 36);
    for (let i = 0; i < samples.length; i += 11) {
      const t = (i / samples.length + state.time * 0.16) % 1;
      const idx = Math.floor(t * (samples.length - 1));
      const point = samples[idx];
      const h = terrainHeight(point[0], point[1]) + 0.42;
      const screen = project(point[0], point[1], h);
      const size = (2.2 + Math.sin(state.time * 3 + i) * 0.8) * state.scale;
      drawPoly(
        [
          { x: screen.x, y: screen.y - size * 2.4 },
          { x: screen.x + size * 1.8, y: screen.y },
          { x: screen.x, y: screen.y + size * 2.4 },
          { x: screen.x - size * 1.8, y: screen.y },
        ],
        rgba(palette.acid, 0.38),
        null,
      );
    }
    ctx.restore();
  }

  function drawRoads() {
    for (const road of roadPaths) {
      drawIsoStroke(road.points, 56 * road.width, [10, 5, 16], 0.28, 0.08);
      drawIsoStroke(road.points, 38 * road.width, palette.road, 0.85, 0.09);
      drawIsoStroke(road.points, 9 * road.width, palette.gold, 0.3, 0.1);
    }
  }

  function drawRiver() {
    drawIsoStroke(riverPath, 78, [6, 10, 17], 0.45, -0.12);
    drawIsoStroke(riverPath, 60, palette.water, 0.84, -0.1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawIsoStroke(riverPath, 8, palette.waterHot, 0.35 + Math.sin(state.time * 1.6) * 0.08, -0.07);
    ctx.restore();
  }

  function drawRift() {
    const center = project(0, 0, -1.0);
    const ring = [];
    for (let i = 0; i < 90; i += 1) {
      const a = (i / 90) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 5 + state.time * 0.4) * 0.04;
      const x = Math.cos(a) * 2.25 * wobble;
      const z = Math.sin(a) * 1.65 * wobble;
      ring.push(project(x, z, terrainHeight(x, z) + 0.05));
    }

    const gradient = ctx.createRadialGradient(center.x, center.y, 4 * state.scale, center.x, center.y, 160 * state.scale);
    gradient.addColorStop(0, rgba(palette.riftHot, 0.58));
    gradient.addColorStop(0.36, rgba([92, 25, 147], 0.34));
    gradient.addColorStop(1, rgba(palette.void, 0.0));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawPoly(ring, gradient, rgba(palette.riftHot, 0.42), Math.max(1, 1.8 * state.scale));
    for (let i = 0; i < 18; i += 1) {
      const a = i * 2.399 + Math.sin(state.time * 0.7 + i) * 0.04;
      const inner = 0.35 + hash(i) * 0.6;
      const outer = 1.25 + hash(i + 7) * 1.1;
      const p0 = project(Math.cos(a) * inner, Math.sin(a) * inner * 0.7, -1.05);
      const p1 = project(Math.cos(a) * outer, Math.sin(a) * outer * 0.75, -0.45);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = rgba(palette.riftHot, 0.24 + hash(i + 3) * 0.24);
      ctx.lineWidth = (1.1 + hash(i) * 2.2) * state.scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEllipseRing(x, z, rx, rz, color, alpha) {
    const points = [];
    for (let i = 0; i < 76; i += 1) {
      const a = (i / 76) * Math.PI * 2;
      const px = x + Math.cos(a) * rx;
      const pz = z + Math.sin(a) * rz;
      points.push(project(px, pz, terrainHeight(px, pz) + 0.1));
    }
    drawPoly(points, null, rgba(color, alpha), Math.max(1, 1.6 * state.scale));
  }

  function drawShadow(screen, rx, ry, alpha) {
    const g = ctx.createRadialGradient(screen.x, screen.y, 1, screen.x, screen.y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.save();
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y / (ry / rx), rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpire(x, z, scale, color, accent) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.12);
    const s = state.scale * scale;
    drawShadow({ x: base.x, y: base.y + 7 * s }, 34 * s, 14 * s, 0.32);

    const footL = { x: base.x - 20 * s, y: base.y - 2 * s };
    const footR = { x: base.x + 20 * s, y: base.y - 2 * s };
    const midL = { x: base.x - 12 * s, y: base.y - 58 * s };
    const midR = { x: base.x + 12 * s, y: base.y - 58 * s };
    const spine = { x: base.x, y: base.y - 72 * s };
    drawPoly([footL, { x: base.x, y: base.y + 4 * s }, spine, midL], rgba(shade(color, -0.2), 0.96), null);
    drawPoly([footR, { x: base.x, y: base.y + 4 * s }, spine, midR], rgba(shade(color, -0.34), 0.96), null);
    drawPoly([midL, spine, midR, { x: base.x, y: base.y - 46 * s }], rgba(shade(color, 0.08), 0.96), rgba(accent, 0.22), Math.max(1, state.scale));

    drawPoly(
      [
        { x: base.x - 23 * s, y: base.y - 58 * s },
        { x: base.x + 22 * s, y: base.y - 58 * s },
        { x: base.x + 4 * s, y: base.y - 104 * s },
        { x: base.x - 5 * s, y: base.y - 94 * s },
      ],
      rgba(shade(accent, -0.12), 0.92),
      rgba(palette.ink, 0.18),
      Math.max(1, state.scale),
    );

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(accent, 0.52);
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y - 91 * s);
    ctx.lineTo(base.x, base.y - 116 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(palette.gold, 0.86);
    ctx.beginPath();
    ctx.arc(base.x, base.y - 119 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCrystal(x, z, scale) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.1);
    const s = state.scale * scale;
    const glow = 0.42 + Math.sin(state.time * 2 + x) * 0.12;
    drawShadow(base, 18 * s, 8 * s, 0.25);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawPoly(
      [
        { x: base.x, y: base.y - 46 * s },
        { x: base.x + 12 * s, y: base.y - 18 * s },
        { x: base.x + 4 * s, y: base.y + 2 * s },
        { x: base.x - 12 * s, y: base.y - 14 * s },
      ],
      rgba(palette.riftHot, glow),
      rgba(palette.acid, 0.22),
      Math.max(1, state.scale),
    );
    ctx.restore();
  }

  function drawTree(x, z, scale) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.06);
    const s = state.scale * scale;
    drawShadow({ x: base.x, y: base.y + 5 * s }, 22 * s, 9 * s, 0.24);
    ctx.strokeStyle = rgba([39, 24, 28], 0.95);
    ctx.lineWidth = Math.max(1, 4.2 * s);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(base.x + 2 * s, base.y - 34 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(palette.acid, 0.18);
    ctx.lineWidth = Math.max(0.7, 1.2 * s);
    ctx.beginPath();
    ctx.moveTo(base.x + 2 * s, base.y - 22 * s);
    ctx.lineTo(base.x - 14 * s, base.y - 35 * s);
    ctx.moveTo(base.x + 1 * s, base.y - 28 * s);
    ctx.lineTo(base.x + 16 * s, base.y - 45 * s);
    ctx.stroke();
    const foliage = mix(palette.grove, [58, 83, 61], 0.55 + hash2(x, z) * 0.18);
    drawPoly(
      [
        { x: base.x - 8 * s, y: base.y - 66 * s },
        { x: base.x + 24 * s, y: base.y - 31 * s },
        { x: base.x + 3 * s, y: base.y - 19 * s },
        { x: base.x - 24 * s, y: base.y - 25 * s },
      ],
      rgba(foliage, 0.94),
      rgba(palette.acid, 0.08),
      Math.max(0.7, state.scale * 0.7),
    );
    drawPoly(
      [
        { x: base.x + 4 * s, y: base.y - 58 * s },
        { x: base.x + 18 * s, y: base.y - 33 * s },
        { x: base.x + 2 * s, y: base.y - 24 * s },
      ],
      rgba(shade(foliage, -0.28), 0.72),
      null,
      Math.max(0.7, state.scale * 0.7),
    );
  }

  function drawRock(x, z, scale) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.02);
    const s = state.scale * scale;
    drawShadow(base, 18 * s, 8 * s, 0.22);
    drawPoly(
      [
        { x: base.x - 16 * s, y: base.y - 2 * s },
        { x: base.x - 6 * s, y: base.y - 20 * s },
        { x: base.x + 12 * s, y: base.y - 14 * s },
        { x: base.x + 17 * s, y: base.y + 3 * s },
        { x: base.x - 4 * s, y: base.y + 8 * s },
      ],
      rgb(shade(palette.stone, -0.08 + hash2(x, z) * 0.12)),
      rgba(palette.ink, 0.08),
      Math.max(0.8, state.scale * 0.8),
    );
  }

  function drawBanner(x, z, scale, flip) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.08);
    const s = state.scale * scale;
    ctx.strokeStyle = rgba(palette.gold, 0.78);
    ctx.lineWidth = Math.max(1, 2.4 * s);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(base.x, base.y - 50 * s);
    ctx.stroke();
    const dir = flip ? -1 : 1;
    drawPoly(
      [
        { x: base.x, y: base.y - 49 * s },
        { x: base.x + dir * 24 * s, y: base.y - 43 * s },
        { x: base.x + dir * 13 * s, y: base.y - 32 * s },
        { x: base.x + dir * 25 * s, y: base.y - 22 * s },
        { x: base.x, y: base.y - 27 * s },
      ],
      rgb(flip ? palette.ruby : palette.purpleHot || palette.riftHot),
      rgba(palette.gold, 0.28),
      Math.max(1, state.scale),
    );
  }

  function drawDragon(x, z, scale, flip) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.2);
    const s = state.scale * scale;
    const dir = flip ? -1 : 1;

    drawShadow({ x: base.x, y: base.y + 8 * s }, 74 * s, 26 * s, 0.38);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = rgba([17, 10, 24], 0.92);
    ctx.lineWidth = Math.max(3, 13 * s);
    ctx.beginPath();
    ctx.moveTo(base.x - dir * 58 * s, base.y - 12 * s);
    ctx.bezierCurveTo(base.x - dir * 20 * s, base.y - 52 * s, base.x + dir * 20 * s, base.y + 8 * s, base.x + dir * 62 * s, base.y - 32 * s);
    ctx.stroke();

    ctx.strokeStyle = rgba(palette.riftHot, 0.34);
    ctx.lineWidth = Math.max(1, 3 * s);
    ctx.beginPath();
    ctx.moveTo(base.x - dir * 52 * s, base.y - 13 * s);
    ctx.bezierCurveTo(base.x - dir * 18 * s, base.y - 42 * s, base.x + dir * 24 * s, base.y + 0 * s, base.x + dir * 54 * s, base.y - 28 * s);
    ctx.stroke();

    drawPoly(
      [
        { x: base.x - dir * 10 * s, y: base.y - 40 * s },
        { x: base.x - dir * 44 * s, y: base.y - 96 * s },
        { x: base.x + dir * 18 * s, y: base.y - 62 * s },
      ],
      rgba([23, 13, 31], 0.92),
      rgba(palette.riftHot, 0.3),
      Math.max(1, state.scale),
    );
    drawPoly(
      [
        { x: base.x + dir * 10 * s, y: base.y - 42 * s },
        { x: base.x + dir * 48 * s, y: base.y - 100 * s },
        { x: base.x + dir * 44 * s, y: base.y - 48 * s },
      ],
      rgba([28, 14, 38], 0.92),
      rgba(palette.gold, 0.2),
      Math.max(1, state.scale),
    );

    drawPoly(
      [
        { x: base.x + dir * 58 * s, y: base.y - 38 * s },
        { x: base.x + dir * 82 * s, y: base.y - 50 * s },
        { x: base.x + dir * 70 * s, y: base.y - 24 * s },
      ],
      rgba([16, 9, 24], 0.95),
      rgba(palette.gold, 0.24),
      Math.max(1, state.scale),
    );

    ctx.fillStyle = rgba(palette.gold, 0.86);
    ctx.beginPath();
    ctx.arc(base.x + dir * 70 * s, base.y - 38 * s, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMask(x, z, scale) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.22);
    const s = state.scale * scale;
    drawShadow({ x: base.x, y: base.y + 9 * s }, 38 * s, 15 * s, 0.36);
    ctx.save();
    ctx.translate(base.x, base.y - 38 * s);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.bezierCurveTo(-38, -30, -48, 4, -18, 24);
    ctx.bezierCurveTo(-5, 32, -2, 10, 0, 3);
    ctx.bezierCurveTo(2, 10, 5, 32, 18, 24);
    ctx.bezierCurveTo(48, 4, 38, -30, 0, -32);
    ctx.closePath();
    ctx.fillStyle = rgba([22, 14, 31], 0.94);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.gold, 0.46);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = rgba(palette.ink, 0.08);
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.fillStyle = rgba(palette.riftHot, 0.5);
    ctx.beginPath();
    ctx.ellipse(-15, -4, 7, 3.5, -0.25, 0, Math.PI * 2);
    ctx.ellipse(15, -4, 7, 3.5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(palette.acid, 0.58);
    ctx.beginPath();
    ctx.arc(-36, -28, 4, 0, Math.PI * 2);
    ctx.arc(36, -28, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPillar(x, z, scale) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.1);
    const s = state.scale * scale;
    drawShadow({ x: base.x, y: base.y + 7 * s }, 22 * s, 9 * s, 0.3);
    const topY = base.y - 54 * s;
    drawPoly(
      [
        { x: base.x - 10 * s, y: base.y },
        { x: base.x + 10 * s, y: base.y },
        { x: base.x + 8 * s, y: topY + 5 * s },
        { x: base.x - 8 * s, y: topY },
      ],
      rgba([72, 69, 82], 0.92),
      rgba(palette.riftHot, 0.13),
      Math.max(0.8, state.scale),
    );
    drawPoly(
      [
        { x: base.x - 14 * s, y: topY + 4 * s },
        { x: base.x + 7 * s, y: topY - 2 * s },
        { x: base.x + 15 * s, y: topY + 9 * s },
        { x: base.x - 4 * s, y: topY + 15 * s },
      ],
      rgba([91, 86, 99], 0.92),
      rgba(palette.gold, 0.12),
      Math.max(0.8, state.scale),
    );
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(palette.riftHot, 0.28);
    ctx.lineWidth = Math.max(1, 1.3 * s);
    ctx.beginPath();
    ctx.moveTo(base.x - 3 * s, base.y - 5 * s);
    ctx.lineTo(base.x + 4 * s, topY + 9 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawDragonBone(x, z, scale, flip) {
    const h = terrainHeight(x, z);
    const base = project(x, z, h + 0.12);
    const s = state.scale * scale;
    const dir = flip ? -1 : 1;
    drawShadow({ x: base.x, y: base.y + 6 * s }, 34 * s, 12 * s, 0.26);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = rgba([178, 158, 138], 0.78);
    ctx.lineWidth = Math.max(2, 6 * s);
    ctx.beginPath();
    ctx.moveTo(base.x - dir * 34 * s, base.y - 6 * s);
    ctx.bezierCurveTo(base.x - dir * 12 * s, base.y - 48 * s, base.x + dir * 22 * s, base.y - 42 * s, base.x + dir * 38 * s, base.y - 12 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(palette.gold, 0.24);
    ctx.lineWidth = Math.max(1, 1.5 * s);
    for (let i = -2; i <= 2; i += 1) {
      const px = base.x + dir * i * 12 * s;
      ctx.beginPath();
      ctx.moveTo(px, base.y - 22 * s);
      ctx.lineTo(px + dir * 9 * s, base.y - 42 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMarker(landmark) {
    const h = terrainHeight(landmark.x, landmark.z);
    const base = useGameplayScene()
      ? gameplayToScreen(landmarkGameplayPoint(landmark).x, landmarkGameplayPoint(landmark).y, 22 * landmark.scale)
      : project(landmark.x, landmark.z, h + 0.14);
    const s = state.scale * landmark.scale * (useGameplayScene() ? 0.72 : 1);
    const selected = landmark.id === state.selectedId;
    const hovered = landmark.id === state.hoverId;
    const pulse = 0.5 + Math.sin(state.time * 2.2) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(selected ? palette.gold : hovered ? palette.acid : palette.riftHot, selected ? 0.72 : hovered ? 0.58 : 0.38);
    ctx.lineWidth = Math.max(1, (selected ? 3 : hovered ? 2.4 : 1.8) * s);
    ctx.beginPath();
    ctx.ellipse(base.x, base.y + 3 * s, (28 + pulse * (selected || hovered ? 10 : 8)) * s, (12 + pulse * 3) * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function shouldDrawSceneMarker(landmark) {
    if (usePaintedAtlas() || state.cameraMode !== "game") return true;
    if (landmark.id === state.selectedId || landmark.id === state.hoverId) return true;
    const view = currentViewWorld();
    const distance = Math.hypot(landmark.x - view.x, landmark.z - view.z);
    return state.scale > 1.7 && distance < 3.8;
  }

  function buildTiles() {
    tiles.length = 0;
    for (let z = -12; z <= 12; z += 1) {
      for (let x = -16; x <= 16; x += 1) {
        if (!inMap(x, z)) continue;
        const h = terrainHeight(x, z);
        const type = terrainType(x, z);
        tiles.push({
          x,
          z,
          h,
          type,
          color: terrainColor(x, z, h, type),
          edge: Math.sqrt((x * x) / (MAP_RX * MAP_RX) + (z * z) / (MAP_RZ * MAP_RZ)),
          depth: x + z,
        });
      }
    }
    tiles.sort((a, b) => a.depth - b.depth);
  }

  function addProp(kind, x, z, scale, options) {
    props.push({ kind, x, z, scale, options: options || {}, depth: x + z });
  }

  function buildProps() {
    props.length = 0;

    for (let i = 0; i < 150; i += 1) {
      const x = -13 + hash(i + 1) * 26;
      const z = -10 + hash(i + 3) * 20;
      if (!inMap(x, z)) continue;
      if (roadDistance(x, z) < 0.55 || waterDistance(x, z) < 1.05 || Math.hypot(x, z) < 2.7) continue;
      const type = terrainType(x, z);
      if (type === "dragon" && hash(i + 6) < 0.55) addProp("rock", x, z, 0.62 + hash(i + 8) * 0.62);
      else if (type === "court" && hash(i + 4) < 0.34) addProp("banner", x, z, 0.58 + hash(i) * 0.32, { flip: hash(i + 9) > 0.5 });
      else if (hash(i + 2) > 0.38) addProp("tree", x, z, 0.48 + hash(i + 7) * 0.48);
      else addProp("rock", x, z, 0.45 + hash(i + 8) * 0.45);
    }

    for (let i = 0; i < 32; i += 1) {
      const a = i * 2.399;
      const r = 1.7 + hash(i + 2) * 1.5;
      addProp("crystal", Math.cos(a) * r, Math.sin(a) * r * 0.78, 0.48 + hash(i) * 0.45);
    }

    for (let i = 0; i < 26; i += 1) {
      const a = (i / 26) * Math.PI * 2;
      if (hash(i + 40) < 0.18) continue;
      const r = 2.55 + hash(i + 41) * 0.78;
      addProp("pillar", Math.cos(a) * r, Math.sin(a) * r * 0.76, 0.52 + hash(i + 42) * 0.42);
    }

    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2 + hash(i + 130) * 0.18;
      const r = 3.05 + hash(i + 131) * 0.75;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r * 0.72;
      if (i % 3 === 0) addProp("spire", x, z, 0.56 + hash(i + 132) * 0.34, { color: [46, 28, 62], accent: palette.gold });
      else if (i % 3 === 1) addProp("banner", x, z, 0.48 + hash(i + 133) * 0.3, { flip: hash(i + 134) > 0.5 });
      else addProp("rock", x, z, 0.58 + hash(i + 135) * 0.34);
    }

    for (let i = 0; i < 16; i += 1) {
      const a = i * 2.399;
      const r = 0.7 + hash(i + 61) * 2.4;
      addProp("bone", 7.4 + Math.cos(a) * r, -4.9 + Math.sin(a) * r * 0.72, 0.52 + hash(i + 62) * 0.46, { flip: hash(i + 63) > 0.5 });
    }

    addProp("spire", -7.2, -4.8, 1.08, { color: palette.court, accent: palette.gold });
    addProp("mask", -6.4, -4.1, 0.48);
    addProp("mask", -1.35, 0.45, 0.4);
    addProp("mask", 1.45, 0.35, 0.38);
    addProp("dragon", 7.4, -4.9, 0.9, { flip: true });
    addProp("dragon", 2.2, -8.0, 0.74, { flip: false });
    addProp("spire", 2.2, -8.0, 0.96, { color: [46, 26, 64], accent: palette.riftHot });
    addProp("spire", -8.6, 4.9, 0.86, { color: [45, 33, 58], accent: palette.acid });
    addProp("spire", -9.5, 4.4, 0.7, { color: [45, 33, 58], accent: palette.gold });
    addProp("banner", 5.8, 6.6, 0.75, { flip: false });
    addProp("rock", 6.6, 6.0, 1.0);

    props.sort((a, b) => a.depth - b.depth);
  }

  function drawProp(prop) {
    if (prop.kind === "tree") drawTree(prop.x, prop.z, prop.scale);
    else if (prop.kind === "rock") drawRock(prop.x, prop.z, prop.scale);
    else if (prop.kind === "crystal") drawCrystal(prop.x, prop.z, prop.scale);
    else if (prop.kind === "banner") drawBanner(prop.x, prop.z, prop.scale, prop.options.flip);
    else if (prop.kind === "dragon") drawDragon(prop.x, prop.z, prop.scale, prop.options.flip);
    else if (prop.kind === "spire") drawSpire(prop.x, prop.z, prop.scale, prop.options.color, prop.options.accent);
    else if (prop.kind === "mask") drawMask(prop.x, prop.z, prop.scale);
    else if (prop.kind === "pillar") drawPillar(prop.x, prop.z, prop.scale);
    else if (prop.kind === "bone") drawDragonBone(prop.x, prop.z, prop.scale, prop.options.flip);
  }

  function renderBackground() {
    ctx.clearRect(0, 0, state.width, state.height);
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.46;
    const g = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(state.width, state.height) * 0.7);
    g.addColorStop(0, "rgba(44, 18, 71, 0.62)");
    g.addColorStop(0.45, "rgba(7, 4, 13, 0.94)");
    g.addColorStop(1, "rgba(2, 1, 4, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 56; i += 1) {
      const x = hash(i + 21) * state.width;
      const y = hash(i + 37) * state.height;
      const r = 0.8 + hash(i + 9) * 1.6;
      ctx.fillStyle = i % 3 === 0 ? rgba(palette.gold, 0.46) : rgba(palette.riftHot, 0.35);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawForegroundVeil() {
    const top = ctx.createLinearGradient(0, 0, 0, state.height);
    top.addColorStop(0, "rgba(2, 1, 5, 0.18)");
    top.addColorStop(0.22, "rgba(2, 1, 5, 0)");
    top.addColorStop(0.78, "rgba(2, 1, 5, 0)");
    top.addColorStop(1, "rgba(2, 1, 5, 0.34)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 18; i += 1) {
      const drift = (state.time * (14 + i * 0.8) + hash(i) * state.width) % (state.width + 220);
      const y = state.height * (0.24 + hash(i + 17) * 0.54);
      ctx.strokeStyle = i % 3 === 0 ? rgba(palette.waterHot, 0.08) : rgba(palette.riftHot, 0.07);
      ctx.lineWidth = (0.8 + hash(i + 4) * 1.4) * state.scale;
      ctx.beginPath();
      ctx.moveTo(drift - 220, y);
      ctx.bezierCurveTo(drift - 120, y - 18, drift - 40, y + 16, drift + 120, y - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function miniProject(x, z) {
    const margin = 14;
    const w = miniCanvas.width - margin * 2;
    const h = miniCanvas.height - margin * 2;
    return {
      x: margin + ((x + MAP_RX) / (MAP_RX * 2)) * w,
      y: margin + ((z + MAP_RZ) / (MAP_RZ * 2)) * h,
    };
  }

  function miniToWorld(x, y) {
    const margin = 14;
    const w = miniCanvas.width - margin * 2;
    const h = miniCanvas.height - margin * 2;
    return {
      x: ((x - margin) / w) * MAP_RX * 2 - MAP_RX,
      z: ((y - margin) / h) * MAP_RZ * 2 - MAP_RZ,
    };
  }

  function drawMiniPath(points, width, color, alpha) {
    miniCtx.beginPath();
    for (let i = 0; i < points.length; i += 1) {
      const point = miniProject(points[i][0], points[i][1]);
      if (i === 0) miniCtx.moveTo(point.x, point.y);
      else miniCtx.lineTo(point.x, point.y);
    }
    miniCtx.strokeStyle = rgba(color, alpha);
    miniCtx.lineWidth = width;
    miniCtx.lineCap = "round";
    miniCtx.lineJoin = "round";
    miniCtx.stroke();
  }

  function currentViewWorld() {
    if (usePaintedAtlas()) {
      const half = PAINTED_MAP_SIZE * 0.5 * state.scale;
      return {
        x: clamp(((state.width * 0.5 - state.offsetX) / half) * MAP_RX, -MAP_RX, MAP_RX),
        z: clamp(((state.height * 0.5 - state.offsetY) / half) * MAP_RZ, -MAP_RZ, MAP_RZ),
      };
    }
    if (useGameplayScene()) {
      const x = GAMEPLAY_MAP_W * 0.5 + (state.width * 0.5 - state.offsetX) / state.scale;
      const y = GAMEPLAY_MAP_H * 0.5 + (state.height * 0.5 - state.offsetY) / state.scale;
      const world = gameplayToWorld(x, y);
      return {
        x: clamp(world.x, -MAP_RX, MAP_RX),
        z: clamp(world.z, -MAP_RZ, MAP_RZ),
      };
    }
    const a = (state.width * 0.5 - state.offsetX) / ((TILE_W * 0.5) * state.scale);
    const b = (state.height * 0.5 - state.offsetY) / ((TILE_H * 0.5) * state.scale);
    return {
      x: clamp((a + b) * 0.5, -MAP_RX, MAP_RX),
      z: clamp((b - a) * 0.5, -MAP_RZ, MAP_RZ),
    };
  }

  function drawMiniMap() {
    miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
    miniCtx.fillStyle = "rgba(3, 2, 7, 0.88)";
    miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

    const center = miniProject(0, 0);
    if (state.paintedMapReady) {
      miniCtx.save();
      miniCtx.globalAlpha = 0.5;
      miniCtx.drawImage(paintedMap, 8, 8, miniCanvas.width - 16, miniCanvas.height - 16);
      miniCtx.restore();
    } else {
      miniCtx.fillStyle = "rgba(55, 37, 74, 0.82)";
      miniCtx.strokeStyle = "rgba(218, 184, 255, 0.18)";
      miniCtx.lineWidth = 1.2;
      miniCtx.beginPath();
      miniCtx.ellipse(center.x, center.y, 104, 60, 0, 0, Math.PI * 2);
      miniCtx.fill();
      miniCtx.stroke();
    }

    miniCtx.strokeStyle = "rgba(218, 184, 255, 0.18)";
    miniCtx.lineWidth = 1.2;
    miniCtx.strokeRect(8, 8, miniCanvas.width - 16, miniCanvas.height - 16);

    drawMiniPath(riverPath, 9, palette.waterHot, 0.28);
    for (const road of roadPaths) drawMiniPath(road.points, 3.5, palette.roadLight, 0.7);

    const activeRoute = routeForLandmark(selectedLandmark());
    if (activeRoute) drawMiniPath(activeRoute, 2.4, palette.gold, 0.74);

    const view = currentViewWorld();
    const viewPoint = miniProject(view.x, view.z);
    miniCtx.strokeStyle = "rgba(185, 239, 114, 0.48)";
    miniCtx.lineWidth = 1.2;
    miniCtx.beginPath();
    miniCtx.arc(viewPoint.x, viewPoint.y, 8, 0, Math.PI * 2);
    miniCtx.stroke();

    for (const landmark of landmarks) {
      const point = miniProject(landmark.x, landmark.z);
      const selected = landmark.id === state.selectedId;
      const hovered = landmark.id === state.hoverId;
      miniCtx.fillStyle = selected ? rgba(palette.gold, 0.95) : hovered ? rgba(palette.acid, 0.92) : rgba(palette.riftHot, 0.78);
      miniCtx.strokeStyle = selected ? rgba(palette.ink, 0.72) : "rgba(8, 4, 12, 0.8)";
      miniCtx.lineWidth = selected ? 2 : 1;
      miniCtx.beginPath();
      miniCtx.moveTo(point.x, point.y - (selected ? 6 : 4));
      miniCtx.lineTo(point.x + (selected ? 6 : 4), point.y);
      miniCtx.lineTo(point.x, point.y + (selected ? 6 : 4));
      miniCtx.lineTo(point.x - (selected ? 6 : 4), point.y);
      miniCtx.closePath();
      miniCtx.fill();
      miniCtx.stroke();
    }
  }

  function render() {
    state.time += 0.016;
    state.offsetX += (state.targetOffsetX - state.offsetX) * 0.1;
    state.offsetY += (state.targetOffsetY - state.offsetY) * 0.1;
    clampPaintedCamera();
    clampGameplayCamera();

    renderBackground();

    const paintedAtlas = usePaintedAtlas();
    const gameplayScene = useGameplayScene();
    if (paintedAtlas) {
      drawPaintedMapLayer();
    } else if (gameplayScene) {
      drawGameplayMapLayer();
    } else {
      drawWorldBase();
      drawRiver();
      drawRoads();
    }
    if (!gameplayScene) drawSelectedRoute();

    if (!paintedAtlas && !gameplayScene) {
      drawEllipseRing(0, 0, 2.75, 1.95, palette.gold, 0.26);
      drawRift();
    }

    if (!paintedAtlas && !gameplayScene) {
      for (const prop of props) drawProp(prop);
    }
    for (const landmark of landmarks) {
      if (shouldDrawSceneMarker(landmark)) drawMarker(landmark);
    }
    drawForegroundVeil();
    updateLabels();
    drawMiniMap();

    requestAnimationFrame(render);
  }

  function selectedLandmark() {
    return landmarks.find((landmark) => landmark.id === state.selectedId) || landmarks[0];
  }

  function updateInspector() {
    const landmark = selectedLandmark();
    ui.name.textContent = landmark.name;
    ui.type.textContent = landmark.type;
    ui.effect.textContent = landmark.effect || "";
    ui.copy.textContent = landmark.copy;
    for (const item of landmarks) {
      const label = labels.get(item.id);
      if (label) label.classList.toggle("selected", item.id === state.selectedId);
    }
  }

  function focusLandmark(landmark) {
    if (usePaintedAtlas()) {
      const half = PAINTED_MAP_SIZE * 0.5 * state.scale;
      const targetX = state.cameraMode === "game" ? state.width * 0.48 : state.width * 0.5;
      const targetY = state.cameraMode === "game" ? state.height * 0.58 : state.height * 0.5;
      state.targetOffsetX = targetX - (landmark.x / MAP_RX) * half;
      state.targetOffsetY = targetY - (landmark.z / MAP_RZ) * half;
      clampPaintedCamera();
      return;
    }
    if (useGameplayScene()) {
      const point = landmarkGameplayPoint(landmark);
      const targetX = state.width * 0.52;
      const targetY = state.height * 0.42;
      state.targetOffsetX = targetX - (point.x - GAMEPLAY_MAP_W * 0.5) * state.scale;
      state.targetOffsetY = targetY - (point.y - GAMEPLAY_MAP_H * 0.5) * state.scale;
      clampGameplayCamera();
      return;
    }
    const h = terrainHeight(landmark.x, landmark.z);
    const targetX = state.cameraMode === "game" ? state.width * 0.52 : state.width * 0.5;
    const targetY = state.cameraMode === "game" ? state.height * 0.48 : state.height * 0.52;
    state.targetOffsetX = targetX - (landmark.x - landmark.z) * (TILE_W * 0.5) * state.scale;
    state.targetOffsetY = targetY - (landmark.x + landmark.z) * (TILE_H * 0.5) * state.scale + h * HEIGHT * state.scale;
  }

  function selectLandmark(id, shouldFocus) {
    state.selectedId = id;
    updateInspector();
    if (shouldFocus) focusLandmark(selectedLandmark());
  }

  function cycleLandmark() {
    const index = landmarks.findIndex((landmark) => landmark.id === state.selectedId);
    const next = landmarks[(index + 1) % landmarks.length];
    selectLandmark(next.id, true);
  }

  function resetView() {
    if (useGameplayScene()) {
      state.scale = Math.min(1.14, Math.max(0.76, gameplayCoverScale() * 1.08));
    } else if (state.cameraMode === "game") {
      const shortSide = Math.min(state.width, state.height);
      state.scale = Math.min(1.36, Math.max(1.04, shortSide / 340));
    } else {
      state.scale = Math.min(0.74, Math.max(0.48, state.width / 1760));
    }
    state.offsetX = state.width * 0.5;
    state.offsetY = state.cameraMode === "game" ? state.height * 0.38 : state.height * 0.5;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
  }

  function updateCameraButton() {
    if (!ui.camera) return;
    ui.camera.textContent = state.cameraMode === "game" ? "Atlas" : "Vue jeu";
    ui.camera.title = state.cameraMode === "game" ? "Passer en atlas" : "Passer en vue jeu";
    ui.camera.setAttribute("aria-label", state.cameraMode === "game" ? "Passer en atlas" : "Passer en vue jeu");
    document.body.dataset.camera = state.cameraMode;
  }

  function toggleCameraMode() {
    state.cameraMode = state.cameraMode === "game" ? "atlas" : "game";
    updateCameraButton();
    resetView();
    focusLandmark(selectedLandmark());
    updateLabels();
  }

  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function zoomAt(point, nextScale) {
    const oldScale = state.scale;
    const minScale = useGameplayScene() ? gameplayCoverScale() : state.cameraMode === "game" ? 0.52 : 0.38;
    const maxScale = useGameplayScene() ? 2.08 : state.cameraMode === "game" ? 2.45 : 1.35;
    state.scale = clamp(nextScale, minScale, maxScale);
    const ratio = state.scale / oldScale;
    state.offsetX = point.x - (point.x - state.offsetX) * ratio;
    state.offsetY = point.y - (point.y - state.offsetY) * ratio;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    clampPaintedCamera();
    clampGameplayCamera();
    updateLabels();
  }

  function pointerPair() {
    const points = Array.from(activePointers.values());
    return points.length >= 2 ? [points[0], points[1]] : null;
  }

  function pinchMetrics() {
    const pair = pointerPair();
    if (!pair) return null;
    const [a, b] = pair;
    return {
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      center: {
        x: (a.x + b.x) * 0.5,
        y: (a.y + b.y) * 0.5,
      },
    };
  }

  function beginPinch() {
    const metrics = pinchMetrics();
    if (!metrics) return;
    pinch.active = true;
    pinch.lastDistance = metrics.distance;
    pinch.lastCenterX = metrics.center.x;
    pinch.lastCenterY = metrics.center.y;
    state.dragging = false;
    state.moved = true;
  }

  function updatePinch() {
    const metrics = pinchMetrics();
    if (!metrics) return;
    if (!pinch.active) beginPinch();
    state.offsetX += metrics.center.x - pinch.lastCenterX;
    state.offsetY += metrics.center.y - pinch.lastCenterY;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    zoomAt(metrics.center, state.scale * (metrics.distance / pinch.lastDistance));
    pinch.lastDistance = metrics.distance;
    pinch.lastCenterX = metrics.center.x;
    pinch.lastCenterY = metrics.center.y;
  }

  function resumeDragAfterPinch() {
    pinch.active = false;
    if (activePointers.size !== 1) {
      state.dragging = false;
      return;
    }
    const point = Array.from(activePointers.values())[0];
    state.dragging = true;
    state.moved = true;
    state.pointerStartX = point.x;
    state.pointerStartY = point.y;
    state.lastX = point.x;
    state.lastY = point.y;
  }

  function touchToCanvas(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function touchMetrics(touches) {
    if (touches.length < 2) return null;
    const a = touchToCanvas(touches[0]);
    const b = touchToCanvas(touches[1]);
    return {
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      center: {
        x: (a.x + b.x) * 0.5,
        y: (a.y + b.y) * 0.5,
      },
    };
  }

  function beginTouchPan(touch) {
    const point = touchToCanvas(touch);
    touchGesture.mode = "pan";
    touchGesture.moved = false;
    touchGesture.startX = point.x;
    touchGesture.startY = point.y;
    touchGesture.lastX = point.x;
    touchGesture.lastY = point.y;
    state.dragging = true;
    state.moved = false;
  }

  function beginTouchPinch(touches) {
    const metrics = touchMetrics(touches);
    if (!metrics) return;
    touchGesture.mode = "pinch";
    touchGesture.moved = true;
    touchGesture.lastDistance = metrics.distance;
    touchGesture.lastCenterX = metrics.center.x;
    touchGesture.lastCenterY = metrics.center.y;
    state.dragging = false;
    state.moved = true;
  }

  function updateTouchPan(touch) {
    const point = touchToCanvas(touch);
    const dx = point.x - touchGesture.lastX;
    const dy = point.y - touchGesture.lastY;
    if (Math.hypot(point.x - touchGesture.startX, point.y - touchGesture.startY) > 6) {
      touchGesture.moved = true;
      state.moved = true;
    }
    state.offsetX += dx;
    state.offsetY += dy;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    clampPaintedCamera();
    clampGameplayCamera();
    touchGesture.lastX = point.x;
    touchGesture.lastY = point.y;
  }

  function updateTouchPinch(touches) {
    const metrics = touchMetrics(touches);
    if (!metrics) return;
    if (touchGesture.mode !== "pinch") beginTouchPinch(touches);
    state.offsetX += metrics.center.x - touchGesture.lastCenterX;
    state.offsetY += metrics.center.y - touchGesture.lastCenterY;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    zoomAt(metrics.center, state.scale * (metrics.distance / touchGesture.lastDistance));
    touchGesture.lastDistance = metrics.distance;
    touchGesture.lastCenterX = metrics.center.x;
    touchGesture.lastCenterY = metrics.center.y;
  }

  function resetTouchGesture() {
    touchGesture.mode = "none";
    touchGesture.moved = false;
    state.dragging = false;
  }

  function resetInputState() {
    activePointers.clear();
    pinch.active = false;
    resetTouchGesture();
    state.hoverId = null;
    canvas.style.cursor = "grab";
  }

  function pickLandmark(x, y) {
    let best = null;
    let bestDistance = 52 * state.scale;
    for (const landmark of landmarks) {
      const h = terrainHeight(landmark.x, landmark.z);
      const p = useGameplayScene()
        ? gameplayToScreen(landmarkGameplayPoint(landmark).x, landmarkGameplayPoint(landmark).y, 18 * landmark.scale)
        : project(landmark.x, landmark.z, h + 0.5);
      const distance = Math.hypot(x - p.x, y - p.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = landmark;
      }
    }
    return best;
  }

  function nearestLandmarkAtWorld(x, z) {
    let best = landmarks[0];
    let bestDistance = Infinity;
    for (const landmark of landmarks) {
      const distance = Math.hypot(x - landmark.x, z - landmark.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = landmark;
      }
    }
    return best;
  }

  function updateLabels() {
    const view = currentViewWorld();
    for (const landmark of landmarks) {
      const h = terrainHeight(landmark.x, landmark.z);
      const p = useGameplayScene()
        ? gameplayToScreen(landmarkGameplayPoint(landmark).x, landmarkGameplayPoint(landmark).y, 58 * landmark.scale)
        : project(landmark.x, landmark.z, h + 1.35 * landmark.scale);
      const label = labels.get(landmark.id);
      if (!label) continue;
      const selected = landmark.id === state.selectedId;
      const hovered = landmark.id === state.hoverId;
      const onScreen = p.x > -80 && p.x < state.width + 80 && p.y > -80 && p.y < state.height + 80;
      const nearCamera = Math.hypot(landmark.x - view.x, landmark.z - view.z) < 4.2;
      const visibleByMode = state.cameraMode === "atlas" || selected || hovered || (state.scale > 1.58 && nearCamera);
      label.style.left = `${p.x}px`;
      label.style.top = `${p.y}px`;
      label.classList.toggle("visible", onScreen && visibleByMode);
      label.classList.toggle("selected", selected);
      label.classList.toggle("hovered", hovered);
    }
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    resetView();
    focusLandmark(selectedLandmark());
  }

  function createLabels() {
    labelsRoot.innerHTML = "";
    for (const landmark of landmarks) {
      const label = document.createElement("div");
      label.className = "map-label";
      label.textContent = landmark.name;
      labelsRoot.appendChild(label);
      labels.set(landmark.id, label);
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    const point = pointerToCanvas(event);
    activePointers.set(event.pointerId, point);
    state.dragging = true;
    state.moved = false;
    state.pointerStartX = point.x;
    state.pointerStartY = point.y;
    state.lastX = point.x;
    state.lastY = point.y;
    canvas.setPointerCapture(event.pointerId);
    if (activePointers.size >= 2) beginPinch();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const point = pointerToCanvas(event);
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, point);
      if (activePointers.size >= 2) {
        updatePinch();
        return;
      }
    }
    if (!state.dragging) {
      const hit = pickLandmark(point.x, point.y);
      state.hoverId = hit ? hit.id : null;
      canvas.style.cursor = hit ? "pointer" : "grab";
      return;
    }
    const dx = point.x - state.lastX;
    const dy = point.y - state.lastY;
    if (Math.hypot(point.x - state.pointerStartX, point.y - state.pointerStartY) > 5) state.moved = true;
    state.offsetX += dx;
    state.offsetY += dy;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    clampGameplayCamera();
    state.lastX = point.x;
    state.lastY = point.y;
  });

  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    if (!activePointers.has(event.pointerId)) {
      state.hoverId = null;
      canvas.style.cursor = "grab";
    }
  });

  function endPointer(event, shouldSelect) {
    if (event.pointerType === "touch") return;
    const point = pointerToCanvas(event);
    const wasPinching = pinch.active || activePointers.size >= 2;
    activePointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (wasPinching) {
      resumeDragAfterPinch();
      return;
    }
    state.dragging = false;
    if (shouldSelect && !state.moved) {
      const hit = pickLandmark(point.x, point.y);
      if (hit) selectLandmark(hit.id, true);
    }
  }

  canvas.addEventListener("pointerup", (event) => {
    endPointer(event, true);
  });

  canvas.addEventListener("pointercancel", (event) => {
    endPointer(event, false);
  });

  canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (event.touches.length >= 2) {
      beginTouchPinch(event.touches);
      return;
    }
    if (event.touches.length === 1) beginTouchPan(event.touches[0]);
  }, { passive: false });

  canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (event.touches.length >= 2) {
      updateTouchPinch(event.touches);
      return;
    }
    if (event.touches.length === 1 && touchGesture.mode === "pan") updateTouchPan(event.touches[0]);
  }, { passive: false });

  canvas.addEventListener("touchend", (event) => {
    event.preventDefault();
    if (event.touches.length >= 2) {
      beginTouchPinch(event.touches);
      return;
    }
    if (event.touches.length === 1) {
      beginTouchPan(event.touches[0]);
      touchGesture.moved = true;
      return;
    }
    if (touchGesture.mode === "pan" && !touchGesture.moved) {
      const hit = pickLandmark(touchGesture.lastX, touchGesture.lastY);
      if (hit) selectLandmark(hit.id, true);
    }
    resetTouchGesture();
  }, { passive: false });

  canvas.addEventListener("touchcancel", (event) => {
    event.preventDefault();
    resetTouchGesture();
  }, { passive: false });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = pointerToCanvas(event);
    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    zoomAt(point, state.scale * zoomFactor);
  }, { passive: false });

  miniCanvas.addEventListener("click", (event) => {
    const rect = miniCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * miniCanvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * miniCanvas.height;
    const world = miniToWorld(x, y);
    const landmark = nearestLandmarkAtWorld(world.x, world.z);
    selectLandmark(landmark.id, true);
  });

  miniCanvas.addEventListener("pointermove", (event) => {
    const rect = miniCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * miniCanvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * miniCanvas.height;
    const world = miniToWorld(x, y);
    const landmark = nearestLandmarkAtWorld(world.x, world.z);
    state.hoverId = landmark ? landmark.id : null;
  });

  miniCanvas.addEventListener("pointerleave", () => {
    state.hoverId = null;
  });

  ui.reset.addEventListener("click", () => {
    resetView();
    focusLandmark(selectedLandmark());
  });

  ui.camera.addEventListener("click", toggleCameraMode);
  ui.cycle.addEventListener("click", cycleLandmark);

  window.addEventListener("keydown", (event) => {
    const step = 42;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.targetOffsetX += step;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.targetOffsetX -= step;
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") state.targetOffsetY += step;
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") state.targetOffsetY -= step;
    if (event.key.toLowerCase() === "r") {
      resetView();
      focusLandmark(selectedLandmark());
    }
    if (event.key.toLowerCase() === "g" || event.key.toLowerCase() === "v") toggleCameraMode();
    if (event.key.toLowerCase() === "n") cycleLandmark();
  });

  window.addEventListener("resize", resize);
  window.addEventListener("blur", resetInputState);
  window.addEventListener("orientationchange", resetInputState);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetInputState();
  });

  buildTiles();
  buildProps();
  createLabels();
  updateInspector();
  updateCameraButton();
  resize();
  render();
})();
