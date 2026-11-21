function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.62;
  const H = 0.82;
  const D = 0.58;
  const SEAT_H = 0.46;
  const BASE_R = 0.30;
  const GLIDE_H = 0.014;
  const FOOT_H = 0.005;
  const SHELL_T = 0.016;
  const CUSHION_T = 0.055;
  const BACK_TILT = -0.14;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa06e42,
    roughness: 0.45,
    metalness: 0.05
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9c968c,
    roughness: 0.88,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x7d7b76,
    roughness: 0.35,
    metalness: 0.78
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.85,
    metalness: 0.05
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  // Helper: rounded trapezoid THREE.Shape for backrest
  function backrestShape(wBot, wTop, h, r) {
    const s = new THREE.Shape();
    const hb = wBot / 2;
    const ht = wTop / 2;
    s.moveTo(-hb + r, 0);
    s.lineTo(hb - r, 0);
    s.quadraticCurveTo(hb, 0, hb - r * 0.15, r);
    s.lineTo(ht + r * 0.15, h - r);
    s.quadraticCurveTo(ht, h, ht - r, h);
    s.lineTo(-ht + r, h);
    s.quadraticCurveTo(-ht, h, -ht - r * 0.15, h - r);
    s.lineTo(-hb + r * 0.15, r);
    s.quadraticCurveTo(-hb, 0, -hb + r, 0);
    return s;
  }

  // 1. 5-Star Metal Base
  const hubY = 0.125;
  const hubGeo = new THREE.CylinderGeometry(0.034, 0.036, 0.075, 24);
  const hub = addMesh(hubGeo, metalMat, 'base_hub');
  hub.position.set(0, hubY, 0);

  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Leg curve from hub to outer knee and down to glide
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sinA * 0.028, hubY + 0.01, cosA * 0.028),
      new THREE.Vector3(sinA * (BASE_R * 0.52), hubY - 0.02, cosA * (BASE_R * 0.52)),
      new THREE.Vector3(sinA * BASE_R, 0.062, cosA * BASE_R),
      new THREE.Vector3(sinA * BASE_R, FOOT_H + GLIDE_H * 0.5, cosA * BASE_R)
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 16, 0.013, 12, false);
    addMesh(legGeo, metalMat, `base_leg_${i + 1}`);

    // Metal glide disc
    const glideGeo = new THREE.CylinderGeometry(0.022, 0.024, GLIDE_H, 20);
    const glide = addMesh(glideGeo, metalMat, `base_glide_${i + 1}`);
    glide.position.set(sinA * BASE_R, FOOT_H + GLIDE_H / 2, cosA * BASE_R);

    // Rubber foot pad touching y = 0
    const footGeo = new THREE.CylinderGeometry(0.022, 0.022, FOOT_H, 20);
    const foot = addMesh(footGeo, darkRubberMat, `base_foot_${i + 1}`);
    foot.position.set(sinA * BASE_R, FOOT_H / 2, cosA * BASE_R);
  }

  // 2. Gas Lift & Under-seat Mechanism
  const mechY = SEAT_H - 0.07;
  const sleeveGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.14, 20);
  const sleeve = addMesh(sleeveGeo, metalMat, 'gas_lift_sleeve');
  sleeve.position.set(0, hubY + 0.09, 0);

  const pistonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 20);
  const piston = addMesh(pistonGeo, metalMat, 'gas_lift_piston');
  piston.position.set(0, mechY - 0.07, 0);

  const mechGeo = new THREE.CylinderGeometry(0.065, 0.045, 0.028, 20);
  const mech = addMesh(mechGeo, metalMat, 'seat_mechanism_plate');
  mech.position.set(0, mechY, 0);

  // Height adjustment lever on viewer's left (-X)
  const leverGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.17, 10);
  const lever = addMesh(leverGeo, metalMat, 'height_lever');
  lever.rotation.z = Math.PI / 2 + 0.24;
  lever.position.set(-0.11, mechY - 0.02, 0.01);

  // 3. Molded Wood Seat Base & Seat Cushion
  const seatBaseY = SEAT_H - 0.055;
  const seatWoodShape = roundedRectShape(W * 0.82, D * 0.78, 0.08);
  const seatWoodGeo = new THREE.ExtrudeGeometry(seatWoodShape, {
    depth: SHELL_T,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3
  });
  seatWoodGeo.rotateX(Math.PI / 2);
  const seatWood = addMesh(seatWoodGeo, woodMat, 'wood_seat_shell');
  seatWood.position.set(0, seatBaseY + SHELL_T, 0.02);

  const seatCushionShape = roundedRectShape(W * 0.76, D * 0.72, 0.07);
  const seatCushionGeo = new THREE.ExtrudeGeometry(seatCushionShape, {
    depth: CUSHION_T * 0.65,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 4
  });
  seatCushionGeo.rotateX(Math.PI / 2);
  const seatCushion = addMesh(seatCushionGeo, fabricMat, 'seat_cushion');
  seatCushion.position.set(0, seatBaseY + SHELL_T + CUSHION_T * 0.65 + 0.012, 0.025);

  // 4. Molded Wood Backrest & Backrest Cushion
  const backPivotY = seatBaseY + 0.02;
  const backPivotZ = -D * 0.34;
  const backH = H - backPivotY - 0.015;

  const backWoodShape = backrestShape(W * 0.76, W * 0.56, backH, 0.08);
  const backWoodGeo = new THREE.ExtrudeGeometry(backWoodShape, {
    depth: SHELL_T,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3
  });
  const backWood = addMesh(backWoodGeo, woodMat, 'wood_backrest_shell');
  backWood.position.set(0, backPivotY, backPivotZ);
  backWood.rotation.x = BACK_TILT;

  const backCushionShape = backrestShape(W * 0.69, W * 0.51, backH - 0.025, 0.075);
  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: CUSHION_T * 0.7,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 4
  });
  const backCushion = addMesh(backCushionGeo, fabricMat, 'backrest_cushion');
  backCushion.position.set(0, backPivotY + 0.012, backPivotZ + SHELL_T + 0.008);
  backCushion.rotation.x = BACK_TILT;

  // 5. Molded Wood Side Wings / Armrests & Inner Arm Pads
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.17, 0.0);
  armShape.lineTo(0.15, 0.0);
  armShape.quadraticCurveTo(0.20, 0.01, 0.20, 0.14);
  armShape.quadraticCurveTo(0.20, 0.20, 0.15, 0.20);
  armShape.quadraticCurveTo(0.06, 0.20, -0.02, 0.23);
  armShape.lineTo(-0.15, 0.31);
  armShape.lineTo(-0.19, 0.18);
  armShape.closePath();

  const armWoodGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: SHELL_T,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3
  });
  armWoodGeo.rotateY(Math.PI / 2);

  const armPadShape = new THREE.Shape();
  armPadShape.moveTo(-0.14, 0.02);
  armPadShape.lineTo(0.13, 0.02);
  armPadShape.quadraticCurveTo(0.175, 0.03, 0.175, 0.135);
  armPadShape.quadraticCurveTo(0.175, 0.18, 0.13, 0.18);
  armPadShape.quadraticCurveTo(0.04, 0.18, -0.04, 0.15);
  armPadShape.lineTo(-0.14, 0.11);
  armPadShape.closePath();

  const armPadGeo = new THREE.ExtrudeGeometry(armPadShape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  armPadGeo.rotateY(Math.PI / 2);

  const armX = W * 0.42;
  const armY = seatBaseY + 0.008;
  const armZ = 0.02;

  const leftArmWood = addMesh(armWoodGeo, woodMat, 'wood_armrest_left');
  leftArmWood.position.set(-armX - SHELL_T, armY, armZ);
  leftArmWood.rotation.z = 0.06;

  const rightArmWood = addMesh(armWoodGeo, woodMat, 'wood_armrest_right');
  rightArmWood.position.set(armX, armY, armZ);
  rightArmWood.rotation.z = -0.06;

  const leftArmPad = addMesh(armPadGeo, fabricMat, 'arm_pad_left');
  leftArmPad.position.set(-armX + 0.004, armY + 0.005, armZ);
  leftArmPad.rotation.z = 0.06;

  const rightArmPad = addMesh(armPadGeo, fabricMat, 'arm_pad_right');
  rightArmPad.position.set(armX - 0.030, armY + 0.005, armZ);
  rightArmPad.rotation.z = -0.06;

  return group;
}
