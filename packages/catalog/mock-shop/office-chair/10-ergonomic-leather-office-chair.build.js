function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.72;
  const H = 1.15;
  const D = 0.70;
  const SEAT_H = 0.47;
  const BASE_R = 0.32;
  const CASTER_R = 0.028;
  const HUB_Y = 0.145;
  const MECH_Y = 0.39;
  const SEAT_W = 0.52;
  const SEAT_D = 0.50;
  const ARM_X = 0.325;
  const ARM_Y = 0.665;

  // Materials
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0xb8733c,
    roughness: 0.48,
    metalness: 0.05,
  });
  const leatherDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9e5e2e,
    roughness: 0.52,
    metalness: 0.05,
  });
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.24,
    metalness: 0.86,
  });
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1d1d1f,
    roughness: 0.62,
    metalness: 0.12,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = group) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // 1. 5-Star Base & Casters
  const hubGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.055, 24);
  addMesh(hubGeo, aluminumMat, 'base_center_hub', 0, HUB_Y, 0);

  const legLen = BASE_R - 0.025;
  const legGeo = new THREE.BoxGeometry(0.036, 0.026, legLen);
  const casterWheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.042, 20);
  const casterStemGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.035, 12);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + Math.PI / 5;
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);

    // Tapered-look leg angled downward from hub to caster
    const midR = 0.025 + legLen * 0.5;
    const legY = (HUB_Y + 0.068) * 0.5;
    const pitch = Math.atan2(HUB_Y - 0.068, legLen);
    const leg = addMesh(
      legGeo,
      aluminumMat,
      `base_leg_${i + 1}`,
      dirX * midR,
      legY,
      dirZ * midR,
      0,
      angle,
      0
    );
    leg.rotateX(pitch);

    // Caster stem
    addMesh(
      casterStemGeo,
      aluminumMat,
      `caster_stem_${i + 1}`,
      dirX * BASE_R,
      CASTER_R * 2 + 0.005,
      dirZ * BASE_R
    );

    // Caster wheel (touching y = 0)
    addMesh(
      casterWheelGeo,
      blackPlasticMat,
      `caster_wheel_${i + 1}`,
      dirX * BASE_R,
      CASTER_R,
      dirZ * BASE_R,
      0,
      angle,
      Math.PI / 2
    );
  }

  // 2. Gas Lift Cylinder
  const gasLowerGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.13, 20);
  addMesh(gasLowerGeo, aluminumMat, 'gas_lift_lower', 0, HUB_Y + 0.065, 0);

  const gasUpperGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.14, 20);
  addMesh(gasUpperGeo, blackPlasticMat, 'gas_lift_shroud', 0, HUB_Y + 0.175, 0);

  // 3. Under-seat Mechanism & Lever
  const mechGeo = new THREE.BoxGeometry(0.18, 0.05, 0.20);
  addMesh(mechGeo, blackPlasticMat, 'seat_mechanism', 0, MECH_Y, -0.01);

  const leverBarGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10);
  addMesh(leverBarGeo, blackPlasticMat, 'tilt_lever_rod', -0.14, MECH_Y - 0.005, 0.03, 0, 0, Math.PI / 2);

  const leverHandleGeo = new THREE.BoxGeometry(0.045, 0.022, 0.028);
  addMesh(leverHandleGeo, blackPlasticMat, 'tilt_lever_handle', -0.22, MECH_Y - 0.012, 0.03, 0, 0, 0.25);

  // 4. Seat Shell & Cushion
  const seatShellGeo = new THREE.BoxGeometry(SEAT_W + 0.04, 0.065, SEAT_D + 0.02);
  addMesh(seatShellGeo, leatherDarkMat, 'seat_outer_shell', 0, SEAT_H - 0.045, 0.01, -0.03, 0, 0);

  // Rounded seat cushion
  const cushionShape = new THREE.Shape();
  const cw = SEAT_W * 0.5;
  const cd = SEAT_D * 0.5;
  const cr = 0.07;
  cushionShape.moveTo(-cw + cr, -cd);
  cushionShape.lineTo(cw - cr, -cd);
  cushionShape.quadraticCurveTo(cw, -cd, cw, -cd + cr);
  cushionShape.lineTo(cw, cd - cr);
  cushionShape.quadraticCurveTo(cw, cd, cw - cr, cd);
  cushionShape.lineTo(-cw + cr, cd);
  cushionShape.quadraticCurveTo(-cw, cd, -cw, cd - cr);
  cushionShape.lineTo(-cw, -cd + cr);
  cushionShape.quadraticCurveTo(-cw, -cd, -cw + cr, -cd);

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4,
  });
  cushionGeo.rotateX(Math.PI / 2);
  addMesh(cushionGeo, leatherMat, 'seat_cushion', 0, SEAT_H + 0.03, 0.02, -0.03, 0, 0);

  // 5. Backrest Group (tilted slightly back)
  const backGroup = new THREE.Group();
  backGroup.name = 'backrest_assembly';
  backGroup.position.set(0, SEAT_H - 0.01, -SEAT_D * 0.42);
  backGroup.rotation.x = -0.16;
  group.add(backGroup);

  // 4 Horizontal Padded Segments (Lumbar, Lower-Mid, Upper-Mid, Headrest)
  const segmentSpecs = [
    { name: 'back_lumbar_cushion', w: 0.36, h: 0.11, d: 0.07, y: 0.08, z: 0.01 },
    { name: 'back_lower_mid_cushion', w: 0.36, h: 0.14, d: 0.07, y: 0.215, z: 0.015 },
    { name: 'back_upper_mid_cushion', w: 0.37, h: 0.14, d: 0.07, y: 0.365, z: 0.015 },
    { name: 'back_headrest_cushion', w: 0.38, h: 0.145, d: 0.085, y: 0.515, z: 0.028 },
  ];

  segmentSpecs.forEach((seg) => {
    const segGeo = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
    addMesh(segGeo, leatherMat, seg.name, 0, seg.y, seg.z, 0, 0, 0, backGroup);
  });

  // Backrest Rear Shell
  const backShellGeo = new THREE.BoxGeometry(0.44, 0.60, 0.045);
  addMesh(backShellGeo, leatherDarkMat, 'backrest_rear_shell', 0, 0.29, -0.035, 0, 0, 0, backGroup);

  // Sculpted Side Bolsters / Wings (Left & Right)
  const bolsterGeo = new THREE.CapsuleGeometry(0.055, 0.44, 8, 16);
  addMesh(bolsterGeo, leatherMat, 'back_bolster_left', -0.23, 0.29, 0.03, 0, 0, 0.08, backGroup);
  addMesh(bolsterGeo, leatherMat, 'back_bolster_right', 0.23, 0.29, 0.03, 0, 0, -0.08, backGroup);

  // Upper Wing Flares
  const wingGeo = new THREE.SphereGeometry(0.085, 16, 12);
  const leftWing = addMesh(wingGeo, leatherMat, 'back_wing_left', -0.24, 0.48, 0.02, 0, 0, 0, backGroup);
  leftWing.scale.set(0.75, 1.35, 0.65);
  const rightWing = addMesh(wingGeo, leatherMat, 'back_wing_right', 0.24, 0.48, 0.02, 0, 0, 0, backGroup);
  rightWing.scale.set(0.75, 1.35, 0.65);

  // Lower Seat Side Bolsters
  const seatBolsterGeo = new THREE.CapsuleGeometry(0.05, 0.24, 8, 14);
  addMesh(seatBolsterGeo, leatherMat, 'seat_bolster_left', -0.265, SEAT_H + 0.05, -0.04, Math.PI / 2 - 0.15, 0, 0);
  addMesh(seatBolsterGeo, leatherMat, 'seat_bolster_right', 0.265, SEAT_H + 0.05, -0.04, Math.PI / 2 - 0.15, 0, 0);

  // 6. Armrests (Aluminum uprights + Leather pads)
  const armUprightGeo = new THREE.BoxGeometry(0.024, 0.21, 0.042);
  const armBracketGeo = new THREE.BoxGeometry(0.055, 0.02, 0.12);
  const armPadGeo = new THREE.CapsuleGeometry(0.038, 0.18, 8, 16);

  [-1, 1].forEach((side) => {
    const sideName = side === -1 ? 'left' : 'right';
    // Upright
    addMesh(
      armUprightGeo,
      aluminumMat,
      `armrest_upright_${sideName}`,
      side * ARM_X,
      ARM_Y - 0.115,
      -0.01,
      0,
      0,
      side * -0.06
    );
    // Under-pad aluminum bracket
    addMesh(
      armBracketGeo,
      aluminumMat,
      `armrest_bracket_${sideName}`,
      side * ARM_X,
      ARM_Y - 0.015,
      0.01
    );
    // Leather pad
    const pad = addMesh(
      armPadGeo,
      leatherMat,
      `armrest_pad_${sideName}`,
      side * ARM_X,
      ARM_Y + 0.005,
      0.015,
      Math.PI / 2,
      0,
      0
    );
    pad.scale.set(1.0, 1.0, 0.55);
  });

  return group;
}
