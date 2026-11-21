function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.615;
  const SCREEN_W = 0.607;
  const SCREEN_H = 0.345;
  const BEZEL_T = 0.004;
  const CHIN_H = 0.016;
  const PANEL_H = SCREEN_H + BEZEL_T + CHIN_H;
  const PANEL_D = 0.018;

  const BASE_W = 0.22;
  const BASE_D = 0.18;
  const BASE_H = 0.008;
  const PAD_H = 0.002;

  const COL_W = 0.044;
  const COL_D = 0.022;
  const COL_Z = -0.025;
  const PANEL_BOTTOM_Y = 0.10;
  const PANEL_Z = 0.025;

  // Materials
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd0d2d4,
    roughness: 0.32,
    metalness: 0.82,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e30,
    roughness: 0.45,
    metalness: 0.6,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  });

  const screenBackingMat = new THREE.MeshStandardMaterial({
    color: 0x050608,
    roughness: 0.15,
    metalness: 0.1,
  });

  const emitScreenMat = new THREE.MeshStandardMaterial({
    color: 0x0b1018,
    emissive: 0xcfe2ff,
    emissiveIntensity: 0.6,
    roughness: 0.12,
    metalness: 0.05,
  });

  const emitLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xd8ecff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(name, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Rubber feet under base (touching y = 0)
  const padGeo = new THREE.CylinderGeometry(0.008, 0.008, PAD_H, 16);
  const padOffX = BASE_W * 0.42;
  const padOffZ = BASE_D * 0.4;
  addMesh('base_rubber_pad_fl', padGeo, rubberMat, -padOffX, PAD_H / 2, padOffZ);
  addMesh('base_rubber_pad_fr', padGeo, rubberMat, padOffX, PAD_H / 2, padOffZ);
  addMesh('base_rubber_pad_bl', padGeo, rubberMat, -padOffX, PAD_H / 2, -padOffZ);
  addMesh('base_rubber_pad_br', padGeo, rubberMat, padOffX, PAD_H / 2, -padOffZ);

  // 2. Base plate (rounded rectangle extruded)
  const r = 0.008;
  const bw = BASE_W / 2;
  const bd = BASE_D / 2;
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-bw + r, -bd);
  baseShape.lineTo(bw - r, -bd);
  baseShape.quadraticCurveTo(bw, -bd, bw, -bd + r);
  baseShape.lineTo(bw, bd - r);
  baseShape.quadraticCurveTo(bw, bd, bw - r, bd);
  baseShape.lineTo(-bw + r, bd);
  baseShape.quadraticCurveTo(-bw, bd, -bw, bd - r);
  baseShape.lineTo(-bw, -bd + r);
  baseShape.quadraticCurveTo(-bw, -bd, -bw + r, -bd);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh('base_plate', baseGeo, silverMat, 0, PAD_H + BASE_H, 0);

  // 3. Stand column (with pill-shaped cable cutout near the top)
  const colBaseY = PAD_H + BASE_H;
  const lowerH = 0.068;
  const cutoutH = 0.036;
  const upperH = 0.06;

  addMesh(
    'stand_column_lower',
    new THREE.BoxGeometry(COL_W, lowerH, COL_D),
    silverMat,
    0,
    colBaseY + lowerH / 2,
    COL_Z
  );

  const strutW = 0.011;
  const strutX = (COL_W - strutW) / 2;
  const cutoutCenterY = colBaseY + lowerH + cutoutH / 2;
  addMesh(
    'stand_column_left_strut',
    new THREE.BoxGeometry(strutW, cutoutH, COL_D),
    silverMat,
    -strutX,
    cutoutCenterY,
    COL_Z
  );
  addMesh(
    'stand_column_right_strut',
    new THREE.BoxGeometry(strutW, cutoutH, COL_D),
    silverMat,
    strutX,
    cutoutCenterY,
    COL_Z
  );

  const upperY = colBaseY + lowerH + cutoutH + upperH / 2;
  addMesh(
    'stand_column_upper',
    new THREE.BoxGeometry(COL_W, upperH, COL_D),
    silverMat,
    0,
    upperY,
    COL_Z
  );

  // 4. Hinge arm & VESA mount connecting column to monitor back
  const hingeY = colBaseY + lowerH + cutoutH + upperH * 0.7;
  const armLen = PANEL_Z - PANEL_D / 2 - COL_Z;
  addMesh(
    'stand_hinge_arm',
    new THREE.BoxGeometry(0.036, 0.028, armLen + 0.01),
    silverMat,
    0,
    hingeY,
    COL_Z + armLen / 2
  );

  addMesh(
    'vesa_mount_plate',
    new THREE.BoxGeometry(0.11, 0.11, 0.008),
    darkMetalMat,
    0,
    hingeY,
    PANEL_Z - PANEL_D / 2 - 0.003
  );

  // 5. Monitor housing & bezels
  const panelCenterY = PANEL_BOTTOM_Y + PANEL_H / 2;
  const screenCenterY = PANEL_BOTTOM_Y + CHIN_H + SCREEN_H / 2;

  addMesh(
    'monitor_back_housing',
    new THREE.BoxGeometry(W - 0.002, PANEL_H - 0.002, PANEL_D - 0.004),
    silverMat,
    0,
    panelCenterY,
    PANEL_Z - 0.002
  );

  // Top, Left, Right thin bezels
  addMesh(
    'bezel_top',
    new THREE.BoxGeometry(W, BEZEL_T, PANEL_D),
    silverMat,
    0,
    PANEL_BOTTOM_Y + PANEL_H - BEZEL_T / 2,
    PANEL_Z
  );
  addMesh(
    'bezel_left',
    new THREE.BoxGeometry(BEZEL_T, SCREEN_H, PANEL_D),
    silverMat,
    -W / 2 + BEZEL_T / 2,
    screenCenterY,
    PANEL_Z
  );
  addMesh(
    'bezel_right',
    new THREE.BoxGeometry(BEZEL_T, SCREEN_H, PANEL_D),
    silverMat,
    W / 2 - BEZEL_T / 2,
    screenCenterY,
    PANEL_Z
  );

  // Bottom chin
  addMesh(
    'bezel_chin',
    new THREE.BoxGeometry(W, CHIN_H, PANEL_D),
    silverMat,
    0,
    PANEL_BOTTOM_Y + CHIN_H / 2,
    PANEL_Z
  );

  // 6. Screen backing & lit emit_screen
  addMesh(
    'screen_backing',
    new THREE.BoxGeometry(SCREEN_W, SCREEN_H, 0.002),
    screenBackingMat,
    0,
    screenCenterY,
    PANEL_Z + PANEL_D / 2 - 0.002
  );

  addMesh(
    'emit_screen',
    new THREE.BoxGeometry(SCREEN_W - 0.002, SCREEN_H - 0.002, 0.001),
    emitScreenMat,
    0,
    screenCenterY,
    PANEL_Z + PANEL_D / 2 + 0.0005
  );

  // 7. Bottom-right control buttons & power LED
  const btnGeo = new THREE.BoxGeometry(0.007, 0.002, 0.004);
  const btnY = PANEL_BOTTOM_Y - 0.0005;
  const btnZ = PANEL_Z + PANEL_D / 2 - 0.004;
  for (let i = 0; i < 4; i++) {
    addMesh(
      `control_button_${i + 1}`,
      btnGeo,
      darkMetalMat,
      W / 2 - 0.075 + i * 0.014,
      btnY,
      btnZ
    );
  }

  addMesh(
    'emit_power_led',
    new THREE.CylinderGeometry(0.0012, 0.0012, 0.002, 12),
    emitLedMat,
    W / 2 - 0.018,
    PANEL_BOTTOM_Y + CHIN_H / 2,
    PANEL_Z + PANEL_D / 2 + 0.0005
  );

  return group;
}
