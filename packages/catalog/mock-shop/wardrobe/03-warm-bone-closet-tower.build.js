function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.61;
  const H = 2.15;
  const D = 0.60;

  const PANEL_T = 0.022;
  const BACK_T = 0.012;
  const DOOR_T = 0.020;
  const GAP = 0.003;
  const INSET_Z = 0.004;
  const PLINTH_H = 0.045;

  const INNER_W = W - 2 * PANEL_T;
  const DRAWER_AREA_H = 0.56;
  const DRAWER_H = (DRAWER_AREA_H - 4 * GAP) / 3;
  const PULL_H = 0.016;

  const DOOR_AREA_H = H - PANEL_T - PLINTH_H - DRAWER_AREA_H - 2 * GAP;
  const DOOR_W = (INNER_W - 3 * GAP) / 2;

  const HANDLE_W = 0.016; // per door
  const HANDLE_H = 0.44;
  const HANDLE_BOTTOM_OFFSET = 0.14; // from bottom of door

  // Materials
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c5,
    roughness: 0.65,
    metalness: 0.04,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0xb8afa3,
    roughness: 0.85,
    metalness: 0.02,
  });

  function addMesh(geo, mat, x, y, z, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Carcass
  const sideGeo = new THREE.BoxGeometry(PANEL_T, H, D);
  addMesh(sideGeo, boneMat, -W / 2 + PANEL_T / 2, H / 2, 0, "left_side_panel");
  addMesh(sideGeo, boneMat, W / 2 - PANEL_T / 2, H / 2, 0, "right_side_panel");

  const topGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, D);
  addMesh(topGeo, boneMat, 0, H - PANEL_T / 2, 0, "top_panel");

  const plinthGeo = new THREE.BoxGeometry(INNER_W, PLINTH_H, D - 0.02);
  addMesh(plinthGeo, boneMat, 0, PLINTH_H / 2, -0.01, "bottom_plinth");

  const backGeo = new THREE.BoxGeometry(INNER_W, H - PANEL_T - PLINTH_H, BACK_T);
  addMesh(
    backGeo,
    boneMat,
    0,
    PLINTH_H + (H - PANEL_T - PLINTH_H) / 2,
    -D / 2 + BACK_T / 2,
    "back_panel"
  );

  const midShelfY = PLINTH_H + DRAWER_AREA_H;
  const midShelfGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, D - DOOR_T - INSET_Z);
  addMesh(
    midShelfGeo,
    boneMat,
    0,
    midShelfY,
    -(DOOR_T + INSET_Z) / 2,
    "interior_divider_shelf"
  );

  // 2. Lower Drawers (3 stacked drawers with top finger-pull recess)
  const frontZ = D / 2 - INSET_Z - DOOR_T / 2;
  const recessZ = D / 2 - INSET_Z - DOOR_T - 0.005;

  for (let i = 0; i < 3; i++) {
    const drawerBottomY = PLINTH_H + GAP + i * (DRAWER_H + GAP);
    const faceH = DRAWER_H - PULL_H;
    const faceY = drawerBottomY + faceH / 2;

    const drawerGeo = new THREE.BoxGeometry(INNER_W - 2 * GAP, faceH, DOOR_T);
    addMesh(drawerGeo, boneMat, 0, faceY, frontZ, `drawer_${i + 1}_front`);

    const pullY = drawerBottomY + faceH + PULL_H / 2;
    const pullGeo = new THREE.BoxGeometry(INNER_W - 2 * GAP, PULL_H + 0.004, 0.012);
    addMesh(pullGeo, recessMat, 0, pullY, recessZ, `drawer_${i + 1}_pull_recess`);
  }

  // 3. Upper Doors (2 doors with central vertical recessed handle)
  const doorBottomY = PLINTH_H + DRAWER_AREA_H + GAP;
  const doorTopY = doorBottomY + DOOR_AREA_H;

  const upperH = DOOR_AREA_H - HANDLE_BOTTOM_OFFSET - HANDLE_H;
  const lowerH = HANDLE_BOTTOM_OFFSET;
  const outerW = DOOR_W - HANDLE_W;

  // Left door (x < 0, handle notch on inner/right edge)
  const leftOuterX = -GAP / 2 - HANDLE_W - outerW / 2;

  addMesh(
    new THREE.BoxGeometry(outerW, DOOR_AREA_H, DOOR_T),
    boneMat,
    leftOuterX,
    doorBottomY + DOOR_AREA_H / 2,
    frontZ,
    "left_door_outer"
  );
  addMesh(
    new THREE.BoxGeometry(HANDLE_W, upperH, DOOR_T),
    boneMat,
    -GAP / 2 - HANDLE_W / 2,
    doorTopY - upperH / 2,
    frontZ,
    "left_door_upper"
  );
  addMesh(
    new THREE.BoxGeometry(HANDLE_W, lowerH, DOOR_T),
    boneMat,
    -GAP / 2 - HANDLE_W / 2,
    doorBottomY + lowerH / 2,
    frontZ,
    "left_door_lower"
  );

  // Right door (x > 0, handle notch on inner/left edge)
  const rightOuterX = GAP / 2 + HANDLE_W + outerW / 2;

  addMesh(
    new THREE.BoxGeometry(outerW, DOOR_AREA_H, DOOR_T),
    boneMat,
    rightOuterX,
    doorBottomY + DOOR_AREA_H / 2,
    frontZ,
    "right_door_outer"
  );
  addMesh(
    new THREE.BoxGeometry(HANDLE_W, upperH, DOOR_T),
    boneMat,
    GAP / 2 + HANDLE_W / 2,
    doorTopY - upperH / 2,
    frontZ,
    "right_door_upper"
  );
  addMesh(
    new THREE.BoxGeometry(HANDLE_W, lowerH, DOOR_T),
    boneMat,
    GAP / 2 + HANDLE_W / 2,
    doorBottomY + lowerH / 2,
    frontZ,
    "right_door_lower"
  );

  // Recessed backing behind the central vertical door handle
  const handleRecessGeo = new THREE.BoxGeometry(
    2 * HANDLE_W + GAP + 0.01,
    HANDLE_H + 0.01,
    0.012
  );
  addMesh(
    handleRecessGeo,
    recessMat,
    0,
    doorBottomY + HANDLE_BOTTOM_OFFSET + HANDLE_H / 2,
    recessZ,
    "door_handle_recess"
  );

  return group;
}
