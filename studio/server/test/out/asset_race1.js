function build(THREE) {
  'use strict';

  const group = new THREE.Group();

  // Target dimensions (meters): 0.90 W x 1.60 H x 0.80 D
  const W = 0.90;
  const H = 1.60;
  const D = 0.80;

  const LEG_H = 0.38;
  const APRON_H = 0.10;
  const APRON_Y = 0.39;
  const SEAT_W = 0.74;
  const SEAT_D = 0.66;
  const SEAT_Y = 0.47;

  const LEG_X = 0.33;
  const LEG_Z_FRONT = 0.28;
  const LEG_Z_BACK = -0.30;

  const BACK_Z = -0.34;
  const ARM_X = 0.39;
  const ARM_W = 0.12;
  const ARM_Y = 0.68;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2214,
    roughness: 0.36,
    metalness: 0.05
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6e0c18,
    roughness: 0.92,
    metalness: 0.02
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.85
  });

  function addMesh(name, geom, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
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

  // Turned leg profile (y = 0 to LEG_H)
  const legPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.046, 0.03),
    new THREE.Vector2(0.032, 0.06),
    new THREE.Vector2(0.050, 0.12),
    new THREE.Vector2(0.036, 0.18),
    new THREE.Vector2(0.054, 0.25),
    new THREE.Vector2(0.038, 0.31),
    new THREE.Vector2(0.048, 0.38),
    new THREE.Vector2(0.00, 0.38)
  ];
  const legGeom = new THREE.LatheGeometry(legPoints, 20);

  addMesh('leg_front_left', legGeom, walnutMat, -LEG_X, 0, LEG_Z_FRONT);
  addMesh('leg_front_right', legGeom, walnutMat, LEG_X, 0, LEG_Z_FRONT);
  addMesh('leg_back_left', legGeom, walnutMat, -LEG_X, 0, LEG_Z_BACK);
  addMesh('leg_back_right', legGeom, walnutMat, LEG_X, 0, LEG_Z_BACK);

  // Stretchers connecting legs
  const stretcherY = 0.12;
  const frontStretcherGeom = new THREE.CylinderGeometry(0.022, 0.022, LEG_X * 2, 16);
  addMesh('stretcher_front', frontStretcherGeom, walnutMat, 0, stretcherY, LEG_Z_FRONT, 0, 0, Math.PI / 2);

  const sideStretcherLen = LEG_Z_FRONT - LEG_Z_BACK;
  const sideStretcherGeom = new THREE.CylinderGeometry(0.022, 0.022, sideStretcherLen, 16);
  const sideStretcherZ = (LEG_Z_FRONT + LEG_Z_BACK) / 2;
  addMesh('stretcher_left', sideStretcherGeom, walnutMat, -LEG_X, stretcherY, sideStretcherZ, Math.PI / 2, 0, 0);
  addMesh('stretcher_right', sideStretcherGeom, walnutMat, LEG_X, stretcherY, sideStretcherZ, Math.PI / 2, 0, 0);

  const centerStretcherGeom = new THREE.CylinderGeometry(0.020, 0.020, LEG_X * 2, 16);
  addMesh('stretcher_center', centerStretcherGeom, walnutMat, 0, stretcherY, sideStretcherZ, 0, 0, Math.PI / 2);

  // Seat apron (walnut base frame)
  const apronGeom = new THREE.BoxGeometry(SEAT_W, APRON_H, SEAT_D);
  addMesh('seat_apron', apronGeom, walnutMat, 0, APRON_Y, -0.01);

  // Gilded front apron ornament
  const apronCrestGeom = new THREE.BoxGeometry(0.28, 0.06, 0.025);
  addMesh('seat_apron_ornament', apronCrestGeom, goldMat, 0, APRON_Y, SEAT_D / 2 - 0.005);

  // Velvet seat cushion (extruded rounded rectangle)
  const cw = 0.66;
  const cd = 0.60;
  const cr = 0.06;
  const seatShape = new THREE.Shape();
  seatShape.moveTo(-cw / 2 + cr, -cd / 2);
  seatShape.lineTo(cw / 2 - cr, -cd / 2);
  seatShape.quadraticCurveTo(cw / 2, -cd / 2, cw / 2, -cd / 2 + cr);
  seatShape.lineTo(cw / 2, cd / 2 - cr);
  seatShape.quadraticCurveTo(cw / 2, cd / 2, cw / 2 - cr, cd / 2);
  seatShape.lineTo(-cw / 2 + cr, cd / 2);
  seatShape.quadraticCurveTo(-cw / 2, cd / 2, -cw / 2, cd / 2 - cr);
  seatShape.lineTo(-cw / 2, -cd / 2 + cr);
  seatShape.quadraticCurveTo(-cw / 2, -cd / 2, -cw / 2 + cr, -cd / 2);

  const seatCushionGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4
  });
  seatCushionGeom.rotateX(Math.PI / 2);
  addMesh('seat_cushion', seatCushionGeom, velvetMat, 0, SEAT_Y + 0.05, 0.01);

  // Backrest side posts
  const postH = 1.02;
  const postGeom = new THREE.CylinderGeometry(0.038, 0.042, postH, 16);
  addMesh('back_post_left', postGeom, walnutMat, -0.34, LEG_H + postH / 2 - 0.02, BACK_Z);
  addMesh('back_post_right', postGeom, walnutMat, 0.34, LEG_H + postH / 2 - 0.02, BACK_Z);

  // Arched backrest walnut frame
  const archW = 0.72;
  const archBottomY = 0.42;
  const archSpringY = 1.18;
  const archTopY = 1.48;

  const frameShape = new THREE.Shape();
  frameShape.moveTo(-archW / 2, archBottomY);
  frameShape.lineTo(archW / 2, archBottomY);
  frameShape.lineTo(archW / 2, archSpringY);
  frameShape.quadraticCurveTo(archW / 2, archTopY, 0, archTopY);
  frameShape.quadraticCurveTo(-archW / 2, archTopY, -archW / 2, archSpringY);
  frameShape.closePath();

  const frameGeom = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  });
  // Extrudes from z=0 to z=0.07; place so back is at z = -0.385 (bevel -0.40)
  addMesh('back_frame_arch', frameGeom, walnutMat, 0, 0, -0.385);

  // Arched velvet backrest cushion
  const bcW = 0.58;
  const bcBottomY = 0.48;
  const bcSpringY = 1.14;
  const bcTopY = 1.39;

  const backCushionShape = new THREE.Shape();
  backCushionShape.moveTo(-bcW / 2, bcBottomY);
  backCushionShape.lineTo(bcW / 2, bcBottomY);
  backCushionShape.lineTo(bcW / 2, bcSpringY);
  backCushionShape.quadraticCurveTo(bcW / 2, bcTopY, 0, bcTopY);
  backCushionShape.quadraticCurveTo(-bcW / 2, bcTopY, -bcW / 2, bcSpringY);
  backCushionShape.closePath();

  const backCushionGeom = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 4
  });
  addMesh('back_cushion', backCushionGeom, velvetMat, 0, 0, -0.32);

  // Tufting buttons on backrest (diamond pattern)
  const tuftGeom = new THREE.SphereGeometry(0.016, 12, 10);
  const tuftZ = -0.245;
  addMesh('back_tuft_center', tuftGeom, goldMat, 0, 0.94, tuftZ);
  addMesh('back_tuft_top', tuftGeom, goldMat, 0, 1.14, tuftZ);
  addMesh('back_tuft_bottom', tuftGeom, goldMat, 0, 0.74, tuftZ);
  addMesh('back_tuft_left', tuftGeom, goldMat, -0.14, 0.94, tuftZ);
  addMesh('back_tuft_right', tuftGeom, goldMat, 0.14, 0.94, tuftZ);

  // Gilded crest ornament atop arch
  const crestGeom = new THREE.TorusGeometry(0.065, 0.018, 12, 24);
  addMesh('back_crest_medallion', crestGeom, goldMat, 0, 1.44, -0.33);

  // Gilded finials (center reaches exactly y = 1.60)
  const centerFinialPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.026, 0.025),
    new THREE.Vector2(0.048, 0.055),
    new THREE.Vector2(0.020, 0.085),
    new THREE.Vector2(0.012, 0.115),
    new THREE.Vector2(0.00, 0.13)
  ];
  const centerFinialGeom = new THREE.LatheGeometry(centerFinialPoints, 20);
  addMesh('finial_center', centerFinialGeom, goldMat, 0, 1.47, BACK_Z);

  const sideFinialPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.036, 0.00),
    new THREE.Vector2(0.022, 0.02),
    new THREE.Vector2(0.038, 0.05),
    new THREE.Vector2(0.016, 0.085),
    new THREE.Vector2(0.00, 0.11)
  ];
  const sideFinialGeom = new THREE.LatheGeometry(sideFinialPoints, 20);
  addMesh('finial_left', sideFinialGeom, goldMat, -0.34, 1.37, BACK_Z);
  addMesh('finial_right', sideFinialGeom, goldMat, 0.34, 1.37, BACK_Z);

  // Armrest supports (front turned posts)
  const armSupportPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.036, 0.00),
    new THREE.Vector2(0.028, 0.06),
    new THREE.Vector2(0.042, 0.13),
    new THREE.Vector2(0.028, 0.20),
    new THREE.Vector2(0.038, 0.25),
    new THREE.Vector2(0.00, 0.25)
  ];
  const armSupportGeom = new THREE.LatheGeometry(armSupportPoints, 18);
  addMesh('arm_support_left', armSupportGeom, walnutMat, -ARM_X, APRON_Y + 0.04, 0.24);
  addMesh('arm_support_right', armSupportGeom, walnutMat, ARM_X, APRON_Y + 0.04, 0.24);

  // Wide scrolled armrests (outer edges at x = -0.45 and +0.45 -> W = 0.90)
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.34, -0.025);
  armShape.lineTo(0.28, -0.025);
  armShape.quadraticCurveTo(0.36, -0.025, 0.36, 0.03);
  armShape.quadraticCurveTo(0.36, 0.08, 0.28, 0.08);
  armShape.quadraticCurveTo(0.22, 0.08, 0.20, 0.035);
  armShape.lineTo(-0.34, 0.035);
  armShape.closePath();

  const armGeom = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  // Rotate so X->Z (length along Z), Y stays Y, Z->X (width along X)
  armGeom.rotateY(-Math.PI / 2);
  // After rotateY(-PI/2): original +X becomes +Z, original +Z becomes -X.
  // So depth [0..ARM_W] goes from x=0 to x=-ARM_W; center at x = -ARM_X + ARM_W/2
  addMesh('armrest_left', armGeom, walnutMat, -ARM_X + ARM_W / 2 - 0.01, ARM_Y, 0);
  addMesh('armrest_right', armGeom, walnutMat, ARM_X + ARM_W / 2 + 0.01, ARM_Y, 0);

  // Velvet arm pads
  const armPadGeom = new THREE.BoxGeometry(0.09, 0.032, 0.38);
  addMesh('arm_pad_left', armPadGeom, velvetMat, -ARM_X, ARM_Y + 0.04, -0.06);
  addMesh('arm_pad_right', armPadGeom, velvetMat, ARM_X, ARM_Y + 0.04, -0.06);

  // Carved lion-head accents at front of armrests (reaching z = +0.40)
  const lionHeadGeom = new THREE.SphereGeometry(0.044, 16, 14);
  const lionManeGeom = new THREE.TorusGeometry(0.046, 0.016, 12, 20);
  addMesh('lion_head_left', lionHeadGeom, goldMat, -ARM_X, ARM_Y + 0.028, 0.356);
  addMesh('lion_mane_left', lionManeGeom, walnutMat, -ARM_X, ARM_Y + 0.028, 0.342);
  addMesh('lion_head_right', lionHeadGeom, goldMat, ARM_X, ARM_Y + 0.028, 0.356);
  addMesh('lion_mane_right', lionManeGeom, walnutMat, ARM_X, ARM_Y + 0.028, 0.342);

  return group;
}
