function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (8 x 10 in -> 20 cm x 25 cm)
  const W = 0.20;
  const H = 0.25;
  const D = 0.004;
  const BORDER_X = 0.017;
  const BORDER_Y = 0.017;
  const ART_W = W - 2 * BORDER_X;
  const ART_H = H - 2 * BORDER_Y;

  const ART_X0 = -ART_W / 2;
  const ART_X1 = ART_W / 2;
  const ART_Y0 = BORDER_Y;
  const ART_Y1 = H - BORDER_Y;
  const HORIZON_Y = ART_Y0 + ART_H * 0.78;

  // Materials
  const matPaper = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matSky = new THREE.MeshStandardMaterial({
    color: 0xefece0,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matPlum = new THREE.MeshStandardMaterial({
    color: 0x6a4d5e,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matDarkPlum = new THREE.MeshStandardMaterial({
    color: 0x3d2a35,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matSage = new THREE.MeshStandardMaterial({
    color: 0x9eb096,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matPeach = new THREE.MeshStandardMaterial({
    color: 0xe5b293,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xf3efe2,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Helper to convert normalized artwork coords (u: 0..1, v: 0..1) to world (x, y)
  function pt(u, v) {
    return new THREE.Vector2(ART_X0 + u * ART_W, ART_Y0 + v * ART_H);
  }

  function addLayer(name, upperPts, lowerPts, mat, zLayer, depth = 0.00025) {
    const shape = new THREE.Shape();
    shape.moveTo(upperPts[0].x, upperPts[0].y);
    if (upperPts.length > 1) {
      shape.splineThru(upperPts.slice(1));
    }
    shape.lineTo(lowerPts[0].x, lowerPts[0].y);
    if (lowerPts.length > 1) {
      shape.splineThru(lowerPts.slice(1));
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 20,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.z = D / 2 + zLayer * 0.00022;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 1. White paper board (base)
  const boardGeo = new THREE.BoxGeometry(W, H, D);
  const boardMesh = new THREE.Mesh(boardGeo, matPaper);
  boardMesh.name = 'paper_board';
  boardMesh.position.set(0, H / 2, 0);
  boardMesh.castShadow = true;
  boardMesh.receiveShadow = true;
  group.add(boardMesh);

  // 2. Sky backdrop
  const skyH = ART_Y1 - HORIZON_Y;
  const skyGeo = new THREE.BoxGeometry(ART_W, skyH, 0.0003);
  const skyMesh = new THREE.Mesh(skyGeo, matSky);
  skyMesh.name = 'sky_backdrop';
  skyMesh.position.set(0, HORIZON_Y + skyH / 2, D / 2 + 0.00015);
  skyMesh.castShadow = true;
  skyMesh.receiveShadow = true;
  group.add(skyMesh);

  // 3. Ocean base (plum)
  const oceanH = HORIZON_Y - ART_Y0;
  const oceanGeo = new THREE.BoxGeometry(ART_W, oceanH, 0.0003);
  const oceanMesh = new THREE.Mesh(oceanGeo, matPlum);
  oceanMesh.name = 'ocean_base';
  oceanMesh.position.set(0, ART_Y0 + oceanH / 2, D / 2 + 0.00015);
  oceanMesh.castShadow = true;
  oceanMesh.receiveShadow = true;
  group.add(oceanMesh);

  // 4. Horizon line
  const horizonGeo = new THREE.BoxGeometry(ART_W, 0.0012, 0.00035);
  const horizonMesh = new THREE.Mesh(horizonGeo, matDarkPlum);
  horizonMesh.name = 'horizon_line';
  horizonMesh.position.set(0, HORIZON_Y, D / 2 + 0.0004);
  horizonMesh.castShadow = true;
  horizonMesh.receiveShadow = true;
  group.add(horizonMesh);

  // 5. Upper wave - Peach band
  addLayer(
    'upper_wave_peach',
    [pt(0.0, 0.65), pt(0.25, 0.70), pt(0.55, 0.76), pt(0.85, 0.74), pt(1.0, 0.68)],
    [pt(1.0, 0.63), pt(0.82, 0.70), pt(0.55, 0.73), pt(0.25, 0.67), pt(0.0, 0.62)],
    matPeach,
    2
  );

  // 6. Upper wave - Cream band
  addLayer(
    'upper_wave_cream',
    [pt(0.52, 0.75), pt(0.72, 0.75), pt(0.88, 0.71), pt(0.98, 0.66)],
    [pt(0.94, 0.64), pt(0.84, 0.69), pt(0.68, 0.73), pt(0.52, 0.74)],
    matCream,
    3
  );

  // 7. Upper wave - Sage curl
  addLayer(
    'upper_wave_sage',
    [pt(0.48, 0.73), pt(0.66, 0.72), pt(0.78, 0.64), pt(0.72, 0.58)],
    [pt(0.66, 0.60), pt(0.70, 0.65), pt(0.60, 0.70), pt(0.45, 0.71)],
    matSage,
    4
  );

  // 8. Upper wave - Foam splash on right
  addLayer(
    'upper_wave_foam',
    [pt(0.74, 0.59), pt(0.82, 0.62), pt(0.90, 0.61), pt(0.95, 0.66), pt(1.0, 0.68)],
    [pt(1.0, 0.58), pt(0.88, 0.57), pt(0.76, 0.58)],
    matCream,
    5
  );

  // 9. Main wave - Outer Peach arc
  addLayer(
    'main_wave_peach',
    [pt(0.0, 0.52), pt(0.22, 0.61), pt(0.48, 0.62), pt(0.68, 0.54), pt(0.77, 0.41)],
    [pt(0.72, 0.40), pt(0.62, 0.51), pt(0.45, 0.59), pt(0.22, 0.58), pt(0.0, 0.49)],
    matPeach,
    6
  );

  // 10. Main wave - Cream arc
  addLayer(
    'main_wave_cream',
    [pt(0.0, 0.49), pt(0.22, 0.58), pt(0.45, 0.59), pt(0.64, 0.50), pt(0.74, 0.39)],
    [pt(0.68, 0.38), pt(0.58, 0.47), pt(0.42, 0.56), pt(0.20, 0.55), pt(0.0, 0.46)],
    matCream,
    7
  );

  // 11. Main wave - Sage sweeping curl
  addLayer(
    'main_wave_sage',
    [pt(0.0, 0.44), pt(0.20, 0.54), pt(0.42, 0.56), pt(0.56, 0.48), pt(0.58, 0.41)],
    [pt(0.48, 0.42), pt(0.44, 0.49), pt(0.30, 0.47), pt(0.18, 0.32), pt(0.32, 0.16), pt(0.62, 0.05), pt(0.78, 0.0)],
    matSage,
    8
  );

  // 12. Main wave - Inner Peach curl
  addLayer(
    'main_wave_inner_peach',
    [pt(0.36, 0.47), pt(0.46, 0.50), pt(0.58, 0.44), pt(0.68, 0.38), pt(0.85, 0.37), pt(1.0, 0.39)],
    [pt(1.0, 0.36), pt(0.82, 0.34), pt(0.62, 0.35), pt(0.48, 0.38), pt(0.39, 0.42)],
    matPeach,
    9
  );

  // 13. Main wave - Inner Sage curl
  addLayer(
    'main_wave_inner_sage',
    [pt(0.40, 0.44), pt(0.49, 0.46), pt(0.58, 0.41), pt(0.70, 0.38)],
    [pt(0.65, 0.36), pt(0.52, 0.38), pt(0.42, 0.41)],
    matSage,
    10
  );

  // 14. Lower sweep - Peach band
  addLayer(
    'lower_sweep_peach',
    [pt(0.24, 0.36), pt(0.34, 0.25), pt(0.58, 0.18), pt(0.85, 0.14), pt(1.0, 0.12)],
    [pt(1.0, 0.09), pt(0.82, 0.11), pt(0.54, 0.15), pt(0.30, 0.22), pt(0.22, 0.32)],
    matPeach,
    11
  );

  // 15. Lower sweep - Sage band
  addLayer(
    'lower_sweep_sage',
    [pt(0.18, 0.32), pt(0.28, 0.20), pt(0.52, 0.13), pt(0.82, 0.08), pt(1.0, 0.06)],
    [pt(1.0, 0.02), pt(0.78, 0.05), pt(0.48, 0.10), pt(0.24, 0.17), pt(0.15, 0.28)],
    matSage,
    12
  );

  // 16. Lower sweep - Cream band
  addLayer(
    'lower_sweep_cream',
    [pt(0.20, 0.22), pt(0.38, 0.13), pt(0.68, 0.07), pt(1.0, 0.03)],
    [pt(1.0, 0.0), pt(0.72, 0.0), pt(0.45, 0.06), pt(0.18, 0.18)],
    matCream,
    13
  );

  // 17. Bottom right - Sage corner
  addLayer(
    'bottom_right_sage',
    [pt(0.48, 0.06), pt(0.68, 0.02), pt(0.88, 0.0)],
    [pt(0.68, 0.0), pt(0.45, 0.04)],
    matSage,
    14
  );

  return group;
}
