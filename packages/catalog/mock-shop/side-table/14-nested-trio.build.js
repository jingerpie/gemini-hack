function build(THREE) {
  const group = new THREE.Group();

  const W1 = 0.50;
  const H1 = 0.50;
  const W2 = 0.43;
  const H2 = 0.43;
  const W3 = 0.36;
  const H3 = 0.36;
  const GAP = 0.03;
  const TUBE = 0.014;
  const TOP_T = 0.022;

  const TOTAL_W = W1 + GAP + W2 + GAP + W3;
  const X1 = -TOTAL_W / 2 + W1 / 2;
  const X2 = X1 + W1 / 2 + GAP + W2 / 2;
  const X3 = X2 + W2 / 2 + GAP + W3 / 2;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4b895,
    roughness: 0.55,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8d8479,
    roughness: 0.45,
    metalness: 0.55
  });

  function addBox(w, h, d, x, y, z, mat, name) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  function buildTable(size, height, centerX, prefix) {
    const frameH = height - TOP_T;
    const half = size / 2;
    const inset = half - TUBE / 2;
    const legH = frameH - TUBE * 2;
    const legY = TUBE + legH / 2;
    const railLen = size - TUBE * 2;
    const topRailY = frameH - TUBE / 2;
    const botRailY = TUBE / 2;

    // Wood top
    addBox(size, TOP_T, size, centerX, height - TOP_T / 2, 0, woodMat, `${prefix}_top`);

    // 4 vertical legs
    addBox(TUBE, legH, TUBE, centerX - inset, legY, inset, metalMat, `${prefix}_leg_fl`);
    addBox(TUBE, legH, TUBE, centerX + inset, legY, inset, metalMat, `${prefix}_leg_fr`);
    addBox(TUBE, legH, TUBE, centerX - inset, legY, -inset, metalMat, `${prefix}_leg_bl`);
    addBox(TUBE, legH, TUBE, centerX + inset, legY, -inset, metalMat, `${prefix}_leg_br`);

    // 4 top rails
    addBox(railLen, TUBE, TUBE, centerX, topRailY, inset, metalMat, `${prefix}_top_rail_f`);
    addBox(railLen, TUBE, TUBE, centerX, topRailY, -inset, metalMat, `${prefix}_top_rail_b`);
    addBox(TUBE, TUBE, size, centerX - inset, topRailY, 0, metalMat, `${prefix}_top_rail_l`);
    addBox(TUBE, TUBE, size, centerX + inset, topRailY, 0, metalMat, `${prefix}_top_rail_r`);

    // 4 bottom rails
    addBox(railLen, TUBE, TUBE, centerX, botRailY, inset, metalMat, `${prefix}_bot_rail_f`);
    addBox(railLen, TUBE, TUBE, centerX, botRailY, -inset, metalMat, `${prefix}_bot_rail_b`);
    addBox(TUBE, TUBE, size, centerX - inset, botRailY, 0, metalMat, `${prefix}_bot_rail_l`);
    addBox(TUBE, TUBE, size, centerX + inset, botRailY, 0, metalMat, `${prefix}_bot_rail_r`);
  }

  buildTable(W1, H1, X1, 'large_table');
  buildTable(W2, H2, X2, 'medium_table');
  buildTable(W3, H3, X3, 'small_table');

  return group;
}
