function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const H = 0.40;
  const D = 0.40;

  const GLIDE_H = 0.004;
  const PLINTH_H = 0.036;
  const PLINTH_INSET = 0.03;
  const PLINTH_W = W - 2 * PLINTH_INSET;
  const PLINTH_D = D - 2 * PLINTH_INSET;

  const SHELL_Y0 = GLIDE_H + PLINTH_H;
  const SHELL_H = H - SHELL_Y0;
  const SHELL_T = 0.024;
  const CORNER_R = 0.018;

  const INNER_W = W - 2 * SHELL_T;
  const INNER_H = SHELL_H - 2 * SHELL_T;
  const BACK_T = 0.014;
  const FRONT_RECESS = 0.010;

  const LEFT_COL_W = 0.092;
  const DIVIDER_T = 0.016;
  const RIGHT_W = INNER_W - LEFT_COL_W - DIVIDER_T;

  const SHELF_T = 0.018;
  const DRAWER_H = 0.145;
  const DRAWER_GAP = 0.003;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a677,
    roughness: 0.6,
    metalness: 0.02,
  });

  const oakInnerMat = new THREE.MeshStandardMaterial({
    color: 0xb8925f,
    roughness: 0.65,
    metalness: 0.02,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xb9b6b0,
    roughness: 0.4,
    metalness: 0.5,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.1,
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

  // 1. Plinth glides (y = 0 to GLIDE_H)
  const glideGeo = new THREE.CylinderGeometry(0.012, 0.012, GLIDE_H, 16);
  const gx = PLINTH_W / 2 - 0.025;
  const gz = PLINTH_D / 2 - 0.025;
  addMesh(glideGeo, glideMat, 'plinth_glide_fl', -gx, GLIDE_H / 2, gz);
  addMesh(glideGeo, glideMat, 'plinth_glide_fr', gx, GLIDE_H / 2, gz);
  addMesh(glideGeo, glideMat, 'plinth_glide_bl', -gx, GLIDE_H / 2, -gz);
  addMesh(glideGeo, glideMat, 'plinth_glide_br', gx, GLIDE_H / 2, -gz);

  // 2. Recessed metal plinth base
  const plinthGeo = new THREE.BoxGeometry(PLINTH_W, PLINTH_H, PLINTH_D);
  addMesh(plinthGeo, plinthMat, 'plinth_base', 0, GLIDE_H + PLINTH_H / 2, 0);

  // 3. Outer wooden shell (rounded outer corners, rectangular inner cutout)
  const shellShape = new THREE.Shape();
  const hw = W / 2;
  const hh = SHELL_H / 2;
  const r = CORNER_R;

  shellShape.moveTo(-hw + r, -hh);
  shellShape.lineTo(hw - r, -hh);
  shellShape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shellShape.lineTo(hw, hh - r);
  shellShape.quadraticCurveTo(hw, hh, hw - r, hh);
  shellShape.lineTo(-hw + r, hh);
  shellShape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shellShape.lineTo(-hw, -hh + r);
  shellShape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const innerHole = new THREE.Path();
  const ihw = INNER_W / 2;
  const ihh = INNER_H / 2;
  innerHole.moveTo(-ihw, -ihh);
  innerHole.lineTo(-ihw, ihh);
  innerHole.lineTo(ihw, ihh);
  innerHole.lineTo(ihw, -ihh);
  innerHole.lineTo(-ihw, -ihh);
  shellShape.holes.push(innerHole);

  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 12,
  });
  shellGeo.translate(0, 0, -D / 2);
  addMesh(shellGeo, oakMat, 'outer_shell', 0, SHELL_Y0 + SHELL_H / 2, 0);

  // 4. Back panel
  const backGeo = new THREE.BoxGeometry(INNER_W, INNER_H, BACK_T);
  addMesh(
    backGeo,
    oakInnerMat,
    'back_panel',
    0,
    SHELL_Y0 + SHELL_H / 2,
    -D / 2 + BACK_T / 2 + 0.004
  );

  // 5. Left vertical front panel & internal divider
  const interiorD = D - BACK_T - FRONT_RECESS - 0.004;
  const interiorCenterZ = D / 2 - FRONT_RECESS - interiorD / 2;

  const leftPanelGeo = new THREE.BoxGeometry(LEFT_COL_W, INNER_H, 0.020);
  addMesh(
    leftPanelGeo,
    oakMat,
    'left_vertical_panel',
    -INNER_W / 2 + LEFT_COL_W / 2,
    SHELL_Y0 + SHELL_H / 2,
    D / 2 - FRONT_RECESS - 0.010
  );

  const dividerX = -INNER_W / 2 + LEFT_COL_W + DIVIDER_T / 2;
  const dividerGeo = new THREE.BoxGeometry(DIVIDER_T, INNER_H, interiorD);
  addMesh(
    dividerGeo,
    oakInnerMat,
    'vertical_divider',
    dividerX,
    SHELL_Y0 + SHELL_H / 2,
    interiorCenterZ
  );

  // 6. Horizontal shelf separating cubby and drawer
  const rightCenterX = INNER_W / 2 - RIGHT_W / 2;
  const shelfY = SHELL_Y0 + SHELL_T + DRAWER_H + DRAWER_GAP + SHELF_T / 2;
  const shelfGeo = new THREE.BoxGeometry(RIGHT_W, SHELF_T, interiorD);
  addMesh(shelfGeo, oakMat, 'horizontal_shelf', rightCenterX, shelfY, interiorCenterZ);

  // 7. Drawer front with recessed finger-pull notch
  const dfW = RIGHT_W - DRAWER_GAP * 2;
  const dfH = DRAWER_H - DRAWER_GAP;
  const dfT = 0.020;

  const dfShape = new THREE.Shape();
  const dfhw = dfW / 2;
  const dfhh = dfH / 2;
  const notchW = 0.068;
  const notchD = 0.015;
  const notchR = 0.008;

  dfShape.moveTo(-dfhw, -dfhh);
  dfShape.lineTo(dfhw, -dfhh);
  dfShape.lineTo(dfhw, dfhh);
  dfShape.lineTo(notchW / 2 + notchR, dfhh);
  dfShape.quadraticCurveTo(notchW / 2, dfhh, notchW / 2 - notchR * 0.4, dfhh - notchD * 0.5);
  dfShape.quadraticCurveTo(notchW / 2 - notchR, dfhh - notchD, notchW / 2 - notchR * 2, dfhh - notchD);
  dfShape.lineTo(-notchW / 2 + notchR * 2, dfhh - notchD);
  dfShape.quadraticCurveTo(-notchW / 2 + notchR, dfhh - notchD, -notchW / 2 + notchR * 0.4, dfhh - notchD * 0.5);
  dfShape.quadraticCurveTo(-notchW / 2, dfhh, -notchW / 2 - notchR, dfhh);
  dfShape.lineTo(-dfhw, dfhh);
  dfShape.lineTo(-dfhw, -dfhh);

  const dfGeo = new THREE.ExtrudeGeometry(dfShape, {
    depth: dfT,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 8,
  });
  dfGeo.translate(0, 0, -dfT / 2);

  const drawerFrontY = SHELL_Y0 + SHELL_T + DRAWER_GAP + dfH / 2;
  const drawerFrontZ = D / 2 - FRONT_RECESS - dfT / 2;
  addMesh(dfGeo, oakInnerMat, 'drawer_front', rightCenterX, drawerFrontY, drawerFrontZ);

  // 8. Drawer box (behind the drawer front)
  const boxD = interiorD - dfT - 0.012;
  const boxZ = drawerFrontZ - dfT / 2 - boxD / 2;
  const boxH = dfH - 0.025;
  const boxY = drawerFrontY - 0.005;
  const boxSideT = 0.012;

  const boxBottomGeo = new THREE.BoxGeometry(dfW - 0.01, 0.010, boxD);
  addMesh(boxBottomGeo, oakInnerMat, 'drawer_box_bottom', rightCenterX, boxY - boxH / 2 + 0.005, boxZ);

  const boxSideGeo = new THREE.BoxGeometry(boxSideT, boxH, boxD);
  addMesh(boxSideGeo, oakInnerMat, 'drawer_box_left', rightCenterX - dfW / 2 + boxSideT / 2 + 0.005, boxY, boxZ);
  addMesh(boxSideGeo, oakInnerMat, 'drawer_box_right', rightCenterX + dfW / 2 - boxSideT / 2 - 0.005, boxY, boxZ);

  const boxBackGeo = new THREE.BoxGeometry(dfW - 0.01 - boxSideT * 2, boxH, boxSideT);
  addMesh(boxBackGeo, oakInnerMat, 'drawer_box_back', rightCenterX, boxY, boxZ - boxD / 2 + boxSideT / 2);

  return group;
}
