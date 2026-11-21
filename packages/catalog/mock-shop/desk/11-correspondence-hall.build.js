function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.35;
  const D = 0.72;
  const H = 0.76;

  const TOP_THICK = 0.032;
  const TOP_OVERHANG = 0.025;
  const INSET_W = W - 0.16;
  const INSET_D = D - 0.14;
  const INSET_THICK = 0.004;

  const BODY_W = W - TOP_OVERHANG * 2;
  const BODY_D = D - TOP_OVERHANG * 2;
  const LEG_TOP_W = 0.052;
  const LEG_BOT_W = 0.032;
  const LEG_H = H - TOP_THICK;

  const SIDE_APRON_H = 0.21;
  const CENTER_APRON_H = 0.11;
  const STRETCHER_Y = 0.18;
  const STRETCHER_H = 0.028;
  const STRETCHER_W = 0.024;

  const DRAWER_THICK = 0.018;
  const SIDE_DRAWER_W = 0.31;
  const CENTER_DRAWER_W = BODY_W - LEG_TOP_W * 2 - SIDE_DRAWER_W * 2 - 0.04;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3820,
    roughness: 0.45,
    metalness: 0.05
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x452815,
    roughness: 0.55,
    metalness: 0.05
  });

  const insetMat = new THREE.MeshStandardMaterial({
    color: 0x6b4428,
    roughness: 0.65,
    metalness: 0.02
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8c7343,
    roughness: 0.35,
    metalness: 0.8
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

  // 1. Desktop
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, woodMat, 'desk_top', 0, H - TOP_THICK / 2, 0);

  const insetGeo = new THREE.BoxGeometry(INSET_W, INSET_THICK, INSET_D);
  addMesh(insetGeo, insetMat, 'desk_top_inset', 0, H + INSET_THICK / 2 - 0.001, 0);

  const trimGeo = new THREE.BoxGeometry(BODY_W + 0.012, 0.014, BODY_D + 0.012);
  addMesh(trimGeo, darkWoodMat, 'desk_top_trim', 0, H - TOP_THICK - 0.007, 0);

  // 2. Four Tapered Legs (using CylinderGeometry with 4 radial segments rotated 45 deg)
  const legRadiusTop = (LEG_TOP_W * Math.SQRT2) / 2;
  const legRadiusBot = (LEG_BOT_W * Math.SQRT2) / 2;
  const legGeo = new THREE.CylinderGeometry(legRadiusTop, legRadiusBot, LEG_H, 4);
  const legOffsetX = BODY_W / 2 - LEG_TOP_W / 2;
  const legOffsetZ = BODY_D / 2 - LEG_TOP_W / 2;

  const legPositions = [
    ['leg_front_left', -legOffsetX, legOffsetZ],
    ['leg_front_right', legOffsetX, legOffsetZ],
    ['leg_back_left', -legOffsetX, -legOffsetZ],
    ['leg_back_right', legOffsetX, -legOffsetZ]
  ];

  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, woodMat, name, lx, LEG_H / 2, lz, 0, Math.PI / 4, 0);
  }

  // 3. Stretchers (Left, Right, Back)
  const sideStretcherLen = BODY_D - LEG_TOP_W;
  const sideStretcherGeo = new THREE.BoxGeometry(STRETCHER_W, STRETCHER_H, sideStretcherLen);
  addMesh(sideStretcherGeo, woodMat, 'stretcher_left', -legOffsetX, STRETCHER_Y, 0);
  addMesh(sideStretcherGeo, woodMat, 'stretcher_right', legOffsetX, STRETCHER_Y, 0);

  const backStretcherLen = BODY_W - LEG_TOP_W;
  const backStretcherGeo = new THREE.BoxGeometry(backStretcherLen, STRETCHER_H, STRETCHER_W);
  addMesh(backStretcherGeo, woodMat, 'stretcher_back', 0, STRETCHER_Y, -legOffsetZ);

  // 4. Side & Back Apron Panels
  const sidePanelGeo = new THREE.BoxGeometry(0.022, SIDE_APRON_H, BODY_D - LEG_TOP_W * 2);
  const apronY = H - TOP_THICK - SIDE_APRON_H / 2;
  addMesh(sidePanelGeo, woodMat, 'apron_side_left', -legOffsetX, apronY, 0);
  addMesh(sidePanelGeo, woodMat, 'apron_side_right', legOffsetX, apronY, 0);

  const backPanelGeo = new THREE.BoxGeometry(BODY_W - LEG_TOP_W * 2, SIDE_APRON_H, 0.022);
  addMesh(backPanelGeo, woodMat, 'apron_back', 0, apronY, -legOffsetZ);

  // Inner vertical dividers flanking the kneehole
  const dividerX = CENTER_DRAWER_W / 2 + 0.012;
  const dividerGeo = new THREE.BoxGeometry(0.02, SIDE_APRON_H, BODY_D - LEG_TOP_W);
  addMesh(dividerGeo, darkWoodMat, 'kneehole_divider_left', -dividerX, apronY, 0);
  addMesh(dividerGeo, darkWoodMat, 'kneehole_divider_right', dividerX, apronY, 0);

  // 5. Drawers & Brass Hardware
  const frontZ = BODY_D / 2 - 0.012;
  const pullGeo = new THREE.CapsuleGeometry(0.004, 0.024, 4, 8);
  const escutcheonGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12);

  function addDrawer(name, x, y, w, h, numPulls) {
    const dGeo = new THREE.BoxGeometry(w, h, DRAWER_THICK);
    addMesh(dGeo, woodMat, name, x, y, frontZ);

    if (numPulls === 1) {
      addMesh(pullGeo, brassMat, `${name}_pull`, x, y - 0.004, frontZ + DRAWER_THICK / 2 + 0.005);
    } else if (numPulls === 2) {
      const pullOffset = w * 0.28;
      addMesh(pullGeo, brassMat, `${name}_pull_left`, x - pullOffset, y - 0.004, frontZ + DRAWER_THICK / 2 + 0.005);
      addMesh(pullGeo, brassMat, `${name}_pull_right`, x + pullOffset, y - 0.004, frontZ + DRAWER_THICK / 2 + 0.005);
      addMesh(escutcheonGeo, brassMat, `${name}_keyhole`, x, y + 0.008, frontZ + DRAWER_THICK / 2 + 0.002, Math.PI / 2, 0, 0);
    }
  }

  // Left 2 drawers
  const leftDrawerX = -dividerX - 0.01 - SIDE_DRAWER_W / 2;
  const topDrawerH = 0.082;
  const botDrawerH = 0.102;
  const topDrawerY = H - TOP_THICK - 0.012 - topDrawerH / 2;
  const botDrawerY = topDrawerY - topDrawerH / 2 - 0.012 - botDrawerH / 2;

  addDrawer('drawer_left_top', leftDrawerX, topDrawerY, SIDE_DRAWER_W, topDrawerH, 1);
  addDrawer('drawer_left_bottom', leftDrawerX, botDrawerY, SIDE_DRAWER_W, botDrawerH, 1);

  // Right 2 drawers
  const rightDrawerX = dividerX + 0.01 + SIDE_DRAWER_W / 2;
  addDrawer('drawer_right_top', rightDrawerX, topDrawerY, SIDE_DRAWER_W, topDrawerH, 1);
  addDrawer('drawer_right_bottom', rightDrawerX, botDrawerY, SIDE_DRAWER_W, botDrawerH, 1);

  // Center drawer
  const centerDrawerH = CENTER_APRON_H - 0.022;
  const centerDrawerY = H - TOP_THICK - 0.012 - centerDrawerH / 2;
  addDrawer('drawer_center', 0, centerDrawerY, CENTER_DRAWER_W, centerDrawerH, 2);

  // 6. Kneehole Corner Brackets
  const bracketShape = new THREE.Shape();
  bracketShape.moveTo(0, 0);
  bracketShape.lineTo(0.055, 0);
  bracketShape.quadraticCurveTo(0.015, -0.015, 0, -0.055);
  bracketShape.closePath();

  const bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
    depth: 0.018,
    bevelEnabled: false
  });
  const bracketY = H - TOP_THICK - CENTER_APRON_H;
  addMesh(bracketGeo, darkWoodMat, 'kneehole_bracket_left', -CENTER_DRAWER_W / 2, bracketY, frontZ - 0.009);
  addMesh(bracketGeo, darkWoodMat, 'kneehole_bracket_right', CENTER_DRAWER_W / 2, bracketY, frontZ + 0.009, 0, Math.PI, 0);

  return group;
}
