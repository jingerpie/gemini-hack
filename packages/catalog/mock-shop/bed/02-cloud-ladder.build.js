function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const L = 2.00; // total length (X)
  const D = 1.00; // total depth (Z)
  const POST_W = 0.055;
  const POST_D = 0.055;
  const POST_H = 1.54;

  const RAIL_H = 0.10;
  const RAIL_T = 0.025;
  const LOW_RAIL_Y = 0.24;
  const UP_RAIL_Y = 1.12;

  const PANEL_T = 0.024;
  const LOW_PANEL_H = 0.56;
  const UP_PANEL_H = 0.48;
  const PANEL_R = 0.07;

  const SLAT_COUNT = 8;
  const SLAT_W = 0.07;
  const SLAT_H = 0.018;

  const GUARD_H = 0.065;
  const GUARD_T = 0.022;
  const GUARD_Y1 = 1.32;
  const GUARD_Y2 = 1.46;

  const LADDER_W = 0.38;
  const LADDER_X = -L / 2 + POST_W + LADDER_W / 2 + 0.02;
  const LADDER_Z = D / 2 + 0.018;
  const STILE_W = 0.032;
  const STILE_D = 0.055;
  const STILE_H = 1.50;
  const RUNG_H = 0.024;
  const RUNG_D = 0.055;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb488,
    roughness: 0.65,
    metalness: 0.02
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6d478,
    roughness: 0.55,
    metalness: 0.02
  });

  // Helper to create rounded-top panel geometry
  function makeRoundedTopPanel(width, height, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, height - radius);
    shape.absarc(hw - radius, height - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(-hw + radius, height);
    shape.absarc(-hw + radius, height - radius, radius, Math.PI / 2, Math.PI, false);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }

  // 1. Four Corner Posts
  const postGeo = new THREE.BoxGeometry(POST_W, POST_H, POST_D);
  const postPositions = [
    [-L / 2 + POST_W / 2, POST_H / 2, -D / 2 + POST_D / 2, 'post_back_left'],
    [L / 2 - POST_W / 2, POST_H / 2, -D / 2 + POST_D / 2, 'post_back_right'],
    [-L / 2 + POST_W / 2, POST_H / 2, D / 2 - POST_D / 2, 'post_front_left'],
    [L / 2 - POST_W / 2, POST_H / 2, D / 2 - POST_D / 2, 'post_front_right']
  ];
  for (const [x, y, z, name] of postPositions) {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, y, z);
    post.name = name;
    group.add(post);
  }

  // 2. Side Rails (Lower & Upper, Front & Back)
  const sideRailLen = L - 2 * POST_W;
  const sideRailGeo = new THREE.BoxGeometry(sideRailLen, RAIL_H, RAIL_T);
  const railConfigs = [
    [0, LOW_RAIL_Y, -D / 2 + POST_D / 2, 'lower_rail_back'],
    [0, LOW_RAIL_Y, D / 2 - POST_D / 2, 'lower_rail_front'],
    [0, UP_RAIL_Y, -D / 2 + POST_D / 2, 'upper_rail_back'],
    [0, UP_RAIL_Y, D / 2 - POST_D / 2, 'upper_rail_front']
  ];
  for (const [x, y, z, name] of railConfigs) {
    const rail = new THREE.Mesh(sideRailGeo, woodMat);
    rail.position.set(x, y, z);
    rail.name = name;
    group.add(rail);
  }

  // 3. End Panels (Headboards & Footboards)
  const panelWidth = D - 2 * POST_D;
  const lowPanelGeo = makeRoundedTopPanel(panelWidth, LOW_PANEL_H, PANEL_T, PANEL_R);
  const upPanelGeo = makeRoundedTopPanel(panelWidth, UP_PANEL_H, PANEL_T, PANEL_R);

  const endPanels = [
    [-L / 2 + POST_W / 2, LOW_RAIL_Y - RAIL_H / 2, lowPanelGeo, 'lower_panel_left'],
    [L / 2 - POST_W / 2, LOW_RAIL_Y - RAIL_H / 2, lowPanelGeo, 'lower_panel_right'],
    [-L / 2 + POST_W / 2, UP_RAIL_Y - RAIL_H / 2, upPanelGeo, 'upper_panel_left'],
    [L / 2 - POST_W / 2, UP_RAIL_Y - RAIL_H / 2, upPanelGeo, 'upper_panel_right']
  ];
  for (const [x, y, geo, name] of endPanels) {
    const panel = new THREE.Mesh(geo, yellowMat);
    panel.rotation.y = Math.PI / 2;
    panel.position.set(x, y, 0);
    panel.name = name;
    group.add(panel);
  }

  // 4. Bed Slats (Lower & Upper)
  const slatLen = D - 2 * POST_D;
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, slatLen);
  const slatSpan = sideRailLen - 0.14;
  for (let i = 0; i < SLAT_COUNT; i++) {
    const t = i / (SLAT_COUNT - 1) - 0.5;
    const sx = t * slatSpan;

    const lowSlat = new THREE.Mesh(slatGeo, woodMat);
    lowSlat.position.set(sx, LOW_RAIL_Y + RAIL_H / 2 - SLAT_H / 2 - 0.01, 0);
    lowSlat.name = `lower_slat_${i + 1}`;
    group.add(lowSlat);

    const upSlat = new THREE.Mesh(slatGeo, woodMat);
    upSlat.position.set(sx, UP_RAIL_Y + RAIL_H / 2 - SLAT_H / 2 - 0.01, 0);
    upSlat.name = `upper_slat_${i + 1}`;
    group.add(upSlat);
  }

  // 5. Upper Guardrails (Back full-length, Front partial-length)
  const backGuardGeo = new THREE.BoxGeometry(sideRailLen, GUARD_H, GUARD_T);
  const backGuard1 = new THREE.Mesh(backGuardGeo, yellowMat);
  backGuard1.position.set(0, GUARD_Y1, -D / 2 + POST_D / 2);
  backGuard1.name = 'upper_guardrail_back_low';
  group.add(backGuard1);

  const backGuard2 = new THREE.Mesh(backGuardGeo, yellowMat);
  backGuard2.position.set(0, GUARD_Y2, -D / 2 + POST_D / 2);
  backGuard2.name = 'upper_guardrail_back_high';
  group.add(backGuard2);

  const ladderRightX = LADDER_X + LADDER_W / 2;
  const frontGuardStart = ladderRightX;
  const frontGuardEnd = L / 2 - POST_W;
  const frontGuardLen = frontGuardEnd - frontGuardStart;
  const frontGuardX = (frontGuardStart + frontGuardEnd) / 2;

  const frontGuardGeo = new THREE.BoxGeometry(frontGuardLen, GUARD_H, GUARD_T);
  const frontGuard1 = new THREE.Mesh(frontGuardGeo, yellowMat);
  frontGuard1.position.set(frontGuardX, GUARD_Y1, D / 2 - POST_D / 2);
  frontGuard1.name = 'upper_guardrail_front_low';
  group.add(frontGuard1);

  const frontGuard2 = new THREE.Mesh(frontGuardGeo, yellowMat);
  frontGuard2.position.set(frontGuardX, GUARD_Y2, D / 2 - POST_D / 2);
  frontGuard2.name = 'upper_guardrail_front_high';
  group.add(frontGuard2);

  // 6. Ladder (2 Stiles + 4 Rungs)
  const stileGeo = new THREE.BoxGeometry(STILE_W, STILE_H, STILE_D);
  const leftStile = new THREE.Mesh(stileGeo, yellowMat);
  leftStile.position.set(LADDER_X - LADDER_W / 2 + STILE_W / 2, STILE_H / 2, LADDER_Z);
  leftStile.name = 'ladder_stile_left';
  group.add(leftStile);

  const rightStile = new THREE.Mesh(stileGeo, yellowMat);
  rightStile.position.set(LADDER_X + LADDER_W / 2 - STILE_W / 2, STILE_H / 2, LADDER_Z);
  rightStile.name = 'ladder_stile_right';
  group.add(rightStile);

  const rungGeo = new THREE.BoxGeometry(LADDER_W - STILE_W, RUNG_H, RUNG_D);
  const rungHeights = [0.22, 0.50, 0.78, 1.06];
  for (let i = 0; i < rungHeights.length; i++) {
    const rung = new THREE.Mesh(rungGeo, yellowMat);
    rung.position.set(LADDER_X, rungHeights[i], LADDER_Z);
    rung.name = `ladder_rung_${i + 1}`;
    group.add(rung);
  }

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
