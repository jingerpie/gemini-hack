function build(THREE) {
  const group = new THREE.Group();

  const W = 1.22;
  const D = 1.83;
  const H = 0.01;
  const BORDER_W = 0.038;
  const INNER_BORDER_W = 0.018;
  const LAYER_H = 0.0012;

  const matSaffron = new THREE.MeshStandardMaterial({
    color: 0xe0b642,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matBorder = new THREE.MeshStandardMaterial({
    color: 0xc5982c,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matTeal = new THREE.MeshStandardMaterial({
    color: 0x2c7a78,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matRose = new THREE.MeshStandardMaterial({
    color: 0xc46072,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matRed = new THREE.MeshStandardMaterial({
    color: 0x9e3646,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matGrey = new THREE.MeshStandardMaterial({
    color: 0xc9c4bb,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Base rug body (bottom at y = 0)
  addMesh(
    new THREE.BoxGeometry(W, H, D),
    matSaffron,
    "rug_base",
    0,
    H * 0.5,
    0
  );

  // Bound outer edge borders
  const borderY = H + LAYER_H * 0.5;
  addMesh(
    new THREE.BoxGeometry(W, LAYER_H, BORDER_W),
    matBorder,
    "border_north",
    0,
    borderY,
    -D * 0.5 + BORDER_W * 0.5
  );
  addMesh(
    new THREE.BoxGeometry(W, LAYER_H, BORDER_W),
    matBorder,
    "border_south",
    0,
    borderY,
    D * 0.5 - BORDER_W * 0.5
  );
  addMesh(
    new THREE.BoxGeometry(BORDER_W, LAYER_H, D - BORDER_W * 2),
    matBorder,
    "border_west",
    -W * 0.5 + BORDER_W * 0.5,
    borderY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(BORDER_W, LAYER_H, D - BORDER_W * 2),
    matBorder,
    "border_east",
    W * 0.5 - BORDER_W * 0.5,
    borderY,
    0
  );

  // Decorative inner border band
  const innerInset = BORDER_W + 0.02;
  const innerW = W - innerInset * 2;
  const innerD = D - innerInset * 2;
  addMesh(
    new THREE.BoxGeometry(innerW, LAYER_H, INNER_BORDER_W),
    matGrey,
    "inner_border_north",
    0,
    borderY,
    -D * 0.5 + innerInset + INNER_BORDER_W * 0.5
  );
  addMesh(
    new THREE.BoxGeometry(innerW, LAYER_H, INNER_BORDER_W),
    matGrey,
    "inner_border_south",
    0,
    borderY,
    D * 0.5 - innerInset - INNER_BORDER_W * 0.5
  );
  addMesh(
    new THREE.BoxGeometry(INNER_BORDER_W, LAYER_H, innerD - INNER_BORDER_W * 2),
    matGrey,
    "inner_border_west",
    -W * 0.5 + innerInset + INNER_BORDER_W * 0.5,
    borderY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(INNER_BORDER_W, LAYER_H, innerD - INNER_BORDER_W * 2),
    matGrey,
    "inner_border_east",
    W * 0.5 - innerInset - INNER_BORDER_W * 0.5,
    borderY,
    0
  );

  // Central medallion
  const medY1 = H + LAYER_H * 0.4;
  const medY2 = H + LAYER_H * 0.8;
  const medY3 = H + LAYER_H * 1.2;
  const medY4 = H + LAYER_H * 1.6;

  const medOuterGeom = new THREE.CylinderGeometry(0.19, 0.19, LAYER_H, 16);
  const medOuter = addMesh(
    medOuterGeom,
    matTeal,
    "medallion_teal_outer",
    0,
    medY1,
    0
  );
  medOuter.scale.set(1.3, 1, 0.92);

  const medInnerGeom = new THREE.CylinderGeometry(0.125, 0.125, LAYER_H, 12);
  const medInner = addMesh(
    medInnerGeom,
    matRose,
    "medallion_rose_inner",
    0,
    medY2,
    0
  );
  medInner.scale.set(1.2, 1, 0.85);

  const medRedGeom = new THREE.CylinderGeometry(0.068, 0.068, LAYER_H, 8);
  const medRed = addMesh(
    medRedGeom,
    matRed,
    "medallion_red_center",
    0,
    medY3,
    0
  );
  medRed.scale.set(1.15, 1, 0.9);

  addMesh(
    new THREE.CylinderGeometry(0.028, 0.028, LAYER_H, 12),
    matGrey,
    "medallion_grey_center",
    0,
    medY4,
    0
  );

  // Medallion cardinal petals
  const petalGeom = new THREE.CylinderGeometry(0.052, 0.052, LAYER_H, 8);
  addMesh(petalGeom, matGrey, "medallion_petal_north", 0, medY2, -0.185);
  addMesh(petalGeom, matGrey, "medallion_petal_south", 0, medY2, 0.185);
  addMesh(petalGeom, matRose, "medallion_petal_west", -0.25, medY2, 0);
  addMesh(petalGeom, matRose, "medallion_petal_east", 0.25, medY2, 0);

  // Corner motifs
  const cornerTealGeom = new THREE.CylinderGeometry(0.155, 0.155, LAYER_H, 4);
  const cornerRoseGeom = new THREE.CylinderGeometry(0.085, 0.085, LAYER_H, 8);
  const cornerRedGeom = new THREE.CylinderGeometry(0.04, 0.04, LAYER_H, 8);
  const cx = W * 0.5 - innerInset - INNER_BORDER_W - 0.105;
  const cz = D * 0.5 - innerInset - INNER_BORDER_W - 0.115;

  const corners = [
    ["nw", -cx, -cz],
    ["ne", cx, -cz],
    ["sw", -cx, cz],
    ["se", cx, cz],
  ];

  for (const [label, x, z] of corners) {
    addMesh(
      cornerTealGeom,
      matTeal,
      `corner_teal_${label}`,
      x,
      medY1,
      z,
      0,
      Math.PI * 0.25,
      0
    );
    addMesh(
      cornerRoseGeom,
      matRose,
      `corner_rose_${label}`,
      x,
      medY2,
      z
    );
    addMesh(
      cornerRedGeom,
      matRed,
      `corner_red_${label}`,
      x,
      medY3,
      z
    );
  }

  // Secondary floral clusters in quadrants
  const floralGeom = new THREE.CylinderGeometry(0.072, 0.072, LAYER_H, 8);
  const fx = W * 0.24;
  const fz = D * 0.22;

  addMesh(floralGeom, matRose, "floral_rose_nw", -fx, medY1, -fz);
  addMesh(floralGeom, matRose, "floral_rose_ne", fx, medY1, -fz);
  addMesh(floralGeom, matRose, "floral_rose_sw", -fx, medY1, fz);
  addMesh(floralGeom, matRose, "floral_rose_se", fx, medY1, fz);

  // Lattice diamond accents along axes
  const latticeGeom = new THREE.BoxGeometry(0.11, LAYER_H, 0.11);
  addMesh(
    latticeGeom,
    matGrey,
    "lattice_diamond_north",
    0,
    medY1,
    -D * 0.27,
    0,
    Math.PI * 0.25,
    0
  );
  addMesh(
    latticeGeom,
    matGrey,
    "lattice_diamond_south",
    0,
    medY1,
    D * 0.27,
    0,
    Math.PI * 0.25,
    0
  );
  addMesh(
    latticeGeom,
    matGrey,
    "lattice_diamond_west",
    -W * 0.31,
    medY1,
    0,
    0,
    Math.PI * 0.25,
    0
  );
  addMesh(
    latticeGeom,
    matGrey,
    "lattice_diamond_east",
    W * 0.31,
    medY1,
    0,
    0,
    Math.PI * 0.25,
    0
  );

  return group;
}
