function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;
  const H = 0.075;
  const D = 0.56;
  const CORNER_R = 0.04;
  const BASE_H = 0.042;
  const BEVEL = 0.015;

  // Materials
  const matOatmeal = new THREE.MeshStandardMaterial({
    color: 0xeae2d3,
    roughness: 0.92,
    metalness: 0.0
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0x9c522b,
    roughness: 0.9,
    metalness: 0.0
  });
  const matSage = new THREE.MeshStandardMaterial({
    color: 0x778260,
    roughness: 0.9,
    metalness: 0.0
  });
  const matTaupe = new THREE.MeshStandardMaterial({
    color: 0x7c736b,
    roughness: 0.9,
    metalness: 0.0
  });

  const palette = [matOatmeal, matTerracotta, matSage, matTaupe];

  // Base folded blanket body (rounded rectangle with bevel)
  const shape = new THREE.Shape();
  const hw = W / 2 - BEVEL;
  const hd = D / 2 - BEVEL;
  const r = CORNER_R;

  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const baseGeo = new THREE.ExtrudeGeometry(shape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8
  });
  baseGeo.rotateX(-Math.PI / 2);
  baseGeo.translate(0, BEVEL, 0);

  const baseMesh = new THREE.Mesh(baseGeo, matOatmeal);
  baseMesh.name = 'folded_blanket_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Basketweave chunky knit blocks on top surface (5 columns x 6 rows = 30 meshes)
  const COLS = 5;
  const ROWS = 6;
  const GRID_W = W - 0.05;
  const GRID_D = D - 0.05;
  const CELL_W = GRID_W / COLS;
  const CELL_D = GRID_D / ROWS;

  const KNIT_R = 0.021;
  const KNIT_LEN = 0.044;
  const knitGeo = new THREE.CapsuleGeometry(KNIT_R, KNIT_LEN, 4, 10);

  // Deterministic color pattern matching the photo's oatmeal, terracotta, sage, and taupe weave
  const colorPattern = [
    [0, 1, 2, 0, 1],
    [1, 2, 0, 2, 0],
    [0, 2, 1, 1, 3],
    [1, 0, 2, 0, 2],
    [3, 1, 0, 1, 1],
    [0, 1, 3, 2, 0]
  ];

  const topY = BASE_H + BEVEL * 2 - KNIT_R * 0.45;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const matIndex = colorPattern[row][col];
      const mesh = new THREE.Mesh(knitGeo, palette[matIndex]);

      const x = -GRID_W / 2 + CELL_W * (col + 0.5);
      const z = -GRID_D / 2 + CELL_D * (row + 0.5);

      mesh.position.set(x, topY, z);

      // Alternate horizontal and vertical orientation for basketweave look
      if ((row + col) % 2 === 0) {
        mesh.rotation.z = Math.PI / 2;
      } else {
        mesh.rotation.x = Math.PI / 2;
      }

      mesh.name = `knit_weave_block_${row}_${col}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }

  return group;
}
