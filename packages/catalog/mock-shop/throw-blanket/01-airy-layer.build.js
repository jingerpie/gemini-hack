function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;
  const D = 0.42;
  const H = 0.14;

  const LAYER_H = 0.022;
  const BEVEL = 0.012;
  const CORNER_R = 0.045;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f2,
    roughness: 0.92,
    metalness: 0.0,
  });

  const hemMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8f6,
    roughness: 0.88,
    metalness: 0.0,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xe6e6e2,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Helper to create a softly rounded rectangular shape
  function createRoundedShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw * 0.45, hd * 0.45);

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

  // Helper to create a pillowy folded layer
  function createLayerMesh(width, depth, thickness, bevel, radius, name, mat) {
    const shape = createRoundedShape(width, depth, radius);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 12,
    });
    geom.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Bottom folded layer (lowest point at y = 0)
  const bottomLayer = createLayerMesh(
    W - BEVEL * 2,
    D - BEVEL * 2,
    LAYER_H,
    BEVEL,
    CORNER_R,
    'bottom_folded_layer',
    fabricMat
  );
  bottomLayer.position.set(0, BEVEL, 0);
  group.add(bottomLayer);

  // 2. Middle folded layer 1
  const midLayer1 = createLayerMesh(
    W * 0.96 - BEVEL * 2,
    D * 0.95 - BEVEL * 2,
    LAYER_H,
    BEVEL,
    CORNER_R,
    'middle_folded_layer_1',
    fabricMat
  );
  midLayer1.position.set(-0.006, BEVEL + LAYER_H + BEVEL * 0.9, 0.004);
  midLayer1.rotation.y = 0.03;
  group.add(midLayer1);

  // 3. Middle folded layer 2
  const midLayer2 = createLayerMesh(
    W * 0.93 - BEVEL * 2,
    D * 0.92 - BEVEL * 2,
    LAYER_H,
    BEVEL,
    CORNER_R,
    'middle_folded_layer_2',
    fabricMat
  );
  midLayer2.position.set(0.005, BEVEL + (LAYER_H + BEVEL * 0.9) * 2, -0.003);
  midLayer2.rotation.y = -0.025;
  group.add(midLayer2);

  // 4. Top folded layer
  const topLayer = createLayerMesh(
    W * 0.90 - BEVEL * 2,
    D * 0.89 - BEVEL * 2,
    LAYER_H,
    BEVEL,
    CORNER_R,
    'top_folded_layer',
    fabricMat
  );
  const topLayerY = BEVEL + (LAYER_H + BEVEL * 0.9) * 3;
  topLayer.position.set(0, topLayerY, 0.002);
  topLayer.rotation.y = 0.015;
  group.add(topLayer);

  // 5. Soft organic dome/puff on top
  const domeGeom = new THREE.SphereGeometry(W * 0.36, 24, 16);
  const domeMesh = new THREE.Mesh(domeGeom, fabricMat);
  domeMesh.name = 'top_center_puff';
  domeMesh.scale.set(1.0, 0.14, 0.9);
  domeMesh.position.set(0, topLayerY + LAYER_H + BEVEL * 0.3, -0.01);
  domeMesh.castShadow = true;
  domeMesh.receiveShadow = true;
  group.add(domeMesh);

  // 6. Softly draped front corner flap
  const cornerFlap = createLayerMesh(
    0.16,
    0.14,
    0.012,
    0.008,
    0.02,
    'front_draped_corner',
    fabricMat
  );
  cornerFlap.position.set(0.02, 0.025, D * 0.36);
  cornerFlap.rotation.set(0.28, 0.65, -0.08);
  group.add(cornerFlap);

  // 7-10. Rounded fold rolls along left and right sides
  const rollGeom = new THREE.CapsuleGeometry(0.016, D * 0.68, 8, 16);
  rollGeom.rotateX(Math.PI / 2);

  const leftRoll1 = new THREE.Mesh(rollGeom, fabricMat);
  leftRoll1.name = 'left_fold_roll_lower';
  leftRoll1.position.set(-W * 0.45, 0.032, 0);
  leftRoll1.castShadow = true;
  leftRoll1.receiveShadow = true;
  group.add(leftRoll1);

  const leftRoll2 = new THREE.Mesh(rollGeom, fabricMat);
  leftRoll2.name = 'left_fold_roll_upper';
  leftRoll2.position.set(-W * 0.43, 0.078, 0);
  leftRoll2.castShadow = true;
  leftRoll2.receiveShadow = true;
  group.add(leftRoll2);

  const rightRoll1 = new THREE.Mesh(rollGeom, fabricMat);
  rightRoll1.name = 'right_fold_roll_lower';
  rightRoll1.position.set(W * 0.45, 0.032, 0);
  rightRoll1.castShadow = true;
  rightRoll1.receiveShadow = true;
  group.add(rightRoll1);

  const rightRoll2 = new THREE.Mesh(rollGeom, fabricMat);
  rightRoll2.name = 'right_fold_roll_upper';
  rightRoll2.position.set(W * 0.43, 0.078, 0);
  rightRoll2.castShadow = true;
  rightRoll2.receiveShadow = true;
  group.add(rightRoll2);

  // 11-12. Stitched hem piping along front edges
  const hemGeom = new THREE.CapsuleGeometry(0.005, W * 0.76, 6, 12);
  hemGeom.rotateZ(Math.PI / 2);

  const frontHemTop = new THREE.Mesh(hemGeom, hemMat);
  frontHemTop.name = 'front_hem_top';
  frontHemTop.position.set(0, topLayerY + LAYER_H * 0.5, D * 0.43);
  frontHemTop.rotation.y = 0.015;
  frontHemTop.castShadow = true;
  frontHemTop.receiveShadow = true;
  group.add(frontHemTop);

  const frontHemMid = new THREE.Mesh(hemGeom, hemMat);
  frontHemMid.name = 'front_hem_middle';
  frontHemMid.position.set(-0.005, BEVEL + LAYER_H + BEVEL * 1.4, D * 0.45);
  frontHemMid.rotation.y = 0.03;
  frontHemMid.castShadow = true;
  frontHemMid.receiveShadow = true;
  group.add(frontHemMid);

  // 13. Rectangular fabric brand label on top-right-front
  const labelGeom = new THREE.BoxGeometry(0.065, 0.003, 0.042);
  const labelMesh = new THREE.Mesh(labelGeom, labelMat);
  labelMesh.name = 'brand_label_patch';
  labelMesh.position.set(0.08, topLayerY + LAYER_H + BEVEL + 0.008, 0.11);
  labelMesh.rotation.set(0.12, 0.25, -0.05);
  labelMesh.castShadow = true;
  labelMesh.receiveShadow = true;
  group.add(labelMesh);

  return group;
}
