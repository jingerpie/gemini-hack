function build(THREE) {
  const group = new THREE.Group();

  const W = 0.28;
  const D = 0.18;
  const H = 0.026;
  const FOOT_H = 0.002;
  const FOOT_R = 0.008;
  const BODY_H = H - FOOT_H;
  const CORNER_R = 0.02;
  const RIM_T = 0.011;
  const RECESS_DEPTH = 0.007;
  const BASE_H = BODY_H - RECESS_DEPTH;
  const INNER_W = W - 2 * RIM_T;
  const INNER_D = D - 2 * RIM_T;
  const INNER_R = Math.max(0.004, CORNER_R - RIM_T);

  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  const matteStoneMat = new THREE.MeshStandardMaterial({
    color: 0x222325,
    roughness: 0.85,
    metalness: 0.05
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.95,
    metalness: 0.0
  });

  const glossyBlackMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0b0c,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const goldVeinMat = new THREE.MeshStandardMaterial({
    color: 0xb88b3a,
    roughness: 0.28,
    metalness: 0.85
  });

  const resinCoatMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  });

  // 4 corner feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footOffsetX = W / 2 - CORNER_R - 0.004;
  const footOffsetZ = D / 2 - CORNER_R - 0.004;
  const footPositions = [
    [-footOffsetX, FOOT_H / 2, -footOffsetZ, 'foot_back_left'],
    [footOffsetX, FOOT_H / 2, -footOffsetZ, 'foot_back_right'],
    [-footOffsetX, FOOT_H / 2, footOffsetZ, 'foot_front_left'],
    [footOffsetX, FOOT_H / 2, footOffsetZ, 'foot_front_right']
  ];
  for (let i = 0; i < footPositions.length; i++) {
    const [fx, fy, fz, name] = footPositions[i];
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(fx, fy, fz);
    foot.name = name;
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  // Solid base of the tray
  const baseShape = createRoundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, matteStoneMat);
  baseMesh.position.y = FOOT_H;
  baseMesh.name = 'tray_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Outer raised rim
  const rimShape = createRoundedRectShape(W, D, CORNER_R);
  const innerHole = createRoundedRectShape(INNER_W, INNER_D, INNER_R);
  rimShape.holes.push(innerHole);
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RECESS_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 16
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, matteStoneMat);
  rimMesh.position.y = FOOT_H + BASE_H;
  rimMesh.name = 'tray_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Glossy black recessed plane
  const planeShape = createRoundedRectShape(INNER_W, INNER_D, INNER_R);
  const planeGeo = new THREE.ExtrudeGeometry(planeShape, {
    depth: 0.001,
    bevelEnabled: false,
    curveSegments: 16
  });
  planeGeo.rotateX(-Math.PI / 2);
  const planeMesh = new THREE.Mesh(planeGeo, glossyBlackMat);
  planeMesh.position.y = FOOT_H + BASE_H;
  planeMesh.name = 'recess_black_plane';
  planeMesh.castShadow = true;
  planeMesh.receiveShadow = true;
  group.add(planeMesh);

  // Gold/bronze swirling veins on the recessed plane
  const veinY = FOOT_H + BASE_H + 0.0011;
  const veinCurves = [
    [
      new THREE.Vector3(-0.115, veinY, 0.045),
      new THREE.Vector3(-0.05, veinY, 0.025),
      new THREE.Vector3(0.02, veinY, -0.015),
      new THREE.Vector3(0.095, veinY, -0.035)
    ],
    [
      new THREE.Vector3(-0.105, veinY, -0.025),
      new THREE.Vector3(-0.03, veinY, -0.045),
      new THREE.Vector3(0.045, veinY, -0.01),
      new THREE.Vector3(0.115, veinY, 0.025)
    ],
    [
      new THREE.Vector3(-0.08, veinY, 0.065),
      new THREE.Vector3(-0.01, veinY, 0.04),
      new THREE.Vector3(0.055, veinY, 0.055),
      new THREE.Vector3(0.11, veinY, 0.035)
    ],
    [
      new THREE.Vector3(-0.095, veinY, -0.055),
      new THREE.Vector3(-0.02, veinY, -0.02),
      new THREE.Vector3(0.04, veinY, -0.05),
      new THREE.Vector3(0.105, veinY, -0.06)
    ]
  ];

  for (let i = 0; i < veinCurves.length; i++) {
    const curve = new THREE.CatmullRomCurve3(veinCurves[i]);
    const veinGeo = new THREE.TubeGeometry(curve, 24, 0.0022, 6, false);
    veinGeo.scale(1, 0.2, 1);
    const veinMesh = new THREE.Mesh(veinGeo, goldVeinMat);
    veinMesh.name = 'gold_vein_' + (i + 1);
    veinMesh.castShadow = true;
    veinMesh.receiveShadow = true;
    group.add(veinMesh);
  }

  // Clear resin top coat over the veins
  const coatGeo = new THREE.ExtrudeGeometry(planeShape, {
    depth: 0.0012,
    bevelEnabled: false,
    curveSegments: 16
  });
  coatGeo.rotateX(-Math.PI / 2);
  const coatMesh = new THREE.Mesh(coatGeo, resinCoatMat);
  coatMesh.position.y = FOOT_H + BASE_H + 0.001;
  coatMesh.name = 'resin_top_coat';
  coatMesh.castShadow = true;
  coatMesh.receiveShadow = true;
  group.add(coatMesh);

  return group;
}
