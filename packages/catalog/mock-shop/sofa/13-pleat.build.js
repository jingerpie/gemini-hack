function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 2.20;
  const D = 0.94;
  const H = 0.80;

  const LEG_H = 0.045;
  const LEG_W = 0.11;
  const LEG_D = 0.11;
  const LEG_INSET = 0.015;

  const ARM_W = 0.16;
  const ARM_H = 0.60;
  const INNER_W = W - 2 * ARM_W;

  const BASE_H = 0.23;
  const BASE_TOP_Y = LEG_H + BASE_H;

  const BACK_FRAME_D = 0.16;
  const BACK_FRAME_H = 0.68;

  const SEAT_CUSHION_W = (INNER_W - 0.015) / 2;
  const SEAT_CUSHION_H = 0.155;
  const SEAT_CUSHION_D = D - BACK_FRAME_D - 0.01;
  const SEAT_TOP_Y = BASE_TOP_Y + SEAT_CUSHION_H;

  const BACK_CUSHION_W = SEAT_CUSHION_W;
  const BACK_CUSHION_H = H - SEAT_TOP_Y + 0.02;
  const BACK_CUSHION_D = 0.18;

  // Shared materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d6,
    roughness: 0.88,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xdfd8cb,
    roughness: 0.85,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8966e,
    roughness: 0.6,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded rectangle shape
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

  // 1. Four wooden block legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const legX = W / 2 - LEG_W / 2 - LEG_INSET;
  const legZ = D / 2 - LEG_D / 2 - LEG_INSET;
  addMesh(legGeo, woodMat, 'leg_front_left', -legX, LEG_H / 2, legZ);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, LEG_H / 2, legZ);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, LEG_H / 2, -legZ);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, LEG_H / 2, -legZ);

  // 2. Upholstered base frame
  const baseGeo = new THREE.BoxGeometry(INNER_W + 0.02, BASE_H, D - 0.01);
  addMesh(baseGeo, fabricMat, 'base_frame', 0, LEG_H + BASE_H / 2, 0);

  // 3. Upholstered arms (extruded side profile with rounded top-front)
  const armBodyH = ARM_H - LEG_H;
  const armShape = createRoundedRectShape(D, armBodyH, 0.025);
  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  armGeo.rotateY(Math.PI / 2);
  armGeo.center();

  const armY = LEG_H + armBodyH / 2;
  addMesh(armGeo, fabricMat, 'arm_left', -W / 2 + ARM_W / 2, armY, 0);
  addMesh(armGeo, fabricMat, 'arm_right', W / 2 - ARM_W / 2, armY, 0);

  // 4. Upholstered back frame
  const backFrameGeo = new THREE.BoxGeometry(
    INNER_W + 0.02,
    BACK_FRAME_H,
    BACK_FRAME_D
  );
  addMesh(
    backFrameGeo,
    fabricMat,
    'back_frame',
    0,
    LEG_H + BACK_FRAME_H / 2,
    -D / 2 + BACK_FRAME_D / 2
  );

  // 5. Two seat cushions with piping
  const seatShape = createRoundedRectShape(
    SEAT_CUSHION_W - 0.02,
    SEAT_CUSHION_D - 0.02,
    0.02
  );
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_CUSHION_H - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  seatGeo.rotateX(Math.PI / 2);
  seatGeo.center();

  const seatY = BASE_TOP_Y + SEAT_CUSHION_H / 2;
  const seatZ = -D / 2 + BACK_FRAME_D + SEAT_CUSHION_D / 2;
  const seatXOffset = INNER_W / 4;

  addMesh(seatGeo, fabricMat, 'seat_cushion_left', -seatXOffset, seatY, seatZ);
  addMesh(seatGeo, fabricMat, 'seat_cushion_right', seatXOffset, seatY, seatZ);

  // Seat cushion piping (top & bottom loops)
  function createPipingLoop(w, d, radius) {
    const hw = w / 2;
    const hd = d / 2;
    const pts = [
      new THREE.Vector3(-hw, 0, hd),
      new THREE.Vector3(hw, 0, hd),
      new THREE.Vector3(hw, 0, -hd),
      new THREE.Vector3(-hw, 0, -hd),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.15);
    return new THREE.TubeGeometry(curve, 32, radius, 6, true);
  }

  const seatPipingGeo = createPipingLoop(
    SEAT_CUSHION_W - 0.015,
    SEAT_CUSHION_D - 0.015,
    0.004
  );
  addMesh(
    seatPipingGeo,
    pipingMat,
    'seat_piping_left_top',
    -seatXOffset,
    SEAT_TOP_Y - 0.008,
    seatZ
  );
  addMesh(
    seatPipingGeo,
    pipingMat,
    'seat_piping_right_top',
    seatXOffset,
    SEAT_TOP_Y - 0.008,
    seatZ
  );
  addMesh(
    seatPipingGeo,
    pipingMat,
    'seat_piping_left_bot',
    -seatXOffset,
    BASE_TOP_Y + 0.008,
    seatZ
  );
  addMesh(
    seatPipingGeo,
    pipingMat,
    'seat_piping_right_bot',
    seatXOffset,
    BASE_TOP_Y + 0.008,
    seatZ
  );

  // 6. Two back cushions with piping
  const backShape = createRoundedRectShape(
    BACK_CUSHION_W - 0.02,
    BACK_CUSHION_H - 0.02,
    0.03
  );
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_CUSHION_D - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  backGeo.center();

  const backTilt = -0.17;
  const backY = SEAT_TOP_Y + BACK_CUSHION_H / 2 - 0.02;
  const backZ = -D / 2 + BACK_FRAME_D + BACK_CUSHION_D / 2 - 0.01;

  addMesh(
    backGeo,
    fabricMat,
    'back_cushion_left',
    -seatXOffset,
    backY,
    backZ,
    backTilt
  );
  addMesh(
    backGeo,
    fabricMat,
    'back_cushion_right',
    seatXOffset,
    backY,
    backZ,
    backTilt
  );

  // Back cushion front piping
  const bw = (BACK_CUSHION_W - 0.02) / 2;
  const bh = (BACK_CUSHION_H - 0.02) / 2;
  const backPipingCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-bw, -bh, 0),
      new THREE.Vector3(bw, -bh, 0),
      new THREE.Vector3(bw, bh, 0),
      new THREE.Vector3(-bw, bh, 0),
    ],
    true,
    'catmullrom',
    0.2
  );
  const backPipingGeo = new THREE.TubeGeometry(
    backPipingCurve,
    32,
    0.004,
    6,
    true
  );

  const pipingOffsetZ = (BACK_CUSHION_D / 2 - 0.01) * Math.cos(backTilt);
  const pipingOffsetY = -(BACK_CUSHION_D / 2 - 0.01) * Math.sin(backTilt);

  addMesh(
    backPipingGeo,
    pipingMat,
    'back_piping_left',
    -seatXOffset,
    backY + pipingOffsetY,
    backZ + pipingOffsetZ,
    backTilt
  );
  addMesh(
    backPipingGeo,
    pipingMat,
    'back_piping_right',
    seatXOffset,
    backY + pipingOffsetY,
    backZ + pipingOffsetZ,
    backTilt
  );

  return group;
}
