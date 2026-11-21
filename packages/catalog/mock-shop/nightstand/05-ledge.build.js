function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.52;
  const D = 0.42;
  const H = 0.56;

  const BOX_H = 0.21;
  const PANEL_T = 0.022;
  const LEG_H = H - BOX_H;
  const LEG_TOP = 0.036;
  const LEG_BOT = 0.024;
  const LEG_INSET = 0.012;

  const RAIL_H = 0.028;
  const RAIL_T = 0.020;

  const SHELF_Y = 0.13;
  const SHELF_T = 0.018;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8aa82,
    roughness: 0.65,
    metalness: 0.02,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8f7352,
    roughness: 0.75,
    metalness: 0.02,
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

  // --- Upper Carcass (Drawer Box) ---
  const boxCenterY = H - BOX_H / 2;

  // Top & Bottom panels (fit between left and right panels)
  const innerW = W - 2 * PANEL_T;
  const horizGeo = new THREE.BoxGeometry(innerW, PANEL_T, D);
  addMesh(horizGeo, oakMat, 'carcass_top', 0, H - PANEL_T / 2, 0);
  addMesh(horizGeo, oakMat, 'carcass_bottom', 0, LEG_H + PANEL_T / 2, 0);

  // Left & Right panels
  const sideGeo = new THREE.BoxGeometry(PANEL_T, BOX_H, D);
  addMesh(sideGeo, oakMat, 'carcass_left', -W / 2 + PANEL_T / 2, boxCenterY, 0);
  addMesh(sideGeo, oakMat, 'carcass_right', W / 2 - PANEL_T / 2, boxCenterY, 0);

  // Back panel
  const innerH = BOX_H - 2 * PANEL_T;
  const backGeo = new THREE.BoxGeometry(innerW, innerH, PANEL_T);
  addMesh(backGeo, oakMat, 'carcass_back', 0, boxCenterY, -D / 2 + PANEL_T / 2);

  // --- Drawer Front with Finger-Pull Cutout ---
  const gap = 0.003;
  const dfW = innerW - 2 * gap;
  const dfH = innerH - 2 * gap;
  const dfT = 0.020;

  const pullW = 0.12;
  const pullD = 0.020;
  const pullR = 0.010;

  const dfShape = new THREE.Shape();
  dfShape.moveTo(-dfW / 2, -dfH / 2);
  dfShape.lineTo(dfW / 2, -dfH / 2);
  dfShape.lineTo(dfW / 2, dfH / 2);
  dfShape.lineTo(pullW / 2, dfH / 2);
  dfShape.quadraticCurveTo(pullW / 2 - pullR, dfH / 2, pullW / 2 - pullR, dfH / 2 - pullD);
  dfShape.lineTo(-pullW / 2 + pullR, dfH / 2 - pullD);
  dfShape.quadraticCurveTo(-pullW / 2 + pullR, dfH / 2, -pullW / 2, dfH / 2);
  dfShape.lineTo(-dfW / 2, dfH / 2);
  dfShape.closePath();

  const dfGeo = new THREE.ExtrudeGeometry(dfShape, {
    depth: dfT,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
  });
  dfGeo.translate(0, 0, -dfT / 2);

  const dfZ = D / 2 - dfT / 2 - 0.004;
  addMesh(dfGeo, oakMat, 'drawer_front', 0, boxCenterY, dfZ);

  // Recessed dark backing behind the finger pull
  const recessGeo = new THREE.BoxGeometry(innerW - 0.01, innerH - 0.01, 0.01);
  addMesh(recessGeo, oakDarkMat, 'drawer_recess', 0, boxCenterY, dfZ - dfT / 2 - 0.006);

  // --- Lower Base (4 Tapered Legs) ---
  const legGeo = new THREE.CylinderGeometry(
    LEG_TOP / Math.SQRT2,
    LEG_BOT / Math.SQRT2,
    LEG_H,
    4,
    1
  );

  const legX = W / 2 - LEG_INSET - LEG_TOP / 2;
  const legZ = D / 2 - LEG_INSET - LEG_TOP / 2;

  addMesh(legGeo, oakMat, 'leg_fl', -legX, LEG_H / 2, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_fr', legX, LEG_H / 2, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_bl', -legX, LEG_H / 2, -legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_br', legX, LEG_H / 2, -legZ, 0, Math.PI / 4, 0);

  // --- Top Apron Rails ---
  const railY = LEG_H - RAIL_H / 2;
  const fbRailW = 2 * legX - LEG_TOP + 0.004;
  const lrRailD = 2 * legZ - LEG_TOP + 0.004;

  const fbApronGeo = new THREE.BoxGeometry(fbRailW, RAIL_H, RAIL_T);
  addMesh(fbApronGeo, oakMat, 'apron_front', 0, railY, legZ);
  addMesh(fbApronGeo, oakMat, 'apron_back', 0, railY, -legZ);

  const lrApronGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, lrRailD);
  addMesh(lrApronGeo, oakMat, 'apron_left', -legX, railY, 0);
  addMesh(lrApronGeo, oakMat, 'apron_right', legX, railY, 0);

  // --- Lower Open Shelf ---
  const shelfW = 2 * legX - LEG_TOP + 0.008;
  const shelfD = 2 * legZ - LEG_TOP + 0.008;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_T, shelfD);
  addMesh(shelfGeo, oakMat, 'lower_shelf', 0, SHELF_Y, 0);

  // Shelf edge rails
  const shelfRailGeoFB = new THREE.BoxGeometry(fbRailW, SHELF_T, RAIL_T);
  addMesh(shelfRailGeoFB, oakMat, 'shelf_rail_front', 0, SHELF_Y, legZ);
  addMesh(shelfRailGeoFB, oakMat, 'shelf_rail_back', 0, SHELF_Y, -legZ);

  const shelfRailGeoLR = new THREE.BoxGeometry(RAIL_T, SHELF_T, lrRailD);
  addMesh(shelfRailGeoLR, oakMat, 'shelf_rail_left', -legX, SHELF_Y, 0);
  addMesh(shelfRailGeoLR, oakMat, 'shelf_rail_right', legX, SHELF_Y, 0);

  return group;
}
