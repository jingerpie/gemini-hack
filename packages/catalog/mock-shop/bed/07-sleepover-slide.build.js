function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.00;           // Total length (X)
  const D = 0.98;           // Main bed depth (Z)
  const H = 0.65;           // Headboard/footboard height (Y)
  const T = 0.026;          // Plywood thickness
  const LEG_H = 0.09;       // Bottom cutout height
  const LEG_W = 0.09;       // Leg width at bottom

  const RAIL_H = 0.14;      // Main side rail height
  const RAIL_Y = 0.29;      // Center Y of main side rails
  const SLAT_W = 0.065;     // Slat width
  const SLAT_H = 0.018;     // Slat thickness
  const SLAT_COUNT = 10;    // Number of slats per bed

  const TRUNDLE_W = W - 2 * T - 0.02;
  const TRUNDLE_D = D - 0.06;
  const TRUNDLE_FRONT_H = 0.16;
  const WHEEL_R = 0.022;
  const TRUNDLE_BASE_Y = WHEEL_R * 2; // Bottom of trundle frame
  const TRUNDLE_PULL_OUT = 0.55;      // Half-pulled-out offset (+Z)

  // Materials
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xf2eab6,
    roughness: 0.65,
    metalness: 0.02,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcc39a,
    roughness: 0.72,
    metalness: 0.0,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.8,
    metalness: 0.1,
  });

  const mainGroup = new THREE.Group();
  mainGroup.name = "main_bed";
  mainGroup.position.z = -TRUNDLE_PULL_OUT / 2;
  group.add(mainGroup);

  // Helper to create headboard/footboard shape (in Z-Y plane, extruded along X)
  const endShape = new THREE.Shape();
  const halfD = D / 2;
  const topCurveStart = H - 0.14;

  endShape.moveTo(-halfD, 0);
  endShape.lineTo(-halfD + LEG_W, 0);
  endShape.lineTo(-halfD + LEG_W, LEG_H - 0.02);
  endShape.quadraticCurveTo(-halfD + LEG_W, LEG_H, -halfD + LEG_W + 0.03, LEG_H);
  endShape.lineTo(halfD - LEG_W - 0.03, LEG_H);
  endShape.quadraticCurveTo(halfD - LEG_W, LEG_H, halfD - LEG_W, LEG_H - 0.02);
  endShape.lineTo(halfD - LEG_W, 0);
  endShape.lineTo(halfD, 0);
  endShape.lineTo(halfD, topCurveStart);
  endShape.quadraticCurveTo(halfD, H, 0, H);
  endShape.quadraticCurveTo(-halfD, H, -halfD, topCurveStart);
  endShape.closePath();

  const endGeo = new THREE.ExtrudeGeometry(endShape, {
    depth: T,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 24,
  });
  // Rotate so extrusion is along X, shape is in Z-Y
  endGeo.rotateY(Math.PI / 2);

  // Left headboard (-X)
  const headboard = new THREE.Mesh(endGeo, yellowMat);
  headboard.position.set(-W / 2, 0, 0);
  headboard.name = "headboard_left";
  headboard.castShadow = true;
  headboard.receiveShadow = true;
  mainGroup.add(headboard);

  // Right footboard (+X)
  const footboard = new THREE.Mesh(endGeo, yellowMat);
  footboard.position.set(W / 2 - T, 0, 0);
  footboard.name = "footboard_right";
  footboard.castShadow = true;
  footboard.receiveShadow = true;
  mainGroup.add(footboard);

  // Main bed side rails
  const railLen = W - 2 * T;
  const railGeo = new THREE.BoxGeometry(railLen, RAIL_H, T);

  const frontRail = new THREE.Mesh(railGeo, yellowMat);
  frontRail.position.set(0, RAIL_Y, D / 2 - T / 2 - 0.01);
  frontRail.name = "main_rail_front";
  frontRail.castShadow = true;
  frontRail.receiveShadow = true;
  mainGroup.add(frontRail);

  const backRail = new THREE.Mesh(railGeo, yellowMat);
  backRail.position.set(0, RAIL_Y, -D / 2 + T / 2 + 0.01);
  backRail.name = "main_rail_back";
  backRail.castShadow = true;
  backRail.receiveShadow = true;
  mainGroup.add(backRail);

  // Main bed slats
  const mainSlatLen = D - 2 * T - 0.02;
  const mainSlatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, mainSlatLen);
  const slatSpan = railLen - 0.14;
  const slatStep = slatSpan / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const slat = new THREE.Mesh(mainSlatGeo, woodMat);
    const sx = -slatSpan / 2 + i * slatStep;
    slat.position.set(sx, RAIL_Y - RAIL_H / 2 + SLAT_H / 2 + 0.02, 0);
    slat.name = `main_slat_${i + 1}`;
    slat.castShadow = true;
    slat.receiveShadow = true;
    mainGroup.add(slat);
  }

  // Trundle bed (pulled half out toward +Z)
  const trundleGroup = new THREE.Group();
  trundleGroup.name = "trundle_bed";
  trundleGroup.position.z = TRUNDLE_PULL_OUT / 2;
  group.add(trundleGroup);

  // Trundle front panel with shallow center finger-pull cutout
  const tfShape = new THREE.Shape();
  const halfTW = TRUNDLE_W / 2;
  const cutoutHalf = 0.22;
  const cutoutDepth = 0.022;

  tfShape.moveTo(-halfTW, 0);
  tfShape.lineTo(halfTW, 0);
  tfShape.lineTo(halfTW, TRUNDLE_FRONT_H);
  tfShape.lineTo(cutoutHalf + 0.03, TRUNDLE_FRONT_H);
  tfShape.lineTo(cutoutHalf, TRUNDLE_FRONT_H - cutoutDepth);
  tfShape.lineTo(-cutoutHalf, TRUNDLE_FRONT_H - cutoutDepth);
  tfShape.lineTo(-cutoutHalf - 0.03, TRUNDLE_FRONT_H);
  tfShape.lineTo(-halfTW, TRUNDLE_FRONT_H);
  tfShape.closePath();

  const tfGeo = new THREE.ExtrudeGeometry(tfShape, {
    depth: T,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });

  const trundleFront = new THREE.Mesh(tfGeo, yellowMat);
  trundleFront.position.set(0, TRUNDLE_BASE_Y, D / 2 - T - 0.015);
  trundleFront.name = "trundle_front_panel";
  trundleFront.castShadow = true;
  trundleFront.receiveShadow = true;
  trundleGroup.add(trundleFront);

  // Trundle side and back rails (wood)
  const trundleSideLen = TRUNDLE_D - T;
  const trundleSideGeo = new THREE.BoxGeometry(T, 0.09, trundleSideLen);
  const trundleBackGeo = new THREE.BoxGeometry(TRUNDLE_W - 2 * T, 0.09, T);

  const trundleLeft = new THREE.Mesh(trundleSideGeo, woodMat);
  trundleLeft.position.set(-TRUNDLE_W / 2 + T / 2, TRUNDLE_BASE_Y + 0.045, D / 2 - T - 0.015 - trundleSideLen / 2);
  trundleLeft.name = "trundle_rail_left";
  trundleLeft.castShadow = true;
  trundleLeft.receiveShadow = true;
  trundleGroup.add(trundleLeft);

  const trundleRight = new THREE.Mesh(trundleSideGeo, woodMat);
  trundleRight.position.set(TRUNDLE_W / 2 - T / 2, TRUNDLE_BASE_Y + 0.045, D / 2 - T - 0.015 - trundleSideLen / 2);
  trundleRight.name = "trundle_rail_right";
  trundleRight.castShadow = true;
  trundleRight.receiveShadow = true;
  trundleGroup.add(trundleRight);

  const trundleBack = new THREE.Mesh(trundleBackGeo, woodMat);
  trundleBack.position.set(0, TRUNDLE_BASE_Y + 0.045, D / 2 - T - 0.015 - trundleSideLen + T / 2);
  trundleBack.name = "trundle_rail_back";
  trundleBack.castShadow = true;
  trundleBack.receiveShadow = true;
  trundleGroup.add(trundleBack);

  // Trundle slats
  const trundleSlatLen = trundleSideLen - T;
  const trundleSlatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, trundleSlatLen);
  const tSlatSpan = TRUNDLE_W - 2 * T - 0.12;
  const tSlatStep = tSlatSpan / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const slat = new THREE.Mesh(trundleSlatGeo, woodMat);
    const sx = -tSlatSpan / 2 + i * tSlatStep;
    slat.position.set(sx, TRUNDLE_BASE_Y + 0.03, D / 2 - T - 0.015 - trundleSideLen / 2);
    slat.name = `trundle_slat_${i + 1}`;
    slat.castShadow = true;
    slat.receiveShadow = true;
    trundleGroup.add(slat);
  }

  // Trundle caster wheels (4 corners)
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.018, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [-TRUNDLE_W / 2 + 0.05, WHEEL_R, D / 2 - 0.06],
    [TRUNDLE_W / 2 - 0.05, WHEEL_R, D / 2 - 0.06],
    [-TRUNDLE_W / 2 + 0.05, WHEEL_R, D / 2 - TRUNDLE_D + 0.04],
    [TRUNDLE_W / 2 - 0.05, WHEEL_R, D / 2 - TRUNDLE_D + 0.04],
  ];

  wheelPositions.forEach((pos, idx) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.name = `trundle_caster_${idx + 1}`;
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    trundleGroup.add(wheel);
  });

  return group;
}
