function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 2.46;          // Total width (3 bays of 0.82m)
  const H = 2.36;          // Total height
  const D = 0.60;          // Total depth
  const T = 0.024;         // Board thickness
  const PLINTH_H = 0.075;  // Bottom plinth height
  const BAY_W = (W - 4 * T) / 3; // Clear internal width of each bay

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd6c7b2,
    roughness: 0.65,
    metalness: 0.02,
  });

  const drawerMat = new THREE.MeshStandardMaterial({
    color: 0xe0d4c3,
    roughness: 0.6,
    metalness: 0.02,
  });

  const gapMat = new THREE.MeshStandardMaterial({
    color: 0x1c1916,
    roughness: 0.9,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9ea2a6,
    roughness: 0.28,
    metalness: 0.85,
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

  function addRod(name, len, x, y, z) {
    const geo = new THREE.CylinderGeometry(0.014, 0.014, len, 16);
    geo.rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, metalMat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Vertical dividers (4 panels: left outer, mid-left, mid-right, right outer)
  const xPanels = [
    -W / 2 + T / 2,
    -W / 2 + T + BAY_W + T / 2,
    W / 2 - T - BAY_W - T / 2,
    W / 2 - T / 2,
  ];

  for (let i = 0; i < xPanels.length; i++) {
    addBox(`vertical_panel_${i + 1}`, T, H, D, xPanels[i], H / 2, 0, woodMat);
  }

  // 2. Back panel (full width, recessed slightly at -Z)
  const BACK_T = 0.016;
  addBox('back_panel', W - 2 * T, H - PLINTH_H - T, BACK_T, 0, (H + PLINTH_H) / 2, -D / 2 + BACK_T / 2, woodMat);

  // 3. Bay centers
  const bayCenters = [
    -BAY_W - T,
    0,
    BAY_W + T,
  ];

  // Top, bottom, and plinth for each bay
  for (let i = 0; i < 3; i++) {
    const bx = bayCenters[i];
    addBox(`top_panel_bay_${i + 1}`, BAY_W, T, D, bx, H - T / 2, 0, woodMat);
    addBox(`bottom_panel_bay_${i + 1}`, BAY_W, T, D, bx, PLINTH_H + T / 2, 0, woodMat);
    addBox(`plinth_bay_${i + 1}`, BAY_W, PLINTH_H, D - 0.04, bx, PLINTH_H / 2, -0.02, woodMat);
  }

  // 4. Bay 1 (Left): Top shelf + 1 full-length hanging rod
  const TOP_SHELF_Y = 1.92;
  addBox('shelf_bay1_top', BAY_W, T, D - BACK_T, bayCenters[0], TOP_SHELF_Y, BACK_T / 2, woodMat);
  addRod('hanging_rod_bay1', BAY_W, bayCenters[0], TOP_SHELF_Y - 0.075, 0.02);

  // 5. Bay 2 (Center): Top shelf + 2 hanging rods (upper & lower)
  addBox('shelf_bay2_top', BAY_W, T, D - BACK_T, bayCenters[1], TOP_SHELF_Y, BACK_T / 2, woodMat);
  addRod('hanging_rod_bay2_upper', BAY_W, bayCenters[1], TOP_SHELF_Y - 0.075, 0.02);
  addRod('hanging_rod_bay2_lower', BAY_W, bayCenters[1], 0.96, 0.02);

  // 6. Bay 3 (Right): Top shelf, 1 short hanging rod, 2 mid shelves, drawer-top shelf, and 6 drawers
  addBox('shelf_bay3_top', BAY_W, T, D - BACK_T, bayCenters[2], TOP_SHELF_Y, BACK_T / 2, woodMat);
  addRod('hanging_rod_bay3', BAY_W, bayCenters[2], TOP_SHELF_Y - 0.075, 0.02);

  addBox('shelf_bay3_mid1', BAY_W, T, D - BACK_T, bayCenters[2], 1.50, BACK_T / 2, woodMat);
  addBox('shelf_bay3_mid2', BAY_W, T, D - BACK_T, bayCenters[2], 1.22, BACK_T / 2, woodMat);

  const DRAWER_BANK_TOP = 0.92;
  addBox('shelf_bay3_drawer_top', BAY_W, T, D - BACK_T, bayCenters[2], DRAWER_BANK_TOP, BACK_T / 2, woodMat);

  // Dark backing behind drawer fronts to create crisp shadow-gap finger pulls
  const drawerAreaBottom = PLINTH_H + T;
  const drawerAreaTop = DRAWER_BANK_TOP - T / 2;
  const drawerAreaH = drawerAreaTop - drawerAreaBottom;
  addBox(
    'drawer_shadow_backing',
    BAY_W,
    drawerAreaH,
    0.04,
    bayCenters[2],
    drawerAreaBottom + drawerAreaH / 2,
    D / 2 - 0.035,
    gapMat
  );

  // 6 Drawers: top 2 shallow, bottom 4 deeper
  const GAP = 0.014;
  const shallowH = 0.068;
  const deepH = (drawerAreaH - 2 * shallowH - 6 * GAP) / 4;
  const drawerHeights = [shallowH, shallowH, deepH, deepH, deepH, deepH];

  let curY = drawerAreaTop;
  for (let i = 0; i < drawerHeights.length; i++) {
    const dh = drawerHeights[i];
    curY -= GAP + dh / 2;
    addBox(
      `drawer_front_${i + 1}`,
      BAY_W - 0.004,
      dh,
      T,
      bayCenters[2],
      curY,
      D / 2 - T / 2 - 0.005,
      drawerMat
    );
    curY -= dh / 2;
  }

  return group;
}
