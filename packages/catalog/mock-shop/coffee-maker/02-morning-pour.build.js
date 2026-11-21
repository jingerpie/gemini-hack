function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.20;
  const H = 0.34;
  const D = 0.23;

  const FOOT_H = 0.006;
  const BASE_H = 0.052;
  const BASE_R = 0.088;
  const PLATE_H = 0.007;

  const COL_W = 0.165;
  const COL_D = 0.10;
  const COL_Z = -0.055;

  const HEAD_Y = 0.212;
  const HEAD_H = 0.123;
  const HEAD_R = 0.086;
  const HEAD_Z = 0.025;

  const CARAFE_X = -0.008;
  const CARAFE_Z = 0.032;
  const CARAFE_Y = FOOT_H + BASE_H + PLATE_H;
  const CARAFE_H = 0.115;

  // Shared materials
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6e0ce,
    roughness: 0.42,
    metalness: 0.02,
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc9cdd1,
    roughness: 0.28,
    metalness: 0.82,
  });

  const matDark = new THREE.MeshStandardMaterial({
    color: 0x262626,
    roughness: 0.55,
    metalness: 0.1,
  });

  const matLcd = new THREE.MeshStandardMaterial({
    color: 0x767f73,
    roughness: 0.25,
    metalness: 0.05,
  });

  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.36,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const matWaterWin = new THREE.MeshPhysicalMaterial({
    color: 0xd0d6d8,
    roughness: 0.15,
    metalness: 0.0,
    transparent: true,
    opacity: 0.55,
  });

  function addMesh(geo, mat, name, px, py, pz, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(px || 0, py || 0, pz || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Feet (4 small rubber feet touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.011, 0.013, FOOT_H, 16);
  const footPositions = [
    [-0.055, FOOT_H / 2, 0.065],
    [0.055, FOOT_H / 2, 0.065],
    [-0.055, FOOT_H / 2, -0.075],
    [0.055, FOOT_H / 2, -0.075],
  ];
  footPositions.forEach((p, i) => {
    addMesh(footGeo, matDark, `foot_${i + 1}`, p[0], p[1], p[2]);
  });

  // 2. Base platform (rounded front + rear extension)
  const baseFrontGeo = new THREE.CylinderGeometry(BASE_R, BASE_R * 1.02, BASE_H, 32);
  addMesh(baseFrontGeo, matCream, 'base_front', 0, FOOT_H + BASE_H / 2, 0.025);

  const baseRearGeo = new THREE.BoxGeometry(BASE_R * 1.9, BASE_H, 0.10);
  addMesh(baseRearGeo, matCream, 'base_rear', 0, FOOT_H + BASE_H / 2, -0.045);

  // 3. Warming plate
  const plateGeo = new THREE.CylinderGeometry(0.066, 0.068, PLATE_H, 32);
  addMesh(plateGeo, matDark, 'warming_plate', CARAFE_X, FOOT_H + BASE_H + PLATE_H / 2, CARAFE_Z);

  // 4. Rear column / water reservoir
  const colH = HEAD_Y + HEAD_H - (FOOT_H + BASE_H);
  const colGeo = new THREE.CylinderGeometry(COL_W / 2, COL_W / 2, colH, 32);
  addMesh(colGeo, matCream, 'rear_column', 0, FOOT_H + BASE_H + colH / 2, COL_Z);

  // 5. Upper brew head
  const headGeo = new THREE.CylinderGeometry(HEAD_R, HEAD_R * 0.98, HEAD_H, 32);
  addMesh(headGeo, matCream, 'brew_head', 0, HEAD_Y + HEAD_H / 2, HEAD_Z);

  // Bridge between rear column and brew head
  const bridgeGeo = new THREE.BoxGeometry(COL_W * 0.96, HEAD_H, 0.08);
  addMesh(bridgeGeo, matCream, 'head_bridge', 0, HEAD_Y + HEAD_H / 2, -0.015);

  // 6. Top lid
  const lidGeo = new THREE.CylinderGeometry(HEAD_R * 0.98, HEAD_R, 0.008, 32);
  addMesh(lidGeo, matCream, 'top_lid', 0, HEAD_Y + HEAD_H + 0.004, HEAD_Z);

  const lidTabGeo = new THREE.BoxGeometry(0.036, 0.006, 0.014);
  addMesh(lidTabGeo, matCream, 'lid_tab', 0, HEAD_Y + HEAD_H + 0.007, HEAD_Z + HEAD_R - 0.005);

  // 7. Brushed steel wrap-around band on lower brew head
  const steelBandGeo = new THREE.CylinderGeometry(
    HEAD_R + 0.0015,
    HEAD_R + 0.0015,
    0.048,
    32,
    1,
    false,
    -Math.PI * 0.42,
    Math.PI * 0.84
  );
  addMesh(steelBandGeo, matSteel, 'steel_band', 0, HEAD_Y + 0.026, HEAD_Z);

  // 8. Brushed steel control panel (upper center)
  const panelGeo = new THREE.CylinderGeometry(
    HEAD_R + 0.0018,
    HEAD_R + 0.0018,
    0.072,
    32,
    1,
    false,
    -Math.PI * 0.22,
    Math.PI * 0.44
  );
  addMesh(panelGeo, matSteel, 'control_panel', 0, HEAD_Y + 0.086, HEAD_Z);

  // 9. LCD display
  const lcdBezelGeo = new THREE.BoxGeometry(0.042, 0.024, 0.006);
  addMesh(lcdBezelGeo, matDark, 'lcd_bezel', 0, HEAD_Y + 0.094, HEAD_Z + HEAD_R - 0.001);

  const lcdScreenGeo = new THREE.BoxGeometry(0.036, 0.018, 0.007);
  addMesh(lcdScreenGeo, matLcd, 'lcd_screen', 0, HEAD_Y + 0.094, HEAD_Z + HEAD_R - 0.0005);

  // 10. Three control buttons below LCD
  const btnGeo = new THREE.BoxGeometry(0.016, 0.007, 0.006);
  [-0.020, 0, 0.020].forEach((bx, idx) => {
    addMesh(btnGeo, matSteel, `control_button_${idx + 1}`, bx, HEAD_Y + 0.068, HEAD_Z + HEAD_R - 0.001);
  });

  // 11. Brew basket underside & drip-stop valve
  const basketGeo = new THREE.CylinderGeometry(0.056, 0.042, 0.024, 28);
  addMesh(basketGeo, matCream, 'brew_basket_bottom', CARAFE_X, HEAD_Y - 0.012, CARAFE_Z);

  const valveGeo = new THREE.CylinderGeometry(0.012, 0.008, 0.010, 16);
  addMesh(valveGeo, matDark, 'drip_valve', CARAFE_X, HEAD_Y - 0.027, CARAFE_Z);

  // 12. Water level window on right (+X) side
  const waterWinGeo = new THREE.BoxGeometry(0.008, 0.14, 0.016);
  addMesh(waterWinGeo, matWaterWin, 'water_level_window', COL_W / 2 - 0.002, 0.22, COL_Z + 0.02);

  // 13. Glass Carafe (LatheGeometry)
  const carafePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.056, 0.0),
    new THREE.Vector2(0.064, 0.012),
    new THREE.Vector2(0.066, 0.055),
    new THREE.Vector2(0.062, 0.088),
    new THREE.Vector2(0.050, 0.105),
    new THREE.Vector2(0.052, 0.115),
  ];
  const carafeGeo = new THREE.LatheGeometry(carafePoints, 32);
  addMesh(carafeGeo, matGlass, 'carafe_glass', CARAFE_X, CARAFE_Y, CARAFE_Z);

  // 14. Carafe bottom metal band
  const carafeBandGeo = new THREE.CylinderGeometry(0.0655, 0.064, 0.012, 32, 1, true);
  addMesh(carafeBandGeo, matSteel, 'carafe_metal_band', CARAFE_X, CARAFE_Y + 0.014, CARAFE_Z);

  // 15. Carafe lid
  const carafeLidGeo = new THREE.CylinderGeometry(0.053, 0.055, 0.010, 28);
  addMesh(carafeLidGeo, matCream, 'carafe_lid', CARAFE_X, CARAFE_Y + CARAFE_H + 0.003, CARAFE_Z);

  const carafeCapGeo = new THREE.SphereGeometry(0.014, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  addMesh(carafeCapGeo, matCream, 'carafe_lid_cap', CARAFE_X, CARAFE_Y + CARAFE_H + 0.008, CARAFE_Z);

  // 16. Carafe spout (-X side)
  const spoutGeo = new THREE.ConeGeometry(0.010, 0.018, 12);
  addMesh(spoutGeo, matGlass, 'carafe_spout', CARAFE_X - 0.056, CARAFE_Y + CARAFE_H - 0.006, CARAFE_Z, 0, 0, Math.PI * 0.35);

  // 17. Carafe handle (+X side, D-shaped tube)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CARAFE_X + 0.050, CARAFE_Y + CARAFE_H - 0.006, CARAFE_Z),
    new THREE.Vector3(CARAFE_X + 0.100, CARAFE_Y + CARAFE_H - 0.008, CARAFE_Z),
    new THREE.Vector3(CARAFE_X + 0.104, CARAFE_Y + CARAFE_H * 0.5, CARAFE_Z),
    new THREE.Vector3(CARAFE_X + 0.100, CARAFE_Y + 0.018, CARAFE_Z),
    new THREE.Vector3(CARAFE_X + 0.062, CARAFE_Y + 0.018, CARAFE_Z),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0095, 12, false);
  addMesh(handleGeo, matCream, 'carafe_handle', 0, 0, 0);

  return group;
}
