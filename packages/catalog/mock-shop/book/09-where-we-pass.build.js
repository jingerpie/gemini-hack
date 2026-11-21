function build(THREE) {
  const group = new THREE.Group();

  const W = 0.22;
  const H = 0.028;
  const D = 0.29;
  const COVER_T = 0.003;
  const OVERHANG = 0.0035;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xc8bca8,
    roughness: 0.85,
    metalness: 0.0
  });

  const debossMat = new THREE.MeshStandardMaterial({
    color: 0xb0a38e,
    roughness: 0.9,
    metalness: 0.0
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf4f0e8,
    roughness: 0.9,
    metalness: 0.0
  });

  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = "back_cover";
  backCover.position.set(0, COVER_T / 2, 0);
  group.add(backCover);

  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = "front_cover";
  frontCover.position.set(0, H - COVER_T / 2, 0);
  group.add(frontCover);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    coverMat
  );
  spine.name = "spine";
  spine.position.set(-W / 2 + COVER_T / 2, H / 2, 0);
  group.add(spine);

  const pageW = W - COVER_T - OVERHANG;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * OVERHANG;

  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat
  );
  pageBlock.name = "page_block";
  pageBlock.position.set((COVER_T - OVERHANG) / 2, H / 2, 0);
  group.add(pageBlock);

  const titleBar = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.68, 0.0004, 0.012),
    debossMat
  );
  titleBar.name = "cover_title_deboss";
  titleBar.position.set(0.008, H + 0.0001, -D / 2 + 0.036);
  group.add(titleBar);

  const spineTitleBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.0004, 0.008, D * 0.24),
    debossMat
  );
  spineTitleBar.name = "spine_title_deboss";
  spineTitleBar.position.set(-W / 2 - 0.0001, H / 2, -D * 0.22);
  group.add(spineTitleBar);

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
