function build(THREE) {
  'use strict';

  const group = new THREE.Group();

  // Target dimensions (meters): W = 0.90, H = 1.60, D = 0.80
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  const SEAT_FRAME_Y = 0.35;
  const SEAT_FRAME_H = 0.11;
  const SEAT_TOP_Y = SEAT_FRAME_Y + SEAT_FRAME_H;
  const CUSHION_H = 0.085;
  const LEG_X = 0.345;
  const FRONT_LEG_Z = 0.305;
  const BACK_LEG_Z = -0.335;
  const BACK_POST_X = 0.345;
  const BACK_POST_Z = -0.345;
  const ARM_X = 0.395;
  const ARM_W = 0.11;
  const ARM_Y = 0.74;

  // Shared materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2214,
    roughness: 0.38,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0f1b,
    roughness: 0.88,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85
  });

  function addMesh(geometry, material, name, px, py, pz, rx, ry, rz) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(px || 0, py || 0, pz || 0);
    if (rx || ry || rz) {
      mesh.rotation.set(rx || 0, ry || 0, rz || 0);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Turned Legs (4 meshes)
  const legProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.044, 0.025),
    new THREE.Vector2(0.028, 0.055),
    new THREE.Vector2(0.036, 0.10),
    new THREE.Vector2(0.048, 0.14),
    new THREE.Vector2(0.032, 0.18),
    new THREE.Vector2(0.052, 0.25),
    new THREE.Vector2(0.034, 0.31),
    new THREE.Vector2(0.046, 0.35),
    new THREE.Vector2(0.046, 0.42),
    new THREE.Vector2(0.0, 0.42)
  ];
  const legGeo = new THREE.LatheGeometry(legProfile, 20);

  addMesh(legGeo, walnutMat, 'front_left_leg', -LEG_X, 0, FRONT_LEG_Z);
  addMesh(legGeo, walnutMat, 'front_right_leg', LEG_X, 0, FRONT_LEG_Z);
  addMesh(legGeo, walnutMat, 'back_left_leg', -LEG_X, 0, BACK_LEG_Z);
  addMesh(legGeo, walnutMat, 'back_right_leg', LEG_X, 0, BACK_LEG_Z);

  // 2. Stretchers (3 meshes)
  const sideStretcherLen = FRONT_LEG_Z - BACK_LEG_Z;
  const sideStretcherZ = (FRONT_LEG_Z + BACK_LEG_Z) * 0.5;
  const sideStretcherGeo = new THREE.CylinderGeometry(0.022, 0.022, sideStretcherLen, 16);
  addMesh(sideStretcherGeo, walnutMat, 'left_stretcher', -LEG_X, 0.14, sideStretcherZ, Math.PI * 0.5, 0, 0);
  addMesh(sideStretcherGeo, walnutMat, 'right_stretcher', LEG_X, 0.14, sideStretcherZ, Math.PI * 0.5, 0, 0);

  const centerStretcherGeo = new THREE.CylinderGeometry(0.024, 0.024, LEG_X * 2, 16);
  addMesh(centerStretcherGeo, walnutMat, 'center_stretcher', 0, 0.14, sideStretcherZ, 0, 0, Math.PI * 0.5);

  // 3. Seat Frame & Front Apron Carving (2 meshes)
  const seatFrameW = 0.79;
  const seatFrameD = 0.69;
  const seatFrameZ = -0.01;
  const seatFrameGeo = new THREE.BoxGeometry(seatFrameW, SEAT_FRAME_H, seatFrameD);
  addMesh(seatFrameGeo, walnutMat, 'seat_frame', 0, SEAT_FRAME_Y + SEAT_FRAME_H * 0.5, seatFrameZ);

  const apronCarvingGeo = new THREE.SphereGeometry(0.055, 20, 14);
  apronCarvingGeo.scale(1.6, 0.72, 0.35);
  addMesh(apronCarvingGeo, goldMat, 'front_apron_carving', 0, SEAT_FRAME_Y + SEAT_FRAME_H * 0.5, seatFrameZ + seatFrameD * 0.5 + 0.005);

  // 4. Seat Cushion & Tuft Buttons (5 meshes)
  const cushionW = 0.67;
  const cushionD = 0.60;
  const cushionShape = new THREE.Shape();
  const cw = cushionW * 0.5 - 0.02;
  const cd = cushionD * 0.5 - 0.02;
  cushionShape.moveTo(-cw, -cd);
  cushionShape.lineTo(cw, -cd);
  cushionShape.lineTo(cw, cd);
  cushionShape.lineTo(-cw, cd);
  cushionShape.closePath();

  const seatCushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4
  });
  seatCushionGeo.rotateX(Math.PI * 0.5);
  addMesh(seatCushionGeo, velvetMat, 'seat_cushion', 0, SEAT_TOP_Y + CUSHION_H - 0.02, 0.015);

  const tuftGeo = new THREE.SphereGeometry(0.014, 12, 10);
  const tuftY = SEAT_TOP_Y + CUSHION_H - 0.005;
  addMesh(tuftGeo, velvetMat, 'seat_tuft_front_left', -0.14, tuftY, 0.14);
  addMesh(tuftGeo, velvetMat, 'seat_tuft_front_right', 0.14, tuftY, 0.14);
  addMesh(tuftGeo, velvetMat, 'seat_tuft_back_left', -0.14, tuftY, -0.10);
  addMesh(tuftGeo, velvetMat, 'seat_tuft_back_right', 0.14, tuftY, -0.10);

  // 5. Backrest Posts (2 meshes)
  const postProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.044, 0.0),
    new THREE.Vector2(0.044, 0.34),
    new THREE.Vector2(0.052, 0.38),
    new THREE.Vector2(0.038, 0.44),
    new THREE.Vector2(0.042, 0.72),
    new THREE.Vector2(0.050, 0.78),
    new THREE.Vector2(0.042, 0.82),
    new THREE.Vector2(0.0, 0.82)
  ];
  const postGeo = new THREE.LatheGeometry(postProfile, 20);
  const postBaseY = SEAT_FRAME_Y + 0.06;
  addMesh(postGeo, walnutMat, 'back_left_post', -BACK_POST_X, postBaseY, BACK_POST_Z);
  addMesh(postGeo, walnutMat, 'back_right_post', BACK_POST_X, postBaseY, BACK_POST_Z);

  // 6. Arched Crest Rail (1 mesh)
  const archOuterR = 0.385;
  const archInnerR = 0.285;
  const archCenterY = 1.13;
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, archOuterR, 0, Math.PI, false);
  archShape.lineTo(-archInnerR, 0);
  archShape.absarc(0, 0, archInnerR, Math.PI, 0, true);
  archShape.closePath();

  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 24
  });
  // Center extrusion around Z = BACK_POST_Z (-0.345), reaching Z = -0.40 at back
  addMesh(archGeo, walnutMat, 'arched_crest_rail', 0, archCenterY, BACK_POST_Z - 0.04);

  // 7. Gilded Finials & Crown Emblem (4 meshes)
  const sideFinialProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.038, 0.0),
    new THREE.Vector2(0.044, 0.03),
    new THREE.Vector2(0.024, 0.06),
    new THREE.Vector2(0.042, 0.11),
    new THREE.Vector2(0.022, 0.16),
    new THREE.Vector2(0.012, 0.19),
    new THREE.Vector2(0.0, 0.21)
  ];
  const sideFinialGeo = new THREE.LatheGeometry(sideFinialProfile, 20);
  const sideFinialY = postBaseY + 0.80;
  addMesh(sideFinialGeo, goldMat, 'left_finial', -BACK_POST_X, sideFinialY, BACK_POST_Z);
  addMesh(sideFinialGeo, goldMat, 'right_finial', BACK_POST_X, sideFinialY, BACK_POST_Z);

  const crownBaseY = 1.44;
  const crownH = H - crownBaseY; // 0.16 m -> reaches exact y = 1.60
  const crownProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.055, 0.0),
    new THREE.Vector2(0.062, crownH * 0.18),
    new THREE.Vector2(0.032, crownH * 0.35),
    new THREE.Vector2(0.052, crownH * 0.58),
    new THREE.Vector2(0.025, crownH * 0.80),
    new THREE.Vector2(0.015, crownH * 0.92),
    new THREE.Vector2(0.0, crownH)
  ];
  const crownGeo = new THREE.LatheGeometry(crownProfile, 24);
  addMesh(crownGeo, goldMat, 'center_crown_finial', 0, crownBaseY, BACK_POST_Z);

  const emblemGeo = new THREE.SphereGeometry(0.055, 20, 14);
  emblemGeo.scale(1.4, 0.95, 0.35);
  addMesh(emblemGeo, goldMat, 'crown_crest_emblem', 0, 1.43, BACK_POST_Z + 0.05);

  // 8. Backrest Cushion & Tuft Buttons (6 meshes)
  const backCushionW = 0.62;
  const backCushionBottomY = 0.50;
  const backCushionSpringY = 1.13;
  const backCushionShape = new THREE.Shape();
  backCushionShape.moveTo(-backCushionW * 0.5, backCushionBottomY);
  backCushionShape.lineTo(backCushionW * 0.5, backCushionBottomY);
  backCushionShape.lineTo(backCushionW * 0.5, backCushionSpringY);
  backCushionShape.absarc(0, backCushionSpringY, backCushionW * 0.5, 0, Math.PI, false);
  backCushionShape.closePath();

  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 24
  });
  addMesh(backCushionGeo, velvetMat, 'back_cushion', 0, 0, BACK_POST_Z + 0.01);

  const backTuftZ = BACK_POST_Z + 0.115;
  addMesh(tuftGeo, velvetMat, 'back_tuft_center', 0, 0.88, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_upper_left', -0.14, 1.06, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_upper_right', 0.14, 1.06, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_lower_left', -0.14, 0.70, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_lower_right', 0.14, 0.70, backTuftZ);

  // 9. Armrests, Supports, Pads & Lion-Head Accents (10 meshes)
  const armSupportProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.030, 0.08),
    new THREE.Vector2(0.042, 0.16),
    new THREE.Vector2(0.032, 0.24),
    new THREE.Vector2(0.044, 0.31),
    new THREE.Vector2(0.0, 0.31)
  ];
  const armSupportGeo = new THREE.LatheGeometry(armSupportProfile, 18);
  const armSupportX = 0.365;
  const armSupportZ = 0.24;
  addMesh(armSupportGeo, walnutMat, 'left_arm_support', -armSupportX, SEAT_TOP_Y - 0.02, armSupportZ);
  addMesh(armSupportGeo, walnutMat, 'right_arm_support', armSupportX, SEAT_TOP_Y - 0.02, armSupportZ);

  const armrestGeo = new THREE.BoxGeometry(ARM_W, 0.065, 0.70);
  addMesh(armrestGeo, walnutMat, 'left_armrest', -ARM_X, ARM_Y, 0.0);
  addMesh(armrestGeo, walnutMat, 'right_armrest', ARM_X, ARM_Y, 0.0);

  const armPadGeo = new THREE.BoxGeometry(0.082, 0.036, 0.38);
  addMesh(armPadGeo, velvetMat, 'left_arm_pad', -ARM_X, ARM_Y + 0.042, -0.05);
  addMesh(armPadGeo, velvetMat, 'right_arm_pad', ARM_X, ARM_Y + 0.042, -0.05);

  // Carved lion-head accents at the front scroll of each armrest (reaching Z = +0.40)
  const lionManeGeo = new THREE.TorusGeometry(0.038, 0.018, 12, 20);
  addMesh(lionManeGeo, walnutMat, 'left_lion_mane', -ARM_X, ARM_Y - 0.005, 0.352);
  addMesh(lionManeGeo, walnutMat, 'right_lion_mane', ARM_X, ARM_Y - 0.005, 0.352);

  const lionFaceGeo = new THREE.SphereGeometry(0.034, 16, 12);
  lionFaceGeo.scale(1.0, 1.05, 1.05);
  addMesh(lionFaceGeo, walnutMat, 'left_lion_face', -ARM_X, ARM_Y - 0.005, 0.364);
  addMesh(lionFaceGeo, walnutMat, 'right_lion_face', ARM_X, ARM_Y - 0.005, 0.364);

  return group;
}
