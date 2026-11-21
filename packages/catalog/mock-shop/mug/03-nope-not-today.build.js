function build(THREE) {
  const group = new THREE.Group();

  const H = 0.095;
  const R_OUT = 0.041;
  const R_IN = 0.037;
  const WALL = R_OUT - R_IN;
  const BASE_H = 0.008;
  const HANDLE_W = 0.030;
  const HANDLE_TUBE_R = 0.0055;
  const BODY_X = HANDLE_W / 2;

  const navyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b2254,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12
  });

  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f4f2,
    roughness: 0.2,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8e6d8,
    roughness: 0.35,
    metalness: 0.0
  });

  // Outer navy body profile (from bottom center up to rim)
  const outerPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_OUT - 0.003, 0),
    new THREE.Vector2(R_OUT, 0.003),
    new THREE.Vector2(R_OUT, H - 0.002),
    new THREE.Vector2(R_OUT - 0.001, H)
  ];
  const outerGeo = new THREE.LatheGeometry(outerPts, 32);
  const outerMesh = new THREE.Mesh(outerGeo, navyMat);
  outerMesh.name = 'mug_outer_body';
  outerMesh.position.set(BODY_X, 0, 0);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  group.add(outerMesh);

  // Inner white cavity + rounded rim lip
  const innerPts = [
    new THREE.Vector2(0, BASE_H),
    new THREE.Vector2(R_IN - 0.004, BASE_H),
    new THREE.Vector2(R_IN, BASE_H + 0.004),
    new THREE.Vector2(R_IN, H - 0.002),
    new THREE.Vector2(R_IN + WALL * 0.5, H),
    new THREE.Vector2(R_OUT - 0.001, H - 0.0005)
  ];
  const innerGeo = new THREE.LatheGeometry(innerPts, 32);
  const innerMesh = new THREE.Mesh(innerGeo, whiteMat);
  innerMesh.name = 'mug_inner_cavity';
  innerMesh.position.set(BODY_X, 0, 0);
  innerMesh.castShadow = true;
  innerMesh.receiveShadow = true;
  group.add(innerMesh);

  // D-shaped handle on -X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY_X - R_OUT + 0.003, H * 0.78, 0),
    new THREE.Vector3(BODY_X - R_OUT - HANDLE_W * 0.55, H * 0.81, 0),
    new THREE.Vector3(BODY_X - R_OUT - HANDLE_W + HANDLE_TUBE_R, H * 0.50, 0),
    new THREE.Vector3(BODY_X - R_OUT - HANDLE_W * 0.55, H * 0.19, 0),
    new THREE.Vector3(BODY_X - R_OUT + 0.003, H * 0.22, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_TUBE_R, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, navyMat);
  handleMesh.name = 'mug_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // Subtle cream horizontal divider bar on +Z front face
  const barGeo = new THREE.BoxGeometry(0.022, 0.0016, 0.001);
  const barMesh = new THREE.Mesh(barGeo, creamMat);
  barMesh.name = 'front_divider_bar';
  barMesh.position.set(BODY_X, H * 0.44, R_OUT + 0.0002);
  barMesh.castShadow = true;
  barMesh.receiveShadow = true;
  group.add(barMesh);

  return group;
}
