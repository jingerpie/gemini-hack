function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.34;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.055;
  const HALF_D = DEPTH / 2;
  const CENTER_Y = RADIUS;

  const DIAL_R = RADIUS * 0.78;
  const BEZEL_R = DIAL_R + 0.003;
  const BEZEL_TUBE = 0.0065;
  const TICK_R = DIAL_R * 0.88;
  const TICK_LEN = 0.014;
  const TICK_W = 0.0045;
  const TICK_D = 0.0015;

  const DIAL_Z = 0.002;
  const TICK_Z = DIAL_Z + 0.001;
  const HOUR_HAND_Z = TICK_Z + 0.003;
  const MIN_HAND_Z = HOUR_HAND_Z + 0.0025;
  const GLASS_Z = HALF_D - 0.006;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7a4b2a,
    roughness: 0.55,
    metalness: 0.05,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x3b2618,
    roughness: 0.8,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb59b5c,
    roughness: 0.28,
    metalness: 0.85,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede1,
    roughness: 0.72,
    metalness: 0.02,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x5c5328,
    roughness: 0.35,
    metalness: 0.55,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
    roughness: 0.05,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  // 1. Wood outer frame (LatheGeometry revolved around Y, rotated to Z)
  const framePts = [
    new THREE.Vector2(DIAL_R, -HALF_D),
    new THREE.Vector2(RADIUS - 0.004, -HALF_D),
    new THREE.Vector2(RADIUS, -HALF_D + 0.012),
    new THREE.Vector2(RADIUS, 0.0),
    new THREE.Vector2(RADIUS - 0.006, HALF_D * 0.65),
    new THREE.Vector2(RADIUS - 0.018, HALF_D),
    new THREE.Vector2(BEZEL_R + 0.004, HALF_D),
    new THREE.Vector2(BEZEL_R, HALF_D - 0.008),
    new THREE.Vector2(DIAL_R, DIAL_Z),
  ];
  const frameGeo = new THREE.LatheGeometry(framePts, 32);
  const woodFrame = new THREE.Mesh(frameGeo, woodMat);
  woodFrame.name = "wood_frame";
  woodFrame.rotation.x = Math.PI / 2;
  woodFrame.position.set(0, CENTER_Y, 0);
  woodFrame.castShadow = true;
  woodFrame.receiveShadow = true;
  group.add(woodFrame);

  // 2. Flat backplate lying on z = -HALF_D
  const backGeo = new THREE.CylinderGeometry(RADIUS - 0.004, RADIUS - 0.004, 0.004, 32);
  const backPlate = new THREE.Mesh(backGeo, backMat);
  backPlate.name = "back_plate";
  backPlate.rotation.x = Math.PI / 2;
  backPlate.position.set(0, CENTER_Y, -HALF_D + 0.002);
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);

  // 3. Brass inner bezel
  const bezelGeo = new THREE.TorusGeometry(BEZEL_R, BEZEL_TUBE, 16, 32);
  const brassBezel = new THREE.Mesh(bezelGeo, brassMat);
  brassBezel.name = "brass_bezel";
  brassBezel.scale.set(1, 1, 1.35);
  brassBezel.position.set(0, CENTER_Y, HALF_D - 0.01);
  brassBezel.castShadow = true;
  brassBezel.receiveShadow = true;
  group.add(brassBezel);

  // 4. Cream dial face
  const dialGeo = new THREE.CylinderGeometry(DIAL_R + 0.002, DIAL_R + 0.002, 0.004, 32);
  const dialFace = new THREE.Mesh(dialGeo, dialMat);
  dialFace.name = "dial_face";
  dialFace.rotation.x = Math.PI / 2;
  dialFace.position.set(0, CENTER_Y, DIAL_Z - 0.002);
  dialFace.castShadow = true;
  dialFace.receiveShadow = true;
  group.add(dialFace);

  // 5. 12 Hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_LEN, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, handMat);
    tick.name = `hour_tick_${i}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      CENTER_Y + Math.cos(angle) * TICK_R,
      TICK_Z
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // 6. Hour hand (pointing ~10 o'clock)
  const hourLen = DIAL_R * 0.58;
  const hourTail = 0.022;
  const hourGeo = new THREE.BoxGeometry(0.006, hourLen + hourTail, 0.0018);
  hourGeo.translate(0, (hourLen - hourTail) / 2, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = "hour_hand";
  hourHand.position.set(0, CENTER_Y, HOUR_HAND_Z);
  hourHand.rotation.z = (Math.PI * 2) / 6; // 10 o'clock (60 deg CCW from 12)
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // 7. Minute hand (pointing ~1:50 / 2 o'clock)
  const minLen = DIAL_R * 0.82;
  const minTail = 0.026;
  const minGeo = new THREE.BoxGeometry(0.0045, minLen + minTail, 0.0018);
  minGeo.translate(0, (minLen - minTail) / 2, 0);
  const minuteHand = new THREE.Mesh(minGeo, handMat);
  minuteHand.name = "minute_hand";
  minuteHand.position.set(0, CENTER_Y, MIN_HAND_Z);
  minuteHand.rotation.z = -Math.PI / 3.1; // ~2 o'clock
  minuteHand.castShadow = true;
  minuteHand.receiveShadow = true;
  group.add(minuteHand);

  // 8. Center cap
  const capGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.005, 16);
  const centerCap = new THREE.Mesh(capGeo, handMat);
  centerCap.name = "center_cap";
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.set(0, CENTER_Y, MIN_HAND_Z + 0.0015);
  centerCap.castShadow = true;
  centerCap.receiveShadow = true;
  group.add(centerCap);

  // 9. Glass cover
  const glassGeo = new THREE.CylinderGeometry(DIAL_R + 0.001, DIAL_R + 0.001, 0.002, 32);
  const glassCover = new THREE.Mesh(glassGeo, glassMat);
  glassCover.name = "glass_cover";
  glassCover.rotation.x = Math.PI / 2;
  glassCover.position.set(0, CENTER_Y, GLASS_Z);
  glassCover.castShadow = true;
  glassCover.receiveShadow = true;
  group.add(glassCover);

  return group;
}
