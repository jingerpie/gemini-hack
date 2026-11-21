function build(THREE) {
  'use strict';

  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  const LEG_H = 0.42;
  const SEAT_FRAME_H = 0.10;
  const SEAT_FRAME_Y = LEG_H - 0.02;
  const SEAT_CUSHION_H = 0.11;
  const SEAT_CUSHION_Y = SEAT_FRAME_Y + SEAT_FRAME_H * 0.5 + SEAT_CUSHION_H * 0.5 - 0.01;

  const LEG_X = 0.35;
  const LEG_Z_FRONT = 0.31;
  const LEG_Z_BACK = -0.33;

  const BACK_Z = -0.36;
  const BACK_DEPTH = 0.08;
  const BACK_W = 0.76;
  const BACK_TOP_Y = 1.44;

  const ARM_X = 0.39;
  const ARM_W = 0.12;
  const ARM_Y = 0.72;

  // Materials (reused)
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2214,
    roughness: 0.42,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6e0d19,
    roughness: 0.92,
    metalness: 0.0
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a63a,
    roughness: 0.28,
    metalness: 0.85
  });

  function registerMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Turned walnut leg geometry (y = 0 to LEG_H)
  const legPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.0),
    new THREE.Vector2(0.048, 0.025),
    new THREE.Vector2(0.030, 0.055),
    new THREE.Vector2(0.026, 0.10),
    new THREE.Vector2(0.046, 0.145),
    new THREE.Vector2(0.032, 0.19),
    new THREE.Vector2(0.052, 0.25),
    new THREE.Vector2(0.034, 0.31),
    new THREE.Vector2(0.046, 0.36),
    new THREE.Vector2(0.046, LEG_H),
    new THREE.Vector2(0.0, LEG_H)
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 20);

  const legConfigs = [
    { name: 'leg_front_left', x: -LEG_X, z: LEG_Z_FRONT },
    { name: 'leg_front_right', x: LEG_X, z: LEG_Z_FRONT },
    { name: 'leg_back_left', x: -LEG_X, z: LEG_Z_BACK },
    { name: 'leg_back_right', x: LEG_X, z: LEG_Z_BACK }
  ];
  for (let i = 0; i < legConfigs.length; i++) {
    const cfg = legConfigs[i];
    const leg = new THREE.Mesh(legGeo, walnutMat);
    leg.position.set(cfg.x, 0, cfg.z);
    registerMesh(leg, cfg.name);
  }

  // H-stretcher connecting legs at y = 0.145
  const stretcherY = 0.145;
  const sideStretcherLen = LEG_Z_FRONT - LEG_Z_BACK;
  const sideStretcherGeo = new THREE.CylinderGeometry(0.022, 0.022, sideStretcherLen, 12);
  sideStretcherGeo.rotateX(Math.PI * 0.5);

  const stretcherLeft = new THREE.Mesh(sideStretcherGeo, walnutMat);
  stretcherLeft.position.set(-LEG_X, stretcherY, (LEG_Z_FRONT + LEG_Z_BACK) * 0.5);
  registerMesh(stretcherLeft, 'stretcher_left');

  const stretcherRight = new THREE.Mesh(sideStretcherGeo, walnutMat);
  stretcherRight.position.set(LEG_X, stretcherY, (LEG_Z_FRONT + LEG_Z_BACK) * 0.5);
  registerMesh(stretcherRight, 'stretcher_right');

  const crossStretcherGeo = new THREE.CylinderGeometry(0.024, 0.024, LEG_X * 2, 12);
  crossStretcherGeo.rotateZ(Math.PI * 0.5);
  const stretcherCross = new THREE.Mesh(crossStretcherGeo, walnutMat);
  stretcherCross.position.set(0, stretcherY, 0.0);
  registerMesh(stretcherCross, 'stretcher_cross');

  // Seat wooden frame
  const seatFrameW = 0.78;
  const seatFrameD = 0.72;
  const seatFrameGeo = new THREE.BoxGeometry(seatFrameW, SEAT_FRAME_H, seatFrameD);
  const seatFrame = new THREE.Mesh(seatFrameGeo, walnutMat);
  seatFrame.position.set(0, SEAT_FRAME_Y, -0.01);
  registerMesh(seatFrame, 'seat_frame');

  // Gilded front apron molding
  const apronTrimGeo = new THREE.BoxGeometry(seatFrameW - 0.06, 0.026, 0.02);
  const apronTrim = new THREE.Mesh(apronTrimGeo, goldMat);
  apronTrim.position.set(0, SEAT_FRAME_Y, seatFrameD * 0.5 - 0.01);
  registerMesh(apronTrim, 'apron_gold_trim');

  // Seat velvet cushion
  const cushionW = 0.66;
  const cushionD = 0.64;
  const cushionShape = new THREE.Shape();
  const cw = cushionW * 0.5;
  const cd = cushionD * 0.5;
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
    depth: SEAT_CUSHION_H - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 4
  });
  seatCushionGeo.rotateX(Math.PI * 0.5);
  const seatCushion = new THREE.Mesh(seatCushionGeo, velvetMat);
  seatCushion.position.set(0, SEAT_CUSHION_Y + SEAT_CUSHION_H * 0.5 - 0.015, 0.01);
  registerMesh(seatCushion, 'seat_cushion');

  // Seat cushion piping along top edge
  const pipingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-cw + 0.02, 0, -cd + 0.02),
    new THREE.Vector3(0, 0, -cd + 0.01),
    new THREE.Vector3(cw - 0.02, 0, -cd + 0.02),
    new THREE.Vector3(cw - 0.01, 0, 0),
    new THREE.Vector3(cw - 0.02, 0, cd - 0.02),
    new THREE.Vector3(0, 0, cd - 0.01),
    new THREE.Vector3(-cw + 0.02, 0, cd - 0.02),
    new THREE.Vector3(-cw + 0.01, 0, 0)
  ], true);
  const seatPipingGeo = new THREE.TubeGeometry(pipingCurve, 32, 0.009, 8, true);
  const seatPiping = new THREE.Mesh(seatPipingGeo, goldMat);
  seatPiping.position.set(0, SEAT_CUSHION_Y + SEAT_CUSHION_H * 0.5 - 0.005, 0.01);
  registerMesh(seatPiping, 'seat_piping');

  // Seat tufting buttons
  const tuftGeo = new THREE.SphereGeometry(0.016, 12, 8);
  tuftGeo.scale(1, 0.5, 1);
  const seatTuftCoords = [
    { name: 'seat_tuft_fl', x: -0.14, z: 0.14 },
    { name: 'seat_tuft_fr', x: 0.14, z: 0.14 },
    { name: 'seat_tuft_bl', x: -0.14, z: -0.12 },
    { name: 'seat_tuft_br', x: 0.14, z: -0.12 }
  ];
  const seatTopY = SEAT_CUSHION_Y + SEAT_CUSHION_H * 0.5 + 0.002;
  for (let i = 0; i < seatTuftCoords.length; i++) {
    const tc = seatTuftCoords[i];
    const tuft = new THREE.Mesh(tuftGeo, goldMat);
    tuft.position.set(tc.x, seatTopY, tc.z);
    registerMesh(tuft, tc.name);
  }

  // Tall arched backrest wooden frame
  const backFrameShape = new THREE.Shape();
  const bhw = BACK_W * 0.5;
  const backBaseY = SEAT_FRAME_Y;
  const archSpringY = 1.18;
  backFrameShape.moveTo(-bhw, backBaseY);
  backFrameShape.lineTo(bhw, backBaseY);
  backFrameShape.lineTo(bhw, archSpringY);
  backFrameShape.absarc(0, archSpringY, bhw, 0, Math.PI, false);
  backFrameShape.lineTo(-bhw, backBaseY);

  // Override arch peak to reach BACK_TOP_Y cleanly via quadratic/bezier arch
  const archShape = new THREE.Shape();
  archShape.moveTo(-bhw, backBaseY);
  archShape.lineTo(bhw, backBaseY);
  archShape.lineTo(bhw, archSpringY);
  archShape.bezierCurveTo(bhw, 1.36, 0.18, BACK_TOP_Y, 0, BACK_TOP_Y);
  archShape.bezierCurveTo(-0.18, BACK_TOP_Y, -bhw, 1.36, -bhw, archSpringY);
  archShape.lineTo(-bhw, backBaseY);

  const backFrameGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: BACK_DEPTH,
    bevelEnabled: false
  });
  const backFrame = new THREE.Mesh(backFrameGeo, walnutMat);
  backFrame.position.set(0, 0, BACK_Z - BACK_DEPTH * 0.5);
  registerMesh(backFrame, 'backrest_frame');

  // Backrest velvet cushion
  const bcw = 0.29;
  const bcBaseY = SEAT_CUSHION_Y + 0.02;
  const bcSpringY = 1.15;
  const bcTopY = 1.36;
  const backCushionShape = new THREE.Shape();
  backCushionShape.moveTo(-bcw, bcBaseY);
  backCushionShape.lineTo(bcw, bcBaseY);
  backCushionShape.lineTo(bcw, bcSpringY);
  backCushionShape.bezierCurveTo(bcw, 1.30, 0.14, bcTopY, 0, bcTopY);
  backCushionShape.bezierCurveTo(-0.14, bcTopY, -bcw, 1.30, -bcw, bcSpringY);
  backCushionShape.lineTo(-bcw, bcBaseY);

  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelSegments: 4
  });
  const backCushion = new THREE.Mesh(backCushionGeo, velvetMat);
  backCushion.position.set(0, 0, BACK_Z + BACK_DEPTH * 0.5 - 0.01);
  registerMesh(backCushion, 'backrest_cushion');

  // Gilded arch trim around backrest cushion
  const trimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-bcw - 0.015, bcBaseY + 0.02, 0),
    new THREE.Vector3(-bcw - 0.015, bcSpringY, 0),
    new THREE.Vector3(-0.20, 1.32, 0),
    new THREE.Vector3(0, bcTopY + 0.02, 0),
    new THREE.Vector3(0.20, 1.32, 0),
    new THREE.Vector3(bcw + 0.015, bcSpringY, 0),
    new THREE.Vector3(bcw + 0.015, bcBaseY + 0.02, 0)
  ]);
  const backTrimGeo = new THREE.TubeGeometry(trimCurve, 28, 0.012, 8, false);
  const backTrim = new THREE.Mesh(backTrimGeo, goldMat);
  backTrim.position.set(0, 0, BACK_Z + BACK_DEPTH * 0.5 + 0.01);
  registerMesh(backTrim, 'backrest_gold_trim');

  // Backrest tufting buttons
  const backTuftGeo = new THREE.SphereGeometry(0.015, 12, 8);
  backTuftGeo.scale(1, 1, 0.5);
  const backTuftZ = BACK_Z + BACK_DEPTH * 0.5 + 0.058;
  const backTuftCoords = [
    { name: 'back_tuft_top_left', x: -0.12, y: 1.12 },
    { name: 'back_tuft_top_right', x: 0.12, y: 1.12 },
    { name: 'back_tuft_mid_left', x: -0.12, y: 0.90 },
    { name: 'back_tuft_mid_right', x: 0.12, y: 0.90 },
    { name: 'back_tuft_low_left', x: -0.12, y: 0.68 },
    { name: 'back_tuft_low_right', x: 0.12, y: 0.68 }
  ];
  for (let i = 0; i < backTuftCoords.length; i++) {
    const bt = backTuftCoords[i];
    const tuft = new THREE.Mesh(backTuftGeo, goldMat);
    tuft.position.set(bt.x, bt.y, backTuftZ);
    registerMesh(tuft, bt.name);
  }

  // Turned walnut side posts on backrest
  const postH = 1.00;
  const postPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.042, 0.0),
    new THREE.Vector2(0.032, 0.15),
    new THREE.Vector2(0.040, 0.35),
    new THREE.Vector2(0.030, 0.65),
    new THREE.Vector2(0.042, 0.92),
    new THREE.Vector2(0.038, postH),
    new THREE.Vector2(0.0, postH)
  ];
  const postGeo = new THREE.LatheGeometry(postPoints, 16);

  const postLeft = new THREE.Mesh(postGeo, walnutMat);
  postLeft.position.set(-bhw, SEAT_FRAME_Y, BACK_Z);
  registerMesh(postLeft, 'back_post_left');

  const postRight = new THREE.Mesh(postGeo, walnutMat);
  postRight.position.set(bhw, SEAT_FRAME_Y, BACK_Z);
  registerMesh(postRight, 'back_post_right');

  // Gilded side finials on top of back posts
  const sideFinialPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.022, 0.025),
    new THREE.Vector2(0.042, 0.06),
    new THREE.Vector2(0.028, 0.10),
    new THREE.Vector2(0.012, 0.13),
    new THREE.Vector2(0.0, 0.16)
  ];
  const sideFinialGeo = new THREE.LatheGeometry(sideFinialPoints, 16);

  const finialLeft = new THREE.Mesh(sideFinialGeo, goldMat);
  finialLeft.position.set(-bhw, SEAT_FRAME_Y + postH - 0.01, BACK_Z);
  registerMesh(finialLeft, 'finial_left');

  const finialRight = new THREE.Mesh(sideFinialGeo, goldMat);
  finialRight.position.set(bhw, SEAT_FRAME_Y + postH - 0.01, BACK_Z);
  registerMesh(finialRight, 'finial_right');

  // Central gilded crown finial reaching H = 1.60
  const crownBaseY = BACK_TOP_Y - 0.02;
  const crownH = H - crownBaseY;
  const crownPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.065, 0.0),
    new THREE.Vector2(0.035, 0.03),
    new THREE.Vector2(0.058, 0.075),
    new THREE.Vector2(0.026, 0.115),
    new THREE.Vector2(0.014, 0.15),
    new THREE.Vector2(0.0, crownH)
  ];
  const crownGeo = new THREE.LatheGeometry(crownPoints, 20);
  const crownFinial = new THREE.Mesh(crownGeo, goldMat);
  crownFinial.position.set(0, crownBaseY, BACK_Z);
  registerMesh(crownFinial, 'crown_finial');

  // Wide scrolled walnut armrests (reaching x = ±0.45)
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.34, 0.0);
  armShape.lineTo(0.28, 0.0);
  armShape.bezierCurveTo(0.35, 0.0, 0.37, 0.06, 0.33, 0.085);
  armShape.bezierCurveTo(0.29, 0.105, 0.25, 0.075, 0.23, 0.055);
  armShape.lineTo(-0.34, 0.055);
  armShape.lineTo(-0.34, 0.0);

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  armGeo.rotateY(-Math.PI * 0.5);
  armGeo.translate((ARM_W - 0.02) * 0.5, 0, 0);

  const armLeft = new THREE.Mesh(armGeo, walnutMat);
  armLeft.position.set(-ARM_X, ARM_Y - 0.04, 0);
  registerMesh(armLeft, 'armrest_left');

  const armRight = new THREE.Mesh(armGeo, walnutMat);
  armRight.position.set(ARM_X, ARM_Y - 0.04, 0);
  registerMesh(armRight, 'armrest_right');

  // Velvet arm pads on top of armrests
  const armPadGeo = new THREE.CapsuleGeometry(0.042, 0.36, 8, 14);
  armPadGeo.rotateX(Math.PI * 0.5);
  armPadGeo.scale(1.1, 0.55, 1);

  const armPadLeft = new THREE.Mesh(armPadGeo, velvetMat);
  armPadLeft.position.set(-ARM_X, ARM_Y + 0.025, -0.04);
  registerMesh(armPadLeft, 'arm_pad_left');

  const armPadRight = new THREE.Mesh(armPadGeo, velvetMat);
  armPadRight.position.set(ARM_X, ARM_Y + 0.025, -0.04);
  registerMesh(armPadRight, 'arm_pad_right');

  // Turned walnut front armrest supports
  const supportH = ARM_Y - 0.03 - SEAT_FRAME_Y;
  const supportPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.028, supportH * 0.25),
    new THREE.Vector2(0.044, supportH * 0.52),
    new THREE.Vector2(0.026, supportH * 0.80),
    new THREE.Vector2(0.038, supportH),
    new THREE.Vector2(0.0, supportH)
  ];
  const supportGeo = new THREE.LatheGeometry(supportPoints, 16);

  const supportLeft = new THREE.Mesh(supportGeo, walnutMat);
  supportLeft.position.set(-ARM_X + 0.01, SEAT_FRAME_Y, 0.25);
  registerMesh(supportLeft, 'arm_support_left');

  const supportRight = new THREE.Mesh(supportGeo, walnutMat);
  supportRight.position.set(ARM_X - 0.01, SEAT_FRAME_Y, 0.25);
  registerMesh(supportRight, 'arm_support_right');

  // Carved gilded lion-head accents on front of armrests (reaching z = +0.40)
  const lionManeGeo = new THREE.TorusGeometry(0.038, 0.014, 10, 18);
  const lionFaceGeo = new THREE.SphereGeometry(0.032, 14, 12);
  lionFaceGeo.scale(1, 1.05, 0.85);

  const lionManeLeft = new THREE.Mesh(lionManeGeo, goldMat);
  lionManeLeft.position.set(-ARM_X, ARM_Y + 0.01, 0.358);
  registerMesh(lionManeLeft, 'lion_mane_left');

  const lionFaceLeft = new THREE.Mesh(lionFaceGeo, goldMat);
  lionFaceLeft.position.set(-ARM_X, ARM_Y + 0.01, 0.372);
  registerMesh(lionFaceLeft, 'lion_head_left');

  const lionManeRight = new THREE.Mesh(lionManeGeo, goldMat);
  lionManeRight.position.set(ARM_X, ARM_Y + 0.01, 0.358);
  registerMesh(lionManeRight, 'lion_mane_right');

  const lionFaceRight = new THREE.Mesh(lionFaceGeo, goldMat);
  lionFaceRight.position.set(ARM_X, ARM_Y + 0.01, 0.372);
  registerMesh(lionFaceRight, 'lion_head_right');

  return group;
}
