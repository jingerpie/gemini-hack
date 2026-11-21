function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions in meters
  const H = 0.102;
  const R = 0.042;
  const WALL = 0.0045;
  const FOOT_H = 0.007;
  const FOOT_R = 0.0355;
  const HANDLE_EXT = 0.035;
  const HANDLE_R = 0.0055;
  const SEGMENTS = 32;

  const glazeMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.36,
    metalness: 0.02,
  });

  const stonewareMat = new THREE.MeshStandardMaterial({
    color: 0xc7b8a3,
    roughness: 0.86,
    metalness: 0.0,
  });

  // Unglazed stoneware foot
  const footPoints = [
    new THREE.Vector2(0, 0.001),
    new THREE.Vector2(FOOT_R - 0.004, 0.001),
    new THREE.Vector2(FOOT_R - 0.003, 0),
    new THREE.Vector2(FOOT_R - 0.001, 0),
    new THREE.Vector2(FOOT_R, 0.0015),
    new THREE.Vector2(FOOT_R + 0.001, FOOT_H),
    new THREE.Vector2(0, FOOT_H),
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, SEGMENTS);
  const footMesh = new THREE.Mesh(footGeo, stonewareMat);
  footMesh.name = 'mug_foot';
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  // Glazed ceramic body (outer wall, rounded rim, inner wall, inner floor)
  const innerR = R - WALL;
  const innerBottomY = FOOT_H + 0.005;
  const bodyPoints = [
    new THREE.Vector2(FOOT_R - 0.001, FOOT_H),
    new THREE.Vector2(R - 0.004, FOOT_H + 0.001),
    new THREE.Vector2(R - 0.001, FOOT_H + 0.004),
    new THREE.Vector2(R, FOOT_H + 0.009),
    new THREE.Vector2(R, H - 0.003),
    new THREE.Vector2(R - 0.001, H - 0.0008),
    new THREE.Vector2(R - WALL * 0.5, H),
    new THREE.Vector2(innerR + 0.001, H - 0.0008),
    new THREE.Vector2(innerR, H - 0.003),
    new THREE.Vector2(innerR, innerBottomY + 0.005),
    new THREE.Vector2(innerR - 0.004, innerBottomY + 0.001),
    new THREE.Vector2(0, innerBottomY),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Step handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R - 0.003, H - 0.016, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.55, H - 0.016, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.82, H - 0.020, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.92, H * 0.54, 0),
    new THREE.Vector3(R + HANDLE_EXT, H * 0.34, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.85, H * 0.27, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.45, H * 0.22, 0),
    new THREE.Vector3(R - 0.003, H * 0.18, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 32, HANDLE_R, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, glazeMat);
  handleMesh.name = 'mug_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // Center bounding box on x = 0 and z = 0
  const centerOffsetX = -(HANDLE_EXT + HANDLE_R) * 0.5;
  footMesh.position.x = centerOffsetX;
  bodyMesh.position.x = centerOffsetX;
  handleMesh.position.x = centerOffsetX;

  return group;
}
