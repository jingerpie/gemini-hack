function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.56;          // Width
  const H = 0.18;          // Height
  const D = 0.34;          // Depth
  const T = 0.018;         // Wood panel thickness
  const DRAWER_GAP = 0.004; // Reveal gap around drawer front
  const DRAWER_INSET = 0.008; // How far drawer front is recessed from front edge
  const NOTCH_R = 0.026;   // Rear cable cutout radius

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6f44,
    roughness: 0.62,
    metalness: 0.02
  });

  const woodInnerMat = new THREE.MeshStandardMaterial({
    color: 0x875e38,
    roughness: 0.72,
    metalness: 0.02
  });

  const drawerFrontMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede6,
    roughness: 0.45,
    metalness: 0.02
  });

  const drawerRecessMat = new THREE.MeshStandardMaterial({
    color: 0xe3dfd6,
    roughness: 0.55,
    metalness: 0.02
  });

  const cleatMat = new THREE.MeshStandardMaterial({
    color: 0x6e4c2c,
    roughness: 0.8,
    metalness: 0.05
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

  // 1. Top panel with semicircular rear cable notch
  const topShape = new THREE.Shape();
  topShape.moveTo(-W / 2, -D / 2);
  topShape.lineTo(-NOTCH_R, -D / 2);
  topShape.absarc(0, -D / 2, NOTCH_R, Math.PI, 0, true);
  topShape.lineTo(W / 2, -D / 2);
  topShape.lineTo(W / 2, D / 2);
  topShape.lineTo(-W / 2, D / 2);
  topShape.closePath();

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 24
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, woodMat, 'top_panel', 0, H, 0);

  // 2. Bottom panel
  const bottomGeo = new THREE.BoxGeometry(W, T, D);
  addMesh(bottomGeo, woodMat, 'bottom_panel', 0, T / 2, 0);

  // 3. Left and Right side panels
  const sideH = H - 2 * T;
  const sideGeo = new THREE.BoxGeometry(T, sideH, D);
  addMesh(sideGeo, woodMat, 'left_panel', -W / 2 + T / 2, H / 2, 0);
  addMesh(sideGeo, woodMat, 'right_panel', W / 2 - T / 2, H / 2, 0);

  // 4. Back panel
  const innerW = W - 2 * T;
  const backGeo = new THREE.BoxGeometry(innerW, sideH, T);
  addMesh(backGeo, woodInnerMat, 'back_panel', 0, H / 2, -D / 2 + T / 2);

  // 5. Rear wall mounting cleat (flush with back)
  const cleatGeo = new THREE.BoxGeometry(innerW * 0.85, 0.035, 0.012);
  addMesh(cleatGeo, cleatMat, 'wall_mounting_cleat', 0, H - T - 0.025, -D / 2 + 0.006);

  // 6. Drawer front (matte off-white with bottom finger-pull recess)
  const dfW = innerW - 2 * DRAWER_GAP;
  const fullDfH = sideH - 2 * DRAWER_GAP;
  const pullH = 0.018;
  const mainDfH = fullDfH - pullH;
  const dfDepth = 0.018;
  const dfZ = D / 2 - DRAWER_INSET - dfDepth / 2;

  const mainDfGeo = new THREE.BoxGeometry(dfW, mainDfH, dfDepth);
  addMesh(
    mainDfGeo,
    drawerFrontMat,
    'drawer_front_main',
    0,
    T + DRAWER_GAP + pullH + mainDfH / 2,
    dfZ
  );

  // Recessed lower lip for finger pull
  const pullDepth = 0.014;
  const pullGeo = new THREE.BoxGeometry(dfW, pullH, pullDepth);
  addMesh(
    pullGeo,
    drawerRecessMat,
    'drawer_front_pull_recess',
    0,
    T + DRAWER_GAP + pullH / 2,
    dfZ - (dfDepth - pullDepth) / 2 - 0.004
  );

  // 7. Inner drawer box (attached behind drawer front)
  const boxD = D - T - DRAWER_INSET - dfDepth - 0.015;
  const boxH = fullDfH - 0.016;
  const boxT = 0.012;
  const boxZ = dfZ - dfDepth / 2 - boxD / 2;
  const boxY = T + DRAWER_GAP + 0.008 + boxH / 2;

  const boxSideGeo = new THREE.BoxGeometry(boxT, boxH, boxD);
  addMesh(boxSideGeo, woodInnerMat, 'drawer_box_left', -dfW / 2 + boxT / 2 + 0.004, boxY, boxZ);
  addMesh(boxSideGeo, woodInnerMat, 'drawer_box_right', dfW / 2 - boxT / 2 - 0.004, boxY, boxZ);

  const boxBackGeo = new THREE.BoxGeometry(dfW - 0.008 - 2 * boxT, boxH, boxT);
  addMesh(boxBackGeo, woodInnerMat, 'drawer_box_back', 0, boxY, boxZ - boxD / 2 + boxT / 2);

  const boxBottomGeo = new THREE.BoxGeometry(dfW - 0.008 - 2 * boxT, boxT, boxD - boxT);
  addMesh(
    boxBottomGeo,
    woodInnerMat,
    'drawer_box_bottom',
    0,
    boxY - boxH / 2 + boxT / 2,
    boxZ + boxT / 2
  );

  return group;
}
