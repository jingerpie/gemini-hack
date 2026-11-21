function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const D = 0.56;
  const H = 0.88;
  const SEAT_H = 0.46;
  const SEAT_THICK = 0.065;
  const APRON_H = 0.042;
  const APRON_THICK = 0.028;
  const LEG_TOP_R = 0.021;
  const LEG_BOT_R = 0.013;

  const SEAT_BOT_Y = SEAT_H - SEAT_THICK;
  const APRON_Y = SEAT_BOT_Y - APRON_H / 2 + 0.005;

  const FRONT_Z = D / 2 - 0.04;
  const BACK_Z = -(D / 2 - 0.06);
  const LEG_X = W / 2 - 0.032;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b99b,
    roughness: 0.65,
    metalness: 0.0
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xafa08c,
    roughness: 0.92,
    metalness: 0.0
  });

  // Helper to configure shadows and add to group
  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tapered Legs (4)
  const legLen = SEAT_BOT_Y + 0.01;
  const legGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, legLen, 16);

  // Front legs (very slight outward splay)
  addMesh(legGeo, woodMat, "leg_front_left", [-LEG_X, legLen / 2, FRONT_Z], [0, 0, -0.02]);
  addMesh(legGeo, woodMat, "leg_front_right", [LEG_X, legLen / 2, FRONT_Z], [0, 0, 0.02]);

  // Back legs (angled slightly backward)
  const backLegLen = legLen + 0.008;
  const backLegGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, backLegLen, 16);
  addMesh(backLegGeo, woodMat, "leg_back_left", [-LEG_X + 0.006, legLen / 2, BACK_Z], [-0.07, 0, -0.015]);
  addMesh(backLegGeo, woodMat, "leg_back_right", [LEG_X - 0.006, legLen / 2, BACK_Z], [-0.07, 0, 0.015]);

  // 2. Wood Apron Rails (4)
  const frontRailLen = LEG_X * 2;
  const frontRailGeo = new THREE.BoxGeometry(frontRailLen, APRON_H, APRON_THICK);
  addMesh(frontRailGeo, woodMat, "rail_front", [0, APRON_Y, FRONT_Z]);

  const backRailLen = (LEG_X - 0.006) * 2;
  const backRailGeo = new THREE.BoxGeometry(backRailLen, APRON_H, APRON_THICK);
  addMesh(backRailGeo, woodMat, "rail_back", [0, APRON_Y, BACK_Z + 0.01]);

  const sideRailLen = FRONT_Z - BACK_Z;
  const sideRailGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideRailLen);
  const sideCenterZ = (FRONT_Z + BACK_Z) / 2;
  addMesh(sideRailGeo, woodMat, "rail_left", [-LEG_X + 0.003, APRON_Y, sideCenterZ]);
  addMesh(sideRailGeo, woodMat, "rail_right", [LEG_X - 0.003, APRON_Y, sideCenterZ]);

  // 3. Corner Joinery Blocks (4)
  const jointGeo = new THREE.CylinderGeometry(LEG_TOP_R * 1.15, LEG_TOP_R * 1.1, APRON_H + 0.006, 12);
  addMesh(jointGeo, woodMat, "joint_front_left", [-LEG_X, APRON_Y, FRONT_Z]);
  addMesh(jointGeo, woodMat, "joint_front_right", [LEG_X, APRON_Y, FRONT_Z]);
  addMesh(jointGeo, woodMat, "joint_back_left", [-LEG_X + 0.006, APRON_Y, BACK_Z + 0.01]);
  addMesh(jointGeo, woodMat, "joint_back_right", [LEG_X - 0.006, APRON_Y, BACK_Z + 0.01]);

  // 4. Upholstered Seat Cushion
  const seatW = W - 0.03;
  const seatD = D - 0.05;
  const rSeat = 0.035;

  const seatShape = new THREE.Shape();
  seatShape.moveTo(-seatW / 2 + rSeat, -seatD / 2);
  seatShape.lineTo(seatW / 2 - rSeat, -seatD / 2);
  seatShape.quadraticCurveTo(seatW / 2, -seatD / 2, seatW / 2, -seatD / 2 + rSeat);
  seatShape.lineTo(seatW / 2, seatD / 2 - rSeat);
  seatShape.quadraticCurveTo(seatW / 2, seatD / 2, seatW / 2 - rSeat, seatD / 2);
  seatShape.lineTo(-seatW / 2 + rSeat, seatD / 2);
  seatShape.quadraticCurveTo(-seatW / 2, seatD / 2, -seatW / 2, seatD / 2 - rSeat);
  seatShape.lineTo(-seatW / 2, -seatD / 2 + rSeat);
  seatShape.quadraticCurveTo(-seatW / 2, -seatD / 2, -seatW / 2 + rSeat, -seatD / 2);

  const seatBevel = 0.018;
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - seatBevel * 2,
    bevelEnabled: true,
    bevelThickness: seatBevel,
    bevelSize: seatBevel,
    bevelSegments: 4
  });
  seatGeo.rotateX(Math.PI / 2);

  addMesh(seatGeo, fabricMat, "seat_cushion", [0, SEAT_H - seatBevel, 0.01]);

  // 5. Upholstered Backrest (tapered upward, slightly tilted back)
  const backBotW = W - 0.06;
  const backTopW = W - 0.11;
  const backH = H - SEAT_H + 0.02;
  const backThick = 0.048;
  const rBack = 0.025;

  const backShape = new THREE.Shape();
  backShape.moveTo(-backBotW / 2 + rBack, 0);
  backShape.lineTo(backBotW / 2 - rBack, 0);
  backShape.quadraticCurveTo(backBotW / 2, 0, backBotW / 2, rBack);
  backShape.lineTo(backTopW / 2, backH - rBack);
  backShape.quadraticCurveTo(backTopW / 2, backH, backTopW / 2 - rBack, backH);
  backShape.lineTo(-backTopW / 2 + rBack, backH);
  backShape.quadraticCurveTo(-backTopW / 2, backH, -backTopW / 2, backH - rBack);
  backShape.lineTo(-backBotW / 2, rBack);
  backShape.quadraticCurveTo(-backBotW / 2, 0, -backBotW / 2 + rBack, 0);

  const backBevel = 0.014;
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: backThick - backBevel * 2,
    bevelEnabled: true,
    bevelThickness: backBevel,
    bevelSize: backBevel,
    bevelSegments: 4
  });

  const backZ = BACK_Z + 0.015;
  addMesh(backGeo, fabricMat, "backrest_cushion", [0, SEAT_H - 0.02, backZ], [-0.09, 0, 0]);

  // 6. Backrest Wood Support Posts (connecting rear apron to backrest)
  const supportGeo = new THREE.BoxGeometry(0.026, 0.09, 0.024);
  addMesh(supportGeo, woodMat, "back_support_left", [-LEG_X + 0.05, SEAT_BOT_Y + 0.02, backZ + 0.01], [-0.09, 0, 0]);
  addMesh(supportGeo, woodMat, "back_support_right", [LEG_X - 0.05, SEAT_BOT_Y + 0.02, backZ + 0.01], [-0.09, 0, 0]);

  return group;
}
