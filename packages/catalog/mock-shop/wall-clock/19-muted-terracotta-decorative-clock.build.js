function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.24;
  const H = 0.30;
  const BODY_D = 0.032;
  const BEVEL = 0.003;
  const ARCH_R = W / 2;
  const STRAIGHT_H = H - ARCH_R;

  const DIAL_CENTER_Y = H * 0.48;
  const MARKER_R = 0.088;
  const DOT_R = 0.0055;
  const DOT_D = 0.002;

  const HOUR_LEN = 0.064;
  const HOUR_W = 0.0055;
  const MIN_LEN = 0.092;
  const MIN_W = 0.005;
  const SEC_LEN = 0.112;
  const SEC_W = 0.002;
  const HAND_D = 0.002;

  const CAP_R = 0.005;
  const CAP_D = 0.003;

  // Materials
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xc98368,
    roughness: 0.85,
    metalness: 0.02,
  });

  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x22303f,
    roughness: 0.5,
    metalness: 0.1,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xbec2c7,
    roughness: 0.35,
    metalness: 0.6,
  });

  // Arch body
  const archShape = new THREE.Shape();
  archShape.moveTo(-ARCH_R, 0);
  archShape.lineTo(ARCH_R, 0);
  archShape.lineTo(ARCH_R, STRAIGHT_H);
  archShape.absarc(0, STRAIGHT_H, ARCH_R, 0, Math.PI, false);
  archShape.lineTo(-ARCH_R, 0);

  const bodyGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: BODY_D - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 32,
  });
  // ExtrudeGeometry goes from z = -BEVEL to z = BODY_D - BEVEL
  bodyGeo.translate(0, BEVEL, -BODY_D / 2 + BEVEL);

  const bodyMesh = new THREE.Mesh(bodyGeo, terracottaMat);
  bodyMesh.name = 'clock_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  const frontZ = BODY_D / 2;

  // 12 Hour markers
  const dotGeo = new THREE.CylinderGeometry(DOT_R, DOT_R, DOT_D, 16);
  dotGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dot = new THREE.Mesh(dotGeo, navyMat);
    dot.name = `hour_marker_${i === 0 ? 12 : i}`;
    dot.position.set(
      Math.sin(angle) * MARKER_R,
      DIAL_CENTER_Y + Math.cos(angle) * MARKER_R,
      frontZ + DOT_D / 2
    );
    dot.castShadow = true;
    dot.receiveShadow = true;
    group.add(dot);
  }

  // Hour hand (pointing ~10 o'clock: +60 deg CCW from +Y)
  const hourGeo = new THREE.BoxGeometry(HOUR_W, HOUR_LEN, HAND_D);
  hourGeo.translate(0, HOUR_LEN / 2 - 0.008, 0);
  const hourHand = new THREE.Mesh(hourGeo, navyMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, DIAL_CENTER_Y, frontZ + HAND_D * 1.2);
  hourHand.rotation.z = Math.PI / 3;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing ~2 o'clock: -55 deg CW from +Y)
  const minGeo = new THREE.BoxGeometry(MIN_W, MIN_LEN, HAND_D);
  minGeo.translate(0, MIN_LEN / 2 - 0.01, 0);
  const minHand = new THREE.Mesh(minGeo, navyMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, DIAL_CENTER_Y, frontZ + HAND_D * 2.4);
  minHand.rotation.z = -Math.PI * 0.3;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Second hand (pointing straight down to 6 o'clock with short top tail)
  const secGeo = new THREE.BoxGeometry(SEC_W, SEC_LEN, HAND_D * 0.8);
  secGeo.translate(0, -SEC_LEN / 2 + 0.022, 0);
  const secHand = new THREE.Mesh(secGeo, silverMat);
  secHand.name = 'second_hand';
  secHand.position.set(0, DIAL_CENTER_Y, frontZ + HAND_D * 3.5);
  secHand.castShadow = true;
  secHand.receiveShadow = true;
  group.add(secHand);

  // Center cap
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_D, 16);
  capGeo.rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, silverMat);
  cap.name = 'center_cap';
  cap.position.set(0, DIAL_CENTER_Y, frontZ + HAND_D * 4.2);
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  return group;
}
