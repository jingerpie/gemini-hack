function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.06;
  const D = 0.42;
  const TABLE_H = 0.78;
  const GALLERY_H = 0.22;
  const TOP_THICK = 0.026;
  const APRON_H = 0.085;
  const APRON_THICK = 0.022;
  const LEG_SIZE = 0.044;
  const SHELF_Y = 0.145;
  const SHELF_THICK = 0.02;

  const LEG_X = W / 2 - 0.045;
  const LEG_Z_FRONT = D / 2 - 0.045;
  const LEG_Z_BACK = -D / 2 + 0.045;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x543824,
    roughness: 0.44,
    metalness: 0.04
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x432b1a,
    roughness: 0.48,
    metalness: 0.04
  });

  function addMesh(geo, mat, x, y, z, name, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop
  addMesh(
    new THREE.BoxGeometry(W, TOP_THICK, D),
    woodMat,
    0,
    TABLE_H - TOP_THICK / 2,
    0,
    'tabletop_main'
  );
  // Subtle under-bevel molding
  addMesh(
    new THREE.BoxGeometry(W - 0.018, 0.012, D - 0.018),
    darkWoodMat,
    0,
    TABLE_H - TOP_THICK - 0.006,
    0,
    'tabletop_molding'
  );

  // 2. Apron (Frieze)
  const apronY = TABLE_H - TOP_THICK - APRON_H / 2 - 0.006;
  const apronW = LEG_X * 2 - LEG_SIZE;
  const apronD = LEG_Z_FRONT - LEG_Z_BACK - LEG_SIZE;

  addMesh(
    new THREE.BoxGeometry(apronW, APRON_H, APRON_THICK),
    woodMat,
    0,
    apronY,
    LEG_Z_FRONT,
    'apron_front'
  );
  addMesh(
    new THREE.BoxGeometry(apronW, APRON_H, APRON_THICK),
    woodMat,
    0,
    apronY,
    LEG_Z_BACK,
    'apron_back'
  );
  addMesh(
    new THREE.BoxGeometry(APRON_THICK, APRON_H, apronD),
    woodMat,
    -LEG_X,
    apronY,
    (LEG_Z_FRONT + LEG_Z_BACK) / 2,
    'apron_left'
  );
  addMesh(
    new THREE.BoxGeometry(APRON_THICK, APRON_H, apronD),
    woodMat,
    LEG_X,
    apronY,
    (LEG_Z_FRONT + LEG_Z_BACK) / 2,
    'apron_right'
  );

  // Corner brackets under front apron
  const bracketShape = new THREE.Shape();
  bracketShape.moveTo(0, 0);
  bracketShape.lineTo(0.055, 0);
  bracketShape.quadraticCurveTo(0.02, -0.01, 0, -0.055);
  bracketShape.closePath();
  const bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
    depth: 0.014,
    bevelEnabled: false
  });
  bracketGeo.translate(0, 0, -0.007);

  addMesh(
    bracketGeo,
    darkWoodMat,
    -LEG_X + LEG_SIZE / 2,
    apronY - APRON_H / 2,
    LEG_Z_FRONT,
    'apron_bracket_left'
  );
  addMesh(
    bracketGeo,
    darkWoodMat,
    LEG_X - LEG_SIZE / 2,
    apronY - APRON_H / 2,
    LEG_Z_FRONT,
    'apron_bracket_right',
    0,
    Math.PI,
    0
  );

  // 3. Legs
  // Front legs: turned baluster profile + square blocks
  const footPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.012, 0.0),
    new THREE.Vector2(0.015, 0.025),
    new THREE.Vector2(0.011, 0.04),
    new THREE.Vector2(0.018, 0.06),
    new THREE.Vector2(0.013, 0.085),
    new THREE.Vector2(0.018, 0.10),
    new THREE.Vector2(0.0, 0.10)
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, 20);

  const shaftBottom = SHELF_Y + 0.035;
  const shaftTop = TABLE_H - TOP_THICK - APRON_H - 0.01;
  const shaftH = shaftTop - shaftBottom;
  const shaftPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.019, 0.0),
    new THREE.Vector2(0.014, 0.015),
    new THREE.Vector2(0.016, 0.03),
    new THREE.Vector2(0.012, 0.045),
    new THREE.Vector2(0.018, shaftH * 0.55),
    new THREE.Vector2(0.013, shaftH * 0.78),
    new THREE.Vector2(0.020, shaftH * 0.85),
    new THREE.Vector2(0.014, shaftH * 0.92),
    new THREE.Vector2(0.020, shaftH),
    new THREE.Vector2(0.0, shaftH)
  ];
  const shaftGeo = new THREE.LatheGeometry(shaftPoints, 20);

  const lowerBlockH = 0.08;
  const upperBlockH = TABLE_H - TOP_THICK - shaftTop;

  [-LEG_X, LEG_X].forEach((lx, idx) => {
    const side = idx === 0 ? 'left' : 'right';
    addMesh(footGeo, woodMat, lx, 0, LEG_Z_FRONT, `leg_front_${side}_foot`);
    addMesh(
      new THREE.BoxGeometry(LEG_SIZE, lowerBlockH, LEG_SIZE),
      woodMat,
      lx,
      0.10 + lowerBlockH / 2,
      LEG_Z_FRONT,
      `leg_front_${side}_lower_block`
    );
    addMesh(
      shaftGeo,
      woodMat,
      lx,
      shaftBottom,
      LEG_Z_FRONT,
      `leg_front_${side}_shaft`
    );
    addMesh(
      new THREE.BoxGeometry(LEG_SIZE, upperBlockH, LEG_SIZE),
      woodMat,
      lx,
      shaftTop + upperBlockH / 2,
      LEG_Z_FRONT,
      `leg_front_${side}_upper_block`
    );
  });

  // Back legs: straight square posts
  const backLegH = TABLE_H - TOP_THICK;
  [-LEG_X, LEG_X].forEach((lx, idx) => {
    const side = idx === 0 ? 'left' : 'right';
    addMesh(
      new THREE.BoxGeometry(LEG_SIZE, backLegH, LEG_SIZE),
      woodMat,
      lx,
      backLegH / 2,
      LEG_Z_BACK,
      `leg_back_${side}`
    );
  });

  // 4. Lower Shelf
  const shelfW = LEG_X * 2 + 0.01;
  const shelfD = LEG_Z_FRONT - LEG_Z_BACK + 0.01;
  addMesh(
    new THREE.BoxGeometry(shelfW, SHELF_THICK, shelfD),
    woodMat,
    0,
    SHELF_Y,
    (LEG_Z_FRONT + LEG_Z_BACK) / 2,
    'lower_shelf'
  );
  // Shelf back & side rails
  addMesh(
    new THREE.BoxGeometry(apronW, 0.028, 0.018),
    darkWoodMat,
    0,
    SHELF_Y + SHELF_THICK / 2 + 0.014,
    LEG_Z_BACK,
    'lower_shelf_back_rail'
  );
  addMesh(
    new THREE.BoxGeometry(0.018, 0.024, apronD),
    darkWoodMat,
    -LEG_X,
    SHELF_Y + SHELF_THICK / 2 + 0.012,
    (LEG_Z_FRONT + LEG_Z_BACK) / 2,
    'lower_shelf_left_rail'
  );
  addMesh(
    new THREE.BoxGeometry(0.018, 0.024, apronD),
    darkWoodMat,
    LEG_X,
    SHELF_Y + SHELF_THICK / 2 + 0.012,
    (LEG_Z_FRONT + LEG_Z_BACK) / 2,
    'lower_shelf_right_rail'
  );

  // 5. Top Gallery / Backsplash
  const galZ = -D / 2 + 0.028;
  const galW = W - 0.08;
  const galBaseH = 0.11;

  // Corner finials
  const finialPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.016, 0.0),
    new THREE.Vector2(0.016, galBaseH + 0.01),
    new THREE.Vector2(0.010, galBaseH + 0.02),
    new THREE.Vector2(0.015, galBaseH + 0.032),
    new THREE.Vector2(0.008, galBaseH + 0.044),
    new THREE.Vector2(0.011, galBaseH + 0.052),
    new THREE.Vector2(0.0, galBaseH + 0.062)
  ];
  const finialGeo = new THREE.LatheGeometry(finialPoints, 18);

  addMesh(finialGeo, woodMat, -galW / 2, TABLE_H, galZ, 'gallery_finial_left');
  addMesh(finialGeo, woodMat, galW / 2, TABLE_H, galZ, 'gallery_finial_right');

  // Back gallery bottom & top rails
  addMesh(
    new THREE.BoxGeometry(galW - 0.02, 0.018, 0.018),
    woodMat,
    0,
    TABLE_H + 0.009,
    galZ,
    'gallery_back_bottom_rail'
  );
  addMesh(
    new THREE.BoxGeometry(galW - 0.02, 0.018, 0.02),
    woodMat,
    0,
    TABLE_H + galBaseH,
    galZ,
    'gallery_back_top_rail'
  );

  // Central arched crest
  const crestShape = new THREE.Shape();
  crestShape.moveTo(-0.22, 0);
  crestShape.quadraticCurveTo(-0.15, 0.01, -0.11, 0.055);
  crestShape.quadraticCurveTo(-0.05, 0.095, 0, 0.11);
  crestShape.quadraticCurveTo(0.05, 0.095, 0.11, 0.055);
  crestShape.quadraticCurveTo(0.15, 0.01, 0.22, 0);
  crestShape.closePath();

  const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2
  });
  crestGeo.translate(0, 0, -0.008);
  addMesh(
    crestGeo,
    woodMat,
    0,
    TABLE_H + galBaseH - 0.005,
    galZ,
    'gallery_central_crest'
  );

  // Fretwork rings along the back gallery
  const ringGeo = new THREE.TorusGeometry(0.028, 0.006, 8, 18);
  const ringCount = 9;
  for (let i = 0; i < ringCount; i++) {
    const rx = -0.38 + i * (0.76 / (ringCount - 1));
    addMesh(
      ringGeo,
      darkWoodMat,
      rx,
      TABLE_H + 0.058,
      galZ,
      `gallery_fretwork_ring_${i}`
    );
  }

  // Side gallery rails (stepped curve from back finial toward front)
  const sideGalLen = D * 0.52;
  const sideShape = new THREE.Shape();
  sideShape.moveTo(0, 0);
  sideShape.lineTo(sideGalLen, 0);
  sideShape.lineTo(sideGalLen, 0.022);
  sideShape.quadraticCurveTo(sideGalLen * 0.7, 0.055, sideGalLen * 0.35, 0.06);
  sideShape.quadraticCurveTo(sideGalLen * 0.12, 0.065, 0, galBaseH);
  sideShape.closePath();

  const sideGalGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: 0.016,
    bevelEnabled: false
  });
  sideGalGeo.translate(0, 0, -0.008);

  addMesh(
    sideGalGeo,
    woodMat,
    -galW / 2,
    TABLE_H,
    galZ,
    'gallery_side_left',
    0,
    -Math.PI / 2,
    0
  );
  addMesh(
    sideGalGeo,
    woodMat,
    galW / 2,
    TABLE_H,
    galZ,
    'gallery_side_right',
    0,
    -Math.PI / 2,
    0
  );

  return group;
}
