function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_R = 0.11;
  const POT_H = 0.20;
  const SOIL_Y = POT_H - 0.015;
  const TOTAL_H = 0.72;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe9,
    roughness: 0.45,
    metalness: 0.02,
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1e,
    roughness: 0.95,
    metalness: 0.0,
  });
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0xa8a68a,
    roughness: 0.85,
    metalness: 0.0,
  });
  const leafMatDark = new THREE.MeshStandardMaterial({
    color: 0x2d4c24,
    roughness: 0.35,
    metalness: 0.02,
  });
  const leafMatMid = new THREE.MeshStandardMaterial({
    color: 0x3a5e2b,
    roughness: 0.38,
    metalness: 0.02,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4b6e32,
    roughness: 0.55,
    metalness: 0.0,
  });
  const stakeMat = new THREE.MeshStandardMaterial({
    color: 0x9c7e54,
    roughness: 0.75,
    metalness: 0.0,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0x6e4f32,
    roughness: 0.85,
    metalness: 0.0,
  });
  const petalMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbf9f2,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0xe6a82e,
    roughness: 0.45,
    metalness: 0.0,
  });
  const budMat = new THREE.MeshStandardMaterial({
    color: 0xd8deb8,
    roughness: 0.5,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Pot & Soil
  const potGeo = new THREE.CylinderGeometry(POT_R, POT_R * 0.96, POT_H, 32);
  addMesh(potGeo, potMat, "ceramic_pot", [0, POT_H * 0.5, 0]);

  const soilGeo = new THREE.CylinderGeometry(POT_R * 0.94, POT_R * 0.94, 0.02, 24);
  addMesh(soilGeo, soilMat, "soil_bark_bed", [0, SOIL_Y - 0.005, 0]);

  // Aerial roots draping near front of pot
  const rootCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.01, SOIL_Y + 0.005, 0.02),
      new THREE.Vector3(-0.03, SOIL_Y + 0.01, 0.07),
      new THREE.Vector3(-0.055, SOIL_Y - 0.01, 0.105),
      new THREE.Vector3(-0.07, SOIL_Y - 0.025, 0.112),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.005, SOIL_Y + 0.005, 0.02),
      new THREE.Vector3(0.02, SOIL_Y + 0.008, 0.08),
      new THREE.Vector3(0.035, SOIL_Y - 0.012, 0.108),
      new THREE.Vector3(0.042, SOIL_Y - 0.03, 0.114),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, SOIL_Y + 0.006, 0.015),
      new THREE.Vector3(-0.005, SOIL_Y + 0.012, 0.065),
      new THREE.Vector3(-0.012, SOIL_Y - 0.015, 0.108),
      new THREE.Vector3(-0.018, SOIL_Y - 0.04, 0.114),
    ]),
  ];
  rootCurves.forEach((curve, idx) => {
    const rGeo = new THREE.TubeGeometry(curve, 12, 0.0032, 6, false);
    addMesh(rGeo, rootMat, "aerial_root_" + (idx + 1));
  });

  // 2. Base Rosette of Orchid Leaves
  const leafGeo = new THREE.SphereGeometry(1, 16, 12);
  const leafConfigs = [
    { rotY: 0.2, tiltX: 0.35, len: 0.145, wid: 0.042, y: SOIL_Y + 0.03, mat: leafMatDark },
    { rotY: 1.1, tiltX: 0.48, len: 0.155, wid: 0.045, y: SOIL_Y + 0.025, mat: leafMatMid },
    { rotY: 2.0, tiltX: 0.42, len: 0.14, wid: 0.04, y: SOIL_Y + 0.028, mat: leafMatDark },
    { rotY: 2.9, tiltX: 0.52, len: 0.16, wid: 0.046, y: SOIL_Y + 0.022, mat: leafMatMid },
    { rotY: 3.8, tiltX: 0.38, len: 0.135, wid: 0.038, y: SOIL_Y + 0.032, mat: leafMatDark },
    { rotY: 4.7, tiltX: 0.55, len: 0.165, wid: 0.045, y: SOIL_Y + 0.02, mat: leafMatMid },
    { rotY: 5.5, tiltX: 0.45, len: 0.15, wid: 0.042, y: SOIL_Y + 0.026, mat: leafMatDark },
    { rotY: 0.65, tiltX: 0.25, len: 0.11, wid: 0.034, y: SOIL_Y + 0.045, mat: leafMatMid },
  ];

  leafConfigs.forEach((cfg, idx) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, cfg.y, 0);
    pivot.rotation.y = cfg.rotY;

    const leafMesh = new THREE.Mesh(leafGeo, cfg.mat);
    leafMesh.name = "orchid_leaf_" + (idx + 1);
    leafMesh.scale.set(cfg.wid, 0.006, cfg.len);
    leafMesh.position.set(0, 0, cfg.len * 0.72);
    leafMesh.rotation.x = cfg.tiltX;
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;

    pivot.add(leafMesh);
    group.add(pivot);
  });

  // 3. Three Bamboo Stakes
  const stakes = [
    { x: -0.055, z: -0.015, h: 0.34 },
    { x: 0.005, z: -0.02, h: 0.40 },
    { x: 0.06, z: -0.01, h: 0.33 },
  ];
  stakes.forEach((s, idx) => {
    const sGeo = new THREE.CylinderGeometry(0.003, 0.0038, s.h, 8);
    addMesh(sGeo, stakeMat, "bamboo_stake_" + (idx + 1), [s.x, SOIL_Y + s.h * 0.5, s.z]);

    const tGeo = new THREE.TorusGeometry(0.007, 0.0018, 6, 12);
    addMesh(tGeo, tieMat, "stake_tie_" + (idx + 1), [s.x, SOIL_Y + s.h - 0.03, s.z], [Math.PI * 0.5, 0, 0]);
  });

  // 4. Three Arching Flower Stems
  const stemCurves = [
    // Left arching stem
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, SOIL_Y, -0.01),
      new THREE.Vector3(-0.06, SOIL_Y + 0.18, -0.01),
      new THREE.Vector3(-0.075, SOIL_Y + 0.34, 0.0),
      new THREE.Vector3(-0.13, SOIL_Y + 0.40, 0.02),
      new THREE.Vector3(-0.20, SOIL_Y + 0.33, 0.04),
      new THREE.Vector3(-0.23, SOIL_Y + 0.21, 0.05),
      new THREE.Vector3(-0.22, SOIL_Y + 0.14, 0.05),
    ]),
    // Center tall stem
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, SOIL_Y, -0.015),
      new THREE.Vector3(0.005, SOIL_Y + 0.22, -0.015),
      new THREE.Vector3(0.01, SOIL_Y + 0.42, 0.0),
      new THREE.Vector3(-0.01, SOIL_Y + 0.50, 0.02),
      new THREE.Vector3(0.04, SOIL_Y + 0.45, 0.04),
      new THREE.Vector3(0.04, SOIL_Y + 0.32, 0.05),
      new THREE.Vector3(0.01, SOIL_Y + 0.24, 0.05),
    ]),
    // Right arching stem
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.048, SOIL_Y, -0.005),
      new THREE.Vector3(0.06, SOIL_Y + 0.18, -0.005),
      new THREE.Vector3(0.08, SOIL_Y + 0.33, 0.005),
      new THREE.Vector3(0.14, SOIL_Y + 0.38, 0.025),
      new THREE.Vector3(0.21, SOIL_Y + 0.31, 0.045),
      new THREE.Vector3(0.23, SOIL_Y + 0.19, 0.055),
      new THREE.Vector3(0.22, SOIL_Y + 0.12, 0.055),
    ]),
  ];

  stemCurves.forEach((curve, idx) => {
    const stGeo = new THREE.TubeGeometry(curve, 28, 0.0042, 8, false);
    addMesh(stGeo, stemMat, "orchid_stem_" + (idx + 1));
  });

  // 5. Orchid Flower Geometry (5-petal/sepal silhouette via ExtrudeGeometry)
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0.008);
  // Dorsal sepal (top)
  petalShape.bezierCurveTo(0.018, 0.014, 0.022, 0.042, 0.0, 0.044);
  petalShape.bezierCurveTo(-0.022, 0.042, -0.018, 0.014, 0, 0.008);
  // Right lateral petal
  petalShape.bezierCurveTo(0.015, 0.022, 0.048, 0.022, 0.05, 0.0);
  petalShape.bezierCurveTo(0.048, -0.022, 0.02, -0.02, 0.006, -0.006);
  // Right lower sepal
  petalShape.bezierCurveTo(0.022, -0.018, 0.025, -0.038, 0.008, -0.04);
  petalShape.bezierCurveTo(0.002, -0.038, 0.0, -0.018, 0, -0.008);
  // Left lower sepal
  petalShape.bezierCurveTo(0.0, -0.018, -0.002, -0.038, -0.008, -0.04);
  petalShape.bezierCurveTo(-0.025, -0.038, -0.022, -0.018, -0.006, -0.006);
  // Left lateral petal
  petalShape.bezierCurveTo(-0.02, -0.02, -0.048, -0.022, -0.05, 0.0);
  petalShape.bezierCurveTo(-0.048, 0.022, -0.015, 0.022, 0, 0.008);

  const flowerGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  flowerGeo.center();

  const lipGeo = new THREE.SphereGeometry(0.01, 10, 8);

  // Place flowers along the 3 stems
  const flowerPlacements = [
    // Left stem flowers
    { stem: 0, t: 0.48, rotY: -0.2, rotX: 0.1, scale: 1.0 },
    { stem: 0, t: 0.58, rotY: -0.35, rotX: 0.05, scale: 0.95 },
    { stem: 0, t: 0.68, rotY: -0.45, rotX: 0.1, scale: 0.92 },
    { stem: 0, t: 0.78, rotY: -0.3, rotX: 0.15, scale: 0.85 },
    // Center stem flowers
    { stem: 1, t: 0.42, rotY: 0.0, rotX: 0.05, scale: 1.05 },
    { stem: 1, t: 0.52, rotY: 0.15, rotX: 0.08, scale: 1.02 },
    { stem: 1, t: 0.62, rotY: -0.1, rotX: 0.1, scale: 0.98 },
    { stem: 1, t: 0.72, rotY: 0.2, rotX: 0.12, scale: 0.92 },
    { stem: 1, t: 0.80, rotY: 0.1, rotX: 0.15, scale: 0.86 },
    // Right stem flowers
    { stem: 2, t: 0.48, rotY: 0.2, rotX: 0.08, scale: 1.0 },
    { stem: 2, t: 0.58, rotY: 0.35, rotX: 0.05, scale: 0.95 },
    { stem: 2, t: 0.68, rotY: 0.45, rotX: 0.1, scale: 0.9 },
    { stem: 2, t: 0.78, rotY: 0.3, rotX: 0.15, scale: 0.85 },
  ];

  flowerPlacements.forEach((fp, idx) => {
    const pos = stemCurves[fp.stem].getPointAt(fp.t);
    const fGroup = new THREE.Group();
    fGroup.position.set(pos.x, pos.y, pos.z + 0.015);
    fGroup.rotation.set(fp.rotX, fp.rotY, 0);
    fGroup.scale.setScalar(fp.scale);

    const petalMesh = new THREE.Mesh(flowerGeo, petalMat);
    petalMesh.name = "orchid_flower_petals_" + (idx + 1);
    petalMesh.castShadow = true;
    petalMesh.receiveShadow = true;
    fGroup.add(petalMesh);

    const lipMesh = new THREE.Mesh(lipGeo, lipMat);
    lipMesh.name = "orchid_flower_lip_" + (idx + 1);
    lipMesh.position.set(0, -0.004, 0.007);
    lipMesh.scale.set(0.9, 1.1, 0.7);
    lipMesh.castShadow = true;
    lipMesh.receiveShadow = true;
    fGroup.add(lipMesh);

    group.add(fGroup);
  });

  // 6. Buds at the drooping tips of each stem
  const budGeo = new THREE.SphereGeometry(0.01, 10, 8);
  const budPlacements = [
    { stem: 0, t: 0.88, scale: 1.0 },
    { stem: 0, t: 0.94, scale: 0.8 },
    { stem: 0, t: 0.99, scale: 0.6 },
    { stem: 1, t: 0.88, scale: 1.0 },
    { stem: 1, t: 0.94, scale: 0.8 },
    { stem: 1, t: 0.99, scale: 0.6 },
    { stem: 2, t: 0.88, scale: 1.0 },
    { stem: 2, t: 0.94, scale: 0.8 },
    { stem: 2, t: 0.99, scale: 0.6 },
  ];

  budPlacements.forEach((bp, idx) => {
    const pos = stemCurves[bp.stem].getPointAt(bp.t);
    addMesh(
      budGeo,
      budMat,
      "orchid_bud_" + (idx + 1),
      [pos.x, pos.y - 0.006, pos.z + 0.006],
      [0.3, 0, 0],
      [bp.scale * 0.85, bp.scale * 1.25, bp.scale * 0.85]
    );
  });

  return group;
}
