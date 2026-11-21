function build(THREE) {
  const W = 0.18;
  const H = 0.042;
  const D = 0.24;
  const COVER_T = 0.003;
  const OVERHANG = 0.004;
  const PAGE_H = H - 2 * COVER_T;
  const PAGE_W = W - OVERHANG;
  const PAGE_D = D - 2 * OVERHANG;
  const FRAME_T = 0.0006;
  const TAB_COUNT = 10;

  const group = new THREE.Group();

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x7e7b52,
    roughness: 0.85,
    metalness: 0.02
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece1,
    roughness: 0.9,
    metalness: 0.0
  });

  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x2e2b1f,
    roughness: 0.75,
    metalness: 0.05
  });

  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T / 2, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(COVER_T, H, D),
    coverMat
  );
  spine.name = 'spine';
  spine.position.set(-W / 2 + COVER_T / 2, H / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_W, PAGE_H, PAGE_D),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(-OVERHANG / 2, H / 2, 0);
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  const frameMargins = [0.014, 0.024, 0.034];
  const lineW = 0.0014;
  for (let i = 0; i < frameMargins.length; i++) {
    const m = frameMargins[i];
    const outerW = W - 2 * m;
    const outerD = D - 2 * m;
    const innerW = outerW - 2 * lineW;
    const innerD = outerD - 2 * lineW;

    const shape = new THREE.Shape();
    shape.moveTo(-outerW / 2, -outerD / 2);
    shape.lineTo(outerW / 2, -outerD / 2);
    shape.lineTo(outerW / 2, outerD / 2);
    shape.lineTo(-outerW / 2, outerD / 2);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-innerW / 2, -innerD / 2);
    hole.lineTo(-innerW / 2, innerD / 2);
    hole.lineTo(innerW / 2, innerD / 2);
    hole.lineTo(innerW / 2, -innerD / 2);
    hole.closePath();
    shape.holes.push(hole);

    const frameGeo = new THREE.ExtrudeGeometry(shape, {
      depth: FRAME_T,
      bevelEnabled: false
    });
    frameGeo.rotateX(-Math.PI / 2);

    const frameMesh = new THREE.Mesh(frameGeo, inkMat);
    frameMesh.name = 'cover_frame_' + (i + 1);
    frameMesh.position.set(0, H, 0);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    group.add(frameMesh);
  }

  const titleBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, FRAME_T, 0.032),
    inkMat
  );
  titleBlock.name = 'title_block';
  titleBlock.position.set(0, H + FRAME_T / 2, -0.012);
  titleBlock.castShadow = true;
  titleBlock.receiveShadow = true;
  group.add(titleBlock);

  const subtitleBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, FRAME_T, 0.012),
    inkMat
  );
  subtitleBlock.name = 'subtitle_block';
  subtitleBlock.position.set(0, H + FRAME_T / 2, 0.024);
  subtitleBlock.castShadow = true;
  subtitleBlock.receiveShadow = true;
  group.add(subtitleBlock);

  const tabSpan = PAGE_D * 0.84;
  const tabStep = tabSpan / (TAB_COUNT - 1);
  const tabW = 0.002;
  const tabH = PAGE_H * 0.55;
  const tabD = 0.011;
  const tabGeo = new THREE.BoxGeometry(tabW, tabH, tabD);

  for (let i = 0; i < TAB_COUNT; i++) {
    const tab = new THREE.Mesh(tabGeo, inkMat);
    tab.name = 'thumb_tab_' + (i + 1);
    const zPos = -tabSpan / 2 + i * tabStep;
    tab.position.set(PAGE_W / 2 - OVERHANG / 2 + tabW / 2 - 0.0005, H / 2, zPos);
    tab.castShadow = true;
    tab.receiveShadow = true;
    group.add(tab);
  }

  return group;
}
