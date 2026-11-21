function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const H = 0.56;
  const D = 0.42;
  const LEG_H = 0.045;
  const LEG_W = 0.036;
  const T = 0.022; // outer panel thickness
  const TRAY_T = 0.018;
  const DIV_T = 0.016;
  const DRAWER_H = 0.135;
  const GAP = 0.003;

  const INNER_W = W - 2 * T;
  const INNER_D = D - T;
  const BODY_H = H - LEG_H;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.62,
    metalness: 0.02,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9e7445,
    roughness: 0.72,
    metalness: 0.02,
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

  // 4 Corner Legs (bottom at y = 0)
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;
  addBox('leg_fl', LEG_W, LEG_H, LEG_W, -legX, LEG_H / 2, legZ, oakMat);
  addBox('leg_fr', LEG_W, LEG_H, LEG_W, legX, LEG_H / 2, legZ, oakMat);
  addBox('leg_bl', LEG_W, LEG_H, LEG_W, -legX, LEG_H / 2, -legZ, oakMat);
  addBox('leg_br', LEG_W, LEG_H, LEG_W, legX, LEG_H / 2, -legZ, oakMat);

  // Outer Frame
  addBox('bottom_panel', W, T, D, 0, LEG_H + T / 2, 0, oakMat);
  addBox('top_panel', W, T, D, 0, H - T / 2, 0, oakMat);
  addBox('left_panel', T, BODY_H - 2 * T, D, -W / 2 + T / 2, LEG_H + BODY_H / 2, 0, oakMat);
  addBox('right_panel', T, BODY_H - 2 * T, D, W / 2 - T / 2, LEG_H + BODY_H / 2, 0, oakMat);
  addBox('back_panel', INNER_W, BODY_H - 2 * T, T, 0, LEG_H + BODY_H / 2, -D / 2 + T / 2, oakDarkMat);

  // Pull-out tray & divider
  const trayGapTop = 0.045;
  const trayY = H - T - trayGapTop - TRAY_T / 2;
  const divY = trayY - TRAY_T / 2 - DIV_T / 2;

  addBox('tray_divider', INNER_W, DIV_T, INNER_D, 0, divY, T / 2, oakDarkMat);
  addBox('pull_out_tray', INNER_W - 2 * GAP, TRAY_T, INNER_D - 0.005, 0, trayY, T / 2 - 0.002, oakMat);

  // Tray side rails
  const railW = 0.01;
  const railH = 0.01;
  addBox('tray_rail_left', railW, railH, INNER_D - 0.02, -INNER_W / 2 + railW / 2, trayY, T / 2, oakDarkMat);
  addBox('tray_rail_right', railW, railH, INNER_D - 0.02, INNER_W / 2 - railW / 2, trayY, T / 2, oakDarkMat);

  // Drawer (closed pose, flush with front)
  const drawerTopY = divY - DIV_T / 2 - GAP;
  const drawerCenterY = drawerTopY - DRAWER_H / 2;
  const drawerFrontZ = D / 2 - T / 2 - 0.004;

  addBox('drawer_front', INNER_W - 2 * GAP, DRAWER_H, T, 0, drawerCenterY, drawerFrontZ, oakMat);

  // Drawer box interior
  const boxD = INNER_D - T - 0.02;
  const boxZ = drawerFrontZ - T / 2 - boxD / 2;
  const boxH = DRAWER_H - 0.02;
  const sideT = 0.014;

  addBox('drawer_bottom', INNER_W - 2 * sideT - 0.01, 0.012, boxD, 0, drawerCenterY - boxH / 2 + 0.006, boxZ, oakDarkMat);
  addBox('drawer_left', sideT, boxH, boxD, -INNER_W / 2 + sideT / 2 + 0.005, drawerCenterY, boxZ, oakDarkMat);
  addBox('drawer_right', sideT, boxH, boxD, INNER_W / 2 - sideT / 2 - 0.005, drawerCenterY, boxZ, oakDarkMat);
  addBox('drawer_back', INNER_W - 2 * sideT - 0.01, boxH, sideT, 0, drawerCenterY, boxZ - boxD / 2 + sideT / 2, oakDarkMat);

  return group;
}
