function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions for a hardcover novel (meters), lying flat
  const W = 0.155;       // width (X axis, spine at -X, fore-edge at +X)
  const D = 0.235;       // length (Z axis, head at -Z, tail at +Z)
  const H = 0.032;       // total thickness (Y axis)
  const COVER_T = 0.0028;
  const PAGE_RECESS = 0.004;
  const LAYER_STEP = 0.0004;

  // Materials
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x151619,
    roughness: 0.72,
    metalness: 0.05
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xdcd7c9,
    roughness: 0.88,
    metalness: 0.0
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x7c724b,
    roughness: 0.5,
    metalness: 0.25
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x5c3440,
    roughness: 0.65,
    metalness: 0.1
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xebe6d5,
    roughness: 0.8,
    metalness: 0.02
  });
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0x8e3121,
    roughness: 0.6,
    metalness: 0.15
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x181716,
    roughness: 0.75,
    metalness: 0.05
  });

  // 1. Back cover (bottom, y = 0 to COVER_T)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  backCover.name = 'back_cover';
  backCover.position.set(0, COVER_T / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  // 2. Page block (between covers, recessed from +X, -Z, +Z)
  const pageW = W - PAGE_RECESS * 2;
  const pageH = H - COVER_T * 2;
  const pageD = D - PAGE_RECESS * 2;
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    pageMat
  );
  pageBlock.name = 'page_block';
  pageBlock.position.set(0, COVER_T + pageH / 2, 0);
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  // 3. Spine (-X side, connecting back and front covers)
  const spine = new THREE.Mesh(
    new THREE.CylinderGeometry(H / 2, H / 2, D, 16, 1, false, Math.PI, Math.PI),
    coverMat
  );
  spine.name = 'spine';
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-W / 2 + COVER_T * 0.5, H / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  // 4. Front cover (top, y = H - COVER_T to H)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W, COVER_T, D),
    coverMat
  );
  frontCover.name = 'front_cover';
  frontCover.position.set(0, H - COVER_T / 2, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  const topY = H;

  // 5. Outer gold/olive frame on front cover
  const frameW = W * 0.84;
  const frameD = D * 0.88;
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-frameW / 2, -frameD / 2);
  frameShape.lineTo(frameW / 2, -frameD / 2);
  frameShape.lineTo(frameW / 2, frameD / 2);
  frameShape.lineTo(-frameW / 2, frameD / 2);
  frameShape.closePath();

  const innerW = frameW - 0.004;
  const innerD = frameD - 0.004;
  const frameHole = new THREE.Path();
  frameHole.moveTo(-innerW / 2, -innerD / 2);
  frameHole.lineTo(-innerW / 2, innerD / 2);
  frameHole.lineTo(innerW / 2, innerD / 2);
  frameHole.lineTo(innerW / 2, -innerD / 2);
  frameHole.closePath();
  frameShape.holes.push(frameHole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: LAYER_STEP,
    bevelEnabled: false
  });
  frameGeo.rotateX(-Math.PI / 2);
  const coverFrame = new THREE.Mesh(frameGeo, frameMat);
  coverFrame.name = 'cover_frame';
  coverFrame.position.set(0.002, topY, 0);
  coverFrame.castShadow = true;
  coverFrame.receiveShadow = true;
  group.add(coverFrame);

  // 6. Central cream arch/oval panel
  const panelW = W * 0.66;
  const panelD = D * 0.74;
  const panelShape = new THREE.Shape();
  const r = panelW * 0.45;
  panelShape.moveTo(-panelW / 2, -panelD / 2 + r);
  panelShape.quadraticCurveTo(-panelW / 2, -panelD / 2, 0, -panelD / 2);
  panelShape.quadraticCurveTo(panelW / 2, -panelD / 2, panelW / 2, -panelD / 2 + r);
  panelShape.lineTo(panelW / 2, panelD / 2 - r);
  panelShape.quadraticCurveTo(panelW / 2, panelD / 2, 0, panelD / 2);
  panelShape.quadraticCurveTo(-panelW / 2, panelD / 2, -panelW / 2, panelD / 2 - r);
  panelShape.closePath();

  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: LAYER_STEP,
    bevelEnabled: false,
    curveSegments: 16
  });
  panelGeo.rotateX(-Math.PI / 2);
  const coverPanel = new THREE.Mesh(panelGeo, creamMat);
  coverPanel.name = 'cover_panel';
  coverPanel.position.set(0.002, topY + LAYER_STEP, 0);
  coverPanel.castShadow = true;
  coverPanel.receiveShadow = true;
  group.add(coverPanel);

  // 7. Bell silhouette on the cream panel
  const bellShape = new THREE.Shape();
  bellShape.moveTo(-0.028, -0.028);
  bellShape.lineTo(0.028, -0.028);
  bellShape.quadraticCurveTo(0.022, -0.015, 0.018, 0.008);
  bellShape.quadraticCurveTo(0.016, 0.024, 0, 0.026);
  bellShape.quadraticCurveTo(-0.016, 0.024, -0.018, 0.008);
  bellShape.quadraticCurveTo(-0.022, -0.015, -0.028, -0.028);
  bellShape.closePath();

  const bellGeo = new THREE.ExtrudeGeometry(bellShape, {
    depth: LAYER_STEP,
    bevelEnabled: false,
    curveSegments: 12
  });
  bellGeo.rotateX(-Math.PI / 2);
  const bellBody = new THREE.Mesh(bellGeo, bellMat);
  bellBody.name = 'bell_body';
  bellBody.position.set(0.002, topY + LAYER_STEP * 2, -0.012);
  bellBody.castShadow = true;
  bellBody.receiveShadow = true;
  group.add(bellBody);

  // 8. Bell chain (above bell, toward -Z)
  const bellChain = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, LAYER_STEP, 0.032),
    bellMat
  );
  bellChain.name = 'bell_chain';
  bellChain.position.set(0.002, topY + LAYER_STEP * 2.5, -0.056);
  bellChain.castShadow = true;
  bellChain.receiveShadow = true;
  group.add(bellChain);

  // 9. Bell clapper (below bell)
  const bellClapper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, LAYER_STEP, 12),
    bellMat
  );
  bellClapper.name = 'bell_clapper';
  bellClapper.position.set(0.002, topY + LAYER_STEP * 2.5, 0.020);
  bellClapper.castShadow = true;
  bellClapper.receiveShadow = true;
  group.add(bellClapper);

  // 10. Diagonal claw scratch marks across the bell
  const clawOffsets = [-0.007, 0.003];
  for (let i = 0; i < clawOffsets.length; i++) {
    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(0.0035, LAYER_STEP, 0.056),
      creamMat
    );
    claw.name = 'claw_mark_' + (i + 1);
    claw.position.set(0.002 + clawOffsets[i], topY + LAYER_STEP * 3.5, -0.010);
    claw.rotation.y = -0.45;
    claw.castShadow = true;
    claw.receiveShadow = true;
    group.add(claw);
  }

  // 11. Title & author text blocks
  const titleLine1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, LAYER_STEP, 0.008),
    inkMat
  );
  titleLine1.name = 'title_block_1';
  titleLine1.position.set(0.002, topY + LAYER_STEP * 2.5, 0.038);
  titleLine1.castShadow = true;
  titleLine1.receiveShadow = true;
  group.add(titleLine1);

  const titleLine2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.050, LAYER_STEP, 0.008),
    inkMat
  );
  titleLine2.name = 'title_block_2';
  titleLine2.position.set(0.002, topY + LAYER_STEP * 2.5, 0.050);
  titleLine2.castShadow = true;
  titleLine2.receiveShadow = true;
  group.add(titleLine2);

  const authorBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, LAYER_STEP, 0.005),
    inkMat
  );
  authorBlock.name = 'author_block';
  authorBlock.position.set(0.002, topY + LAYER_STEP * 2.5, 0.065);
  authorBlock.castShadow = true;
  authorBlock.receiveShadow = true;
  group.add(authorBlock);

  // 12. Subtle plum corner accents
  const cornerPositions = [
    [-frameW / 2 + 0.012, -frameD / 2 + 0.012],
    [frameW / 2 - 0.012, -frameD / 2 + 0.012],
    [-frameW / 2 + 0.012, frameD / 2 - 0.012],
    [frameW / 2 - 0.012, frameD / 2 - 0.012]
  ];
  for (let i = 0; i < cornerPositions.length; i++) {
    const corner = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, LAYER_STEP, 0.012),
      accentMat
    );
    corner.name = 'corner_accent_' + (i + 1);
    corner.position.set(0.002 + cornerPositions[i][0], topY + LAYER_STEP * 0.5, cornerPositions[i][1]);
    corner.castShadow = true;
    corner.receiveShadow = true;
    group.add(corner);
  }

  return group;
}
