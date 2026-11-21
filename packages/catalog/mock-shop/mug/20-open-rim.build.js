function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.076;
  const MAX_R = 0.039;
  const RIM_R = 0.0335;
  const FOOT_R = 0.021;
  const FOOT_H = 0.0045;
  const WALL_T = 0.0035;
  const RADIAL_SEGMENTS = 32;

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0x8d9a84,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35
  });

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29b,
    roughness: 0.85,
    metalness: 0.0
  });

  // 1. Unglazed stoneware foot ring (y = 0 to FOOT_H)
  const footPoints = [
    new THREE.Vector2(FOOT_R - 0.0025, 0),
    new THREE.Vector2(FOOT_R, 0),
    new THREE.Vector2(FOOT_R + 0.001, FOOT_H),
    new THREE.Vector2(FOOT_R - 0.003, FOOT_H),
    new THREE.Vector2(FOOT_R - 0.003, 0.0015),
    new THREE.Vector2(0, 0.0015)
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, RADIAL_SEGMENTS);
  const footMesh = new THREE.Mesh(footGeo, clayMat);
  footMesh.name = 'foot_ring';
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  // 2. Main glazed ceramic body (outer profile, rounded rim, inner cavity)
  const bodyPoints = [
    // Start at bottom outer edge where glaze meets foot ring
    new THREE.Vector2(FOOT_R + 0.0005, FOOT_H * 0.85),
    new THREE.Vector2(0.026, FOOT_H + 0.002),
    new THREE.Vector2(0.033, 0.011),
    new THREE.Vector2(0.0375, 0.020),
    new THREE.Vector2(MAX_R, 0.032),
    new THREE.Vector2(0.0385, 0.046),
    new THREE.Vector2(0.0365, 0.060),
    new THREE.Vector2(RIM_R + 0.001, H - 0.004),
    // Rounded rim
    new THREE.Vector2(RIM_R, H - 0.001),
    new THREE.Vector2(RIM_R - WALL_T * 0.45, H),
    new THREE.Vector2(RIM_R - WALL_T * 0.9, H - 0.0012),
    // Inner wall going down
    new THREE.Vector2(RIM_R - WALL_T, H - 0.005),
    new THREE.Vector2(0.032, 0.058),
    new THREE.Vector2(0.0335, 0.044),
    new THREE.Vector2(0.034, 0.030),
    new THREE.Vector2(0.031, 0.018),
    new THREE.Vector2(0.022, 0.010),
    new THREE.Vector2(0.010, 0.0075),
    new THREE.Vector2(0, 0.007)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, RADIAL_SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
  bodyMesh.name = 'cup_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 3. Subtle glaze-break rim highlight ring
  const rimGeo = new THREE.TorusGeometry(RIM_R - WALL_T * 0.45, 0.0007, 10, RADIAL_SEGMENTS);
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xaab49f,
    roughness: 0.32,
    metalness: 0.02,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.name = 'rim_edge';
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = H - 0.0005;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  return group;
}
