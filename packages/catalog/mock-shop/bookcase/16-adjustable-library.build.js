function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.25;
  const H = 2.05;
  const D = 0.42;

  const PLINTH_H = 0.11;
  const PLINTH_OVERHANG = 0.015;
  const CROWN_H = 0.12;
  const CROWN_OVERHANG = 0.035;

  const SIDE_T = 0.032;
  const SHELF_T = 0.026;
  const BACK_T = 0.018;

  const BODY_W = W - CROWN_OVERHANG * 2;
  const BODY_D = D - CROWN_OVERHANG; // flush at back (-Z), overhangs at front (+Z)
  const BODY_Z_CENTER = -CROWN_OVERHANG * 0.5;

  const INNER_W = BODY_W - SIDE_T * 2;
  const INNER_D = BODY_D - BACK_T;
  const INNER_Z_CENTER = BODY_Z_CENTER + BACK_T * 0.5;

  // Materials
  const woodMain = new THREE.MeshStandardMaterial({
    color: 0x6b4728,
    roughness: 0.62,
    metalness: 0.03,
  });
  const woodDark = new THREE.MeshStandardMaterial({
    color: 0x57381e,
    roughness: 0.68,
    metalness: 0.03,
  });
  const woodLight = new THREE.MeshStandardMaterial({
    color: 0x8a613a,
    roughness: 0.60,
    metalness: 0.03,
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

  // 1. Plinth Base
  const plinthW = BODY_W + PLINTH_OVERHANG * 2;
  const plinthD = BODY_D + PLINTH_OVERHANG;
  const plinthZ = BODY_Z_CENTER + PLINTH_OVERHANG * 0.5;
  const plinthMainH = PLINTH_H - 0.02;

  addMesh(
    new THREE.BoxGeometry(plinthW, plinthMainH, plinthD),
    woodMain,
    "plinth_base",
    0,
    plinthMainH * 0.5,
    plinthZ
  );

  // Plinth top stepped molding
  addMesh(
    new THREE.BoxGeometry(plinthW - 0.01, 0.02, plinthD - 0.006),
    woodMain,
    "plinth_molding",
    0,
    plinthMainH + 0.01,
    plinthZ - 0.003
  );

  // 2. Side Panels
  const sideH = H - PLINTH_H - CROWN_H;
  const sideY = PLINTH_H + sideH * 0.5;

  addMesh(
    new THREE.BoxGeometry(SIDE_T, sideH, BODY_D),
    woodMain,
    "side_panel_left",
    -BODY_W * 0.5 + SIDE_T * 0.5,
    sideY,
    BODY_Z_CENTER
  );

  addMesh(
    new THREE.BoxGeometry(SIDE_T, sideH, BODY_D),
    woodMain,
    "side_panel_right",
    BODY_W * 0.5 - SIDE_T * 0.5,
    sideY,
    BODY_Z_CENTER
  );

  // 3. Bottom Interior Floor & Top Ceiling
  addMesh(
    new THREE.BoxGeometry(INNER_W, SHELF_T, INNER_D),
    woodMain,
    "bottom_shelf",
    0,
    PLINTH_H + SHELF_T * 0.5,
    INNER_Z_CENTER
  );

  addMesh(
    new THREE.BoxGeometry(INNER_W, SHELF_T, INNER_D),
    woodDark,
    "top_ceiling",
    0,
    H - CROWN_H - SHELF_T * 0.5,
    INNER_Z_CENTER
  );

  // 4. Vertical Planked Back Panel
  const numPlanks = 7;
  const plankW = INNER_W / numPlanks;
  const backZ = BODY_Z_CENTER - BODY_D * 0.5 + BACK_T * 0.5;
  const plankMaterials = [
    woodMain,
    woodLight,
    woodMain,
    woodDark,
    woodMain,
    woodLight,
    woodMain,
  ];

  for (let i = 0; i < numPlanks; i++) {
    const px = -INNER_W * 0.5 + plankW * (i + 0.5);
    addMesh(
      new THREE.BoxGeometry(plankW - 0.002, sideH, BACK_T),
      plankMaterials[i],
      `back_plank_${i + 1}`,
      px,
      sideY,
      backZ
    );
  }

  // 5. Adjustable Shelves (3 shelves -> 4 compartments)
  const interiorBottomY = PLINTH_H + SHELF_T;
  const interiorTopY = H - CROWN_H - SHELF_T;
  const interiorH = interiorTopY - interiorBottomY;
  const numShelves = 3;

  for (let i = 1; i <= numShelves; i++) {
    const sy = interiorBottomY + (interiorH / (numShelves + 1)) * i;
    addMesh(
      new THREE.BoxGeometry(INNER_W - 0.004, SHELF_T, INNER_D - 0.015),
      woodMain,
      `adjustable_shelf_${i}`,
      0,
      sy,
      INNER_Z_CENTER - 0.005
    );
  }

  // 6. Sawtooth / Batten Shelf Support Strips (2 per side)
  const battenW = 0.014;
  const battenD = 0.022;
  const battenH = interiorH - 0.02;
  const battenY = interiorBottomY + interiorH * 0.5;
  const leftInnerX = -INNER_W * 0.5 + battenW * 0.5;
  const rightInnerX = INNER_W * 0.5 - battenW * 0.5;
  const frontBattenZ = INNER_Z_CENTER + INNER_D * 0.5 - 0.045;
  const backBattenZ = INNER_Z_CENTER - INNER_D * 0.5 + 0.035;

  addMesh(
    new THREE.BoxGeometry(battenW, battenH, battenD),
    woodDark,
    "shelf_support_left_front",
    leftInnerX,
    battenY,
    frontBattenZ
  );
  addMesh(
    new THREE.BoxGeometry(battenW, battenH, battenD),
    woodDark,
    "shelf_support_left_back",
    leftInnerX,
    battenY,
    backBattenZ
  );
  addMesh(
    new THREE.BoxGeometry(battenW, battenH, battenD),
    woodDark,
    "shelf_support_right_front",
    rightInnerX,
    battenY,
    frontBattenZ
  );
  addMesh(
    new THREE.BoxGeometry(battenW, battenH, battenD),
    woodDark,
    "shelf_support_right_back",
    rightInnerX,
    battenY,
    backBattenZ
  );

  // 7. Crown Molding (3 stepped layers at top)
  const crownBaseY = H - CROWN_H;
  const layer1H = 0.045;
  const layer2H = 0.035;
  const layer3H = 0.04;

  // Lower frieze
  addMesh(
    new THREE.BoxGeometry(BODY_W + 0.016, layer1H, BODY_D + 0.008),
    woodMain,
    "crown_frieze",
    0,
    crownBaseY + layer1H * 0.5,
    BODY_Z_CENTER + 0.004
  );

  // Middle stepped molding
  addMesh(
    new THREE.BoxGeometry(BODY_W + 0.044, layer2H, BODY_D + 0.022),
    woodMain,
    "crown_molding_mid",
    0,
    crownBaseY + layer1H + layer2H * 0.5,
    BODY_Z_CENTER + 0.011
  );

  // Top cap
  addMesh(
    new THREE.BoxGeometry(W, layer3H, D),
    woodMain,
    "crown_cap",
    0,
    H - layer3H * 0.5,
    0
  );

  return group;
}
