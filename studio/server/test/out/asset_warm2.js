function build(THREE) {
  'use strict';

  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;
  const SEAT_H = 0.48;
  const APRON_Y = 0.39;
  const APRON_H = 0.10;
  const LEG_H = 0.36;
  const LEG_X = 0.31;
  const LEG_Z_FRONT = 0.25;
  const LEG_Z_BACK = -0.27;
  const BACK_Z = -0.345;
  const ARM_X = 0.385;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3a2010,
    roughness: 0.42,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0d1b,
    roughness: 0.88,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85
  });

  function addMesh(geom, mat, name, px, py, pz, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(px || 0, py || 0, pz || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Turned Legs (4)
  const legPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.036, 0.00),
    new THREE.Vector2(0.048, 0.025),
    new THREE.Vector2(0.032, 0.055),
    new THREE.Vector2(0.026, 0.085),
    new THREE.Vector2(0.045, 0.13),
    new THREE.Vector2(0.030, 0.175),
    new THREE.Vector2(0.052, 0.23),
    new THREE.Vector2(0.046, 0.28),
    new THREE.Vector2(0.034, 0.315),
    new THREE.Vector2(0.048, 0.345),
    new THREE.Vector2(0.048, LEG_H),
    new THREE.Vector2(0.00, LEG_H)
  ];
  const legGeom = new THREE.LatheGeometry(legPoints, 20);
  addMesh(legGeom, walnutMat, 'leg_front_left', -LEG_X, 0, LEG_Z_FRONT);
  addMesh(legGeom, walnutMat, 'leg_front_right', LEG_X, 0, LEG_Z_FRONT);
  addMesh(legGeom, walnutMat, 'leg_back_left', -LEG_X, 0, LEG_Z_BACK);
  addMesh(legGeom, walnutMat, 'leg_back_right', LEG_X, 0, LEG_Z_BACK);

  // 2. H-Stretcher (3)
  const sideStretcherLen = LEG_Z_FRONT - LEG_Z_BACK;
  const sideStretcherGeom = new THREE.CylinderGeometry(0.020, 0.020, sideStretcherLen, 14);
  const stretcherY = 0.13;
  const stretcherMidZ = (LEG_Z_FRONT + LEG_Z_BACK) * 0.5;
  addMesh(sideStretcherGeom, walnutMat, 'stretcher_left', -LEG_X, stretcherY, stretcherMidZ, Math.PI * 0.5, 0, 0);
  addMesh(sideStretcherGeom, walnutMat, 'stretcher_right', LEG_X, stretcherY, stretcherMidZ, Math.PI * 0.5, 0, 0);

  const crossStretcherGeom = new THREE.CylinderGeometry(0.022, 0.022, LEG_X * 2, 14);
  addMesh(crossStretcherGeom, walnutMat, 'stretcher_cross', 0, stretcherY, stretcherMidZ, 0, 0, Math.PI * 0.5);

  // 3. Seat Frame & Carved Front Apron (2)
  const seatFrameGeom = new THREE.BoxGeometry(0.72, APRON_H, 0.62);
  addMesh(seatFrameGeom, walnutMat, 'seat_frame_base', 0, APRON_Y, -0.01);

  const apronCrestGeom = new THREE.BoxGeometry(0.32, 0.065, 0.025);
  addMesh(apronCrestGeom, goldMat, 'apron_carved_front', 0, APRON_Y - 0.01, 0.305);

  // 4. Plush Velvet Seat Cushion (1)
  const seatW = 0.64;
  const seatD = 0.58;
  const seatR = 0.06;
  const seatShape = new THREE.Shape();
  seatShape.moveTo(-seatW * 0.5 + seatR, -seatD * 0.5);
  seatShape.lineTo(seatW * 0.5 - seatR, -seatD * 0.5);
  seatShape.quadraticCurveTo(seatW * 0.5, -seatD * 0.5, seatW * 0.5, -seatD * 0.5 + seatR);
  seatShape.lineTo(seatW * 0.5, seatD * 0.5 - seatR);
  seatShape.quadraticCurveTo(seatW * 0.5, seatD * 0.5, seatW * 0.5 - seatR, seatD * 0.5);
  seatShape.lineTo(-seatW * 0.5 + seatR, seatD * 0.5);
  seatShape.quadraticCurveTo(-seatW * 0.5, seatD * 0.5, -seatW * 0.5, seatD * 0.5 - seatR);
  seatShape.lineTo(-seatW * 0.5, -seatD * 0.5 + seatR);
  seatShape.quadraticCurveTo(-seatW * 0.5, -seatD * 0.5, -seatW * 0.5 + seatR, -seatD * 0.5);

  const seatCushionGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 4
  });
  seatCushionGeom.rotateX(Math.PI * 0.5);
  addMesh(seatCushionGeom, velvetMat, 'seat_cushion', 0, SEAT_H + 0.035, 0.01);

  // 5. Seat Tufting Buttons (4)
  const tuftGeom = new THREE.SphereGeometry(0.014, 12, 10);
  addMesh(tuftGeom, goldMat, 'seat_tuft_fl', -0.14, SEAT_H + 0.056, 0.13);
  addMesh(tuftGeom, goldMat, 'seat_tuft_fr', 0.14, SEAT_H + 0.056, 0.13);
  addMesh(tuftGeom, goldMat, 'seat_tuft_bl', -0.14, SEAT_H + 0.056, -0.09);
  addMesh(tuftGeom, goldMat, 'seat_tuft_br', 0.14, SEAT_H + 0.056, -0.09);

  // 6. Tall Arched Backrest Frame (1)
  const backFrameW = 0.72;
  const backFrameBot = 0.40;
  const backFrameShoulder = 1.24;
  const backFrameTop = 1.43;
  const backFrameShape = new THREE.Shape();
  backFrameShape.moveTo(-backFrameW * 0.5, backFrameBot);
  backFrameShape.lineTo(backFrameW * 0.5, backFrameBot);
  backFrameShape.lineTo(backFrameW * 0.5, backFrameShoulder);
  backFrameShape.quadraticCurveTo(backFrameW * 0.45, backFrameTop, 0, backFrameTop);
  backFrameShape.quadraticCurveTo(-backFrameW * 0.45, backFrameTop, -backFrameW * 0.5, backFrameShoulder);
  backFrameShape.closePath();

  const backFrameGeom = new THREE.ExtrudeGeometry(backFrameShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  });
  addMesh(backFrameGeom, walnutMat, 'backrest_frame', 0, 0, BACK_Z - 0.04);

  // 7. Arched Velvet Backrest Cushion (1)
  const backCushW = 0.58;
  const backCushBot = 0.48;
  const backCushShoulder = 1.18;
  const backCushTop = 1.34;
  const backCushShape = new THREE.Shape();
  backCushShape.moveTo(-backCushW * 0.5, backCushBot);
  backCushShape.lineTo(backCushW * 0.5, backCushBot);
  backCushShape.lineTo(backCushW * 0.5, backCushShoulder);
  backCushShape.quadraticCurveTo(backCushW * 0.45, backCushTop, 0, backCushTop);
  backCushShape.quadraticCurveTo(-backCushW * 0.45, backCushTop, -backCushW * 0.5, backCushShoulder);
  backCushShape.closePath();

  const backCushGeom = new THREE.ExtrudeGeometry(backCushShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4
  });
  addMesh(backCushGeom, velvetMat, 'backrest_cushion', 0, 0, BACK_Z + 0.04);

  // 8. Backrest Tufting Buttons (5)
  const backTuftZ = BACK_Z + 0.118;
  addMesh(tuftGeom, goldMat, 'back_tuft_center', 0, 0.92, backTuftZ);
  addMesh(tuftGeom, goldMat, 'back_tuft_tl', -0.13, 1.07, backTuftZ);
  addMesh(tuftGeom, goldMat, 'back_tuft_tr', 0.13, 1.07, backTuftZ);
  addMesh(tuftGeom, goldMat, 'back_tuft_bl', -0.13, 0.77, backTuftZ);
  addMesh(tuftGeom, goldMat, 'back_tuft_br', 0.13, 0.77, backTuftZ);

  // 9. Side Backrest Pillars (2)
  const pillarGeom = new THREE.CylinderGeometry(0.032, 0.036, 0.92, 16);
  addMesh(pillarGeom, walnutMat, 'back_pillar_left', -0.35, 0.86, BACK_Z + 0.01);
  addMesh(pillarGeom, walnutMat, 'back_pillar_right', 0.35, 0.86, BACK_Z + 0.01);

  // 10. Gilded Crown Crest & Finials (4)
  const crestGeom = new THREE.TorusGeometry(0.11, 0.018, 10, 20, Math.PI);
  addMesh(crestGeom, goldMat, 'crown_crest', 0, 1.38, BACK_Z + 0.015);

  const centerFinialPts = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.032, 0.025),
    new THREE.Vector2(0.048, 0.055),
    new THREE.Vector2(0.022, 0.09),
    new THREE.Vector2(0.034, 0.12),
    new THREE.Vector2(0.014, 0.155),
    new THREE.Vector2(0.00, 0.18)
  ];
  const centerFinialGeom = new THREE.LatheGeometry(centerFinialPts, 18);
  addMesh(centerFinialGeom, goldMat, 'finial_center', 0, H - 0.18, BACK_Z + 0.01);

  const sideFinialPts = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.034, 0.00),
    new THREE.Vector2(0.024, 0.02),
    new THREE.Vector2(0.038, 0.05),
    new THREE.Vector2(0.016, 0.085),
    new THREE.Vector2(0.024, 0.11),
    new THREE.Vector2(0.00, 0.15)
  ];
  const sideFinialGeom = new THREE.LatheGeometry(sideFinialPts, 16);
  addMesh(sideFinialGeom, goldMat, 'finial_left', -0.35, 1.31, BACK_Z + 0.01);
  addMesh(sideFinialGeom, goldMat, 'finial_right', 0.35, 1.31, BACK_Z + 0.01);

  // 11. Armrest Supports (2)
  const armSupportPts = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.038, 0.00),
    new THREE.Vector2(0.028, 0.05),
    new THREE.Vector2(0.042, 0.12),
    new THREE.Vector2(0.028, 0.19),
    new THREE.Vector2(0.036, 0.25),
    new THREE.Vector2(0.00, 0.25)
  ];
  const armSupportGeom = new THREE.LatheGeometry(armSupportPts, 16);
  addMesh(armSupportGeom, walnutMat, 'arm_support_left', -0.35, 0.43, 0.22);
  addMesh(armSupportGeom, walnutMat, 'arm_support_right', 0.35, 0.43, 0.22);

  // 12. Wide Scrolled Armrests (2)
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.30, 0.66);
  armShape.lineTo(0.28, 0.66);
  armShape.quadraticCurveTo(0.36, 0.66, 0.36, 0.72);
  armShape.quadraticCurveTo(0.36, 0.77, 0.27, 0.77);
  armShape.lineTo(-0.30, 0.75);
  armShape.closePath();

  const armGeom = new THREE.ExtrudeGeometry(armShape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  // Rotate so shape X -> +Z, shape Y -> +Y, extrude Z -> -X
  armGeom.rotateY(-Math.PI * 0.5);
  addMesh(armGeom, walnutMat, 'armrest_left', -(ARM_X - 0.055), 0, 0);
  addMesh(armGeom, walnutMat, 'armrest_right', ARM_X + 0.055, 0, 0);

  // 13. Velvet Armrest Pads (2)
  const armPadGeom = new THREE.BoxGeometry(0.095, 0.036, 0.40);
  addMesh(armPadGeom, velvetMat, 'arm_pad_left', -ARM_X, 0.765, -0.02);
  addMesh(armPadGeom, velvetMat, 'arm_pad_right', ARM_X, 0.765, -0.02);

  // 14. Carved Lion-Head Accents at Armrest Front Scrolls (4)
  const maneGeom = new THREE.TorusGeometry(0.038, 0.014, 10, 18);
  addMesh(maneGeom, goldMat, 'lion_mane_left', -ARM_X, 0.72, 0.355);
  addMesh(maneGeom, goldMat, 'lion_mane_right', ARM_X, 0.72, 0.355);

  const lionHeadGeom = new THREE.SphereGeometry(0.034, 14, 12);
  addMesh(lionHeadGeom, goldMat, 'lion_head_left', -ARM_X, 0.72, 0.366);
  addMesh(lionHeadGeom, goldMat, 'lion_head_right', ARM_X, 0.72, 0.366);

  return group;
}
