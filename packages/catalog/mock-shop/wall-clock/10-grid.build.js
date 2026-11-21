function build(THREE) {
  const group = new THREE.Group();

  const W = 0.28;
  const H = 0.28;
  const D = 0.045;
  const FRAME_T = 0.018;
  const R_OUTER = 0.028;
  const R_INNER = 0.016;
  const DIAL_T = 0.022;
  const DIAL_Z = -D / 2 + DIAL_T;

  const TICK_R = 0.095;
  const TICK_W = 0.0035;
  const TICK_L = 0.016;
  const TICK_D = 0.002;

  const HAND_W = 0.0045;
  const HAND_D = 0.002;
  const HOUR_L = 0.072;
  const HOUR_TAIL = 0.016;
  const MIN_L = 0.102;
  const MIN_TAIL = 0.018;
  const CAP_R = 0.0055;
  const CAP_D = 0.004;

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x7d848a,
    roughness: 0.65,
    metalness: 0.05
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0x757c82,
    roughness: 0.72,
    metalness: 0.04
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xe6e5df,
    roughness: 0.45,
    metalness: 0.05
  });

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  // Outer frame/bezel
  const frameShape = createRoundedRectShape(W, H, R_OUTER);
  const innerHole = createRoundedRectShape(W - 2 * FRAME_T, H - 2 * FRAME_T, R_INNER);
  frameShape.holes.push(innerHole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: D,
    bevelEnabled: false,
    curveSegments: 16
  });
  const frameMesh = new THREE.Mesh(frameGeo, caseMat);
  frameMesh.name = 'clock_frame';
  frameMesh.position.set(0, H / 2, -D / 2);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // Back & dial plate
  const dialShape = createRoundedRectShape(W - 0.004, H - 0.004, R_OUTER - 0.002);
  const dialGeo = new THREE.ExtrudeGeometry(dialShape, {
    depth: DIAL_T,
    bevelEnabled: false,
    curveSegments: 12
  });
  const dialMesh = new THREE.Mesh(dialGeo, dialMat);
  dialMesh.name = 'clock_dial';
  dialMesh.position.set(0, H / 2, -D / 2);
  dialMesh.castShadow = true;
  dialMesh.receiveShadow = true;
  group.add(dialMesh);

  // 12 hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_W, TICK_L, TICK_D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, handMat);
    tick.name = `hour_tick_${i + 1}`;
    tick.position.set(
      Math.sin(angle) * TICK_R,
      H / 2 + Math.cos(angle) * TICK_R,
      DIAL_Z + TICK_D / 2
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // Hour hand (pointing to ~10:10)
  const hourAngle = (10.16 / 12) * Math.PI * 2;
  const hourGeo = new THREE.BoxGeometry(HAND_W, HOUR_L + HOUR_TAIL, HAND_D);
  hourGeo.translate(0, (HOUR_L - HOUR_TAIL) / 2, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = 'hour_hand';
  hourHand.position.set(0, H / 2, DIAL_Z + TICK_D + HAND_D / 2);
  hourHand.rotation.z = -hourAngle;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  group.add(hourHand);

  // Minute hand (pointing to ~2)
  const minAngle = (10 / 60) * Math.PI * 2;
  const minGeo = new THREE.BoxGeometry(HAND_W * 0.85, MIN_L + MIN_TAIL, HAND_D);
  minGeo.translate(0, (MIN_L - MIN_TAIL) / 2, 0);
  const minHand = new THREE.Mesh(minGeo, handMat);
  minHand.name = 'minute_hand';
  minHand.position.set(0, H / 2, DIAL_Z + TICK_D + HAND_D * 1.8);
  minHand.rotation.z = -minAngle;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  group.add(minHand);

  // Center pin cap
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_D, 16);
  capGeo.rotateX(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, handMat);
  capMesh.name = 'center_cap';
  capMesh.position.set(0, H / 2, DIAL_Z + TICK_D + HAND_D * 2.5);
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}
