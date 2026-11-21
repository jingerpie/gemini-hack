function build(THREE) {
  const group = new THREE.Group();

  const W = 0.61;
  const D = 0.91;
  const BACKING_H = 0.004;
  const PILE_H = 0.012;
  const RIDGE_R = 0.014;
  const RIDGE_Y = BACKING_H + PILE_H;

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x6b4c3b,
    roughness: 0.95,
    metalness: 0.0,
  });

  const pileMat = new THREE.MeshStandardMaterial({
    color: 0x7f8e70,
    roughness: 0.96,
    metalness: 0.0,
  });

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0x8f9e7f,
    roughness: 0.94,
    metalness: 0.0,
  });

  const dotMat = new THREE.MeshStandardMaterial({
    color: 0x95a485,
    roughness: 0.94,
    metalness: 0.0,
  });

  // Backing layer
  const backingGeo = new THREE.BoxGeometry(W, BACKING_H, D);
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = 'rug_backing';
  backingMesh.position.y = BACKING_H / 2;
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  // Main tufted pile base
  const pileGeo = new THREE.BoxGeometry(W - 0.004, PILE_H, D - 0.004);
  const pileMesh = new THREE.Mesh(pileGeo, pileMat);
  pileMesh.name = 'rug_pile_base';
  pileMesh.position.y = BACKING_H + PILE_H / 2;
  pileMesh.castShadow = true;
  pileMesh.receiveShadow = true;
  group.add(pileMesh);

  // Helper to create a tufted ripple ridge
  function addRipple(name, points, radiusScale = 1.0) {
    const vecs = points.map((p) => new THREE.Vector3(p[0], RIDGE_Y, p[1]));
    const curve = new THREE.CatmullRomCurve3(vecs);
    const tubeGeo = new THREE.TubeGeometry(curve, 28, RIDGE_R * radiusScale, 10, false);
    const mesh = new THREE.Mesh(tubeGeo, ridgeMat);
    mesh.name = name;
    mesh.scale.set(1, 0.58, 1);
    mesh.position.y = RIDGE_Y * (1 - 0.58);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Helper to create a raised tuft dot
  function addDot(name, x, z, r = 0.024) {
    const geo = new THREE.SphereGeometry(r, 16, 12);
    const mesh = new THREE.Mesh(geo, dotMat);
    mesh.name = name;
    mesh.scale.set(1.1, 0.45, 1.1);
    mesh.position.set(x, RIDGE_Y + r * 0.15, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Top concentric ripples (-Z)
  addRipple('ripple_top_inner', [
    [-0.10, -0.43],
    [-0.06, -0.37],
    [0.0, -0.35],
    [0.06, -0.37],
    [0.10, -0.43],
  ]);

  addRipple('ripple_top_mid', [
    [-0.18, -0.43],
    [-0.12, -0.32],
    [0.0, -0.28],
    [0.12, -0.32],
    [0.18, -0.43],
  ]);

  addRipple('ripple_top_outer', [
    [-0.25, -0.43],
    [-0.16, -0.26],
    [0.0, -0.20],
    [0.16, -0.26],
    [0.25, -0.43],
  ]);

  // Sweeping upper-to-mid curves
  addRipple('ripple_upper_sweep_left', [
    [-0.28, -0.32],
    [-0.17, -0.22],
    [-0.08, -0.14],
    [0.02, -0.12],
    [0.12, -0.18],
    [0.28, -0.28],
  ]);

  addRipple('ripple_upper_sweep_wide', [
    [-0.28, -0.24],
    [-0.14, -0.13],
    [-0.02, -0.08],
    [0.10, -0.12],
    [0.20, -0.20],
    [0.28, -0.22],
  ]);

  // Central diagonal ripples
  addRipple('ripple_center_diag_left', [
    [-0.28, -0.14],
    [-0.16, -0.03],
    [-0.06, 0.08],
    [0.06, 0.14],
    [0.20, 0.24],
    [0.28, 0.34],
  ]);

  addRipple('ripple_center_diag_right', [
    [0.02, -0.09],
    [0.11, 0.02],
    [0.20, 0.12],
    [0.28, 0.22],
  ]);

  // Right-side concentric ripples (+X)
  addRipple('ripple_right_outer', [
    [0.28, -0.16],
    [0.17, -0.08],
    [0.14, 0.02],
    [0.18, 0.12],
    [0.28, 0.18],
  ]);

  addRipple('ripple_right_inner', [
    [0.28, -0.08],
    [0.22, -0.02],
    [0.21, 0.04],
    [0.28, 0.10],
  ]);

  // Left-side concentric ripples (-X)
  addRipple('ripple_left_outer', [
    [-0.28, -0.05],
    [-0.18, 0.04],
    [-0.15, 0.14],
    [-0.20, 0.24],
    [-0.28, 0.30],
  ]);

  addRipple('ripple_left_mid', [
    [-0.28, 0.04],
    [-0.21, 0.10],
    [-0.20, 0.18],
    [-0.28, 0.23],
  ]);

  addRipple('ripple_left_inner', [
    [-0.28, 0.10],
    [-0.24, 0.14],
    [-0.28, 0.18],
  ]);

  // Bottom concentric arch ripples (+Z)
  addRipple('ripple_bottom_outer', [
    [-0.28, 0.36],
    [-0.16, 0.26],
    [0.0, 0.21],
    [0.16, 0.27],
    [0.28, 0.38],
  ]);

  addRipple('ripple_bottom_mid', [
    [-0.22, 0.43],
    [-0.12, 0.33],
    [0.0, 0.29],
    [0.12, 0.33],
    [0.22, 0.43],
  ]);

  addRipple('ripple_bottom_inner', [
    [-0.13, 0.43],
    [-0.07, 0.37],
    [0.0, 0.35],
    [0.07, 0.37],
    [0.13, 0.43],
  ]);

  // Raised tuft dots inside the loops
  addDot('tuft_dot_top', 0.0, -0.26, 0.026);
  addDot('tuft_dot_center', -0.01, -0.01, 0.028);
  addDot('tuft_dot_bottom', 0.02, 0.28, 0.026);

  return group;
}
