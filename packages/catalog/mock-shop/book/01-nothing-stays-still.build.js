function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions for a hardcover book lying flat (meters)
  const W = 0.152;       // width (spine at -X to fore-edge at +X)
  const D = 0.224;       // length/height of cover (top at -Z to bottom at +Z)
  const H = 0.024;       // total thickness (along Y)
  const COVER_T = 0.0025; // cover board thickness
  const PAGE_INSET = 0.004; // page block inset from fore-edge, top, and bottom

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x82957d,
    roughness: 0.78,
    metalness: 0.02
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe4,
    roughness: 0.88,
    metalness: 0.0
  });

  const printMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe4,
    roughness: 0.65,
    metalness: 0.02
  });

  // 1. Back cover (bottom)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  // 2. Page block (off-white, inset on +X, -Z, +Z)
  const pageW = W - COVER_T - PAGE_INSET;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * PAGE_INSET;
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(
    -W / 2 + COVER_T + pageW / 2,
    H / 2,
    0
  );
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  // 3. Front cover (top)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T / 2, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  // 4. Spine (-X side)
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    coverMat
  );
  spine.name = 'spine';
  spine.position.set(-W / 2 + COVER_T / 2, H / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  // 5. Title print bars ("Nothing / Stays / Still") on upper-left of front cover
  const PRINT_T = 0.0004;
  const printY = H + PRINT_T / 2;
  const titleLines = [
    { name: 'title_nothing', w: 0.068, d: 0.011, x: -0.020, z: -0.064 },
    { name: 'title_stays',   w: 0.044, d: 0.011, x: -0.032, z: -0.045 },
    { name: 'title_still',   w: 0.032, d: 0.011, x: -0.038, z: -0.026 }
  ];

  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(line.w, PRINT_T, line.d),
      printMat
    );
    bar.name = line.name;
    bar.position.set(line.x, printY, line.z);
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);
  }

  // 6. Five diagonal leaf motifs on the front cover
  const leafCount = 5;
  for (let i = 0; i < leafCount; i++) {
    const t = i / (leafCount - 1);
    const leafW = 0.014 + t * 0.006;
    const leafD = 0.030 + t * 0.010;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 12),
      printMat
    );
    leaf.name = 'cover_leaf_' + (i + 1);
    leaf.scale.set(leafW, PRINT_T, leafD);
    leaf.position.set(
      -0.040 + t * 0.088,
      printY,
      0.048 - t * 0.056
    );
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  return group;
}
