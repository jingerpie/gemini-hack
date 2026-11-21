function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.32;
  const R_OUT = DIAMETER / 2;
  const R_IN = 0.124;
  const DEPTH = 0.056;
  const BACK_THICKNESS = 0.012;
  const DIAL_Z = -DEPTH / 2 + BACK_THICKNESS;
  const CENTER_Y = R_OUT;

  const TICK_LEN = 0.018;
  const TICK_W = 0.0018;
  const TICK_D = 0.0012;
  const TICK_R = R_IN - 0.016;

  const HOUR_LEN = 0.072;
  const HOUR_W = 0.0038;
  const HOUR_D = 0.0018;
  const HOUR_TAIL = 0.014;

  const MIN_LEN = 0.098;
  const MIN_W = 0.0028;
  const MIN_D = 0.0016;
  const MIN_TAIL = 0.016;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    metalness: 0.85,
    roughness: 0.28,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xdcdedf,
    metalness: 0.25,
    roughness: 0.45,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x18181a,
    metalness: 0.2,
    roughness: 0.4,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb8943a,
    metalness: 0.85,
    roughness: 0.25,
  });

  // 1. Stainless steel case & bezel (LatheGeometry rotated so +Y becomes +Z)
  const casePoints = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(R_OUT, -DEPTH / 2),
    new THREE.Vector2(R_OUT, DEPTH / 2),
    new THREE.Vector2(R_IN, DEPTH / 2),
    new THREE.Vector2(R_IN, DIAL_Z),
    new THREE.Vector2(0, DIAL_Z),
  ];
  const caseGeo = new THREE.LatheGeometry(casePoints, 32);
  const caseMesh = new THREE.Mesh(caseGeo, steelMat);
  caseMesh.name = 'stainless_steel_case';
  caseMesh.rotation.x = Math.PI / 2;
  caseMesh.position.set(0, CENTER_Y, 0);
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  group.add(caseMesh);

  // 2. Dial face
  const dialGeo = new THREE.CylinderGeometry(R_IN, R_IN, 0.002, 32);
  const dialMesh = new THREE.Mesh(dialGeo, dialMat);
  dialMesh.name = 'clock_dial';
  dialMesh.rotation.x = Math.PI / 2;
  dialMesh.position.set(0, CENTER_Y, DIAL_Z + 0.001);
  dialMesh.castShadow = true;
  dialMesh.receiveShadow = true;
  group.add(dialMesh);

  // 3. 12 Hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_LEN, TICK_D);
  const tickZ = DIAL_Z + 0.002 + TICK_D / 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const tick = new THREE.Mesh(tickGeo, blackMat);
    tick.name = `hour_tick_${i}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      CENTER_Y + Math.cos(angle) * TICK_R,
      tickZ
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // 4. Hour hand (~10 o'clock)
  const hourAngle = (10 / 12) * Math.PI * 2;
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_LEN, HOUR_D);
  const hourOffset = HOUR_LEN / 2 - HOUR_TAIL;
  const hourMesh = new THREE.Mesh(hourGeo, blackMat);
  hourMesh.name = 'hour_hand';
  hourMesh.position.set(
    Math.sin(hourAngle) * hourOffset,
    CENTER_Y + Math.cos(hourAngle) * hourOffset,
    DIAL_Z + 0.0045
  );
  hourMesh.rotation.z = -hourAngle;
  hourMesh.castShadow = true;
  hourMesh.receiveShadow = true;
  group.add(hourMesh);

  // 5. Minute hand (~2 o'clock / 10 minutes)
  const minAngle = (2 / 12) * Math.PI * 2;
  const minGeo = new THREE.BoxGeometry(MIN_W, MIN_LEN, MIN_D);
  const minOffset = MIN_LEN / 2 - MIN_TAIL;
  const minMesh = new THREE.Mesh(minGeo, blackMat);
  minMesh.name = 'minute_hand';
  minMesh.position.set(
    Math.sin(minAngle) * minOffset,
    CENTER_Y + Math.cos(minAngle) * minOffset,
    DIAL_Z + 0.0068
  );
  minMesh.rotation.z = -minAngle;
  minMesh.castShadow = true;
  minMesh.receiveShadow = true;
  group.add(minMesh);

  // 6. Center cap & brass pin
  const capGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 16);
  const capMesh = new THREE.Mesh(capGeo, blackMat);
  capMesh.name = 'center_cap';
  capMesh.rotation.x = Math.PI / 2;
  capMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0075);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  const pinGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.0036, 12);
  const pinMesh = new THREE.Mesh(pinGeo, brassMat);
  pinMesh.name = 'center_pin';
  pinMesh.rotation.x = Math.PI / 2;
  pinMesh.position.set(0, CENTER_Y, DIAL_Z + 0.008);
  pinMesh.castShadow = true;
  pinMesh.receiveShadow = true;
  group.add(pinMesh);

  return group;
}
