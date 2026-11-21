function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.06;          // Total width
  const H = 0.86;          // Total height
  const D = 0.45;          // Total depth
  const PLINTH_H = 0.045;  // Height of recessed base
  const PLINTH_INSET = 0.035; // Inset of plinth from sides and front
  const PANEL_T = 0.025;   // Thickness of outer carcass panels
  const BACK_T = 0.015;    // Thickness of back panel
  const DOOR_T = 0.022;    // Thickness of doors
  const DOOR_GAP = 0.004;  // Gap between doors and side/bottom frame
  const TOP_PULL_GAP = 0.018; // Finger-pull shadow gap at top of doors
  const DOOR_INSET = 0.008;   // How far doors sit behind the front edge of the frame

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc69d70,
    roughness: 0.55,
    metalness: 0.0
  });

  const innerWoodMat = new THREE.MeshStandardMaterial({
    color: 0xa67e53,
    roughness: 0.65,
    metalness: 0.0
  });

  const shadowMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1a,
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

  // 1. Recessed Plinth Base (y = 0 to PLINTH_H)
  const plinthW = W - PLINTH_INSET * 2;
  const plinthD = D - PLINTH_INSET * 2;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    innerWoodMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // Carcass dimensions (sits on top of plinth)
  const carcassY0 = PLINTH_H;
  const carcassH = H - PLINTH_H;
  const innerW = W - PANEL_T * 2;
  const innerH = carcassH - PANEL_T * 2;
  const innerD = D - BACK_T;

  // 2. Bottom Panel
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    'bottom_panel',
    0,
    carcassY0 + PANEL_T / 2,
    0
  );

  // 3. Top Panel
  addMesh(
    new THREE.BoxGeometry(W, PANEL_T, D),
    woodMat,
    'top_panel',
    0,
    H - PANEL_T / 2,
    0
  );

  // 4. Left Side Panel
  addMesh(
    new THREE.BoxGeometry(PANEL_T, innerH, D),
    woodMat,
    'left_side_panel',
    -W / 2 + PANEL_T / 2,
    carcassY0 + carcassH / 2,
    0
  );

  // 5. Right Side Panel
  addMesh(
    new THREE.BoxGeometry(PANEL_T, innerH, D),
    woodMat,
    'right_side_panel',
    W / 2 - PANEL_T / 2,
    carcassY0 + carcassH / 2,
    0
  );

  // 6. Back Panel
  addMesh(
    new THREE.BoxGeometry(innerW, innerH, BACK_T),
    innerWoodMat,
    'back_panel',
    0,
    carcassY0 + carcassH / 2,
    -D / 2 + BACK_T / 2
  );

  // 7. Interior Vertical Divider
  const interiorD = innerD - DOOR_T - DOOR_INSET;
  const interiorZ = -D / 2 + BACK_T + interiorD / 2;
  addMesh(
    new THREE.BoxGeometry(PANEL_T * 0.8, innerH, interiorD),
    innerWoodMat,
    'interior_divider',
    0,
    carcassY0 + carcassH / 2,
    interiorZ
  );

  // 8. Interior Left Shelf
  const shelfW = (innerW - PANEL_T * 0.8) / 2;
  addMesh(
    new THREE.BoxGeometry(shelfW, PANEL_T * 0.8, interiorD * 0.95),
    innerWoodMat,
    'interior_left_shelf',
    -shelfW / 2 - PANEL_T * 0.4,
    carcassY0 + carcassH / 2,
    interiorZ
  );

  // 9. Interior Right Shelf
  addMesh(
    new THREE.BoxGeometry(shelfW, PANEL_T * 0.8, interiorD * 0.95),
    innerWoodMat,
    'interior_right_shelf',
    shelfW / 2 + PANEL_T * 0.4,
    carcassY0 + carcassH / 2,
    interiorZ
  );

  // 10. Top Shadow Strip (recessed behind the top finger-pull gap)
  addMesh(
    new THREE.BoxGeometry(innerW, TOP_PULL_GAP + 0.005, 0.01),
    shadowMat,
    'top_pull_shadow_strip',
    0,
    H - PANEL_T - TOP_PULL_GAP / 2,
    D / 2 - DOOR_INSET - DOOR_T - 0.005
  );

  // Doors
  const doorW = (innerW - DOOR_GAP * 3) / 2;
  const doorH = innerH - DOOR_GAP - TOP_PULL_GAP;
  const doorY = carcassY0 + PANEL_T + DOOR_GAP + doorH / 2;
  const doorZ = D / 2 - DOOR_INSET - DOOR_T / 2;

  // 11. Left Door
  addMesh(
    new THREE.BoxGeometry(doorW, doorH, DOOR_T),
    woodMat,
    'left_door',
    -DOOR_GAP / 2 - doorW / 2,
    doorY,
    doorZ
  );

  // 12. Right Door
  addMesh(
    new THREE.BoxGeometry(doorW, doorH, DOOR_T),
    woodMat,
    'right_door',
    DOOR_GAP / 2 + doorW / 2,
    doorY,
    doorZ
  );

  return group;
}
