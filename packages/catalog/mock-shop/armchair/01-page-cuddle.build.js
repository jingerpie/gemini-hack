function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a children's reading armchair
  const W = 0.62;
  const D = 0.60;
  const H = 0.66;
  const LEG_H = 0.075;
  const BASE_H = 0.135;
  const SEAT_THICK = 0.115;
  const ARM_W = 0.095;
  const BACK_THICK = 0.12;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe29a7d,
    roughness: 0.88,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xd98e70,
    roughness: 0.85,
    metalness: 0.0
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8a47e,
    roughness: 0.55,
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

  // 1. Four tapered wooden legs
  const legGeo = new THREE.CylinderGeometry(0.024, 0.016, LEG_H + 0.01, 4);
  legGeo.rotateY(Math.PI / 4);
  const legX = W / 2 - 0.065;
  const legZFront = D / 2 - 0.065;
  const legZBack = -D / 2 + 0.075;
  const legPositions = [
    [-legX, LEG_H / 2 + 0.005, legZFront, 'leg_front_left'],
    [legX, LEG_H / 2 + 0.005, legZFront, 'leg_front_right'],
    [-legX, LEG_H / 2 + 0.005, legZBack, 'leg_back_left'],
    [legX, LEG_H / 2 + 0.005, legZBack, 'leg_back_right']
  ];
  for (const [lx, ly, lz, name] of legPositions) {
    const leg = addMesh(legGeo, woodMat, name);
    leg.position.set(lx, ly, lz);
  }

  // Helper for rounded rectangle shape
  function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  // 2. Upholstered base frame
  const baseShape = createRoundedRectShape(W - 0.02, D - 0.02, 0.04);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 4
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = addMesh(baseGeo, fabricMat, 'base_frame');
  baseMesh.position.set(0, LEG_H + 0.015, 0);

  // 3. Seat cushion
  const seatW = W - ARM_W * 2 + 0.02;
  const seatD = D - BACK_THICK + 0.02;
  const seatShape = createRoundedRectShape(seatW - 0.02, seatD - 0.02, 0.035);
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 5
  });
  seatGeo.rotateX(-Math.PI / 2);
  const seatMesh = addMesh(seatGeo, fabricMat, 'seat_cushion');
  const seatY = LEG_H + BASE_H - 0.005;
  const seatZ = (BACK_THICK - 0.02) / 2;
  seatMesh.position.set(0, seatY + 0.015, seatZ);

  // Seat cushion piping (top & bottom)
  function createCushionPiping(yPos, name) {
    const hw = seatW / 2 - 0.005;
    const hd = seatD / 2 - 0.005;
    const pts = [
      new THREE.Vector3(-hw + 0.03, yPos, seatZ + hd),
      new THREE.Vector3(hw - 0.03, yPos, seatZ + hd),
      new THREE.Vector3(hw, yPos, seatZ + hd - 0.03),
      new THREE.Vector3(hw, yPos, seatZ - hd + 0.03),
      new THREE.Vector3(hw - 0.03, yPos, seatZ - hd),
      new THREE.Vector3(-hw + 0.03, yPos, seatZ - hd),
      new THREE.Vector3(-hw, yPos, seatZ - hd + 0.03),
      new THREE.Vector3(-hw, yPos, seatZ + hd - 0.03)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.005, 8, true);
    addMesh(tubeGeo, pipingMat, name);
  }
  createCushionPiping(seatY + SEAT_THICK - 0.012, 'seat_cushion_piping_top');
  createCushionPiping(seatY + 0.012, 'seat_cushion_piping_bottom');

  // 4. Backrest (arched top, gently reclined)
  const backW = W - 0.04;
  const backH = H - LEG_H - 0.02;
  const backShape = new THREE.Shape();
  const bhw = backW / 2;
  backShape.moveTo(-bhw, 0);
  backShape.lineTo(bhw, 0);
  backShape.lineTo(bhw, backH - 0.16);
  backShape.quadraticCurveTo(bhw, backH, 0, backH);
  backShape.quadraticCurveTo(-bhw, backH, -bhw, backH - 0.16);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_THICK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 5
  });
  const backMesh = addMesh(backGeo, fabricMat, 'backrest');
  backMesh.position.set(0, LEG_H + 0.01, -D / 2 + 0.03);
  backMesh.rotation.x = -0.08;

  // Inner backrest plush pad
  const padShape = new THREE.Shape();
  const phw = (seatW + 0.02) / 2;
  const padH = backH - 0.12;
  padShape.moveTo(-phw, 0);
  padShape.lineTo(phw, 0);
  padShape.lineTo(phw, padH - 0.12);
  padShape.quadraticCurveTo(phw, padH, 0, padH);
  padShape.quadraticCurveTo(-phw, padH, -phw, padH - 0.12);
  padShape.closePath();

  const padGeo = new THREE.ExtrudeGeometry(padShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 4
  });
  const padMesh = addMesh(padGeo, fabricMat, 'backrest_pad');
  padMesh.position.set(0, LEG_H + BASE_H - 0.02, -D / 2 + BACK_THICK - 0.01);
  padMesh.rotation.x = -0.08;

  // Backrest outer piping
  const backPipePts = [
    new THREE.Vector3(-bhw - 0.01, LEG_H + 0.05, -D / 2 + 0.06),
    new THREE.Vector3(-bhw - 0.01, H - 0.17, -D / 2 + 0.02),
    new THREE.Vector3(-bhw * 0.55, H - 0.015, -D / 2 + 0.005),
    new THREE.Vector3(0, H + 0.002, -D / 2 + 0.002),
    new THREE.Vector3(bhw * 0.55, H - 0.015, -D / 2 + 0.005),
    new THREE.Vector3(bhw + 0.01, H - 0.17, -D / 2 + 0.02),
    new THREE.Vector3(bhw + 0.01, LEG_H + 0.05, -D / 2 + 0.06)
  ];
  const backPipeCurve = new THREE.CatmullRomCurve3(backPipePts, false);
  const backPipeGeo = new THREE.TubeGeometry(backPipeCurve, 32, 0.0055, 8, false);
  addMesh(backPipeGeo, pipingMat, 'backrest_piping');

  // 5. Left & Right Arms (sweeping curve from backrest to front)
  const armShape = new THREE.Shape();
  const armLen = D - 0.05;
  const armFrontH = 0.34;
  const armBackH = 0.44;
  // Side profile in XY (X = Z-depth from back to front, Y = height)
  armShape.moveTo(-armLen / 2, 0);
  armShape.lineTo(armLen / 2 - 0.04, 0);
  armShape.quadraticCurveTo(armLen / 2, 0, armLen / 2, 0.04);
  armShape.lineTo(armLen / 2, armFrontH - 0.07);
  armShape.quadraticCurveTo(armLen / 2, armFrontH, armLen / 2 - 0.12, armFrontH);
  armShape.bezierCurveTo(0.05, armFrontH, -0.05, armBackH, -armLen / 2, armBackH);
  armShape.closePath();

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 5
  });
  // Rotate so shape X aligns with +Z (front) and extrusion depth aligns with X
  armGeo.rotateY(Math.PI / 2);

  const armLeft = addMesh(armGeo, fabricMat, 'arm_left');
  armLeft.position.set(-W / 2 + 0.018, LEG_H + 0.01, 0.01);

  const armRight = addMesh(armGeo, fabricMat, 'arm_right');
  armRight.position.set(W / 2 - ARM_W + 0.012, LEG_H + 0.01, 0.01);

  // Arm front/top piping
  function createArmPiping(xPos, name) {
    const pts = [
      new THREE.Vector3(xPos, LEG_H + 0.02, D / 2 - 0.025),
      new THREE.Vector3(xPos, LEG_H + armFrontH - 0.06, D / 2 - 0.022),
      new THREE.Vector3(xPos, LEG_H + armFrontH + 0.005, D / 2 - 0.08),
      new THREE.Vector3(xPos, LEG_H + armFrontH + 0.005, 0.02),
      new THREE.Vector3(xPos, LEG_H + armBackH, -D / 2 + 0.06)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.005, 8, false);
    addMesh(tubeGeo, pipingMat, name);
  }
  createArmPiping(-W / 2 + ARM_W / 2, 'arm_piping_left');
  createArmPiping(W / 2 - ARM_W / 2, 'arm_piping_right');

  return group;
}
