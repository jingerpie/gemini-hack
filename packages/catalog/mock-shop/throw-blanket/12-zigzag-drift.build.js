function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const D = 0.34;
  const H = 0.084;
  const LAYER_H = 0.038;
  const GAP = 0.004;
  const BEVEL = 0.012;
  const FRINGE_COUNT = 16;
  const FRINGE_LEN = 0.045;
  const FRINGE_R = 0.0045;

  // Materials
  const matTeal = new THREE.MeshStandardMaterial({
    color: 0x165c66,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xece4d8,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0xc65d36,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matEspresso = new THREE.MeshStandardMaterial({
    color: 0x332728,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matPeach = new THREE.MeshStandardMaterial({
    color: 0xd9b396,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matSageTeal = new THREE.MeshStandardMaterial({
    color: 0x4e8488,
    roughness: 0.92,
    metalness: 0.0,
  });

  // Helper to create a rounded rectangle shape
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  // Bottom folded layer
  const layerShape = createRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, 0.025);
  const layerGeo = new THREE.ExtrudeGeometry(layerShape, {
    depth: LAYER_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  layerGeo.rotateX(Math.PI / 2);

  const bottomLayer = new THREE.Mesh(layerGeo, matTeal);
  bottomLayer.name = 'blanket_bottom_layer';
  bottomLayer.position.set(0, LAYER_H - BEVEL, 0);
  bottomLayer.castShadow = true;
  bottomLayer.receiveShadow = true;
  group.add(bottomLayer);

  // Top folded layer
  const topLayer = new THREE.Mesh(layerGeo, matTeal);
  topLayer.name = 'blanket_top_layer';
  topLayer.position.set(0, LAYER_H * 2 + GAP - BEVEL, 0);
  topLayer.castShadow = true;
  topLayer.receiveShadow = true;
  group.add(topLayer);

  // Folded spine connecting bottom and top layers at -Z
  const spineGeo = new THREE.CapsuleGeometry(LAYER_H * 0.52, W - 0.05, 8, 16);
  spineGeo.rotateZ(Math.PI / 2);
  const foldSpine = new THREE.Mesh(spineGeo, matTeal);
  foldSpine.name = 'blanket_fold_spine';
  foldSpine.position.set(0, LAYER_H + GAP * 0.5, -D / 2 + 0.015);
  foldSpine.castShadow = true;
  foldSpine.receiveShadow = true;
  group.add(foldSpine);

  // Zigzag chevron stripes on top surface
  function createZigzagShape(stripeW, lengthZ, ampX, cycles) {
    const shape = new THREE.Shape();
    const halfL = lengthZ / 2;
    const stepZ = lengthZ / (cycles * 2);
    const ptsLeft = [];
    const ptsRight = [];

    for (let i = 0; i <= cycles * 2; i++) {
      const z = -halfL + i * stepZ;
      const xOffset = i % 2 === 0 ? -ampX : ampX;
      ptsLeft.push(new THREE.Vector2(xOffset - stripeW / 2, z));
      ptsRight.push(new THREE.Vector2(xOffset + stripeW / 2, z));
    }

    shape.moveTo(ptsLeft[0].x, ptsLeft[0].y);
    for (let i = 1; i < ptsLeft.length; i++) {
      shape.lineTo(ptsLeft[i].x, ptsLeft[i].y);
    }
    for (let i = ptsRight.length - 1; i >= 0; i--) {
      shape.lineTo(ptsRight[i].x, ptsRight[i].y);
    }
    shape.closePath();
    return shape;
  }

  const stripeShape = createZigzagShape(0.026, D - 0.04, 0.022, 3);
  const stripeGeo = new THREE.ExtrudeGeometry(stripeShape, {
    depth: 0.0025,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
  });
  stripeGeo.rotateX(Math.PI / 2);

  const stripeConfigs = [
    { x: -0.13, mat: matSageTeal, name: 'zigzag_stripe_sage' },
    { x: -0.075, mat: matCream, name: 'zigzag_stripe_cream' },
    { x: -0.02, mat: matTerracotta, name: 'zigzag_stripe_terracotta' },
    { x: 0.035, mat: matEspresso, name: 'zigzag_stripe_espresso' },
    { x: 0.09, mat: matPeach, name: 'zigzag_stripe_peach' },
    { x: 0.145, mat: matCream, name: 'zigzag_stripe_cream_right' },
  ];

  const topSurfaceY = LAYER_H * 2 + GAP + 0.0015;
  stripeConfigs.forEach((cfg) => {
    const stripe = new THREE.Mesh(stripeGeo, cfg.mat);
    stripe.name = cfg.name;
    stripe.position.set(cfg.x, topSurfaceY, 0);
    stripe.castShadow = true;
    stripe.receiveShadow = true;
    group.add(stripe);
  });

  // Fringe tassels along the +Z front edge
  const fringeGeo = new THREE.CylinderGeometry(FRINGE_R * 0.7, FRINGE_R, FRINGE_LEN, 8);
  const fringeMats = [matTeal, matCream, matTerracotta, matEspresso, matPeach];
  const fringeSpacing = (W - 0.06) / (FRINGE_COUNT - 1);

  for (let i = 0; i < FRINGE_COUNT; i++) {
    const xPos = -(W - 0.06) / 2 + i * fringeSpacing;
    const mat = fringeMats[i % fringeMats.length];
    const tassel = new THREE.Mesh(fringeGeo, mat);
    tassel.name = `fringe_tassel_${i + 1}`;
    tassel.rotation.x = Math.PI / 2.2;
    tassel.position.set(xPos, LAYER_H * 0.45, D / 2 + FRINGE_LEN * 0.35);
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
