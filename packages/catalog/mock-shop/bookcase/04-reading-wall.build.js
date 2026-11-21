function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.80;
  const H = 2.25;
  const D = 0.38;
  const T = 0.024;
  const BACK_T = 0.015;
  const PLINTH_H = 0.08;
  const PLINTH_RECESS = 0.025;

  const INNER_W = W - 2 * T;
  const BAY_W = (INNER_W - 2 * T) / 3;
  const SHELF_D = D - BACK_T;
  const SHELF_Z = BACK_T / 2;
  const INTERIOR_H = H - PLINTH_H - 2 * T;
  const DIVIDER_H = INTERIOR_H;
  const DIVIDER_Y = PLINTH_H + T + DIVIDER_H / 2;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc2b8ac,
    roughness: 0.78,
    metalness: 0.02
  });

  function addBox(name, w, h, d, x, y, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, woodMat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Outer side panels
  addBox('left_panel', T, H, D, -W / 2 + T / 2, H / 2, 0);
  addBox('right_panel', T, H, D, W / 2 - T / 2, H / 2, 0);

  // Back panel
  addBox('back_panel', INNER_W, H - PLINTH_H, BACK_T, 0, PLINTH_H + (H - PLINTH_H) / 2, -D / 2 + BACK_T / 2);

  // Top and bottom panels
  addBox('top_panel', INNER_W, T, SHELF_D, 0, H - T / 2, SHELF_Z);
  addBox('bottom_shelf', INNER_W, T, SHELF_D, 0, PLINTH_H + T / 2, SHELF_Z);

  // Front plinth / kickplate
  addBox('plinth', INNER_W, PLINTH_H, T, 0, PLINTH_H / 2, D / 2 - PLINTH_RECESS - T / 2);

  // Two vertical dividers
  const div1X = -W / 2 + T + BAY_W + T / 2;
  const div2X = W / 2 - T - BAY_W - T / 2;
  addBox('divider_1', T, DIVIDER_H, SHELF_D, div1X, DIVIDER_Y, SHELF_Z);
  addBox('divider_2', T, DIVIDER_H, SHELF_D, div2X, DIVIDER_Y, SHELF_Z);

  // 5 adjustable shelves per bay (3 bays = 15 shelves)
  const bayCenters = [
    -W / 2 + T + BAY_W / 2,
    0,
    W / 2 - T - BAY_W / 2
  ];

  const numShelves = 5;
  const stepH = INTERIOR_H / (numShelves + 1);

  for (let b = 0; b < 3; b++) {
    for (let s = 1; s <= numShelves; s++) {
      const sy = PLINTH_H + T + s * stepH;
      addBox(`shelf_bay${b + 1}_${s}`, BAY_W, T, SHELF_D, bayCenters[b], sy, SHELF_Z);
    }
  }

  return group;
}
