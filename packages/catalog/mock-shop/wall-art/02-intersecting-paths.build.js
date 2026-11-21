function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - A5 (15 cm x 21 cm)
  const W = 0.15;
  const H = 0.21;
  const D = 0.014;
  const BORDER = 0.008;
  const LAYER_T = 0.0004;
  const BOARD_D = D - LAYER_T * 4;

  // Artwork layout constants
  const R_OUT = 0.036;
  const R_IN = 0.020;
  const CX_L = -0.012;
  const CX_R = 0.012;
  const CY_ARCH = 0.122;
  const Y_GAP_TOP = 0.072;
  const Y_GAP_BOT = 0.066;
  const Y_BOT = 0.042;
  const SHADOW_W = 0.0028;

  // Materials
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7f6f2, roughness: 0.75, metalness: 0.0 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf2ede0, roughness: 0.85, metalness: 0.0 });
  const peachMat = new THREE.MeshStandardMaterial({ color: 0xf5ab87, roughness: 0.8, metalness: 0.0 });
  const mintMat = new THREE.MeshStandardMaterial({ color: 0x9ad4b8, roughness: 0.8, metalness: 0.0 });
  const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x383a3b, roughness: 0.85, metalness: 0.0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf7d917, roughness: 0.75, metalness: 0.0 });

  const extrudeSettings = { depth: LAYER_T, bevelEnabled: false, curveSegments: 24 };

  function addMesh(geometry, material, name, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createArchShape(cx, cy, rOut, rIn, yBot) {
    const shape = new THREE.Shape();
    shape.moveTo(cx - rOut, yBot);
    shape.lineTo(cx - rOut, cy);
    shape.absarc(cx, cy, rOut, Math.PI, 0, true);
    shape.lineTo(cx + rOut, yBot);
    shape.lineTo(cx + rIn, yBot);
    shape.lineTo(cx + rIn, cy);
    shape.absarc(cx, cy, rIn, 0, Math.PI, false);
    shape.lineTo(cx - rIn, yBot);
    shape.closePath();
    return shape;
  }

  // 1. Backing board (centered so overall z spans [-D/2, +D/2])
  const boardGeo = new THREE.BoxGeometry(W, H, BOARD_D);
  addMesh(boardGeo, whiteMat, "backing_board", 0, H / 2, -D / 2 + BOARD_D / 2);

  // 2. Cream paper background
  const bgW = W - 2 * BORDER;
  const bgH = H - 2 * BORDER;
  const bgGeo = new THREE.BoxGeometry(bgW, bgH, LAYER_T);
  const zBg = -D / 2 + BOARD_D + LAYER_T / 2;
  addMesh(bgGeo, creamMat, "cream_background", 0, H / 2, zBg);

  const zArt1 = -D / 2 + BOARD_D + LAYER_T;
  const zArt2 = zArt1 + LAYER_T;
  const zArt3 = zArt2 + LAYER_T;

  // 3. Peach arch (left)
  const peachArchGeo = new THREE.ExtrudeGeometry(
    createArchShape(CX_L, CY_ARCH, R_OUT, R_IN, Y_GAP_TOP),
    extrudeSettings
  );
  addMesh(peachArchGeo, peachMat, "peach_arch", 0, 0, zArt1);

  // 4. Peach bottom block
  const peachBlockW = R_OUT - R_IN;
  const blockH = Y_GAP_BOT - Y_BOT;
  const peachBlockGeo = new THREE.BoxGeometry(peachBlockW, blockH, LAYER_T);
  addMesh(
    peachBlockGeo,
    peachMat,
    "peach_bottom_block",
    CX_L - R_OUT + peachBlockW / 2,
    Y_BOT + blockH / 2,
    zArt1 + LAYER_T / 2
  );

  // 5. Mint arch (right)
  const mintArchGeo = new THREE.ExtrudeGeometry(
    createArchShape(CX_R, CY_ARCH, R_OUT, R_IN, Y_GAP_TOP),
    extrudeSettings
  );
  addMesh(mintArchGeo, mintMat, "mint_arch", 0, 0, zArt1);

  // 6. Mint bottom block (wide rectangle)
  const mintBlockW = R_OUT * 2;
  const mintBlockGeo = new THREE.BoxGeometry(mintBlockW, blockH, LAYER_T);
  addMesh(
    mintBlockGeo,
    mintMat,
    "mint_bottom_block",
    CX_R,
    Y_BOT + blockH / 2,
    zArt1 + LAYER_T / 2
  );

  // 7. Top intersection charcoal lens
  const interShape = new THREE.Shape();
  const topY = CY_ARCH + Math.sqrt(R_OUT * R_OUT - CX_R * CX_R);
  const botY = CY_ARCH + Math.sqrt(R_IN * R_IN - CX_R * CX_R);
  const midX = 0.011;
  const midY = (topY + botY) * 0.5;
  interShape.moveTo(0, topY);
  interShape.quadraticCurveTo(midX, midY + 0.002, 0.009, botY + 0.003);
  interShape.quadraticCurveTo(0, botY - 0.001, -0.009, botY + 0.003);
  interShape.quadraticCurveTo(-midX, midY + 0.002, 0, topY);
  const interGeo = new THREE.ExtrudeGeometry(interShape, extrudeSettings);
  addMesh(interGeo, charcoalMat, "intersection_diamond", 0, 0, zArt2);

  // 8. Peach inner shadow
  const peachShadowGeo = new THREE.ExtrudeGeometry(
    createArchShape(CX_L, CY_ARCH, R_IN, R_IN - SHADOW_W, Y_GAP_TOP),
    extrudeSettings
  );
  addMesh(peachShadowGeo, charcoalMat, "peach_inner_shadow", 0, 0, zArt2);

  // 9. Mint outer left vertical shadow
  const mintLeftShadowH = CY_ARCH - Y_BOT + SHADOW_W;
  const mintLeftShadowGeo = new THREE.BoxGeometry(SHADOW_W, mintLeftShadowH, LAYER_T);
  addMesh(
    mintLeftShadowGeo,
    charcoalMat,
    "mint_outer_shadow_left",
    CX_R - R_OUT - SHADOW_W / 2,
    Y_BOT - SHADOW_W + mintLeftShadowH / 2,
    zArt2 + LAYER_T / 2
  );

  // 10. Mint outer bottom horizontal shadow
  const mintBotShadowW = mintBlockW + SHADOW_W;
  const mintBotShadowGeo = new THREE.BoxGeometry(mintBotShadowW, SHADOW_W, LAYER_T);
  addMesh(
    mintBotShadowGeo,
    charcoalMat,
    "mint_outer_shadow_bottom",
    CX_R - SHADOW_W / 2,
    Y_BOT - SHADOW_W / 2,
    zArt2 + LAYER_T / 2
  );

  // 11. Mint inner shadow
  const mintShadowGeo = new THREE.ExtrudeGeometry(
    createArchShape(CX_R, CY_ARCH, R_IN, R_IN - SHADOW_W, Y_GAP_TOP),
    extrudeSettings
  );
  addMesh(mintShadowGeo, charcoalMat, "mint_inner_shadow", 0, 0, zArt2);

  // 12. Yellow semicircles at bottom of right legs
  function createSemiCircle(cx, cy, r) {
    const s = new THREE.Shape();
    s.moveTo(cx - r, cy);
    s.absarc(cx, cy, r, Math.PI, 0, true);
    s.closePath();
    return s;
  }

  const yellowR = (R_OUT - R_IN) * 0.48;
  const yellowLeftGeo = new THREE.ExtrudeGeometry(
    createSemiCircle(CX_L + R_IN + (R_OUT - R_IN) / 2, Y_GAP_TOP, yellowR),
    extrudeSettings
  );
  addMesh(yellowLeftGeo, yellowMat, "yellow_semicircle_left", 0, 0, zArt3);

  const yellowRightGeo = new THREE.ExtrudeGeometry(
    createSemiCircle(CX_R + R_IN + (R_OUT - R_IN) / 2, Y_GAP_TOP, yellowR),
    extrudeSettings
  );
  addMesh(yellowRightGeo, yellowMat, "yellow_semicircle_right", 0, 0, zArt3);

  return group;
}
