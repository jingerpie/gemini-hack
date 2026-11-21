function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BODY_R_BOTTOM = 0.165;
  const BODY_R_TOP = 0.175;
  const BODY_H = 0.30;
  const ROPE_R = 0.0065;
  const LID_R = 0.188;
  const LID_RIM_H = 0.036;
  const LID_DOME_H = 0.042;
  const HANDLE_H = 0.068;
  const HANDLE_W = 0.046;

  // Materials
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xede4d5,
    roughness: 0.92,
    metalness: 0.0
  });

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xdfd4c2,
    roughness: 0.95,
    metalness: 0.0
  });

  // 1. Inner core of the basket body (ensures solid silhouette & rounded bottom)
  const bodyProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BODY_R_BOTTOM - 0.02, 0.0),
    new THREE.Vector2(BODY_R_BOTTOM - 0.005, 0.008),
    new THREE.Vector2(BODY_R_BOTTOM, 0.022),
    new THREE.Vector2(BODY_R_TOP, BODY_H),
    new THREE.Vector2(BODY_R_TOP - 0.015, BODY_H),
    new THREE.Vector2(0.0, BODY_H)
  ];
  const bodyCoreGeo = new THREE.LatheGeometry(bodyProfile, 32);
  const bodyCore = new THREE.Mesh(bodyCoreGeo, coreMat);
  bodyCore.name = 'basket_body_core';
  bodyCore.castShadow = true;
  bodyCore.receiveShadow = true;
  group.add(bodyCore);

  // 2. Coiled rope rings along the basket body
  const numBodyCoils = 22;
  for (let i = 0; i < numBodyCoils; i++) {
    const t = i / (numBodyCoils - 1);
    const y = ROPE_R + t * (BODY_H - ROPE_R * 2);
    // Slight taper from bottom to top, with extra rounding at the very bottom
    let r = BODY_R_BOTTOM + t * (BODY_R_TOP - BODY_R_BOTTOM);
    if (i === 0) r -= 0.006;
    if (i === 1) r -= 0.002;

    const coilGeo = new THREE.TorusGeometry(r, ROPE_R, 10, 32);
    coilGeo.rotateX(Math.PI / 2);
    const coil = new THREE.Mesh(coilGeo, ropeMat);
    coil.position.y = y;
    coil.name = `body_rope_coil_${i + 1}`;
    coil.castShadow = true;
    coil.receiveShadow = true;
    group.add(coil);
  }

  // 3. Lid base & dome
  const lidBaseY = BODY_H - 0.006;
  const lidProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(LID_R - 0.008, 0.0),
    new THREE.Vector2(LID_R, 0.008),
    new THREE.Vector2(LID_R, LID_RIM_H - 0.006),
    new THREE.Vector2(LID_R - 0.012, LID_RIM_H + 0.006),
    new THREE.Vector2(LID_R * 0.65, LID_RIM_H + LID_DOME_H * 0.65),
    new THREE.Vector2(LID_R * 0.3, LID_RIM_H + LID_DOME_H * 0.92),
    new THREE.Vector2(0.0, LID_RIM_H + LID_DOME_H)
  ];
  const lidGeo = new THREE.LatheGeometry(lidProfile, 32);
  const lidMesh = new THREE.Mesh(lidGeo, ropeMat);
  lidMesh.position.y = lidBaseY;
  lidMesh.name = 'basket_lid';
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  group.add(lidMesh);

  // 4. Coiled rope rings on the lid rim
  const numRimCoils = 3;
  for (let i = 0; i < numRimCoils; i++) {
    const t = i / (numRimCoils - 1);
    const y = lidBaseY + 0.007 + t * (LID_RIM_H - 0.014);
    const coilGeo = new THREE.TorusGeometry(LID_R, ROPE_R * 0.95, 10, 32);
    coilGeo.rotateX(Math.PI / 2);
    const coil = new THREE.Mesh(coilGeo, ropeMat);
    coil.position.y = y;
    coil.name = `lid_rim_coil_${i + 1}`;
    coil.castShadow = true;
    coil.receiveShadow = true;
    group.add(coil);
  }

  // 5. Coiled rope rings on the lid dome
  const domeCoils = [
    { r: LID_R * 0.78, y: lidBaseY + LID_RIM_H + LID_DOME_H * 0.35 },
    { r: LID_R * 0.52, y: lidBaseY + LID_RIM_H + LID_DOME_H * 0.72 },
    { r: LID_R * 0.25, y: lidBaseY + LID_RIM_H + LID_DOME_H * 0.94 }
  ];
  domeCoils.forEach((dc, idx) => {
    const coilGeo = new THREE.TorusGeometry(dc.r, ROPE_R * 0.85, 10, 32);
    coilGeo.rotateX(Math.PI / 2);
    const coil = new THREE.Mesh(coilGeo, ropeMat);
    coil.position.y = dc.y;
    coil.name = `lid_dome_coil_${idx + 1}`;
    coil.castShadow = true;
    coil.receiveShadow = true;
    group.add(coil);
  });

  // 6. Top loop handle (teardrop / oval rope loop)
  const handleBaseY = lidBaseY + LID_RIM_H + LID_DOME_H - 0.006;
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.008, handleBaseY, 0),
    new THREE.Vector3(-HANDLE_W * 0.52, handleBaseY + HANDLE_H * 0.45, 0),
    new THREE.Vector3(-HANDLE_W * 0.38, handleBaseY + HANDLE_H * 0.9, 0),
    new THREE.Vector3(0, handleBaseY + HANDLE_H, 0),
    new THREE.Vector3(HANDLE_W * 0.38, handleBaseY + HANDLE_H * 0.9, 0),
    new THREE.Vector3(HANDLE_W * 0.52, handleBaseY + HANDLE_H * 0.45, 0),
    new THREE.Vector3(0.008, handleBaseY, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, ROPE_R * 1.05, 10, false);
  const handleMesh = new THREE.Mesh(handleGeo, ropeMat);
  handleMesh.name = 'lid_loop_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
