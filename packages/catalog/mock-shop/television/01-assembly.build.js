function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const CON_W = 1.90;
  const CON_H = 0.38;
  const CON_D = 0.45;
  const PLINTH_H = 0.04;
  const PLINTH_INSET = 0.06;
  const PANEL_T = 0.022;
  const DOOR_T = 0.02;

  const TV_W = 1.68;
  const TV_H = 0.96;
  const TV_D = 0.045;
  const BEZEL_W = 0.018;
  const BEZEL_BOTTOM_W = 0.024;
  const FOOT_H = 0.065;
  const FOOT_SPREAD_X = 0.56;
  const FOOT_SPAN_Z = 0.24;

  // Materials
  const matConsole = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.65,
    metalness: 0.08,
  });

  const matConsoleInner = new THREE.MeshStandardMaterial({
    color: 0x16171a,
    roughness: 0.75,
    metalness: 0.05,
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x2a2c30,
    roughness: 0.35,
    metalness: 0.75,
  });

  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.4,
    metalness: 0.3,
  });

  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x222830,
    emissive: 0xdde8f5,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  function addMesh(name, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // --- MEDIA CONSOLE ---
  const bodyH = CON_H - PLINTH_H;
  const innerH = bodyH - PANEL_T * 2;
  const sideW = CON_W / 3;
  const centerW = CON_W - sideW * 2;

  // Plinth
  addMesh(
    "console_plinth",
    new THREE.BoxGeometry(CON_W - PLINTH_INSET * 2, PLINTH_H, CON_D - PLINTH_INSET * 2),
    matConsoleInner,
    0,
    PLINTH_H / 2,
    0
  );

  // Bottom & Top panels
  addMesh(
    "console_bottom_panel",
    new THREE.BoxGeometry(CON_W, PANEL_T, CON_D),
    matConsole,
    0,
    PLINTH_H + PANEL_T / 2,
    0
  );

  addMesh(
    "console_top_panel",
    new THREE.BoxGeometry(CON_W, PANEL_T, CON_D),
    matConsole,
    0,
    CON_H - PANEL_T / 2,
    0
  );

  // Back panel
  addMesh(
    "console_back_panel",
    new THREE.BoxGeometry(CON_W - PANEL_T * 2, innerH, PANEL_T),
    matConsoleInner,
    0,
    PLINTH_H + PANEL_T + innerH / 2,
    -CON_D / 2 + PANEL_T / 2
  );

  // Outer side panels
  const sideY = PLINTH_H + PANEL_T + innerH / 2;
  addMesh(
    "console_left_side",
    new THREE.BoxGeometry(PANEL_T, innerH, CON_D),
    matConsole,
    -CON_W / 2 + PANEL_T / 2,
    sideY,
    0
  );

  addMesh(
    "console_right_side",
    new THREE.BoxGeometry(PANEL_T, innerH, CON_D),
    matConsole,
    CON_W / 2 - PANEL_T / 2,
    sideY,
    0
  );

  // Center dividers
  addMesh(
    "console_mid_left_divider",
    new THREE.BoxGeometry(PANEL_T, innerH, CON_D - DOOR_T),
    matConsoleInner,
    -centerW / 2,
    sideY,
    -DOOR_T / 2
  );

  addMesh(
    "console_mid_right_divider",
    new THREE.BoxGeometry(PANEL_T, innerH, CON_D - DOOR_T),
    matConsoleInner,
    centerW / 2,
    sideY,
    -DOOR_T / 2
  );

  // Center open shelf
  addMesh(
    "console_center_shelf",
    new THREE.BoxGeometry(centerW - PANEL_T, PANEL_T, CON_D - PANEL_T * 2),
    matConsole,
    0,
    sideY,
    0
  );

  // Left & Right closed doors
  const doorW = sideW - PANEL_T * 0.6;
  const doorZ = CON_D / 2 - DOOR_T / 2;
  addMesh(
    "console_left_door",
    new THREE.BoxGeometry(doorW, innerH - 0.004, DOOR_T),
    matConsole,
    -CON_W / 2 + PANEL_T + doorW / 2 - 0.004,
    sideY,
    doorZ
  );

  addMesh(
    "console_right_door",
    new THREE.BoxGeometry(doorW, innerH - 0.004, DOOR_T),
    matConsole,
    CON_W / 2 - PANEL_T - doorW / 2 + 0.004,
    sideY,
    doorZ
  );

  // --- TV STAND FEET ---
  const tvBottomY = CON_H + FOOT_H;
  const legLen = Math.hypot(FOOT_H, FOOT_SPAN_Z / 2);
  const legAngle = Math.atan2(FOOT_SPAN_Z / 2, FOOT_H);

  [-FOOT_SPREAD_X, FOOT_SPREAD_X].forEach((fx, idx) => {
    const side = idx === 0 ? "left" : "right";

    addMesh(
      `tv_foot_${side}_front`,
      new THREE.BoxGeometry(0.022, legLen, 0.018),
      matMetal,
      fx,
      CON_H + FOOT_H / 2,
      FOOT_SPAN_Z / 4,
      -legAngle,
      0,
      0
    );

    addMesh(
      `tv_foot_${side}_back`,
      new THREE.BoxGeometry(0.022, legLen, 0.018),
      matMetal,
      fx,
      CON_H + FOOT_H / 2,
      -FOOT_SPAN_Z / 4,
      legAngle,
      0,
      0
    );

    addMesh(
      `tv_foot_${side}_bracket`,
      new THREE.BoxGeometry(0.036, 0.02, 0.05),
      matMetal,
      fx,
      tvBottomY + 0.005,
      0
    );
  });

  // --- COMMERCIAL DISPLAY (TV) ---
  const tvCenterY = tvBottomY + TV_H / 2;

  // Main rear housing
  addMesh(
    "tv_back_housing",
    new THREE.BoxGeometry(TV_W, TV_H, TV_D * 0.65),
    matBezel,
    0,
    tvCenterY,
    -TV_D * 0.175
  );

  // Rear electronics / VESA box
  addMesh(
    "tv_rear_electronics_box",
    new THREE.BoxGeometry(TV_W * 0.55, TV_H * 0.55, 0.025),
    matConsoleInner,
    0,
    tvCenterY - 0.04,
    -TV_D * 0.5 - 0.01
  );

  // Bezels
  const bezelZ = TV_D * 0.25;
  const bezelD = TV_D * 0.5;

  addMesh(
    "tv_bezel_top",
    new THREE.BoxGeometry(TV_W, BEZEL_W, bezelD),
    matBezel,
    0,
    tvBottomY + TV_H - BEZEL_W / 2,
    bezelZ
  );

  addMesh(
    "tv_bezel_bottom",
    new THREE.BoxGeometry(TV_W, BEZEL_BOTTOM_W, bezelD),
    matBezel,
    0,
    tvBottomY + BEZEL_BOTTOM_W / 2,
    bezelZ
  );

  const sideBezelH = TV_H - BEZEL_W - BEZEL_BOTTOM_W;
  const sideBezelY = tvBottomY + BEZEL_BOTTOM_W + sideBezelH / 2;

  addMesh(
    "tv_bezel_left",
    new THREE.BoxGeometry(BEZEL_W, sideBezelH, bezelD),
    matBezel,
    -TV_W / 2 + BEZEL_W / 2,
    sideBezelY,
    bezelZ
  );

  addMesh(
    "tv_bezel_right",
    new THREE.BoxGeometry(BEZEL_W, sideBezelH, bezelD),
    matBezel,
    TV_W / 2 - BEZEL_W / 2,
    sideBezelY,
    bezelZ
  );

  // Lit screen panel
  addMesh(
    "emit_screen",
    new THREE.BoxGeometry(TV_W - BEZEL_W * 2, sideBezelH, 0.006),
    matScreen,
    0,
    sideBezelY,
    bezelZ + bezelD / 2 - 0.002
  );

  return group;
}
