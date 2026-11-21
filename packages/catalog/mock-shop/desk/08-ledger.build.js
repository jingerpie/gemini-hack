function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.80;          // Overall width (80 cm)
  const H = 0.60;          // Cabinet height
  const D_BOX = 0.22;      // Cabinet box depth
  const D_LID = 0.50;      // Open drop-down lid depth
  const D = D_BOX + D_LID; // Total depth when open
  const T = 0.020;         // Outer panel thickness
  const T_BACK = 0.012;    // Back panel thickness
  const T_WOOD = 0.015;    // Interior wood shelf thickness
  const CUBBY_W = 0.15;    // Width of left cubby column
  const TOP_SHELF_Y = H - 0.13; // Y position of upper horizontal shelf

  // Z reference coordinates (centered on z = 0)
  const Z_BACK = -D / 2;
  const Z_BOX_CENTER = Z_BACK + D_BOX / 2;
  const Z_BOX_FRONT = Z_BACK + D_BOX;
  const Z_LID_CENTER = Z_BOX_FRONT + D_LID / 2;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4da,
    roughness: 0.62,
    metalness: 0.04
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b43,
    roughness: 0.55,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3c,
    roughness: 0.35,
    metalness: 0.75
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Outer cabinet shell
  const sideGeo = new THREE.BoxGeometry(T, H, D_BOX);
  addMesh(sideGeo, creamMat, 'left_side_panel', -W / 2 + T / 2, H / 2, Z_BOX_CENTER);
  addMesh(sideGeo, creamMat, 'right_side_panel', W / 2 - T / 2, H / 2, Z_BOX_CENTER);

  const topBottomGeo = new THREE.BoxGeometry(W - 2 * T, T, D_BOX);
  addMesh(topBottomGeo, creamMat, 'top_panel', 0, H - T / 2, Z_BOX_CENTER);
  addMesh(topBottomGeo, creamMat, 'bottom_panel', 0, T / 2, Z_BOX_CENTER);

  const backGeo = new THREE.BoxGeometry(W - 2 * T, H - 2 * T, T_BACK);
  addMesh(backGeo, creamMat, 'back_panel', 0, H / 2, Z_BACK + T_BACK / 2);

  // 2. Interior mounting rails & screws
  const railH = 0.045;
  const railD = 0.012;
  const railGeo = new THREE.BoxGeometry(W - 2 * T, railH, railD);
  const railZ = Z_BACK + T_BACK + railD / 2;
  addMesh(railGeo, creamMat, 'top_mounting_rail', 0, H - T - railH / 2, railZ);
  addMesh(railGeo, creamMat, 'bottom_mounting_rail', 0, T + railH / 2, railZ);

  const screwGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.004, 12);
  const screwX = W / 2 - T - 0.07;
  const screwZ = railZ + railD / 2 + 0.001;
  addMesh(screwGeo, metalMat, 'mounting_screw_tl', -screwX, H - T - railH / 2, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, metalMat, 'mounting_screw_tr', screwX, H - T - railH / 2, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, metalMat, 'mounting_screw_bl', -screwX, T + railH / 2, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, metalMat, 'mounting_screw_br', screwX, T + railH / 2, screwZ, Math.PI / 2, 0, 0);

  // 3. Interior wood shelving
  const shelfD = D_BOX - T_BACK - 0.015;
  const shelfZ = Z_BACK + T_BACK + shelfD / 2;

  const topShelfGeo = new THREE.BoxGeometry(W - 2 * T, T_WOOD, shelfD);
  addMesh(topShelfGeo, woodMat, 'top_wood_shelf', 0, TOP_SHELF_Y, shelfZ);

  const cubbyH = TOP_SHELF_Y - T_WOOD / 2 - T;
  const cubbyDivGeo = new THREE.BoxGeometry(T_WOOD, cubbyH, shelfD);
  const cubbyDivX = -W / 2 + T + CUBBY_W + T_WOOD / 2;
  addMesh(cubbyDivGeo, woodMat, 'cubby_vertical_divider', cubbyDivX, T + cubbyH / 2, shelfZ);

  const cubbyShelfGeo = new THREE.BoxGeometry(CUBBY_W, T_WOOD, shelfD);
  const cubbyShelfX = -W / 2 + T + CUBBY_W / 2;
  const cubbyStep = cubbyH / 3;
  addMesh(cubbyShelfGeo, woodMat, 'cubby_shelf_lower', cubbyShelfX, T + cubbyStep, shelfZ);
  addMesh(cubbyShelfGeo, woodMat, 'cubby_shelf_upper', cubbyShelfX, T + 2 * cubbyStep, shelfZ);

  // 4. Drop-down desk lid (open horizontal position)
  const lidW = W - 2 * T - 0.004;
  const lidWoodGeo = new THREE.BoxGeometry(lidW, T * 0.85, D_LID);
  addMesh(lidWoodGeo, woodMat, 'desk_lid_wood_core', 0, (T * 0.85) / 2, Z_LID_CENTER);

  const lidTopGeo = new THREE.BoxGeometry(lidW - 0.008, T * 0.25, D_LID - 0.006);
  addMesh(lidTopGeo, creamMat, 'desk_lid_top_surface', 0, T * 0.85 + (T * 0.25) / 2 - 0.001, Z_LID_CENTER - 0.002);

  // Hinges connecting lid to bottom panel
  const hingeGeo = new THREE.BoxGeometry(0.025, 0.008, 0.024);
  addMesh(hingeGeo, metalMat, 'lid_hinge_left', -lidW / 2 + 0.06, T + 0.002, Z_BOX_FRONT);
  addMesh(hingeGeo, metalMat, 'lid_hinge_right', lidW / 2 - 0.06, T + 0.002, Z_BOX_FRONT);

  // 5. Folding metal stays (left and right)
  const trackH = 0.18;
  const trackGeo = new THREE.BoxGeometry(0.008, trackH, 0.018);
  const trackY = 0.26;
  const trackZ = Z_BOX_FRONT - 0.035;
  const leftInnerX = -W / 2 + T + 0.004;
  const rightInnerX = W / 2 - T - 0.004;

  addMesh(trackGeo, metalMat, 'stay_track_left', leftInnerX, trackY, trackZ);
  addMesh(trackGeo, metalMat, 'stay_track_right', rightInnerX, trackY, trackZ);

  // Angled stay arms from track bottom to lid
  const armStartY = trackY - trackH / 2 + 0.01;
  const armStartZ = trackZ;
  const armEndY = T + 0.005;
  const armEndZ = Z_BOX_FRONT + 0.11;
  const dy = armEndY - armStartY;
  const dz = armEndZ - armStartZ;
  const armLen = Math.sqrt(dy * dy + dz * dz);
  const armAngle = Math.atan2(dy, dz);

  const armGeo = new THREE.BoxGeometry(0.007, 0.014, armLen);
  const armMidY = (armStartY + armEndY) / 2;
  const armMidZ = (armStartZ + armEndZ) / 2;

  addMesh(armGeo, metalMat, 'stay_arm_left', leftInnerX + 0.006, armMidY, armMidZ, -armAngle, 0, 0);
  addMesh(armGeo, metalMat, 'stay_arm_right', rightInnerX - 0.006, armMidY, armMidZ, -armAngle, 0, 0);

  const bracketGeo = new THREE.BoxGeometry(0.014, 0.012, 0.028);
  addMesh(bracketGeo, metalMat, 'stay_bracket_left', leftInnerX + 0.008, T + 0.006, armEndZ);
  addMesh(bracketGeo, metalMat, 'stay_bracket_right', rightInnerX - 0.008, T + 0.006, armEndZ);

  return group;
}
