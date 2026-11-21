function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.34;
  const DISP_H = 0.24;
  const DISP_D = 0.036;
  const BASE_W = 0.24;
  const BASE_D = 0.18;
  const BASE_T = 0.008;
  const STAND_W = 0.22;
  const STAND_T = 0.012;
  const STAND_H = 0.15;
  const STAND_LEAN = 0.32; // radians leaning forward (+Z)
  const DISP_TILT = -0.32; // radians tilted back

  // Materials
  const matBody = new THREE.MeshStandardMaterial({
    color: 0xe8eaed,
    roughness: 0.42,
    metalness: 0.05
  });
  const matBezel = new THREE.MeshPhysicalMaterial({
    color: 0x141619,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x1a2330,
    emissive: 0xd4e4ff,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.05
  });
  const matGrille = new THREE.MeshStandardMaterial({
    color: 0x8b9096,
    roughness: 0.55,
    metalness: 0.35
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x45494e,
    roughness: 0.4,
    metalness: 0.6
  });

  function makeRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  function addMesh(geo, mat, name, parent = group) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // 1. Base plate (y = 0 to BASE_T, centered at x=0, z=0)
  const baseShape = makeRoundedRectShape(BASE_W, BASE_D, 0.012);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_T,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2
  });
  baseGeo.rotateX(Math.PI / 2);
  const basePlate = addMesh(baseGeo, matBody, 'base_plate');
  basePlate.position.set(0, BASE_T, 0);

  // 2. Stand (rises from back of base, leaning forward)
  const standGroup = new THREE.Group();
  const standBaseZ = -BASE_D / 2 + 0.016;
  standGroup.position.set(0, BASE_T * 0.8, standBaseZ);
  standGroup.rotation.x = STAND_LEAN;
  group.add(standGroup);

  const slotW = 0.022;
  const armW = (STAND_W - slotW) / 2;

  const armGeo = new THREE.BoxGeometry(armW, STAND_H, STAND_T);
  const standLeft = addMesh(armGeo, matBody, 'stand_left', standGroup);
  standLeft.position.set(-(slotW / 2 + armW / 2), STAND_H / 2, 0);

  const standRight = addMesh(armGeo, matBody, 'stand_right', standGroup);
  standRight.position.set(slotW / 2 + armW / 2, STAND_H / 2, 0);

  // Central cable / spine inside the slot
  const cableGeo = new THREE.CylinderGeometry(0.0055, 0.0055, STAND_H * 0.92, 16);
  const cable = addMesh(cableGeo, matDarkMetal, 'stand_cable_channel', standGroup);
  cable.position.set(0, STAND_H * 0.46, 0);

  // Stand lower screws
  const standScrewGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 16);
  standScrewGeo.rotateX(Math.PI / 2);
  const screwL = addMesh(standScrewGeo, matDarkMetal, 'stand_screw_left', standGroup);
  screwL.position.set(-STAND_W * 0.34, 0.024, STAND_T / 2 + 0.0005);

  const screwR = addMesh(standScrewGeo, matDarkMetal, 'stand_screw_right', standGroup);
  screwR.position.set(STAND_W * 0.34, 0.024, STAND_T / 2 + 0.0005);

  // Top of stand in world space
  const standTopY = BASE_T * 0.8 + Math.cos(STAND_LEAN) * STAND_H;
  const standTopZ = standBaseZ + Math.sin(STAND_LEAN) * STAND_H;

  // 3. Display assembly (tilted back)
  const displayGroup = new THREE.Group();
  displayGroup.position.set(0, standTopY + 0.02, standTopZ + 0.015);
  displayGroup.rotation.x = DISP_TILT;
  group.add(displayGroup);

  // Mount bracket connecting stand to display back
  const mountGeo = new THREE.BoxGeometry(STAND_W * 0.7, 0.04, 0.025);
  const mount = addMesh(mountGeo, matBody, 'stand_mount_bracket', displayGroup);
  mount.position.set(0, -0.02, -DISP_D / 2 - 0.006);

  // Display housing
  const dispShape = makeRoundedRectShape(W, DISP_H, 0.014);
  const dispGeo = new THREE.ExtrudeGeometry(dispShape, {
    depth: DISP_D,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3
  });
  dispGeo.translate(0, 0, -DISP_D / 2);
  addMesh(dispGeo, matBody, 'display_housing', displayGroup);

  // Black glass bezel on front (+Z)
  const bezelW = W - 0.018;
  const bezelH = DISP_H - 0.042;
  const bezelShape = makeRoundedRectShape(bezelW, bezelH, 0.008);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.002,
    bevelEnabled: false
  });
  const bezel = addMesh(bezelGeo, matBezel, 'display_bezel', displayGroup);
  bezel.position.set(0, 0.012, DISP_D / 2 + 0.0005);

  // Lit screen (emit_screen) slightly in front of bezel
  const screenW = bezelW - 0.024;
  const screenH = bezelH - 0.026;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.001);
  const screen = addMesh(screenGeo, matScreen, 'emit_screen', displayGroup);
  screen.position.set(0, 0.012, DISP_D / 2 + 0.0028);

  // Speaker grille strip below bezel
  const grilleW = bezelW;
  const grilleH = 0.020;
  const grilleShape = makeRoundedRectShape(grilleW, grilleH, 0.005);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.002,
    bevelEnabled: false
  });
  const grille = addMesh(grilleGeo, matGrille, 'speaker_grille', displayGroup);
  grille.position.set(0, -DISP_H / 2 + 0.020, DISP_D / 2 + 0.0005);

  // Side screws on display housing
  const sideScrewGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 0.002, 16);
  sideScrewGeo.rotateZ(Math.PI / 2);

  const sScrewLT = addMesh(sideScrewGeo, matDarkMetal, 'side_screw_left_top', displayGroup);
  sScrewLT.position.set(-W / 2 - 0.0015, DISP_H * 0.34, 0);

  const sScrewLB = addMesh(sideScrewGeo, matDarkMetal, 'side_screw_left_bottom', displayGroup);
  sScrewLB.position.set(-W / 2 - 0.0015, -DISP_H * 0.34, 0);

  const sScrewRT = addMesh(sideScrewGeo, matDarkMetal, 'side_screw_right_top', displayGroup);
  sScrewRT.position.set(W / 2 + 0.0015, DISP_H * 0.34, 0);

  const sScrewRB = addMesh(sideScrewGeo, matDarkMetal, 'side_screw_right_bottom', displayGroup);
  sScrewRB.position.set(W / 2 + 0.0015, -DISP_H * 0.34, 0);

  return group;
}
