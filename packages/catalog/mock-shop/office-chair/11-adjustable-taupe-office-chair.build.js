function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.64;
  const H = 0.88;
  const D = 0.62;
  const SEAT_H = 0.45;
  const BASE_R = 0.31;
  const GLIDE_H = 0.012;
  const HUB_Y = 0.115;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xa3876a,
    roughness: 0.88,
    metalness: 0.0
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x6b5a4e,
    roughness: 0.55,
    metalness: 0.25
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.18,
    metalness: 0.9
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.5,
    metalness: 0.15
  });

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. 5-Star Base
  const hub = addMesh(new THREE.CylinderGeometry(0.036, 0.04, 0.07, 24), baseMat, 'base_hub');
  hub.position.set(0, HUB_Y, 0);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Angled leg arm
    const legLen = BASE_R - 0.02;
    const legGeo = new THREE.CylinderGeometry(0.014, 0.022, legLen, 12);
    legGeo.rotateZ(Math.PI / 2);
    const leg = addMesh(legGeo, baseMat, `base_leg_${i + 1}`);
    const midR = legLen * 0.5 + 0.02;
    leg.position.set(cos * midR, HUB_Y - 0.032, sin * midR);
    leg.rotation.y = -angle;
    leg.rotation.z = -0.21;

    // Vertical tip drop
    const tipR = BASE_R;
    const tip = addMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 12), baseMat, `base_tip_${i + 1}`);
    tip.position.set(cos * tipR, GLIDE_H + 0.0225, sin * tipR);

    // Black glide pad touching y = 0
    const glide = addMesh(new THREE.CylinderGeometry(0.015, 0.016, GLIDE_H, 12), blackMat, `base_glide_${i + 1}`);
    glide.position.set(cos * tipR, GLIDE_H * 0.5, sin * tipR);
  }

  // 2. Gas Lift Column & Mechanism
  const outerCol = addMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.14, 20), baseMat, 'outer_column');
  outerCol.position.set(0, HUB_Y + 0.08, 0);

  const piston = addMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 20), chromeMat, 'piston_rod');
  piston.position.set(0, HUB_Y + 0.165, 0);

  const mechCollar = addMesh(new THREE.CylinderGeometry(0.032, 0.03, 0.045, 20), blackMat, 'mech_collar');
  mechCollar.position.set(0, HUB_Y + 0.205, 0);

  const mechBox = addMesh(new THREE.BoxGeometry(0.12, 0.035, 0.14), blackMat, 'mech_housing');
  mechBox.position.set(0, SEAT_H - 0.085, -0.01);

  // Height adjustment lever (on viewer's left = -X)
  const leverRodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.19, 10);
  leverRodGeo.rotateZ(Math.PI / 2);
  const leverRod = addMesh(leverRodGeo, blackMat, 'lever_rod');
  leverRod.position.set(-0.12, SEAT_H - 0.08, 0.02);

  const leverHandle = addMesh(new THREE.CapsuleGeometry(0.012, 0.035, 6, 12), blackMat, 'lever_handle');
  leverHandle.position.set(-0.22, SEAT_H - 0.095, 0.02);
  leverHandle.rotation.z = -0.6;

  // 3. Upholstered Seat Shell & Cushion
  // Under-seat shell
  const shellShape = new THREE.Shape();
  const sw = 0.25;
  const sd = 0.24;
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
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 4
  });
  shellGeo.rotateX(Math.PI / 2);
  const seatShell = addMesh(shellGeo, fabricMat, 'seat_shell');
  seatShell.position.set(0, SEAT_H - 0.025, 0.02);

  // Plush seat cushion
  const cushionGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 5
  });
  cushionGeo.rotateX(Math.PI / 2);
  const seatCushion = addMesh(cushionGeo, fabricMat, 'seat_cushion');
  seatCushion.scale.set(0.92, 1.0, 0.9);
  seatCushion.position.set(0, SEAT_H + 0.032, 0.035);

  // 4. Backrest
  const backH = H - SEAT_H;
  const backShape = new THREE.Shape();
  const bwBot = 0.25;
  const bwTop = 0.175;
  backShape.moveTo(-bwBot, 0);
  backShape.lineTo(bwBot, 0);
  backShape.quadraticCurveTo(bwBot + 0.01, backH * 0.45, bwTop + 0.02, backH - 0.05);
  backShape.quadraticCurveTo(bwTop + 0.01, backH, bwTop - 0.05, backH);
  backShape.lineTo(-bwTop + 0.05, backH);
  backShape.quadraticCurveTo(-bwTop - 0.01, backH, -bwTop - 0.02, backH - 0.05);
  backShape.quadraticCurveTo(-bwBot - 0.01, backH * 0.45, -bwBot, 0);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 5
  });
  const backrest = addMesh(backGeo, fabricMat, 'backrest');
  backrest.position.set(0, SEAT_H - 0.02, -0.22);
  backrest.rotation.x = -0.11;

  // 5. Wrap-around Armrests
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.22, 0.0);
  armShape.lineTo(0.14, 0.0);
  armShape.quadraticCurveTo(0.22, 0.01, 0.23, 0.11);
  armShape.quadraticCurveTo(0.235, 0.19, 0.17, 0.2);
  armShape.lineTo(0.06, 0.19);
  armShape.quadraticCurveTo(-0.04, 0.18, -0.14, 0.24);
  armShape.lineTo(-0.22, 0.24);
  armShape.closePath();

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 4
  });

  const armLeft = addMesh(armGeo, fabricMat, 'armrest_left');
  armLeft.rotation.y = -Math.PI / 2;
  armLeft.rotation.x = 0.12;
  armLeft.position.set(-W * 0.5 + 0.075, SEAT_H - 0.02, 0.0);

  const armRight = addMesh(armGeo, fabricMat, 'armrest_right');
  armRight.rotation.y = -Math.PI / 2;
  armRight.rotation.x = -0.12;
  armRight.position.set(W * 0.5 - 0.035, SEAT_H - 0.02, 0.0);

  return group;
}
