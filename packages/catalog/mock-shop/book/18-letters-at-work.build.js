function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters (real-world scale: 21cm x 28cm x 2.2cm)
  const W = 0.21;
  const D = 0.28;
  const H = 0.022;
  const COVER_T = 0.0022;
  const SPINE_W = 0.003;
  const OVERHANG = 0.0025;
  const PAGE_H = H - 2 * COVER_T;
  const PAGE_W = W - OVERHANG - SPINE_W;
  const PAGE_D = D - 2 * OVERHANG;

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xede8dc,
    roughness: 0.78,
    metalness: 0.02,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xe2ddd0,
    roughness: 0.9,
    metalness: 0.0,
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xc8372d,
    roughness: 0.65,
    metalness: 0.02,
  });

  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a38,
    roughness: 0.68,
    metalness: 0.03,
  });

  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x233349,
    roughness: 0.65,
    metalness: 0.03,
  });

  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xc98e32,
    roughness: 0.65,
    metalness: 0.02,
  });

  // Back cover (bottom, resting at y = 0)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T / 2, 0);
  group.add(backCover);

  // Page block (between covers, flush with spine on -X)
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_W, PAGE_H, PAGE_D),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(-W / 2 + SPINE_W + PAGE_W / 2, H / 2, 0);
  group.add(pageBlock);

  // Spine (on -X side)
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(SPINE_W, H, D),
    coverMat
  );
  spine.name = 'spine';
  spine.position.set(-W / 2 + SPINE_W / 2, H / 2, 0);
  group.add(spine);

  // Front cover (top)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T / 2, 0);
  group.add(frontCover);

  // Typographic color blocks on front cover
  const BLOCK_T = 0.0005;
  const BLOCK_Y = H + BLOCK_T / 2 - 0.0001;

  const blocks = [
    { name: 'cover_block_red_upper', w: 0.045, d: 0.055, x: -0.048, z: -0.072, ry: 0.18, mat: redMat },
    { name: 'cover_block_charcoal_upper', w: 0.058, d: 0.038, x: -0.005, z: -0.068, ry: -0.12, mat: charcoalMat },
    { name: 'cover_block_navy_upper', w: 0.042, d: 0.042, x: 0.042, z: -0.075, ry: 0.25, mat: navyMat },
    { name: 'cover_block_charcoal_mid_left', w: 0.048, d: 0.062, x: -0.042, z: -0.012, ry: -0.15, mat: charcoalMat },
    { name: 'cover_block_navy_mid', w: 0.052, d: 0.052, x: 0.006, z: -0.015, ry: 0.32, mat: navyMat },
    { name: 'cover_block_red_mid_right', w: 0.046, d: 0.046, x: 0.044, z: -0.018, ry: -0.22, mat: redMat },
    { name: 'cover_block_ochre_mid_right', w: 0.036, d: 0.044, x: 0.052, z: 0.025, ry: 0.14, mat: ochreMat },
    { name: 'cover_block_ochre_lower_left', w: 0.064, d: 0.048, x: -0.028, z: 0.056, ry: -0.28, mat: ochreMat },
    { name: 'cover_block_navy_lower_mid', w: 0.042, d: 0.042, x: 0.018, z: 0.062, ry: 0.1, mat: navyMat },
    { name: 'cover_block_charcoal_lower_right', w: 0.034, d: 0.058, x: 0.055, z: 0.064, ry: -0.18, mat: charcoalMat },
  ];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, BLOCK_T, b.d),
      b.mat
    );
    mesh.name = b.name;
    mesh.position.set(b.x, BLOCK_Y + i * 0.00002, b.z);
    mesh.rotation.y = b.ry;
    group.add(mesh);
  }

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
