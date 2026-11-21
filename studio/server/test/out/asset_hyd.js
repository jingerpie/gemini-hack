function build(THREE) {
  'use strict';

  const group = new THREE.Group();

  // Target dimensions (meters)
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  // Component dimensions
  const LEG_H = 0.40;
  const LEG_X = 0.32;
  const LEG_Z = 0.34;
  const APRON_W = 0.72;
  const APRON_H = 0.09;
  const APRON_D = 0.70;
  const APRON_Y = 0.425;

  const SEAT_W = 0.66;
  const SEAT_D = 0.64;
  const SEAT_THICK = 0.10;
  const SEAT_BASE_Y = 0.46;

  const BACK_W = 0.74;
  const BACK_THICK = 0.09;
  const BACK_Z = -0.355;
  const BACK_BASE_Y = 0.44;
  const BACK_ARCH_TOP_Y = 1.48;

  const ARM_X = 0.385;
  const ARM_W = 0.13;
  const ARM_Y = 0.72;

  // Shared materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.35,
    metalness: 0.08
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0c18,
    roughness: 0.88,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85
  });

  const tuftMat = new THREE.MeshStandardMaterial({
    color: 0x5c0710,
    roughness: 0.82,
    metalness: 0.04
  });

  function addMesh(name, geometry, material, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geometry, material);
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

  // 1. Turned Legs (LatheGeometry, y = 0 to LEG_H)
  const legPoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.045, 0.00),
    new THREE.Vector2(0.060, 0.03),
    new THREE.Vector2(0.058, 0.06),
    new THREE.Vector2(0.030, 0.09),
    new THREE.Vector2(0.042, 0.14),
    new THREE.Vector2(0.032, 0.18),
    new THREE.Vector2(0.048, 0.25),
    new THREE.Vector2(0.038, 0.32),
    new THREE.Vector2(0.052, 0.36),
    new THREE.Vector2(0.052, LEG_H),
    new THREE.Vector2(0.001, LEG_H)
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 20);

  addMesh('front_left_leg', legGeo, walnutMat, -LEG_X, 0, LEG_Z);
  addMesh('front_right_leg', legGeo, walnutMat, LEG_X, 0, LEG_Z);
  addMesh('back_left_leg', legGeo, walnutMat, -LEG_X, 0, -LEG_Z);
  addMesh('back_right_leg', legGeo, walnutMat, LEG_X, 0, -LEG_Z);

  // 2. Stretchers
  const sideStretcherGeo = new THREE.CylinderGeometry(0.022, 0.022, LEG_Z * 2, 16);
  addMesh('left_stretcher', sideStretcherGeo, walnutMat, -LEG_X, 0.14, 0, Math.PI / 2, 0, 0);
  addMesh('right_stretcher', sideStretcherGeo, walnutMat, LEG_X, 0.14, 0, Math.PI / 2, 0, 0);

  const crossStretcherGeo = new THREE.CylinderGeometry(0.024, 0.024, LEG_X * 2, 16);
  addMesh('cross_stretcher', crossStretcherGeo, walnutMat, 0, 0.14, 0, 0, 0, Math.PI / 2);

  // 3. Seat Frame / Apron
  const seatFrameGeo = new THREE.BoxGeometry(APRON_W, APRON_H, APRON_D);
  addMesh('seat_frame', seatFrameGeo, walnutMat, 0, APRON_Y, 0);

  const apronMedallionGeo = new THREE.SphereGeometry(0.042, 16, 12);
  apronMedallionGeo.scale(1.6, 0.85, 0.4);
  addMesh('front_apron_medallion', apronMedallionGeo, goldMat, 0, APRON_Y, APRON_D / 2 + 0.005);

  // 4. Seat Cushion (ExtrudeGeometry with rounded corners)
  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2 - 0.02;
  const sd = SEAT_D / 2 - 0.02;
  const sr = 0.04;
  seatShape.moveTo(-sw + sr, -sd);
  seatShape.lineTo(sw - sr, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + sr);
  seatShape.lineTo(sw, sd - sr);
  seatShape.quadraticCurveTo(sw, sd, sw - sr, sd);
  seatShape.lineTo(-sw + sr, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - sr);
  seatShape.lineTo(-sw, -sd + sr);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + sr, -sd);

  const seatCushionGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4
  });
  seatCushionGeo.rotateX(Math.PI / 2);
  addMesh('seat_cushion', seatCushionGeo, velvetMat, 0, SEAT_BASE_Y + SEAT_THICK - 0.01, 0.01);

  // Seat tufting buttons
  const tuftGeo = new THREE.SphereGeometry(0.014, 12, 10);
  tuftGeo.scale(1, 0.55, 1);
  const seatTuftY = SEAT_BASE_Y + SEAT_THICK + 0.008;
  addMesh('seat_tuft_fl', tuftGeo, tuftMat, -0.14, seatTuftY, 0.14);
  addMesh('seat_tuft_fr', tuftGeo, tuftMat, 0.14, seatTuftY, 0.14);
  addMesh('seat_tuft_bl', tuftGeo, tuftMat, -0.14, seatTuftY, -0.08);
  addMesh('seat_tuft_br', tuftGeo, tuftMat, 0.14, seatTuftY, -0.08);

  // 5. Tall Arched Backrest Frame (ExtrudeGeometry)
  const backRadius = BACK_W / 2;
  const backSpringY = BACK_ARCH_TOP_Y - backRadius;
  const backFrameShape = new THREE.Shape();
  backFrameShape.moveTo(-backRadius, BACK_BASE_Y);
  backFrameShape.lineTo(backRadius, BACK_BASE_Y);
  backFrameShape.lineTo(backRadius, backSpringY);
  backFrameShape.absarc(0, backSpringY, backRadius, 0, Math.PI, false);
  backFrameShape.lineTo(-backRadius, BACK_BASE_Y);

  const backFrameGeo = new THREE.ExtrudeGeometry(backFrameShape, {
    depth: BACK_THICK - 0.016,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3
  });
  addMesh('backrest_frame', backFrameGeo, walnutMat, 0, 0, BACK_Z - BACK_THICK / 2 + 0.008);

  // 6. Arched Backrest Velvet Cushion
  const backCushW = 0.58;
  const backCushR = backCushW / 2;
  const backCushBaseY = 0.52;
  const backCushSpringY = 1.40 - backCushR;
  const backCushShape = new THREE.Shape();
  backCushShape.moveTo(-backCushR, backCushBaseY);
  backCushShape.lineTo(backCushR, backCushBaseY);
  backCushShape.lineTo(backCushR, backCushSpringY);
  backCushShape.absarc(0, backCushSpringY, backCushR, 0, Math.PI, false);
  backCushShape.lineTo(-backCushR, backCushBaseY);

  const backCushGeo = new THREE.ExtrudeGeometry(backCushShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 4
  });
  addMesh('backrest_cushion', backCushGeo, velvetMat, 0, 0, BACK_Z + 0.03);

  // Backrest tufting buttons
  const backTuftGeo = new THREE.SphereGeometry(0.014, 12, 10);
  backTuftGeo.scale(1, 1, 0.55);
  const backTuftZ = BACK_Z + 0.11;
  addMesh('back_tuft_center', backTuftGeo, tuftMat, 0, 0.98, backTuftZ);
  addMesh('back_tuft_tl', backTuftGeo, tuftMat, -0.14, 1.15, backTuftZ);
  addMesh('back_tuft_tr', backTuftGeo, tuftMat, 0.14, 1.15, backTuftZ);
  addMesh('back_tuft_bl', backTuftGeo, tuftMat, -0.14, 0.80, backTuftZ);
  addMesh('back_tuft_br', backTuftGeo, tuftMat, 0.14, 0.80, backTuftZ);

  // 7. Side Backrest Posts & Gilded Finials
  const postPoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.040, 0.00),
    new THREE.Vector2(0.042, 0.25),
    new THREE.Vector2(0.032, 0.45),
    new THREE.Vector2(0.040, 0.65),
    new THREE.Vector2(0.035, 0.88),
    new THREE.Vector2(0.001, 0.88)
  ];
  const postGeo = new THREE.LatheGeometry(postPoints, 18);
  addMesh('left_back_post', postGeo, walnutMat, -BACK_W / 2, BACK_BASE_Y, BACK_Z);
  addMesh('right_back_post', postGeo, walnutMat, BACK_W / 2, BACK_BASE_Y, BACK_Z);

  const sideFinialPoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.038, 0.00),
    new THREE.Vector2(0.044, 0.03),
    new THREE.Vector2(0.024, 0.06),
    new THREE.Vector2(0.036, 0.10),
    new THREE.Vector2(0.015, 0.14),
    new THREE.Vector2(0.001, 0.18)
  ];
  const sideFinialGeo = new THREE.LatheGeometry(sideFinialPoints, 18);
  addMesh('left_side_finial', sideFinialGeo, goldMat, -BACK_W / 2, 1.30, BACK_Z);
  addMesh('right_side_finial', sideFinialGeo, goldMat, BACK_W / 2, 1.30, BACK_Z);

  // 8. Central Crown Finial & Medallion (reaches y = H = 1.60)
  const centralFinialPoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.055, 0.00),
    new THREE.Vector2(0.065, 0.03),
    new THREE.Vector2(0.035, 0.06),
    new THREE.Vector2(0.048, 0.09),
    new THREE.Vector2(0.020, 0.13),
    new THREE.Vector2(0.001, 0.16)
  ];
  const centralFinialGeo = new THREE.LatheGeometry(centralFinialPoints, 20);
  addMesh('central_finial', centralFinialGeo, goldMat, 0, H - 0.16, BACK_Z);

  const crownMedallionGeo = new THREE.TorusGeometry(0.055, 0.014, 12, 24);
  addMesh('crown_medallion', crownMedallionGeo, goldMat, 0, 1.40, BACK_Z + 0.045);

  // 9. Armrest Posts
  const armPostPoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.038, 0.00),
    new THREE.Vector2(0.028, 0.08),
    new THREE.Vector2(0.036, 0.16),
    new THREE.Vector2(0.032, 0.26),
    new THREE.Vector2(0.001, 0.26)
  ];
  const armPostGeo = new THREE.LatheGeometry(armPostPoints, 16);
  addMesh('left_arm_post', armPostGeo, walnutMat, -0.35, 0.44, 0.24);
  addMesh('right_arm_post', armPostGeo, walnutMat, 0.35, 0.44, 0.24);

  // 10. Wide Scrolled Armrests (ExtrudeGeometry in YZ plane, extruded along X)
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.34, 0.67);
  armShape.lineTo(0.28, 0.67);
  armShape.quadraticCurveTo(0.36, 0.66, 0.37, 0.71);
  armShape.quadraticCurveTo(0.37, 0.76, 0.31, 0.76);
  armShape.quadraticCurveTo(0.26, 0.76, 0.25, 0.74);
  armShape.lineTo(-0.34, 0.74);
  armShape.lineTo(-0.34, 0.67);

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  // Rotate so shape X->Z, shape Y->Y, extrude Z->X
  armGeo.rotateY(-Math.PI / 2);

  addMesh('left_armrest', armGeo, walnutMat, -ARM_X + (ARM_W - 0.02) / 2, 0, 0);
  addMesh('right_armrest', armGeo, walnutMat, ARM_X + (ARM_W - 0.02) / 2, 0, 0);

  // 11. Armrest Velvet Pads
  const armPadGeo = new THREE.CapsuleGeometry(0.038, 0.36, 8, 16);
  armPadGeo.scale(1.2, 0.5, 1.0);
  addMesh('left_arm_pad', armPadGeo, velvetMat, -ARM_X, 0.745, -0.02, Math.PI / 2, 0, 0);
  addMesh('right_arm_pad', armPadGeo, velvetMat, ARM_X, 0.745, -0.02, Math.PI / 2, 0, 0);

  // 12. Carved Lion-Head Accents on Armrest Fronts
  const lionManeGeo = new THREE.TorusGeometry(0.036, 0.016, 10, 16);
  const lionHeadGeo = new THREE.SphereGeometry(0.032, 16, 12);
  lionHeadGeo.scale(0.95, 1.0, 1.1);

  addMesh('left_lion_mane', lionManeGeo, walnutMat, -ARM_X, 0.705, 0.355);
  addMesh('right_lion_mane', lionManeGeo, walnutMat, ARM_X, 0.705, 0.355);
  addMesh('left_lion_head', lionHeadGeo, walnutMat, -ARM_X, 0.705, 0.365);
  addMesh('right_lion_head', lionHeadGeo, walnutMat, ARM_X, 0.705, 0.365);

  return group;
}
