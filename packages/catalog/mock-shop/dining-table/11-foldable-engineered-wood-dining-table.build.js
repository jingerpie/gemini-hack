function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.45;
  const H = 0.75;
  const TOP_T = 0.032;
  const FRAME_W = 0.74;
  const FRAME_D = 0.36;
  const LEG_W = 0.04;
  const FOOT_H = 0.012;
  const BAR_H = 0.036;
  const BAR_T = 0.026;
  const PANEL_T = 0.022;
  const LEAF_H = 0.66;
  const LEAF_D = 0.43;
  const GATE_W = 0.33;
  const GATE_H = 0.58;
  const GATE_ANGLE = 0.14;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc2986c,
    roughness: 0.62,
    metalness: 0.02
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa87c52,
    roughness: 0.66,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222220,
    roughness: 0.55,
    metalness: 0.7
  });

  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    roughness: 0.3,
    metalness: 0.85
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

  // Fixed oak tabletop overhanging the base
  const topGeo = new THREE.BoxGeometry(W, TOP_T, D);
  addMesh(topGeo, woodMat, 'tabletop_fixed', 0, H - TOP_T / 2, 0);

  // 4 Corner Legs + Feet
  const legH = H - TOP_T - FOOT_H;
  const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
  const footGeo = new THREE.CylinderGeometry(LEG_W * 0.44, LEG_W * 0.48, FOOT_H, 12);

  const halfFW = FRAME_W / 2 - LEG_W / 2;
  const halfFD = FRAME_D / 2 - LEG_W / 2;
  const legCoords = [
    [-halfFW, -halfFD, 'back_left'],
    [halfFW, -halfFD, 'back_right'],
    [-halfFW, halfFD, 'front_left'],
    [halfFW, halfFD, 'front_right']
  ];

  legCoords.forEach(([lx, lz, label]) => {
    addMesh(legGeo, metalMat, `leg_${label}`, lx, FOOT_H + legH / 2, lz);
    addMesh(footGeo, metalMat, `foot_${label}`, lx, FOOT_H / 2, lz);
  });

  // Top frame rails connecting the 4 legs
  const topBarY = H - TOP_T - BAR_H / 2;
  const fbRailGeo = new THREE.BoxGeometry(FRAME_W - LEG_W, BAR_H, BAR_T);
  addMesh(fbRailGeo, metalMat, 'top_rail_front', 0, topBarY, halfFD);
  addMesh(fbRailGeo, metalMat, 'top_rail_back', 0, topBarY, -halfFD);

  const sideRailGeo = new THREE.BoxGeometry(BAR_T, BAR_H, FRAME_D - LEG_W);
  addMesh(sideRailGeo, metalMat, 'top_rail_left', -halfFW, topBarY, 0);
  addMesh(sideRailGeo, metalMat, 'top_rail_right', halfFW, topBarY, 0);

  // Low black X-shaped foot bar on the floor between the legs
  const diagLen = Math.hypot(FRAME_W - LEG_W, FRAME_D - LEG_W);
  const diagGeo = new THREE.BoxGeometry(diagLen, BAR_H, BAR_T);
  const diagAngle = Math.atan2(FRAME_D - LEG_W, FRAME_W - LEG_W);
  const bottomBarY = FOOT_H + BAR_H / 2 + 0.01;

  addMesh(diagGeo, metalMat, 'bottom_x_bar_a', 0, bottomBarY, 0, 0, diagAngle, 0);
  addMesh(diagGeo, metalMat, 'bottom_x_bar_b', 0, bottomBarY, 0, 0, -diagAngle, 0);

  // Two wooden gate panels in the middle folded together in a shallow V
  const gateGeo = new THREE.BoxGeometry(GATE_W, GATE_H, PANEL_T);
  const gateY = H - TOP_T - BAR_H - GATE_H / 2 - 0.008;
  const gateOffsetX = (GATE_W / 2) * Math.cos(GATE_ANGLE) + 0.004;
  const gateCenterZ = 0.03;

  addMesh(gateGeo, woodDarkMat, 'gate_panel_left', -gateOffsetX, gateY, gateCenterZ, 0, -GATE_ANGLE, 0);
  addMesh(gateGeo, woodDarkMat, 'gate_panel_right', gateOffsetX, gateY, gateCenterZ, 0, GATE_ANGLE, 0);

  // Visible hinges along the center seam of the gate panels
  const gateHingeGeo = new THREE.BoxGeometry(0.012, 0.036, 0.016);
  const seamZ = gateCenterZ + (GATE_W / 2) * Math.sin(GATE_ANGLE) + PANEL_T / 2;
  addMesh(gateHingeGeo, hingeMat, 'gate_hinge_top', 0, gateY + GATE_H * 0.3, seamZ);
  addMesh(gateHingeGeo, hingeMat, 'gate_hinge_bottom', 0, gateY - GATE_H * 0.3, seamZ);

  // Left (-X) drop leaf hanging straight down from the top edge
  const leafGeo = new THREE.BoxGeometry(PANEL_T, LEAF_H, LEAF_D);
  const leafX = -W / 2 + PANEL_T / 2 + 0.008;
  const leafY = H - TOP_T - LEAF_H / 2;
  addMesh(leafGeo, woodDarkMat, 'drop_leaf_left', leafX, leafY, 0);

  // Hinges attaching the left drop leaf
  const leafHingeGeo = new THREE.BoxGeometry(0.014, 0.036, 0.022);
  const leafHingeX = leafX + PANEL_T / 2 + 0.004;
  addMesh(leafHingeGeo, hingeMat, 'leaf_hinge_top', leafHingeX, H - TOP_T - 0.06, 0.12);
  addMesh(leafHingeGeo, hingeMat, 'leaf_hinge_bottom', leafHingeX, H - TOP_T - LEAF_H + 0.12, 0.12);

  return group;
}
