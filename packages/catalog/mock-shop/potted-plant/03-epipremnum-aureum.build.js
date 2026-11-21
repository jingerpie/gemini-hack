function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.14;
  const POT_TOP_R = 0.08;
  const POT_BOT_R = 0.06;
  const RIM_H = 0.018;
  const RIM_R = 0.085;
  const SOIL_H = 0.015;
  const SOIL_Y = POT_H - 0.014;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x1f2823,
    roughness: 0.45,
    metalness: 0.05
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2d22,
    roughness: 0.95,
    metalness: 0.0
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c8038,
    roughness: 0.6,
    metalness: 0.0
  });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x4a7c38, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x7ca655, roughness: 0.45, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0xa8c47a, roughness: 0.48, metalness: 0.02 })
  ];

  // Pot body
  const potGeo = new THREE.CylinderGeometry(POT_TOP_R, POT_BOT_R, POT_H, 24);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.position.y = POT_H / 2;
  potMesh.name = 'pot_body';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Pot rim
  const rimGeo = new THREE.CylinderGeometry(RIM_R, RIM_R * 0.98, RIM_H, 24);
  const rimMesh = new THREE.Mesh(rimGeo, potMat);
  rimMesh.position.y = POT_H - RIM_H / 2;
  rimMesh.name = 'pot_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R * 0.94, POT_TOP_R * 0.94, SOIL_H, 20);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = SOIL_Y;
  soilMesh.name = 'soil';
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Heart-shaped Pothos leaf geometry
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.022, -0.008, 0.042, 0.015, 0.032, 0.048);
  leafShape.bezierCurveTo(0.022, 0.072, 0.008, 0.085, 0, 0.105);
  leafShape.bezierCurveTo(-0.008, 0.085, -0.022, 0.072, -0.032, 0.048);
  leafShape.bezierCurveTo(-0.042, 0.015, -0.022, -0.008, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0015,
    bevelEnabled: false,
    curveSegments: 8
  });

  // Helper to add a leaf at a given position, rotation, and scale
  let leafIndex = 0;
  function addLeaf(x, y, z, rx, ry, rz, scale, matIdx) {
    const mesh = new THREE.Mesh(leafGeo, leafMats[matIdx % leafMats.length]);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(scale, scale, 1);
    mesh.name = 'pothos_leaf_' + leafIndex++;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Stem paths (originating from soil)
  const stemDefs = [
    // Prominent left trailing vine (matching photo)
    [
      new THREE.Vector3(-0.02, SOIL_Y, 0.02),
      new THREE.Vector3(-0.07, SOIL_Y + 0.02, 0.04),
      new THREE.Vector3(-0.12, SOIL_Y - 0.03, 0.06),
      new THREE.Vector3(-0.17, SOIL_Y - 0.08, 0.07),
      new THREE.Vector3(-0.22, SOIL_Y - 0.09, 0.05)
    ],
    // Right arching vine
    [
      new THREE.Vector3(0.03, SOIL_Y, 0.01),
      new THREE.Vector3(0.09, SOIL_Y + 0.02, 0.02),
      new THREE.Vector3(0.16, SOIL_Y + 0.01, 0.01),
      new THREE.Vector3(0.21, SOIL_Y + 0.05, 0.0)
    ],
    // Upper-left arching stem
    [
      new THREE.Vector3(-0.02, SOIL_Y, -0.01),
      new THREE.Vector3(-0.06, SOIL_Y + 0.06, -0.02),
      new THREE.Vector3(-0.11, SOIL_Y + 0.11, -0.01)
    ],
    // Center-back upright stem
    [
      new THREE.Vector3(0.0, SOIL_Y, -0.02),
      new THREE.Vector3(0.01, SOIL_Y + 0.07, -0.04),
      new THREE.Vector3(0.03, SOIL_Y + 0.12, -0.05)
    ],
    // Front-right arching stem
    [
      new THREE.Vector3(0.02, SOIL_Y, 0.03),
      new THREE.Vector3(0.06, SOIL_Y + 0.05, 0.06),
      new THREE.Vector3(0.11, SOIL_Y + 0.06, 0.08)
    ],
    // Center-top stem
    [
      new THREE.Vector3(-0.01, SOIL_Y, 0.0),
      new THREE.Vector3(0.0, SOIL_Y + 0.08, 0.01),
      new THREE.Vector3(-0.02, SOIL_Y + 0.13, 0.02)
    ]
  ];

  // Build stems and place leaves along them
  for (let s = 0; s < stemDefs.length; s++) {
    const curve = new THREE.CatmullRomCurve3(stemDefs[s]);
    const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.0032, 6, false);
    const stemMesh = new THREE.Mesh(tubeGeo, stemMat);
    stemMesh.name = 'pothos_stem_' + s;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    const leafCount = s === 0 ? 6 : 4;
    for (let i = 1; i <= leafCount; i++) {
      const t = i / leafCount;
      const pt = curve.getPoint(t);
      const yaw = s * 1.1 + i * 1.4;
      const pitch = 0.55 + ((i % 3) * 0.25);
      const roll = ((i % 2 === 0 ? 1 : -1) * 0.3);
      const scale = 0.75 + ((i + s) % 3) * 0.15;
      addLeaf(pt.x, pt.y, pt.z, pitch, yaw, roll, scale, i + s);
    }
  }

  // Dense crown leaves around the pot top
  const crownCount = 16;
  for (let i = 0; i < crownCount; i++) {
    const angle = (i / crownCount) * Math.PI * 2;
    const radius = 0.02 + (i % 3) * 0.022;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = SOIL_Y + 0.03 + (i % 4) * 0.022;
    const pitch = 0.4 + (i % 3) * 0.25;
    const yaw = -angle + Math.PI / 2;
    const roll = ((i % 2 === 0 ? 1 : -1) * 0.2);
    const scale = 0.7 + (i % 4) * 0.12;
    addLeaf(x, y, z, pitch, yaw, roll, scale, i);
  }

  return group;
}
