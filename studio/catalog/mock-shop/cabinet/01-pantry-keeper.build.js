function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.40;
  const H = 0.92;
  const D = 0.45;
  const OVERHANG = 0.025;
  const BODY_W = W - OVERHANG * 2;
  const BODY_D = D - OVERHANG * 2;

  const TOP_H = 0.035;
  const LEG_H = 0.08;
  const LEG_W = 0.045;
  const STILE_W = 0.035;
  const RAIL_H = 0.03;
  const DRAWER_H = 0.16;
  const PANEL_T = 0.02;

  const BODY_TOP_Y = H - TOP_H;
  const BODY_BOT_Y = LEG_H;
  const DRAWER_TOP_Y = BODY_TOP_Y - RAIL_H;
  const DRAWER_BOT_Y = DRAWER_TOP_Y - DRAWER_H;
  const DOOR_TOP_Y = DRAWER_BOT_Y - RAIL_H;
  const DOOR_BOT_Y = BODY_BOT_Y + RAIL_H;
  const DOOR_H = DOOR_TOP_Y - DOOR_BOT_Y;

  const BAY_W = (BODY_W - LEG_W * 2 - STILE_W * 2) / 3;
  const FRONT_Z = BODY_D / 2;
  const BACK_Z = -BODY_D / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.65,
    metalness: 0.05,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x6e451f,
    roughness: 0.72,
    metalness: 0.04,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff0ea,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.25,
    clearcoat: 1.0,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Top board
  addMesh(
    new THREE.BoxGeometry(W, TOP_H, D),
    woodMat,
    'top_board',
    0,
    H - TOP_H / 2,
    0
  );

  // 2. Carcass panels
  const carcassH = BODY_TOP_Y - BODY_BOT_Y;
  const carcassMidY = (BODY_TOP_Y + BODY_BOT_Y) / 2;

  addMesh(
    new THREE.BoxGeometry(BODY_W - PANEL_T * 2, carcassH, PANEL_T),
    darkWoodMat,
    'back_panel',
    0,
    carcassMidY,
    BACK_Z + PANEL_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(PANEL_T, carcassH, BODY_D - PANEL_T),
    woodMat,
    'left_side_panel',
    -BODY_W / 2 + PANEL_T / 2,
    carcassMidY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(PANEL_T, carcassH, BODY_D - PANEL_T),
    woodMat,
    'right_side_panel',
    BODY_W / 2 - PANEL_T / 2,
    carcassMidY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(BODY_W - PANEL_T * 2, PANEL_T, BODY_D - PANEL_T),
    darkWoodMat,
    'bottom_panel',
    0,
    BODY_BOT_Y + PANEL_T / 2,
    0
  );

  // 3. Interior shelf
  addMesh(
    new THREE.BoxGeometry(BODY_W - PANEL_T * 2, PANEL_T, BODY_D - PANEL_T * 2),
    darkWoodMat,
    'interior_shelf',
    0,
    (DOOR_TOP_Y + DOOR_BOT_Y) / 2,
    0
  );

  // 4. Four corner legs (extending from y=0 to BODY_TOP_Y)
  const fullLegH = BODY_TOP_Y;
  const legPositions = [
    ['leg_fl', -BODY_W / 2 + LEG_W / 2, FRONT_Z - LEG_W / 2],
    ['leg_fr', BODY_W / 2 - LEG_W / 2, FRONT_Z - LEG_W / 2],
    ['leg_bl', -BODY_W / 2 + LEG_W / 2, BACK_Z + LEG_W / 2],
    ['leg_br', BODY_W / 2 - LEG_W / 2, BACK_Z + LEG_W / 2],
  ];
  for (const [name, lx, lz] of legPositions) {
    addMesh(
      new THREE.BoxGeometry(LEG_W, fullLegH, LEG_W),
      woodMat,
      name,
      lx,
      fullLegH / 2,
      lz
    );
  }

  // 5. Front horizontal rails
  const frontInnerW = BODY_W - LEG_W * 2;
  addMesh(
    new THREE.BoxGeometry(frontInnerW, RAIL_H, PANEL_T),
    woodMat,
    'top_front_rail',
    0,
    BODY_TOP_Y - RAIL_H / 2,
    FRONT_Z - PANEL_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(frontInnerW, RAIL_H, PANEL_T),
    woodMat,
    'mid_front_rail',
    0,
    DRAWER_BOT_Y - RAIL_H / 2,
    FRONT_Z - PANEL_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(frontInnerW, RAIL_H, PANEL_T),
    woodMat,
    'bottom_front_rail',
    0,
    BODY_BOT_Y + RAIL_H / 2,
    FRONT_Z - PANEL_T / 2
  );

  // 6. Vertical front stiles between bays
  const stileH = BODY_TOP_Y - BODY_BOT_Y - RAIL_H * 2;
  const stileY = (BODY_TOP_Y + BODY_BOT_Y) / 2;
  const stileLeftX = -BODY_W / 2 + LEG_W + BAY_W + STILE_W / 2;
  const stileRightX = BODY_W / 2 - LEG_W - BAY_W - STILE_W / 2;

  addMesh(
    new THREE.BoxGeometry(STILE_W, stileH, PANEL_T),
    woodMat,
    'stile_left_mid',
    stileLeftX,
    stileY,
    FRONT_Z - PANEL_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(STILE_W, stileH, PANEL_T),
    woodMat,
    'stile_right_mid',
    stileRightX,
    stileY,
    FRONT_Z - PANEL_T / 2
  );

  // 7. Three drawers & knobs
  const bayCentersX = [
    -BODY_W / 2 + LEG_W + BAY_W / 2,
    0,
    BODY_W / 2 - LEG_W - BAY_W / 2,
  ];
  const bayNames = ['left', 'center', 'right'];
  const drawerGap = 0.004;
  const drawerY = (DRAWER_TOP_Y + DRAWER_BOT_Y) / 2;
  const knobGeo = new THREE.SphereGeometry(0.014, 16, 12);

  for (let i = 0; i < 3; i++) {
    const bx = bayCentersX[i];
    const bName = bayNames[i];
    addMesh(
      new THREE.BoxGeometry(BAY_W - drawerGap, DRAWER_H - drawerGap, PANEL_T),
      woodMat,
      `drawer_front_${bName}`,
      bx,
      drawerY,
      FRONT_Z - PANEL_T / 2 + 0.002
    );
    addMesh(
      knobGeo,
      woodMat,
      `drawer_knob_${bName}`,
      bx,
      drawerY,
      FRONT_Z + 0.014
    );
  }

  // 8. Three glass-front doors & knobs
  const doorW = BAY_W - drawerGap;
  const doorH = DOOR_H - drawerGap;
  const frameW = 0.05;
  const doorY = (DOOR_TOP_Y + DOOR_BOT_Y) / 2;

  // Create door frame geometry with rectangular cutout
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-doorW / 2, -doorH / 2);
  outerShape.lineTo(doorW / 2, -doorH / 2);
  outerShape.lineTo(doorW / 2, doorH / 2);
  outerShape.lineTo(-doorW / 2, doorH / 2);
  outerShape.closePath();

  const innerHole = new THREE.Path();
  const hw = doorW / 2 - frameW;
  const hh = doorH / 2 - frameW;
  innerHole.moveTo(-hw, -hh);
  innerHole.lineTo(hw, -hh);
  innerHole.lineTo(hw, hh);
  innerHole.lineTo(-hw, hh);
  innerHole.closePath();
  outerShape.holes.push(innerHole);

  const doorFrameGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: PANEL_T,
    bevelEnabled: false,
  });
  doorFrameGeo.translate(0, 0, -PANEL_T / 2);

  const glassGeo = new THREE.BoxGeometry(hw * 2 + 0.005, hh * 2 + 0.005, 0.004);
  const knobOffsets = [
    doorW / 2 - frameW / 2,   // left door: knob on right
    -doorW / 2 + frameW / 2,  // center door: knob on left
    -doorW / 2 + frameW / 2,  // right door: knob on left
  ];

  for (let i = 0; i < 3; i++) {
    const bx = bayCentersX[i];
    const bName = bayNames[i];

    addMesh(
      doorFrameGeo,
      woodMat,
      `door_frame_${bName}`,
      bx,
      doorY,
      FRONT_Z - PANEL_T / 2 + 0.002
    );

    addMesh(
      glassGeo,
      glassMat,
      `door_glass_${bName}`,
      bx,
      doorY,
      FRONT_Z - PANEL_T / 2 + 0.002
    );

    addMesh(
      knobGeo,
      woodMat,
      `door_knob_${bName}`,
      bx + knobOffsets[i],
      doorY,
      FRONT_Z + 0.014
    );
  }

  return group;
}
