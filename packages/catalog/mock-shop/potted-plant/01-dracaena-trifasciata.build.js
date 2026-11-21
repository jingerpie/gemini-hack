function build(THREE) {
  const group = new THREE.Group();

  const POT_H = 0.18;
  const POT_BOT_R = 0.075;
  const POT_TOP_R = 0.10;
  const POT_RIM_H = 0.032;
  const POT_RIM_R = 0.106;
  const SOIL_Y = 0.165;
  const SOIL_R = 0.096;

  const potMat = new THREE.MeshStandardMaterial({
    color: 0x667461,
    roughness: 0.55,
    metalness: 0.05
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c20,
    roughness: 0.95,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2d4a26, roughness: 0.45, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x466b38, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x5c8044, roughness: 0.44, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x7b9952, roughness: 0.46, metalness: 0.02 })
  ];

  // Pot body
  const potBodyGeo = new THREE.CylinderGeometry(POT_TOP_R, POT_BOT_R, POT_H, 28);
  const potBody = new THREE.Mesh(potBodyGeo, potMat);
  potBody.name = 'pot_body';
  potBody.position.y = POT_H / 2;
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  group.add(potBody);

  // Pot rim
  const potRimGeo = new THREE.CylinderGeometry(POT_RIM_R, POT_TOP_R * 1.01, POT_RIM_H, 28);
  const potRim = new THREE.Mesh(potRimGeo, potMat);
  potRim.name = 'pot_rim';
  potRim.position.y = POT_H - POT_RIM_H / 2;
  potRim.castShadow = true;
  potRim.receiveShadow = true;
  group.add(potRim);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(SOIL_R, SOIL_R * 0.95, 0.02, 24);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.name = 'pot_soil';
  soil.position.y = SOIL_Y - 0.01;
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  // Helper to create a sword-shaped snake plant leaf
  function createLeafGeo(height, width) {
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.25, 0);
    shape.quadraticCurveTo(-width * 0.55, height * 0.35, -width * 0.42, height * 0.72);
    shape.quadraticCurveTo(-width * 0.2, height * 0.92, 0, height);
    shape.quadraticCurveTo(width * 0.2, height * 0.92, width * 0.42, height * 0.72);
    shape.quadraticCurveTo(width * 0.55, height * 0.35, width * 0.25, 0);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.004,
      bevelEnabled: false,
      curveSegments: 12
    });
  }

  // Deterministic leaf configurations: [height, width, angleY, tiltX, twistZ, offsetR, matIdx]
  const leafConfigs = [
    // Inner tall leaves
    [0.48, 0.058, 0.2, 0.08, 0.05, 0.012, 0],
    [0.46, 0.055, 2.3, 0.11, -0.06, 0.015, 1],
    [0.44, 0.052, 4.4, 0.12, 0.04, 0.014, 2],
    [0.36, 0.048, 1.2, 0.07, -0.04, 0.010, 1],
    // Mid-ring leaves
    [0.43, 0.056, 0.75, 0.22, 0.08, 0.026, 2],
    [0.41, 0.054, 1.85, 0.24, -0.07, 0.028, 0],
    [0.39, 0.052, 3.05, 0.20, 0.06, 0.025, 3],
    [0.42, 0.055, 4.15, 0.23, -0.08, 0.027, 1],
    [0.38, 0.050, 5.35, 0.21, 0.05, 0.024, 0],
    // Outer shorter/wider-angled leaves
    [0.33, 0.048, 0.35, 0.34, -0.09, 0.036, 3],
    [0.31, 0.046, 1.45, 0.36, 0.07, 0.038, 1],
    [0.34, 0.050, 2.65, 0.32, -0.06, 0.035, 2],
    [0.30, 0.045, 3.75, 0.35, 0.08, 0.037, 0],
    [0.32, 0.047, 4.95, 0.33, -0.05, 0.036, 3]
  ];

  for (let i = 0; i < leafConfigs.length; i++) {
    const [h, w, angY, tiltX, twistZ, offR, matIdx] = leafConfigs[i];
    const leafGeo = createLeafGeo(h, w);
    const leaf = new THREE.Mesh(leafGeo, leafMats[matIdx]);
    leaf.name = 'snake_leaf_' + (i + 1);

    const pivot = new THREE.Group();
    pivot.position.set(
      Math.sin(angY) * offR,
      SOIL_Y - 0.025,
      Math.cos(angY) * offR
    );
    pivot.rotation.y = angY;

    leaf.rotation.x = tiltX;
    leaf.rotation.z = twistZ;
    leaf.castShadow = true;
    leaf.receiveShadow = true;

    pivot.add(leaf);
    group.add(pivot);
  }

  return group;
}
