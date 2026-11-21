function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.40;
  const H = 2.06;
  const D = 0.45;
  const BAY_W = W / 3;
  const POLE_R = 0.014;
  const SHELF_T = 0.024;
  const SHELF_D = D - 0.01;
  const ROD_R = 0.011;

  const Y_BOT = 0.04;
  const Y_LEFT_LOW = 0.42;
  const Y_LEFT_HIGH = 0.78;
  const Y_MID = 1.04;
  const Y_TOP = 1.98;

  const Y_ROD_TOP = 1.88;
  const Y_ROD_BOT = 0.94;

  // Materials
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc8ccce,
    roughness: 0.45,
    metalness: 0.55
  });
  const matWood = new THREE.MeshStandardMaterial({
    color: 0xdfc9a8,
    roughness: 0.65,
    metalness: 0.0
  });
  const matBox = new THREE.MeshStandardMaterial({
    color: 0x9aaa97,
    roughness: 0.75,
    metalness: 0.0
  });
  const matClothSage = new THREE.MeshStandardMaterial({
    color: 0x8fa189,
    roughness: 0.85,
    metalness: 0.0
  });
  const matClothRust = new THREE.MeshStandardMaterial({
    color: 0xa85532,
    roughness: 0.85,
    metalness: 0.0
  });
  const matClothCream = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.85,
    metalness: 0.0
  });
  const matClothGrey = new THREE.MeshStandardMaterial({
    color: 0xb0b2b0,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    if (rx || ry || rz) m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. Vertical Frame Poles (8 meshes)
  const poleGeo = new THREE.CylinderGeometry(POLE_R, POLE_R, H, 16);
  const xCols = [-W / 2, -BAY_W / 2, BAY_W / 2, W / 2];
  const zRows = [-D / 2 + POLE_R, D / 2 - POLE_R];

  for (let xi = 0; xi < xCols.length; xi++) {
    for (let zi = 0; zi < zRows.length; zi++) {
      const side = zi === 0 ? "back" : "front";
      addMesh(poleGeo, matSteel, `frame_pole_${xi}_${side}`, xCols[xi], H / 2, zRows[zi]);
    }
  }

  // 2. Shelves (10 meshes)
  const shelfGeo = new THREE.BoxGeometry(BAY_W - POLE_R * 2, SHELF_T, SHELF_D);
  const bayCenters = [-BAY_W, 0, BAY_W];

  for (let bi = 0; bi < 3; bi++) {
    addMesh(shelfGeo, matWood, `shelf_top_${bi}`, bayCenters[bi], Y_TOP, 0);
    addMesh(shelfGeo, matWood, `shelf_bottom_${bi}`, bayCenters[bi], Y_BOT, 0);
  }
  // Middle shelves for center and right bays
  addMesh(shelfGeo, matWood, "shelf_mid_1", bayCenters[1], Y_MID, 0);
  addMesh(shelfGeo, matWood, "shelf_mid_2", bayCenters[2], Y_MID, 0);
  // Two lower shelves for left bay
  addMesh(shelfGeo, matWood, "shelf_left_high", bayCenters[0], Y_LEFT_HIGH, 0);
  addMesh(shelfGeo, matWood, "shelf_left_low", bayCenters[0], Y_LEFT_LOW, 0);

  // 3. Hanging Rods (5 meshes)
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, BAY_W - POLE_R * 2, 16);
  for (let bi = 0; bi < 3; bi++) {
    addMesh(rodGeo, matSteel, `hanging_rod_top_${bi}`, bayCenters[bi], Y_ROD_TOP, 0, 0, 0, Math.PI / 2);
  }
  addMesh(rodGeo, matSteel, "hanging_rod_bot_1", bayCenters[1], Y_ROD_BOT, 0, 0, 0, Math.PI / 2);
  addMesh(rodGeo, matSteel, "hanging_rod_bot_2", bayCenters[2], Y_ROD_BOT, 0, 0, 0, Math.PI / 2);

  // 4. Storage Boxes (8 meshes: 6 on top, 2 on bottom-left)
  const boxW = 0.32;
  const boxH = 0.16;
  const boxD = 0.34;
  const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);

  for (let bi = 0; bi < 3; bi++) {
    addMesh(boxGeo, matBox, `storage_box_top_${bi}_l`, bayCenters[bi] - 0.19, Y_TOP + SHELF_T / 2 + boxH / 2, 0);
    addMesh(boxGeo, matBox, `storage_box_top_${bi}_r`, bayCenters[bi] + 0.19, Y_TOP + SHELF_T / 2 + boxH / 2, 0);
  }
  addMesh(boxGeo, matBox, "storage_box_bot_l", bayCenters[0] - 0.19, Y_BOT + SHELF_T / 2 + boxH / 2, 0);
  addMesh(boxGeo, matBox, "storage_box_bot_r", bayCenters[0] + 0.19, Y_BOT + SHELF_T / 2 + boxH / 2, 0);

  // 5. Folded Clothes Stacks on Left Shelves (4 meshes)
  const stackGeo = new THREE.BoxGeometry(0.28, 0.09, 0.30);
  addMesh(stackGeo, matClothSage, "folded_stack_high_l", bayCenters[0] - 0.18, Y_LEFT_HIGH + SHELF_T / 2 + 0.045, 0);
  addMesh(stackGeo, matClothCream, "folded_stack_high_r", bayCenters[0] + 0.18, Y_LEFT_HIGH + SHELF_T / 2 + 0.045, 0);
  addMesh(stackGeo, matClothRust, "folded_stack_low_l", bayCenters[0] - 0.18, Y_LEFT_LOW + SHELF_T / 2 + 0.045, 0);
  addMesh(stackGeo, matClothSage, "folded_stack_low_r", bayCenters[0] + 0.18, Y_LEFT_LOW + SHELF_T / 2 + 0.045, 0);

  // 6. Hanging Garment Clusters (5 meshes)
  const garmentTopGeo = new THREE.BoxGeometry(BAY_W - 0.14, 0.62, 0.30);
  const garmentBotGeo = new THREE.BoxGeometry(BAY_W - 0.14, 0.56, 0.30);

  addMesh(garmentTopGeo, matClothGrey, "hanging_clothes_top_0", bayCenters[0], Y_ROD_TOP - 0.33, 0);
  addMesh(garmentTopGeo, matClothRust, "hanging_clothes_top_1", bayCenters[1], Y_ROD_TOP - 0.33, 0);
  addMesh(garmentTopGeo, matClothSage, "hanging_clothes_top_2", bayCenters[2], Y_ROD_TOP - 0.33, 0);
  addMesh(garmentBotGeo, matClothSage, "hanging_clothes_bot_1", bayCenters[1], Y_ROD_BOT - 0.30, 0);
  addMesh(garmentBotGeo, matClothCream, "hanging_clothes_bot_2", bayCenters[2], Y_ROD_BOT - 0.30, 0);

  return group;
}
