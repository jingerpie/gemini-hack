function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BASE_R = 0.090;
  const BASE_H = 0.030;
  const BODY_BOTTOM_R = 0.068;
  const BODY_TOP_R = 0.056;
  const BODY_BOTTOM_Y = 0.028;
  const COLLAR_BOTTOM_Y = 0.165;
  const COLLAR_TOP_Y = 0.195;
  const LID_TOP_Y = 0.214;

  // Materials
  const matCharcoal = new THREE.MeshStandardMaterial({
    color: 0x2d2e30,
    roughness: 0.65,
    metalness: 0.1,
  });

  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.45,
    metalness: 0.05,
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.28,
    metalness: 0.85,
  });

  const matDarkBase = new THREE.MeshStandardMaterial({
    color: 0x222325,
    roughness: 0.75,
    metalness: 0.05,
  });

  const matDisplay = new THREE.MeshPhysicalMaterial({
    color: 0x181a1c,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
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

  // 1. Base - Dark lower skirt
  const baseSkirtPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R - 0.004, 0.0),
    new THREE.Vector2(BASE_R - 0.001, 0.006),
    new THREE.Vector2(BASE_R, 0.012),
    new THREE.Vector2(0.0, 0.012),
  ];
  addMesh(
    new THREE.LatheGeometry(baseSkirtPts, 32),
    matDarkBase,
    'base_skirt'
  );

  // 2. Base - Brushed steel top plate
  const basePlatePts = [
    new THREE.Vector2(0.0, 0.011),
    new THREE.Vector2(BASE_R, 0.011),
    new THREE.Vector2(BASE_R, 0.022),
    new THREE.Vector2(BASE_R - 0.004, 0.028),
    new THREE.Vector2(BASE_R - 0.012, BASE_H),
    new THREE.Vector2(BODY_BOTTOM_R + 0.002, BASE_H),
    new THREE.Vector2(BODY_BOTTOM_R, 0.027),
    new THREE.Vector2(0.0, 0.027),
  ];
  addMesh(
    new THREE.LatheGeometry(basePlatePts, 32),
    matSteel,
    'base_top_plate'
  );

  // 3. Base Controls (facing +Z)
  // Display screen (pill-shaped)
  addMesh(
    new THREE.CapsuleGeometry(0.006, 0.018, 8, 16),
    matDisplay,
    'base_display_screen',
    [-0.016, 0.029, 0.068],
    [Math.PI / 2, 0, Math.PI / 2]
  );

  // Rotary dial base ring
  addMesh(
    new THREE.CylinderGeometry(0.0135, 0.014, 0.003, 24),
    matDarkBase,
    'base_dial_ring',
    [0.016, 0.030, 0.066]
  );

  // Rotary dial knob
  addMesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.009, 28),
    matSteel,
    'base_dial_knob',
    [0.016, 0.035, 0.066]
  );

  // Small power/hold button
  addMesh(
    new THREE.CylinderGeometry(0.0065, 0.007, 0.003, 20),
    matDarkBase,
    'base_button',
    [0.042, 0.030, 0.056]
  );

  // 4. Kettle Body - Lower charcoal section
  const bodyPts = [
    new THREE.Vector2(0.0, BODY_BOTTOM_Y),
    new THREE.Vector2(BODY_BOTTOM_R - 0.006, BODY_BOTTOM_Y),
    new THREE.Vector2(BODY_BOTTOM_R - 0.001, BODY_BOTTOM_Y + 0.007),
    new THREE.Vector2(BODY_BOTTOM_R, BODY_BOTTOM_Y + 0.016),
    new THREE.Vector2(0.064, 0.100),
    new THREE.Vector2(0.0595, COLLAR_BOTTOM_Y),
    new THREE.Vector2(0.0, COLLAR_BOTTOM_Y),
  ];
  addMesh(
    new THREE.LatheGeometry(bodyPts, 32),
    matCharcoal,
    'kettle_body_lower'
  );

  // 5. Kettle Body - Upper cream collar
  const collarPts = [
    new THREE.Vector2(0.058, COLLAR_BOTTOM_Y - 0.001),
    new THREE.Vector2(0.0595, COLLAR_BOTTOM_Y),
    new THREE.Vector2(0.0575, 0.180),
    new THREE.Vector2(BODY_TOP_R, COLLAR_TOP_Y - 0.002),
    new THREE.Vector2(BODY_TOP_R - 0.003, COLLAR_TOP_Y),
    new THREE.Vector2(BODY_TOP_R - 0.006, COLLAR_TOP_Y - 0.002),
    new THREE.Vector2(BODY_TOP_R - 0.006, COLLAR_BOTTOM_Y),
  ];
  addMesh(
    new THREE.LatheGeometry(collarPts, 32),
    matCream,
    'kettle_collar_cream'
  );

  // 6. Lid - Recessed dish
  const lidPts = [
    new THREE.Vector2(0.0, 0.188),
    new THREE.Vector2(0.042, 0.188),
    new THREE.Vector2(0.049, 0.193),
    new THREE.Vector2(BODY_TOP_R - 0.004, COLLAR_TOP_Y - 0.001),
    new THREE.Vector2(BODY_TOP_R - 0.004, COLLAR_TOP_Y - 0.005),
    new THREE.Vector2(0.0, 0.185),
  ];
  addMesh(
    new THREE.LatheGeometry(lidPts, 32),
    matCharcoal,
    'kettle_lid_dish'
  );

  // Lid vent detail on -X side
  addMesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.002, 16),
    matDarkBase,
    'kettle_lid_vent',
    [-0.036, 0.191, 0.0]
  );

  // Lid knob stem
  addMesh(
    new THREE.CylinderGeometry(0.013, 0.014, 0.010, 24),
    matDarkBase,
    'kettle_lid_knob_stem',
    [0.0, 0.195, 0.0]
  );

  // Lid knob top cap
  const knobCapPts = [
    new THREE.Vector2(0.0, 0.200),
    new THREE.Vector2(0.019, 0.200),
    new THREE.Vector2(0.021, 0.203),
    new THREE.Vector2(0.021, 0.210),
    new THREE.Vector2(0.019, LID_TOP_Y),
    new THREE.Vector2(0.0, LID_TOP_Y),
  ];
  addMesh(
    new THREE.LatheGeometry(knobCapPts, 28),
    matCharcoal,
    'kettle_lid_knob_cap'
  );

  // 7. Gooseneck Spout (-X side)
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.063, 0.072, 0.0),
    new THREE.Vector3(-0.088, 0.078, 0.0),
    new THREE.Vector3(-0.098, 0.115, 0.0),
    new THREE.Vector3(-0.106, 0.155, 0.0),
    new THREE.Vector3(-0.125, 0.172, 0.0),
    new THREE.Vector3(-0.140, 0.175, 0.0),
  ]);
  addMesh(
    new THREE.TubeGeometry(spoutCurve, 28, 0.0055, 16, false),
    matCharcoal,
    'kettle_spout'
  );

  // Spout tip collar
  addMesh(
    new THREE.TorusGeometry(0.005, 0.0012, 10, 16),
    matDarkBase,
    'kettle_spout_tip',
    [-0.140, 0.175, 0.0],
    [0, Math.PI / 2, 0]
  );

  // 8. Ergonomic Slotted Handle (+X side)
  // Top mount block
  addMesh(
    new THREE.BoxGeometry(0.018, 0.016, 0.020),
    matCharcoal,
    'kettle_handle_top_mount',
    [0.062, 0.176, 0.0]
  );

  // Bottom mount block
  addMesh(
    new THREE.BoxGeometry(0.018, 0.018, 0.020),
    matCharcoal,
    'kettle_handle_bottom_mount',
    [0.068, 0.066, 0.0]
  );

  // Outer handle loop
  const handleOuterCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.064, 0.178, 0.0),
    new THREE.Vector3(0.102, 0.174, 0.0),
    new THREE.Vector3(0.114, 0.150, 0.0),
    new THREE.Vector3(0.124, 0.095, 0.0),
    new THREE.Vector3(0.116, 0.076, 0.0),
    new THREE.Vector3(0.070, 0.064, 0.0),
  ]);
  addMesh(
    new THREE.TubeGeometry(handleOuterCurve, 24, 0.0065, 12, false),
    matCharcoal,
    'kettle_handle_outer'
  );

  // Inner handle loop
  const handleInnerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.064, 0.168, 0.0),
    new THREE.Vector3(0.092, 0.164, 0.0),
    new THREE.Vector3(0.100, 0.142, 0.0),
    new THREE.Vector3(0.108, 0.096, 0.0),
    new THREE.Vector3(0.100, 0.080, 0.0),
    new THREE.Vector3(0.070, 0.070, 0.0),
  ]);
  addMesh(
    new THREE.TubeGeometry(handleInnerCurve, 24, 0.0055, 12, false),
    matCharcoal,
    'kettle_handle_inner'
  );

  return group;
}
