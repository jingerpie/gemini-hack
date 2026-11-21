function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.68;
  const D = 0.66;
  const H = 1.02;
  const SEAT_H = 0.45;
  const SEAT_W = 0.50;
  const SEAT_D = 0.48;
  const BASE_R = 0.31;
  const CASTER_R = 0.026;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x5c768d,
    roughness: 0.88,
    metalness: 0.0,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd8b894,
    roughness: 0.52,
    metalness: 0.0,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xc8cdd2,
    roughness: 0.25,
    metalness: 0.88,
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,
    roughness: 0.5,
    metalness: 0.2,
  });
  const casterMat = new THREE.MeshStandardMaterial({
    color: 0x6e7275,
    roughness: 0.65,
    metalness: 0.1,
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

  // 1. 5-Star Base & Casters
  const hubY = 0.185;
  const hubGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.055, 24);
  addMesh(hubGeo, chromeMat, 'base_hub', 0, hubY, 0);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + Math.PI / 5;
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);

    // Leg arm sloping from hub down to caster socket
    const legLen = BASE_R - 0.02;
    const legGeo = new THREE.BoxGeometry(0.026, 0.022, legLen);
    const leg = addMesh(
      legGeo,
      chromeMat,
      `base_leg_${i + 1}`,
      dirX * (legLen * 0.5 + 0.02),
      hubY - 0.045,
      dirZ * (legLen * 0.5 + 0.02),
      0,
      angle,
      0
    );
    leg.rotateX(0.32);

    // Caster stem/hood
    const tipX = dirX * BASE_R;
    const tipZ = dirZ * BASE_R;
    const hoodGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.038, 16);
    addMesh(hoodGeo, chromeMat, `caster_hood_${i + 1}`, tipX, CASTER_R * 2 + 0.015, tipZ);

    // Dual-wheel caster
    const wheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.042, 20);
    addMesh(
      wheelGeo,
      casterMat,
      `caster_wheel_${i + 1}`,
      tipX,
      CASTER_R,
      tipZ,
      0,
      angle,
      Math.PI / 2
    );
  }

  // 2. Gas Lift Column
  const outerColGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 20);
  addMesh(outerColGeo, chromeMat, 'gas_lift_outer', 0, 0.24, 0);

  const innerColGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 20);
  addMesh(innerColGeo, chromeMat, 'gas_lift_inner', 0, 0.33, 0);

  // 3. Under-seat Mechanism
  const mechGeo = new THREE.BoxGeometry(0.16, 0.045, 0.18);
  addMesh(mechGeo, blackMat, 'tilt_mechanism', 0, 0.39, -0.02);

  // Tension knob
  const knobGeo = new THREE.CylinderGeometry(0.022, 0.026, 0.055, 16);
  addMesh(knobGeo, blackMat, 'tension_knob', 0.02, 0.355, 0.04);

  // Height adjustment lever (extends to chair's right / -X)
  const leverRodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.20, 12);
  addMesh(leverRodGeo, blackMat, 'height_lever_rod', -0.14, 0.385, 0.01, 0, 0, Math.PI / 2 + 0.15);

  const leverHandleGeo = new THREE.BoxGeometry(0.05, 0.016, 0.024);
  addMesh(leverHandleGeo, blackMat, 'height_lever_handle', -0.24, 0.365, 0.01, 0, 0, 0.2);

  // 4. Seat Wood Shell & Cushion
  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2;
  const sd = SEAT_D / 2;
  seatShape.moveTo(-sw + 0.05, -sd);
  seatShape.lineTo(sw - 0.05, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + 0.06);
  seatShape.lineTo(sw, sd - 0.07);
  seatShape.quadraticCurveTo(sw, sd, sw - 0.07, sd);
  seatShape.lineTo(-sw + 0.07, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - 0.07);
  seatShape.lineTo(-sw, -sd + 0.06);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + 0.05, -sd);

  const seatShellGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
  });
  seatShellGeo.rotateX(Math.PI / 2);
  addMesh(seatShellGeo, woodMat, 'seat_wood_shell', 0, SEAT_H - 0.025, 0.02);

  const seatCushionGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 4,
  });
  seatCushionGeo.rotateX(Math.PI / 2);
  addMesh(seatCushionGeo, fabricMat, 'seat_cushion', 0, SEAT_H + 0.035, 0.02);

  // 5. Backrest (Wood Shell + Upholstered Cushion)
  const backW = 0.48;
  const backTopW = 0.38;
  const backH = H - SEAT_H + 0.04;
  const backShape = new THREE.Shape();
  backShape.moveTo(-backW / 2 + 0.04, 0);
  backShape.lineTo(backW / 2 - 0.04, 0);
  backShape.quadraticCurveTo(backW / 2, 0, backW / 2, 0.06);
  backShape.lineTo(backTopW / 2, backH - 0.05);
  backShape.quadraticCurveTo(backTopW / 2, backH, backTopW / 2 - 0.05, backH);
  backShape.lineTo(-backTopW / 2 + 0.05, backH);
  backShape.quadraticCurveTo(-backTopW / 2, backH, -backTopW / 2, backH - 0.05);
  backShape.lineTo(-backW / 2, 0.06);
  backShape.quadraticCurveTo(-backW / 2, 0, -backW / 2 + 0.04, 0);

  const backTilt = -0.18;
  const backZ = -SEAT_D / 2 + 0.02;

  const backWoodGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
  });
  addMesh(backWoodGeo, woodMat, 'backrest_wood_shell', 0, SEAT_H - 0.02, backZ - 0.018, backTilt, 0, 0);

  const backCushionGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 4,
  });
  addMesh(backCushionGeo, fabricMat, 'backrest_cushion', 0, SEAT_H - 0.015, backZ, backTilt, 0, 0);

  // 6. Integrated Upholstered Armrests
  const armShape = new THREE.Shape();
  armShape.moveTo(-0.18, 0);
  armShape.lineTo(0.14, 0);
  armShape.quadraticCurveTo(0.19, 0.01, 0.18, 0.08);
  armShape.lineTo(0.15, 0.18);
  armShape.quadraticCurveTo(0.14, 0.22, 0.08, 0.22);
  armShape.lineTo(-0.16, 0.22);
  armShape.quadraticCurveTo(-0.21, 0.22, -0.21, 0.16);
  armShape.lineTo(-0.20, 0.02);
  armShape.closePath();

  const armPanelGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  armPanelGeo.rotateY(Math.PI / 2);

  const armCapGeo = new THREE.BoxGeometry(0.065, 0.032, 0.30);

  [-1, 1].forEach((side) => {
    const label = side === -1 ? 'right' : 'left';
    const armX = side * (SEAT_W / 2 + 0.015);
    addMesh(
      armPanelGeo,
      fabricMat,
      `armrest_panel_${label}`,
      armX - (side === 1 ? 0.018 : 0.018),
      SEAT_H - 0.01,
      0.01,
      0,
      0,
      side * -0.08
    );

    addMesh(
      armCapGeo,
      fabricMat,
      `armrest_cap_${label}`,
      side * (SEAT_W / 2 + 0.032),
      SEAT_H + 0.205,
      -0.01
    );
  });

  return group;
}
