function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.60;           // Total width
  const D = 1.75;           // Total depth (chaise side)
  const RIGHT_D = 1.02;     // Depth of right-hand module
  const CHAISE_W = 1.22;    // Width of chaise module (including left arm)
  const RIGHT_W = W - CHAISE_W;

  const PLINTH_H = 0.04;    // Recessed bottom plinth height
  const PLINTH_INSET = 0.06;
  const BASE_H = 0.22;      // Walnut wood base height
  const FRAME_T = 0.16;     // Thickness of walnut arm and backrest
  const ARM_H = 0.62;       // Top of walnut arm/backrest from floor

  const SEAT_H = 0.16;      // Seat cushion thickness
  const BACK_CUSH_H = 0.42; // Back cushion height
  const BACK_CUSH_T = 0.18; // Back cushion thickness

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x664028,
    roughness: 0.45,
    metalness: 0.05
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.6,
    metalness: 0.05
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x735643,
    roughness: 0.92,
    metalness: 0.0
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

  function makeRoundedBox(w, h, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2 - r;
    const hh = h / 2 - r;
    shape.moveTo(-hw, -h / 2);
    shape.lineTo(hw, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
    shape.lineTo(w / 2, hh);
    shape.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
    shape.lineTo(-hw, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
    shape.lineTo(-w / 2, -hh);
    shape.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);

    const extrudeSettings = {
      depth: d - r * 2,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: r,
      bevelThickness: r
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  // 1. Recessed Plinths (touching y = 0)
  const plinthChaiseGeo = new THREE.BoxGeometry(
    CHAISE_W - PLINTH_INSET * 2,
    PLINTH_H,
    D - PLINTH_INSET * 2
  );
  addMesh(
    plinthChaiseGeo,
    plinthMat,
    'plinth_chaise',
    -W / 2 + CHAISE_W / 2,
    PLINTH_H / 2,
    0
  );

  const plinthRightGeo = new THREE.BoxGeometry(
    RIGHT_W - PLINTH_INSET,
    PLINTH_H,
    RIGHT_D - PLINTH_INSET * 2
  );
  addMesh(
    plinthRightGeo,
    plinthMat,
    'plinth_right',
    -W / 2 + CHAISE_W + (RIGHT_W - PLINTH_INSET) / 2,
    PLINTH_H / 2,
    -D / 2 + RIGHT_D / 2
  );

  // 2. Walnut Wood Bases
  const baseY = PLINTH_H + BASE_H / 2;
  const baseChaiseGeo = new THREE.BoxGeometry(CHAISE_W - FRAME_T, BASE_H, D - FRAME_T);
  addMesh(
    baseChaiseGeo,
    walnutMat,
    'wood_base_chaise',
    -W / 2 + FRAME_T + (CHAISE_W - FRAME_T) / 2,
    baseY,
    FRAME_T / 2
  );

  const baseRightGeo = new THREE.BoxGeometry(RIGHT_W, BASE_H, RIGHT_D - FRAME_T);
  addMesh(
    baseRightGeo,
    walnutMat,
    'wood_base_right',
    -W / 2 + CHAISE_W + RIGHT_W / 2,
    baseY,
    -D / 2 + FRAME_T + (RIGHT_D - FRAME_T) / 2
  );

  // 3. Walnut Left Arm & Back Frame
  const frameH = ARM_H - PLINTH_H;
  const frameY = PLINTH_H + frameH / 2;

  const armLeftGeo = new THREE.BoxGeometry(FRAME_T, frameH, D);
  addMesh(
    armLeftGeo,
    walnutMat,
    'wood_arm_left',
    -W / 2 + FRAME_T / 2,
    frameY,
    0
  );

  const backFrameGeo = new THREE.BoxGeometry(W - FRAME_T, frameH, FRAME_T);
  addMesh(
    backFrameGeo,
    walnutMat,
    'wood_back_frame',
    -W / 2 + FRAME_T + (W - FRAME_T) / 2,
    frameY,
    -D / 2 + FRAME_T / 2
  );

  // 4. Seat Cushions
  const seatY = PLINTH_H + BASE_H + SEAT_H / 2 - 0.005;
  const chaiseSeatW = CHAISE_W - FRAME_T - 0.01;
  const chaiseSeatD = D - FRAME_T - 0.01;
  const chaiseSeatGeo = makeRoundedBox(chaiseSeatW, SEAT_H, chaiseSeatD, 0.035);
  addMesh(
    chaiseSeatGeo,
    fabricMat,
    'seat_cushion_chaise',
    -W / 2 + FRAME_T + chaiseSeatW / 2 + 0.005,
    seatY,
    FRAME_T / 2 + 0.005
  );

  const rightSeatW = RIGHT_W - 0.01;
  const rightSeatD = RIGHT_D - FRAME_T - 0.01;
  const rightSeatGeo = makeRoundedBox(rightSeatW, SEAT_H, rightSeatD, 0.035);
  addMesh(
    rightSeatGeo,
    fabricMat,
    'seat_cushion_right',
    -W / 2 + CHAISE_W + rightSeatW / 2 + 0.005,
    seatY,
    -D / 2 + FRAME_T + rightSeatD / 2 + 0.005
  );

  // 5. Back Cushions (along -Z)
  const backCushY = PLINTH_H + BASE_H + SEAT_H + BACK_CUSH_H / 2 - 0.02;
  const backCushZ = -D / 2 + FRAME_T + BACK_CUSH_T / 2 + 0.02;
  const backTilt = -0.14;

  const backLeftW = CHAISE_W - FRAME_T - 0.02;
  const backLeftGeo = makeRoundedBox(backLeftW, BACK_CUSH_H, BACK_CUSH_T, 0.045);
  addMesh(
    backLeftGeo,
    fabricMat,
    'back_cushion_left',
    -W / 2 + FRAME_T + backLeftW / 2 + 0.01,
    backCushY,
    backCushZ,
    backTilt,
    0,
    0
  );

  const backRightW = RIGHT_W - 0.04;
  const backRightGeo = makeRoundedBox(backRightW, BACK_CUSH_H, BACK_CUSH_T, 0.045);
  addMesh(
    backRightGeo,
    fabricMat,
    'back_cushion_right',
    -W / 2 + CHAISE_W + backRightW / 2 + 0.01,
    backCushY,
    backCushZ,
    backTilt,
    0,
    0
  );

  // 6. Side Arm Cushions (leaning against left walnut arm)
  const armCushX = -W / 2 + FRAME_T + BACK_CUSH_T / 2 + 0.03;
  const armCushY = PLINTH_H + BASE_H + SEAT_H + BACK_CUSH_H / 2 - 0.03;
  const armCushW = 0.62;
  const armCushGeo = makeRoundedBox(BACK_CUSH_T, BACK_CUSH_H - 0.03, armCushW, 0.045);

  addMesh(
    armCushGeo,
    fabricMat,
    'arm_cushion_rear',
    armCushX,
    armCushY,
    -D / 2 + FRAME_T + BACK_CUSH_T + armCushW / 2 - 0.05,
    0,
    0,
    -0.22
  );

  addMesh(
    armCushGeo,
    fabricMat,
    'arm_cushion_front',
    armCushX + 0.01,
    armCushY,
    -D / 2 + FRAME_T + BACK_CUSH_T + armCushW * 1.45 - 0.05,
    0,
    0,
    -0.24
  );

  return group;
}
