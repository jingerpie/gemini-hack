function build(THREE) {
  const TOTAL_H = 0.60;
  const POT_H = 0.16;
  const POT_R = 0.08;
  const SOIL_Y = 0.142;
  const STEM_R = 0.0065;

  const group = new THREE.Group();

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x9e9589,
    roughness: 0.65,
    metalness: 0.05
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.95,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5d645e,
    roughness: 0.85,
    metalness: 0.02
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x4f6653, roughness: 0.78, metalness: 0.02 }), // sea green
    new THREE.MeshStandardMaterial({ color: 0x3b4d3b, roughness: 0.80, metalness: 0.02 }), // deep olive
    new THREE.MeshStandardMaterial({ color: 0x6b7f82, roughness: 0.75, metalness: 0.03 }), // steel blue
    new THREE.MeshStandardMaterial({ color: 0x586c70, roughness: 0.76, metalness: 0.03 })  // dusty blue-green
  ];

  // 1. Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.046, 0.0),
    new THREE.Vector2(0.062, 0.012),
    new THREE.Vector2(0.074, 0.035),
    new THREE.Vector2(0.078, 0.065),
    new THREE.Vector2(POT_R, 0.152),
    new THREE.Vector2(POT_R, POT_H),
    new THREE.Vector2(POT_R - 0.005, POT_H),
    new THREE.Vector2(POT_R - 0.007, 0.154),
    new THREE.Vector2(POT_R - 0.007, 0.130),
    new THREE.Vector2(0.0, 0.130)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'ceramic_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(POT_R - 0.007, POT_R - 0.007, 0.016, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.008;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // 3. Main Stem
  const mainStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, SOIL_Y - 0.01, 0),
    new THREE.Vector3(0.002, 0.24, 0.002),
    new THREE.Vector3(-0.004, 0.36, -0.003),
    new THREE.Vector3(-0.008, 0.48, 0.002),
    new THREE.Vector3(-0.002, TOTAL_H - 0.035, -0.002)
  ]);
  const mainStemGeo = new THREE.TubeGeometry(mainStemCurve, 20, STEM_R, 8, false);
  const mainStemMesh = new THREE.Mesh(mainStemGeo, stemMat);
  mainStemMesh.name = 'main_stem';
  mainStemMesh.castShadow = true;
  mainStemMesh.receiveShadow = true;
  group.add(mainStemMesh);

  // 4. Branches
  const branchSpecs = [
    { startY: 0.22, angle: 2.8, len: 0.14, lift: 0.10, r: 0.0042 },
    { startY: 0.24, angle: 0.4, len: 0.13, lift: 0.09, r: 0.0040 },
    { startY: 0.27, angle: 4.5, len: 0.15, lift: 0.11, r: 0.0040 },
    { startY: 0.30, angle: 1.6, len: 0.13, lift: 0.12, r: 0.0038 },
    { startY: 0.33, angle: 3.3, len: 0.15, lift: 0.14, r: 0.0036 },
    { startY: 0.36, angle: 5.7, len: 0.14, lift: 0.13, r: 0.0035 },
    { startY: 0.41, angle: 1.1, len: 0.10, lift: 0.11, r: 0.0032 },
    { startY: 0.45, angle: 3.9, len: 0.08, lift: 0.09, r: 0.0030 }
  ];

  const branchCurves = [];

  branchSpecs.forEach((b, idx) => {
    const t = (b.startY - (SOIL_Y - 0.01)) / (TOTAL_H - 0.035 - (SOIL_Y - 0.01));
    const origin = mainStemCurve.getPoint(Math.min(Math.max(t, 0.05), 0.95));
    const dx = Math.cos(b.angle);
    const dz = Math.sin(b.angle);

    const mid = new THREE.Vector3(
      origin.x + dx * b.len * 0.55,
      origin.y + b.lift * 0.45,
      origin.z + dz * b.len * 0.55
    );
    const tip = new THREE.Vector3(
      origin.x + dx * b.len,
      origin.y + b.lift,
      origin.z + dz * b.len
    );

    const curve = new THREE.CatmullRomCurve3([origin, mid, tip]);
    branchCurves.push({ curve, angle: b.angle });

    const bGeo = new THREE.TubeGeometry(curve, 10, b.r, 6, false);
    const bMesh = new THREE.Mesh(bGeo, stemMat);
    bMesh.name = 'branch_' + (idx + 1);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    group.add(bMesh);
  });

  // 5. Leaves (shared unit sphere geometry scaled into oval leaves)
  const leafGeo = new THREE.SphereGeometry(1, 10, 8);
  let leafCount = 0;

  function addLeaf(pos, yaw, pitch, roll, scaleX, scaleZ, matIdx) {
    leafCount++;
    const leaf = new THREE.Mesh(leafGeo, leafMats[matIdx % leafMats.length]);
    leaf.name = 'leaf_' + leafCount;
    leaf.scale.set(scaleX, 0.0018, scaleZ);
    leaf.position.copy(pos);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.set(pitch, yaw, roll);
    // Offset slightly along local Z so the base of the leaf meets the stem
    leaf.translateZ(scaleZ * 0.75);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  // Leaves along each branch
  branchCurves.forEach((bObj, bIdx) => {
    const numPairs = 4;
    for (let i = 1; i <= numPairs; i++) {
      const t = 0.22 + (i / numPairs) * 0.76;
      const pt = bObj.curve.getPoint(Math.min(t, 1.0));
      const sizeFactor = 1.0 - (i / numPairs) * 0.25;
      const sx = 0.017 * sizeFactor;
      const sz = 0.032 * sizeFactor;

      // Left & right leaf pair
      for (let side = -1; side <= 1; side += 2) {
        const yaw = bObj.angle + side * (0.75 + (i % 2) * 0.25);
        const pitch = -0.35 + (i % 3) * 0.18;
        const roll = side * 0.22;
        const matIdx = (bIdx + i + (side > 0 ? 1 : 0)) % leafMats.length;
        addLeaf(pt, yaw, pitch, roll, sx, sz, matIdx);
      }
    }
    // Terminal leaf at branch tip
    const tip = bObj.curve.getPoint(1.0);
    addLeaf(tip, bObj.angle, -0.45, 0.08, 0.014, 0.028, bIdx % leafMats.length);
  });

  // Leaves along upper main stem
  const stemLeafSteps = 12;
  for (let i = 0; i < stemLeafSteps; i++) {
    const t = 0.52 + (i / stemLeafSteps) * 0.46;
    const pt = mainStemCurve.getPoint(Math.min(t, 0.99));
    const yaw = i * 2.39996; // deterministic golden angle spiral
    const sizeFactor = 1.0 - (i / stemLeafSteps) * 0.3;
    const sx = 0.016 * sizeFactor;
    const sz = 0.031 * sizeFactor;
    const pitch = -0.30 - (i % 3) * 0.15;
    const roll = ((i % 2) * 2 - 1) * 0.18;
    addLeaf(pt, yaw, pitch, roll, sx, sz, i % leafMats.length);
  }

  // Topmost crown leaf
  const topPt = mainStemCurve.getPoint(1.0);
  addLeaf(topPt, 0.4, -0.85, 0.1, 0.013, 0.026, 0);

  return group;
}
