function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_R = 0.11;
  const POT_H = 0.22;
  const POT_WALL = 0.01;
  const SOIL_Y = 0.195;
  const TOTAL_H = 0.92;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c7,
    roughness: 0.78,
    metalness: 0.02,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2c221e,
    roughness: 0.95,
    metalness: 0.0,
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2b4a2b, roughness: 0.45, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x355832, roughness: 0.43, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x3f6438, roughness: 0.42, metalness: 0.02 }),
  ];

  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x6b8e55,
    roughness: 0.46,
    metalness: 0.02,
  });

  const leafEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xc8cf78,
    roughness: 0.45,
    metalness: 0.02,
  });

  // Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(POT_R - 0.015, 0),
    new THREE.Vector2(POT_R - 0.004, 0.006),
    new THREE.Vector2(POT_R, 0.018),
    new THREE.Vector2(POT_R, POT_H - 0.002),
    new THREE.Vector2(POT_R - 0.002, POT_H),
    new THREE.Vector2(POT_R - POT_WALL, POT_H),
    new THREE.Vector2(POT_R - POT_WALL, SOIL_Y - 0.02),
    new THREE.Vector2(0, SOIL_Y - 0.02),
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 28);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'ceramic_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_R - POT_WALL + 0.001, POT_R - POT_WALL + 0.001, 0.02, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Normalized broad sword-leaf shape (height = 1.0, width ~ 1.0)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(-0.28, 0);
  leafShape.quadraticCurveTo(-0.54, 0.35, -0.44, 0.68);
  leafShape.quadraticCurveTo(-0.24, 0.90, 0, 1.0);
  leafShape.quadraticCurveTo(0.24, 0.90, 0.44, 0.68);
  leafShape.quadraticCurveTo(0.54, 0.35, 0.28, 0);
  leafShape.closePath();

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 1,
    curveSegments: 10,
  });
  leafGeo.translate(0, 0, -0.0015);

  const edgeGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 1,
    curveSegments: 10,
  });
  edgeGeo.translate(0, 0, -0.001);

  const bandGeo = new THREE.BoxGeometry(1, 1, 0.0054);

  // Cross-band positions (normalized height, width factor)
  const bandSpecs = [
    { y: 0.22, w: 0.84 },
    { y: 0.42, w: 0.94 },
    { y: 0.62, w: 0.82 },
    { y: 0.79, w: 0.52 },
  ];

  // Deterministic leaf arrangement (11 broad sword-shaped leaves)
  const leafCount = 11;
  const maxLeafH = TOTAL_H - SOIL_Y;

  for (let i = 0; i < leafCount; i++) {
    const angle = i * 2.39996; // Golden angle for natural rosette
    const ring = i < 4 ? 0.25 : i < 8 ? 0.58 : 0.85;
    const radius = ring * (POT_R - POT_WALL - 0.025);

    // Inner leaves are taller, outer leaves are shorter
    const heightFactor = 1.0 - ring * 0.45 + Math.sin(i * 1.7) * 0.08;
    const leafH = Math.max(0.32, Math.min(maxLeafH, maxLeafH * heightFactor));
    const leafW = 0.056 + (1.0 - ring) * 0.018 + Math.cos(i * 2.1) * 0.004;

    const leafGroup = new THREE.Group();
    leafGroup.position.set(
      Math.cos(angle) * radius,
      SOIL_Y - 0.01,
      Math.sin(angle) * radius
    );

    // Orient broad faces outward with slight natural variation
    leafGroup.rotation.y = -angle + Math.PI * 0.5 + Math.sin(i * 3.1) * 0.35;
    // Fan outward in a vase-like silhouette
    leafGroup.rotation.x = 0.06 + ring * 0.22 + Math.cos(i * 1.3) * 0.05;
    leafGroup.rotation.z = Math.sin(i * 2.7) * 0.08;

    // Main green blade
    const blade = new THREE.Mesh(leafGeo, leafMats[i % leafMats.length]);
    blade.name = `snake_leaf_blade_${i + 1}`;
    blade.scale.set(leafW, leafH, 1.0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    leafGroup.add(blade);

    // Yellow-green variegated margin
    const margin = new THREE.Mesh(edgeGeo, leafEdgeMat);
    margin.name = `snake_leaf_margin_${i + 1}`;
    margin.scale.set(leafW * 1.12, leafH * 1.005, 0.85);
    margin.castShadow = true;
    margin.receiveShadow = true;
    leafGroup.add(margin);

    // Lighter green horizontal cross bands
    for (let b = 0; b < bandSpecs.length; b++) {
      const spec = bandSpecs[b];
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.name = `snake_leaf_band_${i + 1}_${b + 1}`;
      band.position.y = spec.y * leafH;
      band.scale.set(leafW * spec.w, leafH * 0.045, 1.0);
      band.castShadow = true;
      band.receiveShadow = true;
      leafGroup.add(band);
    }

    group.add(leafGroup);
  }

  return group;
}
