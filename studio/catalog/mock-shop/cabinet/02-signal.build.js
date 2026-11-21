function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.80;
  const H = 0.50;
  const D = 0.45;

  const PLINTH_H = 0.055;
  const PLINTH_INSET_X = 0.08;
  const PLINTH_INSET_Z = 0.05;

  const BODY_H = 0.345;
  const SHELF_H = 0.075;
  const TOP_THICK = 0.025; // 0.055 + 0.345 + 0.075 + 0.025 = 0.500

  const PANEL_T = 0.022;
  const GAP = 0.004;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb89066,
    roughness: 0.65,
    metalness: 0.0,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9c764e,
    roughness: 0.72,
    metalness: 0.0,
  });

  const slotDarkMat = new THREE.MeshStandardMaterial({
    color: 0x241c15,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Plinth base (y: 0 to PLINTH_H)
  const plinthW = W - 2 * PLINTH_INSET_X;
  const plinthD = D - 2 * PLINTH_INSET_Z;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    oakDarkMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // 2. Main Cabinet Body (y: PLINTH_H to PLINTH_H + BODY_H)
  const bodyBottomY = PLINTH_H;
  const bodyTopY = PLINTH_H + BODY_H;

  // Bottom panel
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    oakMat,
    'body_bottom_panel',
    0,
    bodyBottomY + PANEL_T / 2,
    0
  );

  // Top panel of main box
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    oakMat,
    'body_top_panel',
    0,
    bodyTopY - PANEL_T / 2,
    0
  );

  // Left & Right side panels
  const sideH = BODY_H - 2 * PANEL_T;
  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    oakMat,
    'body_left_panel',
    -W / 2 + PANEL_T / 2,
    bodyBottomY + BODY_H / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    oakMat,
    'body_right_panel',
    W / 2 - PANEL_T / 2,
    bodyBottomY + BODY_H / 2,
    0
  );

  // Back panel
  const innerW = W - 2 * PANEL_T;
  addMesh(
    new THREE.BoxGeometry(innerW, sideH, PANEL_T),
    oakDarkMat,
    'body_back_panel',
    0,
    bodyBottomY + BODY_H / 2,
    -D / 2 + PANEL_T / 2
  );

  // Center vertical divider inside cabinet
  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D - PANEL_T * 2),
    oakDarkMat,
    'body_center_divider',
    0,
    bodyBottomY + BODY_H / 2,
    0
  );

  // 3. Front Doors with vertical ventilation slots
  const doorW = (innerW - GAP * 3) / 2;
  const doorH = sideH - 0.012; // finger-pull shadow gap at top
  const doorT = 0.020;
  const doorY = bodyBottomY + PANEL_T + doorH / 2 + 0.002;
  const doorZ = D / 2 - doorT / 2 - 0.004;

  function createSlottedDoorGeometry(w, h, t, slotCount) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();

    const slotW = 0.007;
    const slotH = 0.062;
    const slotBottomY = -h / 2 + 0.022;
    const marginX = 0.032;
    const usableW = w - 2 * marginX;
    const step = usableW / (slotCount - 1);

    for (let i = 0; i < slotCount; i++) {
      const sx = -usableW / 2 + i * step;
      const hole = new THREE.Path();
      hole.moveTo(sx - slotW / 2, slotBottomY);
      hole.lineTo(sx + slotW / 2, slotBottomY);
      hole.lineTo(sx + slotW / 2, slotBottomY + slotH);
      hole.lineTo(sx - slotW / 2, slotBottomY + slotH);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: false,
    });
    geom.translate(0, 0, -t / 2);
    return geom;
  }

  const doorGeom = createSlottedDoorGeometry(doorW, doorH, doorT, 24);

  // Left Door & dark backing
  const leftDoorX = -doorW / 2 - GAP / 2;
  addMesh(doorGeom, oakMat, 'left_door', leftDoorX, doorY, doorZ);
  addMesh(
    new THREE.BoxGeometry(doorW - 0.02, 0.08, 0.006),
    slotDarkMat,
    'left_door_slot_backing',
    leftDoorX,
    doorY - doorH / 2 + 0.053,
    doorZ - doorT / 2 - 0.003
  );

  // Right Door & dark backing
  const rightDoorX = doorW / 2 + GAP / 2;
  addMesh(doorGeom, oakMat, 'right_door', rightDoorX, doorY, doorZ);
  addMesh(
    new THREE.BoxGeometry(doorW - 0.02, 0.08, 0.006),
    slotDarkMat,
    'right_door_slot_backing',
    rightDoorX,
    doorY - doorH / 2 + 0.053,
    doorZ - doorT / 2 - 0.003
  );

  // 4. Open Shelf Risers & Slotted Back (y: bodyTopY to bodyTopY + SHELF_H)
  const shelfMidY = bodyTopY + SHELF_H / 2;
  const riserD = D - 0.06; // recessed from front for floating-top look
  const riserZ = -0.015;

  // Left, Center, Right risers
  addMesh(
    new THREE.BoxGeometry(PANEL_T, SHELF_H, riserD),
    oakMat,
    'shelf_left_riser',
    -W / 2 + 0.14,
    shelfMidY,
    riserZ
  );
  addMesh(
    new THREE.BoxGeometry(PANEL_T, SHELF_H, riserD),
    oakMat,
    'shelf_center_riser',
    0,
    shelfMidY,
    riserZ
  );
  addMesh(
    new THREE.BoxGeometry(PANEL_T, SHELF_H, riserD),
    oakMat,
    'shelf_right_riser',
    W / 2 - 0.14,
    shelfMidY,
    riserZ
  );

  // Slotted back panel for open shelf
  const shelfBackW = W - 0.28 - PANEL_T;
  const shelfBackGeom = createSlottedDoorGeometry(shelfBackW, SHELF_H, 0.014, 42);
  addMesh(
    shelfBackGeom,
    oakDarkMat,
    'shelf_slotted_back',
    0,
    shelfMidY,
    -D / 2 + 0.045
  );
  addMesh(
    new THREE.BoxGeometry(shelfBackW, SHELF_H - 0.01, 0.006),
    slotDarkMat,
    'shelf_back_dark_backing',
    0,
    shelfMidY,
    -D / 2 + 0.035
  );

  // 5. Floating Top Slab (y: H - TOP_THICK to H)
  addMesh(
    new THREE.BoxGeometry(W, TOP_THICK, D),
    oakMat,
    'top_slab',
    0,
    H - TOP_THICK / 2,
    0
  );

  return group;
}
