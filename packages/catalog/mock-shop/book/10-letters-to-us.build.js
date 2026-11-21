function build(THREE) {
  const group = new THREE.Group();

  const W = 0.18;
  const D = 0.24;
  const H = 0.036;
  const COVER_T = 0.003;
  const OVERHANG = 0.004;
  const SPINE_R = H / 2;
  const HINGE_R = 0.0012;

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0xe4c2bc,
    roughness: 0.85,
    metalness: 0.0
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.9,
    metalness: 0.0
  });

  const boardW = W - SPINE_R;
  const boardCenterX = SPINE_R / 2;

  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(boardW, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(boardCenterX, COVER_T / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(boardW, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(boardCenterX, H - COVER_T / 2, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  const spine = new THREE.Mesh(
    new THREE.CylinderGeometry(SPINE_R, SPINE_R, D, 24, 1, false, Math.PI, Math.PI),
    coverMat
  );
  spine.name = 'spine';
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-W / 2 + SPINE_R, H / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  const hingeX = -W / 2 + SPINE_R + 0.006;

  const frontHinge = new THREE.Mesh(
    new THREE.CylinderGeometry(HINGE_R, HINGE_R, D, 12),
    coverMat
  );
  frontHinge.name = 'front_hinge_crease';
  frontHinge.rotation.x = Math.PI / 2;
  frontHinge.position.set(hingeX, H - COVER_T / 2, 0);
  frontHinge.castShadow = true;
  frontHinge.receiveShadow = true;
  group.add(frontHinge);

  const backHinge = new THREE.Mesh(
    new THREE.CylinderGeometry(HINGE_R, HINGE_R, D, 12),
    coverMat
  );
  backHinge.name = 'back_hinge_crease';
  backHinge.rotation.x = Math.PI / 2;
  backHinge.position.set(hingeX, COVER_T / 2, 0);
  backHinge.castShadow = true;
  backHinge.receiveShadow = true;
  group.add(backHinge);

  const pageW = boardW - OVERHANG;
  const pageH = H - 2 * COVER_T;
  const pageD = D - 2 * OVERHANG;
  const pageCenterX = (-W / 2 + SPINE_R + W / 2 - OVERHANG) / 2;

  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(pageCenterX, H / 2, 0);
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  return group;
}
