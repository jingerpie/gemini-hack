function build(THREE) {
  const group = new THREE.Group();

  const DIAM = 0.48;
  const RADIUS = DIAM / 2;
  const DEPTH = 0.075;
  const FACE_R = RADIUS - 0.051;
  const ROPE_R = RADIUS - 0.029;
  const ROPE_TUBE = 0.0075;
  const TICK_R = FACE_R - 0.016;

  const woodFrameMat = new THREE.MeshStandardMaterial({
    color: 0x8b7e6f,
    roughness: 0.78,
    metalness: 0.04,
  });

  const woodFaceMat = new THREE.MeshStandardMaterial({
    color: 0xa89d8e,
    roughness: 0.82,
    metalness: 0.02,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xc8b596,
    roughness: 0.92,
    metalness: 0.0,
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0x3b352e,
    roughness: 0.65,
    metalness: 0.1,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    roughness: 0.28,
    metalness: 0.82,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.05,
    transparent: true,
    opacity: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  // Wooden frame with flat back at z = -DEPTH/2, rope groove, and inner bezel
  const frameProfile = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - 0.004),
    new THREE.Vector2(RADIUS - 0.004, DEPTH / 2),
    new THREE.Vector2(RADIUS - 0.020, DEPTH / 2),
    new THREE.Vector2(RADIUS - 0.022, DEPTH / 2 - 0.012),
    new THREE.Vector2(RADIUS - 0.036, DEPTH / 2 - 0.012),
    new THREE.Vector2(RADIUS - 0.038, DEPTH / 2 - 0.002),
    new THREE.Vector2(RADIUS - 0.050, DEPTH / 2 - 0.002),
    new THREE.Vector2(RADIUS - 0.052, DEPTH / 2 - 0.022),
    new THREE.Vector2(0, DEPTH / 2 - 0.022),
  ];
  const frameGeo = new THREE.LatheGeometry(frameProfile, 32);
  const frameMesh = new THREE.Mesh(frameGeo, woodFrameMat);
  frameMesh.name = 'clock_frame';
  frameMesh.rotation.x = Math.PI / 2;
  frameMesh.position.y = RADIUS;
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // Rope inlay
  const ropeGeo = new THREE.TorusGeometry(ROPE_R, ROPE_TUBE, 12, 32);
  const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
  ropeMesh.name = 'rope_inlay';
  ropeMesh.position.set(0, RADIUS, DEPTH / 2 - 0.006);
  ropeMesh.castShadow = true;
  ropeMesh.receiveShadow = true;
  group.add(ropeMesh);

  // Clock face
  const faceGeo = new THREE.CylinderGeometry(FACE_R, FACE_R, 0.004, 32);
  const faceMesh = new THREE.Mesh(faceGeo, woodFaceMat);
  faceMesh.name = 'clock_face';
  faceMesh.rotation.x = Math.PI / 2;
  faceMesh.position.set(0, RADIUS, DEPTH / 2 - 0.020);
  faceMesh.castShadow = true;
  faceMesh.receiveShadow = true;
  group.add(faceMesh);

  // 12 hour tick marks
  const tickGeo = new THREE.BoxGeometry(0.003, 0.014, 0.002);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.name = `tick_mark_${i}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      RADIUS + Math.cos(angle) * TICK_R,
      DEPTH / 2 - 0.017
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing to ~10 o'clock)
  const HOUR_LEN = FACE_R * 0.52;
  const hourAngle = (55 * Math.PI) / 180;
  const hourGeo = new THREE.BoxGeometry(0.008, HOUR_LEN, 0.002);
  const hourMesh = new THREE.Mesh(hourGeo, metalMat);
  hourMesh.name = 'hour_hand';
  hourMesh.rotation.z = hourAngle;
  hourMesh.position.set(
    -Math.sin(hourAngle) * (HOUR_LEN * 0.35),
    RADIUS + Math.cos(hourAngle) * (HOUR_LEN * 0.35),
    DEPTH / 2 - 0.014
  );
  hourMesh.castShadow = true;
  hourMesh.receiveShadow = true;
  group.add(hourMesh);

  // Minute hand (pointing to ~2 o'clock)
  const MIN_LEN = FACE_R * 0.78;
  const minAngle = -(60 * Math.PI) / 180;
  const minGeo = new THREE.BoxGeometry(0.006, MIN_LEN, 0.002);
  const minMesh = new THREE.Mesh(minGeo, metalMat);
  minMesh.name = 'minute_hand';
  minMesh.rotation.z = minAngle;
  minMesh.position.set(
    -Math.sin(minAngle) * (MIN_LEN * 0.38),
    RADIUS + Math.cos(minAngle) * (MIN_LEN * 0.38),
    DEPTH / 2 - 0.011
  );
  minMesh.castShadow = true;
  minMesh.receiveShadow = true;
  group.add(minMesh);

  // Center pin
  const capGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 16);
  const capMesh = new THREE.Mesh(capGeo, metalMat);
  capMesh.name = 'center_cap';
  capMesh.rotation.x = Math.PI / 2;
  capMesh.position.set(0, RADIUS, DEPTH / 2 - 0.012);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  // Glass cover
  const glassGeo = new THREE.CylinderGeometry(FACE_R + 0.001, FACE_R + 0.001, 0.002, 32);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.name = 'glass_cover';
  glassMesh.rotation.x = Math.PI / 2;
  glassMesh.position.set(0, RADIUS, DEPTH / 2 - 0.005);
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  group.add(glassMesh);

  return group;
}
