function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.084;
  const BASE_H = 0.024;
  const BODY_BOT_R = 0.074;
  const BODY_TOP_R = 0.062;
  const BODY_H = 0.195;
  const TOTAL_H = BASE_H + BODY_H + 0.012;

  // Materials
  const matCyan = new THREE.MeshStandardMaterial({
    color: 0x5cc4d8,
    roughness: 0.38,
    metalness: 0.05
  });
  const matNavy = new THREE.MeshStandardMaterial({
    color: 0x183059,
    roughness: 0.35,
    metalness: 0.08
  });
  const matOrange = new THREE.MeshStandardMaterial({
    color: 0xf27d2e,
    roughness: 0.35,
    metalness: 0.05
  });
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc4cdd4,
    roughness: 0.25,
    metalness: 0.85
  });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdcf0f5,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    clearcoat: 0.8
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

  // 1. Power Base
  const basePoints = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(BASE_R * 0.88, 0.002),
    new THREE.Vector2(BASE_R * 0.96, 0.007),
    new THREE.Vector2(BASE_R, 0.014),
    new THREE.Vector2(BASE_R * 0.97, BASE_H),
    new THREE.Vector2(BODY_BOT_R * 0.95, BASE_H),
    new THREE.Vector2(0.0, BASE_H)
  ];
  addMesh(new THREE.LatheGeometry(basePoints, 32), matCyan, 'power_base');

  // Base feet (touching y = 0)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const fx = Math.cos(angle) * (BASE_R * 0.72);
    const fz = Math.sin(angle) * (BASE_R * 0.72);
    addMesh(
      new THREE.CylinderGeometry(0.008, 0.009, 0.004, 16),
      matNavy,
      `base_foot_${i + 1}`,
      [fx, 0.002, fz]
    );
  }

  // 2. Kettle Body (LatheGeometry)
  const bodyY0 = BASE_H - 0.002;
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BODY_BOT_R * 0.85, 0.0),
    new THREE.Vector2(BODY_BOT_R * 0.96, 0.012),
    new THREE.Vector2(BODY_BOT_R, 0.032),
    new THREE.Vector2(BODY_BOT_R * 0.98, 0.08),
    new THREE.Vector2(BODY_TOP_R * 1.05, 0.145),
    new THREE.Vector2(BODY_TOP_R, BODY_H - 0.008),
    new THREE.Vector2(BODY_TOP_R * 0.96, BODY_H),
    new THREE.Vector2(BODY_TOP_R * 0.78, BODY_H)
  ];
  addMesh(new THREE.LatheGeometry(bodyPoints, 32), matCyan, 'kettle_body', [0, bodyY0, 0]);

  // Subtle lower seam ring
  addMesh(
    new THREE.TorusGeometry(BODY_BOT_R * 0.99, 0.0014, 10, 32),
    matCyan,
    'kettle_lower_seam',
    [0, bodyY0 + 0.03, 0],
    [Math.PI / 2, 0, 0]
  );

  // 3. Lid Assembly
  const lidY = bodyY0 + BODY_H;
  addMesh(
    new THREE.CylinderGeometry(BODY_TOP_R * 0.78, BODY_TOP_R * 0.8, 0.008, 32),
    matCyan,
    'lid_cap',
    [0, lidY + 0.002, 0]
  );
  addMesh(
    new THREE.TorusGeometry(BODY_TOP_R * 0.86, 0.0045, 12, 32),
    matCyan,
    'lid_rim',
    [0, lidY + 0.001, 0],
    [Math.PI / 2, 0, 0]
  );
  // Orange lid latch tab
  addMesh(
    new THREE.BoxGeometry(0.008, 0.009, 0.022),
    matOrange,
    'lid_orange_tab',
    [-0.012, lidY + 0.006, 0]
  );

  // 4. Spout (-X side)
  const spoutY = bodyY0 + BODY_H - 0.024;
  addMesh(
    new THREE.CylinderGeometry(0.022, 0.008, 0.048, 20),
    matCyan,
    'spout_outer',
    [-BODY_TOP_R - 0.008, spoutY, 0],
    [0, 0, 0.48]
  );
  addMesh(
    new THREE.CylinderGeometry(0.017, 0.006, 0.044, 20),
    matSteel,
    'spout_inner_steel',
    [-BODY_TOP_R - 0.008, spoutY + 0.003, 0],
    [0, 0, 0.48]
  );

  // 5. Handle (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY_TOP_R * 0.92, bodyY0 + BODY_H - 0.012, 0),
    new THREE.Vector3(BODY_TOP_R + 0.044, bodyY0 + BODY_H - 0.015, 0),
    new THREE.Vector3(BODY_TOP_R + 0.056, bodyY0 + BODY_H * 0.55, 0),
    new THREE.Vector3(BODY_TOP_R + 0.048, bodyY0 + 0.062, 0),
    new THREE.Vector3(BODY_BOT_R * 0.92, bodyY0 + 0.056, 0)
  ]);
  addMesh(
    new THREE.TubeGeometry(handleCurve, 24, 0.011, 14, false),
    matCyan,
    'handle_main'
  );

  // Navy outer accent along the back of the handle
  const accentCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY_TOP_R + 0.006, bodyY0 + BODY_H - 0.006, 0),
    new THREE.Vector3(BODY_TOP_R + 0.049, bodyY0 + BODY_H - 0.011, 0),
    new THREE.Vector3(BODY_TOP_R + 0.062, bodyY0 + BODY_H * 0.55, 0),
    new THREE.Vector3(BODY_TOP_R + 0.053, bodyY0 + 0.058, 0),
    new THREE.Vector3(BODY_BOT_R + 0.006, bodyY0 + 0.051, 0)
  ]);
  addMesh(
    new THREE.TubeGeometry(accentCurve, 24, 0.0065, 12, false),
    matNavy,
    'handle_navy_accent'
  );

  // Handle top button
  addMesh(
    new THREE.BoxGeometry(0.022, 0.008, 0.016),
    matNavy,
    'handle_top_button',
    [BODY_TOP_R + 0.032, bodyY0 + BODY_H - 0.003, 0],
    [0, 0, -0.15]
  );

  // 6. Power Switch (+X bottom)
  addMesh(
    new THREE.CapsuleGeometry(0.005, 0.016, 6, 12),
    matNavy,
    'power_switch',
    [BODY_BOT_R + 0.012, bodyY0 + 0.032, 0],
    [0, 0, Math.PI / 2]
  );

  // 7. Water Level Window (+Z front)
  const winY = bodyY0 + BODY_H * 0.48;
  const winZ = (BODY_BOT_R + BODY_TOP_R) * 0.5 - 0.001;
  addMesh(
    new THREE.CapsuleGeometry(0.018, 0.068, 8, 16),
    matSteel,
    'window_steel_back',
    [0, winY, winZ - 0.003],
    [0.06, 0, 0]
  );
  addMesh(
    new THREE.CapsuleGeometry(0.019, 0.068, 8, 16),
    matGlass,
    'window_glass',
    [0, winY, winZ],
    [0.06, 0, 0]
  );

  // Center X and Z, ensure bottom touches y = 0
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.set(-center.x, -box.min.y, -center.z);

  return group;
}
