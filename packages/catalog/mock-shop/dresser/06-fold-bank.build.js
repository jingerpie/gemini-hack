function build(THREE) {
  const group = new THREE.Group();

  const W = 1.40;
  const H = 0.78;
  const D = 0.48;
  const PLINTH_H = 0.045;
  const PLINTH_INSET = 0.035;
  const FRAME_T = 0.022;
  const BACK_T = 0.018;
  const DRAWER_T = 0.020;
  const DRAWER_RECESS = 0.005;
  const GAP_X = 0.004;
  const GAP_Y_THIN = 0.004;
  const GAP_Y_PULL = 0.018;

  const CASE_H = H - PLINTH_H;
  const INNER_W = W - 2 * FRAME_T;
  const INNER_H = CASE_H - 2 * FRAME_T;
  const DRAWER_W = (INNER_W - 3 * GAP_X) / 2;
  const DRAWER_H = (INNER_H - 2 * GAP_Y_THIN - 2 * GAP_Y_PULL) / 3;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe4ddd0,
    roughness: 0.65,
    metalness: 0.0
  });

  const shadowMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b2,
    roughness: 0.75,
    metalness: 0.0
  });

  function addBox(name, w, h, d, x, y, z, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Recessed plinth base
  addBox(
    'plinth_base',
    W - 2 * PLINTH_INSET,
    PLINTH_H,
    D - 2 * PLINTH_INSET,
    0,
    PLINTH_H / 2,
    0,
    woodMat
  );

  // Outer case frame
  addBox(
    'frame_bottom',
    W,
    FRAME_T,
    D,
    0,
    PLINTH_H + FRAME_T / 2,
    0,
    woodMat
  );

  addBox(
    'frame_top',
    W,
    FRAME_T,
    D,
    0,
    H - FRAME_T / 2,
    0,
    woodMat
  );

  addBox(
    'frame_left',
    FRAME_T,
    INNER_H,
    D,
    -W / 2 + FRAME_T / 2,
    PLINTH_H + CASE_H / 2,
    0,
    woodMat
  );

  addBox(
    'frame_right',
    FRAME_T,
    INNER_H,
    D,
    W / 2 - FRAME_T / 2,
    PLINTH_H + CASE_H / 2,
    0,
    woodMat
  );

  // Back panel
  addBox(
    'back_panel',
    INNER_W,
    INNER_H,
    BACK_T,
    0,
    PLINTH_H + CASE_H / 2,
    -D / 2 + BACK_T / 2,
    woodMat
  );

  // Recessed interior backing behind drawers for realistic shadow grooves
  const backingD = D - BACK_T - DRAWER_RECESS - DRAWER_T;
  addBox(
    'interior_backing',
    INNER_W,
    INNER_H,
    backingD,
    0,
    PLINTH_H + CASE_H / 2,
    -D / 2 + BACK_T + backingD / 2,
    shadowMat
  );

  // 6 Drawer fronts (2 columns x 3 rows)
  const drawerZ = D / 2 - DRAWER_RECESS - DRAWER_T / 2;
  const leftX = -GAP_X / 2 - DRAWER_W / 2;
  const rightX = GAP_X / 2 + DRAWER_W / 2;

  const botY = PLINTH_H + FRAME_T + GAP_Y_THIN + DRAWER_H / 2;
  const midY = botY + DRAWER_H + GAP_Y_PULL;
  const topY = midY + DRAWER_H + GAP_Y_PULL;

  const rows = [
    { label: 'top', y: topY },
    { label: 'mid', y: midY },
    { label: 'bot', y: botY }
  ];

  const cols = [
    { label: 'left', x: leftX },
    { label: 'right', x: rightX }
  ];

  for (const row of rows) {
    for (const col of cols) {
      addBox(
        `drawer_${row.label}_${col.label}`,
        DRAWER_W,
        DRAWER_H,
        DRAWER_T,
        col.x,
        row.y,
        drawerZ,
        woodMat
      );
    }
  }

  return group;
}
