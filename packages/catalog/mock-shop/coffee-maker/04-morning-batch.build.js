function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.21;
  const H = 0.34;
  const D = 0.25;
  const R = 0.025; // Corner radius
  const FOOT_H = 0.008;
  const BASE_H = 0.045;
  const UPPER_H = 0.115;
  const LID_H = 0.012;
  const BODY_BACK_D = 0.105; // Rear column depth

  // Materials
  const matDarkPlastic = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.55,
    metalness: 0.05,
  });
  const matLidPlastic = new THREE.MeshStandardMaterial({
    color: 0x62666a,
    roughness: 0.5,
    metalness: 0.05,
  });
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc8cccf,
    roughness: 0.28,
    metalness: 0.85,
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.4,
    metalness: 0.7,
  });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xe6f0f2,
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    clearcoat: 0.8,
  });
  const matWaterWindow = new THREE.MeshStandardMaterial({
    color: 0xb8c4c8,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const matLCD = new THREE.MeshStandardMaterial({
    color: 0x8f998a,
    roughness: 0.25,
    metalness: 0.1,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Helper: rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r);
    s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r);
    s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  }

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

  // 1. Rubber feet (4x)
  const footGeo = new THREE.CylinderGeometry(0.012, 0.01, FOOT_H, 16);
  const footX = W / 2 - 0.03;
  const footZ = D / 2 - 0.03;
  addMesh(footGeo, matRubber, "foot_front_left", -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, matRubber, "foot_front_right", footX, FOOT_H / 2, footZ);
  addMesh(footGeo, matRubber, "foot_back_left", -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, matRubber, "foot_back_right", footX, FOOT_H / 2, -footZ);

  // 2. Base platform
  const baseShape = roundedRectShape(W, D, R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 12,
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, matDarkPlastic, "base_platform", 0, FOOT_H, 0);

  // 3. Base stainless steel front trim
  const baseTrimShape = roundedRectShape(W + 0.002, D * 0.55, R);
  const baseTrimGeo = new THREE.ExtrudeGeometry(baseTrimShape, {
    depth: BASE_H * 0.55,
    bevelEnabled: false,
    curveSegments: 12,
  });
  baseTrimGeo.rotateX(-Math.PI / 2);
  addMesh(
    baseTrimGeo,
    matSteel,
    "base_steel_trim",
    0,
    FOOT_H + 0.008,
    D / 2 - (D * 0.55) / 2 + 0.001
  );

  // 4. Rear vertical column
  const colH = H - FOOT_H - BASE_H - LID_H;
  const colShape = roundedRectShape(W, BODY_BACK_D, R);
  const colGeo = new THREE.ExtrudeGeometry(colShape, {
    depth: colH,
    bevelEnabled: false,
    curveSegments: 12,
  });
  colGeo.rotateX(-Math.PI / 2);
  addMesh(
    colGeo,
    matDarkPlastic,
    "rear_column",
    0,
    FOOT_H + BASE_H,
    -D / 2 + BODY_BACK_D / 2
  );

  // 5. Water level window on -X side of rear column
  const winGeo = new THREE.BoxGeometry(0.006, colH * 0.62, 0.016);
  addMesh(
    winGeo,
    matWaterWindow,
    "water_level_window",
    -W / 2 - 0.001,
    FOOT_H + BASE_H + colH * 0.58,
    -D / 2 + BODY_BACK_D * 0.55
  );

  // 6. Upper overhanging head
  const upperY = H - LID_H - UPPER_H;
  const upperShape = roundedRectShape(W, D, R);
  const upperGeo = new THREE.ExtrudeGeometry(upperShape, {
    depth: UPPER_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 12,
  });
  upperGeo.rotateX(-Math.PI / 2);
  addMesh(upperGeo, matDarkPlastic, "upper_head", 0, upperY, 0);

  // 7. Upper brushed steel front fascia
  const fasciaD = D * 0.52;
  const fasciaShape = roundedRectShape(W + 0.002, fasciaD, R);
  const fasciaGeo = new THREE.ExtrudeGeometry(fasciaShape, {
    depth: UPPER_H - 0.012,
    bevelEnabled: false,
    curveSegments: 12,
  });
  fasciaGeo.rotateX(-Math.PI / 2);
  addMesh(
    fasciaGeo,
    matSteel,
    "upper_steel_fascia",
    0,
    upperY + 0.006,
    D / 2 - fasciaD / 2 + 0.001
  );

  // 8. Top lid
  const lidShape = roundedRectShape(W - 0.012, D - 0.012, R * 0.85);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12,
  });
  lidGeo.rotateX(-Math.PI / 2);
  addMesh(lidGeo, matLidPlastic, "top_lid", 0, H - LID_H, 0);

  // Top lid front tab
  const tabGeo = new THREE.BoxGeometry(0.036, 0.006, 0.012);
  addMesh(tabGeo, matLidPlastic, "top_lid_tab", 0, H - LID_H + 0.003, D / 2 - 0.008);

  // 9. Control panel details on +Z face
  const panelZ = D / 2 + 0.002;
  const panelCenterY = upperY + UPPER_H * 0.54;

  // LCD bezel & screen
  const bezelGeo = new THREE.BoxGeometry(0.044, 0.026, 0.004);
  addMesh(bezelGeo, matDarkPlastic, "lcd_bezel", 0, panelCenterY + 0.022, panelZ);
  const lcdGeo = new THREE.BoxGeometry(0.038, 0.02, 0.002);
  addMesh(lcdGeo, matLCD, "lcd_screen", 0, panelCenterY + 0.022, panelZ + 0.0015);

  // Central rotary knob
  const knobGeo = new THREE.CylinderGeometry(0.011, 0.012, 0.012, 24);
  knobGeo.rotateX(Math.PI / 2);
  addMesh(knobGeo, matSteel, "brew_strength_knob", 0, panelCenterY - 0.016, panelZ + 0.005);

  // Pill buttons (3 left, 3 right)
  const btnGeo = new THREE.CapsuleGeometry(0.004, 0.01, 4, 8);
  btnGeo.rotateZ(Math.PI / 2);
  const btnOffsetsY = [0.028, 0.01, -0.016];
  btnOffsetsY.forEach((dy, i) => {
    addMesh(btnGeo, matSteel, `button_left_${i + 1}`, -0.042, panelCenterY + dy, panelZ + 0.001);
    addMesh(btnGeo, matSteel, `button_right_${i + 1}`, 0.042, panelCenterY + dy, panelZ + 0.001);
  });

  // 10. Filter basket / brew head underneath upper overhang
  const carafeZ = 0.025;
  const basketGeo = new THREE.CylinderGeometry(0.062, 0.048, 0.024, 24);
  addMesh(basketGeo, matDarkPlastic, "brew_basket_holder", 0, upperY - 0.01, carafeZ);

  // 11. Warming plate on base
  const plateY = FOOT_H + BASE_H + 0.003;
  const plateGeo = new THREE.CylinderGeometry(0.072, 0.074, 0.005, 28);
  addMesh(plateGeo, matDarkMetal, "warming_plate", 0, plateY, carafeZ);

  // 12. Glass Carafe (LatheGeometry)
  const carafeBaseY = plateY + 0.0025;
  const carafeH = 0.135;
  const carafePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.062, 0.0),
    new THREE.Vector2(0.074, 0.018),
    new THREE.Vector2(0.076, 0.055),
    new THREE.Vector2(0.068, 0.105),
    new THREE.Vector2(0.058, 0.125),
    new THREE.Vector2(0.062, carafeH),
  ];
  const carafeGeo = new THREE.LatheGeometry(carafePts, 28);
  addMesh(carafeGeo, matGlass, "carafe_glass_body", 0, carafeBaseY, carafeZ);

  // Carafe bottom steel band
  const bandGeo = new THREE.CylinderGeometry(0.071, 0.066, 0.01, 28, 1, true);
  addMesh(bandGeo, matSteel, "carafe_steel_band", 0, carafeBaseY + 0.006, carafeZ);

  // Carafe lid
  const carafeLidGeo = new THREE.CylinderGeometry(0.064, 0.062, 0.016, 24);
  addMesh(carafeLidGeo, matDarkPlastic, "carafe_lid", 0, carafeBaseY + carafeH + 0.004, carafeZ);

  // Carafe lid brew-through nub
  const nubGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.012, 16);
  addMesh(nubGeo, matDarkPlastic, "carafe_lid_nub", 0, carafeBaseY + carafeH + 0.016, carafeZ);

  // 13. Carafe handle (TubeGeometry on +Z side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, carafeBaseY + carafeH + 0.002, carafeZ + 0.058),
    new THREE.Vector3(0, carafeBaseY + carafeH - 0.004, carafeZ + 0.102),
    new THREE.Vector3(0, carafeBaseY + carafeH * 0.5, carafeZ + 0.106),
    new THREE.Vector3(0, carafeBaseY + 0.018, carafeZ + 0.102),
    new THREE.Vector3(0, carafeBaseY + 0.016, carafeZ + 0.068),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 20, 0.011, 12, false);
  addMesh(handleGeo, matDarkPlastic, "carafe_handle");

  return group;
}
