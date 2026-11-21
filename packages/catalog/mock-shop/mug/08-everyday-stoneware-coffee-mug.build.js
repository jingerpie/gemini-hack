function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.096;
  const BODY_R = 0.042;
  const BASE_R = 0.035;
  const RIM_R = 0.040;
  const WALL_T = 0.0045;
  const GLAZE_Y = H * 0.54;
  const HANDLE_EXT = 0.032; // how far handle extends past body
  const HANDLE_R = 0.0055;

  // Center bounding box on X = 0 (mug body shifted slightly +X to balance handle on -X)
  const BODY_X = HANDLE_EXT * 0.5;

  // Materials
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0x8f593c,
    roughness: 0.78,
    metalness: 0.02,
  });

  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc9b498,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
  });

  // Lower unglazed clay body (y = 0 to GLAZE_Y)
  const lowerPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R - 0.002, 0.0),
    new THREE.Vector2(BASE_R, 0.003),
    new THREE.Vector2(BODY_R * 0.92, 0.012),
    new THREE.Vector2(BODY_R * 0.99, 0.030),
    new THREE.Vector2(BODY_R, GLAZE_Y),
    new THREE.Vector2(BODY_R - WALL_T, GLAZE_Y),
    new THREE.Vector2(BODY_R - WALL_T, 0.010),
    new THREE.Vector2(0.0, 0.008),
  ];
  const lowerGeo = new THREE.LatheGeometry(lowerPoints, 32);
  const lowerMesh = new THREE.Mesh(lowerGeo, clayMat);
  lowerMesh.name = 'mug_lower_clay_body';
  lowerMesh.position.x = BODY_X;
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  group.add(lowerMesh);

  // Upper glazed body + rim + interior (y = GLAZE_Y to H, plus inner lining)
  const upperPoints = [
    new THREE.Vector2(BODY_R - WALL_T, 0.008),
    new THREE.Vector2(0.0, 0.008),
    new THREE.Vector2(0.0, 0.009),
    new THREE.Vector2(BODY_R - WALL_T - 0.001, 0.012),
    new THREE.Vector2(BODY_R - WALL_T, GLAZE_Y),
    new THREE.Vector2(RIM_R - WALL_T, H - 0.004),
    new THREE.Vector2(RIM_R - WALL_T * 0.5, H),
    new THREE.Vector2(RIM_R, H - 0.002),
    new THREE.Vector2(BODY_R * 0.98, H * 0.78),
    new THREE.Vector2(BODY_R, GLAZE_Y),
  ];
  const upperGeo = new THREE.LatheGeometry(upperPoints, 32);
  const upperMesh = new THREE.Mesh(upperGeo, glazeMat);
  upperMesh.name = 'mug_upper_glazed_body';
  upperMesh.position.x = BODY_X;
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  group.add(upperMesh);

  // Handle: split at GLAZE_Y so upper half is glazed and lower half is clay
  const handleTopY = H * 0.80;
  const handleBotY = H * 0.24;
  const attachX = BODY_X - BODY_R + 0.003;
  const outerX = BODY_X - BODY_R - HANDLE_EXT;

  const upperHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(attachX, handleTopY, 0),
    new THREE.Vector3(attachX - HANDLE_EXT * 0.45, handleTopY + 0.004, 0),
    new THREE.Vector3(outerX, H * 0.68, 0),
    new THREE.Vector3(outerX - 0.001, GLAZE_Y, 0),
  ]);
  const upperHandleGeo = new THREE.TubeGeometry(upperHandleCurve, 16, HANDLE_R, 12, false);
  const upperHandleMesh = new THREE.Mesh(upperHandleGeo, glazeMat);
  upperHandleMesh.name = 'mug_handle_upper_glazed';
  upperHandleMesh.castShadow = true;
  upperHandleMesh.receiveShadow = true;
  group.add(upperHandleMesh);

  const lowerHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(outerX - 0.001, GLAZE_Y, 0),
    new THREE.Vector3(outerX + 0.003, H * 0.40, 0),
    new THREE.Vector3(attachX - HANDLE_EXT * 0.40, H * 0.29, 0),
    new THREE.Vector3(attachX, handleBotY, 0),
  ]);
  const lowerHandleGeo = new THREE.TubeGeometry(lowerHandleCurve, 16, HANDLE_R, 12, false);
  const lowerHandleMesh = new THREE.Mesh(lowerHandleGeo, clayMat);
  lowerHandleMesh.name = 'mug_handle_lower_clay';
  lowerHandleMesh.castShadow = true;
  lowerHandleMesh.receiveShadow = true;
  group.add(lowerHandleMesh);

  return group;
}
