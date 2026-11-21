function build(THREE) {
  const group = new THREE.Group();

  const H = 0.22;
  const FOOT_R = 0.048;
  const STEM_R = 0.017;
  const COLLAR_R = 0.022;
  const STEM_H = 0.056;
  const CUP_MAX_R = 0.060;
  const WALL_T = 0.005;
  const NUM_RIBS = 16;
  const RIB_R = 0.0085;
  const RADIAL_SEGS = 32;

  const matteCeramic = new THREE.MeshStandardMaterial({
    color: 0x2a2d30,
    roughness: 0.78,
    metalness: 0.05,
  });

  const glossyGlaze = new THREE.MeshPhysicalMaterial({
    color: 0x1c1f22,
    roughness: 0.14,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });

  // 1. Pedestal base (foot + stem + collar)
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FOOT_R * 0.92, 0.0),
    new THREE.Vector2(FOOT_R, 0.004),
    new THREE.Vector2(FOOT_R * 0.96, 0.010),
    new THREE.Vector2(FOOT_R * 0.65, 0.018),
    new THREE.Vector2(STEM_R * 1.15, 0.028),
    new THREE.Vector2(STEM_R, 0.038),
    new THREE.Vector2(COLLAR_R, 0.044),
    new THREE.Vector2(STEM_R * 1.05, 0.050),
    new THREE.Vector2(STEM_R * 1.2, STEM_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, RADIAL_SEGS);
  const baseMesh = new THREE.Mesh(baseGeo, matteCeramic);
  baseMesh.name = 'pedestal_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Cup profile helper (r as a function of y from STEM_H to H)
  function cupRadius(y) {
    const t = Math.max(0, Math.min(1, (y - STEM_H) / (H - STEM_H)));
    // Smoothly flares from stem to upper body, then gently widens to rim
    const curve = Math.pow(t, 0.48);
    return STEM_R * 1.15 + (CUP_MAX_R - STEM_R * 1.15) * curve;
  }

  // 2. Outer cup core
  const outerPoints = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const y = STEM_H + (i / steps) * (H - 0.003 - STEM_H);
    outerPoints.push(new THREE.Vector2(cupRadius(y), y));
  }
  outerPoints.push(new THREE.Vector2(CUP_MAX_R - WALL_T * 0.5, H - 0.002));
  const outerGeo = new THREE.LatheGeometry(outerPoints, RADIAL_SEGS);
  const outerMesh = new THREE.Mesh(outerGeo, matteCeramic);
  outerMesh.name = 'outer_cup_core';
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  group.add(outerMesh);

  // 3. Inner glossy cup
  const innerPoints = [
    new THREE.Vector2(0.0, STEM_H + 0.006),
  ];
  for (let i = 1; i <= steps; i++) {
    const y = STEM_H + 0.006 + (i / steps) * (H - 0.002 - (STEM_H + 0.006));
    const r = Math.max(0.005, cupRadius(y) - WALL_T);
    innerPoints.push(new THREE.Vector2(r, y));
  }
  const innerGeo = new THREE.LatheGeometry(innerPoints, RADIAL_SEGS);
  const innerMesh = new THREE.Mesh(innerGeo, glossyGlaze);
  innerMesh.name = 'inner_cup_glaze';
  innerMesh.castShadow = true;
  innerMesh.receiveShadow = true;
  group.add(innerMesh);

  // 4. Vertical ribs around the cup
  const ribCurvePoints = [];
  const ribSteps = 12;
  for (let i = 0; i <= ribSteps; i++) {
    const y = STEM_H + 0.002 + (i / ribSteps) * (H - (STEM_H + 0.002));
    const r = cupRadius(y) - RIB_R * 0.25;
    ribCurvePoints.push(new THREE.Vector3(r, y, 0));
  }
  const ribCurve = new THREE.CatmullRomCurve3(ribCurvePoints);
  const ribGeo = new THREE.TubeGeometry(ribCurve, 20, RIB_R, 10, false);

  for (let i = 0; i < NUM_RIBS; i++) {
    const angle = (i / NUM_RIBS) * Math.PI * 2;
    const ribMesh = new THREE.Mesh(ribGeo, matteCeramic);
    ribMesh.name = `cup_rib_${i}`;
    ribMesh.rotation.y = angle;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  }

  return group;
}
