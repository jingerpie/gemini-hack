function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.145;
  const BASE_H = 0.025;
  const COLLAR_R = 0.036;
  const COLLAR_H = 0.17;
  const POLE_R = 0.0095;
  const POLE_H = 1.48;
  const PIVOT_Y = 1.16;

  const ARM_ANGLE = 0.62; // ~35.5 deg
  const ARM_R = 0.0075;
  const ARM_UPPER_L = 0.36;
  const ARM_LOWER_L = 0.34;
  const COUNTERWEIGHT_R = 0.015;
  const COUNTERWEIGHT_L = 0.14;

  const SHADE_R_TOP = 0.024;
  const SHADE_R_BOT = 0.095;
  const SHADE_H = 0.21;

  // Materials
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.45,
    metalness: 0.35
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a365,
    roughness: 0.28,
    metalness: 0.85
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.75,
    metalness: 0.05
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.0
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf7e3b5,
    emissive: 0xffcc77,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    metalness: 0.2,
    side: THREE.BackSide
  });

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

  // 1. Base disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    blackMat,
    'base_disc',
    [0, BASE_H / 2, 0]
  );

  // 2. Base collar
  addMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 28),
    blackMat,
    'base_collar',
    [0, BASE_H + COLLAR_H / 2 - 0.002, 0]
  );

  // 3. Main vertical pole
  addMesh(
    new THREE.CylinderGeometry(POLE_R, POLE_R, POLE_H - BASE_H, 20),
    blackMat,
    'main_pole',
    [0, BASE_H + (POLE_H - BASE_H) / 2, 0]
  );

  // 4. Pole top cap
  addMesh(
    new THREE.SphereGeometry(POLE_R, 16, 12),
    blackMat,
    'pole_top_cap',
    [0, POLE_H, 0]
  );

  // 5. Pivot housing
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.036, 20),
    blackMat,
    'pivot_housing',
    [0, PIVOT_Y, 0],
    [Math.PI / 2, 0, 0]
  );

  // 6. Pivot brass thumbscrew cap (front +Z)
  addMesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.012, 20),
    brassMat,
    'pivot_brass_cap',
    [0, PIVOT_Y, 0.021],
    [Math.PI / 2, 0, 0]
  );

  // Arm group pivoted at (0, PIVOT_Y, 0.01)
  const armGroup = new THREE.Group();
  armGroup.position.set(0, PIVOT_Y, 0.008);
  armGroup.rotation.z = ARM_ANGLE;
  group.add(armGroup);

  function addArmMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    armGroup.add(mesh);
    return mesh;
  }

  // 7. Arm rod
  const totalArmL = ARM_UPPER_L + ARM_LOWER_L;
  const armCenterOffset = (ARM_UPPER_L - ARM_LOWER_L) / 2;
  addArmMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, totalArmL, 16),
    blackMat,
    'arm_rod',
    [armCenterOffset, 0, 0],
    [0, 0, Math.PI / 2]
  );

  // 8. Counterweight sleeve at lower-left end
  addArmMesh(
    new THREE.CylinderGeometry(COUNTERWEIGHT_R, COUNTERWEIGHT_R, COUNTERWEIGHT_L, 20),
    blackMat,
    'counterweight_sleeve',
    [-ARM_LOWER_L + COUNTERWEIGHT_L / 2, 0, 0],
    [0, 0, Math.PI / 2]
  );

  // 9. Brass neck connector at upper-right end
  addArmMesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.045, 16),
    brassMat,
    'arm_brass_neck',
    [ARM_UPPER_L + 0.015, 0, 0],
    [0, 0, Math.PI / 2]
  );

  // Shade group attached at the end of the arm
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(ARM_UPPER_L + 0.065, -0.02, 0);
  shadeGroup.rotation.z = -0.15;
  armGroup.add(shadeGroup);

  function addShadeMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shadeGroup.add(mesh);
    return mesh;
  }

  // 10. Shade outer cone (open bottom)
  addShadeMesh(
    new THREE.CylinderGeometry(SHADE_R_TOP, SHADE_R_BOT, SHADE_H, 32, 1, true),
    brassMat,
    'shade_outer',
    [0, 0, 0]
  );

  // 11. Shade inner emissive lining
  addShadeMesh(
    new THREE.CylinderGeometry(SHADE_R_TOP * 0.96, SHADE_R_BOT * 0.98, SHADE_H * 0.98, 32, 1, true),
    shadeInnerMat,
    'shade_inner',
    [0, -0.001, 0]
  );

  // 12. Shade top cap & finial
  addShadeMesh(
    new THREE.CylinderGeometry(SHADE_R_TOP, SHADE_R_TOP, 0.008, 24),
    brassMat,
    'shade_top_cap',
    [0, SHADE_H / 2, 0]
  );

  addShadeMesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.014, 12),
    brassMat,
    'shade_top_finial',
    [0, SHADE_H / 2 + 0.009, 0]
  );

  // 13. Light bulb inside shade
  addShadeMesh(
    new THREE.SphereGeometry(0.028, 16, 12),
    bulbMat,
    'light_bulb',
    [0, 0.02, 0]
  );

  // 14. Cord clip on base collar
  addMesh(
    new THREE.BoxGeometry(0.012, 0.01, 0.012),
    blackMat,
    'cord_clip',
    [-COLLAR_R - 0.003, BASE_H + COLLAR_H * 0.65, 0]
  );

  // 15. Power cord from counterweight sleeve down to floor and foot switch
  const armEndWorldX = -ARM_LOWER_L * Math.cos(ARM_ANGLE);
  const armEndWorldY = PIVOT_Y - ARM_LOWER_L * Math.sin(ARM_ANGLE);

  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(armEndWorldX, armEndWorldY, 0.008),
    new THREE.Vector3(armEndWorldX - 0.02, armEndWorldY - 0.12, 0.01),
    new THREE.Vector3(-0.14, 0.55, 0.015),
    new THREE.Vector3(-COLLAR_R - 0.006, BASE_H + COLLAR_H * 0.65, 0.0),
    new THREE.Vector3(-0.07, 0.04, 0.01),
    new THREE.Vector3(-0.18, 0.005, 0.02),
    new THREE.Vector3(-0.34, 0.005, 0.02),
    new THREE.Vector3(-0.46, 0.005, 0.03)
  ]);

  addMesh(
    new THREE.TubeGeometry(cordCurve, 32, 0.0035, 8, false),
    cordMat,
    'power_cord'
  );

  // 16. Foot switch body
  addMesh(
    new THREE.CylinderGeometry(0.032, 0.036, 0.016, 20),
    blackMat,
    'foot_switch_body',
    [-0.36, 0.008, 0.02]
  );

  // 17. Foot switch button
  addMesh(
    new THREE.CylinderGeometry(0.012, 0.014, 0.008, 16),
    blackMat,
    'foot_switch_button',
    [-0.36, 0.018, 0.02]
  );

  return group;
}
