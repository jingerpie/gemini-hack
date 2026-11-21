function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.10;         // overall width
  const H = 0.78;         // overall height
  const D = 0.36;         // overall depth

  const TOP_T = 0.028;    // top panel thickness
  const OVERHANG = 0.022; // top overhang on sides/front/back
  const LEG_W = 0.042;    // square leg width/depth

  const FRAME_W = W - OVERHANG * 2;
  const FRAME_D = D - OVERHANG * 2;
  const LEG_H = H - TOP_T;

  const APRON_H = 0.165;  // height of upper drawer section
  const APRON_T = 0.022;  // thickness of apron panels
  const RAIL_H = 0.022;   // height of horizontal rails
  const STILE_W = 0.022;  // width of center divider between drawers

  const SHELF_Y = 0.135;  // height of lower shelf bottom
  const SHELF_T = 0.022;  // lower shelf thickness
  const SHELF_RAIL_H = 0.024;

  const DRAWER_W = (FRAME_W - LEG_W * 2 - STILE_W - 0.012) / 2;
  const DRAWER_H = APRON_H - RAIL_H * 1.4;
  const DRAWER_D = 0.020;

  const KNOB_R = 0.014;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7d5330,
    roughness: 0.55,
    metalness: 0.04,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x6b4425,
    roughness: 0.45,
    metalness: 0.05,
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

  // 1. Top panel
  addMesh(
    new THREE.BoxGeometry(W, TOP_T, D),
    woodMat,
    'top_panel',
    0,
    H - TOP_T / 2,
    0
  );

  // 2. Four legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legX = FRAME_W / 2 - LEG_W / 2;
  const legZ = FRAME_D / 2 - LEG_W / 2;
  const legY = LEG_H / 2;

  addMesh(legGeo, woodMat, 'leg_front_left', -legX, legY, legZ);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, legY, legZ);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, legY, -legZ);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, legY, -legZ);

  // 3. Upper apron (back and sides)
  const apronY = LEG_H - APRON_H / 2;
  const backApronW = FRAME_W - LEG_W * 2;
  addMesh(
    new THREE.BoxGeometry(backApronW, APRON_H, APRON_T),
    woodMat,
    'apron_back',
    0,
    apronY,
    -legZ
  );

  const sideApronD = FRAME_D - LEG_W * 2;
  const sideApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, sideApronD);
  addMesh(sideApronGeo, woodMat, 'apron_left', -legX, apronY, 0);
  addMesh(sideApronGeo, woodMat, 'apron_right', legX, apronY, 0);

  // 4. Front upper/lower rails and center stile
  addMesh(
    new THREE.BoxGeometry(backApronW, RAIL_H, APRON_T),
    woodMat,
    'apron_front_bottom_rail',
    0,
    LEG_H - APRON_H + RAIL_H / 2,
    legZ
  );

  addMesh(
    new THREE.BoxGeometry(backApronW, RAIL_H * 0.6, APRON_T),
    woodMat,
    'apron_front_top_rail',
    0,
    LEG_H - (RAIL_H * 0.6) / 2,
    legZ
  );

  addMesh(
    new THREE.BoxGeometry(STILE_W, APRON_H - RAIL_H, APRON_T),
    woodMat,
    'center_stile',
    0,
    LEG_H - (APRON_H - RAIL_H) / 2,
    legZ
  );

  // 5. Two front drawers
  const drawerY = LEG_H - RAIL_H * 0.6 - DRAWER_H / 2 - 0.002;
  const drawerX = STILE_W / 2 + DRAWER_W / 2 + 0.003;
  const drawerZ = legZ + 0.003;
  const drawerGeo = new THREE.BoxGeometry(DRAWER_W, DRAWER_H, DRAWER_D);

  addMesh(drawerGeo, woodMat, 'drawer_left_front', -drawerX, drawerY, drawerZ);
  addMesh(drawerGeo, woodMat, 'drawer_right_front', drawerX, drawerY, drawerZ);

  // 6. Drawer knobs (turned profile with stem + rounded head)
  const knobGeo = new THREE.SphereGeometry(KNOB_R, 20, 16);
  const stemGeo = new THREE.CylinderGeometry(KNOB_R * 0.45, KNOB_R * 0.55, 0.012, 16);
  stemGeo.rotateX(Math.PI / 2);

  const knobZ = drawerZ + DRAWER_D / 2 + 0.012;
  const stemZ = drawerZ + DRAWER_D / 2 + 0.006;

  addMesh(stemGeo, knobMat, 'knob_stem_left', -drawerX, drawerY, stemZ);
  addMesh(knobGeo, knobMat, 'knob_left', -drawerX, drawerY, knobZ);

  addMesh(stemGeo, knobMat, 'knob_stem_right', drawerX, drawerY, stemZ);
  addMesh(knobGeo, knobMat, 'knob_right', drawerX, drawerY, knobZ);

  // 7. Lower shelf and supporting rails
  addMesh(
    new THREE.BoxGeometry(FRAME_W - LEG_W * 0.8, SHELF_T, FRAME_D - LEG_W * 0.8),
    woodMat,
    'lower_shelf',
    0,
    SHELF_Y + SHELF_T / 2,
    0
  );

  const shelfRailY = SHELF_Y - SHELF_RAIL_H / 2 + 0.004;
  const fbRailGeo = new THREE.BoxGeometry(backApronW, SHELF_RAIL_H, APRON_T);
  addMesh(fbRailGeo, woodMat, 'shelf_rail_front', 0, shelfRailY, legZ);
  addMesh(fbRailGeo, woodMat, 'shelf_rail_back', 0, shelfRailY, -legZ);

  const lrRailGeo = new THREE.BoxGeometry(APRON_T, SHELF_RAIL_H, sideApronD);
  addMesh(lrRailGeo, woodMat, 'shelf_rail_left', -legX, shelfRailY, 0);
  addMesh(lrRailGeo, woodMat, 'shelf_rail_right', legX, shelfRailY, 0);

  return group;
}
