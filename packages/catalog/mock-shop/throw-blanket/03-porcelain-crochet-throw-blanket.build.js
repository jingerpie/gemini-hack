function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.36;
  const D = 0.42;
  const H = 0.11;
  const LAYER_H = H / 3;
  const BAND_W = 0.14;
  const BAND_THICK = 0.004;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4f0e8,
    roughness: 0.92,
    metalness: 0.0,
  });

  const creamLightMat = new THREE.MeshStandardMaterial({
    color: 0xf8f5ee,
    roughness: 0.9,
    metalness: 0.0,
  });

  const kraftMat = new THREE.MeshStandardMaterial({
    color: 0xc29b70,
    roughness: 0.85,
    metalness: 0.0,
  });

  const pinkTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc69889,
    roughness: 0.9,
    metalness: 0.0,
  });

  const tealTrimMat = new THREE.MeshStandardMaterial({
    color: 0x6b8a88,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Helper to create rounded rectangle shape
  function createRoundedRectShape(width, depth, radius) {
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

  // Helper to create a soft folded blanket layer
  function createFoldLayer(width, depth, height, bevel, mat, name) {
    const innerH = Math.max(0.004, height - bevel * 2);
    const shape = createRoundedRectShape(width - bevel * 2, depth - bevel * 2, 0.032);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: innerH,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Bottom folded layer (lowest point at y = 0)
  const bevel = 0.012;
  const bottomLayer = createFoldLayer(W, D, LAYER_H, bevel, creamMat, 'bottom_fold_layer');
  bottomLayer.position.set(0, bevel, 0);
  group.add(bottomLayer);

  // 2. Middle folded layer
  const midLayer = createFoldLayer(W * 0.99, D * 0.99, LAYER_H, bevel, creamMat, 'middle_fold_layer');
  midLayer.position.set(0.002, LAYER_H + bevel * 0.6, -0.002);
  group.add(midLayer);

  // 3. Top folded layer
  const topLayer = createFoldLayer(W * 0.98, D * 0.98, LAYER_H, bevel, creamLightMat, 'top_fold_layer');
  topLayer.position.set(-0.002, LAYER_H * 2 + bevel * 0.2, 0.002);
  group.add(topLayer);

  // 4. Soft ruffled/draped corner folds on top of the blanket
  const ruffleCurves = [
    [
      new THREE.Vector3(0.03, H - 0.005, -0.05),
      new THREE.Vector3(-0.04, H + 0.018, -0.04),
      new THREE.Vector3(-0.11, H + 0.008, -0.08),
      new THREE.Vector3(-0.16, H - 0.004, -0.06),
    ],
    [
      new THREE.Vector3(0.03, H - 0.004, 0.01),
      new THREE.Vector3(-0.03, H + 0.022, 0.02),
      new THREE.Vector3(-0.10, H + 0.012, 0.04),
      new THREE.Vector3(-0.16, H - 0.002, 0.01),
    ],
    [
      new THREE.Vector3(0.03, H - 0.005, 0.06),
      new THREE.Vector3(-0.02, H + 0.016, 0.09),
      new THREE.Vector3(-0.08, H + 0.006, 0.13),
      new THREE.Vector3(-0.13, H - 0.005, 0.12),
    ],
  ];

  ruffleCurves.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 20, 0.016, 12, false);
    geo.scale(1, 0.65, 1.35);
    const mesh = new THREE.Mesh(geo, creamLightMat);
    mesh.name = `ruffle_fold_${idx + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 5. Curved crochet trim edges (dusty pink/terracotta)
  const trimCurveTop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.01, H + 0.002, -0.10),
    new THREE.Vector3(0.03, H + 0.004, -0.06),
    new THREE.Vector3(0.05, H + 0.002, -0.01),
  ]);
  const trimTopGeo = new THREE.TubeGeometry(trimCurveTop, 16, 0.006, 10, false);
  const trimTopMesh = new THREE.Mesh(trimTopGeo, pinkTrimMat);
  trimTopMesh.name = 'pink_trim_edge_top';
  trimTopMesh.castShadow = true;
  trimTopMesh.receiveShadow = true;
  group.add(trimTopMesh);

  const trimCurveBottom = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, H + 0.002, 0.05),
    new THREE.Vector3(0.02, H + 0.004, 0.12),
    new THREE.Vector3(-0.04, H + 0.002, 0.17),
  ]);
  const trimBottomGeo = new THREE.TubeGeometry(trimCurveBottom, 16, 0.006, 10, false);
  const trimBottomMesh = new THREE.Mesh(trimBottomGeo, pinkTrimMat);
  trimBottomMesh.name = 'pink_trim_edge_bottom';
  trimBottomMesh.castShadow = true;
  trimBottomMesh.receiveShadow = true;
  group.add(trimBottomMesh);

  // 6. Small sage/teal crochet accent stitches
  const tealPositions = [
    [0.025, H + 0.005, -0.055],
    [0.01, H + 0.005, 0.125],
    [-0.155, H - 0.002, 0.165],
    [0.04, H + 0.003, -0.13],
  ];
  tealPositions.forEach((pos, idx) => {
    const geo = new THREE.SphereGeometry(0.0065, 10, 8);
    geo.scale(1.2, 0.6, 1.0);
    const mesh = new THREE.Mesh(geo, tealTrimMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.name = `teal_stitch_accent_${idx + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 7. Kraft paper belly band wrapped around the +X side
  const bandLeftX = 0.02;
  const bandRightX = W / 2 + 0.006;
  const bandBottomY = -0.002;
  const bandTopY = H + 0.004;
  const bandRadius = 0.016;

  const bandShape = new THREE.Shape();
  bandShape.moveTo(bandLeftX, bandTopY);
  bandShape.lineTo(bandRightX - bandRadius, bandTopY);
  bandShape.quadraticCurveTo(bandRightX, bandTopY, bandRightX, bandTopY - bandRadius);
  bandShape.lineTo(bandRightX, bandBottomY + bandRadius);
  bandShape.quadraticCurveTo(bandRightX, bandBottomY, bandRightX - bandRadius, bandBottomY);
  bandShape.lineTo(bandLeftX, bandBottomY);
  bandShape.lineTo(bandLeftX, bandBottomY + BAND_THICK);
  bandShape.lineTo(bandRightX - bandRadius, bandBottomY + BAND_THICK);
  bandShape.quadraticCurveTo(
    bandRightX - BAND_THICK,
    bandBottomY + BAND_THICK,
    bandRightX - BAND_THICK,
    bandBottomY + bandRadius
  );
  bandShape.lineTo(bandRightX - BAND_THICK, bandTopY - bandRadius);
  bandShape.quadraticCurveTo(
    bandRightX - BAND_THICK,
    bandTopY - BAND_THICK,
    bandRightX - bandRadius,
    bandTopY - BAND_THICK
  );
  bandShape.lineTo(bandLeftX, bandTopY - BAND_THICK);
  bandShape.closePath();

  const bandGeo = new THREE.ExtrudeGeometry(bandShape, {
    depth: BAND_W,
    bevelEnabled: false,
    curveSegments: 12,
  });
  bandGeo.translate(0, 0, -BAND_W / 2 + 0.01);
  const bandMesh = new THREE.Mesh(bandGeo, kraftMat);
  bandMesh.name = 'kraft_belly_band';
  bandMesh.castShadow = true;
  bandMesh.receiveShadow = true;
  group.add(bandMesh);

  // 8. Subtle crochet knit texture bumps along the front/back edges
  const knitPositions = [
    [-0.12, LAYER_H * 1.5, D / 2 - 0.004],
    [-0.04, LAYER_H * 1.5, D / 2 - 0.004],
    [0.08, LAYER_H * 1.5, D / 2 - 0.004],
    [-0.10, LAYER_H * 1.5, -D / 2 + 0.004],
    [0.06, LAYER_H * 1.5, -D / 2 + 0.004],
  ];
  knitPositions.forEach((pos, idx) => {
    const geo = new THREE.CapsuleGeometry(0.008, 0.025, 6, 10);
    geo.rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, creamMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.name = `crochet_edge_rib_${idx + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  return group;
}
