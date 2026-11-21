function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.30;
  const H = 0.40;
  const D = 0.024;
  const FRAME_W = 0.012;
  const BACK_T = 0.003;
  const MAT_T = 0.002;
  const GLASS_T = 0.001;
  const ART_T = 0.0004;

  const MAT_SIDE = 0.036;
  const MAT_TOP_BOT = 0.046;

  const zBack = -D / 2;
  const zPaper = zBack + BACK_T;
  const zBlocks = zPaper + ART_T;
  const zArches = zBlocks + ART_T;
  const zMat = zArches + ART_T + 0.001;
  const zGlass = zMat + MAT_T + 0.001;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xeae5dc,
    roughness: 0.55,
    metalness: 0.02
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x8c7b6b,
    roughness: 0.9,
    metalness: 0.0
  });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.88,
    metalness: 0.0
  });
  const matBoardMat = new THREE.MeshStandardMaterial({
    color: 0xebe6dc,
    roughness: 0.85,
    metalness: 0.0
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.08,
    clearcoat: 1.0
  });

  const outerArchMat = new THREE.MeshStandardMaterial({
    color: 0xd7c9c1,
    roughness: 0.85,
    metalness: 0.0
  });
  const midArchMat = new THREE.MeshStandardMaterial({
    color: 0xcbb5a4,
    roughness: 0.85,
    metalness: 0.0
  });
  const innerArchMat = new THREE.MeshStandardMaterial({
    color: 0xa38973,
    roughness: 0.85,
    metalness: 0.0
  });
  const leftBlockMat = new THREE.MeshStandardMaterial({
    color: 0x695641,
    roughness: 0.85,
    metalness: 0.0
  });
  const rightBlockMat = new THREE.MeshStandardMaterial({
    color: 0xa37048,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Outer Frame (4 rails)
  const railSideGeo = new THREE.BoxGeometry(FRAME_W, H, D);
  const railTopBotGeo = new THREE.BoxGeometry(W - 2 * FRAME_W, FRAME_W, D);

  addMesh(railSideGeo, frameMat, 'frame_left', -W / 2 + FRAME_W / 2, H / 2, 0);
  addMesh(railSideGeo, frameMat, 'frame_right', W / 2 - FRAME_W / 2, H / 2, 0);
  addMesh(railTopBotGeo, frameMat, 'frame_top', 0, H - FRAME_W / 2, 0);
  addMesh(railTopBotGeo, frameMat, 'frame_bottom', 0, FRAME_W / 2, 0);

  // Backboard & Paper
  const innerW = W - 2 * FRAME_W;
  const innerH = H - 2 * FRAME_W;

  addMesh(
    new THREE.BoxGeometry(innerW, innerH, BACK_T),
    backMat,
    'backboard',
    0,
    H / 2,
    zBack + BACK_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(innerW, innerH, 0.0005),
    paperMat,
    'print_paper',
    0,
    H / 2,
    zPaper
  );

  // Mat Board (4 strips around opening)
  const openW = innerW - 2 * MAT_SIDE;
  const openH = innerH - 2 * MAT_TOP_BOT;

  addMesh(
    new THREE.BoxGeometry(MAT_SIDE, innerH, MAT_T),
    matBoardMat,
    'mat_left',
    -innerW / 2 + MAT_SIDE / 2,
    H / 2,
    zMat + MAT_T / 2
  );
  addMesh(
    new THREE.BoxGeometry(MAT_SIDE, innerH, MAT_T),
    matBoardMat,
    'mat_right',
    innerW / 2 - MAT_SIDE / 2,
    H / 2,
    zMat + MAT_T / 2
  );
  addMesh(
    new THREE.BoxGeometry(openW, MAT_TOP_BOT, MAT_T),
    matBoardMat,
    'mat_top',
    0,
    H / 2 + openH / 2 + MAT_TOP_BOT / 2,
    zMat + MAT_T / 2
  );
  addMesh(
    new THREE.BoxGeometry(openW, MAT_TOP_BOT, MAT_T),
    matBoardMat,
    'mat_bottom',
    0,
    H / 2 - openH / 2 - MAT_TOP_BOT / 2,
    zMat + MAT_T / 2
  );

  // Glass Pane
  addMesh(
    new THREE.BoxGeometry(innerW, innerH, GLASS_T),
    glassMat,
    'glass_pane',
    0,
    H / 2,
    zGlass + GLASS_T / 2
  );

  // Artwork Composition
  const artBottomY = H / 2 - openH / 2 + 0.018;
  const artCenterY = artBottomY + 0.145;

  // Helper to create an inverted-U arch band
  function createArchGeo(rOuter, rInner, legBottomY, archCenterY) {
    const shape = new THREE.Shape();
    shape.moveTo(-rOuter, legBottomY);
    shape.lineTo(-rOuter, archCenterY);
    shape.absarc(0, archCenterY, rOuter, Math.PI, 0, true);
    shape.lineTo(rOuter, legBottomY);
    shape.lineTo(rInner, legBottomY);
    shape.lineTo(rInner, archCenterY);
    shape.absarc(0, archCenterY, rInner, 0, Math.PI, false);
    shape.lineTo(-rInner, legBottomY);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: ART_T,
      bevelEnabled: false,
      curveSegments: 24
    });
  }

  // Three concentric arches
  addMesh(
    createArchGeo(0.072, 0.062, artBottomY, artCenterY),
    outerArchMat,
    'artwork_outer_arch',
    0,
    0,
    zArches
  );
  addMesh(
    createArchGeo(0.054, 0.044, artBottomY, artCenterY),
    midArchMat,
    'artwork_middle_arch',
    0,
    0,
    zArches
  );
  addMesh(
    createArchGeo(0.036, 0.027, artBottomY, artCenterY),
    innerArchMat,
    'artwork_inner_arch',
    0,
    0,
    zArches
  );

  // Left dark umber block (flat bottom, quarter-circle top-left)
  const leftW = 0.070;
  const leftH = 0.088;
  const leftR = 0.055;
  const leftX0 = -0.075;
  const leftShape = new THREE.Shape();
  leftShape.moveTo(leftX0, artBottomY);
  leftShape.lineTo(leftX0 + leftW, artBottomY);
  leftShape.lineTo(leftX0 + leftW, artBottomY + leftH);
  leftShape.lineTo(leftX0 + leftR, artBottomY + leftH);
  leftShape.absarc(
    leftX0 + leftR,
    artBottomY + leftH - leftR,
    leftR,
    Math.PI / 2,
    Math.PI,
    false
  );
  leftShape.lineTo(leftX0, artBottomY);
  leftShape.closePath();

  addMesh(
    new THREE.ExtrudeGeometry(leftShape, {
      depth: ART_T,
      bevelEnabled: false,
      curveSegments: 24
    }),
    leftBlockMat,
    'artwork_left_block',
    0,
    0,
    zBlocks
  );

  // Right terracotta block (flat bottom, quarter-circle top-right)
  const rightW = 0.070;
  const rightH = 0.125;
  const rightR = 0.062;
  const rightX0 = 0.005;
  const rightShape = new THREE.Shape();
  rightShape.moveTo(rightX0, artBottomY);
  rightShape.lineTo(rightX0 + rightW, artBottomY);
  rightShape.lineTo(rightX0 + rightW, artBottomY + rightH - rightR);
  rightShape.absarc(
    rightX0 + rightW - rightR,
    artBottomY + rightH - rightR,
    rightR,
    0,
    Math.PI / 2,
    false
  );
  rightShape.lineTo(rightX0, artBottomY + rightH);
  rightShape.lineTo(rightX0, artBottomY);
  rightShape.closePath();

  addMesh(
    new THREE.ExtrudeGeometry(rightShape, {
      depth: ART_T,
      bevelEnabled: false,
      curveSegments: 24
    }),
    rightBlockMat,
    'artwork_right_block',
    0,
    0,
    zBlocks
  );

  return group;
}
