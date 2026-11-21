function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.85;
  const H = 1.75;
  const D = 0.36;
  const LEG_W = 0.034;
  const SHELF_T = 0.026;

  // Shelf Y positions (bottom surface of each shelf)
  const SHELF_YS = [0.14, 0.53, 0.92, 1.31, H - SHELF_T];

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xd2bfa5,
    roughness: 0.65,
    metalness: 0.02,
  });

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d5,
    roughness: 0.85,
    metalness: 0.02,
  });

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xdcd6cb,
    roughness: 0.92,
    metalness: 0.0,
  });

  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b43,
    roughness: 0.55,
    metalness: 0.02,
  });

  const bookTanMat = new THREE.MeshStandardMaterial({
    color: 0xb68a5e,
    roughness: 0.78,
    metalness: 0.0,
  });

  const bookDarkMat = new THREE.MeshStandardMaterial({
    color: 0x5d4c40,
    roughness: 0.8,
    metalness: 0.0,
  });

  const bookWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xebe8e1,
    roughness: 0.85,
    metalness: 0.0,
  });

  const basketLightMat = new THREE.MeshStandardMaterial({
    color: 0xd5ccb9,
    roughness: 0.92,
    metalness: 0.0,
  });

  const basketCreamMat = new THREE.MeshStandardMaterial({
    color: 0xe2dac9,
    roughness: 0.92,
    metalness: 0.0,
  });

  const basketBrownMat = new THREE.MeshStandardMaterial({
    color: 0xa1917a,
    roughness: 0.92,
    metalness: 0.0,
  });

  const basketGreyMat = new THREE.MeshStandardMaterial({
    color: 0x62615e,
    roughness: 0.92,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. Four vertical corner legs
  const legGeo = new THREE.BoxGeometry(LEG_W, H, LEG_W);
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;
  addMesh(legGeo, oakMat, 'leg_front_left', -legX, H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_front_right', legX, H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_back_left', -legX, H / 2, -legZ);
  addMesh(legGeo, oakMat, 'leg_back_right', legX, H / 2, -legZ);

  // 2. Five horizontal shelves
  const innerW = W - LEG_W * 2;
  const shelfGeo = new THREE.BoxGeometry(innerW, SHELF_T, D);
  SHELF_YS.forEach((sy, idx) => {
    addMesh(shelfGeo, oakMat, `shelf_${idx + 1}`, 0, sy + SHELF_T / 2, 0);
  });

  // 3. Top shelf (shelf 4) decor: 3 ceramic vases + folded linen stack
  const s4Top = SHELF_YS[3] + SHELF_T;

  const vase1Pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.0),
    new THREE.Vector2(0.075, 0.05),
    new THREE.Vector2(0.055, 0.11),
    new THREE.Vector2(0.042, 0.14),
    new THREE.Vector2(0.036, 0.14),
    new THREE.Vector2(0.036, 0.12),
    new THREE.Vector2(0.0, 0.12),
  ];
  addMesh(new THREE.LatheGeometry(vase1Pts, 24), ceramicMat, 'vase_left', -0.25, s4Top, 0.02);

  const vase2Pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.038, 0.0),
    new THREE.Vector2(0.062, 0.06),
    new THREE.Vector2(0.052, 0.13),
    new THREE.Vector2(0.032, 0.16),
    new THREE.Vector2(0.026, 0.16),
    new THREE.Vector2(0.026, 0.14),
    new THREE.Vector2(0.0, 0.14),
  ];
  addMesh(new THREE.LatheGeometry(vase2Pts, 24), ceramicMat, 'vase_middle', -0.15, s4Top, -0.04);

  const vase3Pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.0),
    new THREE.Vector2(0.072, 0.08),
    new THREE.Vector2(0.058, 0.15),
    new THREE.Vector2(0.046, 0.19),
    new THREE.Vector2(0.038, 0.19),
    new THREE.Vector2(0.038, 0.17),
    new THREE.Vector2(0.0, 0.17),
  ];
  addMesh(new THREE.LatheGeometry(vase3Pts, 24), ceramicMat, 'vase_right', -0.07, s4Top, 0.03);

  // Folded linen stack on right of shelf 4
  const linenBaseGeo = new THREE.BoxGeometry(0.24, 0.022, 0.22);
  addMesh(linenBaseGeo, linenMat, 'linen_stack_bottom', 0.2, s4Top + 0.011, 0.02);
  addMesh(linenBaseGeo, linenMat, 'linen_stack_mid', 0.2, s4Top + 0.035, 0.015, 0, 0.03, 0);
  addMesh(new THREE.BoxGeometry(0.23, 0.02, 0.2), linenMat, 'linen_stack_top', 0.2, s4Top + 0.057, 0.01, 0, -0.02, 0);
  // Hanging cloth flap over front edge
  addMesh(new THREE.BoxGeometry(0.22, 0.09, 0.014), linenMat, 'linen_hanging_flap', 0.2, s4Top - 0.035, D / 2 - 0.005);

  // 4. Shelf 3 decor: 3 wooden bowls + 1 ceramic arch sculpture
  const s3Top = SHELF_YS[2] + SHELF_T;
  const smallBowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.035, 0.0),
    new THREE.Vector2(0.065, 0.025),
    new THREE.Vector2(0.072, 0.048),
    new THREE.Vector2(0.064, 0.048),
    new THREE.Vector2(0.054, 0.022),
    new THREE.Vector2(0.0, 0.012),
  ];
  const smallBowlGeo = new THREE.LatheGeometry(smallBowlPts, 24);
  addMesh(smallBowlGeo, walnutMat, 'wooden_bowl_left', -0.22, s3Top, 0.01);
  addMesh(smallBowlGeo, walnutMat, 'wooden_bowl_front', -0.12, s3Top, 0.05);

  const largeBowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.0),
    new THREE.Vector2(0.095, 0.035),
    new THREE.Vector2(0.11, 0.075),
    new THREE.Vector2(0.10, 0.075),
    new THREE.Vector2(0.082, 0.032),
    new THREE.Vector2(0.0, 0.015),
  ];
  addMesh(new THREE.LatheGeometry(largeBowlPts, 24), walnutMat, 'wooden_bowl_large', 0.02, s3Top, -0.02);

  // Ceramic arch sculpture on right of shelf 3
  const archLegGeo = new THREE.BoxGeometry(0.042, 0.14, 0.048);
  addMesh(archLegGeo, ceramicMat, 'sculpture_leg_left', 0.21, s3Top + 0.07, 0.02);
  addMesh(archLegGeo, ceramicMat, 'sculpture_leg_right', 0.28, s3Top + 0.07, 0.02);
  addMesh(new THREE.BoxGeometry(0.112, 0.04, 0.048), ceramicMat, 'sculpture_bridge', 0.245, s3Top + 0.10, 0.02);

  // 5. Shelf 2 decor: Row of books + white book stack
  const s2Top = SHELF_YS[1] + SHELF_T;
  const bookSpecs = [
    { x: -0.32, h: 0.21, t: 0.03, mat: bookTanMat },
    { x: -0.285, h: 0.21, t: 0.028, mat: bookTanMat },
    { x: -0.25, h: 0.22, t: 0.032, mat: bookTanMat },
    { x: -0.215, h: 0.20, t: 0.03, mat: bookTanMat },
    { x: -0.18, h: 0.20, t: 0.028, mat: bookTanMat },
    { x: -0.148, h: 0.195, t: 0.028, mat: bookDarkMat },
    { x: -0.115, h: 0.20, t: 0.028, mat: bookTanMat },
    { x: -0.082, h: 0.215, t: 0.028, mat: bookTanMat },
  ];
  bookSpecs.forEach((b, i) => {
    addMesh(new THREE.BoxGeometry(b.t, b.h, 0.16), b.mat, `book_${i + 1}`, b.x, s2Top + b.h / 2, 0.02);
  });
  // Leaning book
  addMesh(new THREE.BoxGeometry(0.026, 0.21, 0.16), bookTanMat, 'book_leaning', -0.025, s2Top + 0.10, 0.02, 0, 0, 0.28);

  // White book stack + upright white book on right of shelf 2
  addMesh(new THREE.BoxGeometry(0.24, 0.045, 0.19), bookWhiteMat, 'white_book_flat', 0.21, s2Top + 0.0225, 0.01);
  addMesh(new THREE.BoxGeometry(0.17, 0.19, 0.035), bookWhiteMat, 'white_book_upright', 0.21, s2Top + 0.045 + 0.095, -0.01);

  // 6. Bottom shelf (shelf 1) decor: 4 woven baskets
  const s1Top = SHELF_YS[0] + SHELF_T;
  function makeBasketGeo(rBot, rMid, rTop, h) {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(rBot, 0.0),
      new THREE.Vector2(rMid, h * 0.45),
      new THREE.Vector2(rTop, h),
      new THREE.Vector2(rTop - 0.012, h),
      new THREE.Vector2(rMid - 0.012, h * 0.45),
      new THREE.Vector2(0.0, 0.012),
    ];
    return new THREE.LatheGeometry(pts, 24);
  }

  addMesh(makeBasketGeo(0.085, 0.115, 0.09, 0.19), basketLightMat, 'basket_front_left', -0.22, s1Top, 0.03);
  addMesh(makeBasketGeo(0.07, 0.095, 0.075, 0.15), basketCreamMat, 'basket_front_mid', -0.01, s1Top, 0.05);
  addMesh(makeBasketGeo(0.095, 0.125, 0.10, 0.22), basketBrownMat, 'basket_back_right', 0.12, s1Top, -0.04);
  addMesh(makeBasketGeo(0.075, 0.10, 0.08, 0.16), basketGreyMat, 'basket_front_right', 0.22, s1Top, 0.05);

  return group;
}
