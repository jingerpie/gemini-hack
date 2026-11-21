function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.50;          // Overall width (50 cm)
  const H = 1.85;          // Overall height
  const D = 0.42;          // Overall depth
  const PANEL_T = 0.02;    // Panel thickness
  const BACK_T = 0.012;    // Back panel thickness
  const FOOT_H = 0.02;     // Leveling foot height
  const FOOT_R = 0.016;    // Leveling foot radius
  const PLINTH_H = 0.07;   // Bottom front plinth height
  const GAP = 0.002;       // Door reveal gap

  const INNER_W = W - 2 * PANEL_T;
  const SIDE_H = H - FOOT_H;
  const DOOR_BOTTOM_Y = FOOT_H + PLINTH_H;
  const DOOR_TOP_Y = H - PANEL_T;
  const DOOR_H = DOOR_TOP_Y - DOOR_BOTTOM_Y - 2 * GAP;
  const DOOR_W = INNER_W - 2 * GAP;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6838,
    roughness: 0.65,
    metalness: 0.04
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x633d1c,
    roughness: 0.75,
    metalness: 0.04
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x7a4e26,
    roughness: 0.7,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a857e,
    roughness: 0.45,
    metalness: 0.6
  });

  function addMesh(geometry, material, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx !== 0 || ry !== 0 || rz !== 0) {
      mesh.rotation.set(rx, ry, rz);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Left and right side panels
  const sideGeo = new THREE.BoxGeometry(PANEL_T, SIDE_H, D);
  const sideY = FOOT_H + SIDE_H / 2;
  addMesh(sideGeo, woodMat, 'left_side_panel', -W / 2 + PANEL_T / 2, sideY, 0);
  addMesh(sideGeo, woodMat, 'right_side_panel', W / 2 - PANEL_T / 2, sideY, 0);

  // Top panel
  const topGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, D);
  addMesh(topGeo, woodMat, 'top_panel', 0, H - PANEL_T / 2, 0);

  // Back panel
  const backH = SIDE_H - PANEL_T;
  const backGeo = new THREE.BoxGeometry(INNER_W, backH, BACK_T);
  addMesh(backGeo, woodMat, 'back_panel', 0, FOOT_H + backH / 2, -D / 2 + BACK_T / 2);

  // Bottom front plinth
  const plinthGeo = new THREE.BoxGeometry(INNER_W, PLINTH_H, PANEL_T);
  addMesh(plinthGeo, woodMat, 'front_plinth', 0, FOOT_H + PLINTH_H / 2, D / 2 - PANEL_T / 2 - 0.005);

  // Interior bottom panel
  const bottomD = D - BACK_T;
  const bottomGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, bottomD);
  addMesh(bottomGeo, woodMat, 'bottom_panel', 0, DOOR_BOTTOM_Y + PANEL_T / 2, BACK_T / 2);

  // Tall front door
  const doorGeo = new THREE.BoxGeometry(DOOR_W, DOOR_H, PANEL_T);
  const doorY = (DOOR_BOTTOM_Y + DOOR_TOP_Y) / 2;
  const doorZ = D / 2 - PANEL_T / 2;
  addMesh(doorGeo, woodMat, 'door_panel', 0, doorY, doorZ);

  // Recessed circular finger pull on left side of door
  const pullX = -DOOR_W / 2 + 0.045;
  const pullY = DOOR_BOTTOM_Y + DOOR_H * 0.44;
  const pullRecessGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.004, 24);
  addMesh(pullRecessGeo, darkWoodMat, 'door_pull_recess', pullX, pullY, D / 2 - 0.001, Math.PI / 2, 0, 0);

  const pullRimGeo = new THREE.TorusGeometry(0.016, 0.0015, 8, 24);
  addMesh(pullRimGeo, woodMat, 'door_pull_rim', pullX, pullY, D / 2 + 0.0005);

  // Four leveling feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);
  const footX = W / 2 - PANEL_T - FOOT_R;
  const footZ = D / 2 - 0.04;
  addMesh(footGeo, footMat, 'foot_front_left', -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_front_right', footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_back_left', -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, footMat, 'foot_back_right', footX, FOOT_H / 2, -footZ);

  // Top-back wall mounting brackets
  const bracketGeo = new THREE.BoxGeometry(0.018, 0.025, 0.004);
  addMesh(bracketGeo, metalMat, 'wall_bracket_left', -W / 2 + PANEL_T + 0.02, H + 0.008, -D / 2 + 0.002);
  addMesh(bracketGeo, metalMat, 'wall_bracket_right', W / 2 - PANEL_T - 0.02, H + 0.008, -D / 2 + 0.002);

  return group;
}
