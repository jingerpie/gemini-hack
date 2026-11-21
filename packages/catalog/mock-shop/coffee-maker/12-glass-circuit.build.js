function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale)
  const H = 0.36;
  const BASE_W = 0.135;
  const BASE_D = 0.145;
  const BASE_THICK = 0.011;
  const ARM_R = 0.0065;
  const BULB_R = 0.054;
  const BULB_NECK_R = 0.020;
  const UPPER_R_TOP = 0.050;
  const UPPER_R_BOT = 0.044;
  const BURNER_R = 0.036;
  const BURNER_H = 0.034;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc2c6ca,
    roughness: 0.32,
    metalness: 0.85,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x8a8e92,
    roughness: 0.38,
    metalness: 0.88,
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e20,
    roughness: 0.78,
    metalness: 0.05,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f8fa,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.34,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Horseshoe Base (U-shaped flat base opening toward +Z)
  const baseOuterR = BASE_W / 2;
  const baseInnerR = baseOuterR - 0.018;
  const uShape = new THREE.Shape();
  uShape.absarc(0, 0, baseOuterR, Math.PI, 0, false);
  uShape.lineTo(baseOuterR, -0.055);
  uShape.lineTo(baseInnerR, -0.055);
  uShape.absarc(0, 0, baseInnerR, 0, Math.PI, true);
  uShape.lineTo(-baseOuterR, -0.055);
  uShape.lineTo(-baseOuterR, 0);

  const baseGeo = new THREE.ExtrudeGeometry(uShape, {
    depth: BASE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3,
    curveSegments: 24,
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, metalMat, 'base_horseshoe', 0, BASE_THICK + 0.002, -0.012);

  // 2. Vertical Support Arm (curving from back of base up to bulb collar)
  const collarY = 0.205;
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BASE_THICK * 0.5, -baseOuterR + 0.002),
    new THREE.Vector3(0, 0.035, -baseOuterR - 0.014),
    new THREE.Vector3(0, 0.125, -baseOuterR - 0.016),
    new THREE.Vector3(0, collarY - 0.005, -baseOuterR - 0.010),
    new THREE.Vector3(0, collarY, -BULB_NECK_R - 0.010),
  ]);
  const armGeo = new THREE.TubeGeometry(armCurve, 28, ARM_R, 16, false);
  addMesh(armGeo, metalMat, 'support_arm');

  // Arm-to-collar knurled joint
  const jointGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.014, 24);
  addMesh(jointGeo, metalMat, 'arm_collar_joint', 0, collarY, -BULB_NECK_R - 0.011, Math.PI / 2, 0, 0);

  // Neck Collar Clamp
  const collarGeo = new THREE.CylinderGeometry(BULB_NECK_R + 0.006, BULB_NECK_R + 0.006, 0.022, 28, 1, false);
  addMesh(collarGeo, metalMat, 'neck_collar', 0, collarY, 0);

  // 3. Alcohol / Gas Burner (centered inside the U-base)
  const burnerZ = 0.004;
  const burnerPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BURNER_R - 0.004, 0),
    new THREE.Vector2(BURNER_R, 0.005),
    new THREE.Vector2(BURNER_R, BURNER_H - 0.008),
    new THREE.Vector2(BURNER_R - 0.008, BURNER_H),
    new THREE.Vector2(0.018, BURNER_H),
    new THREE.Vector2(0.018, BURNER_H + 0.004),
    new THREE.Vector2(0, BURNER_H + 0.004),
  ];
  const burnerGeo = new THREE.LatheGeometry(burnerPts, 28);
  addMesh(burnerGeo, metalMat, 'burner_body', 0, 0.002, burnerZ);

  // Burner Cap / Snuffer
  const capPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.016, 0),
    new THREE.Vector2(0.016, 0.018),
    new THREE.Vector2(0.012, 0.022),
    new THREE.Vector2(0, 0.022),
  ];
  const capGeo = new THREE.LatheGeometry(capPts, 24);
  addMesh(capGeo, metalMat, 'burner_cap', 0, BURNER_H + 0.002, burnerZ);

  // Burner Adjustment Knob (angled toward front-left)
  const knobStemGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.020, 12);
  addMesh(knobStemGeo, darkMetalMat, 'burner_knob_stem', -0.036, 0.024, burnerZ + 0.022, 0, -Math.PI / 6, Math.PI / 2);

  const knobGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.010, 24);
  addMesh(knobGeo, metalMat, 'burner_knob', -0.045, 0.024, burnerZ + 0.028, 0, -Math.PI / 6, Math.PI / 2);

  // 4. Lower Glass Bulb (Water Chamber)
  const bulbCenterY = 0.140;
  const bulbPts = [
    new THREE.Vector2(0, -BULB_R + 0.006),
    new THREE.Vector2(0.022, -BULB_R + 0.006),
    new THREE.Vector2(BULB_R * 0.75, -BULB_R * 0.72),
    new THREE.Vector2(BULB_R, -0.008),
    new THREE.Vector2(BULB_R, 0.010),
    new THREE.Vector2(BULB_R * 0.78, BULB_R * 0.72),
    new THREE.Vector2(BULB_NECK_R, BULB_R * 0.96),
    new THREE.Vector2(BULB_NECK_R, collarY - bulbCenterY + 0.015),
  ];
  const bulbGeo = new THREE.LatheGeometry(bulbPts, 32);
  addMesh(bulbGeo, glassMat, 'lower_glass_bulb', 0, bulbCenterY, 0);

  // 5. Rubber Gasket / Stopper
  const gasketY = collarY + 0.020;
  const gasketGeo = new THREE.CylinderGeometry(BULB_NECK_R + 0.001, BULB_NECK_R - 0.002, 0.018, 24);
  addMesh(gasketGeo, rubberMat, 'rubber_gasket', 0, gasketY, 0);

  // 6. Upper Glass Chamber (Brewing Chamber)
  const upperBaseY = gasketY + 0.012;
  const upperTopY = H;
  const upperH = upperTopY - upperBaseY;
  const upperPts = [
    new THREE.Vector2(0.012, 0),
    new THREE.Vector2(0.028, 0.004),
    new THREE.Vector2(UPPER_R_BOT, 0.018),
    new THREE.Vector2(UPPER_R_TOP, upperH - 0.004),
    new THREE.Vector2(UPPER_R_TOP + 0.002, upperH),
    new THREE.Vector2(UPPER_R_TOP - 0.002, upperH),
    new THREE.Vector2(UPPER_R_BOT - 0.003, 0.020),
    new THREE.Vector2(0.010, 0.006),
  ];
  const upperGeo = new THREE.LatheGeometry(upperPts, 32);
  addMesh(upperGeo, glassMat, 'upper_glass_chamber', 0, upperBaseY, 0);

  // 7. Metal Mesh Filter inside Upper Chamber
  const filterGeo = new THREE.ConeGeometry(0.032, 0.016, 24, 1, true);
  addMesh(filterGeo, darkMetalMat, 'metal_filter_cone', 0, upperBaseY + 0.014, 0, Math.PI, 0, 0);

  const filterRimGeo = new THREE.TorusGeometry(0.032, 0.0025, 10, 24);
  addMesh(filterRimGeo, metalMat, 'metal_filter_rim', 0, upperBaseY + 0.022, 0, Math.PI / 2, 0, 0);

  // 8. Siphon Tube & Coiled Spring (hanging into Lower Bulb)
  const tubeLen = 0.115;
  const tubeGeo = new THREE.CylinderGeometry(0.0055, 0.0055, tubeLen, 16);
  addMesh(tubeGeo, glassMat, 'siphon_tube', 0, gasketY - tubeLen / 2, 0);

  // Coiled spring around upper part of siphon tube
  const springPts = [];
  const springTurns = 5;
  const springSteps = 40;
  const springH = 0.038;
  for (let i = 0; i <= springSteps; i++) {
    const t = i / springSteps;
    const angle = t * springTurns * Math.PI * 2;
    const r = 0.0085;
    springPts.push(new THREE.Vector3(Math.cos(angle) * r, gasketY - 0.012 - t * springH, Math.sin(angle) * r));
  }
  const springCurve = new THREE.CatmullRomCurve3(springPts);
  const springGeo = new THREE.TubeGeometry(springCurve, 40, 0.0012, 6, false);
  addMesh(springGeo, darkMetalMat, 'siphon_spring');

  return group;
}
