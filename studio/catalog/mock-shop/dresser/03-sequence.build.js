function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.90;
  const H = 1.05;
  const D = 0.45;

  const PLINTH_H = 0.055;
  const PLINTH_INSET = 0.035;
  const PANEL_T = 0.022;
  const BACK_T = 0.015;
  const GAP = 0.004;
  const DRAWER_T = 0.02;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb98b56,
    roughness: 0.62,
    metalness: 0.02,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x5a4026,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Plinth base (y = 0 to PLINTH_H)
  const plinthW = W - PLINTH_INSET * 2;
  const plinthD = D - PLINTH_INSET * 2;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    oakMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // 2. Carcass panels
  const carcassY0 = PLINTH_H;
  const sideH = H - PLINTH_H - PANEL_T * 2;

  // Bottom panel
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    oakMat,
    'bottom_panel',
    0,
    carcassY0 + PANEL_T / 2,
    0
  );

  // Top panel
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    oakMat,
    'top_panel',
    0,
    H - PANEL_T / 2,
    0
  );

  // Left & Right side panels
  const sideY = carcassY0 + PANEL_T + sideH / 2;
  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    oakMat,
    'left_side_panel',
    -W / 2 + PANEL_T / 2,
    sideY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    oakMat,
    'right_side_panel',
    W / 2 - PANEL_T / 2,
    sideY,
    0
  );

  // Back panel
  const innerW = W - PANEL_T * 2;
  addMesh(
    new THREE.BoxGeometry(innerW, sideH, BACK_T),
    oakMat,
    'back_panel',
    0,
    sideY,
    -D / 2 + BACK_T / 2
  );

  // Dark recess backing behind drawer fronts (for finger-pull shadow)
  const drawerAreaZ = D / 2 - DRAWER_T;
  addMesh(
    new THREE.BoxGeometry(innerW - 0.002, sideH - 0.002, 0.01),
    oakDarkMat,
    'drawer_recess_backing',
    0,
    sideY,
    drawerAreaZ - 0.006
  );

  // 3. Helper to create a drawer front with a top-center finger-pull cutout
  function createDrawerFrontGeo(w, h, t) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;

    // Cutout dimensions
    const cutW = Math.min(w * 0.42, 0.24);
    const cutH = 0.016;
    const bevel = 0.012;
    const hCut = cutW / 2;

    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(hCut + bevel, hh);
    shape.quadraticCurveTo(hCut, hh, hCut - bevel * 0.5, hh - cutH);
    shape.lineTo(-hCut + bevel * 0.5, hh - cutH);
    shape.quadraticCurveTo(-hCut, hh, -hCut - bevel, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: false,
      curveSegments: 8,
    });
    // Center along Z
    geo.translate(0, 0, -t / 2);
    return geo;
  }

  // 4. Drawers layout (4 rows, top row has 2 drawers)
  const availW = innerW - GAP * 2;
  const availH = sideH - GAP * 5; // 4 rows -> 5 gaps (top, 3 between, bottom)
  const rowH = availH / 4;
  const drawerZ = D / 2 - DRAWER_T / 2;

  // Top row (Row 1): 2 half-width drawers
  const halfW = (availW - GAP) / 2;
  const row1Y = H - PANEL_T - GAP - rowH / 2;
  const topLeftGeo = createDrawerFrontGeo(halfW, rowH, DRAWER_T);
  const topRightGeo = createDrawerFrontGeo(halfW, rowH, DRAWER_T);

  addMesh(
    topLeftGeo,
    oakMat,
    'drawer_front_top_left',
    -halfW / 2 - GAP / 2,
    row1Y,
    drawerZ
  );
  addMesh(
    topRightGeo,
    oakMat,
    'drawer_front_top_right',
    halfW / 2 + GAP / 2,
    row1Y,
    drawerZ
  );

  // Rows 2, 3, 4: full-width drawers
  const fullGeo = createDrawerFrontGeo(availW, rowH, DRAWER_T);
  const rowNames = ['drawer_front_row2', 'drawer_front_row3', 'drawer_front_row4'];

  for (let i = 0; i < 3; i++) {
    const rowIdx = i + 1;
    const rowY = H - PANEL_T - GAP * (rowIdx + 1) - rowH * (rowIdx + 0.5);
    addMesh(fullGeo, oakMat, rowNames[i], 0, rowY, drawerZ);
  }

  return group;
}
