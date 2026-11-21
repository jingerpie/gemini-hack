function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.72;          // Total width including shelf overhangs
  const H = 0.62;          // Total height of vertical posts
  const D = 0.26;          // Total depth
  const POST_W = 0.024;    // Vertical post width/thickness
  const SHELF_T = 0.018;   // Shelf thickness
  const OVERHANG_X = 0.022;// Shelf overhang past posts on left/right
  const CLEAT_H = 0.020;   // Support cleat height under each shelf
  const CLEAT_W = 0.022;   // Support cleat width

  const POST_X = W / 2 - OVERHANG_X - POST_W / 2;
  const POST_Z = D / 2 - POST_W / 2;

  // Shelf Y-positions (bottom surface of each shelf)
  const SHELF_Y = [0.018, 0.205, 0.395, 0.585];

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a28,
    roughness: 0.55,
    metalness: 0.05,
  });

  const walnutDarkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1f,
    roughness: 0.6,
    metalness: 0.05,
  });

  const greenClothMat = new THREE.MeshStandardMaterial({
    color: 0x4f5d46,
    roughness: 0.9,
    metalness: 0.0,
  });

  const creamClothMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c1,
    roughness: 0.88,
    metalness: 0.0,
  });

  const brownClothMat = new THREE.MeshStandardMaterial({
    color: 0x8a5638,
    roughness: 0.88,
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

  // 1. Vertical Posts (4)
  const postGeo = new THREE.BoxGeometry(POST_W, H, POST_W);
  const postPositions = [
    ['post_front_left', -POST_X, POST_Z],
    ['post_front_right', POST_X, POST_Z],
    ['post_back_left', -POST_X, -POST_Z],
    ['post_back_right', POST_X, -POST_Z],
  ];
  for (const [name, px, pz] of postPositions) {
    addMesh(postGeo, walnutMat, name, px, H / 2, pz);
  }

  // 2. Horizontal Shelves (4) & Side Support Cleats (8)
  const shelfGeo = new THREE.BoxGeometry(W, SHELF_T, D);
  const cleatGeo = new THREE.BoxGeometry(CLEAT_W, CLEAT_H, D - POST_W * 0.2);

  for (let i = 0; i < SHELF_Y.length; i++) {
    const sy = SHELF_Y[i];
    addMesh(shelfGeo, walnutMat, `shelf_${i + 1}`, 0, sy + SHELF_T / 2, 0);

    // Support cleats under each shelf on left and right
    const cleatY = sy - CLEAT_H / 2;
    const cleatX = POST_X - POST_W / 2 - CLEAT_W / 2 + 0.002;
    addMesh(cleatGeo, walnutDarkMat, `cleat_left_${i + 1}`, -cleatX, cleatY, 0);
    addMesh(cleatGeo, walnutDarkMat, `cleat_right_${i + 1}`, cleatX, cleatY, 0);
  }

  // 3. Small wooden block/tray on top shelf (left side, matching photo)
  const trayW = 0.11;
  const trayH = 0.022;
  const trayD = 0.10;
  const trayGeo = new THREE.BoxGeometry(trayW, trayH, trayD);
  addMesh(
    trayGeo,
    walnutMat,
    'top_wooden_block',
    -POST_X + POST_W / 2 + trayW / 2 + 0.05,
    SHELF_Y[3] + SHELF_T + trayH / 2,
    0.02
  );

  // 4. Stacked folded cloths on bottom shelf
  const clothW = 0.24;
  const clothD = 0.16;
  const cloth1H = 0.026;
  const cloth2H = 0.024;
  const cloth3H = 0.022;

  const baseClothY = SHELF_Y[0] + SHELF_T;

  const cloth1Geo = new THREE.BoxGeometry(clothW, cloth1H, clothD);
  addMesh(
    cloth1Geo,
    greenClothMat,
    'folded_cloth_green',
    0,
    baseClothY + cloth1H / 2,
    0.01
  );

  const cloth2Geo = new THREE.BoxGeometry(clothW - 0.006, cloth2H, clothD - 0.006);
  addMesh(
    cloth2Geo,
    creamClothMat,
    'folded_cloth_cream',
    0.002,
    baseClothY + cloth1H + cloth2H / 2,
    0.01
  );

  const cloth3Geo = new THREE.BoxGeometry(clothW - 0.036, cloth3H, clothD - 0.016);
  addMesh(
    cloth3Geo,
    brownClothMat,
    'folded_cloth_brown',
    0.002,
    baseClothY + cloth1H + cloth2H + cloth3H / 2,
    0.01
  );

  return group;
}
