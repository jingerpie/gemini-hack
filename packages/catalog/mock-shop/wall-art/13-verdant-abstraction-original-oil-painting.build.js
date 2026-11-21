function build(THREE) {
  const group = new THREE.Group();

  const W = 0.60;
  const H = 0.75;
  const D = 0.038;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xe6dec8,
    roughness: 0.88,
    metalness: 0.0
  });
  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xc99636,
    roughness: 0.65,
    metalness: 0.0
  });
  const slateBlueMat = new THREE.MeshStandardMaterial({
    color: 0x5d7a89,
    roughness: 0.72,
    metalness: 0.0
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xa64924,
    roughness: 0.62,
    metalness: 0.0
  });
  const forestGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2f6b47,
    roughness: 0.60,
    metalness: 0.0
  });
  const sageGreenMat = new THREE.MeshStandardMaterial({
    color: 0x568265,
    roughness: 0.70,
    metalness: 0.0
  });
  const creamImpastoMat = new THREE.MeshStandardMaterial({
    color: 0xf2ecda,
    roughness: 0.55,
    metalness: 0.0
  });

  function addPart(name, geo, mat, x, y, z, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Main stretched canvas
  addPart(
    "canvas_body",
    new THREE.BoxGeometry(W, H, D),
    canvasMat,
    0,
    H / 2,
    0
  );

  const frontZ = D / 2;

  // Background color blocks (layered oil paint)
  addPart(
    "ochre_top_left",
    new THREE.BoxGeometry(W * 0.48, H * 0.36, 0.003),
    ochreMat,
    -W * 0.25,
    H * 0.81,
    frontZ + 0.001
  );

  addPart(
    "ochre_mid_left",
    new THREE.BoxGeometry(W * 0.34, H * 0.28, 0.003),
    ochreMat,
    -W * 0.28,
    H * 0.42,
    frontZ + 0.001
  );

  addPart(
    "slate_blue_left",
    new THREE.BoxGeometry(W * 0.30, H * 0.18, 0.0035),
    slateBlueMat,
    -W * 0.33,
    H * 0.63,
    frontZ + 0.0015,
    0.08
  );

  addPart(
    "slate_blue_right",
    new THREE.BoxGeometry(W * 0.44, H * 0.20, 0.0035),
    slateBlueMat,
    W * 0.26,
    H * 0.68,
    frontZ + 0.0015,
    -0.05
  );

  addPart(
    "slate_blue_bottom",
    new THREE.BoxGeometry(W * 0.16, H * 0.16, 0.003),
    slateBlueMat,
    -W * 0.05,
    H * 0.09,
    frontZ + 0.001
  );

  addPart(
    "terracotta_right",
    new THREE.BoxGeometry(W * 0.34, H * 0.18, 0.004),
    terracottaMat,
    W * 0.26,
    H * 0.50,
    frontZ + 0.002,
    0.12
  );

  addPart(
    "terracotta_bottom_left",
    new THREE.BoxGeometry(W * 0.38, H * 0.16, 0.0035),
    terracottaMat,
    -W * 0.30,
    H * 0.09,
    frontZ + 0.0015
  );

  addPart(
    "sage_bottom_right",
    new THREE.BoxGeometry(W * 0.24, H * 0.20, 0.003),
    sageGreenMat,
    W * 0.37,
    H * 0.11,
    frontZ + 0.001
  );

  // Central botanical stems & leaves
  addPart(
    "forest_green_stem",
    new THREE.BoxGeometry(W * 0.045, H * 0.42, 0.005),
    forestGreenMat,
    W * 0.02,
    H * 0.22,
    frontZ + 0.0025,
    -0.06
  );

  addPart(
    "forest_green_leaf_left_upper",
    new THREE.BoxGeometry(W * 0.18, H * 0.09, 0.006),
    forestGreenMat,
    -W * 0.30,
    H * 0.49,
    frontZ + 0.003,
    -0.35
  );

  addPart(
    "forest_green_leaf_center",
    new THREE.BoxGeometry(W * 0.15, H * 0.12, 0.006),
    forestGreenMat,
    -W * 0.08,
    H * 0.31,
    frontZ + 0.003,
    0.25
  );

  addPart(
    "forest_green_leaf_right",
    new THREE.BoxGeometry(W * 0.13, H * 0.12, 0.006),
    sageGreenMat,
    W * 0.09,
    H * 0.34,
    frontZ + 0.003,
    -0.30
  );

  addPart(
    "forest_green_leaf_lower_left",
    new THREE.BoxGeometry(W * 0.16, H * 0.13, 0.0055),
    forestGreenMat,
    -W * 0.36,
    H * 0.21,
    frontZ + 0.0028,
    0.10
  );

  // Floral & impasto highlights
  addPart(
    "cream_flower_top",
    new THREE.BoxGeometry(W * 0.14, H * 0.14, 0.0065),
    creamImpastoMat,
    -W * 0.10,
    H * 0.72,
    frontZ + 0.0035,
    0.15
  );

  addPart(
    "ochre_flower_top",
    new THREE.BoxGeometry(W * 0.14, H * 0.13, 0.006),
    ochreMat,
    W * 0.03,
    H * 0.75,
    frontZ + 0.003,
    -0.12
  );

  addPart(
    "cream_flower_mid_left",
    new THREE.BoxGeometry(W * 0.13, H * 0.09, 0.0065),
    creamImpastoMat,
    -W * 0.16,
    H * 0.41,
    frontZ + 0.0035,
    -0.25
  );

  addPart(
    "cream_flower_mid_right",
    new THREE.BoxGeometry(W * 0.15, H * 0.13, 0.0065),
    creamImpastoMat,
    W * 0.27,
    H * 0.38,
    frontZ + 0.0035,
    0.30
  );

  addPart(
    "terracotta_petal_upper_right",
    new THREE.BoxGeometry(W * 0.12, H * 0.08, 0.006),
    terracottaMat,
    W * 0.18,
    H * 0.70,
    frontZ + 0.003,
    -0.20
  );

  addPart(
    "terracotta_petal_lower_center",
    new THREE.BoxGeometry(W * 0.15, H * 0.09, 0.006),
    terracottaMat,
    -W * 0.13,
    H * 0.16,
    frontZ + 0.003,
    0.18
  );

  addPart(
    "ochre_impasto_bottom_right",
    new THREE.BoxGeometry(W * 0.12, H * 0.10, 0.0055),
    ochreMat,
    W * 0.21,
    H * 0.07,
    frontZ + 0.0028,
    -0.10
  );

  return group;
}
