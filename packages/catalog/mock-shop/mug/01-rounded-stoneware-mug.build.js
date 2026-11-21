function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.092;
  const R_FOOT = 0.031;
  const R_MAX = 0.0475;
  const R_RIM = 0.039;
  const WALL_T = 0.0045;
  const FOOT_H = 0.005;
  const HANDLE_REACH = 0.036;
  const HANDLE_R = 0.0062;

  // Centering offset so bounding box is centered on x = 0, z = 0
  const X_OFFSET = -((R_MAX + HANDLE_REACH - R_MAX) / 2);

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xeae0cc,
    roughness: 0.28,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });

  const rawClayMat = new THREE.MeshStandardMaterial({
    color: 0xc4a984,
    roughness: 0.85,
    metalness: 0.0,
  });

  const mugGroup = new THREE.Group();
  mugGroup.position.x = X_OFFSET;
  group.add(mugGroup);

  // 1. Unglazed raw clay foot ring (y = 0 to FOOT_H)
  const footPoints = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(R_FOOT - 0.004, 0.002),
    new THREE.Vector2(R_FOOT - 0.003, 0.0),
    new THREE.Vector2(R_FOOT, 0.0),
    new THREE.Vector2(R_FOOT + 0.001, FOOT_H),
    new THREE.Vector2(R_FOOT - 0.002, FOOT_H),
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, 32);
  const footMesh = new THREE.Mesh(footGeo, rawClayMat);
  footMesh.name = "stoneware_foot_ring";
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  mugGroup.add(footMesh);

  // 2. Glazed stoneware body (outer + rim + inner cavity)
  const bodyPoints = [
    new THREE.Vector2(R_FOOT + 0.0005, FOOT_H - 0.0005),
    new THREE.Vector2(R_FOOT + 0.004, FOOT_H + 0.003),
    new THREE.Vector2(R_MAX * 0.9, H * 0.16),
    new THREE.Vector2(R_MAX, H * 0.38),
    new THREE.Vector2(R_MAX * 0.985, H * 0.58),
    new THREE.Vector2(R_MAX * 0.91, H * 0.78),
    new THREE.Vector2(R_RIM + 0.0015, H * 0.94),
    new THREE.Vector2(R_RIM, H),
    // Rounded rim
    new THREE.Vector2(R_RIM - WALL_T * 0.5, H + 0.001),
    new THREE.Vector2(R_RIM - WALL_T, H),
    // Inner wall
    new THREE.Vector2(R_RIM - WALL_T, H * 0.85),
    new THREE.Vector2(R_MAX - WALL_T * 1.2, H * 0.5),
    new THREE.Vector2(R_MAX - WALL_T * 1.3, H * 0.25),
    new THREE.Vector2(R_FOOT - WALL_T, FOOT_H + 0.006),
    new THREE.Vector2(0.0, FOOT_H + 0.004),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
  bodyMesh.name = "stoneware_mug_body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  mugGroup.add(bodyMesh);

  // 3. Curved ear handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R_RIM + 0.001, H * 0.77, 0),
    new THREE.Vector3(R_MAX + HANDLE_REACH * 0.65, H * 0.80, 0),
    new THREE.Vector3(R_MAX + HANDLE_REACH, H * 0.56, 0),
    new THREE.Vector3(R_MAX + HANDLE_REACH * 0.75, H * 0.32, 0),
    new THREE.Vector3(R_MAX * 0.92, H * 0.21, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_R, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, glazeMat);
  handleMesh.name = "stoneware_mug_handle";
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  mugGroup.add(handleMesh);

  return group;
}
