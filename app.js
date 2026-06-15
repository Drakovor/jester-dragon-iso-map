(function () {
  const canvas = document.getElementById("iso-map");
  const ctx = canvas.getContext("2d");
  const miniCanvas = document.getElementById("mini-map");
  const miniCtx = miniCanvas.getContext("2d");
  const labelsRoot = document.getElementById("labels");
  const paintedMap = new Image();

  const ui = {
    reset: document.getElementById("reset-view"),
    cycle: document.getElementById("cycle-point"),
    name: document.getElementById("place-name"),
    type: document.getElementById("place-type"),
    copy: document.getElementById("place-copy"),
  };

  const TILE_W = 78;
  const TILE_H = 39;
  const HEIGHT = 28;
  const MAP_RX = 14.2;
  const MAP_RZ = 10.8;

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
      name: "Faille Rieuse",
      type: "objectif central",
      x: 0,
      z: 0,
      scale: 1.1,
      copy: "Une blessure violette sous la cour, cerclée de masques brises et de pierre draconique.",
    },
    {
      id: "jester-throne",
      name: "Trone du Bouffon",
      type: "citadelle masquee",
      x: -7.2,
      z: -4.8,
      scale: 1,
      copy: "Un balcon de damier noir et or ou les tours portent des cloches et des pointes.",
    },
    {
      id: "wyrm-nest",
      name: "Nid des Wyrms",
      type: "antre dragon",
      x: 7.4,
      z: -4.9,
      scale: 1,
      copy: "Des os de dragon forment une couronne autour d'un nid chaud, rouge et violet.",
    },
    {
      id: "bell-gate",
      name: "Porte des Cloches",
      type: "entree nord",
      x: -8.6,
      z: 4.9,
      scale: 0.9,
      copy: "Deux arches tordues gardent la route; chaque chaine finit par une cloche doree.",
    },
    {
      id: "mirror-river",
      name: "Riviere Miroir",
      type: "passage sombre",
      x: 5.8,
      z: 6.6,
      scale: 0.9,
      copy: "Une eau bleu-noir renvoie les masques a l'envers et cache les dalles cassees.",
    },
    {
      id: "black-drake",
      name: "Spire du Drake",
      type: "vigie volante",
      x: 2.2,
      z: -8.0,
      scale: 0.95,
      copy: "Une tour mince ou l'ombre d'un dragon tourne au-dessus des bannieres violettes.",
    },
  ];

  const roadPaths = [
    {
      width: 0.75,
      points: [
        [-12.3, 5.7],
        [-8.4, 4.5],
        [-4.2, 2.0],
        [-1.2, 0.4],
        [0, 0],
        [3.2, -1.3],
        [7.7, -3.4],
        [12.1, -5.0],
      ],
    },
    {
      width: 0.68,
      points: [
        [-10.7, -5.8],
        [-6.5, -3.6],
        [-2.6, -1.4],
        [0, 0],
        [3.8, 1.8],
        [8.4, 4.1],
        [11.2, 6.5],
      ],
    },
    {
      width: 0.48,
      points: [
        [-10.2, 0.0],
        [-6.4, 0.5],
        [-2.4, 0.6],
        [0, 0],
        [3.3, 0.5],
        [7.7, 0.0],
        [11.2, -0.6],
      ],
    },
  ];

  const riverPath = [
    [-11.8, 7.6],
    [-7.5, 8.4],
    [-2.3, 7.5],
    [2.6, 7.8],
    [6.6, 6.6],
    [11.4, 6.9],
  ];

  const props = [];
  const labels = new Map();
  const tiles = [];

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
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
  };

  paintedMap.addEventListener("load", () => {
    state.paintedMapReady = true;
  });
  paintedMap.src = "./assets/jester-dragon-painted-map.png";

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
    color = mix(color, [50, 35, 61], hash2(x, z) * 0.18);

    if (type === "road") {
      color = mix(palette.road, palette.roadLight, hash2(x * 2, z * 2) * 0.32);
    } else if (type === "water") {
      color = mix(palette.water, palette.waterHot, hash2(x, z) * 0.2);
    } else if (type === "rift") {
      color = mix(palette.rift, [81, 19, 117], hash2(x, z) * 0.32);
    } else if (type === "court") {
      const checker = (Math.round(x) + Math.round(z)) % 2 === 0;
      color = mix(checker ? palette.court : palette.courtAlt, palette.gold, checker ? 0.06 : 0.02);
    } else if (type === "dragon") {
      color = mix(palette.dragon, [96, 48, 62], hash2(x, z) * 0.34);
    } else if (type === "grove") {
      color = mix(palette.grove, palette.acid, hash2(x, z) * 0.12);
    }

    return color;
  }

  function project(x, z, h) {
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
    const isCliff = tile.edge > 0.82 || h > 0.46;
    const sideDepth = (isCliff ? 8 + Math.max(0, h) * 8 : 3) * state.scale;
    const bottomDrop = { x: bottom.x, y: bottom.y + sideDepth };
    const rightDrop = { x: right.x, y: right.y + sideDepth };
    const leftDrop = { x: left.x, y: left.y + sideDepth };
    const color = tile.color;

    if (tile.type !== "water" && isCliff) {
      drawPoly([left, bottom, bottomDrop, leftDrop], rgba(shade(color, -0.24), 0.86), null);
      drawPoly([bottom, right, rightDrop, bottomDrop], rgba(shade(color, -0.36), 0.9), null);
    }

    drawPoly(
      [top, right, bottom, left],
      rgb(color),
      rgba(tile.type === "rift" ? palette.riftHot : palette.ink, tile.type === "water" ? 0.04 : 0.028),
      Math.max(0.35, 0.52 * state.scale),
    );

    if (tile.type === "water") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawPoly([top, right, bottom, left], rgba(palette.waterHot, 0.09 + Math.sin(state.time + x) * 0.025), null);
      ctx.restore();
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

  function drawWorldBase() {
    drawCliffFacets();
    drawMapSilhouette();
    drawTerrainPatches();
    drawTerrainBrushwork();
    drawCentralCraterWalls();
  }

  function drawPaintedMapLayer() {
    const center = project(0, 0, -0.06);
    const backingSize = 2300 * state.scale;
    const backingX = center.x - backingSize * 0.5;
    const backingY = center.y - backingSize * 0.5;
    const size = 1480 * state.scale;
    const x = center.x - size * 0.5;
    const y = center.y - size * 0.5;

    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.filter = `blur(${Math.max(3, 8 * state.scale)}px) saturate(0.86) brightness(0.72)`;
    ctx.drawImage(paintedMap, backingX, backingY, backingSize, backingSize);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 34 * state.scale;
    ctx.shadowOffsetY = 18 * state.scale;
    ctx.drawImage(paintedMap, x, y, size, size);
    ctx.restore();

    const vignette = ctx.createRadialGradient(center.x, center.y, 120 * state.scale, center.x, center.y, 820 * state.scale);
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

  function clampPaintedCamera() {
    if (!state.paintedMapReady) return;
    const half = 740 * state.scale;
    if (half <= 0) return;
    const minX = state.width - half - 28;
    const maxX = half + 28;
    const minY = state.height - half - 42;
    const maxY = half + 42;
    state.targetOffsetX = clamp(state.targetOffsetX, minX, maxX);
    state.targetOffsetY = clamp(state.targetOffsetY, minY, maxY);
    state.offsetX = clamp(state.offsetX, minX, maxX);
    state.offsetY = clamp(state.offsetY, minY, maxY);
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
    const bendX = landmark.x * 0.42 + Math.sin(landmark.z) * 0.7;
    const bendZ = landmark.z * 0.42 + Math.cos(landmark.x) * 0.45;
    return [
      [0, 0],
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

    const body = [
      { x: base.x - 18 * s, y: base.y - 4 * s },
      { x: base.x + 18 * s, y: base.y - 4 * s },
      { x: base.x + 12 * s, y: base.y - 60 * s },
      { x: base.x - 12 * s, y: base.y - 60 * s },
    ];
    drawPoly(body, rgb(shade(color, -0.04)), rgba(accent, 0.25), Math.max(1, state.scale));

    drawPoly(
      [
        { x: base.x - 24 * s, y: base.y - 58 * s },
        { x: base.x + 24 * s, y: base.y - 58 * s },
        { x: base.x, y: base.y - 96 * s },
      ],
      rgb(shade(accent, -0.08)),
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
    drawShadow({ x: base.x, y: base.y + 4 * s }, 18 * s, 8 * s, 0.2);
    ctx.strokeStyle = rgba([69, 43, 31], 0.95);
    ctx.lineWidth = Math.max(1, 5 * s);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(base.x + 2 * s, base.y - 32 * s);
    ctx.stroke();
    drawPoly(
      [
        { x: base.x, y: base.y - 62 * s },
        { x: base.x + 22 * s, y: base.y - 24 * s },
        { x: base.x - 20 * s, y: base.y - 20 * s },
      ],
      rgb(mix(palette.grove, palette.acid, 0.16 + hash2(x, z) * 0.18)),
      rgba(palette.ink, 0.06),
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
    drawShadow({ x: base.x, y: base.y + 9 * s }, 42 * s, 16 * s, 0.34);
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
    ctx.fillStyle = rgba([31, 17, 45], 0.96);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.gold, 0.72);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = rgba(palette.riftHot, 0.76);
    ctx.beginPath();
    ctx.ellipse(-15, -4, 8, 4, -0.25, 0, Math.PI * 2);
    ctx.ellipse(15, -4, 8, 4, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(palette.acid, 0.78);
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
    const base = project(landmark.x, landmark.z, h + 0.14);
    const s = state.scale * landmark.scale;
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

    for (let i = 0; i < 16; i += 1) {
      const a = i * 2.399;
      const r = 0.7 + hash(i + 61) * 2.4;
      addProp("bone", 7.4 + Math.cos(a) * r, -4.9 + Math.sin(a) * r * 0.72, 0.52 + hash(i + 62) * 0.46, { flip: hash(i + 63) > 0.5 });
    }

    addProp("spire", -7.2, -4.8, 1.08, { color: palette.court, accent: palette.gold });
    addProp("mask", -6.4, -4.1, 0.78);
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
    miniCtx.fillStyle = "rgba(55, 37, 74, 0.82)";
    miniCtx.strokeStyle = "rgba(218, 184, 255, 0.18)";
    miniCtx.lineWidth = 1.2;
    miniCtx.beginPath();
    miniCtx.ellipse(center.x, center.y, 104, 60, 0, 0, Math.PI * 2);
    miniCtx.fill();
    miniCtx.stroke();

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

    renderBackground();

    if (state.paintedMapReady) {
      drawPaintedMapLayer();
    } else {
      drawWorldBase();
      drawRiver();
      drawRoads();
    }
    drawSelectedRoute();

    if (!state.paintedMapReady) {
      drawEllipseRing(0, 0, 2.75, 1.95, palette.gold, 0.26);
      drawRift();
    }

    if (!state.paintedMapReady) {
      for (const prop of props) drawProp(prop);
    }
    for (const landmark of landmarks) drawMarker(landmark);
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
    ui.copy.textContent = landmark.copy;
    for (const item of landmarks) {
      const label = labels.get(item.id);
      if (label) label.classList.toggle("selected", item.id === state.selectedId);
    }
  }

  function focusLandmark(landmark) {
    const h = terrainHeight(landmark.x, landmark.z);
    state.targetOffsetX = state.width * 0.5 - (landmark.x - landmark.z) * (TILE_W * 0.5) * state.scale;
    state.targetOffsetY = state.height * 0.52 - (landmark.x + landmark.z) * (TILE_H * 0.5) * state.scale + h * HEIGHT * state.scale;
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
    state.scale = Math.min(1.05, Math.max(0.78, state.width / 1240));
    state.offsetX = state.width * 0.5;
    state.offsetY = state.height * 0.29;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
  }

  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function pickLandmark(x, y) {
    let best = null;
    let bestDistance = 52 * state.scale;
    for (const landmark of landmarks) {
      const h = terrainHeight(landmark.x, landmark.z);
      const p = project(landmark.x, landmark.z, h + 0.5);
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
    for (const landmark of landmarks) {
      const h = terrainHeight(landmark.x, landmark.z);
      const p = project(landmark.x, landmark.z, h + 1.35 * landmark.scale);
      const label = labels.get(landmark.id);
      if (!label) continue;
      label.style.left = `${p.x}px`;
      label.style.top = `${p.y}px`;
      label.classList.toggle("visible", p.x > -80 && p.x < state.width + 80 && p.y > -80 && p.y < state.height + 80);
      label.classList.toggle("selected", landmark.id === state.selectedId);
      label.classList.toggle("hovered", landmark.id === state.hoverId);
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
    const point = pointerToCanvas(event);
    state.dragging = true;
    state.moved = false;
    state.pointerStartX = point.x;
    state.pointerStartY = point.y;
    state.lastX = point.x;
    state.lastY = point.y;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    const point = pointerToCanvas(event);
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
    state.lastX = point.x;
    state.lastY = point.y;
  });

  canvas.addEventListener("pointerleave", () => {
    state.hoverId = null;
    state.dragging = false;
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener("pointerup", (event) => {
    const point = pointerToCanvas(event);
    state.dragging = false;
    if (!state.moved) {
      const hit = pickLandmark(point.x, point.y);
      if (hit) selectLandmark(hit.id, true);
    }
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = pointerToCanvas(event);
    const oldScale = state.scale;
    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    state.scale = clamp(state.scale * zoomFactor, 0.52, 2.2);
    const ratio = state.scale / oldScale;
    state.offsetX = point.x - (point.x - state.offsetX) * ratio;
    state.offsetY = point.y - (point.y - state.offsetY) * ratio;
    state.targetOffsetX = state.offsetX;
    state.targetOffsetY = state.offsetY;
    clampPaintedCamera();
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
    if (event.key.toLowerCase() === "n") cycleLandmark();
  });

  window.addEventListener("resize", resize);

  buildTiles();
  buildProps();
  createLabels();
  updateInspector();
  resize();
  render();
})();
