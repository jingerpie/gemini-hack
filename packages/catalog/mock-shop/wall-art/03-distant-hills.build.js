function build(THREE) {
  const group = new THREE.Group();

  // Overall dimensions (8 x 10 in -> 20 cm x 25 cm)
  const W = 0.20;
  const H = 0.25;
  const PAPER_D = 0.003;
  const LAYER_T = 0.00018;

  // Artwork area bounds
  const ART_X0 = -0.084;
  const ART_X1 = 0.084;
  const ART_Y0 = 0.020;

  // Materials
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.92,
    metalness: 0.0,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe4,
    roughness: 0.85,
    metalness: 0.0,
  });
  const peachMat = new THREE.MeshStandardMaterial({
    color: 0xf0cfb0,
    roughness: 0.85,
    metalness: 0.0,
  });
  const darkPeachMat = new THREE.MeshStandardMaterial({
    color: 0xe3b994,
    roughness: 0.85,
    metalness: 0.0,
  });
  const sageMat = new THREE.MeshStandardMaterial({
    color: 0xb7bfa8,
    roughness: 0.85,
    metalness: 0.0,
  });
  const darkSageMat = new THREE.MeshStandardMaterial({
    color: 0x9ea892,
    roughness: 0.85,
    metalness: 0.0,
  });
  const mauveMat = new THREE.MeshStandardMaterial({
    color: 0xa58996,
    roughness: 0.85,
    metalness: 0.0,
  });
  const darkMauveMat = new THREE.MeshStandardMaterial({
    color: 0x8c6f7d,
    roughness: 0.85,
    metalness: 0.0,
  });
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c38,
    roughness: 0.75,
    metalness: 0.0,
  });

  // Helper to create an extruded flat artwork layer
  function addLayer(name, points, mat, layerIdx) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: LAYER_T,
      bevelEnabled: false,
      curveSegments: 12,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.z = PAPER_D / 2 + layerIdx * LAYER_T;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create a dark contour line using TubeGeometry
  function addContourLine(name, pts2d, radius, layerIdx) {
    const z = PAPER_D / 2 + layerIdx * LAYER_T + radius * 0.5;
    const pts3d = pts2d.map((p) => new THREE.Vector3(p[0], p[1], z));
    const curve = new THREE.CatmullRomCurve3(pts3d);
    const geo = new THREE.TubeGeometry(curve, 24, radius, 6, false);
    const mesh = new THREE.Mesh(geo, lineMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base paper sheet
  const paperGeo = new THREE.BoxGeometry(W, H, PAPER_D);
  const paperMesh = new THREE.Mesh(paperGeo, paperMat);
  paperMesh.name = "paper_sheet";
  paperMesh.position.set(0, H / 2, 0);
  paperMesh.castShadow = true;
  paperMesh.receiveShadow = true;
  group.add(paperMesh);

  // 2. Distant cream hills (background)
  addLayer(
    "distant_hills_cream",
    [
      [ART_X0, ART_Y0],
      [ART_X1, ART_Y0],
      [ART_X1, 0.168],
      [0.060, 0.162],
      [0.025, 0.166],
      [-0.010, 0.155],
      [-0.050, 0.160],
      [ART_X0, 0.156],
    ],
    creamMat,
    0
  );

  // 3. Distant peach peak (upper right)
  addLayer(
    "distant_hill_peach_right",
    [
      [-0.020, 0.120],
      [ART_X1, 0.120],
      [ART_X1, 0.160],
      [0.055, 0.160],
      [0.028, 0.163],
      [0.000, 0.148],
    ],
    peachMat,
    1
  );

  // 4. Midground sage hill (center-left)
  addLayer(
    "mid_hill_sage_center",
    [
      [ART_X0, 0.095],
      [0.050, 0.095],
      [0.030, 0.130],
      [-0.012, 0.145],
      [-0.045, 0.140],
      [ART_X0, 0.142],
    ],
    sageMat,
    2
  );

  // 5. Midground peach slope (right)
  addLayer(
    "mid_hill_peach_right",
    [
      [-0.015, 0.085],
      [ART_X1, 0.085],
      [ART_X1, 0.156],
      [0.060, 0.148],
      [0.030, 0.128],
      [-0.005, 0.115],
    ],
    darkPeachMat,
    3
  );

  // 6. Midground sage slope (right)
  addLayer(
    "mid_hill_sage_right",
    [
      [0.005, 0.078],
      [ART_X1, 0.078],
      [ART_X1, 0.138],
      [0.065, 0.125],
      [0.035, 0.105],
      [0.010, 0.095],
    ],
    darkSageMat,
    4
  );

  // 7. Midground mauve hill (left)
  addLayer(
    "mid_hill_mauve_left",
    [
      [ART_X0, 0.075],
      [0.020, 0.075],
      [0.015, 0.098],
      [-0.018, 0.115],
      [-0.055, 0.135],
      [ART_X0, 0.140],
    ],
    mauveMat,
    5
  );

  // 8. Lower peach slope (left)
  addLayer(
    "lower_hill_peach_left",
    [
      [ART_X0, 0.055],
      [0.015, 0.055],
      [0.012, 0.076],
      [-0.025, 0.095],
      [-0.060, 0.105],
      [ART_X0, 0.110],
    ],
    peachMat,
    6
  );

  // 9. Lower sage accent (left)
  addLayer(
    "lower_hill_sage_left",
    [
      [ART_X0, 0.045],
      [-0.010, 0.045],
      [-0.022, 0.068],
      [-0.055, 0.085],
      [ART_X0, 0.095],
    ],
    sageMat,
    7
  );

  // 10. Foreground mauve (left of path)
  addLayer(
    "foreground_mauve_left",
    [
      [ART_X0, ART_Y0],
      [-0.065, ART_Y0],
      [-0.025, 0.042],
      [-0.008, 0.055],
      [-0.028, 0.068],
      [-0.055, 0.080],
      [ART_X0, 0.088],
    ],
    darkMauveMat,
    8
  );

  // 11. Foreground mauve (right of path)
  addLayer(
    "foreground_mauve_right",
    [
      [-0.055, ART_Y0],
      [ART_X1, ART_Y0],
      [ART_X1, 0.090],
      [0.045, 0.085],
      [0.015, 0.076],
      [-0.005, 0.062],
      [-0.025, 0.040],
    ],
    mauveMat,
    9
  );

  // 12. Foreground sage accent strip (right)
  addLayer(
    "foreground_sage_accent",
    [
      [0.010, ART_Y0],
      [0.035, ART_Y0],
      [0.060, 0.045],
      [ART_X1, 0.065],
      [ART_X1, 0.055],
      [0.048, 0.035],
    ],
    sageMat,
    10
  );

  // 13. Winding cream path / river
  addLayer(
    "winding_path",
    [
      [ART_X0, 0.022],
      [-0.078, ART_Y0],
      [-0.056, ART_Y0],
      [-0.030, 0.035],
      [0.008, 0.052],
      [0.010, 0.062],
      [-0.018, 0.072],
      [-0.005, 0.080],
      [0.012, 0.088],
      [0.005, 0.088],
      [-0.015, 0.078],
      [-0.028, 0.070],
      [-0.004, 0.060],
      [-0.006, 0.052],
      [-0.045, 0.038],
      [ART_X0, 0.028],
    ],
    creamMat,
    11
  );

  // 14-20. Contour lines for crisp illustration look
  const lineR = 0.00045;
  addContourLine(
    "contour_distant_ridge",
    [
      [ART_X0, 0.156],
      [-0.050, 0.160],
      [-0.010, 0.155],
      [0.025, 0.166],
      [0.060, 0.162],
      [ART_X1, 0.168],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_mid_sage",
    [
      [ART_X0, 0.142],
      [-0.045, 0.140],
      [-0.012, 0.145],
      [0.030, 0.130],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_mid_mauve",
    [
      [ART_X0, 0.140],
      [-0.055, 0.135],
      [-0.018, 0.115],
      [0.015, 0.098],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_right_slope",
    [
      [0.005, 0.092],
      [0.035, 0.110],
      [0.065, 0.135],
      [ART_X1, 0.152],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_left_peach",
    [
      [ART_X0, 0.110],
      [-0.060, 0.105],
      [-0.025, 0.095],
      [0.012, 0.076],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_path_left",
    [
      [ART_X0, 0.028],
      [-0.045, 0.038],
      [-0.006, 0.052],
      [-0.004, 0.060],
      [-0.028, 0.070],
      [-0.015, 0.078],
      [0.005, 0.088],
    ],
    lineR,
    12
  );

  addContourLine(
    "contour_path_right",
    [
      [-0.056, ART_Y0],
      [-0.030, 0.035],
      [0.008, 0.052],
      [0.010, 0.062],
      [-0.018, 0.072],
      [-0.005, 0.080],
      [0.012, 0.088],
    ],
    lineR,
    12
  );

  return group;
}
