function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.13;
  const BASE_H = 0.024;
  const PAD_H = 0.003;
  const STEM_R = 0.008;
  const STEM_H = 1.12;
  const STEM_OFFSET_Z = -0.06;

  const PIVOT_Y = BASE_H + STEM_H;
  const PIVOT_R = 0.015;
  const PIVOT_W = 0.024;

  const ARM_ANGLE = 0.72; // radians above horizontal
  const ARM_R = 0.006;
  const ARM_FRONT_LEN = 0.44;
  const ARM_BACK_LEN = 0.22;

  const CW_R = 0.012;
  const CW_LEN = 0.09;

  const SHADE_TOP_R = 0.030;
  const SHADE_BOT_R = 0.056;
  const SHADE_H = 0.115;

  // Materials
  const brushedAluminum = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.32,
    metalness: 0.85
  });

  const darkRubber = new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    roughness: 0.85,
    metalness: 0.05
  });

  const innerWhite = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.5,
    metalness: 0.05
  });

  const ledEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffdca8,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.0
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xe2e2e0,
    roughness: 0.6,
    metalness: 0.02
  });

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // 1. Base assembly
  const baseGroup = new THREE.Group();
  const baseZ = -0.04;

  const basePad = addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32),
    darkRubber,
    'base_pad'
  );
  basePad.position.set(0, PAD_H / 2, baseZ);
  baseGroup.add(basePad);

  const baseDisc = addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.003, BASE_R, BASE_H - PAD_H, 32),
    brushedAluminum,
    'base_disc'
  );
  baseDisc.position.set(0, PAD_H + (BASE_H - PAD_H) / 2, baseZ);
  baseGroup.add(baseDisc);

  const stemZ = baseZ + STEM_OFFSET_Z;
  const baseCollar = addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.5, STEM_R * 1.8, 0.012, 24),
    brushedAluminum,
    'base_collar'
  );
  baseCollar.position.set(0, BASE_H + 0.006, stemZ);
  baseGroup.add(baseCollar);

  group.add(baseGroup);

  // 2. Vertical stem
  const verticalStem = addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 24),
    brushedAluminum,
    'vertical_stem'
  );
  verticalStem.position.set(0, BASE_H + STEM_H / 2, stemZ);
  group.add(verticalStem);

  // 3. Pivot joint
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, PIVOT_Y, stemZ);

  const pivotHousing = addMesh(
    new THREE.CylinderGeometry(PIVOT_R, PIVOT_R, PIVOT_W, 24),
    brushedAluminum,
    'pivot_housing'
  );
  pivotHousing.rotation.z = Math.PI / 2;
  pivotGroup.add(pivotHousing);

  const pivotCapLeft = addMesh(
    new THREE.CylinderGeometry(PIVOT_R * 0.72, PIVOT_R * 0.72, 0.004, 24),
    brushedAluminum,
    'pivot_cap_left'
  );
  pivotCapLeft.rotation.z = Math.PI / 2;
  pivotCapLeft.position.x = -PIVOT_W / 2 - 0.002;
  pivotGroup.add(pivotCapLeft);

  const pivotCapRight = addMesh(
    new THREE.CylinderGeometry(PIVOT_R * 0.72, PIVOT_R * 0.72, 0.004, 24),
    brushedAluminum,
    'pivot_cap_right'
  );
  pivotCapRight.rotation.z = Math.PI / 2;
  pivotCapRight.position.x = PIVOT_W / 2 + 0.002;
  pivotGroup.add(pivotCapRight);

  group.add(pivotGroup);

  // 4. Angled boom arm & counterweight
  const armGroup = new THREE.Group();
  armGroup.position.set(0, PIVOT_Y, stemZ);
  armGroup.rotation.x = -ARM_ANGLE;

  const totalArmLen = ARM_FRONT_LEN + ARM_BACK_LEN;
  const boomArm = addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, totalArmLen, 20),
    brushedAluminum,
    'boom_arm'
  );
  boomArm.rotation.x = Math.PI / 2;
  boomArm.position.z = (ARM_FRONT_LEN - ARM_BACK_LEN) / 2;
  armGroup.add(boomArm);

  const cwCollar = addMesh(
    new THREE.CylinderGeometry(CW_R, ARM_R, 0.02, 24),
    brushedAluminum,
    'counterweight_collar'
  );
  cwCollar.rotation.x = Math.PI / 2;
  cwCollar.position.z = -ARM_BACK_LEN + 0.01;
  armGroup.add(cwCollar);

  const cwBody = addMesh(
    new THREE.CylinderGeometry(CW_R, CW_R, CW_LEN, 24),
    brushedAluminum,
    'counterweight_body'
  );
  cwBody.rotation.x = Math.PI / 2;
  cwBody.position.z = -ARM_BACK_LEN - CW_LEN / 2;
  armGroup.add(cwBody);

  const cwEndCap = addMesh(
    new THREE.SphereGeometry(CW_R, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    brushedAluminum,
    'counterweight_end_cap'
  );
  cwEndCap.rotation.x = -Math.PI / 2;
  cwEndCap.position.z = -ARM_BACK_LEN - CW_LEN;
  armGroup.add(cwEndCap);

  // 5. Lamp head & shade
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0, ARM_FRONT_LEN);

  const headNeck = addMesh(
    new THREE.CylinderGeometry(ARM_R * 0.85, ARM_R * 0.85, 0.025, 16),
    brushedAluminum,
    'head_neck'
  );
  headNeck.rotation.x = Math.PI / 2;
  headNeck.position.z = 0.012;
  headGroup.add(headNeck);

  const headSwivel = addMesh(
    new THREE.SphereGeometry(0.011, 20, 16),
    brushedAluminum,
    'head_swivel'
  );
  headSwivel.position.z = 0.026;
  headGroup.add(headSwivel);

  const shadeHolder = new THREE.Group();
  shadeHolder.position.set(0, 0, 0.036);
  // Tilt shade downward relative to boom arm
  shadeHolder.rotation.x = ARM_ANGLE + 0.52;

  const shadeOuter = addMesh(
    new THREE.CylinderGeometry(SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 32, 1, true),
    brushedAluminum,
    'shade_outer'
  );
  shadeHolder.add(shadeOuter);

  const shadeTopCap = addMesh(
    new THREE.SphereGeometry(SHADE_TOP_R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    brushedAluminum,
    'shade_top_cap'
  );
  shadeTopCap.scale.y = 0.35;
  shadeTopCap.position.y = SHADE_H / 2;
  shadeHolder.add(shadeTopCap);

  const shadeRim = addMesh(
    new THREE.TorusGeometry(SHADE_BOT_R - 0.001, 0.002, 12, 32),
    brushedAluminum,
    'shade_rim'
  );
  shadeRim.rotation.x = Math.PI / 2;
  shadeRim.position.y = -SHADE_H / 2;
  shadeHolder.add(shadeRim);

  const shadeInner = addMesh(
    new THREE.CylinderGeometry(SHADE_TOP_R - 0.002, SHADE_BOT_R - 0.002, SHADE_H - 0.004, 32, 1, true),
    innerWhite,
    'shade_inner'
  );
  shadeInner.material = innerWhite.clone();
  shadeInner.material.side = THREE.BackSide;
  shadeHolder.add(shadeInner);

  const ledDiffuser = addMesh(
    new THREE.CylinderGeometry(SHADE_BOT_R * 0.78, SHADE_BOT_R * 0.78, 0.006, 32),
    ledEmissive,
    'led_diffuser'
  );
  ledDiffuser.position.y = -SHADE_H * 0.25;
  shadeHolder.add(ledDiffuser);

  headGroup.add(shadeHolder);
  armGroup.add(headGroup);
  group.add(armGroup);

  // 6. Power cord & foot switch on floor
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.005, baseZ - BASE_R + 0.01),
    new THREE.Vector3(-0.08, 0.004, baseZ - BASE_R - 0.05),
    new THREE.Vector3(-0.18, 0.004, baseZ - 0.04),
    new THREE.Vector3(-0.26, 0.004, baseZ + 0.04)
  ]);
  const powerCord = addMesh(
    new THREE.TubeGeometry(cordCurve, 24, 0.003, 8, false),
    cordMat,
    'power_cord'
  );
  group.add(powerCord);

  const switchBase = addMesh(
    new THREE.CylinderGeometry(0.032, 0.036, 0.012, 24),
    cordMat,
    'foot_switch_base'
  );
  switchBase.position.set(-0.28, 0.006, baseZ + 0.05);
  group.add(switchBase);

  const switchButton = addMesh(
    new THREE.CylinderGeometry(0.012, 0.014, 0.008, 20),
    brushedAluminum,
    'foot_switch_button'
  );
  switchButton.position.set(-0.28, 0.014, baseZ + 0.05);
  group.add(switchButton);

  return group;
}
