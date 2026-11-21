function build(THREE) {
  const group = new THREE.Group();

  const W = 0.155;
  const H = 0.032;
  const D = 0.235;
  const COVER_T = 0.003;
  const SPINE_W = 0.004;
  const OVERHANG = 0.004;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe2,
    roughness: 0.78,
    metalness: 0.02
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x1a1818,
    roughness: 0.7,
    metalness: 0.05
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xede7d8,
    roughness: 0.85,
    metalness: 0.0
  });
  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0x8a7a63,
    roughness: 0.65,
    metalness: 0.05
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x26221e,
    roughness: 0.6,
    metalness: 0.05
  });

  const addMesh = (name, geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Back and front covers
  addMesh('back_cover', new THREE.BoxGeometry(W, COVER_T, D), creamMat, 0, COVER_T / 2, 0);
  addMesh('front_cover', new THREE.BoxGeometry(W, COVER_T, D), creamMat, 0, H - COVER_T / 2, 0);

  // Spine on -X side
  addMesh('spine', new THREE.BoxGeometry(SPINE_W, H, D), spineMat, -W / 2 + SPINE_W / 2, H / 2, 0);
  addMesh(
    'spine_panel',
    new THREE.BoxGeometry(0.0008, H * 0.72, D * 0.84),
    taupeMat,
    -W / 2 - 0.0002,
    H / 2,
    0
  );

  // Page block (recessed from covers on +X, +Z, -Z)
  const pageW = W - SPINE_W - OVERHANG;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * OVERHANG;
  addMesh(
    'page_block',
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat,
    (SPINE_W - OVERHANG) / 2,
    H / 2,
    0
  );

  // Front cover border frame
  const detailY = H + 0.0003;
  const frameW = W * 0.78;
  const frameD = D * 0.78;
  const lineT = 0.0014;
  const lineH = 0.0006;

  addMesh('cover_border_top', new THREE.BoxGeometry(frameW, lineH, lineT), taupeMat, 0.003, detailY, -frameD / 2);
  addMesh('cover_border_bottom', new THREE.BoxGeometry(frameW, lineH, lineT), taupeMat, 0.003, detailY, frameD / 2);
  addMesh('cover_border_left', new THREE.BoxGeometry(lineT, lineH, frameD), taupeMat, 0.003 - frameW / 2, detailY, 0);
  addMesh('cover_border_right', new THREE.BoxGeometry(lineT, lineH, frameD), taupeMat, 0.003 + frameW / 2, detailY, 0);

  // Oval thorn wreath
  const wreath = addMesh(
    'cover_wreath',
    new THREE.TorusGeometry(0.05, 0.0022, 8, 32),
    taupeMat,
    0.003,
    detailY,
    -0.004
  );
  wreath.rotation.x = Math.PI / 2;
  wreath.scale.set(1, 1.32, 0.4);

  // Central emblem and author bar
  addMesh('cover_emblem', new THREE.BoxGeometry(0.03, 0.0007, 0.036), taupeMat, 0.003, detailY, 0.002);
  addMesh('cover_author_bar', new THREE.BoxGeometry(0.044, 0.0007, 0.005), inkMat, 0.003, detailY, D * 0.34);

  return group;
}
