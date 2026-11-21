function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.25;
  const RADIUS = DIAMETER / 2;
  const BODY_DEPTH = 0.018;
  const HAND_CLEARANCE = 0.002;
  const PIN_HEIGHT = 0.008;
  const TOTAL_DEPTH = BODY_DEPTH + PIN_HEIGHT;
  const Z_BACK = -TOTAL_DEPTH / 2;
  const Z_FACE = Z_BACK + BODY_DEPTH;
  const CENTER_Y = RADIUS;

  const tickRadius = RADIUS * 0.78;
  const tickW = 0.003;
  const tickH = 0.016;
  const tickD = 0.001;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d3,
    roughness: 0.78,
    metalness: 0.02
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0x7a5a3a,
    roughness: 0.65,
    metalness: 0.05
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x3a2618,
    roughness: 0.45,
    metalness: 0.15
  });

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xb59449,
    roughness: 0.3,
    metalness: 0.75
  });

  // Main clock body
  const bodyGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, BODY_DEPTH, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.position.set(0, CENTER_Y, Z_BACK + BODY_DEPTH / 2);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 12 hour tick marks
  const tickGeo = new THREE.BoxGeometry(tickW, tickH, tickD);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.name = 'tick_mark_' + (i + 1);
    tick.position.set(
      Math.sin(angle) * tickRadius,
      CENTER_Y + Math.cos(angle) * tickRadius,
      Z_FACE + tickD / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Center pin
  const pinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, PIN_HEIGHT, 16);
  pinGeo.rotateX(Math.PI / 2);
  const pinMesh = new THREE.Mesh(pinGeo, pinMat);
  pinMesh.name = 'center_pin';
  pinMesh.position.set(0, CENTER_Y, Z_FACE + PIN_HEIGHT / 2);
  pinMesh.castShadow = true;
  pinMesh.receiveShadow = true;
  group.add(pinMesh);

  // Hour hand (pointing ~10:15 like photo, around 10:12)
  const hourLen = 0.062;
  const hourW = 0.0045;
  const hourD = 0.0015;
  const hourAngle = (10.2 / 12) * Math.PI * 2;
  const hourGeo = new THREE.BoxGeometry(hourW, hourLen, hourD);
  hourGeo.translate(0, hourLen / 2 - 0.012, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, CENTER_Y, Z_FACE + HAND_CLEARANCE + hourD / 2);
  hourHand.rotation.z = -hourAngle;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2:12 / 12 minutes)
  const minLen = 0.092;
  const minW = 0.0035;
  const minD = 0.0015;
  const minAngle = (12.5 / 60) * Math.PI * 2;
  const minGeo = new THREE.BoxGeometry(minW, minLen, minD);
  minGeo.translate(0, minLen / 2 - 0.015, 0);
  const minHand = new THREE.Mesh(minGeo, handMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, CENTER_Y, Z_FACE + HAND_CLEARANCE + hourD + minD / 2 + 0.0005);
  minHand.rotation.z = -minAngle;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Second hand (pointing ~47 seconds)
  const secLen = 0.105;
  const secW = 0.0015;
  const secD = 0.001;
  const secAngle = (47 / 60) * Math.PI * 2;
  const secGeo = new THREE.BoxGeometry(secW, secLen, secD);
  secGeo.translate(0, secLen / 2 - 0.022, 0);
  const secHand = new THREE.Mesh(secGeo, handMat);
  secHand.name = 'second_hand';
  secHand.position.set(0, CENTER_Y, Z_FACE + HAND_CLEARANCE + hourD + minD + secD / 2 + 0.001);
  secHand.rotation.z = -secAngle;
  secHand.castShadow = true;
  secHand.receiveShadow = true;
  group.add(secHand);

  return group;
}
