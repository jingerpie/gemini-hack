function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2;
  const BODY_D = 0.036;
  const BEVEL = 0.0025;
  const CENTER_Y = RADIUS;

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x8b6756,
    roughness: 0.9,
    metalness: 0.02
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.35,
    metalness: 0.85
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.45,
    metalness: 0.2
  });

  // Main concrete body with flat back and subtle front bevel
  const profile = [
    new THREE.Vector2(0, -BODY_D / 2),
    new THREE.Vector2(RADIUS, -BODY_D / 2),
    new THREE.Vector2(RADIUS, BODY_D / 2 - BEVEL),
    new THREE.Vector2(RADIUS - BEVEL, BODY_D / 2),
    new THREE.Vector2(0, BODY_D / 2)
  ];
  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, concreteMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.rotation.x = Math.PI / 2;
  bodyMesh.position.set(0, CENTER_Y, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Brass center collar
  const collarH = 0.004;
  const collarGeo = new THREE.CylinderGeometry(0.006, 0.006, collarH, 24);
  const collarMesh = new THREE.Mesh(collarGeo, brassMat);
  collarMesh.name = 'center_brass_collar';
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.set(0, CENTER_Y, BODY_D / 2 + collarH / 2);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);

  // Hour hand (pointing ~10 o'clock)
  const hourLen = 0.088;
  const hourTail = 0.012;
  const hourGeo = new THREE.BoxGeometry(0.0042, hourLen, 0.0018);
  hourGeo.translate(0, hourLen / 2 - hourTail, 0);
  const hourMesh = new THREE.Mesh(hourGeo, blackMat);
  hourMesh.name = 'hour_hand';
  hourMesh.position.set(0, CENTER_Y, BODY_D / 2 + 0.0045);
  hourMesh.rotation.z = Math.PI / 3;
  hourMesh.castShadow = true;
  hourMesh.receiveShadow = true;
  group.add(hourMesh);

  // Minute hand (pointing ~2 o'clock)
  const minLen = 0.128;
  const minTail = 0.014;
  const minGeo = new THREE.BoxGeometry(0.0034, minLen, 0.0018);
  minGeo.translate(0, minLen / 2 - minTail, 0);
  const minMesh = new THREE.Mesh(minGeo, blackMat);
  minMesh.name = 'minute_hand';
  minMesh.position.set(0, CENTER_Y, BODY_D / 2 + 0.0065);
  minMesh.rotation.z = -Math.PI / 3;
  minMesh.castShadow = true;
  minMesh.receiveShadow = true;
  group.add(minMesh);

  // Center black cap
  const capH = 0.003;
  const capGeo = new THREE.CylinderGeometry(0.0042, 0.0042, capH, 20);
  const capMesh = new THREE.Mesh(capGeo, blackMat);
  capMesh.name = 'center_cap';
  capMesh.rotation.x = Math.PI / 2;
  capMesh.position.set(0, CENTER_Y, BODY_D / 2 + 0.0075);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
