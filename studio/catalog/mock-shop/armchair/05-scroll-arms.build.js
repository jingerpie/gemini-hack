function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.68;       // overall width
  const D = 0.72;       // overall depth
  const H = 0.96;       // overall height
  const SEAT_H = 0.45;  // top of seat cushion
  const SEAT_W = 0.54;
  const SEAT_D = 0.52;
  const LEG_R = 0.024;
  const BACK_TILT = 0.14; // radians backward tilt

  const halfW = SEAT_W / 2;
  const frontZ = SEAT_D / 2;
  const backZ = -SEAT_D / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5e3a20,
    roughness: 0.42,
    metalness: 0.05
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xede6d8,
    roughness: 0.88,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Front Cabriole Legs
  for (const side of [-1, 1]) {
    const x = side * halfW;
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.015, frontZ + 0.01),
      new THREE.Vector3(x + side * 0.01, 0.06, frontZ + 0.025),
      new THREE.Vector3(x + side * 0.005, 0.18, frontZ - 0.015),
      new THREE.Vector3(x, 0.31, frontZ + 0.015),
      new THREE.Vector3(x, SEAT_H - 0.07, frontZ)
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 20, LEG_R, 12, false);
    addMesh(legGeo, woodMat, side < 0 ? 'front_left_leg' : 'front_right_leg');

    // Small tapered foot at y=0
    const footGeo = new THREE.CylinderGeometry(LEG_R * 0.85, LEG_R * 0.55, 0.03, 12);
    const foot = addMesh(footGeo, woodMat, side < 0 ? 'front_left_foot' : 'front_right_foot');
    foot.position.set(x, 0.015, frontZ + 0.01);

    // Carved knee block where leg meets seat rail
    const kneeGeo = new THREE.BoxGeometry(0.062, 0.075, 0.062);
    const knee = addMesh(kneeGeo, woodMat, side < 0 ? 'front_left_knee' : 'front_right_knee');
    knee.position.set(x, SEAT_H - 0.07, frontZ);
  }

  // 2. Rear Splayed Legs
  for (const side of [-1, 1]) {
    const x = side * (halfW - 0.015);
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.01, backZ - 0.06),
      new THREE.Vector3(x, 0.18, backZ - 0.03),
      new THREE.Vector3(x, SEAT_H - 0.06, backZ)
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 14, LEG_R * 0.9, 12, false);
    addMesh(legGeo, woodMat, side < 0 ? 'rear_left_leg' : 'rear_right_leg');

    const footGeo = new THREE.CylinderGeometry(LEG_R * 0.8, LEG_R * 0.6, 0.02, 12);
    const foot = addMesh(footGeo, woodMat, side < 0 ? 'rear_left_foot' : 'rear_right_foot');
    foot.position.set(x, 0.01, backZ - 0.06);
  }

  // 3. Seat Apron Rails
  const railY = SEAT_H - 0.075;
  // Front curved apron
  const frontApronCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-halfW, railY, frontZ),
    new THREE.Vector3(-halfW * 0.5, railY - 0.018, frontZ + 0.015),
    new THREE.Vector3(0, railY - 0.022, frontZ + 0.02),
    new THREE.Vector3(halfW * 0.5, railY - 0.018, frontZ + 0.015),
    new THREE.Vector3(halfW, railY, frontZ)
  ]);
  addMesh(new THREE.TubeGeometry(frontApronCurve, 20, 0.022, 10, false), woodMat, 'front_apron');

  // Side aprons
  for (const side of [-1, 1]) {
    const x = side * (halfW - 0.005);
    const sideApronCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, railY, frontZ),
      new THREE.Vector3(x, railY - 0.008, 0),
      new THREE.Vector3(x, railY, backZ)
    ]);
    addMesh(
      new THREE.TubeGeometry(sideApronCurve, 12, 0.021, 10, false),
      woodMat,
      side < 0 ? 'left_apron' : 'right_apron'
    );
  }

  // Rear apron
  const rearApronGeo = new THREE.CylinderGeometry(0.02, 0.02, SEAT_W - 0.03, 10);
  rearApronGeo.rotateZ(Math.PI / 2);
  const rearApron = addMesh(rearApronGeo, woodMat, 'rear_apron');
  rearApron.position.set(0, railY, backZ);

  // 4. Seat Cushion (beveled rounded shape)
  const seatShape = new THREE.Shape();
  const sw = (SEAT_W - 0.03) / 2;
  const sd = (SEAT_D - 0.02) / 2;
  const cr = 0.04;
  seatShape.moveTo(-sw + cr, -sd);
  seatShape.lineTo(sw - cr, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + cr);
  seatShape.lineTo(sw, sd - cr);
  seatShape.quadraticCurveTo(sw, sd, sw - cr, sd);
  seatShape.lineTo(-sw + cr, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - cr);
  seatShape.lineTo(-sw, -sd + cr);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + cr, -sd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.065,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.018,
    bevelSegments: 4
  });
  seatGeo.rotateX(Math.PI / 2);
  const seat = addMesh(seatGeo, fabricMat, 'seat_cushion');
  seat.position.set(0, SEAT_H, 0.005);

  // 5. Backrest Frame & Cushion
  const backGroup = new THREE.Group();
  backGroup.position.set(0, SEAT_H - 0.05, backZ);
  backGroup.rotation.x = -BACK_TILT;
  group.add(backGroup);

  const backH = H - SEAT_H + 0.05;
  const backW = SEAT_W - 0.03;

  // Backrest cushion
  const backCushionGeo = new THREE.BoxGeometry(backW - 0.04, backH - 0.06, 0.075);
  const backCushion = new THREE.Mesh(backCushionGeo, fabricMat);
  backCushion.name = 'backrest_cushion';
  backCushion.position.set(0, backH / 2, 0.01);
  backCushion.castShadow = true;
  backCushion.receiveShadow = true;
  backGroup.add(backCushion);

  // Top rounded crown of backrest cushion
  const topCrownGeo = new THREE.CylinderGeometry(0.037, 0.037, backW - 0.04, 16);
  topCrownGeo.rotateZ(Math.PI / 2);
  const topCrown = new THREE.Mesh(topCrownGeo, fabricMat);
  topCrown.name = 'backrest_top_crown';
  topCrown.position.set(0, backH - 0.03, 0.01);
  topCrown.castShadow = true;
  topCrown.receiveShadow = true;
  backGroup.add(topCrown);

  // Wooden backrest side stiles with subtle top scroll
  for (const side of [-1, 1]) {
    const sx = side * (backW / 2 - 0.005);
    const stileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0, 0),
      new THREE.Vector3(sx, backH * 0.5, 0),
      new THREE.Vector3(sx, backH - 0.02, -0.005),
      new THREE.Vector3(sx, backH + 0.005, -0.022)
    ]);
    const stileGeo = new THREE.TubeGeometry(stileCurve, 16, 0.022, 10, false);
    const stile = new THREE.Mesh(stileGeo, woodMat);
    stile.name = side < 0 ? 'backrest_left_stile' : 'backrest_right_stile';
    stile.castShadow = true;
    stile.receiveShadow = true;
    backGroup.add(stile);

    // Small scroll rosette at top of stile
    const tipGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.035, 12);
    tipGeo.rotateZ(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, woodMat);
    tip.name = side < 0 ? 'backrest_left_scroll_tip' : 'backrest_right_scroll_tip';
    tip.position.set(sx, backH + 0.005, -0.022);
    tip.castShadow = true;
    tip.receiveShadow = true;
    backGroup.add(tip);
  }

  // 6. Scroll Arms & Upholstered Arm Pads
  for (const side of [-1, 1]) {
    const armX = side * (halfW + 0.015);
    const armTopY = SEAT_H + 0.21;

    // Dramatic front scroll volute + sweeping arm rail to backrest
    const armCurve = new THREE.CatmullRomCurve3([
      // Spiral center of the scroll
      new THREE.Vector3(armX, SEAT_H + 0.075, frontZ - 0.015),
      new THREE.Vector3(armX, SEAT_H + 0.045, frontZ + 0.025),
      new THREE.Vector3(armX, SEAT_H + 0.11, frontZ + 0.065),
      new THREE.Vector3(armX, armTopY - 0.01, frontZ + 0.03),
      // Top of scroll curving back into arm rail
      new THREE.Vector3(armX, armTopY, frontZ - 0.04),
      new THREE.Vector3(armX, armTopY - 0.01, 0),
      new THREE.Vector3(armX - side * 0.015, armTopY + 0.01, backZ + 0.03)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 32, 0.025, 12, false);
    addMesh(armGeo, woodMat, side < 0 ? 'left_scroll_arm' : 'right_scroll_arm');

    // Scroll volute center boss
    const bossGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.052, 16);
    bossGeo.rotateZ(Math.PI / 2);
    const boss = addMesh(bossGeo, woodMat, side < 0 ? 'left_scroll_boss' : 'right_scroll_boss');
    boss.position.set(armX, SEAT_H + 0.075, frontZ - 0.015);

    // Arm support post connecting knee to scroll
    const postCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * halfW, SEAT_H - 0.04, frontZ),
      new THREE.Vector3(armX, SEAT_H + 0.03, frontZ + 0.01)
    ]);
    addMesh(
      new THREE.TubeGeometry(postCurve, 8, 0.022, 10, false),
      woodMat,
      side < 0 ? 'left_arm_post' : 'right_arm_post'
    );

    // Upholstered arm pad (manchette)
    const padGeo = new THREE.CapsuleGeometry(0.028, 0.20, 8, 12);
    padGeo.rotateX(Math.PI / 2);
    padGeo.scale(1.1, 0.72, 1.0);
    const pad = addMesh(padGeo, fabricMat, side < 0 ? 'left_arm_pad' : 'right_arm_pad');
    pad.position.set(armX, armTopY + 0.015, 0.02);
  }

  return group;
}
