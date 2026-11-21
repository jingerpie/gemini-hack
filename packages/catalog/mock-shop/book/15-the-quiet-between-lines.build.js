function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a hardcover poetry book
  const W = 0.16;       // width (X)
  const D = 0.24;       // length / height of book (Z)
  const H = 0.028;      // total thickness (Y)
  const COVER_T = 0.003;
  const OVERHANG = 0.004;
  const BLOCK_T = 0.0004;

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5,
    roughness: 0.88,
    metalness: 0.0
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.92,
    metalness: 0.0
  });

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0x9e4f28,
    roughness: 0.85,
    metalness: 0.0
  });

  const paleBeigeMat = new THREE.MeshStandardMaterial({
    color: 0xd8beaa,
    roughness: 0.85,
    metalness: 0.0
  });

  const dustyRoseMat = new THREE.MeshStandardMaterial({
    color: 0xcaa28e,
    roughness: 0.85,
    metalness: 0.0
  });

  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xbd985e,
    roughness: 0.85,
    metalness: 0.0
  });

  const umberMat = new THREE.MeshStandardMaterial({
    color: 0x8e6239,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Back cover (bottom, resting at y = 0)
  const coverGeo = new THREE.BoxGeometry(W - H * 0.35, COVER_T, D);
  const coverCenterX = H * 0.175;
  addMesh(coverGeo, coverMat, 'back_cover', coverCenterX, COVER_T / 2, 0);

  // Front cover (top)
  addMesh(coverGeo, coverMat, 'front_cover', coverCenterX, H - COVER_T / 2, 0);

  // Rounded spine on -X side
  const spineRadius = H / 2;
  const spineGeo = new THREE.CylinderGeometry(
    spineRadius,
    spineRadius,
    D,
    20,
    1,
    false,
    0,
    Math.PI
  );
  // Cylinder is along Y by default; rotate to align along Z, curved side toward -X
  addMesh(
    spineGeo,
    coverMat,
    'book_spine',
    -W / 2 + spineRadius,
    H / 2,
    0,
    Math.PI / 2,
    Math.PI,
    0
  );

  // Page block (off-white, inset from +X, +Z, -Z)
  const pageW = W - spineRadius - OVERHANG;
  const pageH = H - COVER_T * 2;
  const pageD = D - OVERHANG * 2;
  const pageGeo = new THREE.BoxGeometry(pageW, pageH, pageD);
  addMesh(
    pageGeo,
    pageMat,
    'page_block',
    -W / 2 + spineRadius + pageW / 2,
    H / 2,
    0
  );

  // Helper to create organic rounded shapes on the front cover
  // Coordinates in 2D shape: x maps to +X, y maps to -Z (so +y is top of cover)
  function makeOrganicShape(points) {
    const shape = new THREE.Shape();
    const n = points.length;
    const firstMidX = (points[n - 1][0] + points[0][0]) / 2;
    const firstMidY = (points[n - 1][1] + points[0][1]) / 2;
    shape.moveTo(firstMidX, firstMidY);
    for (let i = 0; i < n; i++) {
      const curr = points[i];
      const next = points[(i + 1) % n];
      const midX = (curr[0] + next[0]) / 2;
      const midY = (curr[1] + next[1]) / 2;
      shape.quadraticCurveTo(curr[0], curr[1], midX, midY);
    }
    return shape;
  }

  function addCoverBlock(points, mat, name) {
    const shape = makeOrganicShape(points);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BLOCK_T,
      bevelEnabled: false,
      curveSegments: 12
    });
    // Rotate -PI/2 around X so shape X -> +X, shape Y -> -Z, extrude depth -> +Y
    addMesh(geo, mat, name, 0.003, H, 0, -Math.PI / 2, 0, 0);
  }

  // 1. Top-left terracotta block
  addCoverBlock(
    [
      [-0.044, 0.068],
      [0.048, 0.068],
      [0.046, 0.045],
      [0.008, 0.042],
      [0.000, 0.002],
      [-0.046, 0.004]
    ],
    terracottaMat,
    'cover_block_terracotta'
  );

  // 2. Top-right pale beige block
  addCoverBlock(
    [
      [0.006, 0.040],
      [0.046, 0.041],
      [0.048, -0.022],
      [0.004, -0.018]
    ],
    paleBeigeMat,
    'cover_block_beige'
  );

  // 3. Middle-left dusty rose block
  addCoverBlock(
    [
      [-0.044, -0.002],
      [-0.004, -0.004],
      [0.004, -0.038],
      [-0.006, -0.072],
      [-0.045, -0.070]
    ],
    dustyRoseMat,
    'cover_block_dusty_rose'
  );

  // 4. Middle-right ochre block
  addCoverBlock(
    [
      [0.012, -0.022],
      [0.048, -0.028],
      [0.048, -0.066],
      [0.006, -0.056]
    ],
    ochreMat,
    'cover_block_ochre'
  );

  // 5. Bottom umber block
  addCoverBlock(
    [
      [-0.002, -0.060],
      [0.042, -0.068],
      [0.038, -0.094],
      [-0.042, -0.092],
      [-0.042, -0.074],
      [-0.006, -0.074]
    ],
    umberMat,
    'cover_block_umber'
  );

  return group;
}
