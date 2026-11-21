function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a hardcover children's book
  const W = 0.24; // Width along X (spine to fore-edge)
  const D = 0.22; // Depth along Z (bottom to top of book)
  const H = 0.028; // Total thickness along Y
  const COVER_T = 0.003; // Thickness of front/back hardcover boards
  const PAGE_INSET_X = 0.006; // Fore-edge overhang
  const PAGE_INSET_Z = 0.005; // Top/bottom overhang

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x5ec7a7,
    roughness: 0.65,
    metalness: 0.02,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe0,
    roughness: 0.85,
    metalness: 0.0,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x9e8268,
    roughness: 0.75,
    metalness: 0.0,
  });
  const sceneBgMat = new THREE.MeshStandardMaterial({
    color: 0xbfe6d4,
    roughness: 0.75,
    metalness: 0.0,
  });
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xdcc9a8,
    roughness: 0.85,
    metalness: 0.0,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x4e9671,
    roughness: 0.75,
    metalness: 0.0,
  });
  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0xf2ead7,
    roughness: 0.8,
    metalness: 0.0,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf0c2a2,
    roughness: 0.7,
    metalness: 0.0,
  });
  const foxMat = new THREE.MeshStandardMaterial({
    color: 0xd97436,
    roughness: 0.7,
    metalness: 0.0,
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

  // 1. Back cover (bottom, y = 0 to COVER_T)
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    "back_cover",
    0,
    COVER_T / 2,
    0
  );

  // 2. Page block (off-white, sandwiched between covers)
  const pageW = W - PAGE_INSET_X;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * PAGE_INSET_Z;
  addMesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat,
    "page_block",
    -PAGE_INSET_X / 2,
    H / 2,
    0
  );

  // 3. Front cover (top, y = H - COVER_T to H)
  addMesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat,
    "front_cover",
    0,
    H - COVER_T / 2,
    0
  );

  // 4. Rounded spine on the -X side
  const spineR = H / 2;
  addMesh(
    new THREE.CylinderGeometry(spineR, spineR, D, 20),
    coverMat,
    "book_spine",
    -W / 2 + spineR * 0.35,
    H / 2,
    0,
    Math.PI / 2,
    0,
    0
  );

  // 5. Cover illustration frame & background (resting on front cover)
  const artW = W * 0.76;
  const artD = D * 0.8;
  const artX = 0.01;
  const layerT = 0.0006;

  addMesh(
    new THREE.BoxGeometry(artW, layerT, artD),
    frameMat,
    "cover_frame",
    artX,
    H + layerT * 0.5,
    0
  );

  addMesh(
    new THREE.BoxGeometry(artW - 0.01, layerT, artD - 0.01),
    sceneBgMat,
    "cover_scene_bg",
    artX,
    H + layerT * 1.5,
    0
  );

  // 6. Stylized cover color blocks
  const detailY = H + layerT * 2.5;

  // Winding path
  addMesh(
    new THREE.BoxGeometry(0.045, layerT, artD * 0.65),
    pathMat,
    "cover_path",
    artX - 0.005,
    detailY,
    0.025,
    0,
    -0.2,
    0
  );

  // Left & right foliage blocks
  addMesh(
    new THREE.BoxGeometry(0.035, layerT, artD * 0.82),
    foliageMat,
    "cover_foliage_left",
    artX - artW * 0.34,
    detailY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.032, layerT, artD * 0.78),
    foliageMat,
    "cover_foliage_right",
    artX + artW * 0.34,
    detailY,
    0.005
  );

  // Central character (tunic + head)
  addMesh(
    new THREE.BoxGeometry(0.026, layerT, 0.036),
    tunicMat,
    "cover_boy_tunic",
    artX,
    detailY + layerT * 0.5,
    0.008
  );
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.011, layerT, 16),
    skinMat,
    "cover_boy_head",
    artX,
    detailY + layerT * 0.5,
    -0.022
  );

  // Foxes
  addMesh(
    new THREE.BoxGeometry(0.018, layerT, 0.026),
    foxMat,
    "cover_fox_foreground",
    artX - 0.045,
    detailY + layerT * 0.5,
    0.04
  );
  addMesh(
    new THREE.BoxGeometry(0.014, layerT, 0.018),
    foxMat,
    "cover_fox_background",
    artX + 0.035,
    detailY + layerT * 0.5,
    -0.025
  );

  // Wooden sign on the right
  addMesh(
    new THREE.BoxGeometry(0.042, layerT, 0.018),
    frameMat,
    "cover_sign_board",
    artX + 0.045,
    detailY + layerT * 0.5,
    0.01
  );

  return group;
}
