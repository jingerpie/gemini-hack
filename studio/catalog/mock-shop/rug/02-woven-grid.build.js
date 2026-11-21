function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters): 1.2m x 1.8m area rug (120 x 180 cm)
  const W = 1.2;
  const D = 1.8;
  const H = 0.012;
  const EDGE_W = 0.018;
  const EDGE_H = 0.014;
  const LINE_W = 0.022;
  const LINE_H = 0.002;
  const COLS = 6;
  const ROWS = 9;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xe8dec8,
    roughness: 0.95,
    metalness: 0.0,
  });

  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xdfd3ba,
    roughness: 0.95,
    metalness: 0.0,
  });

  const gridMat = new THREE.MeshStandardMaterial({
    color: 0x665e38,
    roughness: 0.92,
    metalness: 0.0,
  });

  // Base rug body
  const baseGeo = new THREE.BoxGeometry(W - EDGE_W * 2, H, D - EDGE_W * 2);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.name = 'rug_base';
  baseMesh.position.set(0, H / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Woven selvedge / hem edges
  const sideEdgeGeo = new THREE.BoxGeometry(EDGE_W, EDGE_H, D);
  const leftEdge = new THREE.Mesh(sideEdgeGeo, edgeMat);
  leftEdge.name = 'rug_edge_left';
  leftEdge.position.set(-W / 2 + EDGE_W / 2, EDGE_H / 2, 0);
  leftEdge.castShadow = true;
  leftEdge.receiveShadow = true;
  group.add(leftEdge);

  const rightEdge = new THREE.Mesh(sideEdgeGeo, edgeMat);
  rightEdge.name = 'rug_edge_right';
  rightEdge.position.set(W / 2 - EDGE_W / 2, EDGE_H / 2, 0);
  rightEdge.castShadow = true;
  rightEdge.receiveShadow = true;
  group.add(rightEdge);

  const endEdgeGeo = new THREE.BoxGeometry(W - EDGE_W * 2, EDGE_H, EDGE_W);
  const frontEdge = new THREE.Mesh(endEdgeGeo, edgeMat);
  frontEdge.name = 'rug_edge_front';
  frontEdge.position.set(0, EDGE_H / 2, D / 2 - EDGE_W / 2);
  frontEdge.castShadow = true;
  frontEdge.receiveShadow = true;
  group.add(frontEdge);

  const backEdge = new THREE.Mesh(endEdgeGeo, edgeMat);
  backEdge.name = 'rug_edge_back';
  backEdge.position.set(0, EDGE_H / 2, -D / 2 + EDGE_W / 2);
  backEdge.castShadow = true;
  backEdge.receiveShadow = true;
  group.add(backEdge);

  // Vertical grid lines (running along Z)
  const vLineGeo = new THREE.BoxGeometry(LINE_W, LINE_H, D - EDGE_W * 2);
  const colStep = W / COLS;
  for (let i = 1; i < COLS; i++) {
    const x = -W / 2 + i * colStep;
    const vLine = new THREE.Mesh(vLineGeo, gridMat);
    vLine.name = `grid_line_vertical_${i}`;
    vLine.position.set(x, H, 0);
    vLine.castShadow = true;
    vLine.receiveShadow = true;
    group.add(vLine);
  }

  // Horizontal grid lines (running along X)
  const hLineGeo = new THREE.BoxGeometry(W - EDGE_W * 2, LINE_H, LINE_W);
  const rowStep = D / ROWS;
  for (let j = 1; j < ROWS; j++) {
    const z = -D / 2 + j * rowStep;
    const hLine = new THREE.Mesh(hLineGeo, gridMat);
    hLine.name = `grid_line_horizontal_${j}`;
    hLine.position.set(0, H, z);
    hLine.castShadow = true;
    hLine.receiveShadow = true;
    group.add(hLine);
  }

  return group;
}
