function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.50;
  const D_CHAISE = 1.56;
  const D_SOFA = 0.98;
  const H = 0.78;

  const FOOT_H = 0.015;
  const FOOT_R = 0.025;

  const ARM_W = 0.22;
  const ARM_H = 0.56;
  const ARM_D = D_SOFA;

  const BASE_H = 0.22;
  const BACK_THICK = 0.10;
  const BACK_WOOD_H = 0.58;

  const INNER_W = W - ARM_W * 2;
  const MODULE_W = INNER_W / 2;
  const CUSHION_GAP = 0.012;

  const SEAT_CUSHION_H = 0.175;
  const BACK_CUSHION_H = 0.37;
  const BACK_CUSHION_D = 0.17;

  // Centering offsets
  const Z_BACK = -D_CHAISE / 2;
  const Z_SOFA_FRONT = Z_BACK + D_SOFA;
  const Z_CHAISE_FRONT = D_CHAISE / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8a7b6c,
    roughness: 0.74,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb5ada2,
    roughness: 0.92,
    metalness: 0.0
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.8,
    metalness: 0.1
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createCushionGeo(width, height, depth, radius, bevel) {
    const w = width - bevel * 2;
    const h = height - bevel * 2;
    const r = Math.min(radius, w / 2, h / 2);
    const shape = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -h / 2;

    shape.moveTo(x0 + r, y0);
    shape.lineTo(x0 + w - r, y0);
    shape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    shape.lineTo(x0 + w, y0 + h - r);
    shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    shape.lineTo(x0 + r, y0 + h);
    shape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    shape.lineTo(x0, y0 + r);
    shape.quadraticCurveTo(x0, y0, x0 + r, y0);

    const extrudeDepth = Math.max(0.01, depth - bevel * 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: extrudeDepth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8
    });
    geo.center();
    return geo;
  }

  // Feet (y = 0 to FOOT_H)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footY = FOOT_H / 2;
  const inset = 0.06;

  // Left arm feet
  addMesh(footGeo, footMat, 'foot_arm_left_back', -W / 2 + inset, footY, Z_BACK + inset);
  addMesh(footGeo, footMat, 'foot_arm_left_front', -W / 2 + inset, footY, Z_SOFA_FRONT - inset);

  // Right arm feet
  addMesh(footGeo, footMat, 'foot_arm_right_back', W / 2 - inset, footY, Z_BACK + inset);
  addMesh(footGeo, footMat, 'foot_arm_right_front', W / 2 - inset, footY, Z_SOFA_FRONT - inset);

  // Chaise base feet
  const chaiseCenterX = -MODULE_W / 2;
  addMesh(footGeo, footMat, 'foot_chaise_front_left', chaiseCenterX - MODULE_W / 2 + inset, footY, Z_CHAISE_FRONT - inset);
  addMesh(footGeo, footMat, 'foot_chaise_front_right', chaiseCenterX + MODULE_W / 2 - inset, footY, Z_CHAISE_FRONT - inset);
  addMesh(footGeo, footMat, 'foot_chaise_back_left', chaiseCenterX - MODULE_W / 2 + inset, footY, Z_BACK + inset);
  addMesh(footGeo, footMat, 'foot_chaise_back_right', chaiseCenterX + MODULE_W / 2 - inset, footY, Z_BACK + inset);

  // Right sofa base feet
  const sofaCenterX = MODULE_W / 2;
  addMesh(footGeo, footMat, 'foot_sofa_front_right', sofaCenterX + MODULE_W / 2 - inset, footY, Z_SOFA_FRONT - inset);
  addMesh(footGeo, footMat, 'foot_sofa_back_right', sofaCenterX + MODULE_W / 2 - inset, footY, Z_BACK + inset);

  // Wooden Arms
  const armGeo = new THREE.BoxGeometry(ARM_W, ARM_H, ARM_D);
  const armY = FOOT_H + ARM_H / 2;
  const armZ = Z_BACK + ARM_D / 2;
  addMesh(armGeo, woodMat, 'wood_arm_left', -W / 2 + ARM_W / 2, armY, armZ);
  addMesh(armGeo, woodMat, 'wood_arm_right', W / 2 - ARM_W / 2, armY, armZ);

  // Wooden Back Panel
  const backWoodGeo = new THREE.BoxGeometry(INNER_W, BACK_WOOD_H, BACK_THICK);
  addMesh(
    backWoodGeo,
    woodMat,
    'wood_back_panel',
    0,
    FOOT_H + BACK_WOOD_H / 2,
    Z_BACK + BACK_THICK / 2
  );

  // Wooden Bases
  const baseY = FOOT_H + BASE_H / 2;
  const chaiseBaseGeo = new THREE.BoxGeometry(MODULE_W - 0.004, BASE_H, D_CHAISE);
  addMesh(chaiseBaseGeo, woodMat, 'wood_base_chaise', chaiseCenterX, baseY, 0);

  const sofaBaseGeo = new THREE.BoxGeometry(MODULE_W - 0.004, BASE_H, D_SOFA);
  addMesh(sofaBaseGeo, woodMat, 'wood_base_sofa', sofaCenterX, baseY, armZ);

  // Seat Cushions
  const seatTopY = FOOT_H + BASE_H + SEAT_CUSHION_H / 2;
  const seatW = MODULE_W - CUSHION_GAP;

  const chaiseSeatD = D_CHAISE - BACK_THICK;
  const chaiseSeatGeo = createCushionGeo(seatW, SEAT_CUSHION_H, chaiseSeatD, 0.03, 0.025);
  addMesh(
    chaiseSeatGeo,
    fabricMat,
    'cushion_seat_chaise',
    chaiseCenterX,
    seatTopY,
    Z_BACK + BACK_THICK + chaiseSeatD / 2
  );

  const sofaSeatD = D_SOFA - BACK_THICK;
  const sofaSeatGeo = createCushionGeo(seatW, SEAT_CUSHION_H, sofaSeatD, 0.03, 0.025);
  addMesh(
    sofaSeatGeo,
    fabricMat,
    'cushion_seat_sofa',
    sofaCenterX,
    seatTopY,
    Z_BACK + BACK_THICK + sofaSeatD / 2
  );

  // Backrest Cushions
  const backCushionGeo = createCushionGeo(seatW, BACK_CUSHION_H, BACK_CUSHION_D, 0.035, 0.025);
  const backCushionY = FOOT_H + BASE_H + SEAT_CUSHION_H + BACK_CUSHION_H / 2 - 0.015;
  const backCushionZ = Z_BACK + BACK_THICK + BACK_CUSHION_D / 2 + 0.01;
  const backTilt = -0.08;

  addMesh(
    backCushionGeo,
    fabricMat,
    'cushion_back_left',
    chaiseCenterX,
    backCushionY,
    backCushionZ,
    backTilt,
    0,
    0
  );

  addMesh(
    backCushionGeo,
    fabricMat,
    'cushion_back_right',
    sofaCenterX,
    backCushionY,
    backCushionZ,
    backTilt,
    0,
    0
  );

  return group;
}
