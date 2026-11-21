function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - Height = 22 cm (0.22 m)
  const H = 0.22;
  const FOOT_RING_H = 0.0025;
  const BASE_H = 0.020;
  const BASE_W = 0.096;
  const BASE_D = 0.042;

  const TUBE_R = 0.022;
  const LOOP_RX = 0.062;
  const LOOP_RY = 0.082;
  const LOOP_CENTER_Y = FOOT_RING_H + BASE_H * 0.45 + LOOP_RY + TUBE_R * 0.55;

  const NECK_TILT = 0.42; // radians toward -X
  const NECK_R_BOTTOM = 0.021;
  const NECK_R_TOP = 0.022;
  const NECK_WALL = 0.0045;
  const NECK_H = 0.040;
  const NECK_BASE_X = -0.031;
  const NECK_BASE_Y = H - NECK_H * Math.cos(NECK_TILT) - NECK_R_TOP * Math.sin(NECK_TILT);

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xb82442,
    roughness: 0.14,
    metalness: 0.02,
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
  });

  const stonewareMat = new THREE.MeshStandardMaterial({
    color: 0xe6dcc8,
    roughness: 0.85,
    metalness: 0.0,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x3a0b15,
    roughness: 0.6,
    metalness: 0.0,
  });

  // 1. Unglazed bottom foot ring (touches y = 0)
  const footGeo = new THREE.CylinderGeometry(BASE_W * 0.48, BASE_W * 0.47, FOOT_RING_H, 24);
  const footMesh = new THREE.Mesh(footGeo, stonewareMat);
  footMesh.name = 'vase_foot_ring';
  footMesh.scale.set(1, 1, BASE_D / BASE_W);
  footMesh.position.set(0, FOOT_RING_H * 0.5, 0);
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  // 2. Glazed base pedestal
  const baseGeo = new THREE.CylinderGeometry(BASE_W * 0.52, BASE_W * 0.49, BASE_H, 24);
  const baseMesh = new THREE.Mesh(baseGeo, glazeMat);
  baseMesh.name = 'vase_base';
  baseMesh.scale.set(1, 1, (BASE_D * 1.04) / BASE_W);
  baseMesh.position.set(0, FOOT_RING_H + BASE_H * 0.5, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. Elliptical looped body
  const loopGeo = new THREE.TorusGeometry(LOOP_RX, TUBE_R, 24, 32);
  const loopMesh = new THREE.Mesh(loopGeo, glazeMat);
  loopMesh.name = 'vase_loop_body';
  loopMesh.scale.set(1, LOOP_RY / LOOP_RX, 0.92);
  loopMesh.position.set(0, LOOP_CENTER_Y, 0);
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  // 4. Sculptural tilted neck with rounded rim (LatheGeometry)
  const neckPoints = [
    new THREE.Vector2(NECK_R_BOTTOM, 0),
    new THREE.Vector2(NECK_R_BOTTOM * 0.96, NECK_H * 0.45),
    new THREE.Vector2(NECK_R_TOP, NECK_H - 0.004),
    new THREE.Vector2(NECK_R_TOP - NECK_WALL * 0.25, NECK_H - 0.001),
    new THREE.Vector2(NECK_R_TOP - NECK_WALL * 0.65, NECK_H),
    new THREE.Vector2(NECK_R_TOP - NECK_WALL, NECK_H - 0.003),
    new THREE.Vector2(NECK_R_TOP - NECK_WALL, NECK_H - 0.024),
  ];
  const neckGeo = new THREE.LatheGeometry(neckPoints, 24);
  const neckMesh = new THREE.Mesh(neckGeo, glazeMat);
  neckMesh.name = 'vase_neck';
  neckMesh.position.set(NECK_BASE_X, NECK_BASE_Y, 0);
  neckMesh.rotation.z = NECK_TILT;
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  group.add(neckMesh);

  // 5. Darkened interior throat
  const throatGeo = new THREE.CylinderGeometry(
    NECK_R_TOP - NECK_WALL * 1.02,
    NECK_R_TOP - NECK_WALL * 1.1,
    0.022,
    20
  );
  const throatMesh = new THREE.Mesh(throatGeo, interiorMat);
  throatMesh.name = 'vase_neck_interior';
  const throatOffset = NECK_H - 0.015;
  throatMesh.position.set(
    NECK_BASE_X - throatOffset * Math.sin(NECK_TILT),
    NECK_BASE_Y + throatOffset * Math.cos(NECK_TILT),
    0
  );
  throatMesh.rotation.z = NECK_TILT;
  throatMesh.castShadow = true;
  throatMesh.receiveShadow = true;
  group.add(throatMesh);

  return group;
}
