function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.42;          // total width (X)
  const H = 0.52;          // total height (Y)
  const D = 0.36;          // total depth (Z)
  const T = 0.018;         // 18mm plywood thickness
  const FOOT_H = 0.004;    // felt foot pad height
  const BASE_CLEAR = 0.026;// bottom shelf clearance from y=0
  const TOP_LIP = 0.036;   // side/back lip above top shelf
  const R = 0.024;         // corner radius for side panels

  const INNER_W = W - 2 * T;
  const INNER_D = D - T;   // depth in front of back panel

  // Materials
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6cf75,
    roughness: 0.62,
    metalness: 0.02
  });

  const plyEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd4b68c,
    roughness: 0.78,
    metalness: 0.0
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x3b3834,
    roughness: 0.95,
    metalness: 0.0
  });

  // Helper to create a rounded rectangle shape in 2D (x: -D/2..D/2, y: FOOT_H..H)
  function createLeftPanelShape() {
    const s = new THREE.Shape();
    const x0 = -D / 2;
    const x1 = D / 2;
    const y0 = FOOT_H;
    const y1 = H;

    s.moveTo(x0 + R, y0);
    s.lineTo(x1 - R, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + R);
    s.lineTo(x1, y1 - R);
    s.quadraticCurveTo(x1, y1, x1 - R, y1);
    s.lineTo(x0 + R, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - R);
    s.lineTo(x0, y0 + R);
    s.quadraticCurveTo(x0, y0, x0 + R, y0);
    return s;
  }

  // Right panel shape with distinctive V-shaped pocket cutout
  function createRightPanelShape() {
    const s = new THREE.Shape();
    const x0 = -D / 2;
    const x1 = D / 2;
    const y0 = FOOT_H;
    const y1 = H;

    // V-cutout parameters (in 2D shape X, where +X corresponds to -Z or +Z depending on rotation)
    const vCenter = 0.015;
    const vHalfTop = 0.052;
    const vBottomY = y0 + 0.125;
    const vTipR = 0.012;
    const rSmall = 0.018;

    s.moveTo(x0 + R, y0);
    s.lineTo(x1 - R, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + R);
    s.lineTo(x1, y1 - R);
    s.quadraticCurveTo(x1, y1, x1 - R, y1);

    // Top edge of front-right ear
    s.lineTo(vCenter + vHalfTop + rSmall, y1);
    s.quadraticCurveTo(vCenter + vHalfTop, y1, vCenter + vHalfTop - 0.004, y1 - rSmall);

    // Down into V-cutout
    s.lineTo(vCenter + vTipR, vBottomY + vTipR);
    s.quadraticCurveTo(vCenter, vBottomY - vTipR * 0.4, vCenter - vTipR, vBottomY + vTipR);

    // Up out of V-cutout
    s.lineTo(vCenter - vHalfTop + 0.004, y1 - rSmall);
    s.quadraticCurveTo(vCenter - vHalfTop, y1, vCenter - vHalfTop - rSmall, y1);

    // Top edge of back-right ear
    s.lineTo(x0 + R, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - R);
    s.lineTo(x0, y0 + R);
    s.quadraticCurveTo(x0, y0, x0 + R, y0);
    return s;
  }

  const extrudeSettings = {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16
  };

  // 1. Left side panel
  const leftGeo = new THREE.ExtrudeGeometry(createLeftPanelShape(), extrudeSettings);
  leftGeo.rotateY(Math.PI / 2);
  const leftPanel = new THREE.Mesh(leftGeo, [yellowMat, plyEdgeMat]);
  leftPanel.position.set(-W / 2, 0, 0);
  leftPanel.name = 'left_side_panel';
  leftPanel.castShadow = true;
  leftPanel.receiveShadow = true;
  group.add(leftPanel);

  // 2. Right side panel (with V-pocket)
  const rightGeo = new THREE.ExtrudeGeometry(createRightPanelShape(), extrudeSettings);
  rightGeo.rotateY(Math.PI / 2);
  const rightPanel = new THREE.Mesh(rightGeo, [yellowMat, plyEdgeMat]);
  rightPanel.position.set(W / 2 - T, 0, 0);
  rightPanel.name = 'right_side_panel';
  rightPanel.castShadow = true;
  rightPanel.receiveShadow = true;
  group.add(rightPanel);

  // 3. Back panel
  const backH = H - BASE_CLEAR;
  const backGeo = new THREE.BoxGeometry(INNER_W, backH, T);
  const backPanel = new THREE.Mesh(backGeo, [
    yellowMat, yellowMat, plyEdgeMat, plyEdgeMat, yellowMat, yellowMat
  ]);
  backPanel.position.set(0, BASE_CLEAR + backH / 2, -D / 2 + T / 2);
  backPanel.name = 'back_panel';
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // Shelf material array: +Z front edge is exposed plywood
  const shelfMats = [
    yellowMat,   // +X
    yellowMat,   // -X
    yellowMat,   // +Y (top)
    yellowMat,   // -Y (bottom)
    plyEdgeMat,  // +Z (front exposed edge)
    yellowMat    // -Z
  ];

  const shelfGeo = new THREE.BoxGeometry(INNER_W, T, INNER_D);

  // 4. Bottom shelf
  const bottomShelfY = BASE_CLEAR + T / 2;
  const bottomShelf = new THREE.Mesh(shelfGeo, shelfMats);
  bottomShelf.position.set(0, bottomShelfY, T / 2);
  bottomShelf.name = 'bottom_shelf';
  bottomShelf.castShadow = true;
  bottomShelf.receiveShadow = true;
  group.add(bottomShelf);

  // 5. Top shelf
  const topShelfY = H - TOP_LIP - T / 2;
  const topShelf = new THREE.Mesh(shelfGeo, shelfMats);
  topShelf.position.set(0, topShelfY, T / 2);
  topShelf.name = 'top_shelf';
  topShelf.castShadow = true;
  topShelf.receiveShadow = true;
  group.add(topShelf);

  // 6. Middle shelf
  const midShelfY = (bottomShelfY + topShelfY) / 2;
  const midShelf = new THREE.Mesh(shelfGeo, shelfMats);
  midShelf.position.set(0, midShelfY, T / 2);
  midShelf.name = 'middle_shelf';
  midShelf.castShadow = true;
  midShelf.receiveShadow = true;
  group.add(midShelf);

  // 7-8. Subtle inner shelf support cleats under middle shelf
  const cleatGeo = new THREE.BoxGeometry(0.012, 0.012, INNER_D - 0.04);
  const cleatLeft = new THREE.Mesh(cleatGeo, yellowMat);
  cleatLeft.position.set(-INNER_W / 2 + 0.006, midShelfY - T / 2 - 0.006, T / 2);
  cleatLeft.name = 'middle_shelf_cleat_left';
  cleatLeft.castShadow = true;
  cleatLeft.receiveShadow = true;
  group.add(cleatLeft);

  const cleatRight = new THREE.Mesh(cleatGeo, yellowMat);
  cleatRight.position.set(INNER_W / 2 - 0.006, midShelfY - T / 2 - 0.006, T / 2);
  cleatRight.name = 'middle_shelf_cleat_right';
  cleatRight.castShadow = true;
  cleatRight.receiveShadow = true;
  group.add(cleatRight);

  // 9-12. Four felt foot pads touching y = 0
  const footGeo = new THREE.CylinderGeometry(0.011, 0.011, FOOT_H, 16);
  const footPositions = [
    { name: 'foot_pad_fl', x: -W / 2 + T / 2, z: D / 2 - 0.035 },
    { name: 'foot_pad_fr', x: W / 2 - T / 2, z: D / 2 - 0.035 },
    { name: 'foot_pad_bl', x: -W / 2 + T / 2, z: -D / 2 + 0.035 },
    { name: 'foot_pad_br', x: W / 2 - T / 2, z: -D / 2 + 0.035 }
  ];

  footPositions.forEach((fp) => {
    const foot = new THREE.Mesh(footGeo, feltMat);
    foot.position.set(fp.x, FOOT_H / 2, fp.z);
    foot.name = fp.name;
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  return group;
}
