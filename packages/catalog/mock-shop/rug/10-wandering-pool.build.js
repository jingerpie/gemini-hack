function build(THREE) {
  const W = 1.00; // 100 cm along X
  const D = 1.40; // 140 cm along Z
  const H = 0.016; // 1.6 cm rug thickness
  const BEVEL = 0.003;
  const BACKING_H = 0.002;
  const LINE_RADIUS = 0.0055;

  const group = new THREE.Group();

  const mustardMat = new THREE.MeshStandardMaterial({
    color: 0xc68b2c,
    roughness: 0.92,
    metalness: 0.0,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xeae4d7,
    roughness: 0.88,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x3b352e,
    roughness: 0.95,
    metalness: 0.0,
  });

  const gripPadMat = new THREE.MeshStandardMaterial({
    color: 0x22201d,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Define 3-lobed freeform silhouette in 2D (x, z)
  const rawPoints = [
    new THREE.Vector2(0.05, -0.58),
    new THREE.Vector2(0.28, -0.64),
    new THREE.Vector2(0.45, -0.48),
    new THREE.Vector2(0.48, -0.22),
    new THREE.Vector2(0.35, -0.05),
    new THREE.Vector2(0.18, 0.02),
    new THREE.Vector2(0.14, 0.16),
    new THREE.Vector2(0.25, 0.35),
    new THREE.Vector2(0.22, 0.56),
    new THREE.Vector2(0.02, 0.66),
    new THREE.Vector2(-0.20, 0.60),
    new THREE.Vector2(-0.30, 0.42),
    new THREE.Vector2(-0.24, 0.24),
    new THREE.Vector2(-0.34, 0.14),
    new THREE.Vector2(-0.48, 0.02),
    new THREE.Vector2(-0.46, -0.20),
    new THREE.Vector2(-0.30, -0.34),
    new THREE.Vector2(-0.12, -0.34),
    new THREE.Vector2(-0.02, -0.44),
  ];

  // Sample smooth closed spline and normalize to exact W x D footprint
  const spline2D = new THREE.SplineCurve(rawPoints);
  const sampled = spline2D.getPoints(96);

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const p of sampled) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minZ) minZ = p.y;
    if (p.y > maxZ) maxZ = p.y;
  }

  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  const scaleX = (W - BEVEL * 2) / (maxX - minX);
  const scaleZ = (D - BEVEL * 2) / (maxZ - minZ);

  const normPoints = sampled.map(
    (p) => new THREE.Vector2((p.x - cx) * scaleX, (p.y - cz) * scaleZ)
  );

  // Main rug body
  const rugShape = new THREE.Shape(normPoints);
  const rugGeo = new THREE.ExtrudeGeometry(rugShape, {
    depth: H - BEVEL * 2 - BACKING_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 24,
  });
  rugGeo.rotateX(Math.PI / 2);

  const rugMesh = new THREE.Mesh(rugGeo, mustardMat);
  rugMesh.name = 'rug_main_body';
  rugMesh.position.y = H - BEVEL;
  rugMesh.castShadow = true;
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // Backing layer underneath
  const backingPoints = normPoints.map((p) => new THREE.Vector2(p.x * 0.96, p.y * 0.96));
  const backingShape = new THREE.Shape(backingPoints);
  const backingGeo = new THREE.ExtrudeGeometry(backingShape, {
    depth: BACKING_H,
    bevelEnabled: false,
    curveSegments: 24,
  });
  backingGeo.rotateX(Math.PI / 2);

  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = 'rug_backing';
  backingMesh.position.y = BACKING_H;
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  // Non-slip grip pads underneath
  const gripGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.001, 16);
  const gripPositions = [
    [0.20, -0.35],
    [0.30, -0.20],
    [-0.25, -0.15],
    [-0.32, -0.02],
    [0.00, 0.05],
    [0.10, 0.35],
    [-0.08, 0.45],
    [0.02, 0.52],
  ];
  gripPositions.forEach(([gx, gz], idx) => {
    const pad = new THREE.Mesh(gripGeo, gripPadMat);
    pad.name = `rug_grip_pad_${idx + 1}`;
    pad.position.set(gx, 0.0005, gz);
    pad.castShadow = true;
    pad.receiveShadow = true;
    group.add(pad);
  });

  // Cream contour line inset from the perimeter
  const contourScale = 0.89;
  const contour3D = normPoints.map(
    (p) => new THREE.Vector3(p.x * contourScale, H, p.y * contourScale)
  );
  const contourCurve = new THREE.CatmullRomCurve3(contour3D, true);
  const contourGeo = new THREE.TubeGeometry(contourCurve, 128, LINE_RADIUS, 12, true);
  contourGeo.scale(1, 0.45, 1);

  const contourMesh = new THREE.Mesh(contourGeo, creamMat);
  contourMesh.name = 'cream_contour_line';
  contourMesh.position.y = H * 0.55;
  contourMesh.castShadow = true;
  contourMesh.receiveShadow = true;
  group.add(contourMesh);

  // Cream inner ring in the upper-right lobe
  const ringGeo = new THREE.TorusGeometry(0.11, LINE_RADIUS * 1.1, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  ringGeo.scale(1, 0.45, 1);

  const ringMesh = new THREE.Mesh(ringGeo, creamMat);
  ringMesh.name = 'cream_inner_ring';
  ringMesh.position.set(0.18, H, -0.36);
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  group.add(ringMesh);

  return group;
}
