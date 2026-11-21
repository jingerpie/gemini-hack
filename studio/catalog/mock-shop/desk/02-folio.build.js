function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.80;
  const H = 1.12;
  const D = 0.42;
  const CABINET_H = 0.44;
  const LEG_H = H - CABINET_H; // 0.68
  const APRON_H = 0.07;
  const APRON_T = 0.022;
  const PANEL_T = 0.02;
  const LEG_TOP_W = 0.045;
  const LEG_BOT_W = 0.025;
  const LEG_INSET = 0.008;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.55,
    metalness: 0.04,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9c7244,
    roughness: 0.6,
    metalness: 0.04,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.4,
    metalness: 0.8,
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

  // 1. Tapered square legs (4-sided cylinder rotated 45 deg)
  const legRTop = (LEG_TOP_W * Math.SQRT2) / 2;
  const legRBot = (LEG_BOT_W * Math.SQRT2) / 2;
  const legGeo = new THREE.CylinderGeometry(legRTop, legRBot, LEG_H, 4);
  const legX = W / 2 - LEG_TOP_W / 2 - LEG_INSET;
  const legZ = D / 2 - LEG_TOP_W / 2 - LEG_INSET;
  const legY = LEG_H / 2;

  addMesh(legGeo, oakMat, 'leg_front_left', -legX, legY, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_front_right', legX, legY, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_back_left', -legX, legY, -legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_back_right', legX, legY, -legZ, 0, Math.PI / 4, 0);

  // 2. Apron frame under the cabinet
  const apronY = LEG_H - APRON_H / 2;
  const apronFrontBackW = W - 2 * LEG_INSET - LEG_TOP_W;
  const apronSideD = D - 2 * LEG_INSET - LEG_TOP_W;

  const apronFBGeo = new THREE.BoxGeometry(apronFrontBackW, APRON_H, APRON_T);
  addMesh(apronFBGeo, oakMat, 'apron_front', 0, apronY, legZ);
  addMesh(apronFBGeo, oakMat, 'apron_back', 0, apronY, -legZ);

  const apronSideGeo = new THREE.BoxGeometry(APRON_T, APRON_H, apronSideD);
  addMesh(apronSideGeo, oakMat, 'apron_left', -legX, apronY, 0);
  addMesh(apronSideGeo, oakMat, 'apron_right', legX, apronY, 0);

  // 3. Upper cabinet box
  const cabCenterY = LEG_H + CABINET_H / 2;
  const innerH = CABINET_H - 2 * PANEL_T;
  const innerW = W - 2 * PANEL_T;
  const innerD = D - PANEL_T; // back panel sits inside/flush at -Z, lid at +Z

  // Side panels (full height & depth)
  const sideGeo = new THREE.BoxGeometry(PANEL_T, CABINET_H, D);
  addMesh(sideGeo, oakMat, 'cabinet_left', -W / 2 + PANEL_T / 2, cabCenterY, 0);
  addMesh(sideGeo, oakMat, 'cabinet_right', W / 2 - PANEL_T / 2, cabCenterY, 0);

  // Top and bottom panels (between side panels)
  const topBotGeo = new THREE.BoxGeometry(innerW, PANEL_T, D);
  addMesh(topBotGeo, oakMat, 'cabinet_bottom', 0, LEG_H + PANEL_T / 2, 0);
  addMesh(topBotGeo, oakMat, 'cabinet_top', 0, H - PANEL_T / 2, 0);

  // Back panel
  const backGeo = new THREE.BoxGeometry(innerW, innerH, PANEL_T);
  addMesh(backGeo, oakMat, 'cabinet_back', 0, cabCenterY, -D / 2 + PANEL_T / 2);

  // 4. Drop-front lid (closed pose, flush at +Z between side/top/bottom panels)
  const lidW = innerW - 0.002;
  const lidH = innerH - 0.002;
  const lidGeo = new THREE.BoxGeometry(lidW, lidH, PANEL_T);
  addMesh(lidGeo, oakMat, 'drop_front_lid', 0, cabCenterY, D / 2 - PANEL_T / 2);

  // Finger pull recess at top center of the closed lid
  const pullGeo = new THREE.BoxGeometry(0.08, 0.012, 0.006);
  addMesh(
    pullGeo,
    oakDarkMat,
    'lid_handle_recess',
    0,
    LEG_H + CABINET_H - PANEL_T - 0.012,
    D / 2 - 0.002
  );

  // 5. Small wall-mounting bracket at top back center
  const bracketW = 0.024;
  const bracketH = 0.028;
  const bracketT = 0.008;
  const bracketGeo = new THREE.BoxGeometry(bracketW, bracketH, bracketT);
  addMesh(
    bracketGeo,
    oakMat,
    'wall_mount_bracket',
    0,
    H + bracketH / 2 - 0.004,
    -D / 2 + PANEL_T + bracketT / 2
  );

  const keyholeGeo = new THREE.CylinderGeometry(0.004, 0.004, bracketT + 0.002, 12);
  addMesh(
    keyholeGeo,
    metalMat,
    'wall_mount_keyhole',
    0,
    H + bracketH / 2 - 0.002,
    -D / 2 + PANEL_T + bracketT / 2,
    Math.PI / 2,
    0,
    0
  );

  return group;
}
