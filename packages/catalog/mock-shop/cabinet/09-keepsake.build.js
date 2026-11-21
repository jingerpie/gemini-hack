function build(THREE) {
  const W = 0.90;
  const H = 1.95;
  const D = 0.40;
  const PANEL_T = 0.022;
  const BACK_T = 0.012;
  const DOOR_T = 0.020;
  const PLINTH_H = 0.045;
  const DIVIDER_Y = 0.78;
  const FRAME_W = 0.052;
  const GAP = 0.003;
  const GLASS_T = 0.006;

  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x988f85,
    roughness: 0.72,
    metalness: 0.04
  });

  const interiorWoodMat = new THREE.MeshStandardMaterial({
    color: 0x8a8177,
    roughness: 0.78,
    metalness: 0.03
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbe3e0,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    clearcoat: 0.8
  });

  function addBox(w, h, d, x, y, z, mat, name) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const innerW = W - 2 * PANEL_T;
  const carcassZ = -DOOR_T * 0.5;
  const carcassD = D - DOOR_T;
  const frontZ = D * 0.5 - DOOR_T * 0.5;

  // Outer carcass
  addBox(PANEL_T, H, D, -W * 0.5 + PANEL_T * 0.5, H * 0.5, 0, woodMat, 'left_side_panel');
  addBox(PANEL_T, H, D, W * 0.5 - PANEL_T * 0.5, H * 0.5, 0, woodMat, 'right_side_panel');
  addBox(innerW, PANEL_T, carcassD, 0, H - PANEL_T * 0.5, carcassZ, woodMat, 'top_panel');
  addBox(innerW, PANEL_T, carcassD, 0, PLINTH_H + PANEL_T * 0.5, carcassZ, woodMat, 'bottom_panel');
  addBox(innerW, PLINTH_H, carcassD - 0.02, 0, PLINTH_H * 0.5, carcassZ - 0.01, woodMat, 'plinth_kickplate');
  addBox(innerW, H - PLINTH_H - PANEL_T, BACK_T, 0, (H + PLINTH_H) * 0.5, -D * 0.5 + BACK_T * 0.5, interiorWoodMat, 'back_panel');

  // Middle divider shelf
  addBox(innerW, PANEL_T, carcassD - BACK_T, 0, DIVIDER_Y, carcassZ + BACK_T * 0.5, interiorWoodMat, 'middle_divider_shelf');

  // Interior glass shelves in upper section
  const upperInnerBottom = DIVIDER_Y + PANEL_T * 0.5;
  const upperInnerTop = H - PANEL_T;
  const upperSpan = upperInnerTop - upperInnerBottom;
  const shelfD = carcassD - BACK_T - 0.02;
  const shelfZ = carcassZ + BACK_T * 0.5 - 0.005;

  addBox(innerW - 0.004, GLASS_T, shelfD, 0, upperInnerBottom + upperSpan * 0.33, shelfZ, glassMat, 'upper_glass_shelf_1');
  addBox(innerW - 0.004, GLASS_T, shelfD, 0, upperInnerBottom + upperSpan * 0.67, shelfZ, glassMat, 'upper_glass_shelf_2');

  // Door dimensions
  const doorW = (innerW - GAP * 3) * 0.5;
  const leftDoorX = -doorW * 0.5 - GAP * 0.5;
  const rightDoorX = doorW * 0.5 + GAP * 0.5;

  // Upper glass doors
  const upperDoorBottom = DIVIDER_Y + PANEL_T * 0.5 + GAP;
  const upperDoorTop = H - PANEL_T - GAP;
  const upperDoorH = upperDoorTop - upperDoorBottom;
  const upperDoorY = (upperDoorTop + upperDoorBottom) * 0.5;

  function buildUpperDoor(cx, side) {
    const innerH = upperDoorH - 2 * FRAME_W;
    const innerPaneW = doorW - 2 * FRAME_W;
    addBox(FRAME_W, upperDoorH, DOOR_T, cx - doorW * 0.5 + FRAME_W * 0.5, upperDoorY, frontZ, woodMat, `upper_${side}_door_stile_l`);
    addBox(FRAME_W, upperDoorH, DOOR_T, cx + doorW * 0.5 - FRAME_W * 0.5, upperDoorY, frontZ, woodMat, `upper_${side}_door_stile_r`);
    addBox(innerPaneW, FRAME_W, DOOR_T, cx, upperDoorY + upperDoorH * 0.5 - FRAME_W * 0.5, frontZ, woodMat, `upper_${side}_door_rail_t`);
    addBox(innerPaneW, FRAME_W, DOOR_T, cx, upperDoorY - upperDoorH * 0.5 + FRAME_W * 0.5, frontZ, woodMat, `upper_${side}_door_rail_b`);
    addBox(innerPaneW, innerH, GLASS_T, cx, upperDoorY, frontZ, glassMat, `upper_${side}_door_glass`);
  }

  buildUpperDoor(leftDoorX, 'left');
  buildUpperDoor(rightDoorX, 'right');

  // Lower solid shaker doors
  const lowerDoorBottom = PLINTH_H + PANEL_T * 0.5 + GAP;
  const lowerDoorTop = DIVIDER_Y - PANEL_T * 0.5 - GAP * 2;
  const lowerDoorH = lowerDoorTop - lowerDoorBottom;
  const lowerDoorY = (lowerDoorTop + lowerDoorBottom) * 0.5;

  function buildLowerDoor(cx, side) {
    const innerH = lowerDoorH - 2 * FRAME_W;
    const innerPaneW = doorW - 2 * FRAME_W;
    addBox(FRAME_W, lowerDoorH, DOOR_T, cx - doorW * 0.5 + FRAME_W * 0.5, lowerDoorY, frontZ, woodMat, `lower_${side}_door_stile_l`);
    addBox(FRAME_W, lowerDoorH, DOOR_T, cx + doorW * 0.5 - FRAME_W * 0.5, lowerDoorY, frontZ, woodMat, `lower_${side}_door_stile_r`);
    addBox(innerPaneW, FRAME_W, DOOR_T, cx, lowerDoorY + lowerDoorH * 0.5 - FRAME_W * 0.5, frontZ, woodMat, `lower_${side}_door_rail_t`);
    addBox(innerPaneW, FRAME_W, DOOR_T, cx, lowerDoorY - lowerDoorH * 0.5 + FRAME_W * 0.5, frontZ, woodMat, `lower_${side}_door_rail_b`);
    addBox(innerPaneW, innerH, DOOR_T * 0.5, cx, lowerDoorY, frontZ - DOOR_T * 0.15, woodMat, `lower_${side}_door_panel`);
  }

  buildLowerDoor(leftDoorX, 'left');
  buildLowerDoor(rightDoorX, 'right');

  return group;
}
