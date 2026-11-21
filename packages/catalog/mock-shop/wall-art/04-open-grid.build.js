function build(THREE) {
  const group = new THREE.Group();

  const W = 0.20;
  const H = 0.25;
  const PAPER_D = 0.004;
  const RELIEF_D = 0.001;
  const D = PAPER_D + RELIEF_D;

  const MARGIN_X = 0.022;
  const MARGIN_Y = 0.028;
  const GRID_W = W - MARGIN_X * 2;
  const GRID_H = H - MARGIN_Y * 2;
  const COLS = 12;
  const ROWS = 16;
  const CELL_W = GRID_W / COLS;
  const CELL_H = GRID_H / ROWS;
  const LINE_T = 0.0012;

  const Z_PAPER = -RELIEF_D / 2;
  const Z_RELIEF = D / 2 - RELIEF_D / 2;

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf0eee3,
    roughness: 0.92,
    metalness: 0.0
  });

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x4b313e,
    roughness: 0.78,
    metalness: 0.0
  });

  const sageMat = new THREE.MeshStandardMaterial({
    color: 0x94a88c,
    roughness: 0.85,
    metalness: 0.0
  });

  const peachMat = new THREE.MeshStandardMaterial({
    color: 0xe6a587,
    roughness: 0.85,
    metalness: 0.0
  });

  const plumMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a4a,
    roughness: 0.82,
    metalness: 0.0
  });

  const paperGeo = new THREE.BoxGeometry(W, H, PAPER_D);
  const paper = new THREE.Mesh(paperGeo, paperMat);
  paper.position.set(0, H / 2, Z_PAPER);
  paper.name = "art_print_paper";
  paper.castShadow = true;
  paper.receiveShadow = true;
  group.add(paper);

  function addBlock(col, row, colSpan, rowSpan, mat, name) {
    const bw = colSpan * CELL_W;
    const bh = rowSpan * CELL_H;
    const bx = -GRID_W / 2 + (col + colSpan / 2) * CELL_W;
    const by = H / 2 + GRID_H / 2 - (row + rowSpan / 2) * CELL_H;
    const geo = new THREE.BoxGeometry(bw, bh, RELIEF_D);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(bx, by, Z_RELIEF);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  function addVLine(col, rowStart, rowEnd, name) {
    const lh = (rowEnd - rowStart) * CELL_H;
    const lx = -GRID_W / 2 + col * CELL_W;
    const ly = H / 2 + GRID_H / 2 - ((rowStart + rowEnd) / 2) * CELL_H;
    const geo = new THREE.BoxGeometry(LINE_T, lh, RELIEF_D);
    const mesh = new THREE.Mesh(geo, lineMat);
    mesh.position.set(lx, ly, Z_RELIEF);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  function addHLine(row, colStart, colEnd, name) {
    const lw = (colEnd - colStart) * CELL_W;
    const lx = -GRID_W / 2 + ((colStart + colEnd) / 2) * CELL_W;
    const ly = H / 2 + GRID_H / 2 - row * CELL_H;
    const geo = new THREE.BoxGeometry(lw, LINE_T, RELIEF_D);
    const mesh = new THREE.Mesh(geo, lineMat);
    mesh.position.set(lx, ly, Z_RELIEF);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Colored blocks matching the Open Grid composition
  addBlock(7, 0, 2, 1, sageMat, "sage_block_top");
  addBlock(9, 0, 1, 1, peachMat, "peach_block_top");
  addBlock(1, 1, 1, 2, plumMat, "plum_block_upper_left");
  addBlock(2, 1, 1, 1, peachMat, "peach_block_upper_left");
  addBlock(3, 2, 2, 1, sageMat, "sage_block_upper_mid");
  addBlock(9, 2, 1, 1, sageMat, "sage_block_upper_right");
  addBlock(1, 3, 1, 2, sageMat, "sage_block_mid_left");
  addBlock(5, 3, 1, 1, peachMat, "peach_block_center_upper");
  addBlock(10, 3, 1, 1, plumMat, "plum_block_right_upper");
  addBlock(4, 4, 1, 1, plumMat, "plum_block_center");
  addBlock(10, 4, 1, 3, peachMat, "peach_block_right_tall");
  addBlock(6, 5, 3, 1, sageMat, "sage_block_center_wide");
  addBlock(0, 7, 1, 1, plumMat, "plum_block_far_left");
  addBlock(4, 7, 1, 1, peachMat, "peach_block_center_low");
  addBlock(2, 8, 1, 1, sageMat, "sage_block_lower_left");
  addBlock(7, 8, 1, 1, peachMat, "peach_block_mid_right");
  addBlock(11, 8, 1, 1, sageMat, "sage_block_far_right");
  addBlock(2, 9, 2, 1, plumMat, "plum_block_lower_wide");
  addBlock(8, 9, 1, 1, plumMat, "plum_block_lower_right");
  addBlock(1, 10, 1, 2, peachMat, "peach_block_bottom_left");
  addBlock(5, 10, 1, 2, sageMat, "sage_block_bottom_center");
  addBlock(7, 10, 1, 1, peachMat, "peach_block_bottom_mid");
  addBlock(7, 12, 3, 1, plumMat, "plum_block_bottom_wide");
  addBlock(2, 13, 1, 1, peachMat, "peach_block_bottom_left_small");
  addBlock(9, 13, 1, 1, sageMat, "sage_block_bottom_right");
  addBlock(1, 14, 1, 1, plumMat, "plum_block_corner_left");
  addBlock(3, 14, 1, 2, sageMat, "sage_block_bottom_tall");
  addBlock(6, 14, 1, 1, sageMat, "sage_block_bottom_mid_right");
  addBlock(10, 14, 1, 1, peachMat, "peach_block_corner_right");
  addBlock(4, 15, 1, 1, peachMat, "peach_block_bottom_edge");

  // Outer border and key open-grid lines (staying within 40 meshes total)
  addVLine(0, 0, ROWS, "grid_border_left");
  addVLine(COLS, 0, ROWS, "grid_border_right");
  addHLine(0, 0, COLS, "grid_border_top");
  addHLine(ROWS, 0, COLS, "grid_border_bottom");

  addVLine(2, 0, ROWS, "grid_v_line_2");
  addVLine(5, 0, ROWS, "grid_v_line_5");
  addVLine(8, 0, ROWS, "grid_v_line_8");
  addHLine(3, 0, COLS, "grid_h_line_3");
  addHLine(7, 0, COLS, "grid_h_line_7");
  addHLine(12, 0, COLS, "grid_h_line_12");

  return group;
}
