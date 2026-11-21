function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.0;          // Total width
  const D = 0.95;         // Total depth
  const H = 0.85;         // Total height (top of back cushions)
  const LEG_H = 0.04;     // Leg height
  const LEG_W = 0.07;     // Leg width/depth
  const ARM_W = 0.20;     // Armrest width
  const ARM_H = 0.62;     // Armrest height from floor
  const BASE_H = 0.22;    // Lower base height above legs
  const SEAT_H = 0.17;    // Seat cushion thickness
  const BACK_FRAME_H = 0.68; // Backrest frame height from floor
  const BACK_FRAME_T = 0.14; // Backrest frame thickness
  const CUSHION_GAP = 0.015; // Small gap between left/right cushions

  const INNER_W = W - ARM_W * 2;
  const CUSHION_W = (INNER_W - CUSHION_GAP) / 2;
  const SEAT_D = D - BACK_FRAME_T;
  const SEAT_Y = LEG_H + BASE_H;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc69674,
    roughness: 0.92,
    metalness: 0.0
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2b1e16,
    roughness: 0.6,
    metalness: 0.05
  });

  // Helper to create rounded box via ExtrudeGeometry
  function createRoundedBox(width, height, depth, radius, segments) {
    const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001);
    const w = width - r * 2;
    const h = height - r * 2;
    const d = depth - r * 2;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: segments || 4
    });
    geo.center();
    return geo;
  }

  // 1. Legs (4 corners)
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legOffsetX = W / 2 - LEG_W / 2 - 0.04;
  const legOffsetZ = D / 2 - LEG_W / 2 - 0.04;
  const legPositions = [
    { name: 'leg_fl', x: -legOffsetX, z: legOffsetZ },
    { name: 'leg_fr', x: legOffsetX, z: legOffsetZ },
    { name: 'leg_bl', x: -legOffsetX, z: -legOffsetZ },
    { name: 'leg_br', x: legOffsetX, z: -legOffsetZ }
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.name = pos.name;
    leg.position.set(pos.x, LEG_H / 2, pos.z);
    group.add(leg);
  });

  // 2. Base frame (between arms, above legs)
  const baseGeo = new THREE.BoxGeometry(INNER_W + 0.02, BASE_H, D - 0.02);
  const baseFrame = new THREE.Mesh(baseGeo, fabricMat);
  baseFrame.name = 'base_frame';
  baseFrame.position.set(0, LEG_H + BASE_H / 2, 0);
  group.add(baseFrame);

  // 3. Back frame (behind cushions)
  const backFrameH = BACK_FRAME_H - LEG_H;
  const backFrameGeo = new THREE.BoxGeometry(INNER_W + 0.02, backFrameH, BACK_FRAME_T);
  const backFrame = new THREE.Mesh(backFrameGeo, fabricMat);
  backFrame.name = 'back_frame';
  backFrame.position.set(0, LEG_H + backFrameH / 2, -D / 2 + BACK_FRAME_T / 2);
  group.add(backFrame);

  // 4. Armrests (left and right)
  const armH = ARM_H - LEG_H;
  const armGeo = createRoundedBox(ARM_W, armH, D, 0.025, 4);
  const armX = W / 2 - ARM_W / 2;

  const armLeft = new THREE.Mesh(armGeo, fabricMat);
  armLeft.name = 'arm_left';
  armLeft.position.set(-armX, LEG_H + armH / 2, 0);
  group.add(armLeft);

  const armRight = new THREE.Mesh(armGeo, fabricMat);
  armRight.name = 'arm_right';
  armRight.position.set(armX, LEG_H + armH / 2, 0);
  group.add(armRight);

  // 5. Seat cushions (left and right)
  const seatGeo = createRoundedBox(CUSHION_W, SEAT_H, SEAT_D, 0.035, 5);
  const cushionX = CUSHION_W / 2 + CUSHION_GAP / 2;
  const seatZ = BACK_FRAME_T / 2;

  const seatLeft = new THREE.Mesh(seatGeo, fabricMat);
  seatLeft.name = 'seat_cushion_left';
  seatLeft.position.set(-cushionX, SEAT_Y + SEAT_H / 2 - 0.01, seatZ);
  group.add(seatLeft);

  const seatRight = new THREE.Mesh(seatGeo, fabricMat);
  seatRight.name = 'seat_cushion_right';
  seatRight.position.set(cushionX, SEAT_Y + SEAT_H / 2 - 0.01, seatZ);
  group.add(seatRight);

  // 6. Back cushions (left and right)
  const backCushionH = H - (SEAT_Y + SEAT_H) + 0.04;
  const backCushionD = 0.22;
  const backCushionGeo = createRoundedBox(CUSHION_W, backCushionH, backCushionD, 0.045, 5);
  const backCushionY = SEAT_Y + SEAT_H + backCushionH / 2 - 0.03;
  const backCushionZ = -D / 2 + BACK_FRAME_T + backCushionD / 2 - 0.02;

  const backLeft = new THREE.Mesh(backCushionGeo, fabricMat);
  backLeft.name = 'back_cushion_left';
  backLeft.position.set(-cushionX, backCushionY, backCushionZ);
  backLeft.rotation.x = -0.10;
  group.add(backLeft);

  const backRight = new THREE.Mesh(backCushionGeo, fabricMat);
  backRight.name = 'back_cushion_right';
  backRight.position.set(cushionX, backCushionY, backCushionZ);
  backRight.rotation.x = -0.10;
  group.add(backRight);

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
