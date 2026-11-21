function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a closed novel lying flat
  const W = 0.155;        // X: spine (-X) to fore-edge (+X)
  const H = 0.032;        // Y: thickness
  const D = 0.230;        // Z: head (-Z) to tail (+Z)
  const COVER_T = 0.0025; // cover board thickness
  const SPINE_W = 0.004;  // spine wrap thickness
  const OVERHANG = 0.003; // cover overhang beyond page block

  // Materials
  const blackCoverMat = new THREE.MeshStandardMaterial({
    color: 0x151719,
    roughness: 0.78,
    metalness: 0.04,
  });

  const spineMat = new THREE.MeshStandardMaterial({
    color: 0xb8462e,
    roughness: 0.72,
    metalness: 0.04,
  });

  const redPanelMat = new THREE.MeshStandardMaterial({
    color: 0x8e2c1f,
    roughness: 0.75,
    metalness: 0.03,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf0ead6,
    roughness: 0.9,
    metalness: 0.0,
  });

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd9a773,
    roughness: 0.45,
    metalness: 0.35,
  });

  // 1. Page block (inset from covers on +X, -Z, +Z)
  const pageW = W - SPINE_W - OVERHANG;
  const pageH = H - COVER_T * 2;
  const pageD = D - OVERHANG * 2;
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat
  );
  pageBlock.position.set(
    -W / 2 + SPINE_W + pageW / 2,
    H / 2,
    0
  );
  pageBlock.name = 'page_block';
  group.add(pageBlock);

  // 2. Back cover (bottom, y = 0 to COVER_T)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W - SPINE_W, COVER_T, D),
    blackCoverMat
  );
  backCover.position.set(SPINE_W / 2, COVER_T / 2, 0);
  backCover.name = 'back_cover';
  group.add(backCover);

  // 3. Front cover (top, y = H - COVER_T to H)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W - SPINE_W, COVER_T, D),
    blackCoverMat
  );
  frontCover.position.set(SPINE_W / 2, H - COVER_T / 2, 0);
  frontCover.name = 'front_cover';
  group.add(frontCover);

  // 4. Spine (-X side, terracotta orange-red)
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(SPINE_W, H, D),
    spineMat
  );
  spine.position.set(-W / 2 + SPINE_W / 2, H / 2, 0);
  spine.name = 'spine';
  group.add(spine);

  // 5. Front cover red graphic panel
  const panelW = W - SPINE_W - 0.018;
  const panelD = D - 0.036;
  const panelT = 0.0006;
  const panelY = H + panelT / 2;
  const panelX = SPINE_W / 2 + 0.001;
  const panelZ = -0.006;

  const redPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, panelT, panelD),
    redPanelMat
  );
  redPanel.position.set(panelX, panelY, panelZ);
  redPanel.name = 'cover_red_panel';
  group.add(redPanel);

  // 6. Gothic arch vertical framing bars on the red panel
  const barW = 0.005;
  const barT = 0.0008;
  const barY = H + barT / 2;
  const archSpanX = panelW * 0.56;

  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(barW, barT, panelD * 0.72),
    blackCoverMat
  );
  leftPillar.position.set(panelX - archSpanX / 2, barY, panelZ + panelD * 0.14);
  leftPillar.name = 'arch_left_pillar';
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(barW, barT, panelD * 0.72),
    blackCoverMat
  );
  rightPillar.position.set(panelX + archSpanX / 2, barY, panelZ + panelD * 0.14);
  rightPillar.name = 'arch_right_pillar';
  group.add(rightPillar);

  // 7. Title & author typography accent blocks
  const titleBlock = new THREE.Mesh(
    new THREE.BoxGeometry(archSpanX * 0.62, barT, 0.042),
    goldFoilMat
  );
  titleBlock.position.set(panelX, barY, panelZ - 0.005);
  titleBlock.name = 'title_foil_block';
  group.add(titleBlock);

  const authorBlock = new THREE.Mesh(
    new THREE.BoxGeometry(panelW * 0.65, barT, 0.012),
    redPanelMat
  );
  authorBlock.position.set(panelX, barY, D / 2 - 0.016);
  authorBlock.name = 'author_name_block';
  group.add(authorBlock);

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
