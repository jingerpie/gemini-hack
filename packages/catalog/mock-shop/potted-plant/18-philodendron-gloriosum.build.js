function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const POT_H = 0.18;
  const POT_R_BOTTOM = 0.068;
  const POT_R_TOP = 0.102;
  const POT_RIM_H = 0.038;
  const POT_RIM_THICK = 0.008;
  const SOIL_Y = POT_H - 0.018;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xdccbb5,
    roughness: 0.82,
    metalness: 0.02
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x261d17,
    roughness: 0.96,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x526b38,
    roughness: 0.65,
    metalness: 0.0
  });

  const leafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x243b18,
    roughness: 0.72,
    metalness: 0.02
  });

  const leafMidMat = new THREE.MeshStandardMaterial({
    color: 0x2e4a1f,
    roughness: 0.7,
    metalness: 0.02
  });

  const veinMat = new THREE.MeshStandardMaterial({
    color: 0xc2d49b,
    roughness: 0.55,
    metalness: 0.0
  });

  // 1. Pot (LatheGeometry with rim)
  const potPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(POT_R_BOTTOM, 0),
    new THREE.Vector2(POT_R_TOP - 0.006, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_R_TOP + POT_RIM_THICK, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_R_TOP + POT_RIM_THICK, POT_H),
    new THREE.Vector2(POT_R_TOP - 0.006, POT_H),
    new THREE.Vector2(POT_R_TOP - 0.008, SOIL_Y),
    new THREE.Vector2(0, SOIL_Y)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 28);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'ceramic_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(POT_R_TOP - 0.008, POT_R_TOP - 0.012, 0.02, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.005;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // 3. Shared Heart-Shaped Leaf Geometry (unit scale ~1m, scaled per leaf)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(-0.08, 0.22, -0.28, 0.28, -0.40, 0.12);
  leafShape.bezierCurveTo(-0.52, -0.05, -0.38, -0.45, 0, -0.78);
  leafShape.bezierCurveTo(0.38, -0.45, 0.52, -0.05, 0.40, 0.12);
  leafShape.bezierCurveTo(0.28, 0.28, 0.08, 0.22, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002
  });

  // Leaf configurations: [scale, posX, posY, posZ, rotX, rotY, rotZ, hasVeins, isDark]
  const leaves = [
    // Hero front leaf
    [0.33, 0.0, 0.43, 0.06, -0.22, 0.0, 0.0, true, true],
    // Large upper-left and upper-right leaves
    [0.24, -0.15, 0.42, -0.04, -0.75, -0.55, 0.35, true, false],
    [0.23, 0.16, 0.39, -0.05, -0.78, 0.60, -0.35, true, false],
    // Medium mid-level leaves
    [0.18, -0.14, 0.30, 0.02, -0.62, -0.85, 0.25, true, true],
    [0.17, 0.15, 0.28, 0.01, -0.65, 0.85, -0.25, true, true],
    [0.15, -0.06, 0.27, -0.08, -0.85, -0.25, 0.15, false, false],
    // Small lower basal leaves
    [0.11, -0.10, 0.22, 0.04, -0.70, -0.95, 0.20, false, false],
    [0.10, 0.09, 0.21, 0.06, -0.55, 0.70, -0.15, false, false],
    [0.08, 0.03, 0.19, 0.07, -0.45, 0.20, -0.10, false, true],
    [0.10, 0.08, 0.23, -0.06, -0.80, 0.90, -0.20, false, true]
  ];

  for (let i = 0; i < leaves.length; i++) {
    const [scale, px, py, pz, rx, ry, rz, hasVeins, isDark] = leaves[i];

    // Stem (petiole) from soil center to leaf attachment
    const stemStart = new THREE.Vector3(px * 0.12, SOIL_Y, pz * 0.12);
    const stemMid = new THREE.Vector3(px * 0.55, SOIL_Y + (py - SOIL_Y) * 0.6, pz * 0.55);
    const stemEnd = new THREE.Vector3(px, py, pz);
    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemRadius = 0.0025 + scale * 0.012;
    const stemGeo = new THREE.TubeGeometry(stemCurve, 10, stemRadius, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = 'petiole_' + (i + 1);
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    // Leaf group for orientation
    const leafGroup = new THREE.Group();
    leafGroup.position.set(px, py, pz);
    leafGroup.rotation.set(rx, ry, rz);
    leafGroup.scale.set(scale, scale, scale);

    const bladeMesh = new THREE.Mesh(leafGeo, isDark ? leafDarkMat : leafMidMat);
    bladeMesh.name = 'leaf_blade_' + (i + 1);
    bladeMesh.castShadow = true;
    bladeMesh.receiveShadow = true;
    leafGroup.add(bladeMesh);

    // Prominent pale veins on larger leaves
    if (hasVeins) {
      const midribGeo = new THREE.CylinderGeometry(0.005, 0.012, 0.74, 6);
      const midribMesh = new THREE.Mesh(midribGeo, veinMat);
      midribMesh.name = 'leaf_midrib_' + (i + 1);
      midribMesh.position.set(0, -0.37, 0.005);
      midribMesh.castShadow = true;
      midribMesh.receiveShadow = true;
      leafGroup.add(midribMesh);

      const lateralSpecs = [
        [-0.14, -0.08, 0.30, 1.15],
        [0.14, -0.08, 0.30, -1.15],
        [-0.16, -0.24, 0.32, 1.05],
        [0.16, -0.24, 0.32, -1.05],
        [-0.12, -0.42, 0.25, 0.95],
        [0.12, -0.42, 0.25, -0.95]
      ];
      for (let v = 0; v < lateralSpecs.length; v++) {
        const [vx, vy, vLen, vRot] = lateralSpecs[v];
        const veinGeo = new THREE.CylinderGeometry(0.003, 0.006, vLen, 5);
        const veinMesh = new THREE.Mesh(veinGeo, veinMat);
        veinMesh.name = 'leaf_vein_' + (i + 1) + '_' + (v + 1);
        veinMesh.position.set(vx, vy, 0.005);
        veinMesh.rotation.z = vRot;
        veinMesh.castShadow = true;
        veinMesh.receiveShadow = true;
        leafGroup.add(veinMesh);
      }
    }

    group.add(leafGroup);
  }

  return group;
}
