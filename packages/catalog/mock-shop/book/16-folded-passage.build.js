function build(THREE) {
  const group = new THREE.Group();

  const W = 0.18;
  const D = 0.23;
  const H = 0.036;
  const COVER_T = 0.003;
  const OVERHANG = 0.004;
  const LINE_W = 0.0012;
  const LINE_H = 0.0004;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xebe6dc,
    roughness: 0.85,
    metalness: 0.0
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf5f1e8,
    roughness: 0.9,
    metalness: 0.0
  });

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x2f353b,
    roughness: 0.7,
    metalness: 0.0
  });

  const backCover = new THREE.Mesh(new THREE.BoxGeometry(W, COVER_T, D), coverMat);
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  const frontCover = new THREE.Mesh(new THREE.BoxGeometry(W, COVER_T, D), coverMat);
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T / 2, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(COVER_T, H, D), coverMat);
  spine.name = 'spine';
  spine.position.set(-W / 2 + COVER_T / 2, H / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  const pageW = W - COVER_T - OVERHANG;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * OVERHANG;
  const pageBlock = new THREE.Mesh(new THREE.BoxGeometry(pageW, pageH, pageD), pageMat);
  pageBlock.name = 'page_block';
  pageBlock.position.set((COVER_T - OVERHANG) / 2, H / 2, 0);
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  const lineY = H + LINE_H / 2;

  function addLine(name, x, z, lenX, lenZ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(lenX, LINE_H, lenZ), lineMat);
    mesh.name = name;
    mesh.position.set(x, lineY, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Architectural passage frame lines on front cover
  addLine('cover_frame_outer_top', -0.01, -0.02, 0.08, LINE_W);
  addLine('cover_frame_outer_left', -0.05, 0.025, LINE_W, 0.09);
  addLine('cover_frame_outer_right', 0.03, 0.025, LINE_W, 0.09);

  addLine('cover_frame_inner_top', -0.01, 0.005, 0.044, LINE_W);
  addLine('cover_frame_inner_bottom', -0.01, 0.055, 0.044, LINE_W);
  addLine('cover_frame_inner_left', -0.032, 0.03, LINE_W, 0.05);
  addLine('cover_frame_inner_right', 0.012, 0.03, LINE_W, 0.05);

  // Parallel vertical accent lines near fore-edge
  for (let i = 0; i < 4; i++) {
    addLine(`cover_band_line_${i + 1}`, 0.048 + i * 0.005, 0, LINE_W, D - 0.01);
  }

  return group;
}
