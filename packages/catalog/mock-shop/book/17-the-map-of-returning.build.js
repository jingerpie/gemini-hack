function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.24;          // Width (X: spine at -X, fore-edge at +X)
  const D = 0.28;          // Depth/height of book (Z: top at -Z, bottom at +Z)
  const H = 0.026;         // Total thickness (Y)
  const COVER_T = 0.0025;  // Hardcover board thickness
  const SPINE_BAND_W = 0.032; // Width of navy cloth wrap on front/back
  const PAGE_INSET = 0.005;   // Page block recess from cover edges
  const ART_T = 0.0006;    // Thickness of cover artwork elements

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xf3efe4,
    roughness: 0.85,
    metalness: 0.0
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x1f304d,
    roughness: 0.9,
    metalness: 0.02
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xeae4d5,
    roughness: 0.92,
    metalness: 0.0
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xc43e32,
    roughness: 0.8,
    metalness: 0.0
  });
  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xc89643,
    roughness: 0.8,
    metalness: 0.0
  });
  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geom, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Bottom cover
  addMesh(
    new THREE.BoxGeometry(W - SPINE_BAND_W * 0.5, COVER_T, D),
    coverMat,
    "bottom_cover",
    SPINE_BAND_W * 0.25,
    COVER_T / 2,
    0
  );

  // Top cover
  addMesh(
    new THREE.BoxGeometry(W - SPINE_BAND_W * 0.5, COVER_T, D),
    coverMat,
    "top_cover",
    SPINE_BAND_W * 0.25,
    H - COVER_T / 2,
    0
  );

  // Page block (recessed from +X, +Z, -Z edges)
  const pageW = W - PAGE_INSET - SPINE_BAND_W * 0.4;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * PAGE_INSET;
  addMesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat,
    "page_block",
    -W / 2 + SPINE_BAND_W * 0.4 + pageW / 2,
    H / 2,
    0
  );

  // Rounded spine on -X side
  const spineRadius = H / 2;
  addMesh(
    new THREE.CylinderGeometry(spineRadius, spineRadius, D, 16),
    spineMat,
    "spine_curve",
    -W / 2 + spineRadius,
    H / 2,
    0,
    Math.PI / 2,
    0,
    0
  );

  // Navy cloth wrap on top cover
  addMesh(
    new THREE.BoxGeometry(SPINE_BAND_W, COVER_T + 0.0004, D),
    spineMat,
    "spine_top_band",
    -W / 2 + SPINE_BAND_W / 2,
    H - COVER_T / 2 + 0.0001,
    0
  );

  // Navy cloth wrap on bottom cover
  addMesh(
    new THREE.BoxGeometry(SPINE_BAND_W, COVER_T + 0.0004, D),
    spineMat,
    "spine_bottom_band",
    -W / 2 + SPINE_BAND_W / 2,
    COVER_T / 2 - 0.0001,
    0
  );

  // Cover artwork & typography on top cover
  const artY = H + ART_T / 2;
  const artCenterX = SPINE_BAND_W * 0.45;

  // Title & subtitle bars
  addMesh(
    new THREE.BoxGeometry(0.115, ART_T, 0.007),
    charcoalMat,
    "title_bar",
    artCenterX,
    artY,
    -D * 0.34
  );
  addMesh(
    new THREE.BoxGeometry(0.068, ART_T, 0.004),
    charcoalMat,
    "subtitle_bar",
    artCenterX,
    artY,
    -D * 0.30
  );

  // Footer typography bar
  addMesh(
    new THREE.BoxGeometry(0.065, ART_T, 0.004),
    charcoalMat,
    "footer_bar",
    artCenterX + 0.015,
    artY,
    D * 0.38
  );

  // Map color blocks (navy, red, ochre)
  addMesh(
    new THREE.BoxGeometry(0.022, ART_T, 0.020),
    spineMat,
    "map_block_navy_1",
    artCenterX - 0.022,
    artY,
    -0.012,
    0,
    0.25,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.024, ART_T, 0.014),
    spineMat,
    "map_block_navy_2",
    artCenterX + 0.015,
    artY,
    -0.058,
    0,
    -0.15,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.016, ART_T, 0.022),
    spineMat,
    "map_block_navy_3",
    artCenterX + 0.028,
    artY,
    0.032,
    0,
    0.4,
    0
  );

  addMesh(
    new THREE.BoxGeometry(0.018, ART_T, 0.018),
    redMat,
    "map_block_red_1",
    artCenterX - 0.028,
    artY,
    0.035,
    0,
    -0.35,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.015, ART_T, 0.012),
    redMat,
    "map_block_red_2",
    artCenterX + 0.042,
    artY,
    0.005,
    0,
    0.2,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(0.008, 0.008, ART_T, 16),
    ochreMat,
    "map_dot_ochre",
    artCenterX + 0.026,
    artY,
    -0.034
  );
  addMesh(
    new THREE.BoxGeometry(0.022, ART_T, 0.024),
    ochreMat,
    "map_block_ochre_1",
    artCenterX + 0.042,
    artY,
    0.038,
    0,
    0.15,
    0
  );

  // Map circular line accent
  addMesh(
    new THREE.TorusGeometry(0.048, 0.0008, 6, 32),
    charcoalMat,
    "map_ring_line",
    artCenterX + 0.005,
    artY,
    0.005,
    Math.PI / 2,
    0,
    0
  );

  return group;
}
