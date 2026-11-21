function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.30;
  const R_OUTER = DIAMETER / 2;
  const RIM_T = 0.012;
  const R_INNER = R_OUTER - RIM_T;
  const DEPTH = 0.055;
  const BACK_T = 0.012;
  const CENTER_Y = R_OUTER;
  const DIAL_Z = -DEPTH / 2 + BACK_T;

  const HOUR_W = 0.009;
  const HOUR_L = 0.095;
  const HOUR_TAIL = 0.020;
  const MIN_W = 0.007;
  const MIN_L = 0.128;
  const MIN_TAIL = 0.024;
  const HAND_T = 0.002;

  const SEC_W = 0.0022;
  const SEC_L = 0.132;
  const SEC_TAIL = 0.028;
  const SEC_T = 0.0012;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4d6880,
    roughness: 0.72,
    metalness: 0.08
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xf0f2f4,
    roughness: 0.35,
    metalness: 0.15
  });

  const secondHandMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d40,
    roughness: 0.45,
    metalness: 0.35
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec4,
    roughness: 0.3,
    metalness: 0.8
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.4,
    metalness: 0.2
  });

  // Clock housing & dial (LatheGeometry revolved around Y, rotated to face +Z)
  const profile = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(R_OUTER, -DEPTH / 2),
    new THREE.Vector2(R_OUTER, DEPTH / 2),
    new THREE.Vector2(R_INNER, DEPTH / 2),
    new THREE.Vector2(R_INNER, DIAL_Z),
    new THREE.Vector2(0, DIAL_Z)
  ];
  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.rotation.x = Math.PI / 2;
  bodyMesh.position.set(0, CENTER_Y, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Center metallic collar
  const collarGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 16);
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.name = 'center_collar';
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0015);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);

  // Hour hand (~10 o'clock)
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_L, HAND_T);
  hourGeo.translate(0, HOUR_L / 2 - HOUR_TAIL, 0);
  const hourMesh = new THREE.Mesh(hourGeo, handMat);
  hourMesh.name = 'hour_hand';
  hourMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0045);
  hourMesh.rotation.z = (54 * Math.PI) / 180;
  hourMesh.castShadow = true;
  hourMesh.receiveShadow = true;
  group.add(hourMesh);

  // Minute hand (~1:50)
  const minGeo = new THREE.BoxGeometry(MIN_W, MIN_L, HAND_T);
  minGeo.translate(0, MIN_L / 2 - MIN_TAIL, 0);
  const minMesh = new THREE.Mesh(minGeo, handMat);
  minMesh.name = 'minute_hand';
  minMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0075);
  minMesh.rotation.z = (-49 * Math.PI) / 180;
  minMesh.castShadow = true;
  minMesh.receiveShadow = true;
  group.add(minMesh);

  // Second hand (~8:40)
  const secGeo = new THREE.BoxGeometry(SEC_W, SEC_L, SEC_T);
  secGeo.translate(0, SEC_L / 2 - SEC_TAIL, 0);
  const secMesh = new THREE.Mesh(secGeo, secondHandMat);
  secMesh.name = 'second_hand';
  secMesh.position.set(0, CENTER_Y, DIAL_Z + 0.010);
  secMesh.rotation.z = (96 * Math.PI) / 180;
  secMesh.castShadow = true;
  secMesh.receiveShadow = true;
  group.add(secMesh);

  // Center cap
  const capGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 16);
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.name = 'center_cap';
  capMesh.rotation.x = Math.PI / 2;
  capMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0115);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
