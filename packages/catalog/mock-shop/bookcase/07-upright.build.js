function build(THREE) {
  const group = new THREE.Group();

  const W = 0.86;
  const H = 1.60;
  const D = 0.34;
  const BRACKET_H = 0.018;
  const BODY_H = H - BRACKET_H;
  const PANEL_T = 0.024;
  const TRIM_T = 0.012;
  const BACK_T = 0.012;
  const PLINTH_H = 0.085;
  const INNER_W = W - PANEL_T * 2;
  const SHELF_D = D - BACK_T - TRIM_T;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4e5d66,
    roughness: 0.72,
    metalness: 0.05
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xc29b6c,
    roughness: 0.58,
    metalness: 0.02
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x2c3034,
    roughness: 0.4,
    metalness: 0.7
  });

  function addBox(name, w, h, d, x, y, z, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Side panels (main body)
  const sideD = D - TRIM_T;
  const sideZ = -TRIM_T / 2;
  addBox('left_side_panel', PANEL_T, BODY_H, sideD, -W / 2 + PANEL_T / 2, BODY_H / 2, sideZ, bodyMat);
  addBox('right_side_panel', PANEL_T, BODY_H, sideD, W / 2 - PANEL_T / 2, BODY_H / 2, sideZ, bodyMat);

  // Front oak trim strips on side panels
  const trimZ = D / 2 - TRIM_T / 2;
  addBox('left_front_trim', PANEL_T, BODY_H, TRIM_T, -W / 2 + PANEL_T / 2, BODY_H / 2, trimZ, trimMat);
  addBox('right_front_trim', PANEL_T, BODY_H, TRIM_T, W / 2 - PANEL_T / 2, BODY_H / 2, trimZ, trimMat);

  // Back panel
  addBox('back_panel', INNER_W, BODY_H, BACK_T, 0, BODY_H / 2, -D / 2 + BACK_T / 2, bodyMat);

  // Top panel
  const shelfZ = -D / 2 + BACK_T + SHELF_D / 2;
  addBox('top_panel', INNER_W, PANEL_T, SHELF_D, 0, BODY_H - PANEL_T / 2, shelfZ, bodyMat);

  // Bottom plinth (kickplate)
  addBox('bottom_plinth', INNER_W, PLINTH_H, PANEL_T, 0, PLINTH_H / 2, D / 2 - TRIM_T - PANEL_T / 2, bodyMat);

  // 5 Shelves (bottom shelf + 4 upper shelves)
  const bottomShelfY = PLINTH_H + PANEL_T / 2;
  const topPanelBottomY = BODY_H - PANEL_T;
  const usableH = topPanelBottomY - (PLINTH_H + PANEL_T);
  const tierH = usableH / 5;

  const shelfYs = [];
  for (let i = 0; i < 5; i++) {
    const sy = bottomShelfY + i * tierH;
    shelfYs.push(sy);
    addBox(`shelf_${i + 1}`, INNER_W, PANEL_T, SHELF_D, 0, sy, shelfZ, bodyMat);
  }

  // 4 Vertical bookend dividers
  const divW = 0.022;
  const divH = 0.165;
  const divD = 0.145;
  const divZ = shelfZ + SHELF_D / 2 - divD / 2 - 0.03;

  const dividerConfigs = [
    { shelfIdx: 1, x: -INNER_W * 0.28 },
    { shelfIdx: 2, x: INNER_W * 0.14 },
    { shelfIdx: 3, x: -INNER_W * 0.42 },
    { shelfIdx: 4, x: INNER_W * 0.08 }
  ];

  dividerConfigs.forEach((cfg, idx) => {
    const sy = shelfYs[cfg.shelfIdx];
    const divY = sy + PANEL_T / 2 + divH / 2;
    addBox(`bookend_divider_${idx + 1}`, divW, divH, divD, cfg.x, divY, divZ, bodyMat);
  });

  // 2 Top back wall-mounting brackets
  const brkW = 0.026;
  const brkD = 0.012;
  const brkY = BODY_H + BRACKET_H / 2;
  const brkZ = -D / 2 + brkD / 2 + 0.02;
  addBox('left_mounting_bracket', brkW, BRACKET_H, brkD, -W / 2 + PANEL_T + 0.05, brkY, brkZ, bracketMat);
  addBox('right_mounting_bracket', brkW, BRACKET_H, brkD, W / 2 - PANEL_T - 0.05, brkY, brkZ, bracketMat);

  return group;
}
