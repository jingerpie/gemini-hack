function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const H = 0.80;
  const D = 0.52;
  const SEAT_H = 0.45;
  const LEG_TOP_W = 0.036;
  const LEG_BOT_W = 0.026;
  const RAIL_H = 0.055;
  const RAIL_T = 0.028;
  const SEAT_CUSHION_H = 0.042;
  const BACK_CUSHION_H = 0.22;
  const BACK_CUSHION_T = 0.042;
  const GLIDE_H = 0.004;

  const HALF_W = W / 2;
  const HALF_D = D / 2;
  const FRONT_Z = HALF_D - LEG_TOP_W / 2 - 0.01;
  const BACK_Z = -HALF_D + LEG_TOP_W / 2 + 0.03;
  const FRONT_X = HALF_W - LEG_TOP_W / 2 - 0.01;
  const BACK_X = HALF_W - LEG_TOP_W / 2 - 0.025;
  const RAIL_TOP_Y = SEAT_H - SEAT_CUSHION_H + 0.006;
  const RAIL_Y = RAIL_TOP_Y - RAIL_H / 2;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b5a,
    roughness: 0.58,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe5dfd3,
    roughness: 0.9,
    metalness: 0.0,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.85,
    metalness: 0.0,
  });

  function makeMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Helper for tapered square leg
  function createTaperedLeg(topW, botW, height) {
    const rTop = topW / Math.SQRT2;
    const rBot = botW / Math.SQRT2;
    const geo = new THREE.CylinderGeometry(rTop, rBot, height, 4, 1);
    geo.rotateY(Math.PI / 4);
    return geo;
  }

  // 1. Front Legs
  const frontLegH = RAIL_TOP_Y - GLIDE_H;
  const frontLegGeo = createTaperedLeg(LEG_TOP_W, LEG_BOT_W, frontLegH);

  const frontLeftLeg = makeMesh(frontLegGeo, oakMat, 'front_left_leg');
  frontLeftLeg.position.set(-FRONT_X, GLIDE_H + frontLegH / 2, FRONT_Z);
  group.add(frontLeftLeg);

  const frontRightLeg = makeMesh(frontLegGeo, oakMat, 'front_right_leg');
  frontRightLeg.position.set(FRONT_X, GLIDE_H + frontLegH / 2, FRONT_Z);
  group.add(frontRightLeg);

  // 2. Back Legs (lower section up to seat rail)
  const backLegLowerH = RAIL_TOP_Y - GLIDE_H;
  const backLegLowerGeo = createTaperedLeg(LEG_TOP_W, LEG_BOT_W, backLegLowerH);

  const backLeftLeg = makeMesh(backLegLowerGeo, oakMat, 'back_left_leg');
  backLeftLeg.position.set(-BACK_X, GLIDE_H + backLegLowerH / 2, BACK_Z);
  group.add(backLeftLeg);

  const backRightLeg = makeMesh(backLegLowerGeo, oakMat, 'back_right_leg');
  backRightLeg.position.set(BACK_X, GLIDE_H + backLegLowerH / 2, BACK_Z);
  group.add(backRightLeg);

  // 3. Leg Glides (touching y = 0)
  const glideGeo = new THREE.CylinderGeometry(LEG_BOT_W * 0.45, LEG_BOT_W * 0.45, GLIDE_H, 12);
  const glidePositions = [
    [-FRONT_X, FRONT_Z, 'front_left_glide'],
    [FRONT_X, FRONT_Z, 'front_right_glide'],
    [-BACK_X, BACK_Z, 'back_left_glide'],
    [BACK_X, BACK_Z, 'back_right_glide'],
  ];
  for (const [gx, gz, gname] of glidePositions) {
    const glide = makeMesh(glideGeo, glideMat, gname);
    glide.position.set(gx, GLIDE_H / 2, gz);
    group.add(glide);
  }

  // 4. Backrest Stiles (angled slightly back and inward)
  const stileH = H - RAIL_TOP_Y + 0.01;
  const stileGeo = new THREE.BoxGeometry(LEG_TOP_W * 0.88, stileH, LEG_TOP_W * 0.95);
  const stileTiltZ = -0.10; // lean back
  const stileTiltX = 0.035; // slight inward taper

  const backLeftStile = makeMesh(stileGeo, oakMat, 'back_left_stile');
  backLeftStile.position.set(
    -BACK_X + Math.sin(stileTiltX) * (stileH / 2),
    RAIL_TOP_Y + stileH / 2 - 0.01,
    BACK_Z + Math.sin(stileTiltZ) * (stileH / 2)
  );
  backLeftStile.rotation.set(stileTiltZ, 0, -stileTiltX);
  group.add(backLeftStile);

  const backRightStile = makeMesh(stileGeo, oakMat, 'back_right_stile');
  backRightStile.position.set(
    BACK_X - Math.sin(stileTiltX) * (stileH / 2),
    RAIL_TOP_Y + stileH / 2 - 0.01,
    BACK_Z + Math.sin(stileTiltZ) * (stileH / 2)
  );
  backRightStile.rotation.set(stileTiltZ, 0, stileTiltX);
  group.add(backRightStile);

  // 5. Seat Rails (Front arched rail, back rail, side rails)
  const frontRailSpan = FRONT_X * 2;
  const frontRailShape = new THREE.Shape();
  const frHalf = frontRailSpan / 2;
  frontRailShape.moveTo(-frHalf, -RAIL_H / 2);
  frontRailShape.quadraticCurveTo(0, -RAIL_H / 2 + 0.014, frHalf, -RAIL_H / 2);
  frontRailShape.lineTo(frHalf, RAIL_H / 2);
  frontRailShape.quadraticCurveTo(0, RAIL_H / 2 - 0.006, -frHalf, RAIL_H / 2);
  frontRailShape.closePath();

  const frontRailGeo = new THREE.ExtrudeGeometry(frontRailShape, {
    depth: RAIL_T,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  frontRailGeo.center();
  const frontRail = makeMesh(frontRailGeo, oakMat, 'front_seat_rail');
  frontRail.position.set(0, RAIL_Y, FRONT_Z);
  group.add(frontRail);

  const backRailSpan = BACK_X * 2;
  const backRailGeo = new THREE.BoxGeometry(backRailSpan, RAIL_H * 0.85, RAIL_T);
  const backRail = makeMesh(backRailGeo, oakMat, 'back_seat_rail');
  backRail.position.set(0, RAIL_Y, BACK_Z);
  group.add(backRail);

  const sideRailLen = FRONT_Z - BACK_Z;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H * 0.9, sideRailLen);
  const sideAngle = Math.atan2(FRONT_X - BACK_X, sideRailLen);

  const leftSideRail = makeMesh(sideRailGeo, oakMat, 'left_seat_rail');
  leftSideRail.position.set(-(FRONT_X + BACK_X) / 2, RAIL_Y, (FRONT_Z + BACK_Z) / 2);
  leftSideRail.rotation.y = sideAngle;
  group.add(leftSideRail);

  const rightSideRail = makeMesh(sideRailGeo, oakMat, 'right_seat_rail');
  rightSideRail.position.set((FRONT_X + BACK_X) / 2, RAIL_Y, (FRONT_Z + BACK_Z) / 2);
  rightSideRail.rotation.y = -sideAngle;
  group.add(rightSideRail);

  // 6. Seat Cushion (rounded rectangle extruded & beveled)
  const seatW = FRONT_X * 2 + LEG_TOP_W * 0.5;
  const seatD = FRONT_Z - BACK_Z + LEG_TOP_W * 0.6;
  const seatR = 0.035;
  const seatShape = new THREE.Shape();
  const sw2 = seatW / 2 - seatR;
  const sd2 = seatD / 2 - seatR;
  seatShape.moveTo(-sw2, -seatD / 2);
  seatShape.lineTo(sw2, -seatD / 2);
  seatShape.quadraticCurveTo(seatW / 2, -seatD / 2, seatW / 2, -sd2);
  seatShape.lineTo(seatW / 2, sd2);
  seatShape.quadraticCurveTo(seatW / 2, seatD / 2, sw2, seatD / 2);
  seatShape.lineTo(-sw2, seatD / 2);
  seatShape.quadraticCurveTo(-seatW / 2, seatD / 2, -seatW / 2, sd2);
  seatShape.lineTo(-seatW / 2, -sd2);
  seatShape.quadraticCurveTo(-seatW / 2, -seatD / 2, -sw2, -seatD / 2);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_CUSHION_H * 0.55,
    bevelEnabled: true,
    bevelThickness: SEAT_CUSHION_H * 0.28,
    bevelSize: 0.016,
    bevelSegments: 4,
  });
  seatGeo.rotateX(Math.PI / 2);
  seatGeo.center();

  const seatCushion = makeMesh(seatGeo, fabricMat, 'seat_cushion');
  seatCushion.position.set(0, RAIL_TOP_Y + SEAT_CUSHION_H * 0.45, (FRONT_Z + BACK_Z) / 2 + 0.005);
  group.add(seatCushion);

  // 7. Backrest Cushion (suspended between stiles)
  const backCushionW = BACK_X * 2 - LEG_TOP_W * 0.95;
  const brR = 0.015;
  const backShape = new THREE.Shape();
  const bw2 = backCushionW / 2 - brR;
  const bh2 = BACK_CUSHION_H / 2 - brR;
  backShape.moveTo(-bw2, -BACK_CUSHION_H / 2);
  backShape.lineTo(bw2, -BACK_CUSHION_H / 2);
  backShape.quadraticCurveTo(backCushionW / 2, -BACK_CUSHION_H / 2, backCushionW / 2, -bh2);
  backShape.lineTo(backCushionW / 2, bh2);
  backShape.quadraticCurveTo(backCushionW / 2, BACK_CUSHION_H / 2, bw2, BACK_CUSHION_H / 2);
  backShape.lineTo(-bw2, BACK_CUSHION_H / 2);
  backShape.quadraticCurveTo(-backCushionW / 2, BACK_CUSHION_H / 2, -backCushionW / 2, bh2);
  backShape.lineTo(-backCushionW / 2, -bh2);
  backShape.quadraticCurveTo(-backCushionW / 2, -BACK_CUSHION_H / 2, -bw2, -BACK_CUSHION_H / 2);

  const backCushionGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_CUSHION_T * 0.6,
    bevelEnabled: true,
    bevelThickness: BACK_CUSHION_T * 0.25,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  backCushionGeo.center();

  const backCenterY = H - BACK_CUSHION_H / 2 - 0.015;
  const backCenterZ = BACK_Z + Math.sin(stileTiltZ) * (backCenterY - RAIL_TOP_Y) + 0.005;

  const backrestCushion = makeMesh(backCushionGeo, fabricMat, 'backrest_cushion');
  backrestCushion.position.set(0, backCenterY, backCenterZ);
  backrestCushion.rotation.x = stileTiltZ;
  group.add(backrestCushion);

  return group;
}
