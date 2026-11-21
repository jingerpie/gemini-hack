function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.50;
  const H = 0.82;
  const D = 0.48;

  const LEG_H = 0.13;
  const LEG_W = 0.036;
  const LEG_D = 0.036;
  const APRON_H = 0.028;
  const APRON_T = 0.024;

  const PANEL_T = 0.022;
  const CARCASS_H = H - LEG_H;
  const CARCASS_Y = LEG_H + CARCASS_H / 2;

  const DRAWER_GAP = 0.005;
  const DRAWER_T = 0.020;
  const COLS = 2;
  const ROWS = 3;

  const INNER_W = W - 2 * PANEL_T;
  const INNER_H = CARCASS_H - 2 * PANEL_T;
  const DRAWER_W = (INNER_W - (COLS + 1) * DRAWER_GAP) / COLS;
  const DRAWER_H = (INNER_H - (ROWS + 1) * DRAWER_GAP) / ROWS;

  const CUTOUT_W_TOP = 0.13;
  const CUTOUT_W_BOT = 0.105;
  const CUTOUT_H = 0.016;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8966e,
    roughness: 0.62,
    metalness: 0.02
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x3a2b1c,
    roughness: 0.85,
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

  // 1. Legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const legX = W / 2 - LEG_W / 2 - 0.004;
  const legZ = D / 2 - LEG_D / 2 - 0.004;
  const legY = LEG_H / 2;

  addMesh(legGeo, woodMat, 'leg_front_left', -legX, legY, legZ);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, legY, legZ);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, legY, -legZ);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, legY, -legZ);

  // 2. Apron rails
  const apronY = LEG_H - APRON_H / 2;
  const apronFrontBackGeo = new THREE.BoxGeometry(W - 2 * LEG_W, APRON_H, APRON_T);
  const apronSideGeo = new THREE.BoxGeometry(APRON_T, APRON_H, D - 2 * LEG_D);

  addMesh(apronFrontBackGeo, woodMat, 'apron_front', 0, apronY, legZ);
  addMesh(apronFrontBackGeo, woodMat, 'apron_back', 0, apronY, -legZ);
  addMesh(apronSideGeo, woodMat, 'apron_left', -legX, apronY, 0);
  addMesh(apronSideGeo, woodMat, 'apron_right', legX, apronY, 0);

  // 3. Carcass
  const topBotGeo = new THREE.BoxGeometry(W, PANEL_T, D);
  addMesh(topBotGeo, woodMat, 'carcass_top', 0, H - PANEL_T / 2, 0);
  addMesh(topBotGeo, woodMat, 'carcass_bottom', 0, LEG_H + PANEL_T / 2, 0);

  const sideGeo = new THREE.BoxGeometry(PANEL_T, CARCASS_H - 2 * PANEL_T, D);
  addMesh(sideGeo, woodMat, 'carcass_left', -W / 2 + PANEL_T / 2, CARCASS_Y, 0);
  addMesh(sideGeo, woodMat, 'carcass_right', W / 2 - PANEL_T / 2, CARCASS_Y, 0);

  const backGeo = new THREE.BoxGeometry(INNER_W, INNER_H, PANEL_T);
  addMesh(backGeo, woodMat, 'carcass_back', 0, CARCASS_Y, -D / 2 + PANEL_T / 2);

  const dividerGeo = new THREE.BoxGeometry(PANEL_T * 0.8, INNER_H, D - PANEL_T - DRAWER_T);
  addMesh(dividerGeo, woodMat, 'carcass_center_divider', 0, CARCASS_Y, -DRAWER_T / 2);

  // 4. Drawer front geometry with top-center recessed pull cutout
  const drawerShape = new THREE.Shape();
  const hw = DRAWER_W / 2;
  const hh = DRAWER_H / 2;
  const cwTop = CUTOUT_W_TOP / 2;
  const cwBot = CUTOUT_W_BOT / 2;

  drawerShape.moveTo(-hw, -hh);
  drawerShape.lineTo(hw, -hh);
  drawerShape.lineTo(hw, hh);
  drawerShape.lineTo(cwTop, hh);
  drawerShape.lineTo(cwBot, hh - CUTOUT_H);
  drawerShape.lineTo(-cwBot, hh - CUTOUT_H);
  drawerShape.lineTo(-cwTop, hh);
  drawerShape.lineTo(-hw, hh);
  drawerShape.closePath();

  const drawerGeo = new THREE.ExtrudeGeometry(drawerShape, {
    depth: DRAWER_T,
    bevelEnabled: false
  });
  drawerGeo.translate(0, 0, -DRAWER_T / 2);

  const recessGeo = new THREE.BoxGeometry(CUTOUT_W_TOP + 0.01, CUTOUT_H + 0.008, 0.012);

  const drawerZ = D / 2 - DRAWER_T / 2 - 0.003;
  const recessZ = drawerZ - DRAWER_T / 2 - 0.004;

  for (let col = 0; col < COLS; col++) {
    const x = -INNER_W / 2 + DRAWER_GAP + DRAWER_W / 2 + col * (DRAWER_W + DRAWER_GAP);
    for (let row = 0; row < ROWS; row++) {
      const y = H - PANEL_T - DRAWER_GAP - DRAWER_H / 2 - row * (DRAWER_H + DRAWER_GAP);
      addMesh(drawerGeo, woodMat, `drawer_${col}_${row}`, x, y, drawerZ);
      addMesh(
        recessGeo,
        recessMat,
        `drawer_pull_recess_${col}_${row}`,
        x,
        y + hh - CUTOUT_H / 2 - 0.002,
        recessZ
      );
    }
  }

  return group;
}
