function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.40;
  const H = 1.74;
  const D = 0.34;
  const T = 0.032; // Panel thickness
  const BACK_T = 0.016; // Back panel thickness
  const PLINTH_H = 0.016;
  const BOX_H = 0.69;
  const GAP_H = H - PLINTH_H - 2 * BOX_H; // 0.344m

  const INNER_W = W - 2 * T;
  const INNER_H = BOX_H - 2 * T;
  const BACK_Z = -D / 2 + BACK_T / 2;

  const pewterMat = new THREE.MeshStandardMaterial({
    color: 0x6e6963,
    metalness: 0.45,
    roughness: 0.46,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x3b3834,
    metalness: 0.3,
    roughness: 0.7,
  });

  function addBox(name, w, h, d, x, y, z, mat = pewterMat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed Plinth
  addBox('plinth_base', W - 0.04, PLINTH_H, D - 0.04, 0, PLINTH_H / 2, 0, plinthMat);

  // 2. Bottom Box
  const botY = PLINTH_H;
  const botMidY = botY + BOX_H / 2;

  addBox('bottom_box_bottom', W, T, D, 0, botY + T / 2, 0);
  addBox('bottom_box_top', W, T, D, 0, botY + BOX_H - T / 2, 0);
  addBox('bottom_box_left', T, INNER_H, D, -W / 2 + T / 2, botMidY, 0);
  addBox('bottom_box_right', T, INNER_H, D, W / 2 - T / 2, botMidY, 0);

  // Bottom Box Inner Shelf & Divider
  // Right-side horizontal shelf
  const botShelfY = botY + T + INNER_H * 0.54;
  const botDivX = -W / 2 + T + INNER_W * 0.34;
  const botShelfW = (W / 2 - T) - (botDivX - T / 2);
  addBox(
    'bottom_inner_shelf',
    botShelfW,
    T,
    D - BACK_T,
    botDivX - T / 2 + botShelfW / 2,
    botShelfY,
    BACK_T / 2
  );

  // Vertical divider going up from the left end of the shelf to the top inner wall
  const botDivH = (botY + BOX_H - T) - (botShelfY + T / 2);
  addBox(
    'bottom_inner_divider',
    T,
    botDivH,
    D - BACK_T,
    botDivX,
    botShelfY + T / 2 + botDivH / 2,
    BACK_T / 2
  );

  // Bottom Box Back Panels (leaving an open cutout in the lower-left-center)
  const botCutoutLeft = -W / 2 + T + INNER_W * 0.20;
  const botCutoutRight = -W / 2 + T + INNER_W * 0.56;
  const botCutoutTop = botY + T + INNER_H * 0.54;

  // Left back strip
  const botLeftBackW = botCutoutLeft - (-W / 2 + T);
  addBox(
    'bottom_back_left',
    botLeftBackW,
    INNER_H,
    BACK_T,
    -W / 2 + T + botLeftBackW / 2,
    botMidY,
    BACK_Z
  );

  // Upper-middle back panel (above cutout, left of divider)
  const botMidBackW = botDivX - T / 2 - botCutoutLeft;
  const botMidBackH = (botY + BOX_H - T) - botCutoutTop;
  addBox(
    'bottom_back_upper_mid',
    botMidBackW,
    botMidBackH,
    BACK_T,
    botCutoutLeft + botMidBackW / 2,
    botCutoutTop + botMidBackH / 2,
    BACK_Z
  );

  // Right back panel (full height from cutoutRight to right inner wall)
  const botRightBackW = (W / 2 - T) - botCutoutRight;
  addBox(
    'bottom_back_right',
    botRightBackW,
    INNER_H,
    BACK_T,
    botCutoutRight + botRightBackW / 2,
    botMidY,
    BACK_Z
  );

  // Upper-right back panel (above shelf, between divider and cutoutRight)
  const botUpperRightW = botCutoutRight - (botDivX - T / 2);
  addBox(
    'bottom_back_upper_right',
    botUpperRightW,
    botDivH + T,
    BACK_T,
    botDivX - T / 2 + botUpperRightW / 2,
    botShelfY - T / 2 + (botDivH + T) / 2,
    BACK_Z
  );

  // 3. Middle Vertical Pillars
  const pillarY = botY + BOX_H + GAP_H / 2;
  const pillarOffsetX = W * 0.295;
  addBox('middle_pillar_left', T, GAP_H, D - 0.02, -pillarOffsetX, pillarY, 0);
  addBox('middle_pillar_right', T, GAP_H, D - 0.02, pillarOffsetX, pillarY, 0);

  // 4. Top Box
  const topY = botY + BOX_H + GAP_H;
  const topMidY = topY + BOX_H / 2;

  addBox('top_box_bottom', W, T, D, 0, topY + T / 2, 0);
  addBox('top_box_top', W, T, D, 0, topY + BOX_H - T / 2, 0);
  addBox('top_box_left', T, INNER_H, D, -W / 2 + T / 2, topMidY, 0);
  addBox('top_box_right', T, INNER_H, D, W / 2 - T / 2, topMidY, 0);

  // Top Box Inner Shelf & Divider
  // Left-side horizontal shelf
  const topShelfY = topY + T + INNER_H * 0.46;
  const topDivX = -W / 2 + T + INNER_W * 0.65;
  const topShelfW = (topDivX + T / 2) - (-W / 2 + T);
  addBox(
    'top_inner_shelf',
    topShelfW,
    T,
    D - BACK_T,
    -W / 2 + T + topShelfW / 2,
    topShelfY,
    BACK_T / 2
  );

  // Vertical divider going down from the right end of the shelf to the bottom inner wall
  const topDivH = (topShelfY - T / 2) - (topY + T);
  addBox(
    'top_inner_divider',
    T,
    topDivH,
    D - BACK_T,
    topDivX,
    topY + T + topDivH / 2,
    BACK_T / 2
  );

  // Top Box Back Panels (leaving an open cutout in the upper-right-center)
  const topCutoutLeft = -W / 2 + T + INNER_W * 0.44;
  const topCutoutRight = -W / 2 + T + INNER_W * 0.80;
  const topCutoutBottom = topY + T + INNER_H * 0.30;

  // Upper-left back panel (above shelf, from left wall to cutoutLeft)
  const topUpperLeftW = topCutoutLeft - (-W / 2 + T);
  const topUpperLeftH = (topY + BOX_H - T) - (topShelfY + T / 2);
  addBox(
    'top_back_upper_left',
    topUpperLeftW,
    topUpperLeftH,
    BACK_T,
    -W / 2 + T + topUpperLeftW / 2,
    topShelfY + T / 2 + topUpperLeftH / 2,
    BACK_Z
  );

  // Lower-left back panel (below shelf, from left wall to divider)
  const topLowerLeftW = (topDivX - T / 2) - (-W / 2 + T);
  addBox(
    'top_back_lower_left',
    topLowerLeftW,
    topDivH,
    BACK_T,
    -W / 2 + T + topLowerLeftW / 2,
    topY + T + topDivH / 2,
    BACK_Z
  );

  // Lower-right back panel (below cutout, from divider to cutoutRight)
  const topLowerRightW = topCutoutRight - (topDivX + T / 2);
  const topLowerRightH = topCutoutBottom - (topY + T);
  addBox(
    'top_back_lower_right',
    topLowerRightW,
    topLowerRightH,
    BACK_T,
    topDivX + T / 2 + topLowerRightW / 2,
    topY + T + topLowerRightH / 2,
    BACK_Z
  );

  // Right back strip (full height from cutoutRight to right inner wall)
  const topRightBackW = (W / 2 - T) - topCutoutRight;
  addBox(
    'top_back_right',
    topRightBackW,
    INNER_H,
    BACK_T,
    topCutoutRight + topRightBackW / 2,
    topMidY,
    BACK_Z
  );

  return group;
}
