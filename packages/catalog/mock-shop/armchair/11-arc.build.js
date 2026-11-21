function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.78;
  const D = 0.80;
  const H = 0.76;
  const SEAT_H = 0.42;
  const ARM_H = 0.56;
  const ARM_BACK_H = 0.52;
  const LEG_W = 0.052;
  const LEG_D = 0.052;
  const RAIL_H = 0.044;
  const RAIL_Y = 0.255;

  const INNER_W = W - 2 * LEG_W;
  const FRONT_Z = D / 2 - LEG_D / 2;
  const BACK_Z = -D / 2 + LEG_D / 2;
  const ARM_X = W / 2 - LEG_W / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9e6b3b,
    roughness: 0.48,
    metalness: 0.0,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc4bbae,
    roughness: 0.88,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a8e92,
    roughness: 0.35,
    metalness: 0.8,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createRoundedBoxGeo(w, h, d, r, bevelSegs = 4) {
    const shape = new THREE.Shape();
    const hw = w / 2 - r;
    const hh = h / 2 - r;
    shape.moveTo(-hw, -hh - r);
    shape.lineTo(hw, -hh - r);
    shape.quadraticCurveTo(hw + r, -hh - r, hw + r, -hh);
    shape.lineTo(hw + r, hh);
    shape.quadraticCurveTo(hw + r, hh + r, hw, hh + r);
    shape.lineTo(-hw, hh + r);
    shape.quadraticCurveTo(-hw - r, hh + r, -hw - r, hh);
    shape.lineTo(-hw - r, -hh);
    shape.quadraticCurveTo(-hw - r, -hh - r, -hw, -hh - r);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * r,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: bevelSegs,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }

  // 1. Legs
  const frontLegGeo = new THREE.BoxGeometry(LEG_W, ARM_H - 0.015, LEG_D);
  addMesh(frontLegGeo, woodMat, 'front_left_leg', -ARM_X, (ARM_H - 0.015) / 2, FRONT_Z);
  addMesh(frontLegGeo, woodMat, 'front_right_leg', ARM_X, (ARM_H - 0.015) / 2, FRONT_Z);

  const backLegGeo = new THREE.BoxGeometry(LEG_W, ARM_BACK_H - 0.015, LEG_D);
  addMesh(backLegGeo, woodMat, 'back_left_leg', -ARM_X, (ARM_BACK_H - 0.015) / 2, BACK_Z);
  addMesh(backLegGeo, woodMat, 'back_right_leg', ARM_X, (ARM_BACK_H - 0.015) / 2, BACK_Z);

  // 2. Armrests (sloped from front leg top to back leg top)
  const armSpanZ = FRONT_Z - BACK_Z + LEG_D;
  const armRiseY = ARM_H - ARM_BACK_H;
  const armLen = Math.sqrt(armSpanZ * armSpanZ + armRiseY * armRiseY);
  const armAngle = Math.atan2(armRiseY, armSpanZ);
  const armGeo = createRoundedBoxGeo(LEG_W, 0.036, armLen, 0.008, 3);
  const armMidY = (ARM_H + ARM_BACK_H) / 2 - 0.018;

  addMesh(armGeo, woodMat, 'armrest_left', -ARM_X, armMidY, 0, armAngle, 0, 0);
  addMesh(armGeo, woodMat, 'armrest_right', ARM_X, armMidY, 0, armAngle, 0, 0);

  // 3. Wooden Rails
  const frontRailGeo = new THREE.BoxGeometry(INNER_W, RAIL_H, 0.038);
  addMesh(frontRailGeo, woodMat, 'front_rail', 0, RAIL_Y, FRONT_Z);
  addMesh(frontRailGeo, woodMat, 'back_rail', 0, RAIL_Y - 0.02, BACK_Z);

  const sideRailLen = FRONT_Z - BACK_Z - LEG_D;
  const sideRailGeo = new THREE.BoxGeometry(0.038, RAIL_H, sideRailLen);
  addMesh(sideRailGeo, woodMat, 'side_rail_left', -ARM_X, RAIL_Y - 0.01, 0);
  addMesh(sideRailGeo, woodMat, 'side_rail_right', ARM_X, RAIL_Y - 0.01, 0);

  // 4. Metal Corner Brackets
  const bracketGeo = new THREE.BoxGeometry(0.016, 0.028, 0.028);
  addMesh(bracketGeo, metalMat, 'bracket_front_left', -ARM_X + LEG_W / 2 + 0.006, RAIL_Y - 0.02, FRONT_Z);
  addMesh(bracketGeo, metalMat, 'bracket_front_right', ARM_X - LEG_W / 2 - 0.006, RAIL_Y - 0.02, FRONT_Z);
  addMesh(bracketGeo, metalMat, 'bracket_back_left', -ARM_X + LEG_W / 2 + 0.006, ARM_BACK_H - 0.04, BACK_Z + 0.14);
  addMesh(bracketGeo, metalMat, 'bracket_back_right', ARM_X - LEG_W / 2 - 0.006, ARM_BACK_H - 0.04, BACK_Z + 0.14);

  // 5. Upholstered Seat Base & Side Cheeks
  const seatBaseW = INNER_W - 0.008;
  const seatBaseD = D - 0.09;
  const seatBaseH = 0.036;
  const seatBaseY = RAIL_Y + RAIL_H / 2 + seatBaseH / 2 - 0.004;
  const seatBaseGeo = createRoundedBoxGeo(seatBaseW, seatBaseH, seatBaseD, 0.008, 2);
  addMesh(seatBaseGeo, fabricMat, 'seat_base', 0, seatBaseY, 0.005);

  const cheekH = 0.115;
  const cheekW = 0.032;
  const cheekGeo = createRoundedBoxGeo(cheekW, cheekH, seatBaseD - 0.02, 0.01, 2);
  const cheekY = seatBaseY + cheekH / 2 - seatBaseH / 2;
  addMesh(cheekGeo, fabricMat, 'seat_cheek_left', -seatBaseW / 2 + cheekW / 2, cheekY, 0.005);
  addMesh(cheekGeo, fabricMat, 'seat_cheek_right', seatBaseW / 2 - cheekW / 2, cheekY, 0.005);

  // 6. Upholstered Backrest Shell
  const backShellW = seatBaseW - 0.02;
  const backShellH = 0.38;
  const backShellD = 0.045;
  const backShellGeo = createRoundedBoxGeo(backShellW, backShellH, backShellD, 0.012, 3);
  addMesh(backShellGeo, fabricMat, 'back_shell', 0, seatBaseY + backShellH / 2 + 0.01, BACK_Z + 0.08, -0.16, 0, 0);

  // 7. Seat Cushion
  const seatCushionW = seatBaseW - 2 * cheekW - 0.006;
  const seatCushionD = seatBaseD - 0.03;
  const seatCushionH = SEAT_H - (seatBaseY + seatBaseH / 2) + 0.005;
  const seatCushionY = SEAT_H - seatCushionH / 2;
  const seatCushionGeo = createRoundedBoxGeo(seatCushionW, seatCushionH, seatCushionD, 0.024, 4);
  addMesh(seatCushionGeo, fabricMat, 'seat_cushion', 0, seatCushionY, 0.025);

  // 8. Back Cushion
  const backCushionW = seatCushionW - 0.01;
  const backCushionH = H - SEAT_H + 0.02;
  const backCushionD = 0.145;
  const backCushionGeo = createRoundedBoxGeo(backCushionW, backCushionH, backCushionD, 0.028, 4);
  const backCushionY = SEAT_H + backCushionH / 2 - 0.025;
  addMesh(backCushionGeo, fabricMat, 'back_cushion', 0, backCushionY, BACK_Z + 0.175, -0.16, 0, 0);

  return group;
}
