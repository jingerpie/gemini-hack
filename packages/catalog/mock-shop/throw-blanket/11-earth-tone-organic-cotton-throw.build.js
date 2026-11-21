function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;
  const D = 0.36;
  const H = 0.09;
  const LAYER_COUNT = 3;
  const LAYER_H = H / LAYER_COUNT;
  const BEVEL = 0.009;
  const CORNER_R = 0.025;
  const FRINGE_LEN = 0.042;
  const FRINGE_R = 0.0032;
  const FRINGE_COUNT = 14;

  // Materials (earth-tone organic cotton palette)
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6ddd0,
    roughness: 0.92,
    metalness: 0.0
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0x9e4b30,
    roughness: 0.94,
    metalness: 0.0
  });
  const matOlive = new THREE.MeshStandardMaterial({
    color: 0x656839,
    roughness: 0.94,
    metalness: 0.0
  });
  const matOchre = new THREE.MeshStandardMaterial({
    color: 0xba925a,
    roughness: 0.93,
    metalness: 0.0
  });
  const matSand = new THREE.MeshStandardMaterial({
    color: 0xd4b59a,
    roughness: 0.92,
    metalness: 0.0
  });

  // Helper to create a rounded rectangle shape
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);

    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // Helper to create a softly rounded blanket layer
  function createLayerGeometry(width, depth, height, bevel) {
    const innerW = width - bevel * 2;
    const innerD = depth - bevel * 2;
    const innerH = Math.max(0.002, height - bevel * 2);
    const shape = createRoundedRectShape(innerW, innerD, CORNER_R);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: innerH,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, bevel, 0);
    return geo;
  }

  // 1. Folded blanket layers (3 stacked layers)
  const layerGeo = createLayerGeometry(W, D, LAYER_H, BEVEL);
  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = new THREE.Mesh(layerGeo, matCream);
    layer.name = `blanket_layer_${i + 1}`;
    // Slight overlap so layers touch cleanly
    layer.position.y = i * (LAYER_H - 0.002);
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
  }

  // 2. Rounded fold bends connecting the layers at the sides
  const foldGeo = new THREE.CapsuleGeometry(LAYER_H * 0.85, D - CORNER_R * 2, 8, 16);
  foldGeo.rotateX(Math.PI / 2);

  const foldRight = new THREE.Mesh(foldGeo, matCream);
  foldRight.name = 'blanket_fold_right';
  foldRight.position.set(W / 2 - LAYER_H * 0.45, LAYER_H * 0.95, 0);
  foldRight.castShadow = true;
  foldRight.receiveShadow = true;
  group.add(foldRight);

  const foldLeft = new THREE.Mesh(foldGeo, matCream);
  foldLeft.name = 'blanket_fold_left';
  foldLeft.position.set(-W / 2 + LAYER_H * 0.45, LAYER_H * 1.9, 0);
  foldLeft.castShadow = true;
  foldLeft.receiveShadow = true;
  group.add(foldLeft);

  // 3. Earth-tone woven stripes across the top layer
  const topY = (LAYER_COUNT - 1) * (LAYER_H - 0.002) + LAYER_H - 0.002;
  const stripeDefs = [
    { name: 'stripe_terracotta_1', mat: matTerracotta, z: -0.115, depth: 0.042 },
    { name: 'stripe_sand_1',       mat: matSand,       z: -0.068, depth: 0.032 },
    { name: 'stripe_olive_1',      mat: matOlive,      z: -0.022, depth: 0.040 },
    { name: 'stripe_ochre_1',      mat: matOchre,      z:  0.030, depth: 0.038 },
    { name: 'stripe_terracotta_2', mat: matTerracotta, z:  0.082, depth: 0.036 },
    { name: 'stripe_olive_2',      mat: matOlive,      z:  0.128, depth: 0.032 }
  ];

  const stripeBevel = 0.0025;
  const stripeH = 0.006;
  const stripeW = W - 0.012;

  for (let i = 0; i < stripeDefs.length; i++) {
    const s = stripeDefs[i];
    const sGeo = createLayerGeometry(stripeW, s.depth, stripeH, stripeBevel);
    const stripe = new THREE.Mesh(sGeo, s.mat);
    stripe.name = s.name;
    stripe.position.set(0, topY - stripeH * 0.45, s.z);
    stripe.castShadow = true;
    stripe.receiveShadow = true;
    group.add(stripe);
  }

  // 4. Cream fringe tassels along the front (+Z) edge
  const fringeGeo = new THREE.CapsuleGeometry(FRINGE_R, FRINGE_LEN, 4, 8);
  fringeGeo.rotateX(Math.PI / 2);

  const fringeSpan = W - 0.06;
  const fringeZ = D / 2 + FRINGE_LEN * 0.42;
  const fringeY = FRINGE_R + 0.002;

  for (let i = 0; i < FRINGE_COUNT; i++) {
    const t = FRINGE_COUNT > 1 ? i / (FRINGE_COUNT - 1) : 0.5;
    const x = -fringeSpan / 2 + t * fringeSpan;
    const tassel = new THREE.Mesh(fringeGeo, matCream);
    tassel.name = `fringe_tassel_${i + 1}`;
    tassel.position.set(x, fringeY, fringeZ);
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
