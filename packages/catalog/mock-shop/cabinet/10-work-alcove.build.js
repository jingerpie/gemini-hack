function build(THREE) {
  const group = new THREE.Group();

  const W = 1.80;
  const D = 0.64;
  const H = 2.05;
  const DESK_H = 0.75;
  const TOP_T = 0.032;
  const PANEL_T = 0.022;
  const PLINTH_H = 0.05;

  const LEFT_W = 0.48;
  const RIGHT_W = 0.56;
  const CENTER_W = W - LEFT_W - RIGHT_W;

  const HUTCH_D = 0.34;
  const HUTCH_H = H - DESK_H;
  const HUTCH_Z = -D / 2 + HUTCH_D / 2;
  const MID_SHELF_Y = DESK_H + 0.62;

  const matBody = new THREE.MeshStandardMaterial({
    color: 0x949188,
    roughness: 0.78,
    metalness: 0.04
  });

  const matWood = new THREE.MeshStandardMaterial({
    color: 0xb0a392,
    roughness: 0.65,
    metalness: 0.02
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0xcac9c5,
    roughness: 0.3,
    metalness: 0.85
  });

  const matDark = new THREE.MeshStandardMaterial({
    color: 0x3a3936,
    roughness: 0.7,
    metalness: 0.1
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

  // Desktop
  addBox('desk_top', W, TOP_T, D, 0, DESK_H - TOP_T / 2, 0, matWood);

  const baseH = DESK_H - TOP_T;
  const baseY = baseH / 2;
  const baseD = D - 0.02;
  const baseZ = -0.01;

  // Left cabinet bay
  const leftCenterX = -W / 2 + LEFT_W / 2;
  addBox('left_outer_side', PANEL_T, baseH, baseD, -W / 2 + PANEL_T / 2, baseY, baseZ, matBody);
  addBox('left_inner_side', PANEL_T, baseH, baseD, -W / 2 + LEFT_W - PANEL_T / 2, baseY, baseZ, matBody);
  addBox('left_plinth', LEFT_W - 2 * PANEL_T, PLINTH_H, baseD - 0.04, leftCenterX, PLINTH_H / 2, baseZ - 0.01, matBody);

  const doorH = baseH - PLINTH_H - 0.006;
  const doorW = LEFT_W - 2 * PANEL_T - 0.006;
  const doorY = PLINTH_H + doorH / 2 + 0.003;
  const frontZ = baseZ + baseD / 2 - PANEL_T / 2;
  addBox('left_door', doorW, doorH, PANEL_T, leftCenterX, doorY, frontZ, matBody);
  addBox('left_door_pull', 0.06, 0.008, 0.022, leftCenterX + doorW / 2 - 0.05, doorY + doorH / 2 - 0.006, frontZ + PANEL_T / 2 + 0.008, matMetal);

  // Right drawer bay
  const rightCenterX = W / 2 - RIGHT_W / 2;
  addBox('right_outer_side', PANEL_T, baseH, baseD, W / 2 - PANEL_T / 2, baseY, baseZ, matBody);
  addBox('right_inner_side', PANEL_T, baseH, baseD, W / 2 - RIGHT_W + PANEL_T / 2, baseY, baseZ, matBody);
  addBox('right_plinth', RIGHT_W - 2 * PANEL_T, PLINTH_H, baseD - 0.04, rightCenterX, PLINTH_H / 2, baseZ - 0.01, matBody);

  const drawerW = RIGHT_W - 2 * PANEL_T - 0.006;
  const drawerTotalH = baseH - PLINTH_H - 0.01;
  const drawerH = (drawerTotalH - 0.006) / 2;
  const botDrawerY = PLINTH_H + drawerH / 2 + 0.003;
  const topDrawerY = PLINTH_H + drawerH * 1.5 + 0.009;

  addBox('right_drawer_bottom', drawerW, drawerH, PANEL_T, rightCenterX, botDrawerY, frontZ, matBody);
  addBox('right_drawer_top', drawerW, drawerH, PANEL_T, rightCenterX, topDrawerY, frontZ, matBody);
  addBox('right_drawer_bottom_pull', 0.07, 0.008, 0.022, rightCenterX, botDrawerY + drawerH / 2 - 0.006, frontZ + PANEL_T / 2 + 0.008, matMetal);
  addBox('right_drawer_top_pull', 0.07, 0.008, 0.022, rightCenterX, topDrawerY + drawerH / 2 - 0.006, frontZ + PANEL_T / 2 + 0.008, matMetal);

  // Center kneehole
  const centerX = -W / 2 + LEFT_W + CENTER_W / 2;
  addBox('center_back_panel', CENTER_W, baseH, PANEL_T, centerX, baseY, -D / 2 + PANEL_T / 2 + 0.02, matBody);
  addBox('center_apron', CENTER_W, 0.055, PANEL_T, centerX, baseH - 0.055 / 2, frontZ - 0.02, matBody);

  // Upper Hutch Frame
  const hutchMidY = DESK_H + HUTCH_H / 2;
  addBox('hutch_left_side', PANEL_T, HUTCH_H, HUTCH_D, -W / 2 + PANEL_T / 2, hutchMidY, HUTCH_Z, matBody);
  addBox('hutch_right_side', PANEL_T, HUTCH_H, HUTCH_D, W / 2 - PANEL_T / 2, hutchMidY, HUTCH_Z, matBody);
  addBox('hutch_top_panel', W - 2 * PANEL_T, PANEL_T, HUTCH_D, 0, H - PANEL_T / 2, HUTCH_Z, matBody);
  addBox('hutch_back_panel', W - 2 * PANEL_T, HUTCH_H - PANEL_T, PANEL_T, 0, DESK_H + (HUTCH_H - PANEL_T) / 2, -D / 2 + PANEL_T / 2, matBody);

  // Mid horizontal shelf
  const innerHutchW = W - 2 * PANEL_T;
  const shelfD = HUTCH_D - PANEL_T;
  const shelfZ = HUTCH_Z + PANEL_T / 2;
  addBox('hutch_mid_shelf', innerHutchW, PANEL_T, shelfD, 0, MID_SHELF_Y, shelfZ, matWood);

  // Lower hutch dividers & shelves (aligned with desk bays)
  const lowerH = MID_SHELF_Y - DESK_H - PANEL_T / 2;
  const lowerMidY = DESK_H + lowerH / 2;
  const lowLeftDivX = -W / 2 + LEFT_W - 0.04;
  const lowRightDivX = W / 2 - RIGHT_W + 0.04;

  addBox('hutch_lower_left_divider', PANEL_T, lowerH, shelfD, lowLeftDivX, lowerMidY, shelfZ, matBody);
  addBox('hutch_lower_right_divider', PANEL_T, lowerH, shelfD, lowRightDivX, lowerMidY, shelfZ, matBody);

  const lowLeftShelfW = (lowLeftDivX - PANEL_T / 2) - (-W / 2 + PANEL_T);
  const lowLeftShelfX = -W / 2 + PANEL_T + lowLeftShelfW / 2;
  addBox('hutch_lower_left_shelf', lowLeftShelfW, PANEL_T, shelfD, lowLeftShelfX, DESK_H + lowerH * 0.45, shelfZ, matWood);

  const lowRightShelfW = (W / 2 - PANEL_T) - (lowRightDivX + PANEL_T / 2);
  const lowRightShelfX = lowRightDivX + PANEL_T / 2 + lowRightShelfW / 2;
  addBox('hutch_lower_right_shelf', lowRightShelfW, PANEL_T, shelfD, lowRightShelfX, DESK_H + lowerH * 0.45, shelfZ, matWood);

  // Alcove cable trim & grommet
  const alcoveW = lowRightDivX - lowLeftDivX - PANEL_T;
  const alcoveX = (lowLeftDivX + lowRightDivX) / 2;
  addBox('hutch_alcove_cable_trim', alcoveW, 0.035, 0.025, alcoveX, DESK_H + 0.0175, -D / 2 + PANEL_T + 0.0125, matWood);
  addBox('hutch_alcove_grommet', 0.065, 0.018, 0.03, alcoveX, DESK_H + 0.009, -D / 2 + PANEL_T + 0.015, matDark);

  // Upper hutch dividers & shelves (3 equal bays)
  const upperH = H - PANEL_T - (MID_SHELF_Y + PANEL_T / 2);
  const upperMidY = MID_SHELF_Y + PANEL_T / 2 + upperH / 2;
  const bayW = (innerHutchW - 2 * PANEL_T) / 3;
  const upLeftDivX = -W / 2 + PANEL_T + bayW + PANEL_T / 2;
  const upRightDivX = W / 2 - PANEL_T - bayW - PANEL_T / 2;

  addBox('hutch_upper_left_divider', PANEL_T, upperH, shelfD, upLeftDivX, upperMidY, shelfZ, matBody);
  addBox('hutch_upper_right_divider', PANEL_T, upperH, shelfD, upRightDivX, upperMidY, shelfZ, matBody);

  const upperShelfY = MID_SHELF_Y + PANEL_T / 2 + upperH * 0.5;
  addBox('hutch_upper_left_shelf', bayW, PANEL_T, shelfD, -W / 2 + PANEL_T + bayW / 2, upperShelfY, shelfZ, matWood);
  addBox('hutch_upper_center_shelf', bayW, PANEL_T, shelfD, 0, upperShelfY, shelfZ, matWood);
  addBox('hutch_upper_right_shelf', bayW, PANEL_T, shelfD, W / 2 - PANEL_T - bayW / 2, upperShelfY, shelfZ, matWood);

  return group;
}
