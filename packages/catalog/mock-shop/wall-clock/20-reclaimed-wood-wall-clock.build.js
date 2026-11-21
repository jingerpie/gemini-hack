function build(THREE) {
  const group = new THREE.Group();

  const W = 0.40;
  const H = 0.40;
  const R = W / 2;
  const DISC_D = 0.032;
  const TICK_W = 0.008;
  const TICK_L = 0.036;
  const TICK_D = 0.005;
  const TICK_R = R - TICK_L / 2 - 0.008;
  const HAND_D = 0.0025;
  const HOUR_W = 0.009;
  const HOUR_L = 0.12;
  const MIN_W = 0.0065;
  const MIN_L = 0.165;
  const CAP_R = 0.007;
  const CAP_D = 0.004;
  const TOTAL_D = DISC_D + HAND_D * 2 + CAP_D;

  const Z_BACK = -TOTAL_D / 2;
  const Z_FRONT = Z_BACK + DISC_D;
  const CENTER_Y = H / 2;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa6835a,
    roughness: 0.78,
    metalness: 0.04,
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0xc2a378,
    roughness: 0.72,
    metalness: 0.04,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.55,
    metalness: 0.35,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x9c8248,
    roughness: 0.38,
    metalness: 0.75,
  });

  // Main circular reclaimed wood face
  const faceGeo = new THREE.CylinderGeometry(R, R, DISC_D, 32);
  faceGeo.rotateX(Math.PI / 2);
  const faceMesh = new THREE.Mesh(faceGeo, woodMat);
  faceMesh.name = 'clock_face';
  faceMesh.position.set(0, CENTER_Y, Z_BACK + DISC_D / 2);
  faceMesh.castShadow = true;
  faceMesh.receiveShadow = true;
  group.add(faceMesh);

  // 12 radial wooden tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_L, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.name = `tick_mark_${i === 0 ? 12 : i}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      CENTER_Y + Math.cos(angle) * TICK_R,
      Z_FRONT + TICK_D / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing ~10 o'clock)
  const hourAngle = (10 / 12) * Math.PI * 2;
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_L, HAND_D);
  const hourOffset = HOUR_L / 2 - 0.02;
  const hourMesh = new THREE.Mesh(hourGeo, handMat);
  hourMesh.name = 'hour_hand';
  hourMesh.position.set(
    Math.sin(hourAngle) * hourOffset,
    CENTER_Y + Math.cos(hourAngle) * hourOffset,
    Z_FRONT + HAND_D / 2
  );
  hourMesh.rotation.z = -hourAngle;
  hourMesh.castShadow = true;
  hourMesh.receiveShadow = true;
  group.add(hourMesh);

  // Minute hand (pointing ~2 o'clock)
  const minAngle = (10 / 60) * Math.PI * 2;
  const minGeo = new THREE.BoxGeometry(MIN_W, MIN_L, HAND_D);
  const minOffset = MIN_L / 2 - 0.025;
  const minMesh = new THREE.Mesh(minGeo, handMat);
  minMesh.name = 'minute_hand';
  minMesh.position.set(
    Math.sin(minAngle) * minOffset,
    CENTER_Y + Math.cos(minAngle) * minOffset,
    Z_FRONT + HAND_D * 1.5
  );
  minMesh.rotation.z = -minAngle;
  minMesh.castShadow = true;
  minMesh.receiveShadow = true;
  group.add(minMesh);

  // Center brass pivot cap
  const capH = HAND_D * 2 + CAP_D;
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, capH, 16);
  capGeo.rotateX(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, brassMat);
  capMesh.name = 'center_cap';
  capMesh.position.set(0, CENTER_Y, Z_FRONT + capH / 2);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
