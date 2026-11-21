function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.68;
  const H = 1.02;
  const D = 0.65;
  const SEAT_H = 0.46;
  const SEAT_W = 0.50;
  const SEAT_D = 0.46;
  const BACK_W_BOT = 0.34;
  const BACK_W_MID = 0.46;
  const BACK_W_TOP = 0.28;
  const BACK_H = 0.56;

  const WHEEL_R = 0.026;
  const CASTER_H = WHEEL_R * 2;
  const BASE_R = 0.31;
  const HUB_Y = 0.14;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xbec2c4,
    roughness: 0.85,
    metalness: 0.02
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc88d55,
    roughness: 0.45,
    metalness: 0.05
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    roughness: 0.25,
    metalness: 0.85
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222224,
    roughness: 0.5,
    metalness: 0.4
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.75,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. 5-Star Base Hub
  const hubGeo = new THREE.CylinderGeometry(0.038, 0.042, 0.055, 24);
  addMesh(hubGeo, chromeMat, 'base_hub', 0, HUB_Y, 0);

  // 2. 5 Base Legs & Casters
  const legCount = 5;
  const legLen = BASE_R - 0.02;
  const legGeo = new THREE.CylinderGeometry(0.014, 0.022, legLen, 12);
  legGeo.translate(0, legLen / 2, 0);
  legGeo.rotateX(Math.PI / 2);

  const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.035, 12);
  const housingGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.036, 16);
  housingGeo.rotateZ(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.012, 20);
  wheelGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < legCount; i++) {
    const angle = (i * 2 * Math.PI) / legCount;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Leg
    const leg = addMesh(legGeo, chromeMat, `base_leg_${i + 1}`, sinA * 0.025, HUB_Y + 0.005, cosA * 0.025, 0, angle, 0);
    leg.rotateX(0.22);

    // Tip coordinates
    const tipX = sinA * BASE_R;
    const tipZ = cosA * BASE_R;
    const stemY = CASTER_H + 0.012;

    addMesh(stemGeo, chromeMat, `caster_stem_${i + 1}`, tipX, stemY, tipZ);
    addMesh(housingGeo, darkMetalMat, `caster_housing_${i + 1}`, tipX, WHEEL_R + 0.004, tipZ, 0, angle, 0);

    // Twin wheels
    const offset = 0.014;
    const wx1 = tipX + cosA * offset;
    const wz1 = tipZ - sinA * offset;
    const wx2 = tipX - cosA * offset;
    const wz2 = tipZ + sinA * offset;
    addMesh(wheelGeo, wheelMat, `caster_wheel_${i + 1}_a`, wx1, WHEEL_R, wz1, 0, angle, 0);
    addMesh(wheelGeo, wheelMat, `caster_wheel_${i + 1}_b`, wx2, WHEEL_R, wz2, 0, angle, 0);
  }

  // 3. Gas Lift Cylinder & Mechanism
  const liftOuterH = 0.14;
  const liftOuterGeo = new THREE.CylinderGeometry(0.024, 0.026, liftOuterH, 20);
  addMesh(liftOuterGeo, chromeMat, 'gas_lift_outer', 0, HUB_Y + liftOuterH / 2, 0);

  const liftInnerH = 0.11;
  const liftInnerGeo = new THREE.CylinderGeometry(0.016, 0.016, liftInnerH, 16);
  addMesh(liftInnerGeo, darkMetalMat, 'gas_lift_inner', 0, HUB_Y + liftOuterH + liftInnerH / 2 - 0.02, 0);

  const mechY = SEAT_H - 0.085;
  const mechGeo = new THREE.BoxGeometry(0.14, 0.045, 0.16);
  addMesh(mechGeo, darkMetalMat, 'under_seat_mechanism', 0, mechY, -0.02);

  // Height adjustment lever (viewer's left = -X)
  const leverGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.16, 10);
  leverGeo.rotateZ(Math.PI / 2);
  addMesh(leverGeo, darkMetalMat, 'height_lever_rod', -0.11, mechY - 0.005, 0.01, 0, 0, 0.08);
  const paddleGeo = new THREE.BoxGeometry(0.045, 0.008, 0.025);
  addMesh(paddleGeo, darkMetalMat, 'height_lever_paddle', -0.19, mechY - 0.012, 0.01, 0, 0, 0.08);

  // 4. Bentwood Under-Seat Shell
  const shellShape = new THREE.Shape();
  const sw = SEAT_W * 0.50;
  const sd = SEAT_D * 0.48;
  shellShape.moveTo(-sw + 0.06, -sd);
  shellShape.lineTo(sw - 0.06, -sd);
  shellShape.quadraticCurveTo(sw, -sd, sw, -sd + 0.06);
  shellShape.lineTo(sw, sd - 0.08);
  shellShape.quadraticCurveTo(sw, sd, sw - 0.08, sd);
  shellShape.lineTo(-sw + 0.08, sd);
  shellShape.quadraticCurveTo(-sw, sd, -sw, sd - 0.08);
  shellShape.lineTo(-sw, -sd + 0.06);
  shellShape.quadraticCurveTo(-sw, -sd, -sw + 0.06, -sd);

  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4
  });
  shellGeo.rotateX(Math.PI / 2);
  addMesh(shellGeo, woodMat, 'wood_seat_shell', 0, SEAT_H - 0.032, 0.01);

  // 5. Seat Cushion
  const seatShape = new THREE.Shape();
  const cw = SEAT_W * 0.46;
  const cd = SEAT_D * 0.46;
  seatShape.moveTo(-cw + 0.06, -cd);
  seatShape.lineTo(cw - 0.06, -cd);
  seatShape.quadraticCurveTo(cw, -cd, cw, -cd + 0.06);
  seatShape.lineTo(cw, cd - 0.07);
  seatShape.quadraticCurveTo(cw, cd, cw - 0.07, cd);
  seatShape.lineTo(-cw + 0.07, cd);
  seatShape.quadraticCurveTo(-cw, cd, -cw, cd - 0.07);
  seatShape.lineTo(-cw, -cd + 0.06);
  seatShape.quadraticCurveTo(-cw, -cd, -cw + 0.06, -cd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.038,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.028,
    bevelSegments: 6
  });
  seatGeo.rotateX(Math.PI / 2);
  addMesh(seatGeo, fabricMat, 'seat_cushion', 0, SEAT_H + 0.015, 0.015);

  // 6. Backrest Cushion
  const backShape = new THREE.Shape();
  const bwBot = BACK_W_BOT / 2;
  const bwMid = BACK_W_MID / 2;
  const bwTop = BACK_W_TOP / 2;

  backShape.moveTo(-bwBot + 0.04, 0);
  backShape.lineTo(bwBot - 0.04, 0);
  backShape.quadraticCurveTo(bwBot, 0, bwMid, BACK_H * 0.34);
  backShape.quadraticCurveTo(bwMid + 0.01, BACK_H * 0.52, bwTop + 0.02, BACK_H - 0.06);
  backShape.quadraticCurveTo(bwTop + 0.01, BACK_H, bwTop - 0.05, BACK_H);
  backShape.lineTo(-bwTop + 0.05, BACK_H);
  backShape.quadraticCurveTo(-bwTop - 0.01, BACK_H, -bwTop - 0.02, BACK_H - 0.06);
  backShape.quadraticCurveTo(-bwMid - 0.01, BACK_H * 0.52, -bwMid, BACK_H * 0.34);
  backShape.quadraticCurveTo(-bwBot, 0, -bwBot + 0.04, 0);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.026,
    bevelSize: 0.026,
    bevelSegments: 6
  });
  addMesh(backGeo, fabricMat, 'backrest_cushion', 0, SEAT_H - 0.01, -SEAT_D * 0.40, -0.14, 0, 0);

  // 7. Sweeping Bentwood Armrests (Left & Right)
  for (const side of [-1, 1]) {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * (SEAT_W * 0.40), SEAT_H - 0.035, 0.02),
      new THREE.Vector3(side * (W * 0.44), SEAT_H + 0.01, 0.06),
      new THREE.Vector3(side * (W * 0.48), SEAT_H + 0.16, 0.08),
      new THREE.Vector3(side * (W * 0.46), SEAT_H + 0.18, -0.02),
      new THREE.Vector3(side * (BACK_W_MID * 0.48), SEAT_H + 0.17, -SEAT_D * 0.36)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 28, 0.022, 12, false);
    const armName = side === -1 ? 'armrest_left' : 'armrest_right';
    const arm = addMesh(armGeo, woodMat, armName);
    arm.scale.set(0.85, 1.0, 1.0);
  }

  return group;
}
