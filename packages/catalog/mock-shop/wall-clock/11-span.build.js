function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const H = 0.21;
  const D = 0.055;
  const DIAL_R = 0.086;
  const DIAL_X = -W / 2 + H / 2;
  const DIAL_Y = H / 2;
  const RECESS_D = 0.012;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd4d8dc,
    roughness: 0.42,
    metalness: 0.35,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xdce0e3,
    roughness: 0.48,
    metalness: 0.25,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x3a3e42,
    roughness: 0.35,
    metalness: 0.4,
  });

  // Main body with circular cutout (front face at z = +D/2)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-W / 2, 0);
  bodyShape.lineTo(W / 2, 0);
  bodyShape.lineTo(W / 2, H);
  bodyShape.lineTo(-W / 2, H);
  bodyShape.closePath();

  const holePath = new THREE.Path();
  holePath.absarc(DIAL_X, DIAL_Y, DIAL_R, 0, Math.PI * 2, true);
  bodyShape.holes.push(holePath);

  const frontDepth = RECESS_D;
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: frontDepth,
    bevelEnabled: false,
    curveSegments: 32,
  });
  const frontBezel = new THREE.Mesh(bodyGeo, bodyMat);
  frontBezel.name = 'clock_front_bezel';
  frontBezel.position.set(0, 0, D / 2 - frontDepth);
  frontBezel.castShadow = true;
  frontBezel.receiveShadow = true;
  group.add(frontBezel);

  // Solid back housing (from z = -D/2 to z = D/2 - RECESS_D)
  const backDepth = D - RECESS_D;
  const backGeo = new THREE.BoxGeometry(W, H, backDepth);
  const backHousing = new THREE.Mesh(backGeo, bodyMat);
  backHousing.name = 'clock_back_housing';
  backHousing.position.set(0, H / 2, -D / 2 + backDepth / 2);
  backHousing.castShadow = true;
  backHousing.receiveShadow = true;
  group.add(backHousing);

  // Recessed dial face
  const dialZ = D / 2 - RECESS_D;
  const dialGeo = new THREE.CylinderGeometry(DIAL_R, DIAL_R, 0.002, 32);
  dialGeo.rotateX(Math.PI / 2);
  const dialFace = new THREE.Mesh(dialGeo, dialMat);
  dialFace.name = 'clock_dial_face';
  dialFace.position.set(DIAL_X, DIAL_Y, dialZ + 0.001);
  dialFace.castShadow = true;
  dialFace.receiveShadow = true;
  group.add(dialFace);

  // 12 Hour tick marks
  const tickW = 0.0016;
  const tickL = 0.011;
  const tickD = 0.0012;
  const tickR = DIAL_R - 0.004 - tickL / 2;
  const tickGeo = new THREE.BoxGeometry(tickW, tickL, tickD);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, handMat);
    tick.name = `hour_tick_${i}`;
    tick.position.set(
      DIAL_X + Math.sin(angle) * tickR,
      DIAL_Y + Math.cos(angle) * tickR,
      dialZ + 0.002 + tickD / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hands (10:10 pose)
  const handBaseZ = dialZ + 0.004;

  // Hour hand
  const hourL = DIAL_R * 0.52;
  const hourGeo = new THREE.BoxGeometry(0.0032, hourL, 0.0015);
  hourGeo.translate(0, hourL * 0.35, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(DIAL_X, DIAL_Y, handBaseZ);
  hourHand.rotation.z = (60 * Math.PI) / 180;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand
  const minL = DIAL_R * 0.76;
  const minGeo = new THREE.BoxGeometry(0.0024, minL, 0.0015);
  minGeo.translate(0, minL * 0.38, 0);
  const minuteHand = new THREE.Mesh(minGeo, handMat);
  minuteHand.name = 'minute_hand';
  minuteHand.position.set(DIAL_X, DIAL_Y, handBaseZ + 0.002);
  minuteHand.rotation.z = (-55 * Math.PI) / 180;
  minuteHand.castShadow = true;
  minuteHand.receiveShadow = true;
  group.add(minuteHand);

  // Second hand
  const secL = DIAL_R * 0.82;
  const secGeo = new THREE.BoxGeometry(0.0012, secL, 0.001);
  secGeo.translate(0, secL * 0.32, 0);
  const secondHand = new THREE.Mesh(secGeo, handMat);
  secondHand.name = 'second_hand';
  secondHand.position.set(DIAL_X, DIAL_Y, handBaseZ + 0.0035);
  secondHand.rotation.z = (150 * Math.PI) / 180;
  secondHand.castShadow = true;
  secondHand.receiveShadow = true;
  group.add(secondHand);

  // Center pin
  const pinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.005, 16);
  pinGeo.rotateX(Math.PI / 2);
  const centerPin = new THREE.Mesh(pinGeo, handMat);
  centerPin.name = 'center_pin';
  centerPin.position.set(DIAL_X, DIAL_Y, handBaseZ + 0.002);
  centerPin.castShadow = true;
  centerPin.receiveShadow = true;
  group.add(centerPin);

  return group;
}
