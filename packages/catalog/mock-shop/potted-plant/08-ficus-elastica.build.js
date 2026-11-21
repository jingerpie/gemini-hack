function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.62;
  const POT_H = 0.18;
  const POT_TOP_R = 0.095;
  const POT_BOT_R = 0.070;
  const POT_RIM_H = 0.032;
  const POT_RIM_R = 0.100;
  const SOIL_Y = POT_H - 0.015;
  const STEM_H = TOTAL_H - POT_H + 0.02;

  const LEAF_LEN = 0.21;
  const LEAF_WID = 0.11;
  const LEAF_THICK = 0.008;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x6c706e,
    roughness: 0.65,
    metalness: 0.05,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2b2119,
    roughness: 0.95,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4f6332,
    roughness: 0.7,
    metalness: 0.0,
  });

  const stemBaseMat = new THREE.MeshStandardMaterial({
    color: 0x5e5236,
    roughness: 0.8,
    metalness: 0.0,
  });

  const leafMats = [
    new THREE.MeshPhysicalMaterial({
      color: 0x233d1e,
      roughness: 0.28,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.22,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x2b4a24,
      roughness: 0.30,
      metalness: 0.0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x33542a,
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.28,
    }),
  ];

  const spearMat = new THREE.MeshPhysicalMaterial({
    color: 0x5c7838,
    roughness: 0.35,
    metalness: 0.0,
    clearcoat: 0.3,
  });

  function makeMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // 1. Pot (LatheGeometry for realistic nursery pot profile)
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(POT_BOT_R, 0.0),
    new THREE.Vector2(POT_TOP_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.006, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.008, SOIL_Y - 0.01),
    new THREE.Vector2(0.0, SOIL_Y - 0.01),
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 28);
  const potMesh = makeMesh(potGeo, potMat, 'nursery_pot');
  group.add(potMesh);

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R - 0.006, POT_TOP_R - 0.01, 0.02, 24);
  const soilMesh = makeMesh(soilGeo, soilMat, 'potting_soil');
  soilMesh.position.y = SOIL_Y - 0.005;
  group.add(soilMesh);

  // 3. Main Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, SOIL_Y, 0.0),
    new THREE.Vector3(0.004, SOIL_Y + STEM_H * 0.3, 0.002),
    new THREE.Vector3(-0.003, SOIL_Y + STEM_H * 0.65, -0.002),
    new THREE.Vector3(0.002, SOIL_Y + STEM_H * 0.85, 0.001),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.0075, 10, false);
  const stemMesh = makeMesh(stemGeo, stemMat, 'main_stem');
  group.add(stemMesh);

  // Woody base collar
  const baseGeo = new THREE.CylinderGeometry(0.0085, 0.011, 0.05, 10);
  const baseMesh = makeMesh(baseGeo, stemBaseMat, 'stem_base');
  baseMesh.position.y = SOIL_Y + 0.02;
  group.add(baseMesh);

  // Secondary small shoot on the right
  const shootCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.005, SOIL_Y, 0.004),
    new THREE.Vector3(0.025, SOIL_Y + 0.05, 0.012),
    new THREE.Vector3(0.036, SOIL_Y + 0.11, 0.015),
  ]);
  const shootGeo = new THREE.TubeGeometry(shootCurve, 10, 0.0045, 8, false);
  const shootMesh = makeMesh(shootGeo, stemMat, 'secondary_shoot');
  group.add(shootMesh);

  // Furled tip on secondary shoot
  const smallSpearGeo = new THREE.ConeGeometry(0.004, 0.045, 8);
  const smallSpear = makeMesh(smallSpearGeo, spearMat, 'secondary_leaf_spear');
  smallSpear.position.set(0.037, SOIL_Y + 0.13, 0.015);
  smallSpear.rotation.z = -0.1;
  group.add(smallSpear);

  // 4. Leaf Geometry (Broad glossy oval leaf via flattened SphereGeometry)
  const leafGeo = new THREE.SphereGeometry(1, 16, 12);
  leafGeo.scale(LEAF_WID * 0.5, LEAF_THICK * 0.5, LEAF_LEN * 0.5);
  leafGeo.translate(0, 0, LEAF_LEN * 0.5);

  const petioleGeo = new THREE.CylinderGeometry(0.0022, 0.0032, 0.032, 6);
  petioleGeo.rotateX(Math.PI / 2);
  petioleGeo.translate(0, 0, 0.014);

  const midribGeo = new THREE.CylinderGeometry(0.0008, 0.0022, LEAF_LEN * 0.72, 6);
  midribGeo.rotateX(Math.PI / 2);
  midribGeo.translate(0, 0.0025, LEAF_LEN * 0.38);

  // Deterministic leaf placement along main stem
  // [heightFraction, azimuthRad, pitchRad, scale, rollRad]
  const leafConfigs = [
    [0.08, 2.7, 0.12, 0.62, 0.18],
    [0.14, 0.5, 0.15, 0.66, -0.18],
    [0.23, 4.4, 0.22, 0.78, 0.22],
    [0.32, 1.5, 0.25, 0.84, -0.25],
    [0.41, 3.6, 0.32, 0.92, 0.20],
    [0.50, 5.7, 0.36, 0.96, -0.22],
    [0.59, 1.2, 0.48, 1.02, 0.24],
    [0.67, 3.9, 0.58, 1.05, -0.20],
    [0.75, 0.2, 0.72, 1.02, 0.15],
    [0.82, 2.5, 0.85, 0.98, -0.18],
    [0.87, 5.1, 0.95, 0.92, 0.16],
    [0.91, 1.7, 1.02, 0.85, -0.12],
  ];

  leafConfigs.forEach((cfg, idx) => {
    const [hFrac, azim, pitch, scale, roll] = cfg;
    const t = hFrac * 0.85;
    const attachPt = stemCurve.getPoint(Math.min(t, 0.98));

    const leafNode = new THREE.Group();
    leafNode.position.copy(attachPt);
    leafNode.rotation.order = 'YXZ';
    leafNode.rotation.y = azim;
    leafNode.rotation.x = -pitch;
    leafNode.rotation.z = roll;

    const petiole = makeMesh(petioleGeo, stemMat, `leaf_petiole_${idx}`);
    leafNode.add(petiole);

    const blade = makeMesh(leafGeo, leafMats[idx % leafMats.length], `leaf_blade_${idx}`);
    blade.position.z = 0.025;
    blade.scale.set(scale, 1, scale);
    leafNode.add(blade);

    const midrib = makeMesh(midribGeo, stemMat, `leaf_midrib_${idx}`);
    midrib.position.z = 0.025;
    midrib.scale.set(scale, 1, scale);
    leafNode.add(midrib);

    group.add(leafNode);
  });

  // 5. Top furled new leaf spear
  const topSpearGeo = new THREE.ConeGeometry(0.0055, 0.09, 10);
  const topSpear = makeMesh(topSpearGeo, spearMat, 'top_leaf_spear');
  const topPt = stemCurve.getPoint(0.98);
  topSpear.position.set(topPt.x, topPt.y + 0.04, topPt.z);
  topSpear.rotation.z = -0.06;
  group.add(topSpear);

  return group;
}
