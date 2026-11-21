function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.40;
  const H = 0.75;
  const D = 0.48;

  const TOP_THICK = 0.026;
  const FRAME_W = 1.08;
  const FRAME_D = 0.36;

  const LEG_X = FRAME_W / 2;
  const LEG_Z = FRAME_D / 2;

  const FOOT_H = 0.008;
  const LEG_R_LOWER = 0.020;
  const LEG_R_UPPER = 0.016;
  const LOWER_LEG_H = 0.44;
  const UPPER_LEG_H = H - TOP_THICK - FOOT_H - LOWER_LEG_H;

  const STRETCHER_Y = 0.16;
  const STRETCHER_H = 0.028;
  const STRETCHER_W = 0.022;

  const TOP_RAIL_Y = H - TOP_THICK - 0.022;
  const TOP_RAIL_H = 0.024;
  const TOP_RAIL_T = 0.022;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88b61,
    roughness: 0.62,
    metalness: 0.02
  });

  const woodInnerMat = new THREE.MeshStandardMaterial({
    color: 0xad7f55,
    roughness: 0.66,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x353738,
    roughness: 0.42,
    metalness: 0.65
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x55585a,
    roughness: 0.35,
    metalness: 0.75
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.1
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

  // 1. Tabletop
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, woodMat, 'tabletop', 0, H - TOP_THICK / 2, 0);

  // 2. Four telescoping legs
  const footGeo = new THREE.CylinderGeometry(LEG_R_LOWER * 0.9, LEG_R_LOWER * 0.9, FOOT_H, 20);
  const lowerLegGeo = new THREE.CylinderGeometry(LEG_R_LOWER, LEG_R_LOWER, LOWER_LEG_H, 24);
  const upperLegGeo = new THREE.CylinderGeometry(LEG_R_UPPER, LEG_R_UPPER, UPPER_LEG_H + 0.02, 24);

  const legPositions = [
    { name: 'front_left', x: -LEG_X, z: LEG_Z },
    { name: 'front_right', x: LEG_X, z: LEG_Z },
    { name: 'back_left', x: -LEG_X, z: -LEG_Z },
    { name: 'back_right', x: LEG_X, z: -LEG_Z }
  ];

  legPositions.forEach((pos) => {
    addMesh(footGeo, footMat, `foot_${pos.name}`, pos.x, FOOT_H / 2, pos.z);
    addMesh(
      lowerLegGeo,
      metalMat,
      `leg_lower_${pos.name}`,
      pos.x,
      FOOT_H + LOWER_LEG_H / 2,
      pos.z
    );
    addMesh(
      upperLegGeo,
      metalMat,
      `leg_upper_${pos.name}`,
      pos.x,
      FOOT_H + LOWER_LEG_H + UPPER_LEG_H / 2,
      pos.z
    );
  });

  // 3. Side stretchers (bottom) & side top rails
  const sideStretcherGeo = new THREE.BoxGeometry(STRETCHER_W, STRETCHER_H, FRAME_D);
  addMesh(sideStretcherGeo, metalMat, 'side_stretcher_left', -LEG_X, STRETCHER_Y, 0);
  addMesh(sideStretcherGeo, metalMat, 'side_stretcher_right', LEG_X, STRETCHER_Y, 0);

  const sideTopRailGeo = new THREE.BoxGeometry(TOP_RAIL_T, TOP_RAIL_H, FRAME_D + 0.02);
  addMesh(sideTopRailGeo, metalMat, 'side_top_rail_left', -LEG_X, TOP_RAIL_Y + 0.008, 0);
  addMesh(sideTopRailGeo, metalMat, 'side_top_rail_right', LEG_X, TOP_RAIL_Y + 0.008, 0);

  // 4. Longitudinal top rails (front and back)
  const longRailGeo = new THREE.BoxGeometry(FRAME_W, TOP_RAIL_H, TOP_RAIL_T);
  addMesh(longRailGeo, metalMat, 'long_top_rail_front', 0, TOP_RAIL_Y, LEG_Z);
  addMesh(longRailGeo, metalMat, 'long_top_rail_back', 0, TOP_RAIL_Y, -LEG_Z);

  // 5. Hanging brackets for the stored leaf
  const bracketGeo = new THREE.BoxGeometry(0.028, 0.046, 0.016);
  const bracketX = FRAME_W * 0.33;
  addMesh(bracketGeo, bracketMat, 'leaf_bracket_front_left', -bracketX, TOP_RAIL_Y - 0.012, LEG_Z + 0.012);
  addMesh(bracketGeo, bracketMat, 'leaf_bracket_front_right', bracketX, TOP_RAIL_Y - 0.012, LEG_Z + 0.012);
  addMesh(bracketGeo, bracketMat, 'leaf_bracket_back_left', -bracketX, TOP_RAIL_Y - 0.012, -LEG_Z - 0.012);
  addMesh(bracketGeo, bracketMat, 'leaf_bracket_back_right', bracketX, TOP_RAIL_Y - 0.012, -LEG_Z - 0.012);

  // 6. Stored expandable leaf (hanging vertically centered at z = 0)
  const LEAF_W = FRAME_W - 0.06;
  const LEAF_H = 0.48;
  const LEAF_BOTTOM_Y = STRETCHER_Y + 0.01;
  const LEAF_CENTER_Y = LEAF_BOTTOM_Y + LEAF_H / 2;
  const LEAF_FRAME_T = 0.032;
  const LEAF_RAIL_W = 0.055;

  // Recessed center panel
  const leafPanelGeo = new THREE.BoxGeometry(
    LEAF_W - LEAF_RAIL_W * 2 + 0.01,
    LEAF_H - LEAF_RAIL_W * 2 + 0.01,
    0.016
  );
  addMesh(leafPanelGeo, woodInnerMat, 'stored_leaf_panel', 0, LEAF_CENTER_Y, 0);

  // Top & bottom rails of leaf
  const leafHorizRailGeo = new THREE.BoxGeometry(LEAF_W, LEAF_RAIL_W, LEAF_FRAME_T);
  addMesh(
    leafHorizRailGeo,
    woodMat,
    'stored_leaf_top_rail',
    0,
    LEAF_BOTTOM_Y + LEAF_H - LEAF_RAIL_W / 2,
    0
  );
  addMesh(
    leafHorizRailGeo,
    woodMat,
    'stored_leaf_bottom_rail',
    0,
    LEAF_BOTTOM_Y + LEAF_RAIL_W / 2,
    0
  );

  // Left, right, and center vertical stiles of leaf
  const leafVertStileGeo = new THREE.BoxGeometry(
    LEAF_RAIL_W,
    LEAF_H - LEAF_RAIL_W * 2,
    LEAF_FRAME_T
  );
  addMesh(
    leafVertStileGeo,
    woodMat,
    'stored_leaf_left_stile',
    -LEAF_W / 2 + LEAF_RAIL_W / 2,
    LEAF_CENTER_Y,
    0
  );
  addMesh(
    leafVertStileGeo,
    woodMat,
    'stored_leaf_right_stile',
    LEAF_W / 2 - LEAF_RAIL_W / 2,
    LEAF_CENTER_Y,
    0
  );

  const leafCenterStileGeo = new THREE.BoxGeometry(
    LEAF_RAIL_W * 0.75,
    LEAF_H - LEAF_RAIL_W * 2,
    LEAF_FRAME_T * 0.9
  );
  addMesh(leafCenterStileGeo, woodMat, 'stored_leaf_center_stile', 0, LEAF_CENTER_Y, 0);

  return group;
}
