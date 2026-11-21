function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.25;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.036;
  const CENTER_Y = RADIUS;
  const DIAL_Z = DEPTH / 2 - 0.009;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xede9df,
    roughness: 0.72,
    metalness: 0.02,
  });

  const handBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.5,
    metalness: 0.1,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb8a378,
    roughness: 0.35,
    metalness: 0.8,
  });

  // 1. Clock body & stepped bezel (LatheGeometry revolved around Y, then rotated to face +Z)
  const profile = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - 0.003),
    new THREE.Vector2(RADIUS - 0.002, DEPTH / 2),
    new THREE.Vector2(RADIUS - 0.011, DEPTH / 2),
    new THREE.Vector2(RADIUS - 0.011, DEPTH / 2 - 0.004),
    new THREE.Vector2(RADIUS - 0.017, DEPTH / 2 - 0.004),
    new THREE.Vector2(RADIUS - 0.017, DIAL_Z),
    new THREE.Vector2(0, DIAL_Z),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.position.set(0, CENTER_Y, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Hour tick marks (12 thin boxes)
  const tickLen = 0.017;
  const tickWidth = 0.003;
  const tickDepth = 0.0025;
  const tickRadius = RADIUS - 0.029;
  const tickGeo = new THREE.BoxGeometry(tickWidth, tickLen, tickDepth);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, bodyMat);
    tick.name = `tick_mark_${i === 0 ? 12 : i}`;
    tick.position.set(
      Math.sin(angle) * tickRadius,
      CENTER_Y + Math.cos(angle) * tickRadius,
      DIAL_Z + tickDepth / 2 - 0.0005
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // 3. Hour hand (pointing ~10 o'clock)
  const hourLen = 0.068;
  const hourTail = 0.018;
  const hourGeo = new THREE.BoxGeometry(0.0045, hourLen + hourTail, 0.0015);
  hourGeo.translate(0, (hourLen - hourTail) / 2, 0);
  const hourHand = new THREE.Mesh(hourGeo, handBlackMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, CENTER_Y, DIAL_Z + 0.004);
  hourHand.rotation.z = (55 * Math.PI) / 180;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // 4. Minute hand (pointing ~2 o'clock)
  const minLen = 0.092;
  const minTail = 0.02;
  const minGeo = new THREE.BoxGeometry(0.0036, minLen + minTail, 0.0015);
  minGeo.translate(0, (minLen - minTail) / 2, 0);
  const minHand = new THREE.Mesh(minGeo, handBlackMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, CENTER_Y, DIAL_Z + 0.006);
  minHand.rotation.z = (-55 * Math.PI) / 180;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // 5. Second hand (thin brass, pointing ~7 o'clock)
  const secLen = 0.088;
  const secTail = 0.026;
  const secGeo = new THREE.BoxGeometry(0.0016, secLen + secTail, 0.001);
  secGeo.translate(0, (secLen - secTail) / 2, 0);
  const secHand = new THREE.Mesh(secGeo, brassMat);
  secHand.name = 'second_hand';
  secHand.position.set(0, CENTER_Y, DIAL_Z + 0.0078);
  secHand.rotation.z = (145 * Math.PI) / 180;
  secHand.castShadow = true;
  secHand.receiveShadow = true;
  group.add(secHand);

  // 6. Center cap
  const capGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 0.0095, 16);
  capGeo.rotateX(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, brassMat);
  capMesh.name = 'center_cap';
  capMesh.position.set(0, CENTER_Y, DIAL_Z + 0.0045);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
