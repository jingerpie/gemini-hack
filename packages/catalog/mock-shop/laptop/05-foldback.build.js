function build(THREE) {
  const W = 0.31;
  const D = 0.215;
  const BASE_H = 0.012;
  const LID_T = 0.006;
  const LID_H = 0.21;
  const HINGE_R = 0.0055;
  const OPEN_RAD = (105 * Math.PI) / 180;
  const TILT_BACK = OPEN_RAD - Math.PI / 2;

  const group = new THREE.Group();

  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x5a5f66,
    roughness: 0.35,
    metalness: 0.75
  });
  const matKeyWell = new THREE.MeshStandardMaterial({
    color: 0x3a3e44,
    roughness: 0.55,
    metalness: 0.25
  });
  const matKeys = new THREE.MeshStandardMaterial({
    color: 0xe6e7e8,
    roughness: 0.6,
    metalness: 0.05
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0x4d5259,
    roughness: 0.25,
    metalness: 0.5
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x111316,
    roughness: 0.15,
    metalness: 0.1
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x6b8299,
    emissive: 0x5c768d,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1
  });
  const matHinge = new THREE.MeshStandardMaterial({
    color: 0x8a9099,
    roughness: 0.25,
    metalness: 0.85
  });
  const matStylus = new THREE.MeshStandardMaterial({
    color: 0x70757d,
    roughness: 0.3,
    metalness: 0.7
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0, parent = group) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Offset Z slightly so the open laptop's bounding box is centered on z = 0
  const backOverhang = Math.sin(TILT_BACK) * LID_H;
  const zCenterOffset = backOverhang * 0.5;

  // Base chassis
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  addMesh(baseGeo, matChassis, 'laptop_base', 0, BASE_H / 2, zCenterOffset);

  // Keyboard recess
  const kbW = W * 0.86;
  const kbD = D * 0.42;
  const kbZ = zCenterOffset - D * 0.16;
  addMesh(
    new THREE.BoxGeometry(kbW, 0.0015, kbD),
    matKeyWell,
    'keyboard_recess',
    0,
    BASE_H + 0.0002,
    kbZ
  );

  // Keyboard keybed block (clean representational rows)
  const keyRows = 5;
  const rowD = (kbD - 0.01) / keyRows;
  for (let r = 0; r < keyRows; r++) {
    const rowZ = kbZ - kbD / 2 + 0.005 + rowD * (r + 0.5);
    addMesh(
      new THREE.BoxGeometry(kbW - 0.008, 0.0022, rowD * 0.78),
      matKeys,
      `keyboard_row_${r + 1}`,
      0,
      BASE_H + 0.0012,
      rowZ
    );
  }

  // Trackpad
  const tpW = W * 0.32;
  const tpD = D * 0.28;
  addMesh(
    new THREE.BoxGeometry(tpW, 0.001, tpD),
    matTrackpad,
    'trackpad',
    0,
    BASE_H + 0.0003,
    zCenterOffset + D * 0.25
  );

  // Hinges at back edge of base
  const hingeZ = zCenterOffset - D / 2 + HINGE_R;
  const hingeY = BASE_H;
  const hingeGeo = new THREE.CylinderGeometry(HINGE_R, HINGE_R, 0.028, 16);
  addMesh(hingeGeo, matHinge, 'hinge_left', -W * 0.32, hingeY, hingeZ, 0, 0, Math.PI / 2);
  addMesh(hingeGeo, matHinge, 'hinge_right', W * 0.32, hingeY, hingeZ, 0, 0, Math.PI / 2);

  // Lid pivot group
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY, hingeZ);
  lidPivot.rotation.x = -TILT_BACK;
  group.add(lidPivot);

  // Lid aluminum backplate
  addMesh(
    new THREE.BoxGeometry(W, LID_H, LID_T),
    matChassis,
    'lid_backplate',
    0,
    LID_H / 2,
    -LID_T / 2,
    0, 0, 0,
    lidPivot
  );

  // Screen bezel
  addMesh(
    new THREE.BoxGeometry(W - 0.004, LID_H - 0.004, 0.0015),
    matBezel,
    'screen_bezel',
    0,
    LID_H / 2,
    0.0005,
    0, 0, 0,
    lidPivot
  );

  // Lit screen (emit_screen)
  const scrW = W - 0.018;
  const scrH = LID_H - 0.026;
  addMesh(
    new THREE.BoxGeometry(scrW, scrH, 0.001),
    matScreen,
    'emit_screen',
    0,
    LID_H / 2 + 0.004,
    0.0012,
    0, 0, 0,
    lidPivot
  );

  // Stylus attached to the left edge of the lid
  const stylusLen = 0.145;
  const stylusR = 0.0045;
  addMesh(
    new THREE.CapsuleGeometry(stylusR, stylusLen - stylusR * 2, 8, 16),
    matStylus,
    'stylus_pen',
    -W / 2 - stylusR - 0.001,
    LID_H * 0.48,
    0,
    0, 0, 0,
    lidPivot
  );

  return group;
}
