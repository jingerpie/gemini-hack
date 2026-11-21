function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.50;
  const H = 0.88;
  const D = 0.92;

  const LEG_H = 0.16;
  const LEG_TOP_R = 0.032;
  const LEG_BOT_R = 0.020;

  const DECK_H = 0.13;
  const SEAT_H = 0.15;
  const ARM_W = 0.16;
  const ARM_H = 0.62;
  const BACK_THICK = 0.16;
  const BACK_FRAME_H = 0.78;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xc2b7a6,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa48363,
    roughness: 0.55,
    metalness: 0.0,
  });

  // Helper to create a rounded box using ExtrudeGeometry
  function createRoundedBox(w, h, d, radius, bevelSegs = 4) {
    const r = Math.min(radius, w * 0.45, h * 0.45, d * 0.45);
    const iw = w - 2 * r;
    const ih = h - 2 * r;
    const id = d - 2 * r;
    const shape = new THREE.Shape();
    shape.moveTo(-iw / 2, -ih / 2);
    shape.lineTo(iw / 2, -ih / 2);
    shape.lineTo(iw / 2, ih / 2);
    shape.lineTo(-iw / 2, ih / 2);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: id,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: bevelSegs,
    });
    geo.center();
    return geo;
  }

  // 1. Four tapered wooden legs
  const legGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, LEG_H, 16);
  const legPositions = [
    { name: 'leg_fl', x: -W / 2 + 0.07, z: D / 2 - 0.08 },
    { name: 'leg_fr', x: W / 2 - 0.07, z: D / 2 - 0.08 },
    { name: 'leg_bl', x: -W / 2 + 0.07, z: -D / 2 + 0.08 },
    { name: 'leg_br', x: W / 2 - 0.07, z: -D / 2 + 0.08 },
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.name = pos.name;
    leg.position.set(pos.x, LEG_H / 2, pos.z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  });

  // 2. Upholstered lower deck / apron
  const deckGeo = createRoundedBox(W - 0.02, DECK_H, D - 0.04, 0.025, 3);
  const deck = new THREE.Mesh(deckGeo, linenMat);
  deck.name = 'deck_base';
  deck.position.set(0, LEG_H + DECK_H / 2, 0);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // 3. Single plush bench seat cushion
  const seatGeo = createRoundedBox(W - 0.01, SEAT_H, D - 0.03, 0.045, 5);
  const seat = new THREE.Mesh(seatGeo, linenMat);
  seat.name = 'seat_cushion';
  seat.position.set(0, LEG_H + DECK_H + SEAT_H / 2 - 0.005, 0.015);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // 4. Upholstered arms (left & right)
  const armHeightAboveDeck = ARM_H - (LEG_H + DECK_H);
  const armGeo = createRoundedBox(ARM_W, armHeightAboveDeck, D - 0.06, 0.055, 5);

  const armLeft = new THREE.Mesh(armGeo, linenMat);
  armLeft.name = 'arm_left';
  armLeft.position.set(-W / 2 + ARM_W / 2, LEG_H + DECK_H + armHeightAboveDeck / 2 - 0.01, -0.02);
  armLeft.castShadow = true;
  armLeft.receiveShadow = true;
  group.add(armLeft);

  const armRight = new THREE.Mesh(armGeo, linenMat);
  armRight.name = 'arm_right';
  armRight.position.set(W / 2 - ARM_W / 2, LEG_H + DECK_H + armHeightAboveDeck / 2 - 0.01, -0.02);
  armRight.castShadow = true;
  armRight.receiveShadow = true;
  group.add(armRight);

  // 5. Wooden front arm trim panels
  const trimW = 0.055;
  const trimH = 0.14;
  const trimD = 0.025;
  const trimGeo = createRoundedBox(trimW, trimH, trimD, 0.006, 2);

  const trimLeft = new THREE.Mesh(trimGeo, woodMat);
  trimLeft.name = 'arm_trim_left';
  trimLeft.position.set(-W / 2 + trimW / 2 + 0.015, LEG_H + DECK_H + SEAT_H + trimH / 2 - 0.04, D / 2 - 0.055);
  trimLeft.castShadow = true;
  trimLeft.receiveShadow = true;
  group.add(trimLeft);

  const trimRight = new THREE.Mesh(trimGeo, woodMat);
  trimRight.name = 'arm_trim_right';
  trimRight.position.set(W / 2 - trimW / 2 - 0.015, LEG_H + DECK_H + SEAT_H + trimH / 2 - 0.04, D / 2 - 0.055);
  trimRight.castShadow = true;
  trimRight.receiveShadow = true;
  group.add(trimRight);

  // 6. Upholstered backrest frame
  const backFrameH = BACK_FRAME_H - (LEG_H + DECK_H);
  const backFrameGeo = createRoundedBox(W - 0.04, backFrameH, BACK_THICK, 0.035, 3);
  const backFrame = new THREE.Mesh(backFrameGeo, linenMat);
  backFrame.name = 'back_frame';
  backFrame.position.set(0, LEG_H + DECK_H + backFrameH / 2 - 0.01, -D / 2 + BACK_THICK / 2 + 0.02);
  backFrame.castShadow = true;
  backFrame.receiveShadow = true;
  group.add(backFrame);

  // 7. Two plush back cushions
  const innerW = W - 2 * ARM_W;
  const backCushionW = innerW / 2 - 0.01;
  const backCushionH = H - (LEG_H + DECK_H + SEAT_H) + 0.03;
  const backCushionD = 0.18;
  const backCushionGeo = createRoundedBox(backCushionW, backCushionH, backCushionD, 0.055, 5);

  const backCushionLeft = new THREE.Mesh(backCushionGeo, linenMat);
  backCushionLeft.name = 'back_cushion_left';
  backCushionLeft.position.set(
    -backCushionW / 2 - 0.005,
    LEG_H + DECK_H + SEAT_H + backCushionH / 2 - 0.03,
    -D / 2 + BACK_THICK + backCushionD / 2 - 0.01
  );
  backCushionLeft.rotation.x = -0.14;
  backCushionLeft.castShadow = true;
  backCushionLeft.receiveShadow = true;
  group.add(backCushionLeft);

  const backCushionRight = new THREE.Mesh(backCushionGeo, linenMat);
  backCushionRight.name = 'back_cushion_right';
  backCushionRight.position.set(
    backCushionW / 2 + 0.005,
    LEG_H + DECK_H + SEAT_H + backCushionH / 2 - 0.03,
    -D / 2 + BACK_THICK + backCushionD / 2 - 0.01
  );
  backCushionRight.rotation.x = -0.14;
  backCushionRight.castShadow = true;
  backCushionRight.receiveShadow = true;
  group.add(backCushionRight);

  return group;
}
