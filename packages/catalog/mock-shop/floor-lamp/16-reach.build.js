function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.58;
  const BASE_R = 0.15;
  const BASE_H = 0.024;
  const PAD_H = 0.003;
  const STEM_R = 0.011;
  const STEM_H = 1.18;

  const ARM_ANGLE = 0.18; // ~10.3 degrees upward toward shade
  const ARM_BACK_LEN = 0.28;
  const ARM_FRONT_LEN = 0.56;
  const ARM_R = 0.0075;
  const COUNTERWEIGHT_LEN = 0.10;
  const COUNTERWEIGHT_R = 0.012;

  const SHADE_TOP_R = 0.13;
  const SHADE_BOT_R = 0.20;
  const SHADE_H = 0.23;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89758,
    metalness: 0.85,
    roughness: 0.28,
  });

  const darkPadMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    metalness: 0.0,
    roughness: 0.9,
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xd8c7ae,
    metalness: 0.0,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x8c7355,
    metalness: 0.1,
    roughness: 0.75,
  });

  const switchMat = new THREE.MeshStandardMaterial({
    color: 0x7a6348,
    metalness: 0.2,
    roughness: 0.6,
  });

  // Helper to add mesh with shadows
  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    lampRoot.add(mesh);
    return mesh;
  }

  const lampRoot = new THREE.Group();

  // 1. Base pad & disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.96, PAD_H, 32),
    darkPadMat,
    'base_pad',
    0,
    PAD_H / 2,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.98, BASE_R, BASE_H, 32),
    brassMat,
    'base_disc',
    0,
    PAD_H + BASE_H / 2,
    0
  );

  // 2. Base collar & vertical stem
  const COLLAR_H = 0.016;
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.5, STEM_R * 1.7, COLLAR_H, 24),
    brassMat,
    'base_collar',
    0,
    PAD_H + BASE_H + COLLAR_H / 2,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 24),
    brassMat,
    'vertical_stem',
    0,
    PAD_H + BASE_H + STEM_H / 2,
    0
  );

  // 3. Pivot joint at top of stem
  const PIVOT_Y = PAD_H + BASE_H + STEM_H;
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.026, 20),
    brassMat,
    'pivot_housing',
    0,
    PIVOT_Y,
    0,
    Math.PI / 2,
    0,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.012, 20),
    brassMat,
    'pivot_knob',
    0,
    PIVOT_Y,
    0.018,
    Math.PI / 2,
    0,
    0
  );

  // 4. Boom arm (angled)
  const ARM_TOTAL_LEN = ARM_BACK_LEN + ARM_FRONT_LEN;
  const ARM_CENTER_OFFSET = (ARM_FRONT_LEN - ARM_BACK_LEN) / 2;
  const armCenterX = Math.cos(ARM_ANGLE) * ARM_CENTER_OFFSET;
  const armCenterY = PIVOT_Y + Math.sin(ARM_ANGLE) * ARM_CENTER_OFFSET;

  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, ARM_TOTAL_LEN, 20),
    brassMat,
    'boom_arm',
    armCenterX,
    armCenterY,
    0,
    0,
    0,
    ARM_ANGLE - Math.PI / 2
  );

  // 5. Counterweight at back end
  const cwOffset = -ARM_BACK_LEN + COUNTERWEIGHT_LEN / 2;
  addMesh(
    new THREE.CylinderGeometry(COUNTERWEIGHT_R, COUNTERWEIGHT_R, COUNTERWEIGHT_LEN, 20),
    brassMat,
    'counterweight',
    Math.cos(ARM_ANGLE) * cwOffset,
    PIVOT_Y + Math.sin(ARM_ANGLE) * cwOffset,
    0,
    0,
    0,
    ARM_ANGLE - Math.PI / 2
  );

  // 6. Shade end cap & vertical socket stem
  const tipX = Math.cos(ARM_ANGLE) * ARM_FRONT_LEN;
  const tipY = PIVOT_Y + Math.sin(ARM_ANGLE) * ARM_FRONT_LEN;

  addMesh(
    new THREE.SphereGeometry(ARM_R * 1.35, 16, 12),
    brassMat,
    'arm_end_cap',
    tipX,
    tipY,
    0
  );

  const SOCKET_H = 0.045;
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.011, SOCKET_H, 20),
    brassMat,
    'socket_stem',
    tipX,
    tipY + SOCKET_H / 2,
    0
  );

  // 7. Tapered fabric shade (thin-walled via LatheGeometry)
  const SHADE_BOT_Y = tipY + SOCKET_H * 0.75;
  const shadeWall = 0.004;
  const shadePoints = [
    new THREE.Vector2(SHADE_BOT_R - shadeWall, 0),
    new THREE.Vector2(SHADE_BOT_R, 0),
    new THREE.Vector2(SHADE_TOP_R, SHADE_H),
    new THREE.Vector2(SHADE_TOP_R - shadeWall, SHADE_H),
    new THREE.Vector2(SHADE_BOT_R - shadeWall, 0),
  ];
  addMesh(
    new THREE.LatheGeometry(shadePoints, 32),
    shadeMat,
    'shade_outer',
    tipX,
    SHADE_BOT_Y,
    0
  );

  // 8. Light bulb inside shade
  addMesh(
    new THREE.SphereGeometry(0.032, 20, 16),
    bulbMat,
    'light_bulb',
    tipX,
    SHADE_BOT_Y + 0.065,
    0
  );

  // 9. Power cord & foot switch on the floor
  const SWITCH_X = -0.45;
  const SWITCH_Z = 0.04;
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.01, PAD_H + BASE_H + 0.02, 0),
    new THREE.Vector3(-0.14, 0.012, 0.01),
    new THREE.Vector3(-0.28, 0.004, 0.03),
    new THREE.Vector3(SWITCH_X, 0.004, SWITCH_Z),
    new THREE.Vector3(-0.72, 0.004, 0.02),
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 24, 0.0035, 8, false),
    cordMat,
    'power_cord'
  );

  const SWITCH_H = 0.016;
  addMesh(
    new THREE.CylinderGeometry(0.032, 0.035, SWITCH_H, 24),
    switchMat,
    'foot_switch_body',
    SWITCH_X,
    SWITCH_H / 2,
    SWITCH_Z
  );

  addMesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.008, 20),
    switchMat,
    'foot_switch_button',
    SWITCH_X,
    SWITCH_H + 0.004,
    SWITCH_Z
  );

  // Center bounding box on X = 0 and Z = 0
  const box = new THREE.Box3().setFromObject(lampRoot);
  const center = new THREE.Vector3();
  box.getCenter(center);
  lampRoot.position.set(-center.x, -box.min.y, -center.z);

  group.add(lampRoot);
  return group;
}
