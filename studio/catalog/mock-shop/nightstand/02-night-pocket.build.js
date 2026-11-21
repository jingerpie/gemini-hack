function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.42;           // total width (X) including pocket
  const H = 0.52;           // total height (Y)
  const D = 0.36;           // total depth (Z)
  const T = 0.015;          // 15mm birch plywood thickness
  const BASE_CLEAR = 0.06;  // bottom shelf clearance from y = 0
  const TOP_LIP = 0.035;    // side/back lip above top shelf
  const R = 0.038;          // generous corner radius (~4 cm)
  const POCKET_GAP = 0.045; // magazine pocket gap (4.5 cm)

  const SHELF_W = W - 3 * T - POCKET_GAP;
  const SHELF_CENTER_X = -(T + POCKET_GAP) / 2;
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

  // Outer right panel shape with wide V-shaped magazine pocket cutout
  function createOuterPocketPanelShape() {
    const s = new THREE.Shape();
    const x0 = -D / 2;
    const x1 = D / 2;
    const y0 = 0;
    const y1 = H;

    // V-cutout parameters: 7 cm wide at top, ~1.5 cm rounded bottom at ~2/3 down, centered
    const vCenter = 0;
    const vHalfTop = 0.035;
    const vBottomY = H * 0.33;
    const vTipR = 0.0075;
    const rEar = 0.016;

    s.moveTo(x0 + R, y0);
    s.lineTo(x1 - R, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + R);
    s.lineTo(x1, y1 - R);
    s.quadraticCurveTo(x1, y1, x1 - R, y1);

    // Top edge of front-right ear
    s.lineTo(vCenter + vHalfTop + rEar, y1);
    s.quadraticCurveTo(vCenter + vHalfTop, y1, vCenter + vHalfTop - 0.004, y1 - rEar);

    // Down into V-cutout
    s.lineTo(vCenter + vTipR, vBottomY + vTipR);
    s.quadraticCurveTo(vCenter, vBottomY - vTipR * 0.4, vCenter - vTipR, vBottomY + vTipR);

    // Up out of V-cutout
    s.lineTo(vCenter - vHalfTop + 0.004, y1 - rEar);
    s.quadraticCurveTo(vCenter - vHalfTop, y1, vCenter - vHalfTop - rEar, y1);

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

  // 1. Left side panel (touches y = 0)
  const leftGeo = new THREE.ExtrudeGeometry(createSidePanelShape(), extrudeSettings);
  leftGeo.rotateY(Math.PI / 2);
  const leftPanel = new THREE.Mesh(leftGeo, [yellowMat, plyEdgeMat]);
  leftPanel.position.set(-W / 2, 0, 0);
  leftPanel.name = 'left_side_panel';
  leftPanel.castShadow = true;
  leftPanel.receiveShadow = true;
  group.add(leftPanel);

  // 2. Right inner divider panel (closes the shelf unit)
  const rightInnerGeo = new THREE.ExtrudeGeometry(createSidePanelShape(), extrudeSettings);
  rightInnerGeo.rotateY(Math.PI / 2);
  const rightInnerPanel = new THREE.Mesh(rightInnerGeo, [yellowMat, plyEdgeMat]);
  rightInnerPanel.position.set(W / 2 - 2 * T - POCKET_GAP, 0, 0);
  rightInnerPanel.name = 'right_inner_panel';
  rightInnerPanel.castShadow = true;
  rightInnerPanel.receiveShadow = true;
  group.add(rightInnerPanel);

  // 3. Right outer pocket panel (with V-slot cutout, touches y = 0)
  const rightOuterGeo = new THREE.ExtrudeGeometry(createOuterPocketPanelShape(), extrudeSettings);
  rightOuterGeo.rotateY(Math.PI / 2);
  const rightOuterPanel = new THREE.Mesh(rightOuterGeo, [yellowMat, plyEdgeMat]);
  rightOuterPanel.position.set(W / 2 - T, 0, 0);
  rightOuterPanel.name = 'right_outer_panel';
  rightOuterPanel.castShadow = true;
  rightOuterPanel.receiveShadow = true;
  group.add(rightOuterPanel);

  // 4. Back panel
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

  // 5. Bottom shelf (raised by BASE_CLEAR = 6 cm)
  const bottomShelfY = BASE_CLEAR + T / 2;
  const bottomShelf = new THREE.Mesh(shelfGeo, shelfMats);
  bottomShelf.position.set(SHELF_CENTER_X, bottomShelfY, T / 2);
  bottomShelf.name = 'bottom_shelf';
  bottomShelf.castShadow = true;
  bottomShelf.receiveShadow = true;
  group.add(bottomShelf);

  // 6. Top shelf
  const topShelfY = H - TOP_LIP - T / 2;
  const topShelf = new THREE.Mesh(shelfGeo, shelfMats);
  topShelf.position.set(SHELF_CENTER_X, topShelfY, T / 2);
  topShelf.name = 'top_shelf';
  topShelf.castShadow = true;
  topShelf.receiveShadow = true;
  group.add(topShelf);

  // 7. Middle shelf
  const midShelfY = (bottomShelfY + topShelfY) / 2;
  const midShelf = new THREE.Mesh(shelfGeo, shelfMats);
  midShelf.position.set(SHELF_CENTER_X, midShelfY, T / 2);
  midShelf.name = 'middle_shelf';
  midShelf.castShadow = true;
  midShelf.receiveShadow = true;
  group.add(midShelf);

  // 8-10. Magazine pocket enclosure (closed at bottom, front, and back; open at top)
  const pocketCenterX = W / 2 - T - POCKET_GAP / 2;
  const pocketWallH = H - BASE_CLEAR - T - R * 0.5;

  const pocketBottomGeo = new THREE.BoxGeometry(POCKET_GAP, T, D - 2 * T);
  const pocketBottom = new THREE.Mesh(pocketBottomGeo, yellowMat);
  pocketBottom.position.set(pocketCenterX, BASE_CLEAR + T / 2, 0);
  pocketBottom.name = 'pocket_bottom';
  pocketBottom.castShadow = true;
  pocketBottom.receiveShadow = true;
  group.add(pocketBottom);

  const pocketWallGeo = new THREE.BoxGeometry(POCKET_GAP, pocketWallH, T);
  const pocketFront = new THREE.Mesh(pocketWallGeo, yellowMat);
  pocketFront.position.set(pocketCenterX, BASE_CLEAR + T + pocketWallH / 2, D / 2 - T / 2 - 0.004);
  pocketFront.name = 'pocket_front_wall';
  pocketFront.castShadow = true;
  pocketFront.receiveShadow = true;
  group.add(pocketFront);

  const pocketBack = new THREE.Mesh(pocketWallGeo, yellowMat);
  pocketBack.position.set(pocketCenterX, BASE_CLEAR + T + pocketWallH / 2, -D / 2 + T / 2 + 0.004);
  pocketBack.name = 'pocket_back_wall';
  pocketBack.castShadow = true;
  pocketBack.receiveShadow = true;
  group.add(pocketBack);

  // 11-12. Subtle inner shelf support cleats under middle shelf
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
