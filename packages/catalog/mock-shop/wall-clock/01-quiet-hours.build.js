function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.055;
  const BEZEL_THICKNESS = 0.008;
  const INNER_RADIUS = RADIUS - BEZEL_THICKNESS;
  const DIAL_Z = -DEPTH / 2 + 0.012;
  const GLASS_Z = DEPTH / 2 - 0.005;
  const CENTER_Y = RADIUS;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x8d867e,
    roughness: 0.38,
    metalness: 0.55
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0x8a847c,
    roughness: 0.72,
    metalness: 0.05
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0x4b4844,
    roughness: 0.55,
    metalness: 0.15
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xc2beb8,
    roughness: 0.3,
    metalness: 0.75
  });

  const mechanismMat = new THREE.MeshStandardMaterial({
    color: 0x222224,
    roughness: 0.5,
    metalness: 0.3
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.18,
    clearcoat: 1.0
  });

  // Outer bezel ring using LatheGeometry for a clean hollow cylinder with flat back
  const bezelPoints = [
    new THREE.Vector2(INNER_RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - 0.001),
    new THREE.Vector2(RADIUS - 0.001, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS + 0.001, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS, DEPTH / 2 - 0.001),
    new THREE.Vector2(INNER_RADIUS, -DEPTH / 2)
  ];
  const bezelGeo = new THREE.LatheGeometry(bezelPoints, 32);
  bezelGeo.rotateX(Math.PI / 2);
  const bezel = new THREE.Mesh(bezelGeo, frameMat);
  bezel.name = 'clock_bezel';
  bezel.position.set(0, CENTER_Y, 0);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  group.add(bezel);

  // Back plate
  const backGeo = new THREE.CylinderGeometry(INNER_RADIUS + 0.001, INNER_RADIUS + 0.001, 0.004, 32);
  backGeo.rotateX(Math.PI / 2);
  const backPlate = new THREE.Mesh(backGeo, frameMat);
  backPlate.name = 'clock_back_plate';
  backPlate.position.set(0, CENTER_Y, -DEPTH / 2 + 0.002);
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);

  // Dial face
  const dialGeo = new THREE.CylinderGeometry(INNER_RADIUS, INNER_RADIUS, 0.003, 32);
  dialGeo.rotateX(Math.PI / 2);
  const dial = new THREE.Mesh(dialGeo, dialMat);
  dial.name = 'clock_dial';
  dial.position.set(0, CENTER_Y, DIAL_Z);
  dial.castShadow = true;
  dial.receiveShadow = true;
  group.add(dial);

  // Center mechanism recess
  const mechGeo = new THREE.CylinderGeometry(0.017, 0.017, 0.004, 24);
  mechGeo.rotateX(Math.PI / 2);
  const mech = new THREE.Mesh(mechGeo, mechanismMat);
  mech.name = 'clock_mechanism';
  mech.position.set(0, CENTER_Y, DIAL_Z + 0.001);
  mech.castShadow = true;
  mech.receiveShadow = true;
  group.add(mech);

  // 12 hour tick marks
  const tickLength = 0.026;
  const tickWidth = 0.003;
  const tickDepth = 0.0015;
  const tickRadius = INNER_RADIUS - 0.01 - tickLength / 2;
  const tickGeo = new THREE.BoxGeometry(tickWidth, tickLength, tickDepth);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.name = `hour_tick_${i + 1}`;
    tick.position.set(
      Math.sin(angle) * tickRadius,
      CENTER_Y + Math.cos(angle) * tickRadius,
      DIAL_Z + 0.002
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing ~10 o'clock)
  const hourLen = 0.072;
  const hourTail = 0.018;
  const hourGeo = new THREE.BoxGeometry(0.0055, hourLen + hourTail, 0.0015);
  hourGeo.translate(0, (hourLen - hourTail) / 2, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, CENTER_Y, DIAL_Z + 0.005);
  hourHand.rotation.z = (60 / 180) * Math.PI;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2 o'clock)
  const minLen = 0.108;
  const minTail = 0.022;
  const minGeo = new THREE.BoxGeometry(0.0045, minLen + minTail, 0.0015);
  minGeo.translate(0, (minLen - minTail) / 2, 0);
  const minHand = new THREE.Mesh(minGeo, handMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, CENTER_Y, DIAL_Z + 0.0075);
  minHand.rotation.z = (-52 / 180) * Math.PI;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Center pin
  const pinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.005, 16);
  pinGeo.rotateX(Math.PI / 2);
  const pin = new THREE.Mesh(pinGeo, handMat);
  pin.name = 'center_pin';
  pin.position.set(0, CENTER_Y, DIAL_Z + 0.0085);
  pin.castShadow = true;
  pin.receiveShadow = true;
  group.add(pin);

  // Glass cover
  const glassGeo = new THREE.CylinderGeometry(INNER_RADIUS, INNER_RADIUS, 0.002, 32);
  glassGeo.rotateX(Math.PI / 2);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.name = 'glass_cover';
  glass.position.set(0, CENTER_Y, GLASS_Z);
  glass.castShadow = true;
  glass.receiveShadow = true;
  group.add(glass);

  return group;
}
