function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters, Queen mattress 152 cm x 203 cm)
  const MATTRESS_W = 1.52;
  const MATTRESS_L = 2.03;
  const CLEARANCE = 0.02;
  const INNER_W = MATTRESS_W + CLEARANCE;
  const INNER_L = MATTRESS_L + CLEARANCE;

  const RAIL_T = 0.045;
  const HB_T = 0.06;
  const W = INNER_W + RAIL_T * 2;
  const D = INNER_L + RAIL_T + HB_T;

  const LEG_H = 0.14;
  const RAIL_H = 0.16;
  const TRIM_H = 0.024;
  const PANEL_H = RAIL_H - TRIM_H;
  const HB_H = 1.05;

  const SLAT_H = 0.018;
  const SLAT_D = 0.065;
  const SLAT_COUNT = 14;
  const SLAT_Y = LEG_H + 0.055;

  const Z_MIN = -D / 2;
  const Z_MAX = D / 2;
  const Z_HB_FRONT = Z_MIN + HB_T;
  const Z_FB_BACK = Z_MAX - RAIL_T;

  // Materials
  const matPainted = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.75,
    metalness: 0.02
  });
  const matFabric = new THREE.MeshStandardMaterial({
    color: 0xdcd4c6,
    roughness: 0.92,
    metalness: 0.0
  });
  const matOak = new THREE.MeshStandardMaterial({
    color: 0xc2a37d,
    roughness: 0.65,
    metalness: 0.02
  });
  const matSlat = new THREE.MeshStandardMaterial({
    color: 0xd6be9c,
    roughness: 0.7,
    metalness: 0.0
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.6,
    metalness: 0.25
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Headboard
  addMesh(
    new THREE.BoxGeometry(W, HB_H, HB_T),
    matPainted,
    'headboard_frame',
    0,
    HB_H / 2,
    Z_MIN + HB_T / 2
  );

  const hbCushionW = W - 0.06;
  const hbCushionH = 0.48;
  const hbCushionY = HB_H - 0.03 - hbCushionH / 2;
  addMesh(
    new THREE.BoxGeometry(hbCushionW, hbCushionH, 0.025),
    matFabric,
    'headboard_cushion',
    0,
    hbCushionY,
    Z_HB_FRONT + 0.006
  );

  // Footboard (+Z)
  addMesh(
    new THREE.BoxGeometry(W, PANEL_H, RAIL_T),
    matPainted,
    'footboard_panel',
    0,
    LEG_H + PANEL_H / 2,
    Z_MAX - RAIL_T / 2
  );
  addMesh(
    new THREE.BoxGeometry(W, TRIM_H, RAIL_T),
    matOak,
    'footboard_oak_trim',
    0,
    LEG_H + PANEL_H + TRIM_H / 2,
    Z_MAX - RAIL_T / 2
  );

  // Side rails (-X and +X)
  const sideRailL = INNER_L;
  const sideRailZ = Z_HB_FRONT + sideRailL / 2;

  addMesh(
    new THREE.BoxGeometry(RAIL_T, PANEL_H, sideRailL),
    matPainted,
    'left_rail_panel',
    -W / 2 + RAIL_T / 2,
    LEG_H + PANEL_H / 2,
    sideRailZ
  );
  addMesh(
    new THREE.BoxGeometry(RAIL_T, TRIM_H, sideRailL),
    matOak,
    'left_rail_oak_trim',
    -W / 2 + RAIL_T / 2,
    LEG_H + PANEL_H + TRIM_H / 2,
    sideRailZ
  );

  addMesh(
    new THREE.BoxGeometry(RAIL_T, PANEL_H, sideRailL),
    matPainted,
    'right_rail_panel',
    W / 2 - RAIL_T / 2,
    LEG_H + PANEL_H / 2,
    sideRailZ
  );
  addMesh(
    new THREE.BoxGeometry(RAIL_T, TRIM_H, sideRailL),
    matOak,
    'right_rail_oak_trim',
    W / 2 - RAIL_T / 2,
    LEG_H + PANEL_H + TRIM_H / 2,
    sideRailZ
  );

  // Sled legs (front and rear)
  const legBarH = 0.035;
  const legPostW = 0.045;
  const legPostD = 0.045;
  const legSpanW = W - 0.24;
  const legPostH = LEG_H - legBarH;

  const frontLegZ = Z_MAX - 0.14;
  addMesh(
    new THREE.BoxGeometry(legSpanW, legBarH, legPostD),
    matOak,
    'front_leg_bar',
    0,
    legBarH / 2,
    frontLegZ
  );
  addMesh(
    new THREE.BoxGeometry(legPostW, legPostH, legPostD),
    matOak,
    'front_leg_left',
    -legSpanW / 2 + legPostW / 2,
    legBarH + legPostH / 2,
    frontLegZ
  );
  addMesh(
    new THREE.BoxGeometry(legPostW, legPostH, legPostD),
    matOak,
    'front_leg_right',
    legSpanW / 2 - legPostW / 2,
    legBarH + legPostH / 2,
    frontLegZ
  );

  const rearLegZ = Z_HB_FRONT + 0.18;
  addMesh(
    new THREE.BoxGeometry(legSpanW, legBarH, legPostD),
    matOak,
    'rear_leg_bar',
    0,
    legBarH / 2,
    rearLegZ
  );
  addMesh(
    new THREE.BoxGeometry(legPostW, legPostH, legPostD),
    matOak,
    'rear_leg_left',
    -legSpanW / 2 + legPostW / 2,
    legBarH + legPostH / 2,
    rearLegZ
  );
  addMesh(
    new THREE.BoxGeometry(legPostW, legPostH, legPostD),
    matOak,
    'rear_leg_right',
    legSpanW / 2 - legPostW / 2,
    legBarH + legPostH / 2,
    rearLegZ
  );

  // Center support beam & webbing strap
  addMesh(
    new THREE.BoxGeometry(0.04, 0.04, INNER_L),
    matOak,
    'center_support_beam',
    0,
    SLAT_Y - SLAT_H / 2 - 0.02,
    sideRailZ
  );

  addMesh(
    new THREE.BoxGeometry(0.032, 0.004, INNER_L - 0.06),
    matDark,
    'center_webbing_strap',
    0,
    SLAT_Y + SLAT_H / 2 + 0.002,
    sideRailZ
  );

  // Slats
  const slatGeo = new THREE.BoxGeometry(INNER_W, SLAT_H, SLAT_D);
  const slatStartZ = Z_HB_FRONT + 0.07;
  const slatEndZ = Z_FB_BACK - 0.07;
  const slatStep = (slatEndZ - slatStartZ) / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const z = slatStartZ + i * slatStep;
    addMesh(slatGeo, matSlat, `slat_${i}`, 0, SLAT_Y, z);
  }

  // Inner corner brackets near headboard
  const bracketGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
  addMesh(
    bracketGeo,
    matDark,
    'corner_bracket_left',
    -INNER_W / 2 + 0.018,
    LEG_H + PANEL_H - 0.025,
    Z_HB_FRONT + 0.018
  );
  addMesh(
    bracketGeo,
    matDark,
    'corner_bracket_right',
    INNER_W / 2 - 0.018,
    LEG_H + PANEL_H - 0.025,
    Z_HB_FRONT + 0.018
  );

  return group;
}
