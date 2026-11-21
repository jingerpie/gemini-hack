function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2;
  const BODY_DEPTH = 0.032;
  const CENTER_Y = RADIUS;
  const FACE_Z = BODY_DEPTH / 2;

  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xf0e8d5,
    roughness: 0.75,
    metalness: 0.05
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x2c241e,
    roughness: 0.45,
    metalness: 0.2
  });

  // Main clock body
  const bodyGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, BODY_DEPTH, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, faceMat);
  body.name = 'clock_body';
  body.position.set(0, CENTER_Y, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Outer and inner minute track rings
  const outerRingRadius = RADIUS * 0.92;
  const innerRingRadius = RADIUS * 0.85;
  const ringTube = 0.0012;

  const outerRingGeo = new THREE.TorusGeometry(outerRingRadius, ringTube, 8, 32);
  const outerRing = new THREE.Mesh(outerRingGeo, darkMat);
  outerRing.name = 'outer_track_ring';
  outerRing.position.set(0, CENTER_Y, FACE_Z + ringTube * 0.5);
  outerRing.castShadow = true;
  outerRing.receiveShadow = true;
  group.add(outerRing);

  const innerRingGeo = new THREE.TorusGeometry(innerRingRadius, ringTube, 8, 32);
  const innerRing = new THREE.Mesh(innerRingGeo, darkMat);
  innerRing.name = 'inner_track_ring';
  innerRing.position.set(0, CENTER_Y, FACE_Z + ringTube * 0.5);
  innerRing.castShadow = true;
  innerRing.receiveShadow = true;
  group.add(innerRing);

  // 12 hour tick marks
  const tickRadius = (outerRingRadius + innerRingRadius) / 2;
  const tickLen = outerRingRadius - innerRingRadius;
  const tickWidth = 0.0028;
  const tickDepth = 0.0015;
  const tickGeo = new THREE.BoxGeometry(tickWidth, tickLen, tickDepth);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, darkMat);
    tick.name = `tick_mark_${i + 1}`;
    tick.position.set(
      Math.sin(angle) * tickRadius,
      CENTER_Y + Math.cos(angle) * tickRadius,
      FACE_Z + tickDepth / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing ~10 o'clock)
  const hourLen = RADIUS * 0.56;
  const hourTail = RADIUS * 0.14;
  const hourTotal = hourLen + hourTail;
  const hourGeo = new THREE.BoxGeometry(0.0065, hourTotal, 0.002);
  const hourAngle = (10 / 12) * Math.PI * 2; // 10 o'clock
  const hourHand = new THREE.Mesh(hourGeo, darkMat);
  hourHand.name = 'hour_hand';
  const hourOffset = (hourLen - hourTail) / 2;
  hourHand.position.set(
    Math.sin(hourAngle) * hourOffset,
    CENTER_Y + Math.cos(hourAngle) * hourOffset,
    FACE_Z + 0.003
  );
  hourHand.rotation.z = -hourAngle;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2 o'clock)
  const minLen = RADIUS * 0.78;
  const minTail = RADIUS * 0.16;
  const minTotal = minLen + minTail;
  const minGeo = new THREE.BoxGeometry(0.005, minTotal, 0.002);
  const minAngle = (2 / 12) * Math.PI * 2; // 10 minutes
  const minHand = new THREE.Mesh(minGeo, darkMat);
  minHand.name = 'minute_hand';
  const minOffset = (minLen - minTail) / 2;
  minHand.position.set(
    Math.sin(minAngle) * minOffset,
    CENTER_Y + Math.cos(minAngle) * minOffset,
    FACE_Z + 0.0055
  );
  minHand.rotation.z = -minAngle;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Second hand (pointing ~6 o'clock)
  const secLen = RADIUS * 0.80;
  const secTail = RADIUS * 0.18;
  const secTotal = secLen + secTail;
  const secGeo = new THREE.BoxGeometry(0.0022, secTotal, 0.0015);
  const secAngle = Math.PI; // 6 o'clock
  const secHand = new THREE.Mesh(secGeo, darkMat);
  secHand.name = 'second_hand';
  const secOffset = (secLen - secTail) / 2;
  secHand.position.set(
    Math.sin(secAngle) * secOffset,
    CENTER_Y + Math.cos(secAngle) * secOffset,
    FACE_Z + 0.0075
  );
  secHand.rotation.z = -secAngle;
  secHand.castShadow = true;
  secHand.receiveShadow = true;
  group.add(secHand);

  // Center cap
  const capGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.009, 16);
  capGeo.rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, darkMat);
  cap.name = 'center_cap';
  cap.position.set(0, CENTER_Y, FACE_Z + 0.0045);
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  return group;
}
