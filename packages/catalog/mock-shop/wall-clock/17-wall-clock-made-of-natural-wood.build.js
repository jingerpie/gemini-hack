function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const DIAMETER = 0.34;
  const R = DIAMETER / 2;
  const DEPTH = 0.045;
  const RIM_THICKNESS = 0.014;
  const BACK_THICKNESS = 0.018;

  const TICK_W = 0.003;
  const TICK_L = 0.022;
  const TICK_D = 0.003;
  const TICK_RADIUS = R - RIM_THICKNESS - 0.024;

  const HOUR_W = 0.009;
  const HOUR_L = 0.105;
  const HOUR_TAIL = 0.025;
  const MINUTE_W = 0.007;
  const MINUTE_L = 0.145;
  const MINUTE_TAIL = 0.03;
  const HAND_D = 0.004;

  const PIN_R = 0.004;
  const PIN_D = 0.014;

  const FACE_Z = -DEPTH / 2 + BACK_THICKNESS;

  // Materials
  const lightWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd1b086,
    roughness: 0.72,
    metalness: 0.0,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c24,
    roughness: 0.68,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc2b296,
    roughness: 0.32,
    metalness: 0.85,
  });

  // 1. Outer rim (full depth from -DEPTH/2 to +DEPTH/2)
  const rimShape = new THREE.Shape();
  rimShape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const rimHole = new THREE.Path();
  rimHole.absarc(0, 0, R - RIM_THICKNESS, 0, Math.PI * 2, true);
  rimShape.holes.push(rimHole);

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: DEPTH,
    bevelEnabled: false,
    curveSegments: 32,
  });
  rimGeo.translate(0, 0, -DEPTH / 2);

  const rimMesh = new THREE.Mesh(rimGeo, lightWoodMat);
  rimMesh.name = 'clock_rim';
  rimMesh.position.set(0, R, 0);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 2. Recessed backplate
  const backGeo = new THREE.CylinderGeometry(
    R - RIM_THICKNESS + 0.001,
    R - RIM_THICKNESS + 0.001,
    BACK_THICKNESS,
    32
  );
  backGeo.rotateX(Math.PI / 2);

  const backMesh = new THREE.Mesh(backGeo, lightWoodMat);
  backMesh.name = 'clock_backplate';
  backMesh.position.set(0, R, -DEPTH / 2 + BACK_THICKNESS / 2);
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  group.add(backMesh);

  // 3. 12 Hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_L, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, darkWoodMat);
    tick.name = `tick_mark_${i === 0 ? 12 : i}`;
    tick.position.set(
      Math.sin(angle) * TICK_RADIUS,
      R + Math.cos(angle) * TICK_RADIUS,
      FACE_Z + TICK_D / 2 - 0.0005
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // 4. Hour hand (pointing ~10 o'clock)
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_L, HAND_D);
  hourGeo.translate(0, HOUR_L / 2 - HOUR_TAIL, 0);
  const hourHand = new THREE.Mesh(hourGeo, darkWoodMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, R, FACE_Z + 0.005);
  hourHand.rotation.z = Math.PI / 3;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // 5. Minute hand (pointing ~2 o'clock)
  const minuteGeo = new THREE.BoxGeometry(MINUTE_W, MINUTE_L, HAND_D);
  minuteGeo.translate(0, MINUTE_L / 2 - MINUTE_TAIL, 0);
  const minuteHand = new THREE.Mesh(minuteGeo, darkWoodMat);
  minuteHand.name = 'minute_hand';
  minuteHand.position.set(0, R, FACE_Z + 0.01);
  minuteHand.rotation.z = -Math.PI / 3;
  minuteHand.castShadow = true;
  minuteHand.receiveShadow = true;
  group.add(minuteHand);

  // 6. Center pin
  const pinGeo = new THREE.CylinderGeometry(PIN_R, PIN_R, PIN_D, 16);
  pinGeo.rotateX(Math.PI / 2);
  const pinMesh = new THREE.Mesh(pinGeo, metalMat);
  pinMesh.name = 'center_pin';
  pinMesh.position.set(0, R, FACE_Z + PIN_D / 2);
  pinMesh.castShadow = true;
  pinMesh.receiveShadow = true;
  group.add(pinMesh);

  return group;
}
