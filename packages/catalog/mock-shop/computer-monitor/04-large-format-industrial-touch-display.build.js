function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.68;
  const D = 0.055;
  const BEZEL_W = 0.055;
  const BEZEL_R = 0.012;
  const BEZEL_D = 0.016;
  const SCREEN_W = W - 2 * BEZEL_W;
  const SCREEN_H = H - 2 * BEZEL_W;
  const CHASSIS_D = D - BEZEL_D;
  const VESA_SIZE = 0.22;
  const VESA_D = 0.01;

  // Materials
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.35,
    metalness: 0.65
  });

  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.5,
    metalness: 0.5
  });

  const matVesa = new THREE.MeshStandardMaterial({
    color: 0x2e3134,
    roughness: 0.45,
    metalness: 0.7
  });

  const matScreen = new THREE.MeshStandardMaterial({
    color: 0xd5dce0,
    emissive: 0xdbe4ea,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.05
  });

  const matUiLight = new THREE.MeshStandardMaterial({
    color: 0xeaeceb,
    emissive: 0xeaeceb,
    emissiveIntensity: 0.35,
    roughness: 0.3
  });

  const matUiHeader = new THREE.MeshStandardMaterial({
    color: 0xb5b9bc,
    emissive: 0xb5b9bc,
    emissiveIntensity: 0.25,
    roughness: 0.35
  });

  const matUiAmber = new THREE.MeshStandardMaterial({
    color: 0xd9a74a,
    emissive: 0xd9a74a,
    emissiveIntensity: 0.4,
    roughness: 0.3
  });

  const matUiMint = new THREE.MeshStandardMaterial({
    color: 0x7ec4b0,
    emissive: 0x7ec4b0,
    emissiveIntensity: 0.35,
    roughness: 0.3
  });

  // Helper to add mesh with shadows
  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  const centerY = H / 2;
  const frontZ = D / 2;
  const bezelBackZ = frontZ - BEZEL_D;

  // 1. Rear Chassis
  const chassisGeo = new THREE.BoxGeometry(W - 0.02, H - 0.02, CHASSIS_D);
  addMesh(
    chassisGeo,
    matChassis,
    "chassis_back",
    0,
    centerY,
    bezelBackZ - CHASSIS_D / 2
  );

  // 2. VESA Mount Plate on rear (-Z)
  const vesaGeo = new THREE.BoxGeometry(VESA_SIZE, VESA_SIZE, VESA_D);
  addMesh(
    vesaGeo,
    matVesa,
    "vesa_mount_plate",
    0,
    centerY,
    bezelBackZ - CHASSIS_D - VESA_D / 2
  );

  // 3. Bezel Frame (Extruded rounded rectangle with inner cutout)
  const hw = W / 2;
  const hh = H / 2;
  const bezelShape = new THREE.Shape();
  bezelShape.moveTo(-hw + BEZEL_R, -hh);
  bezelShape.lineTo(hw - BEZEL_R, -hh);
  bezelShape.quadraticCurveTo(hw, -hh, hw, -hh + BEZEL_R);
  bezelShape.lineTo(hw, hh - BEZEL_R);
  bezelShape.quadraticCurveTo(hw, hh, hw - BEZEL_R, hh);
  bezelShape.lineTo(-hw + BEZEL_R, hh);
  bezelShape.quadraticCurveTo(-hw, hh, -hw, hh - BEZEL_R);
  bezelShape.lineTo(-hw, -hh + BEZEL_R);
  bezelShape.quadraticCurveTo(-hw, -hh, -hw + BEZEL_R, -hh);

  const holeW = SCREEN_W / 2;
  const holeH = SCREEN_H / 2;
  const holePath = new THREE.Path();
  holePath.moveTo(-holeW, -holeH);
  holePath.lineTo(holeW, -holeH);
  holePath.lineTo(holeW, holeH);
  holePath.lineTo(-holeW, holeH);
  holePath.closePath();
  bezelShape.holes.push(holePath);

  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: BEZEL_D,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 8
  });
  addMesh(bezelGeo, matBezel, "bezel_frame", 0, centerY, bezelBackZ);

  // 4. Lit Screen Panel (emit_screen)
  const screenGeo = new THREE.BoxGeometry(SCREEN_W, SCREEN_H, 0.004);
  const screenZ = frontZ - 0.004;
  addMesh(screenGeo, matScreen, "emit_screen", 0, centerY, screenZ);

  // 5. UI Elements on Screen
  const uiZ = screenZ + 0.0025;
  const uiThickness = 0.001;

  // Top-left 5 circular icons
  const iconR = 0.022;
  const iconGeo = new THREE.CylinderGeometry(iconR, iconR, uiThickness, 24);
  const iconY = centerY + SCREEN_H * 0.30;
  const iconStartX = -SCREEN_W * 0.34;
  const iconStepX = 0.088;

  for (let i = 0; i < 5; i++) {
    addMesh(
      iconGeo,
      matUiLight,
      "ui_icon_" + (i + 1),
      iconStartX + i * iconStepX,
      iconY,
      uiZ,
      Math.PI / 2,
      0,
      0
    );
  }

  // Amber accent on first icon
  const accentGeo = new THREE.CylinderGeometry(0.012, 0.012, uiThickness, 16);
  addMesh(
    accentGeo,
    matUiAmber,
    "ui_icon_accent",
    iconStartX - 0.016,
    iconY + 0.016,
    uiZ - 0.0002,
    Math.PI / 2,
    0,
    0
  );

  // Horizontal progress bars (top-right and middle)
  const barH = 0.010;
  const barData = [
    { x: SCREEN_W * 0.22, y: centerY + SCREEN_H * 0.30, w: 0.28, fill: 0.65 },
    { x: SCREEN_W * 0.22, y: centerY + SCREEN_H * 0.22, w: 0.28, fill: 0.42 },
    { x: -SCREEN_W * 0.22, y: centerY + SCREEN_H * 0.10, w: 0.28, fill: 0.58 },
    { x: SCREEN_W * 0.22, y: centerY + SCREEN_H * 0.10, w: 0.28, fill: 0.50 }
  ];

  barData.forEach((b, idx) => {
    const bgGeo = new THREE.BoxGeometry(b.w, barH, uiThickness);
    addMesh(bgGeo, matUiLight, "ui_bar_bg_" + (idx + 1), b.x, b.y, uiZ);

    const fillW = b.w * b.fill;
    const fillGeo = new THREE.BoxGeometry(fillW, barH, uiThickness);
    addMesh(
      fillGeo,
      matUiAmber,
      "ui_bar_fill_" + (idx + 1),
      b.x - (b.w - fillW) / 2,
      b.y,
      uiZ + 0.0004
    );
  });

  // Bottom large card
  const cardW = SCREEN_W * 0.78;
  const cardH = SCREEN_H * 0.36;
  const cardY = centerY - SCREEN_H * 0.21;
  const cardGeo = new THREE.BoxGeometry(cardW, cardH, uiThickness);
  addMesh(cardGeo, matUiLight, "ui_card_bg", 0, cardY, uiZ);

  // Card header bar
  const headerH = 0.028;
  const headerGeo = new THREE.BoxGeometry(cardW, headerH, uiThickness);
  addMesh(
    headerGeo,
    matUiHeader,
    "ui_card_header",
    0,
    cardY + cardH / 2 - headerH / 2,
    uiZ + 0.0003
  );

  // Small pill button on card header
  const btnGeo = new THREE.BoxGeometry(0.026, 0.009, uiThickness);
  addMesh(
    btnGeo,
    matUiLight,
    "ui_card_header_btn",
    cardW / 2 - 0.032,
    cardY + cardH / 2 - headerH / 2,
    uiZ + 0.0006
  );

  // Mint-green pie chart inside card
  const pieR = 0.052;
  const pieGeo = new THREE.CylinderGeometry(pieR, pieR, uiThickness, 28);
  addMesh(
    pieGeo,
    matUiMint,
    "ui_pie_chart",
    -cardW / 2 + 0.085,
    cardY - 0.012,
    uiZ + 0.0005,
    Math.PI / 2,
    0,
    0
  );

  return group;
}
