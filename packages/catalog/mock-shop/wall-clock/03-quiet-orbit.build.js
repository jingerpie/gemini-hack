function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.28;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.036;
  const RIM_WIDTH = 0.016;
  const INNER_RADIUS = RADIUS - RIM_WIDTH;
  const DIAL_Z = -DEPTH / 2 + 0.020;

  const TICK_LEN = 0.022;
  const TICK_W = 0.0045;
  const TICK_D = 0.003;
  const TICK_RADIUS = INNER_RADIUS - 0.016;

  const HOUR_LEN = 0.072;
  const HOUR_W = 0.0055;
  const HOUR_D = 0.002;
  const HOUR_OVERHANG = 0.016;

  const MIN_LEN = 0.105;
  const MIN_W = 0.0045;
  const MIN_D = 0.002;
  const MIN_OVERHANG = 0.020;

  const PIN_RADIUS = 0.0045;
  const PIN_D = 0.004;

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x222325,
    roughness: 0.88,
    metalness: 0.05
  });

  const dialMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0908,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d3d6,
    roughness: 0.28,
    metalness: 0.88
  });

  // Outer concrete frame with flat back at z = -DEPTH/2 and front rim at z = +DEPTH/2
  const frameProfile = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - 0.002),
    new THREE.Vector2(RADIUS - 0.002, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS + 0.002, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS, DEPTH / 2 - 0.002),
    new THREE.Vector2(INNER_RADIUS, DIAL_Z),
    new THREE.Vector2(0, DIAL_Z)
  ];
  const frameGeo = new THREE.LatheGeometry(frameProfile, 32);
  frameGeo.rotateX(Math.PI / 2);
  const frameMesh = new THREE.Mesh(frameGeo, concreteMat);
  frameMesh.position.set(0, RADIUS, 0);
  frameMesh.name = 'clock_frame';
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // Glossy black dial face
  const dialGeo = new THREE.CylinderGeometry(INNER_RADIUS, INNER_RADIUS, 0.002, 32);
  dialGeo.rotateX(Math.PI / 2);
  const dialMesh = new THREE.Mesh(dialGeo, dialMat);
  dialMesh.position.set(0, RADIUS, DIAL_Z + 0.001);
  dialMesh.name = 'clock_dial';
  dialMesh.castShadow = true;
  dialMesh.receiveShadow = true;
  group.add(dialMesh);

  // 12 radial hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_LEN, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, metalMat);
    tick.position.set(
      Math.sin(angle) * TICK_RADIUS,
      RADIUS + Math.cos(angle) * TICK_RADIUS,
      DIAL_Z + 0.002 + TICK_D / 2
    );
    tick.rotation.z = -angle;
    tick.name = `hour_tick_${i + 1}`;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing ~10 o'clock)
  const hourAngle = (10 / 12) * Math.PI * 2;
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_LEN, HOUR_D);
  hourGeo.translate(0, HOUR_LEN / 2 - HOUR_OVERHANG, 0);
  const hourHand = new THREE.Mesh(hourGeo, metalMat);
  hourHand.position.set(0, RADIUS, DIAL_Z + 0.005);
  hourHand.rotation.z = -hourAngle;
  hourHand.name = 'hour_hand';
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2 o'clock)
  const minAngle = (2 / 12) * Math.PI * 2;
  const minGeo = new THREE.BoxGeometry(MIN_W, MIN_LEN, MIN_D);
  minGeo.translate(0, MIN_LEN / 2 - MIN_OVERHANG, 0);
  const minHand = new THREE.Mesh(minGeo, metalMat);
  minHand.position.set(0, RADIUS, DIAL_Z + 0.008);
  minHand.rotation.z = -minAngle;
  minHand.name = 'minute_hand';
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Center cap pin
  const pinGeo = new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, PIN_D, 16);
  pinGeo.rotateX(Math.PI / 2);
  const pinMesh = new THREE.Mesh(pinGeo, metalMat);
  pinMesh.position.set(0, RADIUS, DIAL_Z + 0.009);
  pinMesh.name = 'center_pin';
  pinMesh.castShadow = true;
  pinMesh.receiveShadow = true;
  group.add(pinMesh);

  return group;
}
