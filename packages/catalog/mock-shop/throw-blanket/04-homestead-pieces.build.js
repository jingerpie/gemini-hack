function build(THREE) {
  const group = new THREE.Group();

  const W = 1.40;
  const D = 1.76;
  const H = 0.018;
  const CORNER_R = 0.025;
  const BINDING_W = 0.024;
  const GRID_COLS = 3;
  const GRID_ROWS = 3;
  const CELL_W = 0.36;
  const CELL_D = 0.38;
  const SASH_W = 0.07;
  const STAR_OUTER_R = 0.165;
  const STAR_MID_R = 0.082;
  const INNER_STAR_OUTER_R = 0.105;
  const INNER_STAR_MID_R = 0.052;
  const CORNERSTONE_SIZE = 0.048;

  const matCream = new THREE.MeshStandardMaterial({
    color: 0xd6be9c,
    roughness: 0.92,
    metalness: 0.0
  });
  const matBinding = new THREE.MeshStandardMaterial({
    color: 0xa88a64,
    roughness: 0.88,
    metalness: 0.0
  });
  const matBlue = new THREE.MeshStandardMaterial({
    color: 0x294a5e,
    roughness: 0.9,
    metalness: 0.0
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xc69b63,
    roughness: 0.9,
    metalness: 0.0
  });
  const matOlive = new THREE.MeshStandardMaterial({
    color: 0x4c5827,
    roughness: 0.9,
    metalness: 0.0
  });
  const matRust = new THREE.MeshStandardMaterial({
    color: 0x7a3e1d,
    roughness: 0.9,
    metalness: 0.0
  });
  const matDarkBrown = new THREE.MeshStandardMaterial({
    color: 0x332419,
    roughness: 0.92,
    metalness: 0.0
  });

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  function createStarShape(outerR, innerR, points) {
    const shape = new THREE.Shape();
    const total = points * 2;
    for (let i = 0; i < total; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
  }

  // 1. Quilt Base
  const baseBevel = 0.005;
  const baseShape = createRoundedRectShape(W - baseBevel * 2, D - baseBevel * 2, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: H - baseBevel * 2,
    bevelEnabled: true,
    bevelThickness: baseBevel,
    bevelSize: baseBevel,
    bevelSegments: 4,
    curveSegments: 8
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, matCream);
  baseMesh.position.y = baseBevel;
  baseMesh.name = 'quilt_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Quilt Binding Border
  const outerBindShape = createRoundedRectShape(W, D, CORNER_R);
  const innerBindHole = createRoundedRectShape(W - BINDING_W * 2, D - BINDING_W * 2, Math.max(0.005, CORNER_R - BINDING_W * 0.5));
  outerBindShape.holes.push(innerBindHole);
  const bindGeo = new THREE.ExtrudeGeometry(outerBindShape, {
    depth: H * 0.6,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 8
  });
  bindGeo.rotateX(-Math.PI / 2);
  const bindMesh = new THREE.Mesh(bindGeo, matBinding);
  bindMesh.position.y = H * 0.45;
  bindMesh.name = 'quilt_binding';
  bindMesh.castShadow = true;
  bindMesh.receiveShadow = true;
  group.add(bindMesh);

  // Shared star geometries
  const outerStarShape = createStarShape(STAR_OUTER_R, STAR_MID_R, 8);
  const outerStarGeo = new THREE.ExtrudeGeometry(outerStarShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2
  });
  outerStarGeo.rotateX(-Math.PI / 2);

  const innerStarShape = createStarShape(INNER_STAR_OUTER_R, INNER_STAR_MID_R, 8);
  const innerStarGeo = new THREE.ExtrudeGeometry(innerStarShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2
  });
  innerStarGeo.rotateX(-Math.PI / 2);

  const stepX = CELL_W + SASH_W;
  const stepZ = CELL_D + SASH_W;

  // 3. 3x3 Grid of 8-Pointed Stars
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cx = (col - 1) * stepX;
      const cz = (row - 1) * stepZ;
      const isBlueGold = (row + col) % 2 === 0;

      const outerStar = new THREE.Mesh(outerStarGeo, isBlueGold ? matBlue : matOlive);
      outerStar.position.set(cx, H - 0.001, cz);
      outerStar.name = `star_outer_${row}_${col}`;
      outerStar.castShadow = true;
      outerStar.receiveShadow = true;
      group.add(outerStar);

      const innerStar = new THREE.Mesh(innerStarGeo, isBlueGold ? matGold : matRust);
      innerStar.position.set(cx, H + 0.001, cz);
      innerStar.name = `star_inner_${row}_${col}`;
      innerStar.castShadow = true;
      innerStar.receiveShadow = true;
      group.add(innerStar);
    }
  }

  // 4. 4 Dark Brown Cornerstones
  const csShape = createRoundedRectShape(CORNERSTONE_SIZE, CORNERSTONE_SIZE, 0.004);
  const csGeo = new THREE.ExtrudeGeometry(csShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2
  });
  csGeo.rotateX(-Math.PI / 2);

  let csIdx = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const csX = (c - 0.5) * stepX;
      const csZ = (r - 0.5) * stepZ;
      const csMesh = new THREE.Mesh(csGeo, matDarkBrown);
      csMesh.position.set(csX, H - 0.001, csZ);
      csMesh.name = `cornerstone_${csIdx++}`;
      csMesh.castShadow = true;
      csMesh.receiveShadow = true;
      group.add(csMesh);
    }
  }

  return group;
}
