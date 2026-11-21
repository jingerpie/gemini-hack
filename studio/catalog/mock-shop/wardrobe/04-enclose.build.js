function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.05;
  const H = 2.05;
  const D = 0.60;

  const PLINTH_H = 0.055;
  const PLINTH_INSET = 0.035;
  const PANEL_T = 0.022;
  const DOOR_T = 0.022;
  const GAP = 0.004;
  const CENTER_GAP = 0.016;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9b6e44,
    roughness: 0.62,
    metalness: 0.04,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5e4026,
    roughness: 0.72,
    metalness: 0.04,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x8b8d8e,
    roughness: 0.45,
    metalness: 0.25,
  });

  function addMesh(name, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed plinth base
  const plinthW = W - 2 * PLINTH_INSET;
  const plinthD = D - 2 * PLINTH_INSET;
  addMesh(
    "plinth_base",
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    plinthMat,
    0,
    PLINTH_H / 2,
    0
  );

  // 2. Carcass bottom & top panels
  addMesh(
    "bottom_panel",
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    0,
    PLINTH_H + PANEL_T / 2,
    0
  );

  addMesh(
    "top_panel",
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    0,
    H - PANEL_T / 2,
    0
  );

  // 3. Carcass side panels
  const sideH = H - PLINTH_H - 2 * PANEL_T;
  const sideY = PLINTH_H + PANEL_T + sideH / 2;

  addMesh(
    "left_side_panel",
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    woodMat,
    -W / 2 + PANEL_T / 2,
    sideY,
    0
  );

  addMesh(
    "right_side_panel",
    new THREE.BoxGeometry(PANEL_T, sideH, D),
    woodMat,
    W / 2 - PANEL_T / 2,
    sideY,
    0
  );

  // 4. Carcass back panel
  const innerW = W - 2 * PANEL_T;
  addMesh(
    "back_panel",
    new THREE.BoxGeometry(innerW, sideH, PANEL_T),
    woodMat,
    0,
    sideY,
    -D / 2 + PANEL_T / 2
  );

  // 5. Doors
  const doorW = (innerW - 2 * GAP - CENTER_GAP) / 2;
  const doorH = sideH - 2 * GAP;
  const doorZ = D / 2 - DOOR_T / 2;

  addMesh(
    "left_door",
    new THREE.BoxGeometry(doorW, doorH, DOOR_T),
    woodMat,
    -(CENTER_GAP / 2 + doorW / 2),
    sideY,
    doorZ
  );

  addMesh(
    "right_door",
    new THREE.BoxGeometry(doorW, doorH, DOOR_T),
    woodMat,
    CENTER_GAP / 2 + doorW / 2,
    sideY,
    doorZ
  );

  // 6. Integrated vertical finger-pull shadow gap & beveled inner edges
  const gripW = 0.008;
  const gripD = DOOR_T * 0.65;
  const gripZ = D / 2 - DOOR_T + gripD / 2;

  addMesh(
    "left_door_grip_edge",
    new THREE.BoxGeometry(gripW, doorH, gripD),
    darkWoodMat,
    -(CENTER_GAP / 2 - gripW / 2),
    sideY,
    gripZ
  );

  addMesh(
    "right_door_grip_edge",
    new THREE.BoxGeometry(gripW, doorH, gripD),
    darkWoodMat,
    CENTER_GAP / 2 - gripW / 2,
    sideY,
    gripZ
  );

  addMesh(
    "center_shadow_backing",
    new THREE.BoxGeometry(CENTER_GAP + 0.012, doorH, 0.012),
    darkWoodMat,
    0,
    sideY,
    D / 2 - DOOR_T - 0.006
  );

  // 7. Interior shelf (structural, behind closed doors)
  addMesh(
    "interior_top_shelf",
    new THREE.BoxGeometry(innerW, PANEL_T, D - PANEL_T - DOOR_T - 0.02),
    woodMat,
    0,
    H - 0.42,
    -0.01
  );

  return group;
}
