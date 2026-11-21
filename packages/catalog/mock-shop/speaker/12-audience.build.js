function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const H = 0.48;
  const D = 0.26;
  const FOOT_H = 0.014;
  const FOOT_R = 0.016;
  const BODY_H = H - FOOT_H;
  const CORNER_R = 0.018;

  // Materials
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.65,
    metalness: 0.1
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d1f,
    roughness: 0.45,
    metalness: 0.6
  });
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.75,
    metalness: 0.05
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x141516,
    roughness: 0.85,
    metalness: 0.05
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.4,
    metalness: 0.5
  });
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x111213,
    roughness: 0.35,
    metalness: 0.15
  });
  const metalAccentMat = new THREE.MeshStandardMaterial({
    color: 0x7c8085,
    roughness: 0.3,
    metalness: 0.8
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main cabinet body (rounded rectangle extruded vertically)
  const hw = W / 2 - CORNER_R;
  const hd = D / 2 - CORNER_R;
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-hw, -D / 2);
  bodyShape.lineTo(hw, -D / 2);
  bodyShape.quadraticCurveTo(W / 2, -D / 2, W / 2, -hd);
  bodyShape.lineTo(W / 2, hd);
  bodyShape.quadraticCurveTo(W / 2, D / 2, hw, D / 2);
  bodyShape.lineTo(-hw, D / 2);
  bodyShape.quadraticCurveTo(-W / 2, D / 2, -W / 2, hd);
  bodyShape.lineTo(-W / 2, -hd);
  bodyShape.quadraticCurveTo(-W / 2, -D / 2, -hw, -D / 2);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_H - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 8
  });
  bodyGeo.rotateX(-Math.PI / 2);
  addMesh(bodyGeo, cabinetMat, 'cabinet_body', 0, FOOT_H + 0.004, 0);

  // 2. Front grille (+Z)
  const grilleW = W - 0.026;
  const grilleH = BODY_H - 0.032;
  const grilleGeo = new THREE.BoxGeometry(grilleW, grilleH, 0.008);
  addMesh(grilleGeo, grilleMat, 'front_grille', 0, FOOT_H + BODY_H / 2, D / 2 + 0.001);

  // 3. Woofer assembly (lower half of front face)
  const wooferY = FOOT_H + BODY_H * 0.36;
  const wooferZ = D / 2 + 0.005;
  const wooferR = 0.088;

  const surroundGeo = new THREE.TorusGeometry(wooferR, 0.009, 12, 32);
  addMesh(surroundGeo, rubberMat, 'woofer_surround', 0, wooferY, wooferZ);

  const coneGeo = new THREE.CylinderGeometry(wooferR - 0.004, 0.028, 0.024, 32, 1, false);
  coneGeo.rotateX(Math.PI / 2);
  addMesh(coneGeo, coneMat, 'woofer_cone', 0, wooferY, wooferZ - 0.008);

  const dustCapGeo = new THREE.SphereGeometry(0.028, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  dustCapGeo.rotateX(Math.PI / 2);
  addMesh(dustCapGeo, rubberMat, 'woofer_dust_cap', 0, wooferY, wooferZ - 0.006);

  // 4. Top pole-mount / rigging socket (+Y)
  const mountRingGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.004, 24);
  addMesh(mountRingGeo, plateMat, 'top_pole_mount_ring', 0, H, 0);

  const mountCenterGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.005, 20);
  addMesh(mountCenterGeo, knobMat, 'top_pole_mount_center', 0, H, 0);

  // 5. Right-side amplifier & control panel (+X)
  const plateW = D * 0.66;
  const plateH = BODY_H * 0.78;
  const plateX = W / 2 + 0.002;
  const plateY = FOOT_H + BODY_H * 0.5;
  const plateGeo = new THREE.BoxGeometry(0.006, plateH, plateW);
  addMesh(plateGeo, plateMat, 'amp_plate', plateX, plateY, 0);

  // Recessed carry handle in middle of amp plate
  const handleGeo = new THREE.BoxGeometry(0.008, 0.042, plateW * 0.68);
  addMesh(handleGeo, knobMat, 'handle_recess', plateX + 0.001, plateY - 0.01, 0);

  const handleBarGeo = new THREE.CylinderGeometry(0.007, 0.007, plateW * 0.64, 12);
  handleBarGeo.rotateX(Math.PI / 2);
  addMesh(handleBarGeo, cabinetMat, 'handle_bar', plateX + 0.002, plateY - 0.01, 0);

  // XLR / Combo jacks (upper section of amp plate)
  const jackGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.006, 16);
  jackGeo.rotateZ(Math.PI / 2);
  const jackPositions = [
    [plateY + 0.105, -0.036],
    [plateY + 0.105, -0.006],
    [plateY + 0.072, -0.036],
    [plateY + 0.042, -0.036]
  ];
  jackPositions.forEach((pos, idx) => {
    addMesh(jackGeo, knobMat, `xlr_jack_${idx + 1}`, plateX + 0.003, pos[0], pos[1]);
  });

  // 3 Rotary knobs (right column of upper amp plate)
  const knobGeo = new THREE.CylinderGeometry(0.008, 0.009, 0.012, 16);
  knobGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    addMesh(
      knobGeo,
      knobMat,
      `control_knob_${i + 1}`,
      plateX + 0.006,
      plateY + 0.108 - i * 0.032,
      0.038
    );
  }

  // AC Power inlet & rocker switch (lower section of amp plate)
  const inletGeo = new THREE.BoxGeometry(0.008, 0.026, 0.034);
  addMesh(inletGeo, knobMat, 'power_inlet', plateX + 0.003, plateY - 0.125, -0.028);

  const switchGeo = new THREE.BoxGeometry(0.01, 0.022, 0.014);
  addMesh(switchGeo, metalAccentMat, 'power_switch', plateX + 0.004, plateY - 0.125, 0.026);

  // 6. Four rubber feet at bottom corners (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);
  const footOffsetX = W / 2 - 0.035;
  const footOffsetZ = D / 2 - 0.035;
  const footCoords = [
    ['foot_fl', -footOffsetX, footOffsetZ],
    ['foot_fr', footOffsetX, footOffsetZ],
    ['foot_bl', -footOffsetX, -footOffsetZ],
    ['foot_br', footOffsetX, -footOffsetZ]
  ];
  footCoords.forEach(([name, fx, fz]) => {
    addMesh(footGeo, rubberMat, name, fx, FOOT_H / 2, fz);
  });

  return group;
}
