function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const H = 0.54;
  const D = 0.44;

  const GLIDE_H = 0.004;
  const PLINTH_H = 0.028;
  const PLINTH_INSET = 0.026;
  const PANEL_T = 0.022;
  const BACK_T = 0.016;

  const CARCASS_Y0 = GLIDE_H + PLINTH_H;
  const CARCASS_H = H - CARCASS_Y0;
  const INNER_W = W - 2 * PANEL_T;
  const INNER_H = CARCASS_H - 2 * PANEL_T;

  const DRAWER_GAP_SIDE = 0.002;
  const DRAWER_PULL_GAP = 0.022;
  const DRAWER_FRONT_H = 0.165;
  const DRAWER_FRONT_T = 0.020;
  const DRAWER_RECESS = 0.008;
  const DRAWER_BOX_T = 0.014;
  const DRAWER_BOX_D = D - BACK_T - DRAWER_RECESS - DRAWER_FRONT_T - 0.025;
  const DRAWER_BOX_H = DRAWER_FRONT_H - 0.024;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd8ccb8,
    roughness: 0.68,
    metalness: 0.0,
  });

  const runnerMat = new THREE.MeshStandardMaterial({
    color: 0xb8ab96,
    roughness: 0.55,
    metalness: 0.1,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x3a3632,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addBox(name, w, h, d, x, y, z, mat) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Floor glides
  const plinthW = W - 2 * PLINTH_INSET;
  const plinthD = D - 2 * PLINTH_INSET;
  const glideR = 0.014;
  const glideGeom = new THREE.CylinderGeometry(glideR, glideR, GLIDE_H, 16);
  const glideOffsetX = plinthW / 2 - 0.03;
  const glideOffsetZ = plinthD / 2 - 0.03;
  const glidePositions = [
    [-glideOffsetX, GLIDE_H / 2, -glideOffsetZ],
    [glideOffsetX, GLIDE_H / 2, -glideOffsetZ],
    [-glideOffsetX, GLIDE_H / 2, glideOffsetZ],
    [glideOffsetX, GLIDE_H / 2, glideOffsetZ],
  ];
  glidePositions.forEach((pos, idx) => {
    const glide = new THREE.Mesh(glideGeom, glideMat);
    glide.name = `floor_glide_${idx + 1}`;
    glide.position.set(pos[0], pos[1], pos[2]);
    glide.castShadow = true;
    glide.receiveShadow = true;
    group.add(glide);
  });

  // Recessed plinth base
  addBox(
    'plinth_base',
    plinthW,
    PLINTH_H,
    plinthD,
    0,
    GLIDE_H + PLINTH_H / 2,
    0,
    woodMat
  );

  // Outer carcass
  addBox(
    'left_panel',
    PANEL_T,
    CARCASS_H,
    D,
    -W / 2 + PANEL_T / 2,
    CARCASS_Y0 + CARCASS_H / 2,
    0,
    woodMat
  );
  addBox(
    'right_panel',
    PANEL_T,
    CARCASS_H,
    D,
    W / 2 - PANEL_T / 2,
    CARCASS_Y0 + CARCASS_H / 2,
    0,
    woodMat
  );
  addBox(
    'top_panel',
    INNER_W,
    PANEL_T,
    D,
    0,
    H - PANEL_T / 2,
    0,
    woodMat
  );
  addBox(
    'bottom_panel',
    INNER_W,
    PANEL_T,
    D,
    0,
    CARCASS_Y0 + PANEL_T / 2,
    0,
    woodMat
  );
  addBox(
    'back_panel',
    INNER_W,
    INNER_H,
    BACK_T,
    0,
    CARCASS_Y0 + PANEL_T + INNER_H / 2,
    -D / 2 + BACK_T / 2,
    woodMat
  );

  // Drawer front
  const drawerFrontW = INNER_W - 2 * DRAWER_GAP_SIDE;
  const drawerTopY = H - PANEL_T - DRAWER_PULL_GAP;
  const drawerFrontY = drawerTopY - DRAWER_FRONT_H / 2;
  const drawerFrontZ = D / 2 - DRAWER_RECESS - DRAWER_FRONT_T / 2;

  addBox(
    'drawer_front',
    drawerFrontW,
    DRAWER_FRONT_H,
    DRAWER_FRONT_T,
    0,
    drawerFrontY,
    drawerFrontZ,
    woodMat
  );

  // Drawer box (closed, inside carcass)
  const drawerBoxW = drawerFrontW - 0.016;
  const drawerBoxZ = drawerFrontZ - DRAWER_FRONT_T / 2 - DRAWER_BOX_D / 2;
  const drawerBoxY = drawerFrontY - 0.006;

  addBox(
    'drawer_left_side',
    DRAWER_BOX_T,
    DRAWER_BOX_H,
    DRAWER_BOX_D,
    -drawerBoxW / 2 + DRAWER_BOX_T / 2,
    drawerBoxY,
    drawerBoxZ,
    woodMat
  );
  addBox(
    'drawer_right_side',
    DRAWER_BOX_T,
    DRAWER_BOX_H,
    DRAWER_BOX_D,
    drawerBoxW / 2 - DRAWER_BOX_T / 2,
    drawerBoxY,
    drawerBoxZ,
    woodMat
  );
  addBox(
    'drawer_back',
    drawerBoxW - 2 * DRAWER_BOX_T,
    DRAWER_BOX_H,
    DRAWER_BOX_T,
    0,
    drawerBoxY,
    drawerBoxZ - DRAWER_BOX_D / 2 + DRAWER_BOX_T / 2,
    woodMat
  );
  addBox(
    'drawer_bottom',
    drawerBoxW - 2 * DRAWER_BOX_T,
    DRAWER_BOX_T,
    DRAWER_BOX_D - DRAWER_BOX_T,
    0,
    drawerBoxY - DRAWER_BOX_H / 2 + DRAWER_BOX_T / 2,
    drawerBoxZ + DRAWER_BOX_T / 2,
    woodMat
  );

  // Drawer runners
  const runnerW = (INNER_W - drawerBoxW) / 2;
  const runnerH = 0.016;
  addBox(
    'drawer_runner_left',
    runnerW,
    runnerH,
    DRAWER_BOX_D,
    -INNER_W / 2 + runnerW / 2,
    drawerBoxY - DRAWER_BOX_H / 2 + runnerH / 2,
    drawerBoxZ,
    runnerMat
  );
  addBox(
    'drawer_runner_right',
    runnerW,
    runnerH,
    DRAWER_BOX_D,
    INNER_W / 2 - runnerW / 2,
    drawerBoxY - DRAWER_BOX_H / 2 + runnerH / 2,
    drawerBoxZ,
    runnerMat
  );

  return group;
}
