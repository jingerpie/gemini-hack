function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const D = 0.20;
  const FOOT_H = 0.003;
  const FOOT_R = 0.009;
  const BASE_THICK = 0.005;
  const INNER_RIM_H = 0.012;
  const RIBBON_H = 0.024;
  const RIBBON_T = 0.003;
  const CORNER_R = 0.024;
  const GAP = 0.002;

  // Materials
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0xd49b27,
    roughness: 0.35,
    metalness: 0.08
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x4a3520,
    roughness: 0.7,
    metalness: 0.05
  });

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
    return shape;
  }

  // 1. Four small feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);
  const footX = W / 2 - CORNER_R - 0.012;
  const footZ = D / 2 - CORNER_R - 0.008;
  const footPositions = [
    [-footX, -footZ],
    [footX, -footZ],
    [-footX, footZ],
    [footX, footZ]
  ];
  footPositions.forEach(([fx, fz], idx) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = `tray_foot_${idx + 1}`;
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // 2. Tray base plate
  const baseW = W - RIBBON_T * 2 - GAP * 2;
  const baseD = D - RIBBON_T * 2 - GAP * 2;
  const baseR = CORNER_R - RIBBON_T - GAP;
  const baseShape = roundedRectShape(baseW, baseD, baseR);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, trayMat);
  baseMesh.name = 'tray_base';
  baseMesh.position.y = FOOT_H;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. Inner tray rim (hollow rounded rectangle)
  const rimOuterShape = roundedRectShape(baseW, baseD, baseR);
  const rimHole = roundedRectShape(baseW - 0.008, baseD - 0.008, Math.max(0.004, baseR - 0.004));
  rimOuterShape.holes.push(rimHole);
  const rimGeo = new THREE.ExtrudeGeometry(rimOuterShape, {
    depth: INNER_RIM_H,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 16
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, trayMat);
  rimMesh.name = 'tray_inner_rim';
  rimMesh.position.y = FOOT_H + BASE_THICK;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 4. Ribbon Edge - Long sides (front +Z, back -Z)
  const ribbonY = FOOT_H + BASE_THICK + RIBBON_H / 2 - 0.002;
  const longLen = W - CORNER_R * 2 - 0.036;
  const longGeo = new THREE.BoxGeometry(longLen, RIBBON_H * 0.72, RIBBON_T);

  [-1, 1].forEach((dir, idx) => {
    const longSide = new THREE.Mesh(longGeo, trayMat);
    longSide.name = idx === 0 ? 'ribbon_back' : 'ribbon_front';
    longSide.position.set(0, ribbonY, dir * (D / 2 - RIBBON_T / 2));
    longSide.castShadow = true;
    longSide.receiveShadow = true;
    group.add(longSide);
  });

  // 5. Ribbon Edge - Short sides (left -X, right +X)
  const shortLen = D - CORNER_R * 2 - 0.016;
  const shortGeo = new THREE.BoxGeometry(RIBBON_T, RIBBON_H * 0.78, shortLen);

  [-1, 1].forEach((dir, idx) => {
    const shortSide = new THREE.Mesh(shortGeo, trayMat);
    shortSide.name = idx === 0 ? 'ribbon_left' : 'ribbon_right';
    shortSide.position.set(dir * (W / 2 - RIBBON_T / 2), ribbonY, 0);
    shortSide.castShadow = true;
    shortSide.receiveShadow = true;
    group.add(shortSide);
  });

  // 6. Ribbon Edge - 4 Curved Corners
  const cornerArcGeo = new THREE.CylinderGeometry(
    CORNER_R,
    CORNER_R,
    RIBBON_H,
    16,
    1,
    true,
    0,
    Math.PI / 2
  );
  // Make double-sided by extruding a thin arc shape
  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, CORNER_R, 0, Math.PI / 2, false);
  arcShape.absarc(0, 0, CORNER_R - RIBBON_T, Math.PI / 2, 0, true);
  arcShape.closePath();

  const cornerGeo = new THREE.ExtrudeGeometry(arcShape, {
    depth: RIBBON_H,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 1,
    curveSegments: 16
  });
  cornerGeo.rotateX(-Math.PI / 2);

  const cx = W / 2 - CORNER_R;
  const cz = D / 2 - CORNER_R;
  const cornerConfigs = [
    { x: cx, z: -cz, rotY: 0, name: 'ribbon_corner_back_right' },
    { x: -cx, z: -cz, rotY: Math.PI / 2, name: 'ribbon_corner_back_left' },
    { x: -cx, z: cz, rotY: Math.PI, name: 'ribbon_corner_front_left' },
    { x: cx, z: cz, rotY: -Math.PI / 2, name: 'ribbon_corner_front_right' }
  ];

  cornerConfigs.forEach((cfg) => {
    const corner = new THREE.Mesh(cornerGeo, trayMat);
    corner.name = cfg.name;
    corner.position.set(cfg.x, FOOT_H + BASE_THICK - 0.002, cfg.z);
    corner.rotation.y = cfg.rotY;
    corner.castShadow = true;
    corner.receiveShadow = true;
    group.add(corner);
  });

  // 7. Ribbon Twist / Pinch Transitions at the 4 corners (long-side ends)
  const pinchGeo = new THREE.CylinderGeometry(RIBBON_T * 0.9, RIBBON_T * 0.9, 0.022, 10);
  pinchGeo.rotateZ(Math.PI / 2);

  const px = longLen / 2 + 0.009;
  const pz = D / 2 - RIBBON_T / 2 - 0.002;
  const pinchPositions = [
    [-px, -pz, 0.25],
    [px, -pz, -0.25],
    [-px, pz, -0.25],
    [px, pz, 0.25]
  ];

  pinchPositions.forEach(([x, z, rotY], idx) => {
    const pinch = new THREE.Mesh(pinchGeo, trayMat);
    pinch.name = `ribbon_twist_${idx + 1}`;
    pinch.position.set(x, ribbonY, z);
    pinch.rotation.y = rotY;
    pinch.scale.set(1, 2.2, 1.4);
    pinch.castShadow = true;
    pinch.receiveShadow = true;
    group.add(pinch);
  });

  return group;
}
