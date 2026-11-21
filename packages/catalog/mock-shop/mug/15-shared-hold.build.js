function build(THREE) {
  const group = new THREE.Group();

  const CUP_H = 0.095;
  const CUP_R = 0.045;
  const WALL_T = 0.005;
  const FOOT_R = 0.031;
  const FOOT_H = 0.004;
  const HANDLE_R = 0.0065;
  const HANDLE_W = 0.026;
  const HANDLE_H = 0.046;

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0x918274,
    roughness: 0.32,
    metalness: 0.02,
    clearcoat: 0.28,
    clearcoatRoughness: 0.25
  });

  // Cup body profile (LatheGeometry)
  const profile = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(FOOT_R - 0.003, 0.002),
    new THREE.Vector2(FOOT_R - 0.002, 0.0),
    new THREE.Vector2(FOOT_R, 0.0),
    new THREE.Vector2(FOOT_R + 0.002, FOOT_H),
    new THREE.Vector2(CUP_R - 0.007, 0.012),
    new THREE.Vector2(CUP_R - 0.001, 0.026),
    new THREE.Vector2(CUP_R, 0.042),
    new THREE.Vector2(CUP_R, CUP_H - 0.004),
    new THREE.Vector2(CUP_R - 0.0015, CUP_H),
    new THREE.Vector2(CUP_R - WALL_T * 0.5, CUP_H),
    new THREE.Vector2(CUP_R - WALL_T, CUP_H - 0.003),
    new THREE.Vector2(CUP_R - WALL_T, 0.022),
    new THREE.Vector2(CUP_R - WALL_T - 0.008, 0.011),
    new THREE.Vector2(0.0, 0.009)
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Symmetrical two-handled loops on -X and +X
  const handleCenterY = CUP_H * 0.46;
  const attachX = CUP_R - 0.003;

  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * attachX, handleCenterY + HANDLE_H * 0.38, 0),
      new THREE.Vector3(side * (attachX + HANDLE_W * 0.65), handleCenterY + HANDLE_H * 0.46, 0),
      new THREE.Vector3(side * (attachX + HANDLE_W), handleCenterY, 0),
      new THREE.Vector3(side * (attachX + HANDLE_W * 0.65), handleCenterY - HANDLE_H * 0.46, 0),
      new THREE.Vector3(side * attachX, handleCenterY - HANDLE_H * 0.38, 0)
    ]);

    const handleGeo = new THREE.TubeGeometry(curve, 24, HANDLE_R, 16, false);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
    handleMesh.name = side < 0 ? 'left_handle' : 'right_handle';
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    group.add(handleMesh);
  });

  return group;
}
