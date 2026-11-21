function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, 27-inch business monitor)
  const W = 0.61;
  const H = 0.50;
  const PANEL_H = 0.365;
  const PANEL_D = 0.022;
  const LOWER_H = 0.085;
  const LOWER_D = 0.036;
  const BEZEL_T = 0.006;
  const BEZEL_CHIN = 0.014;

  const BASE_W = 0.24;
  const BASE_D = 0.20;
  const BASE_T = 0.012;
  const FOOT_H = 0.002;

  const COL_W = 0.056;
  const COL_D = 0.032;
  const COL_H = 0.36;

  const VESA_SIZE = 0.11;
  const VESA_D = 0.012;
  const NECK_W = 0.044;
  const NECK_H = 0.044;
  const NECK_D = 0.045;

  // Centering Z: panel front is near +Z, base extends toward -Z and +Z
  const PANEL_Z = 0.025;
  const BASE_Z = -0.02;
  const COL_Z = BASE_Z - BASE_D * 0.28;
  const PANEL_BOTTOM_Y = H - PANEL_H;
  const PANEL_CENTER_Y = PANEL_BOTTOM_Y + PANEL_H * 0.5;

  // Materials
  const matBody = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.65,
    metalness: 0.15
  });
  const matStand = new THREE.MeshStandardMaterial({
    color: 0x1c1e20,
    roughness: 0.5,
    metalness: 0.35
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.8,
    metalness: 0.1
  });
  const matScrew = new THREE.MeshStandardMaterial({
    color: 0x55585c,
    roughness: 0.35,
    metalness: 0.8
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0xdbe9f6,
    emissive: 0xc8dff5,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.05
  });
  const matLed = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x66bbff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Rubber feet (y = 0 to FOOT_H)
  const footGeo = new THREE.CylinderGeometry(0.008, 0.008, FOOT_H, 12);
  const fx = BASE_W * 0.5 - 0.018;
  const fz = BASE_D * 0.5 - 0.018;
  addMesh(footGeo, matDark, "base_rubber_foot_fl", -fx, FOOT_H * 0.5, BASE_Z + fz);
  addMesh(footGeo, matDark, "base_rubber_foot_fr", fx, FOOT_H * 0.5, BASE_Z + fz);
  addMesh(footGeo, matDark, "base_rubber_foot_bl", -fx, FOOT_H * 0.5, BASE_Z - fz);
  addMesh(footGeo, matDark, "base_rubber_foot_br", fx, FOOT_H * 0.5, BASE_Z - fz);

  // Base plate
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_T, BASE_D);
  addMesh(baseGeo, matStand, "base_plate", 0, FOOT_H + BASE_T * 0.5, BASE_Z);

  // Stand vertical column
  const colGeo = new THREE.BoxGeometry(COL_W, COL_H, COL_D);
  const colY = FOOT_H + BASE_T + COL_H * 0.5 - 0.002;
  addMesh(colGeo, matStand, "stand_column", 0, colY, COL_Z);

  // Cable slot detail on stand column
  const slotGeo = new THREE.BoxGeometry(0.018, 0.065, COL_D + 0.002);
  addMesh(slotGeo, matDark, "stand_cable_slot", 0, FOOT_H + BASE_T + 0.055, COL_Z);

  // Stand neck connecting column to VESA mount
  const neckZ = (COL_Z + (PANEL_Z - PANEL_D - VESA_D * 0.5)) * 0.5;
  const neckGeo = new THREE.BoxGeometry(NECK_W, NECK_H, NECK_D);
  addMesh(neckGeo, matStand, "stand_neck", 0, PANEL_CENTER_Y - 0.01, neckZ);

  // VESA mount plate on back of monitor
  const vesaZ = PANEL_Z - PANEL_D - VESA_D * 0.5;
  const vesaGeo = new THREE.BoxGeometry(VESA_SIZE, VESA_SIZE, VESA_D);
  addMesh(vesaGeo, matStand, "vesa_mount", 0, PANEL_CENTER_Y - 0.01, vesaZ);

  // VESA screws
  const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 10);
  const sv = VESA_SIZE * 0.5 - 0.012;
  const screwZ = vesaZ - VESA_D * 0.5 - 0.001;
  addMesh(screwGeo, matScrew, "vesa_screw_tl", -sv, PANEL_CENTER_Y - 0.01 + sv, screwZ, Math.PI * 0.5, 0, 0);
  addMesh(screwGeo, matScrew, "vesa_screw_tr", sv, PANEL_CENTER_Y - 0.01 + sv, screwZ, Math.PI * 0.5, 0, 0);
  addMesh(screwGeo, matScrew, "vesa_screw_bl", -sv, PANEL_CENTER_Y - 0.01 - sv, screwZ, Math.PI * 0.5, 0, 0);
  addMesh(screwGeo, matScrew, "vesa_screw_br", sv, PANEL_CENTER_Y - 0.01 - sv, screwZ, Math.PI * 0.5, 0, 0);

  // Monitor main back panel
  const backGeo = new THREE.BoxGeometry(W, PANEL_H, PANEL_D);
  addMesh(backGeo, matBody, "monitor_back_panel", 0, PANEL_CENTER_Y, PANEL_Z - PANEL_D * 0.5);

  // Monitor lower thicker housing (ports area)
  const lowerGeo = new THREE.BoxGeometry(W - 0.004, LOWER_H, LOWER_D - PANEL_D);
  addMesh(
    lowerGeo,
    matBody,
    "monitor_lower_housing",
    0,
    PANEL_BOTTOM_Y + LOWER_H * 0.5,
    PANEL_Z - PANEL_D - (LOWER_D - PANEL_D) * 0.5 + 0.002
  );

  // Front bezels (facing +Z)
  const bezelZ = PANEL_Z + 0.002;
  const topBezelGeo = new THREE.BoxGeometry(W, BEZEL_T, 0.005);
  addMesh(topBezelGeo, matDark, "bezel_top", 0, H - BEZEL_T * 0.5, bezelZ);

  const botBezelGeo = new THREE.BoxGeometry(W, BEZEL_CHIN, 0.005);
  addMesh(botBezelGeo, matDark, "bezel_bottom", 0, PANEL_BOTTOM_Y + BEZEL_CHIN * 0.5, bezelZ);

  const sideBezelH = PANEL_H - BEZEL_T - BEZEL_CHIN;
  const sideBezelY = PANEL_BOTTOM_Y + BEZEL_CHIN + sideBezelH * 0.5;
  const sideBezelGeo = new THREE.BoxGeometry(BEZEL_T, sideBezelH, 0.005);
  addMesh(sideBezelGeo, matDark, "bezel_left", -W * 0.5 + BEZEL_T * 0.5, sideBezelY, bezelZ);
  addMesh(sideBezelGeo, matDark, "bezel_right", W * 0.5 - BEZEL_T * 0.5, sideBezelY, bezelZ);

  // Lit screen panel (slightly in front of bezel)
  const screenW = W - BEZEL_T * 2;
  const screenH = sideBezelH;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.002);
  addMesh(screenGeo, matScreen, "emit_screen", 0, sideBezelY, PANEL_Z + 0.0045);

  // Power LED on bottom bezel
  const ledGeo = new THREE.BoxGeometry(0.006, 0.002, 0.002);
  addMesh(ledGeo, matLed, "emit_power_led", W * 0.5 - 0.035, PANEL_BOTTOM_Y + BEZEL_CHIN * 0.5, bezelZ + 0.0025);

  // Port plug & routed cable
  const plugX = -0.09;
  const plugY = PANEL_BOTTOM_Y + 0.032;
  const plugZ = PANEL_Z - LOWER_D - 0.006;
  const plugGeo = new THREE.BoxGeometry(0.014, 0.018, 0.012);
  addMesh(plugGeo, matDark, "port_plug", plugX, plugY, plugZ);

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(plugX, plugY - 0.008, plugZ),
    new THREE.Vector3(plugX * 0.7, plugY - 0.05, plugZ - 0.02),
    new THREE.Vector3(0, FOOT_H + BASE_T + 0.055, COL_Z + 0.005),
    new THREE.Vector3(0.04, FOOT_H + 0.012, COL_Z - 0.03),
    new THREE.Vector3(0.14, FOOT_H + 0.005, COL_Z - 0.05)
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.0035, 8, false);
  addMesh(cableGeo, matDark, "cable_main", 0, 0, 0);

  return group;
}
