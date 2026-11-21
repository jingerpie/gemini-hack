function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.23;          // Width (X, spine to fore-edge)
  const D = 0.23;          // Depth (Z, top to bottom edge)
  const H = 0.026;         // Total thickness (Y)
  const COVER_T = 0.003;   // Hardcover board thickness
  const PAGE_INSET = 0.004;// Page block inset from cover edges
  const R_CORNER = 0.012;  // Outer corner radius on fore-edge
  const R_PAGE = 0.009;    // Page block outer corner radius

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe1,
    roughness: 0.72,
    metalness: 0.02,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xe6decb,
    roughness: 0.88,
    metalness: 0.0,
  });

  const headbandMat = new THREE.MeshStandardMaterial({
    color: 0xd49664,
    roughness: 0.85,
    metalness: 0.0,
  });

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf9e5cc,
    roughness: 0.8,
    metalness: 0.0,
  });

  const castleMat = new THREE.MeshStandardMaterial({
    color: 0xe8c79e,
    roughness: 0.78,
    metalness: 0.0,
  });

  const roofMintMat = new THREE.MeshStandardMaterial({
    color: 0x9ec4b0,
    roughness: 0.75,
    metalness: 0.0,
  });

  const roofPeachMat = new THREE.MeshStandardMaterial({
    color: 0xe5a47e,
    roughness: 0.75,
    metalness: 0.0,
  });

  // Helper: rectangle with sharp corners on -X (spine) and rounded corners on +X (fore-edge)
  function createBookShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const x0 = -width / 2;
    const x1 = width / 2;
    const y0 = -depth / 2;
    const y1 = depth / 2;

    shape.moveTo(x0, y0);
    shape.lineTo(x1 - radius, y0);
    shape.quadraticCurveTo(x1, y0, x1, y0 + radius);
    shape.lineTo(x1, y1 - radius);
    shape.quadraticCurveTo(x1, y1, x1 - radius, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    return shape;
  }

  function addMesh(geo, mat, name, px, py, pz, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(px || 0, py || 0, pz || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bottom cover (back cover)
  const coverShape = createBookShape(W, D, R_CORNER);
  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: COVER_T,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0005,
    bevelSegments: 2,
    curveSegments: 12,
  });
  coverGeo.rotateX(-Math.PI / 2);
  addMesh(coverGeo, coverMat, 'back_cover', 0, 0.0005, 0);

  // 2. Top cover (front cover)
  addMesh(coverGeo, coverMat, 'front_cover', 0, H - COVER_T - 0.0005, 0);

  // 3. Spine (rounded cylinder along Z on -X side)
  const spineRadius = H / 2;
  const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, D, 20, 1, false, 0, Math.PI);
  spineGeo.rotateX(Math.PI / 2);
  spineGeo.rotateZ(Math.PI);
  addMesh(spineGeo, coverMat, 'spine', -W / 2, H / 2, 0);

  // 4. Page block
  const pageH = H - COVER_T * 2;
  const pageW = W - PAGE_INSET;
  const pageD = D - PAGE_INSET * 2;
  const pageShape = createBookShape(pageW, pageD, R_PAGE);
  const pageGeo = new THREE.ExtrudeGeometry(pageShape, {
    depth: pageH,
    bevelEnabled: false,
    curveSegments: 10,
  });
  pageGeo.rotateX(-Math.PI / 2);
  addMesh(pageGeo, pageMat, 'page_block', -PAGE_INSET / 2, COVER_T, 0);

  // 5. Headband & tailband at spine ends
  const bandGeo = new THREE.CylinderGeometry(spineRadius * 0.72, spineRadius * 0.72, 0.003, 12);
  bandGeo.rotateX(Math.PI / 2);
  addMesh(bandGeo, headbandMat, 'headband_top', -W / 2 + 0.003, H / 2, -D / 2 + 0.004);
  addMesh(bandGeo, headbandMat, 'tailband_bottom', -W / 2 + 0.003, H / 2, D / 2 - 0.004);

  // 6. Subtle cover illustration color blocks on front cover
  const artY = H + 0.0002;
  const artT = 0.0004;

  // Cloud base
  const cloudGeo = new THREE.BoxGeometry(0.095, artT, 0.022);
  addMesh(cloudGeo, cloudMat, 'cover_cloud_base', -0.015, artY, 0.015, 0, 0.15, 0);

  // Castle main body
  const castleBodyGeo = new THREE.BoxGeometry(0.065, artT, 0.032);
  addMesh(castleBodyGeo, castleMat, 'cover_castle_body', -0.008, artY + 0.0001, -0.005, 0, 0.15, 0);

  // Castle central tower
  const towerGeo = new THREE.BoxGeometry(0.018, artT, 0.036);
  addMesh(towerGeo, castleMat, 'cover_castle_tower', -0.005, artY + 0.0001, -0.028, 0, 0.15, 0);

  // Mint roof accent
  const roofMintGeo = new THREE.BoxGeometry(0.022, artT, 0.016);
  addMesh(roofMintGeo, roofMintMat, 'cover_roof_mint', -0.032, artY + 0.0002, -0.032, 0, 0.15, 0);

  // Peach banner accent
  const bannerGeo = new THREE.BoxGeometry(0.068, artT, 0.014);
  addMesh(bannerGeo, roofPeachMat, 'cover_banner_peach', 0.035, artY + 0.0002, -0.048, 0, -0.18, 0);

  return group;
}
