function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.50;
  const H = 0.78;
  const D = 0.42;

  const LEG_H = 0.18;
  const LEG_R = 0.021;
  const RAIL_H = 0.032;
  const RAIL_T = 0.024;
  const LEG_INSET_X = 0.11;
  const LEG_INSET_Z = 0.065;

  const BODY_H = H - LEG_H; // 0.60
  const BODY_Y = LEG_H + BODY_H / 2;
  const PANEL_T = 0.022;
  const CORNER_R = 0.035;

  const DOOR_GAP = 0.004;
  const DOOR_T = 0.018;
  const DOOR_AREA_W = W - 2 * CORNER_R;
  const DOOR_W = (DOOR_AREA_W - 4 * DOOR_GAP) / 3;
  const DOOR_H = BODY_H - 2 * PANEL_T - 2 * DOOR_GAP;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xb2b1ac,
    roughness: 0.55,
    metalness: 0.04,
  });

  const gapMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b29,
    roughness: 0.85,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc2a075,
    roughness: 0.65,
    metalness: 0.0,
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

  // Legs (4 cylindrical oak legs with slightly rounded bottom)
  const legPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(LEG_R * 0.85, 0.003),
    new THREE.Vector2(LEG_R, 0.012),
    new THREE.Vector2(LEG_R, LEG_H),
    new THREE.Vector2(0.0, LEG_H),
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 20);

  const legX = W / 2 - LEG_INSET_X;
  const legZ = D / 2 - LEG_INSET_Z;

  addMesh(legGeo, woodMat, 'leg_front_left', -legX, 0, legZ);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, 0, legZ);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, 0, -legZ);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, 0, -legZ);

  // Underframe rails
  const railY = LEG_H - RAIL_H / 2;
  const frontBackRailGeo = new THREE.BoxGeometry(legX * 2, RAIL_H, RAIL_T);
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, legZ * 2);

  addMesh(frontBackRailGeo, woodMat, 'underframe_rail_front', 0, railY, legZ);
  addMesh(frontBackRailGeo, woodMat, 'underframe_rail_back', 0, railY, -legZ);
  addMesh(sideRailGeo, woodMat, 'underframe_rail_left', -legX, railY, 0);
  addMesh(sideRailGeo, woodMat, 'underframe_rail_right', legX, railY, 0);

  // Cabinet body: Top and Bottom panels (rounded front corners via ExtrudeGeometry)
  const panelShape = new THREE.Shape();
  const hw = W / 2;
  const hd = D / 2;
  panelShape.moveTo(-hw, -hd);
  panelShape.lineTo(hw, -hd);
  panelShape.lineTo(hw, hd - CORNER_R);
  panelShape.absarc(hw - CORNER_R, hd - CORNER_R, CORNER_R, 0, Math.PI / 2, false);
  panelShape.lineTo(-hw + CORNER_R, hd);
  panelShape.absarc(-hw + CORNER_R, hd - CORNER_R, CORNER_R, Math.PI / 2, Math.PI, false);
  panelShape.lineTo(-hw, -hd);

  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: PANEL_T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  panelGeo.rotateX(Math.PI / 2);

  addMesh(panelGeo, bodyMat, 'cabinet_bottom_panel', 0, LEG_H + PANEL_T, 0);
  addMesh(panelGeo, bodyMat, 'cabinet_top_panel', 0, H, 0);

  // Cabinet back panel
  const innerH = BODY_H - 2 * PANEL_T;
  const backGeo = new THREE.BoxGeometry(W, innerH, PANEL_T);
  addMesh(backGeo, bodyMat, 'cabinet_back_panel', 0, BODY_Y, -hd + PANEL_T / 2);

  // Cabinet side panels (flat rear section + rounded front corner)
  const sideFlatD = D - CORNER_R;
  const sideGeo = new THREE.BoxGeometry(PANEL_T, innerH, sideFlatD);
  const sideZ = -hd + sideFlatD / 2;
  addMesh(sideGeo, bodyMat, 'cabinet_side_left', -hw + PANEL_T / 2, BODY_Y, sideZ);
  addMesh(sideGeo, bodyMat, 'cabinet_side_right', hw - PANEL_T / 2, BODY_Y, sideZ);

  // Rounded front vertical corner pillars
  const cornerGeo = new THREE.CylinderGeometry(CORNER_R, CORNER_R, innerH, 20);
  addMesh(cornerGeo, bodyMat, 'cabinet_corner_front_left', -hw + CORNER_R, BODY_Y, hd - CORNER_R);
  addMesh(cornerGeo, bodyMat, 'cabinet_corner_front_right', hw - CORNER_R, BODY_Y, hd - CORNER_R);

  // Recessed dark backing behind doors for crisp shadow gaps
  const recessGeo = new THREE.BoxGeometry(DOOR_AREA_W, innerH, 0.01);
  addMesh(recessGeo, gapMat, 'door_recess_backing', 0, BODY_Y, hd - DOOR_T - 0.005);

  // Three front doors
  const doorGeo = new THREE.BoxGeometry(DOOR_W, DOOR_H, DOOR_T);
  const doorZ = hd - DOOR_T / 2;
  const doorStartX = -DOOR_AREA_W / 2 + DOOR_GAP + DOOR_W / 2;

  for (let i = 0; i < 3; i++) {
    const dx = doorStartX + i * (DOOR_W + DOOR_GAP);
    addMesh(doorGeo, bodyMat, `cabinet_door_${i + 1}`, dx, BODY_Y, doorZ);
  }

  return group;
}
