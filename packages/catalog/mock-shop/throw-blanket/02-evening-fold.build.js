function build(THREE) {
  const group = new THREE.Group();

  // Named dimensions (meters)
  const W = 1.20;
  const D = 1.42;
  const H = 0.018;
  const CORNER_R = 0.035;
  const BEVEL = 0.005;
  const BORDER_W = 0.095;
  const COLS = 5;
  const ROWS = 6;
  const RIDGE_R = 0.0045;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf0ebe1,
    roughness: 0.92,
    metalness: 0.0,
  });

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd2,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Helper to create a rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  // Main blanket body
  const bodyW = W - BEVEL * 2;
  const bodyD = D - BEVEL * 2;
  const bodyShape = createRoundedRectShape(bodyW, bodyD, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, BEVEL, 0);

  const bodyMesh = new THREE.Mesh(bodyGeo, creamMat);
  bodyMesh.name = 'blanket_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Inner grid bounds
  const gridW = W - BORDER_W * 2;
  const gridD = D - BORDER_W * 2;
  const cellW = gridW / COLS;
  const cellD = gridD / ROWS;
  const topY = H - RIDGE_R * 0.35;

  // Vertical grid ridges (including left & right border seams)
  for (let c = 0; c <= COLS; c++) {
    const x = -gridW / 2 + c * cellW;
    const ridgeGeo = new THREE.CapsuleGeometry(RIDGE_R, gridD, 4, 10);
    ridgeGeo.rotateX(Math.PI / 2);
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(x, topY, 0);
    ridge.name = `grid_ridge_vertical_${c}`;
    ridge.castShadow = true;
    ridge.receiveShadow = true;
    group.add(ridge);
  }

  // Horizontal grid ridges (including top & bottom border seams)
  for (let r = 0; r <= ROWS; r++) {
    const z = -gridD / 2 + r * cellD;
    const ridgeGeo = new THREE.CapsuleGeometry(RIDGE_R, gridW, 4, 10);
    ridgeGeo.rotateZ(Math.PI / 2);
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(0, topY, z);
    ridge.name = `grid_ridge_horizontal_${r}`;
    ridge.castShadow = true;
    ridge.receiveShadow = true;
    group.add(ridge);
  }

  // Outer crocheted border trim (4 edges)
  const trimR = 0.0055;
  const trimOffsetX = W / 2 - 0.018;
  const trimOffsetZ = D / 2 - 0.018;
  const trimY = H * 0.65;

  const sideTrimGeo = new THREE.CapsuleGeometry(trimR, D - CORNER_R * 2, 4, 10);
  sideTrimGeo.rotateX(Math.PI / 2);

  const leftTrim = new THREE.Mesh(sideTrimGeo, creamMat);
  leftTrim.position.set(-trimOffsetX, trimY, 0);
  leftTrim.name = 'border_trim_left';
  leftTrim.castShadow = true;
  leftTrim.receiveShadow = true;
  group.add(leftTrim);

  const rightTrim = new THREE.Mesh(sideTrimGeo, creamMat);
  rightTrim.position.set(trimOffsetX, trimY, 0);
  rightTrim.name = 'border_trim_right';
  rightTrim.castShadow = true;
  rightTrim.receiveShadow = true;
  group.add(rightTrim);

  const endTrimGeo = new THREE.CapsuleGeometry(trimR, W - CORNER_R * 2, 4, 10);
  endTrimGeo.rotateZ(Math.PI / 2);

  const frontTrim = new THREE.Mesh(endTrimGeo, creamMat);
  frontTrim.position.set(0, trimY, trimOffsetZ);
  frontTrim.name = 'border_trim_front';
  frontTrim.castShadow = true;
  frontTrim.receiveShadow = true;
  group.add(frontTrim);

  const backTrim = new THREE.Mesh(endTrimGeo, creamMat);
  backTrim.position.set(0, trimY, -trimOffsetZ);
  backTrim.name = 'border_trim_back';
  backTrim.castShadow = true;
  backTrim.receiveShadow = true;
  group.add(backTrim);

  return group;
}
