function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.75;
  const D = 0.40;

  const APRON_H = 0.125;
  const TOP_THICK = 0.024;
  const PANEL_THICK = 0.022;
  const BOX_H = APRON_H - TOP_THICK;

  const DRAWER_W = 0.60;
  const GAP = 0.003;
  const FRONT_SIDE_W = (W - DRAWER_W) / 2 - GAP;

  const GLIDE_H = 0.004;
  const LEG_H = H - APRON_H - GLIDE_H;
  const LEG_THICK = 0.024;
  const LEG_DEPTH = D - 0.012;
  const LEG_INSET_X = 0.004;
  const BRACKET_W = 0.30;
  const BRACKET_H = 0.014;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6e44,
    roughness: 0.65,
    metalness: 0.04,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x7c766e,
    roughness: 0.36,
    metalness: 0.75,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x221e1a,
    roughness: 0.85,
    metalness: 0.1,
  });

  function addMesh(name, geo, mat, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Wooden top slab
  addMesh(
    'top_slab',
    new THREE.BoxGeometry(W, TOP_THICK, D),
    woodMat,
    0,
    H - TOP_THICK / 2,
    0
  );

  const boxCenterY = H - TOP_THICK - BOX_H / 2;

  // Back panel
  addMesh(
    'back_panel',
    new THREE.BoxGeometry(W, BOX_H, PANEL_THICK),
    woodMat,
    0,
    boxCenterY,
    -D / 2 + PANEL_THICK / 2
  );

  // Left and right side panels
  const sideDepth = D - PANEL_THICK * 2;
  addMesh(
    'left_side_panel',
    new THREE.BoxGeometry(PANEL_THICK, BOX_H, sideDepth),
    woodMat,
    -W / 2 + PANEL_THICK / 2,
    boxCenterY,
    0
  );
  addMesh(
    'right_side_panel',
    new THREE.BoxGeometry(PANEL_THICK, BOX_H, sideDepth),
    woodMat,
    W / 2 - PANEL_THICK / 2,
    boxCenterY,
    0
  );

  // Bottom panel
  addMesh(
    'bottom_panel',
    new THREE.BoxGeometry(W - PANEL_THICK * 2, PANEL_THICK, sideDepth),
    woodMat,
    0,
    H - APRON_H + PANEL_THICK / 2,
    0
  );

  // Front apron left & right fixed panels
  const frontZ = D / 2 - PANEL_THICK / 2;
  addMesh(
    'front_left_apron',
    new THREE.BoxGeometry(FRONT_SIDE_W, BOX_H, PANEL_THICK),
    woodMat,
    -W / 2 + FRONT_SIDE_W / 2,
    boxCenterY,
    frontZ
  );
  addMesh(
    'front_right_apron',
    new THREE.BoxGeometry(FRONT_SIDE_W, BOX_H, PANEL_THICK),
    woodMat,
    W / 2 - FRONT_SIDE_W / 2,
    boxCenterY,
    frontZ
  );

  // Drawer front (with subtle reveal gap)
  addMesh(
    'drawer_front',
    new THREE.BoxGeometry(DRAWER_W, BOX_H - GAP, PANEL_THICK),
    woodMat,
    0,
    boxCenterY - GAP / 2,
    frontZ
  );

  // Recessed dark backing behind drawer gap
  addMesh(
    'drawer_gap_backing',
    new THREE.BoxGeometry(DRAWER_W + GAP * 4, BOX_H - 0.002, 0.008),
    darkMat,
    0,
    boxCenterY,
    frontZ - PANEL_THICK / 2 - 0.002
  );

  // Metal sled legs (left and right)
  const legSides = [
    { prefix: 'left', sign: -1 },
    { prefix: 'right', sign: 1 },
  ];

  const legPostH = LEG_H - LEG_THICK - BRACKET_H;
  const legPostCenterY = GLIDE_H + LEG_THICK + legPostH / 2;
  const legFrontZ = LEG_DEPTH / 2 - LEG_THICK / 2;
  const legBackZ = -LEG_DEPTH / 2 + LEG_THICK / 2;

  for (const side of legSides) {
    const legX = side.sign * (W / 2 - LEG_INSET_X - LEG_THICK / 2);

    // Front vertical post
    addMesh(
      `${side.prefix}_leg_front`,
      new THREE.BoxGeometry(LEG_THICK, legPostH, LEG_THICK),
      metalMat,
      legX,
      legPostCenterY,
      legFrontZ
    );

    // Back vertical post
    addMesh(
      `${side.prefix}_leg_back`,
      new THREE.BoxGeometry(LEG_THICK, legPostH, LEG_THICK),
      metalMat,
      legX,
      legPostCenterY,
      legBackZ
    );

    // Bottom horizontal sled bar
    addMesh(
      `${side.prefix}_leg_bottom`,
      new THREE.BoxGeometry(LEG_THICK, LEG_THICK, LEG_DEPTH),
      metalMat,
      legX,
      GLIDE_H + LEG_THICK / 2,
      0
    );

    // Top horizontal bracket extending inward under the apron
    const bracketX = side.sign * (W / 2 - LEG_INSET_X - BRACKET_W / 2);
    addMesh(
      `${side.prefix}_leg_top_bracket`,
      new THREE.BoxGeometry(BRACKET_W, BRACKET_H, LEG_DEPTH),
      metalMat,
      bracketX,
      H - APRON_H - BRACKET_H / 2,
      0
    );

    // Corner glides
    addMesh(
      `${side.prefix}_glide_front`,
      new THREE.BoxGeometry(LEG_THICK * 0.85, GLIDE_H, LEG_THICK * 0.85),
      darkMat,
      legX,
      GLIDE_H / 2,
      legFrontZ
    );
    addMesh(
      `${side.prefix}_glide_back`,
      new THREE.BoxGeometry(LEG_THICK * 0.85, GLIDE_H, LEG_THICK * 0.85),
      darkMat,
      legX,
      GLIDE_H / 2,
      legBackZ
    );
  }

  return group;
}
