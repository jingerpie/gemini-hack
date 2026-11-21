function build(THREE) {
  const group = new THREE.Group();

  const W = 0.152;
  const H = 0.038;
  const D = 0.229;
  const COVER_T = 0.0022;
  const PAGE_INSET = 0.003;
  const DETAIL_T = 0.0006;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x8c2f23,
    roughness: 0.72,
    metalness: 0.04,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf3ebd8,
    roughness: 0.88,
    metalness: 0.0,
  });

  const textMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc4,
    roughness: 0.55,
    metalness: 0.08,
  });

  const treeMat = new THREE.MeshStandardMaterial({
    color: 0x1e110d,
    roughness: 0.8,
    metalness: 0.02,
  });

  const addMesh = (geo, mat, name, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'back_cover',
    0,
    COVER_T / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'front_cover',
    0,
    H - COVER_T / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    coverMat,
    'spine',
    -W / 2 + COVER_T / 2,
    H / 2,
    0
  );

  const pageW = W - COVER_T - PAGE_INSET;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * PAGE_INSET;
  addMesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat,
    'page_block',
    (COVER_T - PAGE_INSET) / 2,
    H / 2,
    0
  );

  const topY = H + DETAIL_T / 2 - 0.0001;
  addMesh(
    new THREE.BoxGeometry(W * 0.62, DETAIL_T, 0.028),
    textMat,
    'cover_title_block',
    0.004,
    topY,
    -D * 0.28
  );

  addMesh(
    new THREE.BoxGeometry(W * 0.36, DETAIL_T, 0.012),
    textMat,
    'cover_author_block',
    0.004,
    topY,
    D * 0.36
  );

  addMesh(
    new THREE.BoxGeometry(0.01, DETAIL_T, 0.055),
    treeMat,
    'cover_tree_trunk',
    0.004,
    topY,
    D * 0.05
  );

  addMesh(
    new THREE.CylinderGeometry(0.036, 0.036, DETAIL_T, 24),
    treeMat,
    'cover_tree_canopy',
    0.004,
    topY,
    -D * 0.04
  );

  const spineX = -W / 2 - DETAIL_T / 2 + 0.0001;
  addMesh(
    new THREE.BoxGeometry(DETAIL_T, 0.009, D * 0.42),
    textMat,
    'spine_title_block',
    spineX,
    H / 2,
    -D * 0.14
  );

  addMesh(
    new THREE.BoxGeometry(DETAIL_T, 0.007, D * 0.16),
    textMat,
    'spine_author_block',
    spineX,
    H / 2,
    D * 0.3
  );

  return group;
}
