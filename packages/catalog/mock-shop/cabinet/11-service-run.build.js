function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 1.80;           // Overall width (1800 mm)
  const H = 0.78;           // Overall height
  const D = 0.45;           // Overall depth
  const LEG_H = 0.16;       // Height of legs
  const LEG_W = 0.042;      // Leg cross-section width/depth
  const LEG_INSET_X = 0.10; // Leg inset from left/right ends
  const LEG_INSET_Z = 0.06; // Leg inset from front/back
  const RAIL_H = 0.036;     // Base frame rail height
  const RAIL_T = 0.032;     // Base frame rail thickness

  const BODY_H = H - LEG_H;
  const PANEL_T = 0.022;    // Carcass panel thickness
  const BACK_T = 0.015;     // Back panel thickness
  const FRONT_T = 0.020;    // Door/drawer front thickness
  const GAP = 0.004;        // Reveal gap around doors/drawers
  const CUTOUT_W = 0.13;    // Finger-pull cutout width on doors
  const CUTOUT_H = 0.016;   // Finger-pull cutout height on doors

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb5aa99,
    roughness: 0.68,
    metalness: 0.03,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x6e6456,
    roughness: 0.88,
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

  // 1. Legs (4)
  const legX = W / 2 - LEG_INSET_X - LEG_W / 2;
  const legZ = D / 2 - LEG_INSET_Z - LEG_W / 2;
  const legY = LEG_H / 2;

  addBox('leg_front_left', LEG_W, LEG_H, LEG_W, -legX, legY, legZ, woodMat);
  addBox('leg_front_right', LEG_W, LEG_H, LEG_W, legX, legY, legZ, woodMat);
  addBox('leg_back_left', LEG_W, LEG_H, LEG_W, -legX, legY, -legZ, woodMat);
  addBox('leg_back_right', LEG_W, LEG_H, LEG_W, legX, legY, -legZ, woodMat);

  // 2. Base apron rails (4)
  const railY = LEG_H - RAIL_H / 2;
  const railSpanX = legX * 2 - LEG_W;
  const railSpanZ = legZ * 2 - LEG_W;

  addBox('base_rail_front', railSpanX, RAIL_H, RAIL_T, 0, railY, legZ, woodMat);
  addBox('base_rail_back', railSpanX, RAIL_H, RAIL_T, 0, railY, -legZ, woodMat);
  addBox('base_rail_left', RAIL_T, RAIL_H, railSpanZ, -legX, railY, 0, woodMat);
  addBox('base_rail_right', RAIL_T, RAIL_H, railSpanZ, legX, railY, 0, woodMat);

  // 3. Main cabinet carcass
  const innerH = BODY_H - PANEL_T * 2;
  const innerW = W - PANEL_T * 2;
  const sideY = LEG_H + BODY_H / 2;

  // Top and bottom panels
  addBox('carcass_top', W, PANEL_T, D, 0, H - PANEL_T / 2, 0, woodMat);
  addBox('carcass_bottom', W, PANEL_T, D, 0, LEG_H + PANEL_T / 2, 0, woodMat);

  // Left and right side panels
  addBox('carcass_side_left', PANEL_T, innerH, D, -W / 2 + PANEL_T / 2, sideY, 0, woodMat);
  addBox('carcass_side_right', PANEL_T, innerH, D, W / 2 - PANEL_T / 2, sideY, 0, woodMat);

  // Back panel
  addBox('carcass_back', innerW, innerH, BACK_T, 0, sideY, -D / 2 + BACK_T / 2, woodMat);

  // Vertical dividers (3 equal bays)
  const bayW = (innerW - PANEL_T * 2) / 3;
  const divX = bayW / 2 + PANEL_T / 2;
  const divD = D - FRONT_T - BACK_T;
  const divZ = -BACK_T / 2;

  addBox('divider_left', PANEL_T, innerH, divD, -divX, sideY, divZ, woodMat);
  addBox('divider_right', PANEL_T, innerH, divD, divX, sideY, divZ, woodMat);

  // 4. Fronts (doors and drawers)
  const frontZ = D / 2 - FRONT_T / 2;
  const doorW = bayW - GAP * 2;
  const doorH = innerH - GAP * 2;
  const leftDoorX = -divX - PANEL_T / 2 - bayW / 2;
  const rightDoorX = divX + PANEL_T / 2 + bayW / 2;

  // Left door (finger-pull cutout at top-right corner)
  const doorMainH = doorH - CUTOUT_H;
  const doorMainY = LEG_H + PANEL_T + GAP + doorMainH / 2;
  const doorTopY = LEG_H + PANEL_T + GAP + doorMainH + CUTOUT_H / 2;

  addBox('door_left_main', doorW, doorMainH, FRONT_T, leftDoorX, doorMainY, frontZ, woodMat);
  addBox(
    'door_left_top',
    doorW - CUTOUT_W,
    CUTOUT_H,
    FRONT_T,
    leftDoorX - CUTOUT_W / 2,
    doorTopY,
    frontZ,
    woodMat
  );
  addBox(
    'door_left_cutout_recess',
    CUTOUT_W,
    CUTOUT_H,
    FRONT_T * 0.5,
    leftDoorX + (doorW - CUTOUT_W) / 2,
    doorTopY,
    frontZ - FRONT_T * 0.25,
    recessMat
  );

  // Right door (finger-pull cutout at top-left corner)
  addBox('door_right_main', doorW, doorMainH, FRONT_T, rightDoorX, doorMainY, frontZ, woodMat);
  addBox(
    'door_right_top',
    doorW - CUTOUT_W,
    CUTOUT_H,
    FRONT_T,
    rightDoorX + CUTOUT_W / 2,
    doorTopY,
    frontZ,
    woodMat
  );
  addBox(
    'door_right_cutout_recess',
    CUTOUT_W,
    CUTOUT_H,
    FRONT_T * 0.5,
    rightDoorX - (doorW - CUTOUT_W) / 2,
    doorTopY,
    frontZ - FRONT_T * 0.25,
    recessMat
  );

  // Center 3 drawers
  const drawerGap = 0.012;
  const drawerW = bayW - GAP * 2;
  const drawerH = (innerH - GAP * 2 - drawerGap * 2) / 3;

  // Recessed backing behind drawer gaps
  addBox(
    'drawer_bay_recess',
    drawerW,
    innerH - GAP * 2,
    FRONT_T * 0.5,
    0,
    sideY,
    frontZ - FRONT_T * 0.3,
    recessMat
  );

  for (let i = 0; i < 3; i++) {
    const dy = LEG_H + PANEL_T + GAP + drawerH / 2 + i * (drawerH + drawerGap);
    addBox(`drawer_front_${i + 1}`, drawerW, drawerH, FRONT_T, 0, dy, frontZ, woodMat);
  }

  return group;
}
