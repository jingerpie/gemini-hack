function build(THREE) {
  const group = new THREE.Group();

  const W = 0.145;
  const H = 0.028;
  const D = 0.220;
  const COVER_T = 0.0025;
  const PAGE_H = H - COVER_T * 2;
  const PAGE_INSET = 0.003;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd0,
    roughness: 0.72,
    metalness: 0.02,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf3eee3,
    roughness: 0.85,
    metalness: 0.0,
  });

  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a18,
    roughness: 0.65,
    metalness: 0.05,
  });

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a22,
    roughness: 0.7,
    metalness: 0.03,
  });

  const plumMat = new THREE.MeshStandardMaterial({
    color: 0x452830,
    roughness: 0.68,
    metalness: 0.04,
  });

  function makeBox(w, h, d, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Back cover (bottom)
  makeBox(W, COVER_T, D, creamMat, 'back_cover', 0, COVER_T / 2, 0);

  // Page block (recessed on +X, +Z, -Z; flush with spine on -X)
  makeBox(
    W - PAGE_INSET,
    PAGE_H,
    D - PAGE_INSET * 2,
    pageMat,
    'page_block',
    -PAGE_INSET / 2,
    H / 2,
    0
  );

  // Spine on -X side
  makeBox(COVER_T, H, D, creamMat, 'spine', -W / 2 + COVER_T / 2, H / 2, 0);

  // Spine decorative bands
  const bandT = 0.0006;
  const bandW = 0.0025;
  makeBox(bandT, H - 0.001, bandW, inkMat, 'spine_band_top', -W / 2 - bandT / 2 + 0.0002, H / 2, -D / 2 + 0.012);
  makeBox(bandT, H - 0.001, bandW, inkMat, 'spine_band_bottom', -W / 2 - bandT / 2 + 0.0002, H / 2, D / 2 - 0.012);

  // Front cover (top)
  makeBox(W, COVER_T, D, creamMat, 'front_cover', 0, H - COVER_T / 2, 0);

  // Front cover outer border frame
  const artY = H + 0.0002;
  const frameInset = 0.008;
  const lineW = 0.0014;
  const frameW = W - frameInset * 2;
  const frameD = D - frameInset * 2;

  makeBox(frameW, 0.0004, lineW, inkMat, 'cover_border_top', 0, artY, -frameD / 2);
  makeBox(frameW, 0.0004, lineW, inkMat, 'cover_border_bottom', 0, artY, frameD / 2);
  makeBox(lineW, 0.0004, frameD, inkMat, 'cover_border_left', -frameW / 2, artY, 0);
  makeBox(lineW, 0.0004, frameD, inkMat, 'cover_border_right', frameW / 2, artY, 0);

  // Upper art square (terracotta)
  const artSize = W * 0.72;
  const artZ = -D * 0.16;
  makeBox(artSize, 0.0005, artSize, terracottaMat, 'cover_art_square', 0.002, artY, artZ);

  // Medallion ring
  const ringR = artSize * 0.44;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(ringR, ringR, 0.0007, 32), plumMat);
  ring.name = 'cover_medallion_ring';
  ring.position.set(0.002, artY + 0.0001, artZ);
  ring.castShadow = true;
  ring.receiveShadow = true;
  group.add(ring);

  // Medallion inner disc
  const innerR = ringR * 0.86;
  const innerDisc = new THREE.Mesh(new THREE.CylinderGeometry(innerR, innerR, 0.0009, 32), creamMat);
  innerDisc.name = 'cover_medallion_inner';
  innerDisc.position.set(0.002, artY + 0.00015, artZ);
  innerDisc.castShadow = true;
  innerDisc.receiveShadow = true;
  group.add(innerDisc);

  // Title & author divider rule on lower half
  makeBox(W * 0.48, 0.0004, 0.0015, inkMat, 'cover_title_rule', 0.002, artY, D * 0.28);

  return group;
}
