function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.35;           // Overall width along X
  const H = 0.55;           // Overall height along Y
  const BAR_H = 0.016;      // Top steel bar height
  const BAR_D = 0.012;      // Top steel bar depth
  const BAR_Y = H - BAR_H / 2 - 0.004; // Top bar center Y (leaves room for copper loops at H)
  const GRID_W = 0.32;      // Width of woven copper grid
  const GRID_BOT = 0.036;   // Lowest horizontal strip center Y
  const GRID_TOP = 0.486;   // Highest horizontal strip center Y
  const NUM_V = 10;         // Number of vertical copper strips
  const NUM_H = 11;         // Number of horizontal copper strips
  const STRIP_W = 0.015;    // Width of each copper ribbon
  const STRIP_T = 0.0022;   // Thickness of each copper ribbon
  const WAVE_AMP = 0.0032;  // Half-amplitude of over-under weave in Z
  const WEAVE_Z = 0.006;    // Center Z of the woven plane relative to back

  // Materials
  const copperMatA = new THREE.MeshStandardMaterial({
    color: 0x9c5a38,
    roughness: 0.42,
    metalness: 0.82,
  });
  const copperMatB = new THREE.MeshStandardMaterial({
    color: 0x874b2d,
    roughness: 0.46,
    metalness: 0.80,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.55,
    metalness: 0.75,
  });
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.35,
    metalness: 0.85,
  });

  function addMesh(geo, mat, name, px, py, pz, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(px || 0, py || 0, pz || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Helper: build an extruded ribbon from 2D centerline points (u, v)
  // Extrudes along local Z by [-STRIP_W/2, +STRIP_W/2]
  function createRibbonGeometry(pts, thickness) {
    const halfT = thickness / 2;
    const front = [];
    const back = [];
    const n = pts.length;
    for (let k = 0; k < n; k++) {
      const pPrev = pts[Math.max(0, k - 1)];
      const pNext = pts[Math.min(n - 1, k + 1)];
      const dx = pNext[0] - pPrev[0];
      const dy = pNext[1] - pPrev[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      front.push([pts[k][0] + nx * halfT, pts[k][1] + ny * halfT]);
      back.push([pts[k][0] - nx * halfT, pts[k][1] - ny * halfT]);
    }
    const shape = new THREE.Shape();
    shape.moveTo(front[0][0], front[0][1]);
    for (let k = 1; k < n; k++) {
      shape.lineTo(front[k][0], front[k][1]);
    }
    for (let k = n - 1; k >= 0; k--) {
      shape.lineTo(back[k][0], back[k][1]);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: STRIP_W,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geo.translate(0, 0, -STRIP_W / 2);
    return geo;
  }

  // 1. Top blackened steel hanging bar & end brackets
  const barGeo = new THREE.BoxGeometry(W, BAR_H, BAR_D);
  addMesh(barGeo, steelMat, 'top_hanging_bar', 0, BAR_Y, BAR_D / 2);

  const earGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.004, 16);
  const boltGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12);
  const endX = W / 2 - 0.010;
  addMesh(earGeo, steelMat, 'left_mounting_ear', -endX, BAR_Y - BAR_H / 2 - 0.004, 0.002, Math.PI / 2, 0, 0);
  addMesh(earGeo, steelMat, 'right_mounting_ear', endX, BAR_Y - BAR_H / 2 - 0.004, 0.002, Math.PI / 2, 0, 0);
  addMesh(boltGeo, boltMat, 'left_mounting_bolt', -endX, BAR_Y, BAR_D + 0.002, Math.PI / 2, 0, 0);
  addMesh(boltGeo, boltMat, 'right_mounting_bolt', endX, BAR_Y, BAR_D + 0.002, Math.PI / 2, 0, 0);

  // 2. Vertical copper strips (10 strips)
  const dx = GRID_W / (NUM_V - 1);
  const dy = (GRID_TOP - GRID_BOT) / (NUM_H - 1);
  // Which vertical strips loop over the top bar (matches photo pattern)
  const topLoopIndices = [0, 2, 3, 5, 7, 9];
  // Which vertical strips have bottom loops
  const botLoopIndices = [0, 2, 5, 6, 7, 9];

  for (let i = 0; i < NUM_V; i++) {
    const xPos = -GRID_W / 2 + i * dx;
    const pts = [];

    // Bottom end
    if (botLoopIndices.indexOf(i) !== -1) {
      pts.push([0.004, WEAVE_Z + WAVE_AMP]);
      pts.push([0.000, WEAVE_Z]);
      pts.push([0.006, WEAVE_Z - WAVE_AMP]);
    } else {
      pts.push([GRID_BOT - 0.016, WEAVE_Z]);
    }

    // Weave intersections from bottom (j = 0) to top (j = NUM_H - 1)
    for (let j = 0; j < NUM_H; j++) {
      const yPos = GRID_BOT + j * dy;
      const parity = (i + j) % 2 === 0 ? 1 : -1;
      pts.push([yPos, WEAVE_Z - parity * WAVE_AMP]);
    }

    // Top end
    if (topLoopIndices.indexOf(i) !== -1) {
      const topZ = BAR_D + STRIP_T;
      pts.push([BAR_Y, topZ]);
      pts.push([H - STRIP_T / 2, BAR_D / 2]);
      pts.push([BAR_Y, 0.001]);
      pts.push([GRID_TOP + 0.010, WEAVE_Z - WAVE_AMP]);
    } else {
      pts.push([GRID_TOP + 0.012, WEAVE_Z]);
    }

    const vGeo = createRibbonGeometry(pts, STRIP_T);
    // Rotate so Shape X -> World Y, Shape Y -> World Z, Extrude Z -> World X
    const mat = i % 2 === 0 ? copperMatA : copperMatB;
    addMesh(vGeo, mat, 'vertical_copper_strip_' + (i + 1), xPos, 0, 0, 0, -Math.PI / 2, Math.PI / 2);
  }

  // 3. Horizontal copper strips (11 strips)
  for (let j = 0; j < NUM_H; j++) {
    const yPos = GRID_BOT + j * dy;
    const pts = [];
    const leftEdge = -GRID_W / 2 - STRIP_W / 2 - 0.004;
    const rightEdge = GRID_W / 2 + STRIP_W / 2 + 0.004;

    pts.push([leftEdge, WEAVE_Z]);
    for (let i = 0; i < NUM_V; i++) {
      const xPos = -GRID_W / 2 + i * dx;
      const parity = (i + j) % 2 === 0 ? 1 : -1;
      pts.push([xPos, WEAVE_Z + parity * WAVE_AMP]);
    }
    pts.push([rightEdge, WEAVE_Z]);

    const hGeo = createRibbonGeometry(pts, STRIP_T);
    // Rotate so Shape X -> World X, Shape Y -> World Z, Extrude Z -> World Y
    const mat = j % 2 === 0 ? copperMatA : copperMatB;
    addMesh(hGeo, mat, 'horizontal_copper_strip_' + (j + 1), 0, yPos, 0, Math.PI / 2, 0, 0);
  }

  // Center bounding box on X = 0, Z = 0, with lowest point at Y = 0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;

  return group;
}
