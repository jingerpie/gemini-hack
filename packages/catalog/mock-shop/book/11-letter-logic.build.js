function build(THREE) {
  const group = new THREE.Group();

  const W = 0.21;
  const D = 0.28;
  const H = 0.026;
  const COVER_T = 0.0025;
  const OVERHANG = 0.003;
  const PAGE_H = H - 2 * COVER_T;
  const GRAPHIC_H = 0.0004;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xefefef,
    roughness: 0.72,
    metalness: 0.02
  });

  const spineMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e4,
    roughness: 0.75,
    metalness: 0.02
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5ee,
    roughness: 0.9,
    metalness: 0.0
  });

  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e1c,
    roughness: 0.65,
    metalness: 0.05
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x7ee028,
    roughness: 0.55,
    metalness: 0.02
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

  // Back cover
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'back_cover',
    0,
    COVER_T / 2,
    0
  );

  // Front cover
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    'front_cover',
    0,
    H - COVER_T / 2,
    0
  );

  // Spine on -X side
  addMesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    spineMat,
    'spine',
    -W / 2 + COVER_T / 2,
    H / 2,
    0
  );

  // Page block (off-white, recessed by overhang)
  const pageW = W - COVER_T - OVERHANG;
  const pageD = D - 2 * OVERHANG;
  addMesh(
    new THREE.BoxGeometry(pageW, PAGE_H, pageD),
    pageMat,
    'page_block',
    (COVER_T - OVERHANG) / 2,
    H / 2,
    0
  );

  // Cover graphics on +Y face
  const topY = H + GRAPHIC_H / 2;

  // "LETTER LOGIC" title block near top (-Z)
  addMesh(
    new THREE.BoxGeometry(0.135, GRAPHIC_H, 0.014),
    inkMat,
    'cover_title_block',
    0.005,
    topY,
    -D / 2 + 0.036
  );

  // Lime green horizontal accent bar
  addMesh(
    new THREE.BoxGeometry(0.115, GRAPHIC_H, 0.006),
    accentMat,
    'cover_green_bar',
    0.015,
    topY,
    0.055
  );

  // Lowercase "a" graphic (bowl + stem)
  addMesh(
    new THREE.TorusGeometry(0.015, 0.0035, 8, 24),
    inkMat,
    'cover_letter_a_bowl',
    0.045,
    topY,
    0.022,
    Math.PI / 2,
    0,
    0
  );

  addMesh(
    new THREE.BoxGeometry(0.007, GRAPHIC_H, 0.038),
    inkMat,
    'cover_letter_a_stem',
    0.060,
    topY,
    0.018
  );

  // Spine title accent
  addMesh(
    new THREE.BoxGeometry(GRAPHIC_H, 0.005, 0.075),
    inkMat,
    'spine_title_block',
    -W / 2 - GRAPHIC_H / 2,
    H / 2,
    0.01
  );

  return group;
}
