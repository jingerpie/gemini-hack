function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale for a 14-inch lightweight laptop)
  const W = 0.312;
  const D = 0.221;
  const BASE_H = 0.011;
  const FOOT_H = 0.0015;
  const LID_T = 0.0045;
  const LID_H = D - 0.004;
  const CORNER_R = 0.010;
  const OPEN_ANGLE_DEG = 105;

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8cacd,
    metalness: 0.78,
    roughness: 0.28,
  });

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xb4b7bb,
    metalness: 0.35,
    roughness: 0.45,
  });

  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    metalness: 0.2,
    roughness: 0.65,
  });

  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0xc0c2c6,
    metalness: 0.7,
    roughness: 0.32,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.15,
    roughness: 0.18,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x565c55,
    emissive: 0x626860,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1f1f21,
    metalness: 0.05,
    roughness: 0.85,
  });

  // Helper: rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(radius, hw, hh);
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  function addMesh(mesh, parent = group) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Z-offset so the open laptop's overall bounding box is centered around z = 0
  const tiltRad = THREE.MathUtils.degToRad(OPEN_ANGLE_DEG - 90);
  const lidBackOverhang = Math.sin(tiltRad) * LID_H;
  const baseCenterZ = lidBackOverhang * 0.5;

  // 1. Rubber feet (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.007, 0.007, FOOT_H, 16);
  const footOffsetX = W / 2 - 0.022;
  const footOffsetZ = D / 2 - 0.022;
  const footPositions = [
    ['rubber_foot_fl', -footOffsetX, baseCenterZ + footOffsetZ],
    ['rubber_foot_fr', footOffsetX, baseCenterZ + footOffsetZ],
    ['rubber_foot_bl', -footOffsetX, baseCenterZ - footOffsetZ],
    ['rubber_foot_br', footOffsetX, baseCenterZ - footOffsetZ],
  ];
  for (const [name, fx, fz] of footPositions) {
    const foot = new THREE.Mesh(footGeo, rubberMat);
    foot.name = name;
    foot.position.set(fx, FOOT_H / 2, fz);
    addMesh(foot);
  }

  // 2. Base chassis
  const baseShape = createRoundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 12,
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, aluminumMat);
  baseMesh.name = 'base_chassis';
  baseMesh.position.set(0, FOOT_H + BASE_H - 0.001, baseCenterZ);
  addMesh(baseMesh);

  const deckY = FOOT_H + BASE_H;

  // 3. Keyboard well
  const kbW = W * 0.84;
  const kbD = D * 0.44;
  const kbZ = baseCenterZ - D * 0.14;
  const kbWellGeo = new THREE.BoxGeometry(kbW, 0.001, kbD);
  const kbWell = new THREE.Mesh(kbWellGeo, darkRecessMat);
  kbWell.name = 'keyboard_well';
  kbWell.position.set(0, deckY - 0.0002, kbZ);
  addMesh(kbWell);

  // 4. Keyboard key rows (6 rows)
  const numRows = 6;
  const rowGap = 0.0022;
  const rowD = (kbD - rowGap * (numRows + 1)) / numRows;
  const rowGeo = new THREE.BoxGeometry(kbW - 0.005, 0.0014, rowD);
  for (let i = 0; i < numRows; i++) {
    const row = new THREE.Mesh(rowGeo, keyMat);
    row.name = `keyboard_row_${i + 1}`;
    const rz = kbZ - kbD / 2 + rowGap * (i + 1) + rowD * (i + 0.5);
    row.position.set(0, deckY + 0.0004, rz);
    addMesh(row);
  }

  // 5. Trackpad
  const tpW = W * 0.36;
  const tpD = D * 0.28;
  const tpGeo = new THREE.BoxGeometry(tpW, 0.0008, tpD);
  const trackpad = new THREE.Mesh(tpGeo, trackpadMat);
  trackpad.name = 'trackpad';
  trackpad.position.set(0, deckY + 0.0001, baseCenterZ + D * 0.26);
  addMesh(trackpad);

  // 6. Front thumb notch
  const notchGeo = new THREE.BoxGeometry(0.036, 0.0025, 0.004);
  const notch = new THREE.Mesh(notchGeo, darkRecessMat);
  notch.name = 'front_thumb_notch';
  notch.position.set(0, deckY - 0.0015, baseCenterZ + D / 2 - 0.001);
  addMesh(notch);

  // 7. Left-side ports (-X)
  const portY = FOOT_H + BASE_H * 0.52;
  const portX = -W / 2 - 0.0002;
  const usbcGeo = new THREE.BoxGeometry(0.0015, 0.0026, 0.0085);

  const usbc1 = new THREE.Mesh(usbcGeo, darkRecessMat);
  usbc1.name = 'port_usbc_1';
  usbc1.position.set(portX, portY, baseCenterZ - D * 0.34);
  addMesh(usbc1);

  const usbc2 = new THREE.Mesh(usbcGeo, darkRecessMat);
  usbc2.name = 'port_usbc_2';
  usbc2.position.set(portX, portY, baseCenterZ - D * 0.26);
  addMesh(usbc2);

  const usbaGeo = new THREE.BoxGeometry(0.0015, 0.0045, 0.013);
  const usba = new THREE.Mesh(usbaGeo, darkRecessMat);
  usba.name = 'port_usba';
  usba.position.set(portX, portY, baseCenterZ - D * 0.16);
  addMesh(usba);

  const audioGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.0015, 12);
  audioGeo.rotateZ(Math.PI / 2);
  const audio = new THREE.Mesh(audioGeo, darkRecessMat);
  audio.name = 'port_audio_jack';
  audio.position.set(portX, portY, baseCenterZ - D * 0.07);
  addMesh(audio);

  // 8. Hinge
  const hingeR = 0.0045;
  const hingeGeo = new THREE.CylinderGeometry(hingeR, hingeR, W * 0.72, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  const hinge = new THREE.Mesh(hingeGeo, darkRecessMat);
  hinge.name = 'hinge';
  const hingeY = deckY - 0.001;
  const hingeZ = baseCenterZ - D / 2 + 0.005;
  hinge.position.set(0, hingeY, hingeZ);
  addMesh(hinge);

  // 9. Lid group (pivots at hinge, open at 105 degrees)
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, hingeY, hingeZ);
  lidGroup.rotation.x = -tiltRad;
  group.add(lidGroup);

  const lidShape = createRoundedRectShape(W, LID_H, CORNER_R);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_T - 0.0012,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 2,
    curveSegments: 12,
  });
  const lidMesh = new THREE.Mesh(lidGeo, aluminumMat);
  lidMesh.name = 'lid_chassis';
  lidMesh.position.set(0, LID_H / 2, -LID_T / 2);
  addMesh(lidMesh, lidGroup);

  // 10. Screen bezel
  const bezelW = W - 0.006;
  const bezelH = LID_H - 0.006;
  const bezelGeo = new THREE.BoxGeometry(bezelW, bezelH, 0.0008);
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.name = 'screen_bezel';
  bezel.position.set(0, LID_H / 2, LID_T / 2 + 0.0001);
  addMesh(bezel, lidGroup);

  // 11. Lit screen (emit_screen)
  const screenW = bezelW - 0.012;
  const screenH = bezelH - 0.022;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.0005);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = 'emit_screen';
  screen.position.set(0, LID_H / 2 + 0.002, LID_T / 2 + 0.0005);
  addMesh(screen, lidGroup);

  return group;
}
