function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.20;
  const D = 0.40;
  const H = 0.46;

  const GLIDE_H = 0.003;
  const PLINTH_H = 0.042;
  const PLINTH_INSET_X = 0.035;
  const PLINTH_INSET_Z = 0.025;
  const PLINTH_T = 0.025;

  const BOX_H = 0.345;
  const PANEL_T = 0.024;
  const BACK_T = 0.016;

  const CUSHION_H = H - GLIDE_H - PLINTH_H - BOX_H; // 0.070 m
  const CUSHION_INSET_X = 0.012;
  const CUSHION_INSET_Z = 0.010;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc2a178,
    roughness: 0.65,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.92,
    metalness: 0.0
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.95,
    metalness: 0.0
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

  // 1. Floor glides (4 small pads at y = 0)
  const plinthW = W - PLINTH_INSET_X * 2;
  const plinthD = D - PLINTH_INSET_Z * 2;
  const glideGeo = new THREE.CylinderGeometry(0.015, 0.015, GLIDE_H, 16);
  const glideOffsetX = plinthW / 2 - 0.035;
  const glideOffsetZ = plinthD / 2 - 0.035;
  const glideY = GLIDE_H / 2;

  addMesh(glideGeo, feltMat, 'glide_front_left', -glideOffsetX, glideY, glideOffsetZ);
  addMesh(glideGeo, feltMat, 'glide_front_right', glideOffsetX, glideY, glideOffsetZ);
  addMesh(glideGeo, feltMat, 'glide_back_left', -glideOffsetX, glideY, -glideOffsetZ);
  addMesh(glideGeo, feltMat, 'glide_back_right', glideOffsetX, glideY, -glideOffsetZ);

  // 2. Recessed plinth base (4 rails)
  const plinthY = GLIDE_H + PLINTH_H / 2;
  const plinthFrontBackGeo = new THREE.BoxGeometry(plinthW, PLINTH_H, PLINTH_T);
  const plinthSideD = plinthD - PLINTH_T * 2;
  const plinthSideGeo = new THREE.BoxGeometry(PLINTH_T, PLINTH_H, plinthSideD);

  addMesh(plinthFrontBackGeo, oakMat, 'plinth_front_rail', 0, plinthY, plinthD / 2 - PLINTH_T / 2);
  addMesh(plinthFrontBackGeo, oakMat, 'plinth_back_rail', 0, plinthY, -plinthD / 2 + PLINTH_T / 2);
  addMesh(plinthSideGeo, oakMat, 'plinth_left_rail', -plinthW / 2 + PLINTH_T / 2, plinthY, 0);
  addMesh(plinthSideGeo, oakMat, 'plinth_right_rail', plinthW / 2 - PLINTH_T / 2, plinthY, 0);

  // 3. Main wooden carcass
  const boxBottomY = GLIDE_H + PLINTH_H;
  const horizPanelGeo = new THREE.BoxGeometry(W, PANEL_T, D);
  const sidePanelH = BOX_H - PANEL_T * 2;
  const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, sidePanelH, D);

  // Bottom and top panels
  addMesh(horizPanelGeo, oakMat, 'carcass_bottom_panel', 0, boxBottomY + PANEL_T / 2, 0);
  addMesh(horizPanelGeo, oakMat, 'carcass_top_panel', 0, boxBottomY + BOX_H - PANEL_T / 2, 0);

  // Left and right side panels
  const sideY = boxBottomY + BOX_H / 2;
  addMesh(sidePanelGeo, oakMat, 'carcass_left_panel', -W / 2 + PANEL_T / 2, sideY, 0);
  addMesh(sidePanelGeo, oakMat, 'carcass_right_panel', W / 2 - PANEL_T / 2, sideY, 0);

  // Back panel
  const innerW = W - PANEL_T * 2;
  const backPanelGeo = new THREE.BoxGeometry(innerW, sidePanelH, BACK_T);
  addMesh(backPanelGeo, oakMat, 'carcass_back_panel', 0, sideY, -D / 2 + BACK_T / 2);

  // 4. Two vertical dividers (creating 3 equal cubbies)
  const dividerD = D - BACK_T;
  const dividerGeo = new THREE.BoxGeometry(PANEL_T, sidePanelH, dividerD);
  const cubbyW = (innerW - PANEL_T * 2) / 3;
  const dividerOffsetX = cubbyW / 2 + PANEL_T / 2;
  const dividerZ = BACK_T / 2;

  addMesh(dividerGeo, oakMat, 'cubby_divider_left', -dividerOffsetX, sideY, dividerZ);
  addMesh(dividerGeo, oakMat, 'cubby_divider_right', dividerOffsetX, sideY, dividerZ);

  // 5. Upholstered seat cushion
  const cushionW = W - CUSHION_INSET_X * 2;
  const cushionD = D - CUSHION_INSET_Z * 2;
  const cushionBaseY = boxBottomY + BOX_H;

  // Non-slip base pad under cushion
  const padH = 0.004;
  const padGeo = new THREE.BoxGeometry(cushionW - 0.02, padH, cushionD - 0.02);
  addMesh(padGeo, feltMat, 'cushion_base_pad', 0, cushionBaseY + padH / 2, 0);

  // Rounded-edge cushion body using ExtrudeGeometry
  const bevelSize = 0.016;
  const bevelThickness = 0.018;
  const coreW = cushionW - bevelSize * 2;
  const coreD = cushionD - bevelSize * 2;
  const coreH = CUSHION_H - padH - bevelThickness * 2;
  const cornerR = 0.015;

  const shape = new THREE.Shape();
  const hw = coreW / 2;
  const hd = coreD / 2;
  shape.moveTo(-hw + cornerR, -hd);
  shape.lineTo(hw - cornerR, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + cornerR);
  shape.lineTo(hw, hd - cornerR);
  shape.quadraticCurveTo(hw, hd, hw - cornerR, hd);
  shape.lineTo(-hw + cornerR, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - cornerR);
  shape.lineTo(-hw, -hd + cornerR);
  shape.quadraticCurveTo(-hw, -hd, -hw + cornerR, -hd);

  const cushionGeo = new THREE.ExtrudeGeometry(shape, {
    depth: coreH,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelThickness
  });
  cushionGeo.rotateX(-Math.PI / 2);

  addMesh(
    cushionGeo,
    fabricMat,
    'seat_cushion',
    0,
    cushionBaseY + padH + bevelThickness,
    0
  );

  return group;
}
