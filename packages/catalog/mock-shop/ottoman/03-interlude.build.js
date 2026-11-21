function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.90;
  const D = 0.70;
  const LEG_H = 0.035;
  const BASE_H = 0.250;
  const TRAY_H = 0.030;
  const CUSHION_H = 0.135;
  const CUSHION_RECESS = 0.010;

  const LEG_W = 0.13;
  const LEG_D = 0.10;
  const LEG_INSET_X = 0.035;
  const LEG_INSET_Z = 0.030;

  const BASE_RADIUS = 0.06;
  const TRAY_W = W - 0.04;
  const TRAY_D = D - 0.04;
  const TRAY_RADIUS = 0.045;
  const TRAY_RIM_THICK = 0.018;

  const CUSHION_W = TRAY_W - 0.015;
  const CUSHION_D = TRAY_D - 0.015;
  const CUSHION_RADIUS = 0.055;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece1,
    roughness: 0.88,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xe4dfd2,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88b5e,
    roughness: 0.62,
    metalness: 0.02,
  });

  // Helper: create a rounded rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);

    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // Helper: create a vertical extruded rounded box with its bottom at y = 0
  function createRoundedBox(width, height, depth, radius, bevelSize, bevelThickness, bevelSegments) {
    const innerW = width - 2 * bevelSize;
    const innerD = depth - 2 * bevelSize;
    const innerR = Math.max(0.005, radius - bevelSize);
    const shape = createRoundedRectShape(innerW, innerD, innerR);

    const extrudeDepth = Math.max(0.002, height - 2 * bevelThickness);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: extrudeDepth,
      bevelEnabled: bevelSize > 0 && bevelThickness > 0,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelSegments: bevelSegments || 4,
      curveSegments: 12,
    });

    geo.rotateX(-Math.PI / 2);
    geo.translate(0, bevelThickness, 0);
    return geo;
  }

  // 1. Four wooden block legs
  const legGeo = createRoundedBox(LEG_W, LEG_H, LEG_D, 0.022, 0.004, 0.004, 3);
  const legPositions = [
    { name: 'leg_fl', x: -(W / 2 - LEG_W / 2 - LEG_INSET_X), z: D / 2 - LEG_D / 2 - LEG_INSET_Z },
    { name: 'leg_fr', x: W / 2 - LEG_W / 2 - LEG_INSET_X, z: D / 2 - LEG_D / 2 - LEG_INSET_Z },
    { name: 'leg_bl', x: -(W / 2 - LEG_W / 2 - LEG_INSET_X), z: -(D / 2 - LEG_D / 2 - LEG_INSET_Z) },
    { name: 'leg_br', x: W / 2 - LEG_W / 2 - LEG_INSET_X, z: -(D / 2 - LEG_D / 2 - LEG_INSET_Z) },
  ];

  for (const pos of legPositions) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.name = pos.name;
    leg.position.set(pos.x, 0, pos.z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  }

  // 2. Upholstered base
  const baseGeo = createRoundedBox(W, BASE_H, D, BASE_RADIUS, 0.025, 0.025, 5);
  const baseMesh = new THREE.Mesh(baseGeo, fabricMat);
  baseMesh.name = 'upholstered_base';
  baseMesh.position.y = LEG_H;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. Wooden tray base & perimeter rim
  const trayY = LEG_H + BASE_H - 0.004;
  const trayBottomH = 0.012;
  const trayBottomGeo = createRoundedBox(TRAY_W, trayBottomH, TRAY_D, TRAY_RADIUS, 0.002, 0.002, 2);
  const trayBottom = new THREE.Mesh(trayBottomGeo, woodMat);
  trayBottom.name = 'tray_bottom';
  trayBottom.position.y = trayY;
  trayBottom.castShadow = true;
  trayBottom.receiveShadow = true;
  group.add(trayBottom);

  const rimY = trayY + trayBottomH - 0.002;
  const rimH = TRAY_H - trayBottomH + 0.002;

  const rimFrontBackGeo = new THREE.BoxGeometry(TRAY_W - 2 * TRAY_RADIUS, rimH, TRAY_RIM_THICK);
  const rimFront = new THREE.Mesh(rimFrontBackGeo, woodMat);
  rimFront.name = 'tray_rim_front';
  rimFront.position.set(0, rimY + rimH / 2, TRAY_D / 2 - TRAY_RIM_THICK / 2);
  rimFront.castShadow = true;
  rimFront.receiveShadow = true;
  group.add(rimFront);

  const rimBack = new THREE.Mesh(rimFrontBackGeo, woodMat);
  rimBack.name = 'tray_rim_back';
  rimBack.position.set(0, rimY + rimH / 2, -(TRAY_D / 2 - TRAY_RIM_THICK / 2));
  rimBack.castShadow = true;
  rimBack.receiveShadow = true;
  group.add(rimBack);

  const rimSideGeo = new THREE.BoxGeometry(TRAY_RIM_THICK, rimH, TRAY_D - 2 * TRAY_RADIUS);
  const rimLeft = new THREE.Mesh(rimSideGeo, woodMat);
  rimLeft.name = 'tray_rim_left';
  rimLeft.position.set(-(TRAY_W / 2 - TRAY_RIM_THICK / 2), rimY + rimH / 2, 0);
  rimLeft.castShadow = true;
  rimLeft.receiveShadow = true;
  group.add(rimLeft);

  const rimRight = new THREE.Mesh(rimSideGeo, woodMat);
  rimRight.name = 'tray_rim_right';
  rimRight.position.set(TRAY_W / 2 - TRAY_RIM_THICK / 2, rimY + rimH / 2, 0);
  rimRight.castShadow = true;
  rimRight.receiveShadow = true;
  group.add(rimRight);

  // Four rounded tray corners
  const cornerGeo = new THREE.CylinderGeometry(TRAY_RADIUS, TRAY_RADIUS, rimH, 16);
  const cornerPositions = [
    { name: 'tray_corner_fl', x: -(TRAY_W / 2 - TRAY_RADIUS), z: TRAY_D / 2 - TRAY_RADIUS },
    { name: 'tray_corner_fr', x: TRAY_W / 2 - TRAY_RADIUS, z: TRAY_D / 2 - TRAY_RADIUS },
    { name: 'tray_corner_bl', x: -(TRAY_W / 2 - TRAY_RADIUS), z: -(TRAY_D / 2 - TRAY_RADIUS) },
    { name: 'tray_corner_br', x: TRAY_W / 2 - TRAY_RADIUS, z: -(TRAY_D / 2 - TRAY_RADIUS) },
  ];

  for (const pos of cornerPositions) {
    const corner = new THREE.Mesh(cornerGeo, woodMat);
    corner.name = pos.name;
    corner.position.set(pos.x, rimY + rimH / 2, pos.z);
    corner.castShadow = true;
    corner.receiveShadow = true;
    group.add(corner);
  }

  // 4. Top cushion
  const cushionY = trayY + TRAY_H - CUSHION_RECESS;
  const cushionGeo = createRoundedBox(CUSHION_W, CUSHION_H, CUSHION_D, CUSHION_RADIUS, 0.042, 0.045, 6);
  const cushion = new THREE.Mesh(cushionGeo, fabricMat);
  cushion.name = 'top_cushion';
  cushion.position.y = cushionY;
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  group.add(cushion);

  // 5. Cushion perimeter piping/seam
  const hw = CUSHION_W / 2 - 0.002;
  const hd = CUSHION_D / 2 - 0.002;
  const cr = CUSHION_RADIUS - 0.002;
  const seamY = cushionY + CUSHION_H * 0.36;

  const seamPoints = [
    new THREE.Vector3(-hw + cr, seamY, hd),
    new THREE.Vector3(hw - cr, seamY, hd),
    new THREE.Vector3(hw, seamY, hd - cr),
    new THREE.Vector3(hw, seamY, -hd + cr),
    new THREE.Vector3(hw - cr, seamY, -hd),
    new THREE.Vector3(-hw + cr, seamY, -hd),
    new THREE.Vector3(-hw, seamY, -hd + cr),
    new THREE.Vector3(-hw, seamY, hd - cr),
  ];
  const seamCurve = new THREE.CatmullRomCurve3(seamPoints, true, 'catmullrom', 0.25);
  const seamGeo = new THREE.TubeGeometry(seamCurve, 64, 0.0045, 8, true);
  const seam = new THREE.Mesh(seamGeo, seamMat);
  seam.name = 'cushion_piping';
  seam.castShadow = true;
  seam.receiveShadow = true;
  group.add(seam);

  return group;
}
