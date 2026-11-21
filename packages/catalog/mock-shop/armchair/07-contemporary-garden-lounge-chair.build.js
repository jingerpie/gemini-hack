function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.76;
  const D = 1.94;
  const FRAME_H = 0.28;
  const LEG_T = 0.04;
  const FOOT_H = 0.012;
  const RAIL_H = 0.04;
  const WICKER_T = 0.036;
  const CUSHION_T = 0.075;
  const BACK_ANGLE = (55 * Math.PI) / 180;
  const HINGE_Z = -0.32;
  const HINGE_Y = FRAME_H + WICKER_T * 0.5;

  // Materials
  const matFrame = new THREE.MeshStandardMaterial({
    color: 0x3b3530,
    roughness: 0.45,
    metalness: 0.6,
  });
  const matWicker = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.85,
    metalness: 0.05,
  });
  const matCushion = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matStrap = new THREE.MeshStandardMaterial({
    color: 0xd9d1c3,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matFoot = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.8,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for beveled cushion segments
  function makeCushionGeo(width, length, thickness) {
    const r = 0.018;
    const hw = width / 2 - r;
    const hl = length / 2 - r;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hl - r);
    shape.lineTo(hw, -hl - r);
    shape.quadraticCurveTo(hw + r, -hl - r, hw + r, -hl);
    shape.lineTo(hw + r, hl);
    shape.quadraticCurveTo(hw + r, hl + r, hw, hl + r);
    shape.lineTo(-hw, hl + r);
    shape.quadraticCurveTo(-hw - r, hl + r, -hw - r, hl);
    shape.lineTo(-hw - r, -hl);
    shape.quadraticCurveTo(-hw - r, -hl - r, -hw, -hl - r);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness - 0.024,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.rotateX(Math.PI / 2);
    geo.center();
    return geo;
  }

  // Legs (6 legs: front, mid, back)
  const legX = W / 2 - LEG_T / 2;
  const legZPositions = [
    { label: 'front', z: D / 2 - LEG_T / 2 },
    { label: 'mid', z: 0.06 },
    { label: 'back', z: -D / 2 + LEG_T / 2 },
  ];
  const legGeo = new THREE.BoxGeometry(LEG_T, FRAME_H - FOOT_H, LEG_T);
  const footGeo = new THREE.BoxGeometry(LEG_T * 0.92, FOOT_H, LEG_T * 0.92);

  for (const lz of legZPositions) {
    for (const side of [
      { label: 'left', x: -legX },
      { label: 'right', x: legX },
    ]) {
      addMesh(
        legGeo,
        matFrame,
        `leg_${lz.label}_${side.label}`,
        [side.x, FOOT_H + (FRAME_H - FOOT_H) / 2, lz.z]
      );
      addMesh(
        footGeo,
        matFoot,
        `foot_${lz.label}_${side.label}`,
        [side.x, FOOT_H / 2, lz.z]
      );
    }
  }

  // Side rails & crossbars
  const sideRailGeo = new THREE.BoxGeometry(LEG_T, RAIL_H, D);
  addMesh(sideRailGeo, matFrame, 'side_rail_left', [
    -legX,
    FRAME_H - RAIL_H / 2,
    0,
  ]);
  addMesh(sideRailGeo, matFrame, 'side_rail_right', [
    legX,
    FRAME_H - RAIL_H / 2,
    0,
  ]);

  const crossbarGeo = new THREE.BoxGeometry(W - LEG_T * 2, RAIL_H, LEG_T);
  addMesh(crossbarGeo, matFrame, 'crossbar_front', [
    0,
    FRAME_H - RAIL_H / 2,
    D / 2 - LEG_T / 2,
  ]);
  addMesh(crossbarGeo, matFrame, 'crossbar_back', [
    0,
    FRAME_H - RAIL_H / 2,
    -D / 2 + LEG_T / 2,
  ]);

  // Wicker deck: horizontal seat/leg section + angled backrest
  const seatDeckLen = D / 2 - HINGE_Z;
  const seatDeckZ = HINGE_Z + seatDeckLen / 2;
  const seatDeckGeo = new THREE.BoxGeometry(W, WICKER_T, seatDeckLen);
  addMesh(seatDeckGeo, matWicker, 'wicker_deck_seat', [
    0,
    FRAME_H + WICKER_T / 2,
    seatDeckZ,
  ]);

  const backDeckLen = 0.78;
  const backDeckGeo = new THREE.BoxGeometry(W, WICKER_T, backDeckLen);
  const backCenterZ = HINGE_Z - (backDeckLen / 2) * Math.cos(BACK_ANGLE);
  const backCenterY = HINGE_Y + (backDeckLen / 2) * Math.sin(BACK_ANGLE);
  addMesh(
    backDeckGeo,
    matWicker,
    'wicker_deck_backrest',
    [0, backCenterY, backCenterZ],
    [BACK_ANGLE, 0, 0]
  );

  // Backrest support struts
  const strutAttachZ = HINGE_Z - 0.34 * Math.cos(BACK_ANGLE);
  const strutAttachY = HINGE_Y + 0.34 * Math.sin(BACK_ANGLE);
  const strutBaseZ = -D / 2 + 0.14;
  const strutBaseY = FRAME_H;
  const strutLen = Math.hypot(
    strutAttachZ - strutBaseZ,
    strutAttachY - strutBaseY
  );
  const strutAngle = Math.atan2(
    strutAttachY - strutBaseY,
    strutAttachZ - strutBaseZ
  );
  const strutGeo = new THREE.BoxGeometry(0.022, 0.022, strutLen);
  for (const side of [
    { label: 'left', x: -W * 0.32 },
    { label: 'right', x: W * 0.32 },
  ]) {
    addMesh(
      strutGeo,
      matFrame,
      `backrest_strut_${side.label}`,
      [
        side.x,
        (strutAttachY + strutBaseY) / 2,
        (strutAttachZ + strutBaseZ) / 2,
      ],
      [-strutAngle, 0, 0]
    );
  }

  // Cushions (4 segmented cushions)
  const cushionW = W - 0.03;
  const cushionY = FRAME_H + WICKER_T + CUSHION_T / 2 - 0.004;

  // 1. Front leg-rest cushion
  const legCushionLen = 0.78;
  const legCushionZ = D / 2 - legCushionLen / 2 - 0.02;
  addMesh(
    makeCushionGeo(cushionW, legCushionLen, CUSHION_T),
    matCushion,
    'cushion_leg_rest',
    [0, cushionY, legCushionZ]
  );

  // 2. Mid seat cushion
  const seatCushionLen = 0.46;
  const seatCushionZ = legCushionZ - legCushionLen / 2 - seatCushionLen / 2 - 0.006;
  addMesh(
    makeCushionGeo(cushionW, seatCushionLen, CUSHION_T),
    matCushion,
    'cushion_seat',
    [0, cushionY, seatCushionZ]
  );

  // 3. Lower backrest cushion
  const backLowerLen = 0.48;
  const backOffset = WICKER_T / 2 + CUSHION_T / 2 - 0.004;
  const backLowerDist = backLowerLen / 2 + 0.02;
  addMesh(
    makeCushionGeo(cushionW, backLowerLen, CUSHION_T),
    matCushion,
    'cushion_back_lower',
    [
      0,
      HINGE_Y +
        backLowerDist * Math.sin(BACK_ANGLE) +
        backOffset * Math.cos(BACK_ANGLE),
      HINGE_Z -
        backLowerDist * Math.cos(BACK_ANGLE) +
        backOffset * Math.sin(BACK_ANGLE),
    ],
    [BACK_ANGLE, 0, 0]
  );

  // 4. Upper headrest cushion
  const backUpperLen = 0.25;
  const backUpperDist = backLowerLen + backUpperLen / 2 + 0.026;
  addMesh(
    makeCushionGeo(cushionW, backUpperLen, CUSHION_T),
    matCushion,
    'cushion_back_upper',
    [
      0,
      HINGE_Y +
        backUpperDist * Math.sin(BACK_ANGLE) +
        backOffset * Math.cos(BACK_ANGLE),
      HINGE_Z -
        backUpperDist * Math.cos(BACK_ANGLE) +
        backOffset * Math.sin(BACK_ANGLE),
    ],
    [BACK_ANGLE, 0, 0]
  );

  // Fabric straps wrapping around the deck edges
  const strapH = WICKER_T + CUSHION_T * 0.7;
  const strapGeo = new THREE.BoxGeometry(0.016, strapH, 0.028);
  const strapX = W / 2 - 0.004;

  for (const side of [
    { label: 'left', x: -strapX },
    { label: 'right', x: strapX },
  ]) {
    addMesh(strapGeo, matStrap, `strap_front_${side.label}`, [
      side.x,
      FRAME_H + strapH / 2 - 0.005,
      legCushionZ - legCushionLen / 2 + 0.08,
    ]);
    addMesh(strapGeo, matStrap, `strap_mid_${side.label}`, [
      side.x,
      FRAME_H + strapH / 2 - 0.005,
      seatCushionZ - seatCushionLen / 2 + 0.06,
    ]);
    const backStrapDist = 0.66;
    addMesh(
      strapGeo,
      matStrap,
      `strap_back_${side.label}`,
      [
        side.x,
        HINGE_Y +
          backStrapDist * Math.sin(BACK_ANGLE) +
          (strapH / 2 - 0.015) * Math.cos(BACK_ANGLE),
        HINGE_Z -
          backStrapDist * Math.cos(BACK_ANGLE) +
          (strapH / 2 - 0.015) * Math.sin(BACK_ANGLE),
      ],
      [BACK_ANGLE, 0, 0]
    );
  }

  return group;
}
