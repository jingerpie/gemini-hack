function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const BASE_R = 0.085;
  const BASE_H = 0.022;
  const PAD_H = 0.002;
  const STEM_R = 0.018;
  const STEM_H = 0.042;

  const JOINT_R = 0.015;
  const JOINT_W = 0.024;
  const ROD_R = 0.0075;
  const COLLAR_R = 0.010;
  const COLLAR_H = 0.014;

  const LOWER_ARM_LEN = 0.235;
  const LOWER_ARM_ANGLE = -0.52; // radians, tilts back (-Z)

  const UPPER_ARM_LEN = 0.205;
  const UPPER_ARM_ANGLE = 1.12; // radians, tilts forward (+Z)

  const CUP_R = 0.023;
  const CUP_H = 0.052;
  const SHADE_TOP_R = 0.023;
  const SHADE_BOT_R = 0.082;
  const SHADE_H = 0.068;
  const HEAD_TILT = 2.65; // radians, points shade down and forward (+Z)

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    metalness: 0.85,
    roughness: 0.28,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89748,
    metalness: 0.82,
    roughness: 0.26,
  });

  const whiteInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f2,
    metalness: 0.05,
    roughness: 0.45,
    side: THREE.BackSide,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    metalness: 0.05,
    roughness: 0.7,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d8,
    emissive: 0xffdf9e,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  function makeMesh(geom, mat, name) {
    const m = new THREE.Mesh(geom, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // 1. Base assembly
  const basePad = makeMesh(
    new THREE.CylinderGeometry(BASE_R - 0.002, BASE_R - 0.002, PAD_H, 32),
    padMat,
    "base_pad"
  );
  basePad.position.y = PAD_H / 2;
  group.add(basePad);

  const baseDisk = makeMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    steelMat,
    "base_disk"
  );
  baseDisk.position.y = PAD_H + BASE_H / 2;
  group.add(baseDisk);

  const baseTopY = PAD_H + BASE_H;
  const baseStem = makeMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 24),
    steelMat,
    "base_stem"
  );
  baseStem.position.y = baseTopY + STEM_H / 2;
  group.add(baseStem);

  // 2. Joint 1 (bottom brass pivot)
  const j1NeckH = 0.012;
  const j1Neck = makeMesh(
    new THREE.CylinderGeometry(0.009, 0.010, j1NeckH, 16),
    brassMat,
    "joint1_neck"
  );
  j1Neck.position.y = baseTopY + STEM_H + j1NeckH / 2;
  group.add(j1Neck);

  const j1Y = baseTopY + STEM_H + j1NeckH + JOINT_R * 0.6;
  const j1Z = 0;

  const j1Drum = makeMesh(
    new THREE.CylinderGeometry(JOINT_R, JOINT_R, JOINT_W, 24),
    brassMat,
    "joint1_drum"
  );
  j1Drum.rotation.z = Math.PI / 2;
  j1Drum.position.set(0, j1Y, j1Z);
  group.add(j1Drum);

  // 3. Lower arm
  const lowerArmGroup = new THREE.Group();
  lowerArmGroup.position.set(0, j1Y, j1Z);
  lowerArmGroup.rotation.x = LOWER_ARM_ANGLE;
  group.add(lowerArmGroup);

  const lowerCollarBot = makeMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 16),
    brassMat,
    "lower_arm_collar_bottom"
  );
  lowerCollarBot.position.y = JOINT_R + COLLAR_H / 2 - 0.003;
  lowerArmGroup.add(lowerCollarBot);

  const lowerRod = makeMesh(
    new THREE.CylinderGeometry(ROD_R, ROD_R, LOWER_ARM_LEN, 16),
    steelMat,
    "lower_arm_rod"
  );
  lowerRod.position.y = JOINT_R + LOWER_ARM_LEN / 2;
  lowerArmGroup.add(lowerRod);

  const lowerCollarTop = makeMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 16),
    brassMat,
    "lower_arm_collar_top"
  );
  lowerCollarTop.position.y = JOINT_R + LOWER_ARM_LEN - COLLAR_H / 2 + 0.003;
  lowerArmGroup.add(lowerCollarTop);

  // 4. Joint 2 (middle brass pivot)
  const j2Dist = JOINT_R + LOWER_ARM_LEN + JOINT_R;
  const j2Y = j1Y + Math.cos(LOWER_ARM_ANGLE) * j2Dist;
  const j2Z = j1Z + Math.sin(LOWER_ARM_ANGLE) * j2Dist;

  const j2Drum = makeMesh(
    new THREE.CylinderGeometry(JOINT_R, JOINT_R, JOINT_W, 24),
    brassMat,
    "joint2_drum"
  );
  j2Drum.rotation.z = Math.PI / 2;
  j2Drum.position.set(0, j2Y, j2Z);
  group.add(j2Drum);

  // 5. Upper arm
  const upperArmGroup = new THREE.Group();
  upperArmGroup.position.set(0, j2Y, j2Z);
  upperArmGroup.rotation.x = UPPER_ARM_ANGLE;
  group.add(upperArmGroup);

  const upperCollarBot = makeMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 16),
    brassMat,
    "upper_arm_collar_bottom"
  );
  upperCollarBot.position.y = JOINT_R + COLLAR_H / 2 - 0.003;
  upperArmGroup.add(upperCollarBot);

  const upperRod = makeMesh(
    new THREE.CylinderGeometry(ROD_R, ROD_R, UPPER_ARM_LEN, 16),
    steelMat,
    "upper_arm_rod"
  );
  upperRod.position.y = JOINT_R + UPPER_ARM_LEN / 2;
  upperArmGroup.add(upperRod);

  const upperCollarTop = makeMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 16),
    brassMat,
    "upper_arm_collar_top"
  );
  upperCollarTop.position.y = JOINT_R + UPPER_ARM_LEN - COLLAR_H / 2 + 0.003;
  upperArmGroup.add(upperCollarTop);

  // 6. Joint 3 (head brass pivot)
  const j3Dist = JOINT_R + UPPER_ARM_LEN + JOINT_R * 0.9;
  const j3Y = j2Y + Math.cos(UPPER_ARM_ANGLE) * j3Dist;
  const j3Z = j2Z + Math.sin(UPPER_ARM_ANGLE) * j3Dist;

  const j3Drum = makeMesh(
    new THREE.CylinderGeometry(JOINT_R * 0.9, JOINT_R * 0.9, JOINT_W * 0.9, 24),
    brassMat,
    "joint3_drum"
  );
  j3Drum.rotation.z = Math.PI / 2;
  j3Drum.position.set(0, j3Y, j3Z);
  group.add(j3Drum);

  // 7. Lamp Head & Shade
  const headGroup = new THREE.Group();
  headGroup.position.set(0, j3Y, j3Z);
  headGroup.rotation.x = HEAD_TILT;
  group.add(headGroup);

  const headNeck = makeMesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.022, 16),
    brassMat,
    "head_neck"
  );
  headNeck.rotation.x = Math.PI / 2;
  headNeck.position.set(0, 0, -0.018);
  headGroup.add(headNeck);

  const headCup = makeMesh(
    new THREE.CylinderGeometry(CUP_R, CUP_R, CUP_H, 24),
    brassMat,
    "head_brass_cup"
  );
  headCup.position.set(0, 0.005, -0.042);
  headGroup.add(headCup);

  const headFinial = makeMesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.008, 16),
    brassMat,
    "head_finial"
  );
  headFinial.position.set(0, 0.005 - CUP_H / 2 - 0.003, -0.042);
  headGroup.add(headFinial);

  const shadeOuter = makeMesh(
    new THREE.CylinderGeometry(SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 32, 1, true),
    steelMat,
    "shade_outer"
  );
  shadeOuter.position.set(0, 0.005 + CUP_H / 2 + SHADE_H / 2 - 0.002, -0.042);
  headGroup.add(shadeOuter);

  const shadeInner = makeMesh(
    new THREE.CylinderGeometry(SHADE_TOP_R - 0.001, SHADE_BOT_R - 0.001, SHADE_H, 32, 1, true),
    whiteInnerMat,
    "shade_inner"
  );
  shadeInner.position.copy(shadeOuter.position);
  headGroup.add(shadeInner);

  const emitBulb = makeMesh(
    new THREE.SphereGeometry(0.018, 20, 16),
    bulbMat,
    "emit_bulb"
  );
  emitBulb.position.set(0, 0.005 + CUP_H / 2 + 0.026, -0.042);
  headGroup.add(emitBulb);

  // 8. Power cord & inline switch
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, baseTopY + STEM_H * 0.5, -STEM_R + 0.002),
    new THREE.Vector3(0, baseTopY + 0.005, -BASE_R * 0.7),
    new THREE.Vector3(-0.02, 0.004, -BASE_R - 0.03),
    new THREE.Vector3(-0.06, 0.0035, -BASE_R - 0.09),
    new THREE.Vector3(-0.12, 0.0035, -BASE_R - 0.14),
  ]);
  const cordMesh = makeMesh(
    new THREE.TubeGeometry(cordCurve, 24, 0.003, 8, false),
    cordMat,
    "cord_cable"
  );
  group.add(cordMesh);

  const switchBody = makeMesh(
    new THREE.BoxGeometry(0.022, 0.011, 0.048),
    cordMat,
    "cord_switch_body"
  );
  switchBody.position.set(-0.09, 0.0055, -BASE_R - 0.115);
  switchBody.rotation.y = 0.75;
  group.add(switchBody);

  const switchRocker = makeMesh(
    new THREE.BoxGeometry(0.010, 0.006, 0.016),
    cordMat,
    "cord_switch_rocker"
  );
  switchRocker.position.set(-0.09, 0.012, -BASE_R - 0.115);
  switchRocker.rotation.y = 0.75;
  switchRocker.rotation.x = 0.25;
  group.add(switchRocker);

  return group;
}
