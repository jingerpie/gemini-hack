function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.82;
  const D = 0.84;
  const H = 0.82;
  const LEG_W = 0.058;
  const LEG_D = 0.068;
  const ARM_H = 0.57;
  const RAIL_Y = 0.23;
  const RAIL_H = 0.075;
  const RAIL_THICK = 0.032;
  const SEAT_CUSHION_H = 0.155;
  const BACK_CUSHION_H = 0.44;
  const BACK_TILT = 0.14; // radians

  const HALF_W = W / 2;
  const FRONT_Z = D / 2 - LEG_D / 2 - 0.03;
  const BACK_Z = -D / 2 + LEG_D / 2 + 0.05;
  const SIDE_X = HALF_W - LEG_W / 2 - 0.015;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8864b,
    roughness: 0.55,
    metalness: 0.0,
  });

  const tenonMat = new THREE.MeshStandardMaterial({
    color: 0x996b36,
    roughness: 0.6,
    metalness: 0.0,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe3ded4,
    roughness: 0.88,
    metalness: 0.0,
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

  // Helper for slightly tapered leg
  function createLegGeo(height, topW, topD, botW, botD) {
    const geo = new THREE.BoxGeometry(topW, height, topD);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 0) {
        pos.setX(i, pos.getX(i) * (botW / topW));
        pos.setZ(i, pos.getZ(i) * (botD / topD));
      }
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Front legs (extend up to under the armrest)
  const frontLegH = ARM_H - 0.02;
  const frontLegGeo = createLegGeo(frontLegH, LEG_W, LEG_D, LEG_W * 0.78, LEG_D * 0.78);
  addMesh(frontLegGeo, woodMat, 'front_left_leg', -SIDE_X, frontLegH / 2, FRONT_Z);
  addMesh(frontLegGeo, woodMat, 'front_right_leg', SIDE_X, frontLegH / 2, FRONT_Z);

  // Back legs (lower vertical section up to seat rail)
  const backLegLowerH = RAIL_Y + RAIL_H / 2;
  const backLegGeo = createLegGeo(backLegLowerH, LEG_W, LEG_D, LEG_W * 0.78, LEG_D * 0.78);
  addMesh(backLegGeo, woodMat, 'back_left_leg', -SIDE_X, backLegLowerH / 2, BACK_Z);
  addMesh(backLegGeo, woodMat, 'back_right_leg', SIDE_X, backLegLowerH / 2, BACK_Z);

  // Back posts (angled slightly backward from seat rail to top of backrest)
  const backPostH = H - backLegLowerH - 0.04;
  const backPostGeo = new THREE.BoxGeometry(LEG_W * 0.92, backPostH, LEG_D * 0.85);
  const postCenterY = backLegLowerH + (backPostH / 2) * Math.cos(BACK_TILT) - 0.01;
  const postCenterZ = BACK_Z - (backPostH / 2) * Math.sin(BACK_TILT);
  addMesh(backPostGeo, woodMat, 'back_left_post', -SIDE_X, postCenterY, postCenterZ, -BACK_TILT, 0, 0);
  addMesh(backPostGeo, woodMat, 'back_right_post', SIDE_X, postCenterY, postCenterZ, -BACK_TILT, 0, 0);

  // Side seat rails
  const sideRailLen = FRONT_Z - BACK_Z;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_THICK, RAIL_H, sideRailLen);
  addMesh(sideRailGeo, woodMat, 'left_side_rail', -SIDE_X, RAIL_Y, (FRONT_Z + BACK_Z) / 2);
  addMesh(sideRailGeo, woodMat, 'right_side_rail', SIDE_X, RAIL_Y, (FRONT_Z + BACK_Z) / 2);

  // Front & back seat rails
  const crossRailLen = SIDE_X * 2 - LEG_W * 0.5;
  const frontRailGeo = new THREE.BoxGeometry(crossRailLen, RAIL_H, RAIL_THICK);
  addMesh(frontRailGeo, woodMat, 'front_rail', 0, RAIL_Y, FRONT_Z);
  addMesh(frontRailGeo, woodMat, 'back_rail', 0, RAIL_Y, BACK_Z);

  // Seat deck (supports the seat cushion)
  const deckW = SIDE_X * 2 - RAIL_THICK;
  const deckD = sideRailLen - 0.02;
  const deckGeo = new THREE.BoxGeometry(deckW, 0.022, deckD);
  addMesh(deckGeo, woodMat, 'seat_deck', 0, RAIL_Y + RAIL_H / 2 - 0.011, (FRONT_Z + BACK_Z) / 2);

  // Backrest top rail & mid rail
  const backRailW = SIDE_X * 2 - LEG_W * 0.6;
  const topRailGeo = new THREE.BoxGeometry(backRailW, 0.065, 0.028);
  const topRailDist = backPostH - 0.05;
  addMesh(
    topRailGeo,
    woodMat,
    'back_top_rail',
    0,
    backLegLowerH + topRailDist * Math.cos(BACK_TILT),
    BACK_Z - topRailDist * Math.sin(BACK_TILT),
    -BACK_TILT,
    0,
    0
  );

  const midRailDist = backPostH * 0.45;
  addMesh(
    topRailGeo,
    woodMat,
    'back_mid_rail',
    0,
    backLegLowerH + midRailDist * Math.cos(BACK_TILT),
    BACK_Z - midRailDist * Math.sin(BACK_TILT),
    -BACK_TILT,
    0,
    0
  );

  // Exposed tenon details on front legs
  const tenonGeo = new THREE.BoxGeometry(0.012, 0.032, 0.018);
  addMesh(tenonGeo, tenonMat, 'front_left_tenon', -SIDE_X - LEG_W / 2 + 0.002, RAIL_Y, FRONT_Z);
  addMesh(tenonGeo, tenonMat, 'front_right_tenon', SIDE_X + LEG_W / 2 - 0.002, RAIL_Y, FRONT_Z);

  // Curved armrests (ExtrudeGeometry)
  const armStartZ = BACK_Z - 0.03;
  const armEndZ = FRONT_Z + 0.055;
  const armShape = new THREE.Shape();
  armShape.moveTo(armStartZ, ARM_H - 0.035);
  armShape.quadraticCurveTo((armStartZ + armEndZ) / 2, ARM_H + 0.028, armEndZ, ARM_H - 0.02);
  armShape.lineTo(armEndZ, ARM_H - 0.048);
  armShape.quadraticCurveTo((armStartZ + armEndZ) / 2, ARM_H - 0.002, armStartZ, ARM_H - 0.062);
  armShape.closePath();

  const armW = 0.072;
  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: armW,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 16,
  });
  // Rotate so X is width, Y is up, Z is depth
  armGeo.rotateY(Math.PI / 2);
  addMesh(armGeo, woodMat, 'left_armrest', -SIDE_X - armW / 2, 0, 0);
  addMesh(armGeo, woodMat, 'right_armrest', SIDE_X - armW / 2, 0, 0);

  // Helper for rounded plush cushion
  function createCushionGeo(w, h, d, radius = 0.035) {
    const shape = new THREE.Shape();
    const hw = w / 2 - radius;
    const hd = d / 2 - radius;
    shape.moveTo(-hw, -hd - radius);
    shape.lineTo(hw, -hd - radius);
    shape.quadraticCurveTo(hw + radius, -hd - radius, hw + radius, -hd);
    shape.lineTo(hw + radius, hd);
    shape.quadraticCurveTo(hw + radius, hd + radius, hw, hd + radius);
    shape.lineTo(-hw, hd + radius);
    shape.quadraticCurveTo(-hw - radius, hd + radius, -hw - radius, hd);
    shape.lineTo(-hw - radius, -hd);
    shape.quadraticCurveTo(-hw - radius, -hd - radius, -hw, -hd - radius);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h - radius * 2,
      bevelEnabled: true,
      bevelThickness: radius,
      bevelSize: radius * 0.85,
      bevelSegments: 5,
      curveSegments: 8,
    });
    geo.rotateX(-Math.PI / 2);
    geo.center();
    return geo;
  }

  // Seat cushion
  const seatCushionW = SIDE_X * 2 - LEG_W - 0.01;
  const seatCushionD = FRONT_Z - BACK_Z + 0.05;
  const seatCushionY = RAIL_Y + RAIL_H / 2 + SEAT_CUSHION_H / 2 - 0.005;
  const seatCushionZ = (FRONT_Z + BACK_Z) / 2 + 0.02;
  const seatCushionGeo = createCushionGeo(seatCushionW, SEAT_CUSHION_H, seatCushionD, 0.035);
  addMesh(seatCushionGeo, fabricMat, 'seat_cushion', 0, seatCushionY, seatCushionZ);

  // Back cushion
  const backCushionW = seatCushionW - 0.02;
  const backCushionD = 0.16;
  const backCushionGeo = createCushionGeo(backCushionW, BACK_CUSHION_H, backCushionD, 0.04);
  const backCushionY = seatCushionY + SEAT_CUSHION_H / 2 + BACK_CUSHION_H / 2 - 0.03;
  const backCushionZ = BACK_Z + 0.075;
  addMesh(backCushionGeo, fabricMat, 'back_cushion', 0, backCushionY, backCushionZ, -BACK_TILT, 0, 0);

  return group;
}
