function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.35;
  const RADIUS = DIAMETER / 2;
  const BODY_DEPTH = 0.022;
  const TICK_DEPTH = 0.002;
  const HAND_DEPTH = 0.002;
  const CAP_DEPTH = 0.004;

  const CENTER_Y = RADIUS;
  const FACE_Z = BODY_DEPTH / 2;

  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede1,
    roughness: 0.75,
    metalness: 0.02
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0x563d2d,
    roughness: 0.6,
    metalness: 0.05
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xa68952,
    roughness: 0.35,
    metalness: 0.85
  });

  // Main clock body (flat back at z = -BODY_DEPTH / 2, front face at z = +BODY_DEPTH / 2)
  const bodyGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, BODY_DEPTH, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, faceMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.position.set(0, CENTER_Y, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 12 hour tick marks as thin boxes
  const tickRadius = RADIUS * 0.84;
  const majorTickGeo = new THREE.BoxGeometry(0.005, 0.018, TICK_DEPTH);
  const minorTickGeo = new THREE.BoxGeometry(0.003, 0.012, TICK_DEPTH);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isMajor = i % 3 === 0;
    const tick = new THREE.Mesh(isMajor ? majorTickGeo : minorTickGeo, tickMat);
    tick.name = `tick_mark_${i === 0 ? 12 : i}`;
    tick.position.set(
      Math.sin(angle) * tickRadius,
      CENTER_Y + Math.cos(angle) * tickRadius,
      FACE_Z + TICK_DEPTH / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing ~10 o'clock)
  const hourLen = RADIUS * 0.52;
  const hourTail = 0.022;
  const hourGeo = new THREE.BoxGeometry(0.007, hourLen + hourTail, HAND_DEPTH);
  hourGeo.translate(0, (hourLen - hourTail) / 2, 0);
  const hourHand = new THREE.Mesh(hourGeo, brassMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, CENTER_Y, FACE_Z + HAND_DEPTH * 0.8);
  hourHand.rotation.z = (305 * Math.PI) / 180;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2 o'clock)
  const minLen = RADIUS * 0.74;
  const minTail = 0.026;
  const minGeo = new THREE.BoxGeometry(0.005, minLen + minTail, HAND_DEPTH);
  minGeo.translate(0, (minLen - minTail) / 2, 0);
  const minHand = new THREE.Mesh(minGeo, brassMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, CENTER_Y, FACE_Z + HAND_DEPTH * 1.9);
  minHand.rotation.z = (-55 * Math.PI) / 180;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Center pin cap
  const capGeo = new THREE.CylinderGeometry(0.007, 0.007, CAP_DEPTH, 16);
  capGeo.rotateX(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, brassMat);
  capMesh.name = 'center_cap';
  capMesh.position.set(0, CENTER_Y, FACE_Z + HAND_DEPTH * 2.5 + CAP_DEPTH / 2);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
