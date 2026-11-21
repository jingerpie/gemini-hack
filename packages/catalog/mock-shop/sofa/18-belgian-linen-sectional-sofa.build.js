function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 2.85;
  const D = 1.65; // overall depth (chaise side)
  const D_MAIN = 0.98; // main sofa depth
  const H = 0.82; // overall height to top of back cushions
  const LEG_H = 0.14;
  const RAIL_H = 0.055;
  const BASE_UPHOLSTERY_H = 0.08;
  const SEAT_CUSHION_H = 0.155;
  const SEAT_H = LEG_H + RAIL_H + BASE_UPHOLSTERY_H + SEAT_CUSHION_H; // 0.43m
  const ARM_H = 0.58;
  const ARM_W = 0.15;
  const WOOD_PANEL_T = 0.025;
  const BACK_FRAME_H = 0.68;
  const BACK_FRAME_T = 0.16;

  const X_MIN = -W / 2;
  const X_MAX = W / 2;
  const Z_BACK = -D / 2;
  const Z_MAIN_FRONT = Z_BACK + D_MAIN;
  const Z_CHAISE_FRONT = D / 2;

  const CHAISE_W = 0.98;
  const X_CHAISE_INNER = X_MAX - CHAISE_W;
  const MAIN_SEATS_W = (X_CHAISE_INNER - (X_MIN + ARM_W));

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xd8d1c5,
    roughness: 0.88,
    metalness: 0.0,
  });

  const pillowMat = new THREE.MeshStandardMaterial({
    color: 0xcfc7b8,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b623d,
    roughness: 0.55,
    metalness: 0.02,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx !== 0 || ry !== 0 || rz !== 0) {
      mesh.rotation.set(rx, ry, rz);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded/beveled cushion geometry
  function makeCushionGeo(w, h, d, bevel = 0.03) {
    const bw = Math.max(0.02, w - bevel * 2);
    const bh = Math.max(0.02, h - bevel * 2);
    const bd = Math.max(0.02, d - bevel * 2);
    const shape = new THREE.Shape();
    shape.moveTo(-bw / 2, -bh / 2);
    shape.lineTo(bw / 2, -bh / 2);
    shape.lineTo(bw / 2, bh / 2);
    shape.lineTo(-bw / 2, bh / 2);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: bd,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
    });
    geo.center();
    return geo;
  }

  // Tapered square wooden legs
  const legGeo = new THREE.CylinderGeometry(0.026, 0.017, LEG_H, 4);
  legGeo.rotateY(Math.PI / 4);
  const legInset = 0.045;
  const legPositions = [
    ["leg_left_front", X_MIN + legInset, Z_MAIN_FRONT - legInset],
    ["leg_left_back", X_MIN + legInset, Z_BACK + legInset],
    ["leg_center_front", X_CHAISE_INNER - legInset, Z_MAIN_FRONT - legInset],
    ["leg_center_back", 0, Z_BACK + legInset],
    ["leg_chaise_front_left", X_CHAISE_INNER + legInset, Z_CHAISE_FRONT - legInset],
    ["leg_chaise_front_right", X_MAX - legInset, Z_CHAISE_FRONT - legInset],
    ["leg_right_back", X_MAX - legInset, Z_BACK + legInset],
  ];
  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, woodMat, name, lx, LEG_H / 2, lz);
  }

  // Wood base rails
  const railY = LEG_H + RAIL_H / 2;
  const mainRailW = X_CHAISE_INNER - X_MIN;
  addMesh(
    new THREE.BoxGeometry(mainRailW, RAIL_H, D_MAIN),
    woodMat,
    "wood_base_rail_main",
    X_MIN + mainRailW / 2,
    railY,
    Z_BACK + D_MAIN / 2
  );
  addMesh(
    new THREE.BoxGeometry(CHAISE_W, RAIL_H, D),
    woodMat,
    "wood_base_rail_chaise",
    X_CHAISE_INNER + CHAISE_W / 2,
    railY,
    0
  );

  // Upholstered base platforms
  const baseY = LEG_H + RAIL_H + BASE_UPHOLSTERY_H / 2;
  addMesh(
    new THREE.BoxGeometry(mainRailW - 0.01, BASE_UPHOLSTERY_H, D_MAIN - 0.01),
    linenMat,
    "upholstered_base_main",
    X_MIN + mainRailW / 2,
    baseY,
    Z_BACK + D_MAIN / 2
  );
  addMesh(
    new THREE.BoxGeometry(CHAISE_W - 0.01, BASE_UPHOLSTERY_H, D - 0.01),
    linenMat,
    "upholstered_base_chaise",
    X_CHAISE_INNER + CHAISE_W / 2,
    baseY,
    0
  );

  // Left arm (with prominent wood outer panel)
  const armInnerW = ARM_W - WOOD_PANEL_T;
  const armCenterY = LEG_H + RAIL_H + (ARM_H - LEG_H - RAIL_H) / 2;
  const armBodyH = ARM_H - LEG_H - RAIL_H;
  addMesh(
    new THREE.BoxGeometry(armInnerW, armBodyH, D_MAIN),
    linenMat,
    "arm_left_upholstery",
    X_MIN + WOOD_PANEL_T + armInnerW / 2,
    armCenterY,
    Z_BACK + D_MAIN / 2
  );
  const woodPanelH = ARM_H - LEG_H - 0.02;
  addMesh(
    new THREE.BoxGeometry(WOOD_PANEL_T, woodPanelH, D_MAIN),
    woodMat,
    "arm_left_wood_panel",
    X_MIN + WOOD_PANEL_T / 2,
    LEG_H + woodPanelH / 2,
    Z_BACK + D_MAIN / 2
  );

  // Right arm (shorter, on chaise side)
  addMesh(
    new THREE.BoxGeometry(armInnerW, armBodyH, D_MAIN),
    linenMat,
    "arm_right_upholstery",
    X_MAX - WOOD_PANEL_T - armInnerW / 2,
    armCenterY,
    Z_BACK + D_MAIN / 2
  );
  addMesh(
    new THREE.BoxGeometry(WOOD_PANEL_T, woodPanelH, D_MAIN),
    woodMat,
    "arm_right_wood_panel",
    X_MAX - WOOD_PANEL_T / 2,
    LEG_H + woodPanelH / 2,
    Z_BACK + D_MAIN / 2
  );

  // Backrest frame
  const backFrameW = W - ARM_W * 2;
  const backFrameH = BACK_FRAME_H - LEG_H - RAIL_H;
  addMesh(
    new THREE.BoxGeometry(backFrameW, backFrameH, BACK_FRAME_T),
    linenMat,
    "backrest_frame",
    0,
    LEG_H + RAIL_H + backFrameH / 2,
    Z_BACK + BACK_FRAME_T / 2
  );

  // Seat cushions (2 main + 1 chaise)
  const seatCushionY = LEG_H + RAIL_H + BASE_UPHOLSTERY_H + SEAT_CUSHION_H / 2;
  const seatD = D_MAIN - BACK_FRAME_T;
  const seatZ = Z_BACK + BACK_FRAME_T + seatD / 2;
  const mainCushionW = MAIN_SEATS_W / 2 - 0.008;
  const mainSeatGeo = makeCushionGeo(mainCushionW, SEAT_CUSHION_H, seatD, 0.032);

  addMesh(
    mainSeatGeo,
    linenMat,
    "seat_cushion_left",
    X_MIN + ARM_W + MAIN_SEATS_W * 0.25,
    seatCushionY,
    seatZ
  );
  addMesh(
    mainSeatGeo,
    linenMat,
    "seat_cushion_center",
    X_MIN + ARM_W + MAIN_SEATS_W * 0.75,
    seatCushionY,
    seatZ
  );

  const chaiseCushionW = CHAISE_W - ARM_W - 0.008;
  const chaiseCushionD = D - BACK_FRAME_T;
  const chaiseSeatGeo = makeCushionGeo(chaiseCushionW, SEAT_CUSHION_H, chaiseCushionD, 0.035);
  addMesh(
    chaiseSeatGeo,
    linenMat,
    "seat_cushion_chaise",
    X_CHAISE_INNER + chaiseCushionW / 2,
    seatCushionY,
    Z_BACK + BACK_FRAME_T + chaiseCushionD / 2
  );

  // 3 Back cushions
  const backCushionTotalW = W - ARM_W * 2;
  const backCushionW = backCushionTotalW / 3 - 0.012;
  const backCushionH = H - SEAT_H + 0.02;
  const backCushionD = 0.16;
  const backCushionGeo = makeCushionGeo(backCushionW, backCushionH, backCushionD, 0.035);
  const backCushionY = SEAT_H + backCushionH / 2 - 0.02;
  const backCushionZ = Z_BACK + BACK_FRAME_T + backCushionD / 2 - 0.01;

  for (let i = 0; i < 3; i++) {
    const bx = X_MIN + ARM_W + backCushionTotalW * ((i + 0.5) / 3);
    addMesh(
      backCushionGeo,
      linenMat,
      `back_cushion_${i + 1}`,
      bx,
      backCushionY,
      backCushionZ,
      -0.12,
      0,
      0
    );
  }

  // 2 Throw pillows
  const pillowGeo = makeCushionGeo(0.42, 0.38, 0.12, 0.03);
  addMesh(
    pillowGeo,
    pillowMat,
    "throw_pillow_left",
    X_MIN + ARM_W + 0.18,
    SEAT_H + 0.17,
    Z_BACK + BACK_FRAME_T + 0.2,
    -0.25,
    0.45,
    0.08
  );
  addMesh(
    pillowGeo,
    pillowMat,
    "throw_pillow_right",
    X_CHAISE_INNER + 0.25,
    SEAT_H + 0.17,
    Z_BACK + BACK_FRAME_T + 0.2,
    -0.22,
    -0.35,
    -0.05
  );

  return group;
}
