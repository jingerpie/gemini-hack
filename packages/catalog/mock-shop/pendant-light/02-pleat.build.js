function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const SHADE_DIAMETER = 0.30;
  const BOT_R = SHADE_DIAMETER / 2; // 0.15 m
  const TOP_R = 0.095;
  const SHADE_H = 0.21;
  const TOTAL_H = 0.85;

  const CANOPY_R = 0.055;
  const CANOPY_H = 0.022;
  const GRIP_R = 0.008;
  const GRIP_H = 0.014;
  const CORD_R = 0.0035;

  const SHADE_CAP_R = 0.013;
  const SHADE_CAP_H = 0.016;
  const SOCKET_R = 0.018;
  const SOCKET_H = 0.038;
  const BULB_R = 0.032;

  const PLEAT_COUNT = 15; // 30 panels total
  const PANEL_COUNT = PLEAT_COUNT * 2;
  const PLEAT_DEPTH = 0.012;
  const PANEL_T = 0.0025;

  // Materials
  const matHardware = new THREE.MeshStandardMaterial({
    color: 0xd6ccbe,
    roughness: 0.45,
    metalness: 0.05
  });

  const matCord = new THREE.MeshStandardMaterial({
    color: 0xd2c8b8,
    roughness: 0.85,
    metalness: 0.0
  });

  const matShade = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const matShadeInner = new THREE.MeshStandardMaterial({
    color: 0xe6d2b5,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const matEmitBulb = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Ceiling canopy at the very top (top at y = TOTAL_H)
  const canopyY = TOTAL_H - CANOPY_H / 2;
  addMesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32),
    matHardware,
    "ceiling_canopy",
    0, canopyY, 0
  );

  // 2. Canopy cord grip
  const gripY = TOTAL_H - CANOPY_H - GRIP_H / 2;
  addMesh(
    new THREE.CylinderGeometry(GRIP_R, GRIP_R * 0.8, GRIP_H, 16),
    matHardware,
    "canopy_cord_grip",
    0, gripY, 0
  );

  // 3. Shade top cap
  const shadeTopY = SHADE_H;
  const shadeCapY = shadeTopY + SHADE_CAP_H / 2;
  addMesh(
    new THREE.CylinderGeometry(SHADE_CAP_R * 0.85, SHADE_CAP_R, SHADE_CAP_H, 16),
    matHardware,
    "shade_top_cap",
    0, shadeCapY, 0
  );

  // 4. Hanging cord connecting canopy grip to shade cap
  const cordTopY = TOTAL_H - CANOPY_H - GRIP_H;
  const cordBotY = shadeTopY + SHADE_CAP_H;
  const cordLen = cordTopY - cordBotY;
  addMesh(
    new THREE.CylinderGeometry(CORD_R, CORD_R, cordLen, 12),
    matCord,
    "hanging_cord",
    0, cordBotY + cordLen / 2, 0
  );

  // 5. Inner socket & glowing bulb
  const socketY = shadeTopY - SOCKET_H / 2;
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R, SOCKET_H, 16),
    matHardware,
    "lamp_socket",
    0, socketY, 0
  );

  const bulbY = shadeTopY - SOCKET_H - BULB_R * 0.65;
  addMesh(
    new THREE.SphereGeometry(BULB_R, 20, 16),
    matEmitBulb,
    "emit_bulb",
    0, bulbY, 0
  );

  // 6. Inner shade liner (ensures no light leaks between pleats)
  addMesh(
    new THREE.CylinderGeometry(TOP_R - PLEAT_DEPTH * 0.5, BOT_R - PLEAT_DEPTH * 0.5, SHADE_H * 0.98, 32, 1, true),
    matShadeInner,
    "shade_inner_liner",
    0, SHADE_H / 2, 0
  );

  // 7. Pleated shade panels (30 angled panels forming 15 crisp V-pleats)
  const slopeAngle = Math.atan2(BOT_R - TOP_R, SHADE_H);
  const slantH = Math.sqrt(SHADE_H * SHADE_H + (BOT_R - TOP_R) * (BOT_R - TOP_R));
  const midR = (TOP_R + BOT_R) / 2 - PLEAT_DEPTH / 2;

  const arcStep = (Math.PI * 2) / PANEL_COUNT;
  const chordW = 2 * midR * Math.sin(arcStep / 2);
  const panelW = Math.sqrt(chordW * chordW + PLEAT_DEPTH * PLEAT_DEPTH) * 1.04;
  const pleatTilt = Math.atan2(PLEAT_DEPTH, chordW);

  const panelGeo = new THREE.BoxGeometry(panelW, slantH, PANEL_T);

  for (let i = 0; i < PANEL_COUNT; i++) {
    const theta = (i + 0.5) * arcStep;
    const isEven = i % 2 === 0;
    const localTilt = isEven ? pleatTilt : -pleatTilt;

    const panel = new THREE.Mesh(panelGeo, matShade);
    panel.name = "shade_pleat_" + (i + 1);
    panel.position.set(
      Math.sin(theta) * midR,
      SHADE_H / 2,
      Math.cos(theta) * midR
    );

    panel.rotation.order = "YXZ";
    panel.rotation.y = theta + localTilt;
    panel.rotation.x = -slopeAngle;

    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  }

  return group;
}
