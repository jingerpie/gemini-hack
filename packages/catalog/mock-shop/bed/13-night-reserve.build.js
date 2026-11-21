function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const MATTRESS_W = 1.35;
  const MATTRESS_L = 1.90;
  const CLEARANCE = 0.01;
  const PANEL_T = 0.025;
  const W = MATTRESS_W + CLEARANCE + PANEL_T * 2; // 1.41 m
  const D = MATTRESS_L + CLEARANCE + PANEL_T * 2; // 1.96 m
  const H = 0.28;

  const SLAT_COUNT = 16;
  const SLAT_W = 0.065;
  const SLAT_H = 0.018;
  const SLAT_L = MATTRESS_W + CLEARANCE - 0.004;
  const SLAT_TOP_Y = H - 0.035;

  const DRAWER_GAP = 0.012;
  const DRAWER_L = (MATTRESS_L + CLEARANCE - DRAWER_GAP * 3) / 2;
  const DRAWER_H = H - 0.03;
  const DRAWER_Y = 0.015 + DRAWER_H / 2;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb8966e,
    roughness: 0.65,
    metalness: 0.02
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xdecbb0,
    roughness: 0.72,
    metalness: 0.0
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x6e5539,
    roughness: 0.85,
    metalness: 0.0
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

  // Headboard (-Z) and Footboard (+Z) panels
  const endPanelGeo = new THREE.BoxGeometry(W, H, PANEL_T);
  addMesh(endPanelGeo, oakMat, 'headboard_panel', 0, H / 2, -D / 2 + PANEL_T / 2);
  addMesh(endPanelGeo, oakMat, 'footboard_panel', 0, H / 2, D / 2 - PANEL_T / 2);

  // Side top rails above drawers
  const topRailH = 0.02;
  const topRailGeo = new THREE.BoxGeometry(PANEL_T, topRailH, MATTRESS_L + CLEARANCE);
  addMesh(topRailGeo, oakMat, 'left_top_rail', -W / 2 + PANEL_T / 2, H - topRailH / 2, 0);
  addMesh(topRailGeo, oakMat, 'right_top_rail', W / 2 - PANEL_T / 2, H - topRailH / 2, 0);

  // Side slat support ledges
  const ledgeGeo = new THREE.BoxGeometry(0.025, 0.025, MATTRESS_L + CLEARANCE);
  const ledgeY = SLAT_TOP_Y - SLAT_H - 0.0125;
  addMesh(ledgeGeo, oakMat, 'left_slat_ledge', -W / 2 + PANEL_T + 0.0125, ledgeY, 0);
  addMesh(ledgeGeo, oakMat, 'right_slat_ledge', W / 2 - PANEL_T - 0.0125, ledgeY, 0);

  // Center longitudinal support rail
  const centerRailGeo = new THREE.BoxGeometry(0.04, 0.04, MATTRESS_L + CLEARANCE);
  addMesh(centerRailGeo, oakMat, 'center_support_rail', 0, SLAT_TOP_Y - SLAT_H - 0.02, 0);

  // Slats
  const slatGeo = new THREE.BoxGeometry(SLAT_L, SLAT_H, SLAT_W);
  const slatSpan = MATTRESS_L + CLEARANCE - SLAT_W - 0.04;
  for (let i = 0; i < SLAT_COUNT; i++) {
    const t = i / (SLAT_COUNT - 1);
    const z = -slatSpan / 2 + t * slatSpan;
    addMesh(slatGeo, slatMat, `bed_slat_${i + 1}`, 0, SLAT_TOP_Y - SLAT_H / 2, z);
  }

  // Closed drawers (2 on left -X, 2 on right +X)
  const drawerFrontGeo = new THREE.BoxGeometry(PANEL_T, DRAWER_H, DRAWER_L);
  const pullGeo = new THREE.BoxGeometry(0.008, 0.014, 0.14);

  const zOffsets = [
    -(DRAWER_L / 2 + DRAWER_GAP / 2),
    DRAWER_L / 2 + DRAWER_GAP / 2
  ];

  // Left drawers (-X)
  zOffsets.forEach((zPos, idx) => {
    const xPos = -W / 2 + PANEL_T / 2;
    addMesh(drawerFrontGeo, oakMat, `left_drawer_front_${idx + 1}`, xPos, DRAWER_Y, zPos);
    addMesh(pullGeo, recessMat, `left_drawer_pull_${idx + 1}`, xPos - PANEL_T / 2 + 0.002, DRAWER_Y + DRAWER_H / 2 - 0.007, zPos);
  });

  // Right drawers (+X)
  zOffsets.forEach((zPos, idx) => {
    const xPos = W / 2 - PANEL_T / 2;
    addMesh(drawerFrontGeo, oakMat, `right_drawer_front_${idx + 1}`, xPos, DRAWER_Y, zPos);
    addMesh(pullGeo, recessMat, `right_drawer_pull_${idx + 1}`, xPos + PANEL_T / 2 - 0.002, DRAWER_Y + DRAWER_H / 2 - 0.007, zPos);
  });

  return group;
}
