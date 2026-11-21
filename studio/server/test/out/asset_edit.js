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

  // Shared materials: black lacquered wood, deep purple velvet, dark gothic pewter
  const lacquerMat = new THREE.MeshPhysicalMaterial({
    color: 0x121215,
    roughness: 0.18,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x3b0d47,
    roughness: 0.90,
    metalness: 0.02
  });

  const pewterMat = new THREE.MeshStandardMaterial({
    color: 0x7c808a,
    roughness: 0.32,
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

  // 1. Octagonal Gothic Legs (4 meshes)
  const legProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.040, 0.0),
    new THREE.Vector2(0.044, 0.025),
    new THREE.Vector2(0.028, 0.055),
    new THREE.Vector2(0.036, 0.10),
    new THREE.Vector2(0.048, 0.14),
    new THREE.Vector2(0.032, 0.18),
    new THREE.Vector2(0.050, 0.25),
    new THREE.Vector2(0.034, 0.31),
    new THREE.Vector2(0.046, 0.35),
    new THREE.Vector2(0.046, 0.42),
    new THREE.Vector2(0.0, 0.42)
  ];
  const legGeo = new THREE.LatheGeometry(legProfile, 8);

  addMesh(legGeo, lacquerMat, 'front_left_leg', -LEG_X, 0, FRONT_LEG_Z);
  addMesh(legGeo, lacquerMat, 'front_right_leg', LEG_X, 0, FRONT_LEG_Z);
  addMesh(legGeo, lacquerMat, 'back_left_leg', -LEG_X, 0, BACK_LEG_Z);
  addMesh(legGeo, lacquerMat, 'back_right_leg', LEG_X, 0, BACK_LEG_Z);

  // 2. Faceted Stretchers (3 meshes)
  const sideStretcherLen = FRONT_LEG_Z - BACK_LEG_Z;
  const sideStretcherZ = (FRONT_LEG_Z + BACK_LEG_Z) * 0.5;
  const sideStretcherGeo = new THREE.CylinderGeometry(0.022, 0.022, sideStretcherLen, 6);
  addMesh(sideStretcherGeo, lacquerMat, 'left_stretcher', -LEG_X, 0.14, sideStretcherZ, Math.PI * 0.5, 0, 0);
  addMesh(sideStretcherGeo, lacquerMat, 'right_stretcher', LEG_X, 0.14, sideStretcherZ, Math.PI * 0.5, 0, 0);

  const centerStretcherGeo = new THREE.CylinderGeometry(0.024, 0.024, LEG_X * 2, 6);
  addMesh(centerStretcherGeo, lacquerMat, 'center_stretcher', 0, 0.14, sideStretcherZ, 0, 0, Math.PI * 0.5);

  // 3. Seat Frame & Gothic Apron Emblem (2 meshes)
  const seatFrameW = 0.79;
  const seatFrameD = 0.69;
  const seatFrameZ = -0.01;
  const seatFrameGeo = new THREE.BoxGeometry(seatFrameW, SEAT_FRAME_H, seatFrameD);
  addMesh(seatFrameGeo, lacquerMat, 'seat_frame', 0, SEAT_FRAME_Y + SEAT_FRAME_H * 0.5, seatFrameZ);

  const apronShape = new THREE.Shape();
  apronShape.moveTo(0, 0.042);
  apronShape.lineTo(0.075, 0);
  apronShape.lineTo(0, -0.042);
  apronShape.lineTo(-0.075, 0);
  apronShape.closePath();
  const apronCarvingGeo = new THREE.ExtrudeGeometry(apronShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2
  });
  addMesh(apronCarvingGeo, pewterMat, 'front_apron_carving', 0, SEAT_FRAME_Y + SEAT_FRAME_H * 0.5, seatFrameZ + seatFrameD * 0.5);

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

  // 5. Octagonal Backrest Posts (2 meshes)
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
  const postGeo = new THREE.LatheGeometry(postProfile, 8);
  const postBaseY = SEAT_FRAME_Y + 0.06;
  addMesh(postGeo, lacquerMat, 'back_left_post', -BACK_POST_X, postBaseY, BACK_POST_Z);
  addMesh(postGeo, lacquerMat, 'back_right_post', BACK_POST_X, postBaseY, BACK_POST_Z);

  // 6. Gothic Pointed Arch Crest Rail (1 mesh)
  const archOuterW = 0.385;
  const archInnerW = 0.285;
  const archOuterApexY = 0.37;
  const archInnerApexY = 0.28;
  const archCenterY = 1.13;
  const archShape = new THREE.Shape();
  archShape.moveTo(archOuterW, 0);
  archShape.quadraticCurveTo(archOuterW * 0.88, archOuterApexY * 0.68, 0, archOuterApexY);
  archShape.quadraticCurveTo(-archOuterW * 0.88, archOuterApexY * 0.68, -archOuterW, 0);
  archShape.lineTo(-archInnerW, 0);
  archShape.quadraticCurveTo(-archInnerW * 0.85, archInnerApexY * 0.65, 0, archInnerApexY);
  archShape.quadraticCurveTo(archInnerW * 0.85, archInnerApexY * 0.65, archInnerW, 0);
  archShape.closePath();

  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 18
  });
  addMesh(archGeo, lacquerMat, 'pointed_crest_rail', 0, archCenterY, BACK_POST_Z - 0.04);

  // 7. Pointed Spire Finials & Gothic Crest Emblem (4 meshes)
  const sideSpireH = 0.24;
  const sideSpireGeo = new THREE.ConeGeometry(0.044, sideSpireH, 4);
  const sideFinialY = postBaseY + 0.80 + sideSpireH * 0.5;
  addMesh(sideSpireGeo, lacquerMat, 'left_spire_finial', -BACK_POST_X, sideFinialY, BACK_POST_Z, 0, Math.PI * 0.25, 0);
  addMesh(sideSpireGeo, lacquerMat, 'right_spire_finial', BACK_POST_X, sideFinialY, BACK_POST_Z, 0, Math.PI * 0.25, 0);

  const crownBaseY = 1.42;
  const crownH = H - crownBaseY; // 0.18 m -> reaches exact y = 1.60
  const crownSpireGeo = new THREE.ConeGeometry(0.056, crownH, 4);
  addMesh(crownSpireGeo, pewterMat, 'center_spire_finial', 0, crownBaseY + crownH * 0.5, BACK_POST_Z, 0, Math.PI * 0.25, 0);

  const emblemShape = new THREE.Shape();
  emblemShape.moveTo(0, 0.062);
  emblemShape.lineTo(0.046, 0);
  emblemShape.lineTo(0, -0.062);
  emblemShape.lineTo(-0.046, 0);
  emblemShape.closePath();
  const emblemGeo = new THREE.ExtrudeGeometry(emblemShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 2
  });
  addMesh(emblemGeo, pewterMat, 'crest_emblem', 0, 1.41, BACK_POST_Z + 0.04);

  // 8. Pointed Backrest Cushion & Tuft Buttons (6 meshes)
  const backCushionW = 0.62;
  const backCushionBottomY = 0.50;
  const backCushionSpringY = 1.13;
  const backCushionApexY = backCushionSpringY + 0.28;
  const backCushionShape = new THREE.Shape();
  backCushionShape.moveTo(-backCushionW * 0.5, backCushionBottomY);
  backCushionShape.lineTo(backCushionW * 0.5, backCushionBottomY);
  backCushionShape.lineTo(backCushionW * 0.5, backCushionSpringY);
  backCushionShape.quadraticCurveTo(backCushionW * 0.42, backCushionSpringY + 0.18, 0, backCushionApexY);
  backCushionShape.quadraticCurveTo(-backCushionW * 0.42, backCushionSpringY + 0.18, -backCushionW * 0.5, backCushionSpringY);
  backCushionShape.closePath();

  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 18
  });
  addMesh(backCushionGeo, velvetMat, 'back_cushion', 0, 0, BACK_POST_Z + 0.01);

  const backTuftZ = BACK_POST_Z + 0.115;
  addMesh(tuftGeo, velvetMat, 'back_tuft_center', 0, 0.88, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_upper_left', -0.14, 1.06, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_upper_right', 0.14, 1.06, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_lower_left', -0.14, 0.70, backTuftZ);
  addMesh(tuftGeo, velvetMat, 'back_tuft_lower_right', 0.14, 0.70, backTuftZ);

  // 9. Sharper Angular Armrests, Faceted Supports, Pads & Pointed Front Spurs (10 meshes)
  const armSupportH = 0.31;
  const armSupportGeo = new THREE.CylinderGeometry(0.036, 0.044, armSupportH, 4);
  const armSupportX = 0.365;
  const armSupportZ = 0.24;
  const armSupportY = SEAT_TOP_Y - 0.02 + armSupportH * 0.5;
  addMesh(armSupportGeo, lacquerMat, 'left_arm_support', -armSupportX, armSupportY, armSupportZ, 0, Math.PI * 0.25, 0);
  addMesh(armSupportGeo, lacquerMat, 'right_arm_support', armSupportX, armSupportY, armSupportZ, 0, Math.PI * 0.25, 0);

  const armrestGeo = new THREE.BoxGeometry(ARM_W, 0.065, 0.70);
  addMesh(armrestGeo, lacquerMat, 'left_armrest', -ARM_X, ARM_Y, 0.0);
  addMesh(armrestGeo, lacquerMat, 'right_armrest', ARM_X, ARM_Y, 0.0);

  const armPadGeo = new THREE.BoxGeometry(0.082, 0.036, 0.38);
  addMesh(armPadGeo, velvetMat, 'left_arm_pad', -ARM_X, ARM_Y + 0.042, -0.05);
  addMesh(armPadGeo, velvetMat, 'right_arm_pad', ARM_X, ARM_Y + 0.042, -0.05);

  // Sharp angular gothic prow extending to Z = +0.40 at the front of each armrest
  const armTipGeo = new THREE.ConeGeometry(0.055, 0.065, 4);
  addMesh(armTipGeo, lacquerMat, 'left_arm_front_prow', -ARM_X, ARM_Y, 0.3675, Math.PI * 0.5, 0, Math.PI * 0.25);
  addMesh(armTipGeo, lacquerMat, 'right_arm_front_prow', ARM_X, ARM_Y, 0.3675, Math.PI * 0.5, 0, Math.PI * 0.25);

  // Angular finial cap on the front corner of each armrest
  const armCapGeo = new THREE.ConeGeometry(0.036, 0.065, 4);
  addMesh(armCapGeo, pewterMat, 'left_arm_corner_spire', -ARM_X, ARM_Y + 0.062, 0.31, 0, Math.PI * 0.25, 0);
  addMesh(armCapGeo, pewterMat, 'right_arm_corner_spire', ARM_X, ARM_Y + 0.062, 0.31, 0, Math.PI * 0.25, 0);

  return group;
}
