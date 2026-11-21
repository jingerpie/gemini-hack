function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.082;
  const BASE_H = 0.022;
  const BODY_R_BOT = 0.078;
  const BODY_R_TOP = 0.054;
  const TOTAL_H = 0.235;
  const FOOT_H = 0.003;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8cccf,
    metalness: 0.85,
    roughness: 0.28,
  });
  const lidSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d7,
    metalness: 0.88,
    roughness: 0.24,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x85898e,
    metalness: 0.75,
    roughness: 0.38,
  });
  const darkPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    metalness: 0.1,
    roughness: 0.7,
  });
  const clearPlasticMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6edf2,
    metalness: 0.05,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72,
    clearcoat: 0.8,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Power Base & Feet (y = 0 to BASE_H)
  const footGeo = new THREE.CylinderGeometry(0.008, 0.008, FOOT_H, 12);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const foot = addMesh(footGeo, darkPlasticMat, `base_foot_${i + 1}`);
    foot.position.set(
      Math.cos(angle) * (BASE_R - 0.015),
      FOOT_H / 2,
      Math.sin(angle) * (BASE_R - 0.015)
    );
  }

  const basePoints = [
    new THREE.Vector2(0, FOOT_H),
    new THREE.Vector2(BASE_R - 0.006, FOOT_H),
    new THREE.Vector2(BASE_R, FOOT_H + 0.005),
    new THREE.Vector2(BASE_R, BASE_H - 0.004),
    new THREE.Vector2(BASE_R - 0.005, BASE_H),
    new THREE.Vector2(BODY_R_BOT - 0.008, BASE_H),
    new THREE.Vector2(BODY_R_BOT - 0.01, BASE_H - 0.005),
    new THREE.Vector2(0, BASE_H - 0.005),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(baseGeo, steelMat, 'power_base');

  // Power cord loop at back-right of base
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, FOOT_H + 0.005, -0.055),
    new THREE.Vector3(0.085, FOOT_H + 0.004, -0.035),
    new THREE.Vector3(0.092, FOOT_H + 0.004, 0.01),
    new THREE.Vector3(0.065, FOOT_H + 0.004, 0.035),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 20, 0.0038, 10, false);
  addMesh(cordGeo, darkPlasticMat, 'power_cord');

  // 2. Kettle Body (LatheGeometry)
  const bodyBotY = BASE_H - 0.004;
  const bodyTopY = TOTAL_H - 0.018;
  const bodyPoints = [
    new THREE.Vector2(0, bodyBotY),
    new THREE.Vector2(BODY_R_BOT - 0.012, bodyBotY),
    new THREE.Vector2(BODY_R_BOT - 0.002, bodyBotY + 0.008),
    new THREE.Vector2(BODY_R_BOT, bodyBotY + 0.028),
    new THREE.Vector2(BODY_R_BOT - 0.001, bodyBotY + 0.045),
    new THREE.Vector2(BODY_R_BOT - 0.004, bodyBotY + 0.085),
    new THREE.Vector2(BODY_R_BOT - 0.010, bodyBotY + 0.125),
    new THREE.Vector2(BODY_R_TOP + 0.006, bodyBotY + 0.165),
    new THREE.Vector2(BODY_R_TOP, bodyTopY),
    new THREE.Vector2(BODY_R_TOP - 0.004, bodyTopY),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  addMesh(bodyGeo, steelMat, 'kettle_body');

  // Lower seam ring around kettle body
  const seamGeo = new THREE.TorusGeometry(BODY_R_BOT + 0.0005, 0.0014, 10, 32);
  seamGeo.rotateX(Math.PI / 2);
  const seamMesh = addMesh(seamGeo, darkSteelMat, 'body_seam_ring');
  seamMesh.position.y = bodyBotY + 0.032;

  // 3. Domed Lid
  const lidPoints = [
    new THREE.Vector2(0, TOTAL_H),
    new THREE.Vector2(0.022, TOTAL_H - 0.002),
    new THREE.Vector2(0.040, TOTAL_H - 0.007),
    new THREE.Vector2(BODY_R_TOP - 0.004, bodyTopY + 0.003),
    new THREE.Vector2(BODY_R_TOP - 0.005, bodyTopY),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  addMesh(lidGeo, lidSteelMat, 'kettle_lid');

  const lidSeamGeo = new THREE.TorusGeometry(BODY_R_TOP - 0.003, 0.0012, 8, 32);
  lidSeamGeo.rotateX(Math.PI / 2);
  const lidSeam = addMesh(lidSeamGeo, darkPlasticMat, 'lid_seam_ring');
  lidSeam.position.y = bodyTopY + 0.001;

  // 4. Spout (-X side)
  const spoutGeo = new THREE.CylinderGeometry(0.018, 0.005, 0.048, 16);
  const spout = addMesh(spoutGeo, steelMat, 'kettle_spout');
  spout.position.set(-BODY_R_TOP - 0.012, bodyTopY - 0.022, 0);
  spout.rotation.z = Math.PI / 4.2;

  const spoutHoleGeo = new THREE.CylinderGeometry(0.014, 0.008, 0.012, 16);
  const spoutHole = addMesh(spoutHoleGeo, darkPlasticMat, 'spout_interior');
  spoutHole.position.set(-BODY_R_TOP - 0.023, bodyTopY - 0.008, 0);
  spoutHole.rotation.z = Math.PI / 4.2;

  // 5. Handle (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY_R_TOP - 0.004, bodyTopY - 0.012, 0),
    new THREE.Vector3(BODY_R_TOP + 0.036, bodyTopY - 0.015, 0),
    new THREE.Vector3(BODY_R_BOT + 0.024, bodyTopY - 0.055, 0),
    new THREE.Vector3(BODY_R_BOT + 0.026, bodyBotY + 0.068, 0),
    new THREE.Vector3(BODY_R_BOT + 0.016, bodyBotY + 0.045, 0),
    new THREE.Vector3(BODY_R_BOT - 0.006, bodyBotY + 0.042, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, 0.0105, 14, false);
  addMesh(handleGeo, steelMat, 'kettle_handle');

  // 6. Water Level Gauge (on +X side under handle)
  const gaugeGeo = new THREE.CapsuleGeometry(0.0045, 0.055, 6, 12);
  const gauge = addMesh(gaugeGeo, clearPlasticMat, 'water_level_gauge');
  gauge.position.set(BODY_R_BOT - 0.009, bodyBotY + 0.095, 0);
  gauge.rotation.z = 0.14;

  // 7. Power Switch (+X side near bottom)
  const switchGeo = new THREE.CapsuleGeometry(0.0035, 0.014, 6, 10);
  switchGeo.rotateZ(Math.PI / 2);
  const powerSwitch = addMesh(switchGeo, clearPlasticMat, 'power_switch');
  powerSwitch.position.set(BODY_R_BOT + 0.004, bodyBotY + 0.020, 0);

  return group;
}
