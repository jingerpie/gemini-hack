function build(THREE) {
  const group = new THREE.Group();

  const W = 0.16;       // width (X): spine (-X) to fore-edge (+X)
  const D = 0.23;       // length/height of book (Z): head (-Z) to tail (+Z)
  const H = 0.028;      // total thickness (Y)
  const COVER_T = 0.0028;
  const OVERHANG = 0.003;
  const PAGE_H = H - COVER_T * 2;
  const PAGE_W = W - OVERHANG - COVER_T;
  const PAGE_D = D - OVERHANG * 2;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xeae5da,
    roughness: 0.78,
    metalness: 0.02
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe6,
    roughness: 0.88,
    metalness: 0.0
  });

  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x34424c,
    roughness: 0.55,
    metalness: 0.05
  });

  // Back cover (bottom, resting on y = 0)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T * 0.5, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  // Front cover (top)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T * 0.5, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  // Spine on the -X side
  const spine = new THREE.Mesh(
    new THREE.CylinderGeometry(H * 0.5, H * 0.5, D, 16, 1, false, Math.PI * 0.5, Math.PI),
    coverMat
  );
  spine.name = 'book_spine';
  spine.rotation.x = Math.PI * 0.5;
  spine.position.set(-W * 0.5 + H * 0.15, H * 0.5, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  // Page block
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_W, PAGE_H, PAGE_D),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(
    -W * 0.5 + COVER_T + PAGE_W * 0.5,
    H * 0.5,
    0
  );
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  // Cover graphic details on +Y face
  const topY = H + 0.00025;
  const INK_T = 0.0005;

  // Title color blocks ("A Life / Worth / Asking")
  const titleLines = [
    { name: 'title_line_1', w: 0.044, d: 0.007, z: -0.014 },
    { name: 'title_line_2', w: 0.048, d: 0.007, z: 0.0 },
    { name: 'title_line_3', w: 0.052, d: 0.007, z: 0.014 }
  ];
  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(line.w, INK_T, line.d),
      inkMat
    );
    mesh.name = line.name;
    mesh.position.set(0.004, topY, line.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Subtitle color block ("Plan An Open Margin")
  const subtitle = new THREE.Mesh(
    new THREE.BoxGeometry(0.064, INK_T, 0.0045),
    inkMat
  );
  subtitle.name = 'subtitle_block';
  subtitle.position.set(0.004, topY, D * 0.35);
  subtitle.castShadow = true;
  subtitle.receiveShadow = true;
  group.add(subtitle);

  // Constellation ring nodes around the title
  const nodeGeo = new THREE.CylinderGeometry(0.0018, 0.0018, INK_T, 12);
  const nodeOffsets = [
    [-0.032, -0.048],
    [0.006, -0.056],
    [0.042, -0.042],
    [0.052, -0.004],
    [0.044, 0.036],
    [0.012, 0.054],
    [-0.028, 0.046],
    [-0.046, 0.012],
    [-0.044, -0.022]
  ];

  for (let i = 0; i < nodeOffsets.length; i++) {
    const [nx, nz] = nodeOffsets[i];
    const node = new THREE.Mesh(nodeGeo, inkMat);
    node.name = 'constellation_node_' + (i + 1);
    node.position.set(0.004 + nx, topY, nz);
    node.castShadow = true;
    node.receiveShadow = true;
    group.add(node);
  }

  return group;
}
