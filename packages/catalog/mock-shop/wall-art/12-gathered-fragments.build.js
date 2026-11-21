function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.80;
  const H = 1.00;
  const PANEL_D = 0.032;
  const TOTAL_D = 0.040;
  const Z_BACK = -TOTAL_D / 2;
  const Z_FRONT = Z_BACK + PANEL_D;

  // Materials
  const woodEdgeMat = new THREE.MeshStandardMaterial({ color: 0xd4bc96, roughness: 0.75, metalness: 0.0 });
  const ochreMat = new THREE.MeshStandardMaterial({ color: 0xb87b2a, roughness: 0.65, metalness: 0.0 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd29c33, roughness: 0.55, metalness: 0.0 });
  const tanMat = new THREE.MeshStandardMaterial({ color: 0xcfa76e, roughness: 0.85, metalness: 0.0 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xeae2d0, roughness: 0.85, metalness: 0.0 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcd4330, roughness: 0.70, metalness: 0.0 });
  const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xc0652e, roughness: 0.70, metalness: 0.0 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x4c7a46, roughness: 0.75, metalness: 0.0 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x394d5c, roughness: 0.75, metalness: 0.0 });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function addPoly(pts, depth, mat, name, zPos) {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][1]);
    }
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 8
    });
    return addMesh(geom, mat, name, 0, 0, zPos);
  }

  // 1. Wooden panel backing (exposed light wood sides)
  addMesh(
    new THREE.BoxGeometry(W, H, PANEL_D),
    woodEdgeMat,
    "wooden_panel_core",
    0,
    H / 2,
    Z_BACK + PANEL_D / 2
  );

  // 2. Ochre painted base face
  addMesh(
    new THREE.BoxGeometry(W, H, 0.001),
    ochreMat,
    "ochre_painted_base",
    0,
    H / 2,
    Z_FRONT + 0.0005
  );

  // 3. Background collage patches (layer 1: z = Z_FRONT + 0.001)
  const zL1 = Z_FRONT + 0.001;
  addPoly(
    [[-0.22, 0.14], [-0.08, 0.14], [-0.08, 0.48], [-0.22, 0.48]],
    0.0012,
    blueMat,
    "bg_blue_lower_left",
    zL1
  );
  addPoly(
    [[0.02, 0.78], [0.18, 0.78], [0.18, 0.88], [0.02, 0.88]],
    0.0012,
    blueMat,
    "bg_blue_top_right",
    zL1
  );
  addPoly(
    [[0.12, 0.40], [0.27, 0.40], [0.27, 0.76], [0.12, 0.76]],
    0.0012,
    blueMat,
    "bg_blue_mid_right",
    zL1
  );
  addPoly(
    [[-0.25, 0.56], [-0.14, 0.56], [-0.14, 0.80], [-0.25, 0.80]],
    0.0012,
    greenMat,
    "bg_green_upper_left",
    zL1
  );
  addPoly(
    [[-0.04, 0.68], [0.14, 0.68], [0.14, 0.82], [-0.04, 0.82]],
    0.0012,
    greenMat,
    "bg_green_upper_center",
    zL1
  );
  addPoly(
    [[0.10, 0.16], [0.28, 0.16], [0.28, 0.34], [0.10, 0.34]],
    0.0012,
    greenMat,
    "bg_green_lower_right",
    zL1
  );

  // 4. Mid-background cream & red paper fragments (layer 2: z = Z_FRONT + 0.0022)
  const zL2 = Z_FRONT + 0.0022;
  addPoly(
    [[-0.14, 0.22], [-0.04, 0.22], [-0.05, 0.62], [-0.15, 0.62]],
    0.0012,
    creamMat,
    "mid_cream_left_center",
    zL2
  );
  addPoly(
    [[0.18, 0.28], [0.30, 0.30], [0.32, 0.84], [0.16, 0.84]],
    0.0012,
    creamMat,
    "mid_cream_right",
    zL2
  );
  addPoly(
    [[-0.21, 0.60], [-0.12, 0.60], [-0.13, 0.82], [-0.20, 0.82]],
    0.0012,
    redMat,
    "mid_red_upper_left",
    zL2
  );
  addPoly(
    [[0.08, 0.55], [0.20, 0.55], [0.18, 0.72], [0.10, 0.74]],
    0.0012,
    redMat,
    "mid_red_right",
    zL2
  );
  addPoly(
    [[-0.06, 0.30], [0.06, 0.34], [0.04, 0.44], [-0.06, 0.42]],
    0.0012,
    redMat,
    "mid_red_center",
    zL2
  );
  addPoly(
    [[-0.04, 0.15], [0.10, 0.20], [-0.02, 0.22]],
    0.0012,
    redMat,
    "mid_red_bottom",
    zL2
  );

  // 5. Prominent torn paper & geometric collage pieces (layer 3: z = Z_FRONT + 0.0034)
  const zL3 = Z_FRONT + 0.0034;
  addPoly(
    [[-0.16, 0.58], [-0.04, 0.58], [-0.06, 0.92], [-0.18, 0.91]],
    0.0014,
    tanMat,
    "collage_tan_upper_left",
    zL3
  );
  addPoly(
    [[-0.31, 0.42], [-0.19, 0.43], [-0.24, 0.64], [-0.30, 0.63]],
    0.0014,
    tanMat,
    "collage_tan_mid_left",
    zL3
  );
  addPoly(
    [[-0.12, 0.08], [-0.02, 0.07], [-0.03, 0.32], [-0.11, 0.30]],
    0.0014,
    tanMat,
    "collage_tan_bottom_center",
    zL3
  );
  addPoly(
    [[-0.11, 0.48], [0.02, 0.36], [0.16, 0.38], [0.18, 0.54], [-0.09, 0.54]],
    0.0014,
    terracottaMat,
    "collage_terracotta_center",
    zL3
  );

  // 6. Central focal triangle & layered ochre fragments (layer 4: z = Z_FRONT + 0.0048)
  const zL4 = Z_FRONT + 0.0048;
  addPoly(
    [[-0.02, 0.48], [0.15, 0.48], [0.14, 0.78], [0.10, 0.78]],
    0.0016,
    goldMat,
    "focal_gold_triangle",
    zL4
  );
  addPoly(
    [[0.02, 0.54], [0.14, 0.50], [0.12, 0.62]],
    0.0018,
    creamMat,
    "focal_triangle_cream_accent",
    zL4 + 0.0005
  );
  addPoly(
    [[0.15, 0.24], [0.24, 0.22], [0.23, 0.48], [0.19, 0.48]],
    0.0016,
    ochreMat,
    "collage_ochre_lower_right",
    zL4
  );

  // 7. Foreground impasto paint strokes (layer 5: z = Z_FRONT + 0.0064)
  const zL5 = Z_FRONT + 0.0064;
  addPoly(
    [[-0.18, 0.56], [-0.04, 0.68], [-0.02, 0.74], [-0.17, 0.63]],
    0.0016,
    goldMat,
    "impasto_stroke_upper_left",
    zL5
  );
  addPoly(
    [[-0.01, 0.78], [0.22, 0.70], [0.25, 0.76], [0.01, 0.85]],
    0.0016,
    ochreMat,
    "impasto_stroke_top_right",
    zL5
  );
  addPoly(
    [[-0.08, 0.42], [0.02, 0.54], [0.05, 0.51], [-0.05, 0.39]],
    0.0016,
    ochreMat,
    "impasto_stroke_center_diag",
    zL5
  );
  addPoly(
    [[0.08, 0.12], [0.30, 0.10], [0.30, 0.16], [0.08, 0.18]],
    0.0016,
    terracottaMat,
    "impasto_stroke_bottom_right",
    zL5
  );

  return group;
}
