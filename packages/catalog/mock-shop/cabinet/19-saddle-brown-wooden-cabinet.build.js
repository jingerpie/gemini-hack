function build(THREE) {
  const group = new THREE.Group();

  const W = 1.10;
  const H = 1.05;
  const D = 0.45;
  const PLINTH_H = 0.03;
  const PLINTH_INSET = 0.03;
  const FRAME_T = 0.022;
  const DOOR_D = 0.02;
  const GAP = 0.003;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a2a,
    roughness: 0.48,
    metalness: 0.04,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2b180d,
    roughness: 0.8,
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

  // Plinth base
  addBox(
    'plinth_base',
    W - PLINTH_INSET * 2,
    PLINTH_H,
    D - PLINTH_INSET * 2,
    0,
    PLINTH_H / 2,
    0,
    woodMat
  );

  // Outer carcass
  const carcassY0 = PLINTH_H;
  const carcassH = H - PLINTH_H;
  const intW = W - FRAME_T * 2;
  const intH = carcassH - FRAME_T * 2;

  addBox('bottom_panel', W, FRAME_T, D, 0, carcassY0 + FRAME_T / 2, 0, woodMat);
  addBox('top_panel', W, FRAME_T, D, 0, H - FRAME_T / 2, 0, woodMat);
  addBox(
    'left_panel',
    FRAME_T,
    intH,
    D,
    -W / 2 + FRAME_T / 2,
    carcassY0 + carcassH / 2,
    0,
    woodMat
  );
  addBox(
    'right_panel',
    FRAME_T,
    intH,
    D,
    W / 2 - FRAME_T / 2,
    carcassY0 + carcassH / 2,
    0,
    woodMat
  );
  addBox(
    'back_panel',
    intW,
    intH,
    0.018,
    0,
    carcassY0 + carcassH / 2,
    -D / 2 + 0.009,
    woodMat
  );

  // Fronts: 2 doors on top, 1 wide drawer on bottom
  const drawerH = intH * 0.22;
  const doorH = intH - drawerH - GAP;
  const doorW = (intW - GAP) / 2;
  const frontZ = D / 2 - DOOR_D / 2 - 0.001;

  const drawerY = carcassY0 + FRAME_T + drawerH / 2;
  const doorY = carcassY0 + FRAME_T + drawerH + GAP + doorH / 2;

  addBox('bottom_drawer_front', intW, drawerH, DOOR_D, 0, drawerY, frontZ, woodMat);
  addBox('left_door', doorW, doorH, DOOR_D, -doorW / 2 - GAP / 2, doorY, frontZ, woodMat);
  addBox('right_door', doorW, doorH, DOOR_D, doorW / 2 + GAP / 2, doorY, frontZ, woodMat);

  // Interior divider shelf and shadow-gap backing strips
  addBox(
    'divider_shelf',
    intW,
    0.018,
    D - DOOR_D - 0.02,
    0,
    carcassY0 + FRAME_T + drawerH + GAP / 2,
    -0.01,
    woodMat
  );
  addBox(
    'shadow_gap_horizontal',
    intW,
    GAP + 0.004,
    0.01,
    0,
    carcassY0 + FRAME_T + drawerH + GAP / 2,
    frontZ - DOOR_D / 2 - 0.005,
    darkWoodMat
  );
  addBox(
    'shadow_gap_vertical',
    GAP + 0.004,
    doorH,
    0.01,
    0,
    doorY,
    frontZ - DOOR_D / 2 - 0.005,
    darkWoodMat
  );

  // Interior shelf behind doors
  addBox(
    'interior_shelf',
    intW,
    0.018,
    D - DOOR_D - 0.03,
    0,
    doorY,
    -0.015,
    woodMat
  );

  return group;
}
