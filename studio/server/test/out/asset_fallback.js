function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  const LEG_H = 0.35;
  const SEAT_FRAME_H = 0.12;
  const SEAT_FRAME_Y = LEG_H + SEAT_FRAME_H / 2 - 0.02; // 0.39
  const SEAT_CUSHION_H = 0.09;
  const SEAT_Y = LEG_H + SEAT_FRAME_H - 0.02 + SEAT_CUSHION_H / 2; // 0.495

  const BACK_Z = -0.29;
  const BACK_W = 0.72;
  const BACK_POST_X = 0.34;
  const BACK_POST_H = 1.04; // from y=0.35 to y=1.39

  const ARM_X = 0.38;
  const ARM_Y = 0.70;
  const ARM_Z_FRONT = 0.32;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.42,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0c18,
    roughness: 0.92,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.28,
    metalness: 0.85
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Turned Legs (LatheGeometry)
  const legPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.032, 0.0),
    new THREE.Vector2(0.038, 0.025),
    new THREE.Vector2(0.024, 0.055),
    new THREE.Vector2(0.042, 0.11),
    new THREE.Vector2(0.045, 0.16),
    new THREE.Vector2(0.026, 0.21),
    new THREE.Vector2(0.038, 0.27),
    new THREE.Vector2(0.034, 0.35),
    new THREE.Vector2(0.0, 0.35)
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 20);
  const legPositions = [
    ['leg_fl', -0.32, 0.28],
    ['leg_fr', 0.32, 0.28],
    ['leg_bl', -0.32, -0.28],
    ['leg_br', 0.32, -0.28]
  ];
  legPositions.forEach(([name, lx, lz]) => {
    addMesh(legGeo, walnutMat, name, lx, 0, lz);
  });

  // 2. Stretchers
  const sideStretcherGeo = new THREE.BoxGeometry(0.04, 0.04, 0.56);
  addMesh(sideStretcherGeo, walnutMat, 'stretcher_left', -0.32, 0.14, 0);
  addMesh(sideStretcherGeo, walnutMat, 'stretcher_right', 0.32, 0.14, 0);

  const centerStretcherGeo = new THREE.BoxGeometry(0.64, 0.045, 0.045);
  addMesh(centerStretcherGeo, walnutMat, 'stretcher_center', 0, 0.14, 0);

  // 3. Seat Apron / Frame
  const apronGeo = new THREE.BoxGeometry(0.74, SEAT_FRAME_H, 0.66);
  addMesh(apronGeo, walnutMat, 'seat_apron', 0, SEAT_FRAME_Y, 0.01);

  // Decorative gold trim on front apron
  const apronTrimGeo = new THREE.BoxGeometry(0.66, 0.025, 0.015);
  addMesh(apronTrimGeo, goldMat, 'seat_apron_trim', 0, SEAT_FRAME_Y, 0.345);

  // 4. Seat Cushion
  const seatCushionGeo = new THREE.BoxGeometry(0.66, SEAT_CUSHION_H, 0.60);
  addMesh(seatCushionGeo, velvetMat, 'seat_cushion', 0, SEAT_Y, 0.02);

  // Seat tufting buttons
  const tuftGeo = new THREE.SphereGeometry(0.014, 12, 10);
  const seatTufts = [
    [-0.16, 0.14], [0.16, 0.14],
    [-0.16, -0.10], [0.16, -0.10]
  ];
  seatTufts.forEach(([tx, tz], idx) => {
    addMesh(tuftGeo, goldMat, `seat_tuft_${idx + 1}`, tx, SEAT_Y + SEAT_CUSHION_H / 2 - 0.004, tz + 0.02);
  });

  // 5. Backrest Posts
  const postGeo = new THREE.CylinderGeometry(0.036, 0.042, BACK_POST_H, 16);
  addMesh(postGeo, walnutMat, 'back_post_left', -BACK_POST_X, LEG_H + BACK_POST_H / 2, BACK_Z);
  addMesh(postGeo, walnutMat, 'back_post_right', BACK_POST_X, LEG_H + BACK_POST_H / 2, BACK_Z);

  // 6. Arched Backrest Velvet Panel (ExtrudeGeometry)
  const backShape = new THREE.Shape();
  const bw = 0.31;
  const bh = 0.88;
  backShape.moveTo(-bw, 0);
  backShape.lineTo(bw, 0);
  backShape.lineTo(bw, bh - 0.18);
  backShape.absarc(0, bh - 0.18, bw, 0, Math.PI, false);
  backShape.lineTo(-bw, 0);

  const backCushionGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 3
  });
  addMesh(backCushionGeo, velvetMat, 'back_cushion', 0, 0.48, BACK_Z - 0.02);

  // Backrest Tufting Buttons
  const backTufts = [
    [-0.14, 0.72], [0.14, 0.72],
    [0.0, 0.88],
    [-0.14, 1.04], [0.14, 1.04],
    [0.0, 1.20]
  ];
  backTufts.forEach(([bx, by], idx) => {
    addMesh(tuftGeo, goldMat, `back_tuft_${idx + 1}`, bx, by, BACK_Z + 0.068);
  });

  // 7. Arched Top Wood Rail
  const archRailGeo = new THREE.TorusGeometry(0.34, 0.038, 12, 24, Math.PI);
  addMesh(archRailGeo, walnutMat, 'back_arch_rail', 0, 1.18, BACK_Z);

  // 8. Gilded Finials & Crown
  const finialBaseGeo = new THREE.CylinderGeometry(0.022, 0.032, 0.05, 14);
  const finialTipGeo = new THREE.ConeGeometry(0.024, 0.07, 14);

  // Left & Right Post Finials
  [-BACK_POST_X, BACK_POST_X].forEach((fx, i) => {
    const side = i === 0 ? 'left' : 'right';
    addMesh(finialBaseGeo, goldMat, `finial_base_${side}`, fx, 1.41, BACK_Z);
    addMesh(finialTipGeo, goldMat, `finial_tip_${side}`, fx, 1.47, BACK_Z);
  });

  // Center Crown Crest & Finial (reaches y = 1.60)
  const crownGeo = new THREE.TorusGeometry(0.065, 0.018, 10, 18, Math.PI);
  addMesh(crownGeo, goldMat, 'crown_crest', 0, 1.51, BACK_Z);
  addMesh(finialBaseGeo, goldMat, 'finial_base_center', 0, 1.525, BACK_Z);
  addMesh(finialTipGeo, goldMat, 'finial_tip_center', 0, 1.565, BACK_Z);

  // 9. Wide Scrolled Armrests
  const armSupportGeo = new THREE.CylinderGeometry(0.032, 0.04, 0.28, 14);
  addMesh(armSupportGeo, walnutMat, 'arm_support_left', -ARM_X, 0.56, 0.22);
  addMesh(armSupportGeo, walnutMat, 'arm_support_right', ARM_X, 0.56, 0.22);

  // Armrest horizontal beam + scroll
  const armBeamGeo = new THREE.BoxGeometry(0.11, 0.06, 0.58);
  addMesh(armBeamGeo, walnutMat, 'armrest_left', -ARM_X, ARM_Y, 0.02);
  addMesh(armBeamGeo, walnutMat, 'armrest_right', ARM_X, ARM_Y, 0.02);

  const armScrollGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 16);
  addMesh(armScrollGeo, walnutMat, 'arm_scroll_left', -ARM_X, ARM_Y - 0.01, ARM_Z_FRONT, 0, 0, Math.PI / 2);
  addMesh(armScrollGeo, walnutMat, 'arm_scroll_right', ARM_X, ARM_Y - 0.01, ARM_Z_FRONT, 0, 0, Math.PI / 2);

  // Velvet Arm Pads
  const armPadGeo = new THREE.BoxGeometry(0.09, 0.035, 0.42);
  addMesh(armPadGeo, velvetMat, 'arm_pad_left', -ARM_X, ARM_Y + 0.04, -0.02);
  addMesh(armPadGeo, velvetMat, 'arm_pad_right', ARM_X, ARM_Y + 0.04, -0.02);

  // 10. Carved Lion-Head Accents (Gilded)
  const lionHeadGeo = new THREE.SphereGeometry(0.042, 14, 12);
  const lionManeGeo = new THREE.TorusGeometry(0.044, 0.014, 10, 16);

  [-ARM_X, ARM_X].forEach((lx, i) => {
    const side = i === 0 ? 'left' : 'right';
    addMesh(lionHeadGeo, goldMat, `lion_head_${side}`, lx, ARM_Y - 0.01, ARM_Z_FRONT + 0.045);
    addMesh(lionManeGeo, goldMat, `lion_mane_${side}`, lx, ARM_Y - 0.01, ARM_Z_FRONT + 0.03);
  });

  return group;
}
