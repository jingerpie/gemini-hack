function build(THREE) {
  const group = new THREE.Group();

  const H = 1.60;
  const W = 0.90;
  const D = 0.38;

  const POST_W = 0.055;
  const POST_D = 0.055;
  const SHELF_THICK = 0.024;
  const LIP_H = 0.055;
  const LIP_THICK = 0.018;
  const RAIL_H = 0.055;
  const RAIL_THICK = 0.024;
  const BOTTOM_CLEARANCE = 0.075;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6e4726,
    roughness: 0.62,
    metalness: 0.04,
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

  // Four corner uprights
  const postX = W / 2 - POST_W / 2;
  const postZ = D / 2 - POST_D / 2;
  addBox('upright_front_left', POST_W, H, POST_D, -postX, H / 2, postZ);
  addBox('upright_front_right', POST_W, H, POST_D, postX, H / 2, postZ);
  addBox('upright_back_left', POST_W, H, POST_D, -postX, H / 2, -postZ);
  addBox('upright_back_right', POST_W, H, POST_D, postX, H / 2, -postZ);

  // Top frame rails
  const innerW = W - 2 * POST_W;
  const innerD = D - 2 * POST_D;
  const topRailY = H - RAIL_H / 2;
  addBox('top_rail_front', innerW, RAIL_H, RAIL_THICK, 0, topRailY, postZ);
  addBox('top_rail_back', innerW, RAIL_H, RAIL_THICK, 0, topRailY, -postZ);
  addBox('top_rail_left', RAIL_THICK, RAIL_H, innerD, -postX, topRailY, 0);
  addBox('top_rail_right', RAIL_THICK, RAIL_H, innerD, postX, topRailY, 0);

  // Bottom frame rails
  const bottomRailY = BOTTOM_CLEARANCE + RAIL_H / 2;
  addBox('bottom_rail_front', innerW, RAIL_H, RAIL_THICK, 0, bottomRailY, postZ);
  addBox('bottom_rail_back', innerW, RAIL_H, RAIL_THICK, 0, bottomRailY, -postZ);
  addBox('bottom_rail_left', RAIL_THICK, RAIL_H, innerD, -postX, bottomRailY, 0);
  addBox('bottom_rail_right', RAIL_THICK, RAIL_H, innerD, postX, bottomRailY, 0);

  // Four shelves with backstop lips
  const bottomShelfTopY = BOTTOM_CLEARANCE + RAIL_H;
  const topRailBottomY = H - RAIL_H;
  const compartmentH = (topRailBottomY - bottomShelfTopY) / 4;
  const shelfNames = ['shelf_bottom', 'shelf_lower_mid', 'shelf_upper_mid', 'shelf_top'];
  const lipNames = ['shelf_lip_bottom', 'shelf_lip_lower_mid', 'shelf_lip_upper_mid', 'shelf_lip_top'];

  for (let i = 0; i < 4; i++) {
    const shelfTopY = bottomShelfTopY + i * compartmentH;
    const shelfY = shelfTopY - SHELF_THICK / 2;
    addBox(shelfNames[i], innerW, SHELF_THICK, D - 0.01, 0, shelfY, 0);

    const lipY = shelfTopY + LIP_H / 2;
    const lipZ = -postZ + POST_D / 2 - LIP_THICK / 2;
    addBox(lipNames[i], innerW, LIP_H, LIP_THICK, 0, lipY, lipZ);
  }

  return group;
}
