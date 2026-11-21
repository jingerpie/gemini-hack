function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.85;
  const H = 0.78;
  const D = 0.45;

  const LEG_H = 0.14;
  const FOOT_H = 0.008;
  const LEG_SIZE = 0.028;
  const RAIL_H = 0.026;
  const RAIL_T = 0.022;
  const BASE_INSET_X = 0.035;
  const BASE_INSET_Z = 0.03;

  const CABINET_H = H - LEG_H;
  const PANEL_T = 0.02;
  const BACK_T = 0.012;

  const DRAWER_GAP = 0.004;
  const INNER_W = W - 2 * PANEL_T;
  const INNER_H = CABINET_H - 2 * PANEL_T;
  const DRAWER_W = INNER_W - 2 * DRAWER_GAP;
  const DRAWER_H = (INNER_H - 4 * DRAWER_GAP) / 3;
  const DRAWER_T = 0.02;

  const NOTCH_W = 0.16;
  const NOTCH_H = 0.022;
  const NOTCH_SLANT = 0.014;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9b6e44,
    roughness: 0.58,
    metalness: 0.04,
  });

  const drawerMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe9,
    roughness: 0.45,
    metalness: 0.02,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x434648,
    roughness: 0.42,
    metalness: 0.65,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f20,
    roughness: 0.7,
    metalness: 0.2,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x2a2521,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Metal base: 4 legs + 4 feet + 4 apron rails
  const legX = W / 2 - BASE_INSET_X - LEG_SIZE / 2;
  const legZ = D / 2 - BASE_INSET_Z - LEG_SIZE / 2;
  const legBodyH = LEG_H - FOOT_H;

  const footGeom = new THREE.BoxGeometry(LEG_SIZE * 0.92, FOOT_H, LEG_SIZE * 0.92);
  const legGeom = new THREE.BoxGeometry(LEG_SIZE, legBodyH, LEG_SIZE);

  const legPositions = [
    ['front_left', -legX, legZ],
    ['front_right', legX, legZ],
    ['back_left', -legX, -legZ],
    ['back_right', legX, -legZ],
  ];

  for (const [label, lx, lz] of legPositions) {
    addMesh(footGeom, footMat, `foot_${label}`, lx, FOOT_H / 2, lz);
    addMesh(legGeom, metalMat, `leg_${label}`, lx, FOOT_H + legBodyH / 2, lz);
  }

  const railY = LEG_H - RAIL_H / 2;
  const frontBackRailW = legX * 2 - LEG_SIZE;
  const sideRailD = legZ * 2 - LEG_SIZE;

  const fbRailGeom = new THREE.BoxGeometry(frontBackRailW, RAIL_H, RAIL_T);
  const sideRailGeom = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailD);

  addMesh(fbRailGeom, metalMat, 'base_rail_front', 0, railY, legZ);
  addMesh(fbRailGeom, metalMat, 'base_rail_back', 0, railY, -legZ);
  addMesh(sideRailGeom, metalMat, 'base_rail_left', -legX, railY, 0);
  addMesh(sideRailGeom, metalMat, 'base_rail_right', legX, railY, 0);

  // Cabinet carcass
  const topBottomGeom = new THREE.BoxGeometry(W, PANEL_T, D);
  const sidePanelGeom = new THREE.BoxGeometry(PANEL_T, CABINET_H - 2 * PANEL_T, D);
  const backPanelGeom = new THREE.BoxGeometry(INNER_W, INNER_H, BACK_T);

  addMesh(topBottomGeom, woodMat, 'cabinet_bottom', 0, LEG_H + PANEL_T / 2, 0);
  addMesh(topBottomGeom, woodMat, 'cabinet_top', 0, H - PANEL_T / 2, 0);
  addMesh(sidePanelGeom, woodMat, 'cabinet_left', -W / 2 + PANEL_T / 2, LEG_H + CABINET_H / 2, 0);
  addMesh(sidePanelGeom, woodMat, 'cabinet_right', W / 2 - PANEL_T / 2, LEG_H + CABINET_H / 2, 0);
  addMesh(backPanelGeom, woodMat, 'cabinet_back', 0, LEG_H + CABINET_H / 2, -D / 2 + BACK_T / 2);

  // Drawer front shape with top-center finger pull cutout
  const hw = DRAWER_W / 2;
  const hh = DRAWER_H / 2;
  const nhw = NOTCH_W / 2;

  const drawerShape = new THREE.Shape();
  drawerShape.moveTo(-hw, -hh);
  drawerShape.lineTo(hw, -hh);
  drawerShape.lineTo(hw, hh);
  drawerShape.lineTo(nhw, hh);
  drawerShape.lineTo(nhw - NOTCH_SLANT, hh - NOTCH_H);
  drawerShape.lineTo(-nhw + NOTCH_SLANT, hh - NOTCH_H);
  drawerShape.lineTo(-nhw, hh);
  drawerShape.lineTo(-hw, hh);
  drawerShape.closePath();

  const drawerGeom = new THREE.ExtrudeGeometry(drawerShape, {
    depth: DRAWER_T,
    bevelEnabled: false,
    curveSegments: 8,
  });
  drawerGeom.translate(0, 0, -DRAWER_T / 2);

  const recessGeom = new THREE.BoxGeometry(INNER_W, DRAWER_H, 0.01);
  const drawerZ = D / 2 - DRAWER_T / 2 - 0.004;
  const recessZ = drawerZ - DRAWER_T / 2 - 0.006;

  for (let i = 0; i < 3; i++) {
    const drawerY =
      LEG_H + PANEL_T + DRAWER_GAP + DRAWER_H / 2 + i * (DRAWER_H + DRAWER_GAP);
    const label = i === 0 ? 'bottom' : i === 1 ? 'middle' : 'top';
    addMesh(drawerGeom, drawerMat, `drawer_front_${label}`, 0, drawerY, drawerZ);
    addMesh(recessGeom, recessMat, `drawer_recess_${label}`, 0, drawerY, recessZ);
  }

  return group;
}
