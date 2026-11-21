function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.68;
  const D = 0.88;
  const H = 0.80;

  const LEG_H = 0.14;
  const RAIL_H = 0.045;
  const RAIL_T = 0.038;
  const LEG_TOP_W = 0.044;
  const LEG_BOT_W = 0.026;

  const ARM_W = 0.14;
  const ARM_H = 0.44; // above rail
  const ARM_TOP_Y = LEG_H + RAIL_H + ARM_H; // ~0.625

  const DECK_H = 0.10;
  const DECK_Y = LEG_H + RAIL_H; // 0.185
  const SEAT_BASE_Y = DECK_Y + DECK_H; // 0.285

  const SEAT_CUSHION_H = 0.145;
  const SEAT_TOP_Y = SEAT_BASE_Y + SEAT_CUSHION_H; // 0.43

  const BACK_FRAME_H = 0.48;
  const BACK_FRAME_T = 0.11;

  const INNER_W = W - 2 * ARM_W;
  const INNER_D = D - BACK_FRAME_T;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x764a2b,
    roughness: 0.55,
    metalness: 0.04,
  });

  const beigeWoolMat = new THREE.MeshStandardMaterial({
    color: 0xc8b296,
    roughness: 0.92,
    metalness: 0.0,
  });

  const sageWoolMat = new THREE.MeshStandardMaterial({
    color: 0x90988d,
    roughness: 0.92,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded-box ExtrudeGeometry centered on X, Y, Z
  function createRoundedBox(w, h, d, r = 0.025, bevel = 0.02) {
    const bw = w - 2 * bevel;
    const bh = h - 2 * bevel;
    const bd = d - 2 * bevel;
    const shape = new THREE.Shape();
    const hw = bw / 2;
    const hh = bh / 2;
    const cr = Math.min(r, hw * 0.45, hh * 0.45);

    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    shape.lineTo(hw, hh - cr);
    shape.quadraticCurveTo(hw, hh, hw - cr, hh);
    shape.lineTo(-hw + cr, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    shape.lineTo(-hw, -hh + cr);
    shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: bd,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }

  // 1. Wood Legs (4 tapered square legs)
  const legGeo = new THREE.CylinderGeometry(
    LEG_TOP_W * Math.SQRT1_2,
    LEG_BOT_W * Math.SQRT1_2,
    LEG_H,
    4
  );
  const legX = W / 2 - LEG_TOP_W / 2 - 0.004;
  const legZ = D / 2 - LEG_TOP_W / 2 - 0.004;
  const legY = LEG_H / 2;

  addMesh(legGeo, woodMat, 'leg_front_left', -legX, legY, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, woodMat, 'leg_front_right', legX, legY, legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, woodMat, 'leg_back_left', -legX, legY, -legZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, woodMat, 'leg_back_right', legX, legY, -legZ, 0, Math.PI / 4, 0);

  // 2. Wood Bottom Rails
  const railY = LEG_H + RAIL_H / 2;
  const fbRailGeo = new THREE.BoxGeometry(W - 0.008, RAIL_H, RAIL_T);
  addMesh(fbRailGeo, woodMat, 'rail_front', 0, railY, D / 2 - RAIL_T / 2 - 0.004);
  addMesh(fbRailGeo, woodMat, 'rail_back', 0, railY, -D / 2 + RAIL_T / 2 + 0.004);

  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, D - 0.008);
  addMesh(sideRailGeo, woodMat, 'rail_left', -W / 2 + RAIL_T / 2 + 0.004, railY, 0);
  addMesh(sideRailGeo, woodMat, 'rail_right', W / 2 - RAIL_T / 2 - 0.004, railY, 0);

  // 3. Vertical Wood Corner Posts (framing the front & back of the armrests)
  const postH = ARM_H - 0.025;
  const postW = 0.032;
  const postD = 0.028;
  const postGeo = new THREE.BoxGeometry(postW, postH, postD);
  const postY = LEG_H + RAIL_H + postH / 2 - 0.005;
  const postX = W / 2 - postW / 2 - 0.002;
  const postZ = D / 2 - postD / 2 - 0.002;

  addMesh(postGeo, woodMat, 'arm_post_front_left', -postX, postY, postZ);
  addMesh(postGeo, woodMat, 'arm_post_front_right', postX, postY, postZ);
  addMesh(postGeo, woodMat, 'arm_post_back_left', -postX, postY, -postZ);
  addMesh(postGeo, woodMat, 'arm_post_back_right', postX, postY, -postZ);

  // 4. Upholstered Base Deck (between arms, above front/back rails)
  const deckGeo = new THREE.BoxGeometry(INNER_W + 0.04, DECK_H, D - 0.04);
  addMesh(deckGeo, beigeWoolMat, 'base_deck', 0, DECK_Y + DECK_H / 2, 0);

  // 5. Upholstered Armrests (Left & Right)
  const armGeo = createRoundedBox(ARM_W, ARM_H, D - 0.02, 0.03, 0.02);
  const armX = W / 2 - ARM_W / 2 - 0.012;
  const armY = DECK_Y + ARM_H / 2;
  addMesh(armGeo, beigeWoolMat, 'armrest_left', -armX, armY, 0);
  addMesh(armGeo, beigeWoolMat, 'armrest_right', armX, armY, 0);

  // 6. Upholstered Backrest Frame
  const backFrameGeo = createRoundedBox(INNER_W + 0.04, BACK_FRAME_H, BACK_FRAME_T, 0.025, 0.02);
  const backFrameY = DECK_Y + BACK_FRAME_H / 2;
  const backFrameZ = -D / 2 + BACK_FRAME_T / 2 + 0.015;
  addMesh(backFrameGeo, beigeWoolMat, 'backrest_frame', 0, backFrameY, backFrameZ);

  // 7. Seat Cushions (2 side-by-side sage-grey wool cushions)
  const seatGap = 0.008;
  const seatW = (INNER_W - seatGap) / 2 - 0.005;
  const seatD = INNER_D - 0.02;
  const seatGeo = createRoundedBox(seatW, SEAT_CUSHION_H, seatD, 0.03, 0.024);
  const seatY = SEAT_BASE_Y + SEAT_CUSHION_H / 2 - 0.005;
  const seatZ = BACK_FRAME_T / 2 - 0.005;
  const seatX = seatW / 2 + seatGap / 2;

  addMesh(seatGeo, sageWoolMat, 'seat_cushion_left', -seatX, seatY, seatZ);
  addMesh(seatGeo, sageWoolMat, 'seat_cushion_right', seatX, seatY, seatZ);

  // 8. Back Cushions (2 plush sage-grey wool cushions leaning slightly back)
  const backCushionH = H - SEAT_TOP_Y + 0.02; // ~0.39
  const backCushionT = 0.16;
  const backCushionW = seatW;
  const backCushionGeo = createRoundedBox(backCushionW, backCushionH, backCushionT, 0.035, 0.028);
  const backCushionY = SEAT_TOP_Y + backCushionH / 2 - 0.02;
  const backCushionZ = backFrameZ + BACK_FRAME_T / 2 + backCushionT / 2 - 0.025;
  const backTilt = -0.14; // slight recline

  addMesh(backCushionGeo, sageWoolMat, 'back_cushion_left', -seatX, backCushionY, backCushionZ, backTilt, 0, 0);
  addMesh(backCushionGeo, sageWoolMat, 'back_cushion_right', seatX, backCushionY, backCushionZ, backTilt, 0, 0);

  return group;
}
