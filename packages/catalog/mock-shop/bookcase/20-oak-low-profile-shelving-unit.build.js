function build(THREE) {
  const group = new THREE.Group();

  const W = 1.60;
  const H = 0.56;
  const D = 0.42;
  const PLINTH_H = 0.025;
  const PLINTH_INSET = 0.04;
  const THICK = 0.025;
  const BACK_THICK = 0.015;

  const INNER_W = W - 2 * THICK;
  const INNER_H = H - PLINTH_H - 2 * THICK;
  const INNER_D = D - BACK_THICK;
  const TIER_H = (INNER_H - THICK) / 2;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb6895b,
    roughness: 0.65,
    metalness: 0.0
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9c7146,
    roughness: 0.72,
    metalness: 0.0
  });

  function addBox(w, h, d, x, y, z, mat, name) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  }

  // Plinth base
  addBox(
    W - 2 * PLINTH_INSET,
    PLINTH_H,
    D - 2 * PLINTH_INSET,
    0,
    PLINTH_H / 2,
    0,
    oakDarkMat,
    'plinth_base'
  );

  // Outer frame: bottom, top, left, right, back
  addBox(
    W,
    THICK,
    D,
    0,
    PLINTH_H + THICK / 2,
    0,
    oakMat,
    'bottom_panel'
  );

  addBox(
    W,
    THICK,
    D,
    0,
    H - THICK / 2,
    0,
    oakMat,
    'top_panel'
  );

  const sideCenterY = PLINTH_H + THICK + INNER_H / 2;
  addBox(
    THICK,
    INNER_H,
    D,
    -W / 2 + THICK / 2,
    sideCenterY,
    0,
    oakMat,
    'left_panel'
  );

  addBox(
    THICK,
    INNER_H,
    D,
    W / 2 - THICK / 2,
    sideCenterY,
    0,
    oakMat,
    'right_panel'
  );

  addBox(
    INNER_W,
    INNER_H,
    BACK_THICK,
    0,
    sideCenterY,
    -D / 2 + BACK_THICK / 2,
    oakDarkMat,
    'back_panel'
  );

  // Middle horizontal shelf
  const shelfCenterY = PLINTH_H + THICK + TIER_H + THICK / 2;
  addBox(
    INNER_W,
    THICK,
    INNER_D,
    0,
    shelfCenterY,
    BACK_THICK / 2,
    oakMat,
    'middle_shelf'
  );

  // Upper tier vertical dividers (3 equal compartments)
  const upperCenterY = shelfCenterY + THICK / 2 + TIER_H / 2;
  addBox(
    THICK,
    TIER_H,
    INNER_D,
    -INNER_W / 6,
    upperCenterY,
    BACK_THICK / 2,
    oakMat,
    'upper_divider_left'
  );

  addBox(
    THICK,
    TIER_H,
    INNER_D,
    INNER_W / 6,
    upperCenterY,
    BACK_THICK / 2,
    oakMat,
    'upper_divider_right'
  );

  // Lower tier vertical divider (separating left 1/3 open cubby from right 2/3)
  const lowerCenterY = PLINTH_H + THICK + TIER_H / 2;
  addBox(
    THICK,
    TIER_H,
    INNER_D,
    -INNER_W / 6,
    lowerCenterY,
    BACK_THICK / 2,
    oakMat,
    'lower_divider'
  );

  // Slatted sliding door on lower right 2/3
  const doorXMin = -INNER_W / 6 - THICK / 2;
  const doorXMax = INNER_W / 2;
  const doorW = doorXMax - doorXMin;
  const doorCenterX = (doorXMin + doorXMax) / 2;
  const doorH = TIER_H - 0.004;
  const doorZ = D / 2 - 0.018;
  const doorFrameW = 0.024;
  const doorThick = 0.018;

  // Door outer frame
  addBox(
    doorW,
    doorFrameW,
    doorThick,
    doorCenterX,
    lowerCenterY + doorH / 2 - doorFrameW / 2,
    doorZ,
    oakMat,
    'door_top_rail'
  );

  addBox(
    doorW,
    doorFrameW,
    doorThick,
    doorCenterX,
    lowerCenterY - doorH / 2 + doorFrameW / 2,
    doorZ,
    oakMat,
    'door_bottom_rail'
  );

  addBox(
    doorFrameW,
    doorH - 2 * doorFrameW,
    doorThick,
    doorXMin + doorFrameW / 2,
    lowerCenterY,
    doorZ,
    oakMat,
    'door_left_stile'
  );

  addBox(
    doorFrameW,
    doorH - 2 * doorFrameW,
    doorThick,
    doorXMax - doorFrameW / 2,
    lowerCenterY,
    doorZ,
    oakMat,
    'door_right_stile'
  );

  // 16 vertical slats inside the door
  const slatCount = 16;
  const slatAreaW = doorW - 2 * doorFrameW;
  const slatW = 0.022;
  const slatH = doorH - 2 * doorFrameW;
  const slatThick = 0.014;
  const slatStep = slatAreaW / (slatCount + 1);

  for (let i = 1; i <= slatCount; i++) {
    const sx = doorXMin + doorFrameW + i * slatStep;
    addBox(
      slatW,
      slatH,
      slatThick,
      sx,
      lowerCenterY,
      doorZ,
      oakMat,
      `door_slat_${i}`
    );
  }

  return group;
}
