function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - 60 x 90 cm footprint
  const BEVEL = 0.002;
  const W = 0.60 - BEVEL * 2;
  const D = 0.90 - BEVEL * 2;
  const BASE_H = 0.012;
  const TERRACE_H = 0.008;
  const STONE_H = 0.009;
  const SCALE = 0.60 / 1.65;

  const RX = W / 2;
  const RZ = D / 2;

  // Materials (tufted wool in monochromatic warm sage-grey tones)
  const matBase = new THREE.MeshStandardMaterial({
    color: 0x8e8f88,
    roughness: 0.95,
    metalness: 0.0
  });
  const matTerrace = new THREE.MeshStandardMaterial({
    color: 0x9c9d95,
    roughness: 0.93,
    metalness: 0.0
  });
  const matTerraceLight = new THREE.MeshStandardMaterial({
    color: 0xa4a59d,
    roughness: 0.92,
    metalness: 0.0
  });
  const matStone = new THREE.MeshStandardMaterial({
    color: 0x85867f,
    roughness: 0.90,
    metalness: 0.0
  });

  // Helper to create a symmetric stepped-oval (pixelated) 2D shape
  function createSteppedOvalShape(rx, rz) {
    // Define first quadrant (+X, +Y) steps from top-center to right-middle
    const q1 = [
      [0.0, 1.0],
      [0.24, 1.0],
      [0.24, 0.95],
      [0.44, 0.95],
      [0.44, 0.89],
      [0.60, 0.89],
      [0.60, 0.82],
      [0.73, 0.82],
      [0.73, 0.72],
      [0.83, 0.72],
      [0.83, 0.54],
      [0.92, 0.54],
      [0.92, 0.25],
      [1.0, 0.25],
      [1.0, 0.0]
    ];

    const pts = [];
    // Q1: top to right
    for (let i = 0; i < q1.length; i++) {
      pts.push([q1[i][0] * rx, q1[i][1] * rz]);
    }
    // Q4: right to bottom
    for (let i = q1.length - 2; i >= 0; i--) {
      pts.push([q1[i][0] * rx, -q1[i][1] * rz]);
    }
    // Q3: bottom to left
    for (let i = 1; i < q1.length; i++) {
      pts.push([-q1[i][0] * rx, -q1[i][1] * rz]);
    }
    // Q2: left to top
    for (let i = q1.length - 2; i >= 1; i--) {
      pts.push([-q1[i][0] * rx, q1[i][1] * rz]);
    }

    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][1]);
    }
    shape.closePath();
    return shape;
  }

  // 1. Base stepped-oval rug (also forms the recessed winding path)
  const baseShape = createSteppedOvalShape(RX, RZ);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, matBase);
  baseMesh.name = 'rug_base';
  baseMesh.position.y = BEVEL;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Helper to create a raised terrace island from normalized [x, z] points
  function addTerrace(name, normPts, height, yOffset, material) {
    const shape = new THREE.Shape();
    shape.moveTo(normPts[0][0] * RX, normPts[0][1] * RZ);
    for (let i = 1; i < normPts.length; i++) {
      shape.lineTo(normPts[i][0] * RX, normPts[i][1] * RZ);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 2
    });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.y = yOffset;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const terraceY = BASE_H + BEVEL;

  // 2. Top-left & top-center terrace
  addTerrace('terrace_top', [
    [-0.22, 0.96], [0.22, 0.96], [0.42, 0.90], [0.58, 0.84],
    [0.70, 0.74], [0.78, 0.62], [0.52, 0.56], [0.35, 0.52],
    [0.10, 0.56], [-0.25, 0.65], [-0.55, 0.72], [-0.70, 0.78],
    [-0.58, 0.85], [-0.42, 0.91]
  ], TERRACE_H, terraceY, matTerraceLight);

  // 3. Upper-left & mid-left terrace (left of the winding path)
  addTerrace('terrace_mid_left', [
    [-0.78, 0.68], [-0.50, 0.66], [-0.15, 0.58], [0.25, 0.54],
    [0.42, 0.48], [0.32, 0.34], [0.28, 0.16], [0.24, 0.02],
    [0.05, -0.08], [-0.22, -0.14], [-0.45, -0.18], [-0.75, -0.20],
    [-0.95, -0.22], [-0.95, 0.22], [-0.88, 0.24], [-0.88, 0.50]
  ], TERRACE_H, terraceY, matTerrace);

  // 4. Lower-left terrace
  addTerrace('terrace_low_left', [
    [-0.88, -0.24], [-0.55, -0.22], [-0.30, -0.20], [-0.38, -0.36],
    [-0.42, -0.52], [-0.32, -0.68], [-0.20, -0.82], [-0.36, -0.90],
    [-0.56, -0.85], [-0.70, -0.75], [-0.80, -0.56], [-0.88, -0.50]
  ], TERRACE_H, terraceY, matTerraceLight);

  // 5. Middle-right terrace (right of the winding path)
  addTerrace('terrace_mid_right', [
    [0.78, 0.50], [0.88, 0.48], [0.88, 0.24], [0.95, 0.22],
    [0.95, -0.18], [0.70, -0.14], [0.40, -0.10], [0.15, -0.06],
    [0.32, 0.04], [0.42, 0.18], [0.44, 0.36], [0.58, 0.46]
  ], TERRACE_H, terraceY, matTerrace);

  // 6. Lower-right terrace
  addTerrace('terrace_low_right', [
    [0.10, -0.12], [0.42, -0.14], [0.72, -0.18], [0.92, -0.22],
    [0.88, -0.50], [0.78, -0.68], [0.68, -0.78], [0.52, -0.86],
    [0.32, -0.90], [0.12, -0.78], [-0.05, -0.60], [-0.14, -0.40],
    [-0.12, -0.22]
  ], TERRACE_H, terraceY, matTerraceLight);

  // Helper to add a tufted stone/pebble cluster
  function addStone(name, normX, normZ, rx, rz, h, rotY) {
    const sRx = rx * SCALE;
    const sRz = rz * SCALE;
    const geo = new THREE.CylinderGeometry(sRx, sRx * 1.08, h, 10);
    geo.scale(1, 1, sRz / sRx);
    const mesh = new THREE.Mesh(geo, matStone);
    mesh.name = name;
    mesh.position.set(normX * RX, terraceY + TERRACE_H + h / 2 - 0.001, normZ * RZ);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 7. Upper-left stone cluster (larger rounded stones)
  addStone('stone_ul_1', -0.48, 0.48, 0.085, 0.065, STONE_H, 0.2);
  addStone('stone_ul_2', -0.32, 0.49, 0.050, 0.040, STONE_H * 0.9, -0.3);
  addStone('stone_ul_3', -0.38, 0.39, 0.065, 0.052, STONE_H, 0.5);
  addStone('stone_ul_4', -0.52, 0.38, 0.045, 0.038, STONE_H * 0.85, 0.1);
  addStone('stone_ul_5', -0.54, 0.31, 0.035, 0.028, STONE_H * 0.8, -0.4);

  // 8. Middle-right stone cluster
  addStone('stone_mr_1', 0.56, 0.24, 0.042, 0.035, STONE_H * 0.9, 0.15);
  addStone('stone_mr_2', 0.48, 0.19, 0.038, 0.032, STONE_H * 0.85, -0.2);
  addStone('stone_mr_3', 0.58, 0.16, 0.045, 0.036, STONE_H, 0.4);
  addStone('stone_mr_4', 0.50, 0.11, 0.036, 0.030, STONE_H * 0.8, 0.0);
  addStone('stone_mr_5', 0.60, 0.09, 0.034, 0.028, STONE_H * 0.85, -0.5);

  // 9. Lower-left stone cluster
  addStone('stone_ll_1', -0.62, -0.30, 0.048, 0.038, STONE_H * 0.9, 0.1);
  addStone('stone_ll_2', -0.52, -0.32, 0.042, 0.035, STONE_H * 0.85, -0.25);
  addStone('stone_ll_3', -0.60, -0.39, 0.055, 0.042, STONE_H, 0.3);
  addStone('stone_ll_4', -0.46, -0.40, 0.040, 0.032, STONE_H * 0.8, -0.1);
  addStone('stone_ll_5', -0.40, -0.47, 0.038, 0.030, STONE_H * 0.85, 0.45);

  // 10. Lower-right stone cluster
  addStone('stone_lr_1', 0.52, -0.38, 0.058, 0.046, STONE_H, -0.2);
  addStone('stone_lr_2', 0.40, -0.44, 0.062, 0.048, STONE_H * 0.95, 0.3);
  addStone('stone_lr_3', 0.56, -0.46, 0.050, 0.040, STONE_H * 0.9, -0.4);
  addStone('stone_lr_4', 0.50, -0.53, 0.044, 0.036, STONE_H * 0.85, 0.15);
  addStone('stone_lr_5', 0.38, -0.54, 0.035, 0.028, STONE_H * 0.8, 0.5);

  return group;
}
