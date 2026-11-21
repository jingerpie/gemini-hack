function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.16;          // Book width (X)
  const D = 0.24;          // Book length/height (Z)
  const H = 0.032;         // Book thickness (Y)
  const COVER_T = 0.0025;  // Cover board thickness
  const OVERHANG = 0.004;  // Cover overhang past page block
  const PAGE_H = H - 2 * COVER_T;
  const PAGE_W = W - COVER_T - OVERHANG;
  const PAGE_D = D - 2 * OVERHANG;
  const DECAL_T = 0.0004;  // Thickness for raised cover artwork

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xb06544,
    roughness: 0.78,
    metalness: 0.02
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5,
    roughness: 0.9,
    metalness: 0.0
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e1,
    roughness: 0.7,
    metalness: 0.0
  });
  const paperSheetMat = new THREE.MeshStandardMaterial({
    color: 0xf2ead7,
    roughness: 0.85,
    metalness: 0.0
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc89b54,
    roughness: 0.45,
    metalness: 0.35
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x946137,
    roughness: 0.55,
    metalness: 0.05
  });
  const ribbonRoseMat = new THREE.MeshStandardMaterial({
    color: 0xb87d70,
    roughness: 0.65,
    metalness: 0.05
  });
  const ribbonOchreMat = new THREE.MeshStandardMaterial({
    color: 0xc49456,
    roughness: 0.65,
    metalness: 0.05
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c1d,
    roughness: 0.8,
    metalness: 0.0
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

  // Back cover (bottom, resting on y = 0)
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'back_cover',
    0,
    COVER_T / 2,
    0
  );

  // Front cover (top)
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'front_cover',
    0,
    H - COVER_T / 2,
    0
  );

  // Spine (-X side)
  addMesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    coverMat,
    'spine',
    -W / 2 + COVER_T / 2,
    H / 2,
    0
  );

  // Page block
  addMesh(
    new THREE.BoxGeometry(PAGE_W, PAGE_H, PAGE_D),
    pageMat,
    'page_block',
    (COVER_T - OVERHANG) / 2,
    H / 2,
    0
  );

  // Cover artwork (centered slightly toward -Z / upper half of cover)
  const artY = H + DECAL_T / 2;
  const artZ = -0.015;

  // Angled ledger paper sheets behind medallion
  addMesh(
    new THREE.BoxGeometry(0.088, DECAL_T, 0.072),
    paperSheetMat,
    'ledger_sheet_upper',
    -0.008,
    artY,
    artZ - 0.012,
    0,
    0.38,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.082, DECAL_T, 0.095),
    paperSheetMat,
    'ledger_sheet_lower',
    0.012,
    artY + DECAL_T * 0.5,
    artZ + 0.006,
    0,
    -0.24,
    0
  );

  // Gold medallion rim
  const medallionR = 0.052;
  addMesh(
    new THREE.CylinderGeometry(medallionR + 0.002, medallionR + 0.002, DECAL_T, 32),
    goldMat,
    'medallion_rim',
    0.002,
    artY + DECAL_T,
    artZ
  );

  // Cream medallion center
  addMesh(
    new THREE.CylinderGeometry(medallionR, medallionR, DECAL_T, 32),
    creamMat,
    'medallion_face',
    0.002,
    artY + DECAL_T * 1.5,
    artZ
  );

  // Title text accent bars on medallion
  addMesh(
    new THREE.BoxGeometry(0.032, DECAL_T, 0.007),
    inkMat,
    'title_line_the',
    0.002,
    artY + DECAL_T * 2.2,
    artZ - 0.022,
    0,
    0.15,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.076, DECAL_T, 0.011),
    inkMat,
    'title_line_milliners',
    0.002,
    artY + DECAL_T * 2.2,
    artZ - 0.002,
    0,
    0.15,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.062, DECAL_T, 0.011),
    inkMat,
    'title_line_ledger',
    0.004,
    artY + DECAL_T * 2.2,
    artZ + 0.016,
    0,
    0.15,
    0
  );

  // Wooden hat block (milliner's form) at top-left of medallion
  addMesh(
    new THREE.CylinderGeometry(0.014, 0.016, 0.006, 20),
    woodMat,
    'hat_block',
    -0.036,
    artY + 0.003,
    artZ - 0.038,
    0,
    0.2,
    0
  );

  // Decorative ribbons (rose & ochre)
  addMesh(
    new THREE.TorusGeometry(0.012, 0.0022, 8, 20, Math.PI * 1.4),
    ribbonRoseMat,
    'ribbon_top_rose',
    0.014,
    artY + DECAL_T * 2,
    artZ - 0.048,
    Math.PI / 2,
    0,
    0.3
  );
  addMesh(
    new THREE.TorusGeometry(0.016, 0.0022, 8, 20, Math.PI * 1.1),
    ribbonOchreMat,
    'ribbon_left_ochre',
    -0.042,
    artY + DECAL_T * 2,
    artZ + 0.022,
    Math.PI / 2,
    0,
    2.4
  );

  // Author name bar at bottom of front cover
  addMesh(
    new THREE.BoxGeometry(0.078, DECAL_T, 0.01),
    creamMat,
    'author_name_bar',
    0.004,
    artY,
    0.078,
    0,
    0.04,
    0
  );

  return group;
}
