function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.28;
  const BODY_R = 0.095;
  const FOOT_R = 0.052;
  const FOOT_H = 0.012;
  const NECK_R = 0.029;
  const WALL_T = 0.005;
  const HANDLE_R = 0.011;
  const HANDLE_OUT = 0.058;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.72,
    metalness: 0.0,
  });

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xc4b8a5,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Main vase body + neck + hollow interior via LatheGeometry
  const profile = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(FOOT_R - 0.004, 0.002),
    new THREE.Vector2(FOOT_R, 0.004),
    new THREE.Vector2(FOOT_R, FOOT_H),
    new THREE.Vector2(FOOT_R + 0.008, FOOT_H + 0.008),
    new THREE.Vector2(BODY_R * 0.78, 0.042),
    new THREE.Vector2(BODY_R * 0.96, 0.075),
    new THREE.Vector2(BODY_R, 0.105),
    new THREE.Vector2(BODY_R * 0.96, 0.135),
    new THREE.Vector2(BODY_R * 0.78, 0.165),
    new THREE.Vector2(BODY_R * 0.48, 0.185),
    new THREE.Vector2(NECK_R + 0.006, 0.198),
    new THREE.Vector2(NECK_R, 0.215),
    new THREE.Vector2(NECK_R, H - 0.004),
    new THREE.Vector2(NECK_R - WALL_T * 0.5, H),
    new THREE.Vector2(NECK_R - WALL_T, H - 0.004),
    new THREE.Vector2(NECK_R - WALL_T, 0.175),
    new THREE.Vector2(0.0, 0.175),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'vase_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Subtle unglazed clay foot ring at y = 0
  const footGeo = new THREE.CylinderGeometry(FOOT_R - 0.001, FOOT_R - 0.002, 0.003, 32);
  const footMesh = new THREE.Mesh(footGeo, clayMat);
  footMesh.name = 'vase_foot_rim';
  footMesh.position.y = 0.0015;
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  // Loop handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(NECK_R - 0.004, H - 0.022, 0),
    new THREE.Vector3(NECK_R + HANDLE_OUT * 0.55, H - 0.012, 0),
    new THREE.Vector3(NECK_R + HANDLE_OUT, H - 0.048, 0),
    new THREE.Vector3(NECK_R + HANDLE_OUT * 0.88, 0.205, 0),
    new THREE.Vector3(NECK_R + HANDLE_OUT * 0.35, 0.192, 0),
    new THREE.Vector3(NECK_R - 0.002, 0.198, 0),
  ]);

  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_R, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'vase_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
