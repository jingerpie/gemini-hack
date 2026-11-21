function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.092;
  const R_BODY = 0.046;
  const WALL_T = 0.0025;
  const RIM_R = 0.0032;
  const OLIVE_H = H * 0.28;
  const STRIPE_H = H * 0.042;
  const HANDLE_W = 0.032;
  const HANDLE_R = 0.0042;

  // Materials
  const creamMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2e6cb,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12
  });

  const oliveMat = new THREE.MeshPhysicalMaterial({
    color: 0x7e854e,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.7,
    clearcoatRoughness: 0.14
  });

  const terracottaMat = new THREE.MeshPhysicalMaterial({
    color: 0xb54932,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15
  });

  const brownRimMat = new THREE.MeshPhysicalMaterial({
    color: 0x5c3826,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15
  });

  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x26211e,
    roughness: 0.65,
    metalness: 0.45
  });

  // 1. Cream body (interior + upper exterior)
  const creamPts = [
    new THREE.Vector2(0, WALL_T),
    new THREE.Vector2(R_BODY - WALL_T - 0.004, WALL_T),
    new THREE.Vector2(R_BODY - WALL_T, WALL_T + 0.005),
    new THREE.Vector2(R_BODY - WALL_T, H - RIM_R),
    new THREE.Vector2(R_BODY, H - RIM_R),
    new THREE.Vector2(R_BODY, OLIVE_H + STRIPE_H - 0.0005),
    new THREE.Vector2(R_BODY - 0.001, OLIVE_H + STRIPE_H - 0.0005)
  ];
  const creamGeo = new THREE.LatheGeometry(creamPts, 32);
  const creamMesh = new THREE.Mesh(creamGeo, creamMat);
  creamMesh.name = 'mug_body_cream';
  creamMesh.castShadow = true;
  creamMesh.receiveShadow = true;
  group.add(creamMesh);

  // 2. Olive green lower base
  const olivePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_BODY - 0.007, 0),
    new THREE.Vector2(R_BODY - 0.002, 0.0025),
    new THREE.Vector2(R_BODY, 0.008),
    new THREE.Vector2(R_BODY + 0.0002, OLIVE_H),
    new THREE.Vector2(R_BODY - 0.002, OLIVE_H),
    new THREE.Vector2(R_BODY - 0.002, WALL_T),
    new THREE.Vector2(0, WALL_T)
  ];
  const oliveGeo = new THREE.LatheGeometry(olivePts, 32);
  const oliveMesh = new THREE.Mesh(oliveGeo, oliveMat);
  oliveMesh.name = 'mug_base_olive';
  oliveMesh.castShadow = true;
  oliveMesh.receiveShadow = true;
  group.add(oliveMesh);

  // 3. Terracotta stripe
  const stripeGeo = new THREE.CylinderGeometry(
    R_BODY + 0.00025,
    R_BODY + 0.00025,
    STRIPE_H,
    32,
    1,
    true
  );
  const stripeMesh = new THREE.Mesh(stripeGeo, terracottaMat);
  stripeMesh.name = 'mug_stripe_terracotta';
  stripeMesh.position.y = OLIVE_H + STRIPE_H * 0.5;
  stripeMesh.castShadow = true;
  stripeMesh.receiveShadow = true;
  group.add(stripeMesh);

  // 4. Rolled dark brown rim
  const rimGeo = new THREE.TorusGeometry(R_BODY + RIM_R * 0.45, RIM_R, 14, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, brownRimMat);
  rimMesh.name = 'mug_rim_brown';
  rimMesh.position.y = H - RIM_R * 0.7;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 5. Small enamel chip on front of rim
  const rimChipGeo = new THREE.SphereGeometry(0.0022, 10, 8);
  rimChipGeo.scale(1.6, 0.7, 0.8);
  const rimChip = new THREE.Mesh(rimChipGeo, chipMat);
  rimChip.name = 'mug_rim_chip';
  rimChip.position.set(-0.004, H - RIM_R * 0.5, R_BODY + RIM_R * 1.15);
  rimChip.castShadow = true;
  rimChip.receiveShadow = true;
  group.add(rimChip);

  // 6. Curved handle on +X
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R_BODY - 0.002, H * 0.78, 0),
    new THREE.Vector3(R_BODY + HANDLE_W * 0.45, H * 0.78, 0),
    new THREE.Vector3(R_BODY + HANDLE_W, H * 0.62, 0),
    new THREE.Vector3(R_BODY + HANDLE_W * 0.95, H * 0.4, 0),
    new THREE.Vector3(R_BODY + HANDLE_W * 0.4, H * 0.25, 0),
    new THREE.Vector3(R_BODY - 0.002, H * 0.23, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_R, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, brownRimMat);
  handleMesh.name = 'mug_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // 7. Small enamel chip on lower handle curve
  const handleChipGeo = new THREE.SphereGeometry(0.0024, 10, 8);
  handleChipGeo.scale(0.8, 1.3, 0.7);
  const handleChip = new THREE.Mesh(handleChipGeo, chipMat);
  handleChip.name = 'mug_handle_chip';
  handleChip.position.set(R_BODY + HANDLE_W * 0.88, H * 0.36, 0);
  handleChip.rotation.z = -0.5;
  handleChip.castShadow = true;
  handleChip.receiveShadow = true;
  group.add(handleChip);

  return group;
}
