function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.13;
  const POT_R_BOT = 0.054;
  const POT_R_TOP = 0.072;
  const RIM_H = 0.018;
  const RIM_R = 0.076;
  const SOIL_Y = 0.118;

  const PLANK_W = 0.11;
  const PLANK_T = 0.016;
  const PLANK_H = 0.43;
  const PLANK_BOT_Y = 0.05;
  const PLANK_Z = -0.012;

  const STEM_R = 0.0035;
  const STEM_TOP_Y = 0.445;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x4b6043,
    roughness: 0.45,
    metalness: 0.05,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1e,
    roughness: 0.95,
    metalness: 0.0,
  });

  const plankMat = new THREE.MeshStandardMaterial({
    color: 0xcfa97e,
    roughness: 0.78,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4f7d3a,
    roughness: 0.6,
    metalness: 0.0,
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x35582e, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x426b36, roughness: 0.4, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x5c8a3e, roughness: 0.38, metalness: 0.02 }),
  ];

  function makeMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Pot body
  const potBodyGeo = new THREE.CylinderGeometry(POT_R_TOP, POT_R_BOT, POT_H - RIM_H, 28);
  const potBody = makeMesh(potBodyGeo, potMat, 'pot_body');
  potBody.position.y = (POT_H - RIM_H) / 2;
  group.add(potBody);

  // Pot rim
  const potRimGeo = new THREE.CylinderGeometry(RIM_R, RIM_R * 0.98, RIM_H, 28);
  const potRim = makeMesh(potRimGeo, potMat, 'pot_rim');
  potRim.position.y = POT_H - RIM_H / 2;
  group.add(potRim);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_R_TOP * 0.97, POT_R_TOP * 0.95, 0.015, 24);
  const soil = makeMesh(soilGeo, soilMat, 'pot_soil');
  soil.position.y = SOIL_Y;
  group.add(soil);

  // Wooden plank
  const plankGeo = new THREE.BoxGeometry(PLANK_W, PLANK_H, PLANK_T);
  const plank = makeMesh(plankGeo, plankMat, 'wooden_plank');
  plank.position.set(0, PLANK_BOT_Y + PLANK_H / 2, PLANK_Z);
  group.add(plank);

  // Climbing stem on front of plank
  const plankFrontZ = PLANK_Z + PLANK_T / 2;
  const stemPoints = [
    new THREE.Vector3(-0.002, SOIL_Y, plankFrontZ + 0.004),
    new THREE.Vector3(0.003, 0.19, plankFrontZ + 0.004),
    new THREE.Vector3(-0.002, 0.27, plankFrontZ + 0.004),
    new THREE.Vector3(0.002, 0.35, plankFrontZ + 0.004),
    new THREE.Vector3(0.004, STEM_TOP_Y, plankFrontZ + 0.004),
  ];
  const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 20, STEM_R, 8, false);
  const stem = makeMesh(stemGeo, stemMat, 'climbing_stem');
  group.add(stem);

  // Heart-shaped leaf geometry
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.045);
  leafShape.bezierCurveTo(0.032, -0.025, 0.042, 0.01, 0.028, 0.032);
  leafShape.bezierCurveTo(0.018, 0.046, 0.005, 0.038, 0, 0.028);
  leafShape.bezierCurveTo(-0.005, 0.038, -0.018, 0.046, -0.028, 0.032);
  leafShape.bezierCurveTo(-0.042, 0.01, -0.032, -0.025, 0, -0.045);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 12,
  });
  leafGeo.center();

  // Deterministic leaf placement alternating left and right up the plank
  const leafSpecs = [
    { x: -0.026, y: 0.132, scale: 0.48, rotZ: 0.55, rotY: 0.08, matIdx: 0 },
    { x: 0.028, y: 0.155, scale: 0.85, rotZ: -0.65, rotY: -0.1, matIdx: 0 },
    { x: -0.028, y: 0.185, scale: 0.9, rotZ: 0.62, rotY: 0.1, matIdx: 0 },
    { x: 0.03, y: 0.225, scale: 0.96, rotZ: -0.58, rotY: -0.12, matIdx: 1 },
    { x: -0.03, y: 0.262, scale: 1.0, rotZ: 0.52, rotY: 0.12, matIdx: 1 },
    { x: 0.032, y: 0.305, scale: 1.05, rotZ: -0.48, rotY: -0.1, matIdx: 1 },
    { x: -0.032, y: 0.342, scale: 1.06, rotZ: 0.45, rotY: 0.1, matIdx: 1 },
    { x: 0.032, y: 0.382, scale: 1.1, rotZ: -0.42, rotY: -0.12, matIdx: 2 },
    { x: -0.028, y: 0.418, scale: 1.02, rotZ: 0.38, rotY: 0.1, matIdx: 2 },
  ];

  for (let i = 0; i < leafSpecs.length; i++) {
    const spec = leafSpecs[i];
    const leaf = makeMesh(leafGeo, leafMats[spec.matIdx], `leaf_${i + 1}`);
    leaf.scale.set(spec.scale, spec.scale, 1);
    leaf.position.set(spec.x, spec.y, plankFrontZ + 0.006 + i * 0.0005);
    leaf.rotation.set(0.08, spec.rotY, spec.rotZ);
    group.add(leaf);
  }

  return group;
}
