function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.25;
  const H = 0.78;
  const D = 0.40;

  const TOP_T = 0.024;
  const LEG_W = 0.042;
  const APRON_H = 0.135;
  const RAIL_H = 0.024;
  const STRETCHER_H = 0.032;
  const STRETCHER_T = 0.026;
  const STRETCHER_Y = 0.135;

  const INNER_W = W - 2 * LEG_W;
  const INNER_D = D - 2 * LEG_W;

  const DRAWER_W = 0.56;
  const SIDE_APRON_W = (INNER_W - DRAWER_W) / 2;
  const GAP = 0.003;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9b9082,
    roughness: 0.72,
    metalness: 0.02,
  });

  const recessedMat = new THREE.MeshStandardMaterial({
    color: 0x7d7366,
    roughness: 0.8,
    metalness: 0.02,
  });

  const shadowMat = new THREE.MeshStandardMaterial({
    color: 0x2b2620,
    roughness: 0.9,
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

  // 1. Table Top
  const topGeo = new THREE.BoxGeometry(W, TOP_T, D);
  addMesh(topGeo, woodMat, 'table_top', 0, H - TOP_T / 2, 0);

  // 2. Four Corner Legs
  const legH = H - TOP_T;
  const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;

  addMesh(legGeo, woodMat, 'leg_front_left', -legX, legH / 2, legZ);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, legH / 2, legZ);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, legH / 2, -legZ);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, legH / 2, -legZ);

  // 3. Front Apron & Drawer
  const apronY = H - TOP_T - APRON_H / 2;
  const frontZ = D / 2 - LEG_W / 2;

  const sideApronFrontGeo = new THREE.BoxGeometry(SIDE_APRON_W - GAP, APRON_H, 0.022);
  addMesh(
    sideApronFrontGeo,
    woodMat,
    'apron_front_left',
    -DRAWER_W / 2 - SIDE_APRON_W / 2 - GAP / 2,
    apronY,
    frontZ
  );
  addMesh(
    sideApronFrontGeo,
    woodMat,
    'apron_front_right',
    DRAWER_W / 2 + SIDE_APRON_W / 2 + GAP / 2,
    apronY,
    frontZ
  );

  // Center Drawer Front
  const drawerGeo = new THREE.BoxGeometry(DRAWER_W - GAP * 2, APRON_H - GAP, 0.024);
  addMesh(drawerGeo, woodMat, 'drawer_front', 0, apronY + GAP / 2, frontZ + 0.002);

  // Drawer finger-pull recess at bottom center
  const pullGeo = new THREE.BoxGeometry(0.11, 0.012, 0.012);
  addMesh(
    pullGeo,
    shadowMat,
    'drawer_pull_recess',
    0,
    H - TOP_T - APRON_H + 0.008,
    frontZ + 0.01
  );

  // Lower Front Rail under apron
  const frontRailGeo = new THREE.BoxGeometry(INNER_W, RAIL_H, 0.024);
  addMesh(
    frontRailGeo,
    woodMat,
    'apron_front_rail',
    0,
    H - TOP_T - APRON_H - RAIL_H / 2,
    frontZ
  );

  // 4. Side Aprons (recessed panel + bottom side rail)
  const sidePanelGeo = new THREE.BoxGeometry(0.02, APRON_H, INNER_D);
  const sideX = W / 2 - LEG_W / 2 - 0.014;
  addMesh(sidePanelGeo, recessedMat, 'apron_side_left', -sideX, apronY, 0);
  addMesh(sidePanelGeo, recessedMat, 'apron_side_right', sideX, apronY, 0);

  const sideRailGeo = new THREE.BoxGeometry(LEG_W * 0.75, RAIL_H, INNER_D);
  const sideRailY = H - TOP_T - APRON_H - RAIL_H / 2;
  addMesh(sideRailGeo, woodMat, 'apron_side_rail_bottom_left', -legX, sideRailY, 0);
  addMesh(sideRailGeo, woodMat, 'apron_side_rail_bottom_right', legX, sideRailY, 0);

  // 5. Back Apron
  const backApronGeo = new THREE.BoxGeometry(INNER_W, APRON_H + RAIL_H, 0.022);
  addMesh(
    backApronGeo,
    woodMat,
    'apron_back',
    0,
    H - TOP_T - (APRON_H + RAIL_H) / 2,
    -legZ
  );

  // 6. Lower Stretchers
  const sideStretcherGeo = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, INNER_D);
  addMesh(sideStretcherGeo, woodMat, 'stretcher_left', -legX, STRETCHER_Y, 0);
  addMesh(sideStretcherGeo, woodMat, 'stretcher_right', legX, STRETCHER_Y, 0);

  const backStretcherGeo = new THREE.BoxGeometry(INNER_W, STRETCHER_H, STRETCHER_T);
  addMesh(backStretcherGeo, woodMat, 'stretcher_back', 0, STRETCHER_Y, -legZ);

  return group;
}
