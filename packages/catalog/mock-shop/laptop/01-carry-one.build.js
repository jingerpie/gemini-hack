function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world 14-inch laptop scale)
  const W = 0.312;
  const D = 0.221;
  const BASE_H = 0.011;
  const FOOT_H = 0.002;
  const FOOT_R = 0.008;
  const CORNER_R = 0.010;
  const LID_H = 0.215;
  const LID_T = 0.004;
  const BEZEL_SIDE = 0.006;
  const BEZEL_TOP = 0.008;
  const BEZEL_BOT = 0.012;
  const OPEN_ANGLE = 105 * (Math.PI / 180);
  const TILT_BACK = OPEN_ANGLE - Math.PI / 2; // 15 deg back toward -Z

  // Center bounding box on Z = 0
  const LID_Z_EXTENT = LID_H * Math.sin(TILT_BACK);
  const BASE_Z_CENTER = LID_Z_EXTENT / 2;

  // Materials
  const matAluminum = new THREE.MeshStandardMaterial({
    color: 0xc8cacd,
    metalness: 0.85,
    roughness: 0.28
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0xb4b7ba,
    metalness: 0.8,
    roughness: 0.32
  });
  const matDarkPlastic = new THREE.MeshStandardMaterial({
    color: 0x222326,
    metalness: 0.2,
    roughness: 0.65
  });
  const matKeycap = new THREE.MeshStandardMaterial({
    color: 0x3a3c40,
    metalness: 0.15,
    roughness: 0.55
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.1,
    roughness: 0.15
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x1a2428,
    emissive: 0x1c2a30,
    emissiveIntensity: 0.6,
    metalness: 0.1,
    roughness: 0.15
  });

  function makeRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function addMesh(geo, mat, name, parent = group) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // 1. Rubber feet (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);
  const footX = W / 2 - 0.025;
  const footZFront = BASE_Z_CENTER + D / 2 - 0.022;
  const footZBack = BASE_Z_CENTER - D / 2 + 0.022;
  const footPositions = [
    [-footX, FOOT_H / 2, footZFront, "foot_fl"],
    [footX, FOOT_H / 2, footZFront, "foot_fr"],
    [-footX, FOOT_H / 2, footZBack, "foot_bl"],
    [footX, FOOT_H / 2, footZBack, "foot_br"]
  ];
  for (let i = 0; i < footPositions.length; i++) {
    const [fx, fy, fz, fname] = footPositions[i];
    const foot = addMesh(footGeo, matDarkPlastic, fname);
    foot.position.set(fx, fy, fz);
  }

  // 2. Base unibody
  const baseShape = makeRoundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 12
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = addMesh(baseGeo, matAluminum, "base_body");
  baseMesh.position.set(0, FOOT_H + BASE_H, BASE_Z_CENTER);

  const deckY = FOOT_H + BASE_H + 0.001;

  // 3. Thumb notch at front (+Z)
  const notchGeo = new THREE.BoxGeometry(0.056, 0.004, 0.006);
  const notch = addMesh(notchGeo, matTrackpad, "thumb_notch");
  notch.position.set(0, FOOT_H + BASE_H - 0.001, BASE_Z_CENTER + D / 2 - 0.002);

  // 4. Trackpad
  const tpW = 0.115;
  const tpD = 0.072;
  const tpGeo = new THREE.BoxGeometry(tpW, 0.001, tpD);
  const trackpad = addMesh(tpGeo, matTrackpad, "trackpad");
  trackpad.position.set(0, deckY, BASE_Z_CENTER + D / 2 - tpD / 2 - 0.012);

  // 5. Keyboard well
  const kbW = W - 0.044;
  const kbD = 0.095;
  const kbZ = BASE_Z_CENTER - D / 2 + kbD / 2 + 0.022;
  const kbWellGeo = new THREE.BoxGeometry(kbW, 0.001, kbD);
  const kbWell = addMesh(kbWellGeo, matTrackpad, "keyboard_well");
  kbWell.position.set(0, deckY - 0.0003, kbZ);

  // 6. Keyboard rows (5 rows)
  const rowCount = 5;
  const rowD = (kbD - 0.014) / rowCount;
  const rowGeo = new THREE.BoxGeometry(kbW - 0.008, 0.002, rowD * 0.78);
  for (let r = 0; r < rowCount; r++) {
    const row = addMesh(rowGeo, matKeycap, "key_row_" + (r + 1));
    const rz = kbZ - kbD / 2 + 0.007 + rowD * (r + 0.5);
    row.position.set(0, deckY + 0.0008, rz);
  }

  // 7. Hinge
  const hingeR = 0.0045;
  const hingeW = W - 0.048;
  const hingeZ = BASE_Z_CENTER - D / 2 + 0.008;
  const hingeGeo = new THREE.CylinderGeometry(hingeR, hingeR, hingeW, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  const hinge = addMesh(hingeGeo, matDarkPlastic, "hinge");
  hinge.position.set(0, deckY + 0.001, hingeZ);

  // 8. Lid & Screen pivot group
  const lidPivot = new THREE.Group();
  lidPivot.name = "lid_pivot";
  lidPivot.position.set(0, deckY + 0.001, hingeZ);
  lidPivot.rotation.x = -TILT_BACK;
  group.add(lidPivot);

  // Lid aluminum shell
  const lidShape = makeRoundedRectShape(W, LID_H, CORNER_R);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_T,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 12
  });
  const lidShell = addMesh(lidGeo, matAluminum, "lid_shell", lidPivot);
  lidShell.position.set(0, LID_H / 2, -LID_T / 2);

  // Black glass bezel
  const bezelW = W - 0.006;
  const bezelH = LID_H - 0.006;
  const bezelGeo = new THREE.BoxGeometry(bezelW, bezelH, 0.001);
  const bezel = addMesh(bezelGeo, matBezel, "screen_bezel", lidPivot);
  bezel.position.set(0, LID_H / 2, LID_T / 2 + 0.0005);

  // Lit screen (emit_screen)
  const screenW = W - BEZEL_SIDE * 2;
  const screenH = LID_H - BEZEL_TOP - BEZEL_BOT;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.0008);
  const screen = addMesh(screenGeo, matScreen, "emit_screen", lidPivot);
  screen.position.set(
    0,
    BEZEL_BOT + screenH / 2,
    LID_T / 2 + 0.0011
  );

  // Webcam dot
  const camGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 0.0006, 12);
  camGeo.rotateX(Math.PI / 2);
  const webcam = addMesh(camGeo, matDarkPlastic, "webcam", lidPivot);
  webcam.position.set(0, LID_H - BEZEL_TOP / 2 - 0.001, LID_T / 2 + 0.0012);

  return group;
}
