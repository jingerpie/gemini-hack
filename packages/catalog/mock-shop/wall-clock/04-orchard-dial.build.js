function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.035;
  const CHAMFER = 0.003;
  const INNER_RING_R = RADIUS * 0.58;
  const TICK_R = RADIUS * 0.78;
  const TICK_W = 0.004;
  const TICK_H = 0.016;
  const TICK_D = 0.0015;
  const HOUR_LEN = RADIUS * 0.48;
  const MIN_LEN = RADIUS * 0.72;
  const HAND_W = 0.007;
  const HAND_D = 0.002;
  const CAP_R = 0.0065;
  const CAP_D = 0.007;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc89d66,
    roughness: 0.65,
    metalness: 0.02,
  });

  const darkEngraveMat = new THREE.MeshStandardMaterial({
    color: 0x3b2414,
    roughness: 0.8,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9ea2a6,
    roughness: 0.35,
    metalness: 0.75,
  });

  // Main wooden body (flat back at z = -DEPTH/2, slightly chamfered front at z = +DEPTH/2)
  const bodyPoints = [
    new THREE.Vector2(0, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - CHAMFER),
    new THREE.Vector2(RADIUS - CHAMFER, DEPTH / 2),
    new THREE.Vector2(0, DEPTH / 2),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, woodMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.position.set(0, RADIUS, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Engraved inner circular border
  const ringGeo = new THREE.TorusGeometry(INNER_RING_R, 0.0015, 8, 32);
  const ringMesh = new THREE.Mesh(ringGeo, darkEngraveMat);
  ringMesh.name = 'inner_engraved_ring';
  ringMesh.position.set(0, RADIUS, DEPTH / 2);
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  group.add(ringMesh);

  // 12 hour tick marks as thin boxes
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_H, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, darkEngraveMat);
    tick.name = `hour_tick_${i === 0 ? 12 : i}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      RADIUS + Math.cos(angle) * TICK_R,
      DEPTH / 2 + TICK_D / 2 - 0.0005
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing toward 10 o'clock)
  const hourGeo = new THREE.BoxGeometry(HAND_W, HOUR_LEN, HAND_D);
  hourGeo.translate(0, HOUR_LEN / 2 - 0.015, 0);
  const hourHand = new THREE.Mesh(hourGeo, metalMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, RADIUS, DEPTH / 2 + HAND_D / 2 + 0.001);
  hourHand.rotation.z = Math.PI / 3;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing toward 2 o'clock)
  const minGeo = new THREE.BoxGeometry(HAND_W * 0.8, MIN_LEN, HAND_D);
  minGeo.translate(0, MIN_LEN / 2 - 0.018, 0);
  const minHand = new THREE.Mesh(minGeo, metalMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, RADIUS, DEPTH / 2 + HAND_D * 1.5 + 0.002);
  minHand.rotation.z = -Math.PI / 3;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Center cap
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_D, 16);
  capGeo.rotateX(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, metalMat);
  capMesh.name = 'center_cap';
  capMesh.position.set(0, RADIUS, DEPTH / 2 + CAP_D / 2);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
