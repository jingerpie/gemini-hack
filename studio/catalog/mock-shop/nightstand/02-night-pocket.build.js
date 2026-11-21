function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.42;           // total width (X) including right block
  const H = 0.52;           // total height (Y)
  const D = 0.36;           // total depth (Z)
  const T = 0.015;          // 15mm birch plywood thickness
  const BLOCK_W = 0.09;     // 9 cm solid laminated right block width
  const BASE_CLEAR = 0.06;  // bottom shelf clearance from y = 0
  const TOP_LIP = 0.035;    // side/back lip above top shelf
  const R = 0.038;          // generous corner radius (~4 cm)

  const SHELF_W = W - T - BLOCK_W;
  const SHELF_CENTER_X = (T - BLOCK_W) / 2;
  const INNER_D = D - T;    // depth in front of back panel

  // Materials
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6cf86,
    roughness: 0.7,
    metalness: 0.02
  });

  const plyEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xdfc9a6,
    roughness: 0.75,
    metalness: 0.0
  });

  // Helper to create a rounded rectangle shape in 2D (x: -D/2..D/2, y: 0..H)
  function createSidePanelShape() {
    const s = new THREE.Shape();
    const x0 = -D / 2;
    const x1 = D / 2;
    const y0 = 0;
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

  // Right solid block shape in x-y plane with deep V-notch magazine pocket
  function createRightBlockShape() {
    const s = new THREE.Shape();
    const x0 = W / 2 - BLOCK_W;
    const x1 = W / 2;
    const y0 = 0;
    const y1 = H;

    const vCenter = (x0 + x1) / 2;
    const vHalfTop = 0.02;      // 4 cm wide at top
    const vBottomY = H * 0.33;  // ~1/3 height from floor
    const vTipR = 0.005;        // ~1 cm rounded bottom
    const rTop = 0.018;         // rounded top corners
    const rVTop = 0.004;        // small transition radius at V-notch top

    s.moveTo(x0, y0);
    s.lineTo(x1 - R, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + R);
    s.lineTo(x1, y1 - rTop);
    s.quadraticCurveTo(x1, y1, x1 - rTop, y1);

    // Top of right ear into V-notch
    s.lineTo(vCenter + vHalfTop + rVTop, y1);
    s.quadraticCurveTo(vCenter + vHalfTop, y1, vCenter + vHalfTop - 0.002, y1 - rVTop);

    // Down into V-notch
    s.lineTo(vCenter + vTipR, vBottomY + vTipR);
    s.quadraticCurveTo(vCenter, vBottomY - vTipR * 0.4, vCenter - vTipR, vBottomY + vTipR);

    // Up out of V-notch
    s.lineTo(vCenter - vHalfTop + 0.002, y1 - rVTop);
    s.quadraticCurveTo(vCenter - vHalfTop, y1, vCenter - vHalfTop - rVTop, y1);

    // Top of left ear to inner edge
    s.lineTo(x0 + rTop, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - rTop);
    s.lineTo(x0, y0);
    return s;
  }

  // 1. Left side panel (touches y = 0)
  const leftGeo = new THREE.ExtrudeGeometry(createSidePanelShape(), {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16
  });
  leftGeo.rotateY(Math.PI / 2);
  const leftPanel = new THREE.Mesh(leftGeo, [yellowMat, plyEdgeMat]);
  leftPanel.position.set(-W / 2, 0, 0);
  leftPanel.name = 'left_side_panel';
  leftPanel.castShadow = true;
  leftPanel.receiveShadow = true;
  group.add(leftPanel);

  // 2. Right solid laminated block with V-notch magazine pocket (touches y = 0)
  const rightBlockGeo = new THREE.ExtrudeGeometry(createRightBlockShape(), {
    depth: D,
    bevelEnabled: false,
    curveSegments: 16
  });
  const rightBlock = new THREE.Mesh(rightBlockGeo, yellowMat);
  rightBlock.position.set(0, 0, -D / 2);
  rightBlock.name = 'right_pocket_block';
  rightBlock.castShadow = true;
  rightBlock.receiveShadow = true;
  group.add(rightBlock);

  // 3. Back panel
  const backH = H - BASE_CLEAR;
  const backGeo = new THREE.BoxGeometry(SHELF_W, backH, T);
  const backPanel = new THREE.Mesh(backGeo, [
    yellowMat, yellowMat, plyEdgeMat, plyEdgeMat, yellowMat, yellowMat
  ]);
  backPanel.position.set(SHELF_CENTER_X, BASE_CLEAR + backH / 2, -D / 2 + T / 2);
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

  const shelfGeo = new THREE.BoxGeometry(SHELF_W, T, INNER_D);

  // 4. Bottom shelf (raised by BASE_CLEAR = 6 cm)
  const bottomShelfY = BASE_CLEAR + T / 2;
  const bottomShelf = new THREE.Mesh(shelfGeo, shelfMats);
  bottomShelf.position.set(SHELF_CENTER_X, bottomShelfY, T / 2);
  bottomShelf.name = 'bottom_shelf';
  bottomShelf.castShadow = true;
  bottomShelf.receiveShadow = true;
  group.add(bottomShelf);

  // 5. Top shelf
  const topShelfY = H - TOP_LIP - T / 2;
  const topShelf = new THREE.Mesh(shelfGeo, shelfMats);
  topShelf.position.set(SHELF_CENTER_X, topShelfY, T / 2);
  topShelf.name = 'top_shelf';
  topShelf.castShadow = true;
  topShelf.receiveShadow = true;
  group.add(topShelf);

  // 6. Middle shelf
  const midShelfY = (bottomShelfY + topShelfY) / 2;
  const midShelf = new THREE.Mesh(shelfGeo, shelfMats);
  midShelf.position.set(SHELF_CENTER_X, midShelfY, T / 2);
  midShelf.name = 'middle_shelf';
  midShelf.castShadow = true;
  midShelf.receiveShadow = true;
  group.add(midShelf);

  // 7-8. Subtle inner shelf support cleats under middle shelf
  const cleatGeo = new THREE.BoxGeometry(0.01, 0.01, INNER_D - 0.04);
  const cleatLeft = new THREE.Mesh(cleatGeo, yellowMat);
  cleatLeft.position.set(SHELF_CENTER_X - SHELF_W / 2 + 0.005, midShelfY - T / 2 - 0.005, T / 2);
  cleatLeft.name = 'middle_shelf_cleat_left';
  cleatLeft.castShadow = true;
  cleatLeft.receiveShadow = true;
  group.add(cleatLeft);

  const cleatRight = new THREE.Mesh(cleatGeo, yellowMat);
  cleatRight.position.set(SHELF_CENTER_X + SHELF_W / 2 - 0.005, midShelfY - T / 2 - 0.005, T / 2);
  cleatRight.name = 'middle_shelf_cleat_right';
  cleatRight.castShadow = true;
  cleatRight.receiveShadow = true;
  group.add(cleatRight);

  return group;
}
