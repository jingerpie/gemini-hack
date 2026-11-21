function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.30;
  const H = 0.78;
  const D = 0.36;

  const BOARD_T = 0.028;
  const TOP_OVERHANG_X = 0.024;
  const TOP_OVERHANG_Z = 0.008;

  const SIDE_W = BOARD_T;
  const SIDE_H = H - BOARD_T;
  const SIDE_D = D - TOP_OVERHANG_Z * 2;
  const INNER_W = W - TOP_OVERHANG_X * 2 - SIDE_W * 2;
  const SIDE_X = INNER_W / 2 + SIDE_W / 2;

  const LOWER_SHELF_Y = 0.22;
  const UPPER_SHELF_Y = 0.49;

  const CLEAT_W = 0.022;
  const CLEAT_H = 0.024;
  const CLEAT_D = SIDE_D - 0.016;

  const PLUG_SIZE = 0.018;
  const PLUG_DEPTH = 0.003;

  // Materials
  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x4b5c69,
    roughness: 0.72,
    metalness: 0.05,
  });

  const plugMat = new THREE.MeshStandardMaterial({
    color: 0x445460,
    roughness: 0.78,
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

  // Top panel
  const topGeo = new THREE.BoxGeometry(W, BOARD_T, D);
  addMesh(topGeo, slateMat, 'top_panel', 0, H - BOARD_T / 2, 0);

  // Side panels
  const sideGeo = new THREE.BoxGeometry(SIDE_W, SIDE_H, SIDE_D);
  addMesh(sideGeo, slateMat, 'left_side_panel', -SIDE_X, SIDE_H / 2, 0);
  addMesh(sideGeo, slateMat, 'right_side_panel', SIDE_X, SIDE_H / 2, 0);

  // Shelves
  const shelfGeo = new THREE.BoxGeometry(INNER_W, BOARD_T, SIDE_D);
  addMesh(shelfGeo, slateMat, 'lower_shelf', 0, LOWER_SHELF_Y, 0);
  addMesh(shelfGeo, slateMat, 'upper_shelf', 0, UPPER_SHELF_Y, 0);

  // Support cleats under top panel and shelves
  const cleatGeo = new THREE.BoxGeometry(CLEAT_W, CLEAT_H, CLEAT_D);
  const cleatX = INNER_W / 2 - CLEAT_W / 2;

  const cleatLevels = [
    { name: 'top', y: H - BOARD_T - CLEAT_H / 2 },
    { name: 'upper_shelf', y: UPPER_SHELF_Y - BOARD_T / 2 - CLEAT_H / 2 },
    { name: 'lower_shelf', y: LOWER_SHELF_Y - BOARD_T / 2 - CLEAT_H / 2 },
  ];

  for (const level of cleatLevels) {
    addMesh(cleatGeo, slateMat, `left_${level.name}_cleat`, -cleatX, level.y, 0);
    addMesh(cleatGeo, slateMat, `right_${level.name}_cleat`, cleatX, level.y, 0);
  }

  // Through-tenon plug details on outer faces of side panels
  const plugGeo = new THREE.BoxGeometry(PLUG_DEPTH, PLUG_SIZE, PLUG_SIZE);
  const plugZOffsets = [-0.105, -0.035, 0.035, 0.105];
  const plugLevels = [
    { name: 'lower', y: LOWER_SHELF_Y },
    { name: 'upper', y: UPPER_SHELF_Y },
  ];

  for (const level of plugLevels) {
    for (let i = 0; i < plugZOffsets.length; i++) {
      const pz = plugZOffsets[i];
      addMesh(
        plugGeo,
        plugMat,
        `left_${level.name}_tenon_plug_${i + 1}`,
        -SIDE_X - SIDE_W / 2 - PLUG_DEPTH / 2 + 0.001,
        level.y,
        pz
      );
      addMesh(
        plugGeo,
        plugMat,
        `right_${level.name}_tenon_plug_${i + 1}`,
        SIDE_X + SIDE_W / 2 + PLUG_DEPTH / 2 - 0.001,
        level.y,
        pz
      );
    }
  }

  return group;
}
