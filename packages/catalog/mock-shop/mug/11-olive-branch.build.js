function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const SAUCER_RADIUS = 0.078;
  const SAUCER_HEIGHT = 0.022;
  const SAUCER_WELL_Y = 0.007;

  const CUP_FOOT_RADIUS = 0.026;
  const CUP_RIM_RADIUS = 0.053;
  const CUP_HEIGHT = 0.070;
  const CUP_BASE_Y = SAUCER_WELL_Y - 0.001;

  // Shared materials
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4eee1,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  const rimStripeMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d5e,
    roughness: 0.35,
    metalness: 0.05
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x7a5638,
    roughness: 0.65,
    metalness: 0.0
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x6b7d4f,
    roughness: 0.55,
    metalness: 0.0
  });

  const oliveMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b2838,
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2
  });

  function registerMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Saucer (LatheGeometry)
  const saucerPts = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(0.028, 0.002),
    new THREE.Vector2(0.032, 0.0),      // foot ring touching y = 0
    new THREE.Vector2(0.036, 0.002),
    new THREE.Vector2(0.058, 0.009),
    new THREE.Vector2(SAUCER_RADIUS - 0.004, SAUCER_HEIGHT - 0.002),
    new THREE.Vector2(SAUCER_RADIUS, SAUCER_HEIGHT),
    new THREE.Vector2(SAUCER_RADIUS - 0.002, SAUCER_HEIGHT + 0.0015),
    new THREE.Vector2(0.056, 0.012),
    new THREE.Vector2(0.032, SAUCER_WELL_Y),
    new THREE.Vector2(0.0, SAUCER_WELL_Y)
  ];
  const saucerGeo = new THREE.LatheGeometry(saucerPts, 32);
  registerMesh(new THREE.Mesh(saucerGeo, ceramicMat), 'saucer_body');

  // 2. Saucer rim stripe
  const stripeGeo = new THREE.TorusGeometry(SAUCER_RADIUS - 0.0055, 0.0009, 8, 32);
  const stripeMesh = new THREE.Mesh(stripeGeo, rimStripeMat);
  stripeMesh.rotation.x = Math.PI / 2;
  stripeMesh.position.y = SAUCER_HEIGHT - 0.0015;
  registerMesh(stripeMesh, 'saucer_rim_stripe');

  // 3. Teacup body (LatheGeometry with hollow interior and footed base)
  const cupPts = [
    new THREE.Vector2(0.0, 0.003),
    new THREE.Vector2(CUP_FOOT_RADIUS - 0.003, 0.003),
    new THREE.Vector2(CUP_FOOT_RADIUS, 0.0),
    new THREE.Vector2(CUP_FOOT_RADIUS + 0.002, 0.004),
    new THREE.Vector2(CUP_FOOT_RADIUS - 0.001, 0.011),
    new THREE.Vector2(0.036, 0.022),
    new THREE.Vector2(0.045, 0.042),
    new THREE.Vector2(CUP_RIM_RADIUS - 0.002, CUP_HEIGHT - 0.006),
    new THREE.Vector2(CUP_RIM_RADIUS, CUP_HEIGHT),
    new THREE.Vector2(CUP_RIM_RADIUS - 0.003, CUP_HEIGHT + 0.001),
    new THREE.Vector2(CUP_RIM_RADIUS - 0.0055, CUP_HEIGHT - 0.006),
    new THREE.Vector2(0.041, 0.042),
    new THREE.Vector2(0.031, 0.022),
    new THREE.Vector2(0.018, 0.012),
    new THREE.Vector2(0.0, 0.010)
  ];
  const cupGeo = new THREE.LatheGeometry(cupPts, 32);
  const cupMesh = new THREE.Mesh(cupGeo, ceramicMat);
  cupMesh.position.y = CUP_BASE_Y;
  registerMesh(cupMesh, 'cup_body');

  // 4. Teacup handle (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CUP_RIM_RADIUS - 0.006, CUP_BASE_Y + CUP_HEIGHT - 0.014, 0),
    new THREE.Vector3(CUP_RIM_RADIUS + 0.014, CUP_BASE_Y + CUP_HEIGHT - 0.008, 0),
    new THREE.Vector3(CUP_RIM_RADIUS + 0.022, CUP_BASE_Y + CUP_HEIGHT * 0.56, 0),
    new THREE.Vector3(CUP_RIM_RADIUS + 0.012, CUP_BASE_Y + 0.024, 0),
    new THREE.Vector3(0.036, CUP_BASE_Y + 0.019, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0042, 12, false);
  registerMesh(new THREE.Mesh(handleGeo, ceramicMat), 'cup_handle');

  // 5. Olive branch motif on cup front (+Z)
  const cupStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.024, CUP_BASE_Y + 0.028, 0.035),
    new THREE.Vector3(-0.006, CUP_BASE_Y + 0.024, 0.041),
    new THREE.Vector3(0.014, CUP_BASE_Y + 0.030, 0.041),
    new THREE.Vector3(0.030, CUP_BASE_Y + 0.044, 0.036)
  ]);
  const cupStemGeo = new THREE.TubeGeometry(cupStemCurve, 16, 0.0009, 6, false);
  registerMesh(new THREE.Mesh(cupStemGeo, stemMat), 'cup_branch_stem');

  const oliveGeo = new THREE.SphereGeometry(0.0036, 12, 10);
  const cupOlives = [
    { pos: [-0.018, CUP_BASE_Y + 0.029, 0.038], rot: [0.2, 0.4, 0.5] },
    { pos: [-0.003, CUP_BASE_Y + 0.030, 0.043], rot: [0.1, -0.2, -0.3] },
    { pos: [0.013, CUP_BASE_Y + 0.025, 0.040], rot: [0.3, 0.3, 0.6] },
    { pos: [0.024, CUP_BASE_Y + 0.037, 0.039], rot: [0.2, -0.4, 0.9] }
  ];
  cupOlives.forEach((o, i) => {
    const m = new THREE.Mesh(oliveGeo, oliveMat);
    m.scale.set(0.75, 1.2, 0.55);
    m.position.set(o.pos[0], o.pos[1], o.pos[2]);
    m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    registerMesh(m, 'cup_olive_' + (i + 1));
  });

  const leafGeo = new THREE.SphereGeometry(0.0055, 10, 8);
  const cupLeaves = [
    { pos: [-0.012, CUP_BASE_Y + 0.022, 0.039], rot: [0.2, 0.2, -0.7] },
    { pos: [0.004, CUP_BASE_Y + 0.035, 0.044], rot: [0.1, 0.1, 0.5] },
    { pos: [0.020, CUP_BASE_Y + 0.042, 0.041], rot: [0.1, -0.3, -0.4] }
  ];
  cupLeaves.forEach((l, i) => {
    const m = new THREE.Mesh(leafGeo, leafMat);
    m.scale.set(0.4, 1.45, 0.25);
    m.position.set(l.pos[0], l.pos[1], l.pos[2]);
    m.rotation.set(l.rot[0], l.rot[1], l.rot[2]);
    registerMesh(m, 'cup_leaf_' + (i + 1));
  });

  // 6. Olive branch motif on saucer (front-left)
  const saucerStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.040, 0.012, 0.034),
    new THREE.Vector3(-0.048, 0.013, 0.018),
    new THREE.Vector3(-0.052, 0.014, 0.002)
  ]);
  const saucerStemGeo = new THREE.TubeGeometry(saucerStemCurve, 12, 0.0008, 6, false);
  registerMesh(new THREE.Mesh(saucerStemGeo, stemMat), 'saucer_branch_stem');

  const saucerOlives = [
    { pos: [-0.046, 0.0135, 0.024], rot: [1.3, 0.2, 0.4] },
    { pos: [-0.053, 0.0145, 0.009], rot: [1.2, -0.1, -0.5] }
  ];
  saucerOlives.forEach((o, i) => {
    const m = new THREE.Mesh(oliveGeo, oliveMat);
    m.scale.set(0.7, 1.15, 0.45);
    m.position.set(o.pos[0], o.pos[1], o.pos[2]);
    m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    registerMesh(m, 'saucer_olive_' + (i + 1));
  });

  const saucerLeaves = [
    { pos: [-0.042, 0.0125, 0.028], rot: [1.3, 0.3, -0.6] },
    { pos: [-0.052, 0.014, 0.016], rot: [1.25, -0.2, 0.7] }
  ];
  saucerLeaves.forEach((l, i) => {
    const m = new THREE.Mesh(leafGeo, leafMat);
    m.scale.set(0.38, 1.4, 0.22);
    m.position.set(l.pos[0], l.pos[1], l.pos[2]);
    m.rotation.set(l.rot[0], l.rot[1], l.rot[2]);
    registerMesh(m, 'saucer_leaf_' + (i + 1));
  });

  return group;
}
