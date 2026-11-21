function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (13-14 inch slim laptop, meters)
  const W = 0.304;
  const D = 0.215;
  const BASE_H = 0.011;
  const FOOT_H = 0.0015;
  const FOOT_R = 0.008;
  const LID_H = 0.212;
  const LID_T = 0.004;
  const HINGE_R = 0.0055;
  const OPEN_ANGLE = (105 * Math.PI) / 180; // 105 degrees open

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xd0d3d6,
    metalness: 0.85,
    roughness: 0.25,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    metalness: 0.4,
    roughness: 0.6,
  });

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    metalness: 0.1,
    roughness: 0.55,
  });

  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0xc2c5c8,
    metalness: 0.6,
    roughness: 0.3,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.2,
    roughness: 0.2,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x9a9c97,
    emissive: 0xc8cac4,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  // 1. Rubber feet (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footOffsets = [
    [-W / 2 + 0.022, -D / 2 + 0.022],
    [W / 2 - 0.022, -D / 2 + 0.022],
    [-W / 2 + 0.022, D / 2 - 0.022],
    [W / 2 - 0.022, D / 2 - 0.022],
  ];
  footOffsets.forEach(([fx, fz], idx) => {
    const foot = new THREE.Mesh(footGeo, darkMetalMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // 2. Base chassis
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  const baseMesh = new THREE.Mesh(baseGeo, aluminumMat);
  baseMesh.name = 'base_chassis';
  baseMesh.position.set(0, FOOT_H + BASE_H / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const deckTopY = FOOT_H + BASE_H;

  // 3. Keyboard well
  const kbW = W * 0.84;
  const kbD = D * 0.42;
  const kbZ = -D * 0.14;
  const kbWellGeo = new THREE.BoxGeometry(kbW, 0.001, kbD);
  const kbWell = new THREE.Mesh(kbWellGeo, darkMetalMat);
  kbWell.name = 'keyboard_well';
  kbWell.position.set(0, deckTopY + 0.0002, kbZ);
  kbWell.castShadow = true;
  kbWell.receiveShadow = true;
  group.add(kbWell);

  // 4. Keyboard key rows (6 rows for clean silhouette)
  const rows = 6;
  const rowGap = 0.002;
  const rowD = (kbD - rowGap * (rows + 1)) / rows;
  const rowGeo = new THREE.BoxGeometry(kbW - 0.006, 0.0014, rowD);
  for (let r = 0; r < rows; r++) {
    const rowMesh = new THREE.Mesh(rowGeo, keyMat);
    rowMesh.name = `keyboard_row_${r + 1}`;
    const rz = kbZ - kbD / 2 + rowGap + rowD / 2 + r * (rowD + rowGap);
    rowMesh.position.set(0, deckTopY + 0.001, rz);
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    group.add(rowMesh);
  }

  // 5. Trackpad
  const tpW = W * 0.38;
  const tpD = D * 0.32;
  const tpZ = D * 0.27;
  const tpGeo = new THREE.BoxGeometry(tpW, 0.0008, tpD);
  const trackpad = new THREE.Mesh(tpGeo, trackpadMat);
  trackpad.name = 'trackpad';
  trackpad.position.set(0, deckTopY + 0.0003, tpZ);
  trackpad.castShadow = true;
  trackpad.receiveShadow = true;
  group.add(trackpad);

  // 6. Front thumb notch
  const notchGeo = new THREE.BoxGeometry(0.052, 0.0025, 0.006);
  const notch = new THREE.Mesh(notchGeo, darkMetalMat);
  notch.name = 'thumb_notch';
  notch.position.set(0, deckTopY - 0.0005, D / 2 - 0.002);
  notch.castShadow = true;
  notch.receiveShadow = true;
  group.add(notch);

  // 7. Hinge
  const hingeGeo = new THREE.CylinderGeometry(HINGE_R, HINGE_R, W * 0.82, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  const hinge = new THREE.Mesh(hingeGeo, darkMetalMat);
  hinge.name = 'lid_hinge';
  const hingeY = deckTopY;
  const hingeZ = -D / 2 + HINGE_R * 0.5;
  hinge.position.set(0, hingeY, hingeZ);
  hinge.castShadow = true;
  hinge.receiveShadow = true;
  group.add(hinge);

  // 8. Lid pivot group (tilted back 15 deg from vertical -> 105 deg open)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY, hingeZ);
  lidPivot.rotation.x = -(OPEN_ANGLE - Math.PI / 2); // -15 degrees
  group.add(lidPivot);

  // Lid aluminum shell
  const lidGeo = new THREE.BoxGeometry(W, LID_H, LID_T);
  const lidMesh = new THREE.Mesh(lidGeo, aluminumMat);
  lidMesh.name = 'lid_chassis';
  lidMesh.position.set(0, LID_H / 2, 0);
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  lidPivot.add(lidMesh);

  // Screen bezel
  const bezelGeo = new THREE.BoxGeometry(W - 0.004, LID_H - 0.004, 0.0012);
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
  bezelMesh.name = 'screen_bezel';
  bezelMesh.position.set(0, LID_H / 2, LID_T / 2 + 0.0002);
  bezelMesh.castShadow = true;
  bezelMesh.receiveShadow = true;
  lidPivot.add(bezelMesh);

  // Lit screen (emit_screen)
  const screenW = W - 0.014;
  const screenH = LID_H - 0.018;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.0008);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.name = 'emit_screen';
  screenMesh.position.set(0, LID_H / 2 + 0.001, LID_T / 2 + 0.0008);
  screenMesh.castShadow = true;
  screenMesh.receiveShadow = true;
  lidPivot.add(screenMesh);

  return group;
}
