function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.75;
  const D = 0.48;
  const PLINTH_H = 0.035;
  const PLINTH_INSET_X = 0.035;
  const PLINTH_INSET_Z = 0.035;
  const PANEL_T = 0.02;

  const BODY_H = H - PLINTH_H;
  const INNER_W = W - 2 * PANEL_T;
  const INNER_H = BODY_H - 2 * PANEL_T;

  const DRAWER_GAP_V = 0.018;
  const DRAWER_GAP_EDGE = 0.004;
  const DRAWER_GAP_C = 0.004;
  const DRAWER_W = (INNER_W - 2 * DRAWER_GAP_EDGE - DRAWER_GAP_C) / 2;
  const DRAWER_H = (INNER_H - 2 * DRAWER_GAP_EDGE - 2 * DRAWER_GAP_V) / 3;
  const DRAWER_T = 0.02;
  const DRAWER_RECESS = 0.004;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa6784e,
    roughness: 0.62,
    metalness: 0.02,
  });

  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x3b2818,
    roughness: 0.85,
    metalness: 0.0,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x7c7a76,
    roughness: 0.42,
    metalness: 0.65,
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

  // Plinth base
  addMesh(
    new THREE.BoxGeometry(W - 2 * PLINTH_INSET_X, PLINTH_H, D - 2 * PLINTH_INSET_Z),
    plinthMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // Outer carcass
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    'top_panel',
    0,
    H - PANEL_T / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    'bottom_panel',
    0,
    PLINTH_H + PANEL_T / 2,
    0
  );

  const sideH = BODY_H - 2 * PANEL_T;
  const sideY = PLINTH_H + BODY_H / 2;

  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    woodMat,
    'left_panel',
    -W / 2 + PANEL_T / 2,
    sideY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    woodMat,
    'right_panel',
    W / 2 - PANEL_T / 2,
    sideY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(INNER_W, INNER_H, PANEL_T),
    woodMat,
    'back_panel',
    0,
    sideY,
    -D / 2 + PANEL_T / 2
  );

  // Inner shadow backing behind drawers
  const drawerZ = D / 2 - DRAWER_RECESS - DRAWER_T / 2;
  addMesh(
    new THREE.BoxGeometry(INNER_W, INNER_H, 0.02),
    darkRecessMat,
    'inner_shadow_backing',
    0,
    sideY,
    drawerZ - DRAWER_T / 2 - 0.01
  );

  // 6 Drawer fronts (3 rows x 2 columns)
  const rowNames = ['top', 'mid', 'bot'];
  const colNames = ['left', 'right'];
  const drawerGeo = new THREE.BoxGeometry(DRAWER_W, DRAWER_H, DRAWER_T);

  const topDrawerCenterY = H - PANEL_T - DRAWER_GAP_EDGE - DRAWER_H / 2;
  const colOffsetX = DRAWER_GAP_C / 2 + DRAWER_W / 2;

  for (let r = 0; r < 3; r++) {
    const y = topDrawerCenterY - r * (DRAWER_H + DRAWER_GAP_V);
    for (let c = 0; c < 2; c++) {
      const x = c === 0 ? -colOffsetX : colOffsetX;
      addMesh(
        drawerGeo,
        woodMat,
        `drawer_front_${rowNames[r]}_${colNames[c]}`,
        x,
        y,
        drawerZ
      );
    }
  }

  return group;
}
