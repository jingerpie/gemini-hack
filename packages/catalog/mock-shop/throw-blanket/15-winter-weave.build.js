function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;          // Folded body width (X)
  const D = 0.36;          // Folded body depth (Z)
  const LAYER_H = 0.036;   // Thickness of each folded layer
  const BEVEL = 0.01;      // Softness of edges
  const FRINGE_LEN = 0.075; // Length of fringe extending to +X

  // Materials
  const redFabricMat = new THREE.MeshStandardMaterial({
    color: 0x8c1d24,
    roughness: 0.92,
    metalness: 0.0,
  });

  const greenPlaidMat = new THREE.MeshStandardMaterial({
    color: 0x263b29,
    roughness: 0.94,
    metalness: 0.0,
  });

  const goldPlaidMat = new THREE.MeshStandardMaterial({
    color: 0x9e7b3b,
    roughness: 0.9,
    metalness: 0.02,
  });

  const fringeMat = new THREE.MeshStandardMaterial({
    color: 0x7d191f,
    roughness: 0.95,
    metalness: 0.0,
  });

  function makeRoundedLayerGeo(width, height, depth, bevel) {
    const hw = width / 2 - bevel;
    const hh = height / 2 - bevel;
    const r = Math.min(hh * 0.85, 0.012);

    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }

  // Offset X slightly left so the whole blanket + fringe is centered around x = 0
  const bodyCenterX = -FRINGE_LEN * 0.35;

  // 1. Bottom folded layer
  const bottomGeo = makeRoundedLayerGeo(W, LAYER_H, D, BEVEL);
  const bottomMesh = new THREE.Mesh(bottomGeo, redFabricMat);
  bottomMesh.name = 'blanket_bottom_layer';
  bottomMesh.position.set(bodyCenterX, LAYER_H / 2, 0);
  bottomMesh.castShadow = true;
  bottomMesh.receiveShadow = true;
  group.add(bottomMesh);

  // 2. Middle folded layer
  const midGeo = makeRoundedLayerGeo(W * 0.98, LAYER_H, D * 0.98, BEVEL);
  const midMesh = new THREE.Mesh(midGeo, redFabricMat);
  midMesh.name = 'blanket_middle_layer';
  midMesh.position.set(bodyCenterX + 0.004, LAYER_H * 1.42, 0);
  midMesh.castShadow = true;
  midMesh.receiveShadow = true;
  group.add(midMesh);

  // 3. Top folded layer
  const topGeo = makeRoundedLayerGeo(W * 0.99, LAYER_H, D * 0.99, BEVEL);
  const topMesh = new THREE.Mesh(topGeo, redFabricMat);
  topMesh.name = 'blanket_top_layer';
  topMesh.position.set(bodyCenterX, LAYER_H * 2.34, 0);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  const topSurfaceY = LAYER_H * 2.84;

  // 4. Left-side continuous fold creases (connecting layers smoothly)
  const creaseGeo = new THREE.CapsuleGeometry(LAYER_H * 0.48, D * 0.92, 6, 12);
  creaseGeo.rotateX(Math.PI / 2);

  const lowerCrease = new THREE.Mesh(creaseGeo, redFabricMat);
  lowerCrease.name = 'blanket_lower_fold_crease';
  lowerCrease.position.set(bodyCenterX - W / 2 + 0.008, LAYER_H * 0.96, 0);
  lowerCrease.castShadow = true;
  lowerCrease.receiveShadow = true;
  group.add(lowerCrease);

  const upperCrease = new THREE.Mesh(creaseGeo, redFabricMat);
  upperCrease.name = 'blanket_upper_fold_crease';
  upperCrease.position.set(bodyCenterX - W / 2 + 0.01, LAYER_H * 1.88, 0);
  upperCrease.castShadow = true;
  upperCrease.receiveShadow = true;
  group.add(upperCrease);

  // 5. Top folded-back corner flap
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.08, -0.04);
  flapShape.lineTo(0.11, -0.02);
  flapShape.lineTo(0.09, 0.08);
  flapShape.lineTo(-0.06, 0.07);
  flapShape.closePath();

  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  flapGeo.rotateX(-Math.PI / 2);
  flapGeo.center();

  const flapMesh = new THREE.Mesh(flapGeo, redFabricMat);
  flapMesh.name = 'blanket_top_corner_flap';
  flapMesh.position.set(bodyCenterX + 0.03, topSurfaceY + 0.004, 0.04);
  flapMesh.rotation.y = -0.18;
  flapMesh.castShadow = true;
  flapMesh.receiveShadow = true;
  group.add(flapMesh);

  // 6. Subtle plaid stripes on top surface (green & gold)
  const stripePositionsZ = [-0.11, -0.02, 0.07];
  stripePositionsZ.forEach((zPos, idx) => {
    const greenStripeGeo = new THREE.BoxGeometry(W * 0.94, 0.003, 0.014);
    const greenStripe = new THREE.Mesh(greenStripeGeo, greenPlaidMat);
    greenStripe.name = `plaid_green_stripe_x_${idx}`;
    greenStripe.position.set(bodyCenterX, topSurfaceY - 0.001, zPos);
    greenStripe.castShadow = true;
    greenStripe.receiveShadow = true;
    group.add(greenStripe);

    const goldStripeGeo = new THREE.BoxGeometry(W * 0.94, 0.0032, 0.004);
    const goldStripe = new THREE.Mesh(goldStripeGeo, goldPlaidMat);
    goldStripe.name = `plaid_gold_stripe_x_${idx}`;
    goldStripe.position.set(bodyCenterX, topSurfaceY - 0.0008, zPos + 0.012);
    goldStripe.castShadow = true;
    goldStripe.receiveShadow = true;
    group.add(goldStripe);
  });

  const stripePositionsX = [-0.12, 0.02, 0.14];
  stripePositionsX.forEach((xPos, idx) => {
    const greenStripeGeo = new THREE.BoxGeometry(0.014, 0.003, D * 0.94);
    const greenStripe = new THREE.Mesh(greenStripeGeo, greenPlaidMat);
    greenStripe.name = `plaid_green_stripe_z_${idx}`;
    greenStripe.position.set(bodyCenterX + xPos, topSurfaceY - 0.001, 0);
    greenStripe.castShadow = true;
    greenStripe.receiveShadow = true;
    group.add(greenStripe);
  });

  // 7. Fringe tassels along the +X edge
  const fringeCount = 14;
  const startX = bodyCenterX + W / 2 - 0.008;
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    const z = -D * 0.43 + t * (D * 0.86);
    const yStart = (i % 2 === 0) ? LAYER_H * 2.25 : LAYER_H * 1.45;
    const xEnd = startX + FRINGE_LEN * (0.85 + (i % 3) * 0.08);
    const zWiggle = ((i % 2 === 0) ? 1 : -1) * 0.008;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, yStart, z),
      new THREE.Vector3(startX + FRINGE_LEN * 0.35, yStart * 0.65, z + zWiggle * 0.5),
      new THREE.Vector3(startX + FRINGE_LEN * 0.72, 0.016, z + zWiggle),
      new THREE.Vector3(xEnd, 0.005, z + zWiggle * 0.7),
    ]);

    const tasselGeo = new THREE.TubeGeometry(curve, 10, 0.0045, 6, false);
    const tasselMesh = new THREE.Mesh(tasselGeo, fringeMat);
    tasselMesh.name = `blanket_fringe_tassel_${i}`;
    tasselMesh.castShadow = true;
    tasselMesh.receiveShadow = true;
    group.add(tasselMesh);
  }

  return group;
}
