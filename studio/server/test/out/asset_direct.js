function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  const LEG_H = 0.38;
  const LEG_X = 0.34;
  const LEG_Z = 0.28;

  const SEAT_FRAME_Y = 0.38;
  const SEAT_FRAME_H = 0.08;
  const SEAT_W = 0.74;
  const SEAT_D = 0.64;
  const SEAT_Z = 0.02;

  const CUSHION_H = 0.08;
  const CUSHION_Y = SEAT_FRAME_Y + SEAT_FRAME_H * 0.5 + CUSHION_H * 0.35;

  const BACK_Z = -0.30;
  const BACK_W = 0.76;
  const BACK_BASE_Y = 0.40;
  const BACK_TOP_Y = 1.46;

  const ARM_X = 0.39;
  const ARM_Y = 0.68;
  const ARM_W = 0.11;
  const ARM_D = 0.64;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2214,
    roughness: 0.36,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6e0d18,
    roughness: 0.88,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.85
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Turned Walnut Legs (LatheGeometry)
  const legPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.045, 0.03),
    new THREE.Vector2(0.028, 0.07),
    new THREE.Vector2(0.050, 0.14),
    new THREE.Vector2(0.032, 0.21),
    new THREE.Vector2(0.048, 0.28),
    new THREE.Vector2(0.036, 0.33),
    new THREE.Vector2(0.048, 0.38),
    new THREE.Vector2(0.00, 0.38)
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 20);

  const legPositions = [
    ['leg_front_left', -LEG_X, LEG_Z],
    ['leg_front_right', LEG_X, LEG_Z],
    ['leg_back_left', -LEG_X, -LEG_Z],
    ['leg_back_right', LEG_X, -LEG_Z]
  ];
  for (let i = 0; i < legPositions.length; i++) {
    const [name, lx, lz] = legPositions[i];
    addMesh(legGeo, walnutMat, name, lx, 0, lz);
  }

  // 2. Stretchers connecting legs
  const sideStretcherGeo = new THREE.CylinderGeometry(0.022, 0.022, LEG_Z * 2, 12);
  addMesh(sideStretcherGeo, walnutMat, 'stretcher_left', -LEG_X, 0.14, 0, Math.PI / 2);
  addMesh(sideStretcherGeo, walnutMat, 'stretcher_right', LEG_X, 0.14, 0, Math.PI / 2);

  const crossStretcherGeo = new THREE.CylinderGeometry(0.024, 0.024, LEG_X * 2, 12);
  addMesh(crossStretcherGeo, walnutMat, 'stretcher_center', 0, 0.14, 0, 0, 0, Math.PI / 2);

  // 3. Seat Frame (Walnut Apron)
  const seatFrameGeo = new THREE.BoxGeometry(SEAT_W, SEAT_FRAME_H, SEAT_D);
  addMesh(seatFrameGeo, walnutMat, 'seat_frame', 0, SEAT_FRAME_Y, SEAT_Z);

  // 4. Seat Cushion (Crimson Velvet)
  const cushionShape = new THREE.Shape();
  const cw = (SEAT_W - 0.04) / 2;
  const cd = (SEAT_D - 0.04) / 2;
  const cr = 0.04;
  cushionShape.moveTo(-cw + cr, -cd);
  cushionShape.lineTo(cw - cr, -cd);
  cushionShape.quadraticCurveTo(cw, -cd, cw, -cd + cr);
  cushionShape.lineTo(cw, cd - cr);
  cushionShape.quadraticCurveTo(cw, cd, cw - cr, cd);
  cushionShape.lineTo(-cw + cr, cd);
  cushionShape.quadraticCurveTo(-cw, cd, -cw, cd - cr);
  cushionShape.lineTo(-cw, -cd + cr);
  cushionShape.quadraticCurveTo(-cw, -cd, -cw + cr, -cd);

  const seatCushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H * 0.7,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4
  });
  seatCushionGeo.rotateX(Math.PI / 2);
  addMesh(seatCushionGeo, velvetMat, 'seat_cushion', 0, CUSHION_Y + 0.04, SEAT_Z);

  // Seat Tufting Buttons
  const tuftGeo = new THREE.SphereGeometry(0.012, 10, 8);
  const seatTuftCoords = [
    [-0.16, 0.12],
    [0.16, 0.12],
    [-0.16, -0.10],
    [0.16, -0.10]
  ];
  for (let i = 0; i < seatTuftCoords.length; i++) {
    addMesh(tuftGeo, velvetMat, 'seat_tuft_' + i, seatTuftCoords[i][0], CUSHION_Y + 0.055, SEAT_Z + seatTuftCoords[i][1]);
  }

  // 5. Tall Arched Backrest Frame (Walnut)
  const backShape = new THREE.Shape();
  const bw = BACK_W / 2;
  const bh = BACK_TOP_Y - BACK_BASE_Y;
  backShape.moveTo(-bw, 0);
  backShape.lineTo(bw, 0);
  backShape.lineTo(bw, bh - 0.30);
  backShape.quadraticCurveTo(bw, bh, 0, bh);
  backShape.quadraticCurveTo(-bw, bh, -bw, bh - 0.30);
  backShape.closePath();

  const backFrameGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  });
  addMesh(backFrameGeo, walnutMat, 'backrest_frame', 0, BACK_BASE_Y, BACK_Z - 0.03);

  // 6. Backrest Velvet Cushion
  const backPadShape = new THREE.Shape();
  const pw = bw - 0.07;
  const ph = bh - 0.08;
  backPadShape.moveTo(-pw, 0.04);
  backPadShape.lineTo(pw, 0.04);
  backPadShape.lineTo(pw, ph - 0.26);
  backPadShape.quadraticCurveTo(pw, ph, 0, ph);
  backPadShape.quadraticCurveTo(-pw, ph, -pw, ph - 0.26);
  backPadShape.closePath();

  const backPadGeo = new THREE.ExtrudeGeometry(backPadShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 4
  });
  addMesh(backPadGeo, velvetMat, 'backrest_cushion', 0, BACK_BASE_Y, BACK_Z + 0.02);

  // Backrest Tufting Buttons
  const backTuftCoords = [
    [-0.14, 0.72],
    [0.14, 0.72],
    [0.00, 0.90],
    [-0.14, 1.08],
    [0.14, 1.08]
  ];
  for (let i = 0; i < backTuftCoords.length; i++) {
    addMesh(tuftGeo, velvetMat, 'back_tuft_' + i, backTuftCoords[i][0], backTuftCoords[i][1], BACK_Z + 0.085);
  }

  // 7. Backrest Side Pillars (Walnut)
  const pillarGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.96, 16);
  addMesh(pillarGeo, walnutMat, 'back_pillar_left', -bw + 0.02, BACK_BASE_Y + 0.48, BACK_Z);
  addMesh(pillarGeo, walnutMat, 'back_pillar_right', bw - 0.02, BACK_BASE_Y + 0.48, BACK_Z);

  // 8. Gilded Finials (Crown + Side Finials)
  const sideFinialPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.025, 0.03),
    new THREE.Vector2(0.038, 0.07),
    new THREE.Vector2(0.015, 0.12),
    new THREE.Vector2(0.00, 0.16)
  ];
  const sideFinialGeo = new THREE.LatheGeometry(sideFinialPoints, 16);
  addMesh(sideFinialGeo, goldMat, 'finial_left', -bw + 0.02, BACK_BASE_Y + 0.96, BACK_Z);
  addMesh(sideFinialGeo, goldMat, 'finial_right', bw - 0.02, BACK_BASE_Y + 0.96, BACK_Z);

  // Central Crown Finial (reaches y = 1.60)
  const crownGeo = new THREE.ConeGeometry(0.06, 0.14, 16);
  addMesh(crownGeo, goldMat, 'crown_finial', 0, BACK_TOP_Y + 0.07, BACK_Z);

  // 9. Wide Scrolled Armrests
  const armGeo = new THREE.BoxGeometry(ARM_W, 0.055, ARM_D);
  addMesh(armGeo, walnutMat, 'armrest_left', -ARM_X, ARM_Y, SEAT_Z);
  addMesh(armGeo, walnutMat, 'armrest_right', ARM_X, ARM_Y, SEAT_Z);

  // Armrest Supports
  const armSupportGeo = new THREE.CylinderGeometry(0.034, 0.042, ARM_Y - SEAT_FRAME_Y, 16);
  addMesh(armSupportGeo, walnutMat, 'arm_support_left', -ARM_X, (ARM_Y + SEAT_FRAME_Y) / 2, SEAT_Z + ARM_D * 0.34);
  addMesh(armSupportGeo, walnutMat, 'arm_support_right', ARM_X, (ARM_Y + SEAT_FRAME_Y) / 2, SEAT_Z + ARM_D * 0.34);

  // 10. Carved Lion-Head Accents at front of armrests
  const lionHeadGeo = new THREE.SphereGeometry(0.052, 16, 12);
  addMesh(lionHeadGeo, goldMat, 'lion_head_left', -ARM_X, ARM_Y + 0.01, SEAT_Z + ARM_D * 0.5 + 0.02);
  addMesh(lionHeadGeo, goldMat, 'lion_head_right', ARM_X, ARM_Y + 0.01, SEAT_Z + ARM_D * 0.5 + 0.02);

  return group;
}
