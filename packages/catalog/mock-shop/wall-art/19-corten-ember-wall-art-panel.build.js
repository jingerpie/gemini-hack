function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.35;
  const D = 0.036;
  const PANEL_T = 0.012;
  const MOUNT_T = D - PANEL_T; // 0.024m recessed rear mounting frame
  const MOUNT_INSET = 0.06;

  const Z_BACK = -D / 2;
  const Z_PANEL_CENTER = Z_BACK + MOUNT_T + PANEL_T / 2;
  const Z_FRONT = D / 2;

  // Materials
  const matCortenBase = new THREE.MeshStandardMaterial({
    color: 0x733516,
    roughness: 0.82,
    metalness: 0.35
  });

  const matRustBright = new THREE.MeshStandardMaterial({
    color: 0xb3521b,
    roughness: 0.85,
    metalness: 0.25
  });

  const matRustDark = new THREE.MeshStandardMaterial({
    color: 0x4a2110,
    roughness: 0.88,
    metalness: 0.30
  });

  const matRustSilver = new THREE.MeshStandardMaterial({
    color: 0x8f6b56,
    roughness: 0.72,
    metalness: 0.45
  });

  const matPatinaGreen = new THREE.MeshStandardMaterial({
    color: 0x4f6b3a,
    roughness: 0.78,
    metalness: 0.20
  });

  const matPatinaLightGreen = new THREE.MeshStandardMaterial({
    color: 0x738a46,
    roughness: 0.75,
    metalness: 0.22
  });

  const matPatinaGold = new THREE.MeshStandardMaterial({
    color: 0xb88b32,
    roughness: 0.65,
    metalness: 0.45
  });

  const matMountSteel = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.6,
    metalness: 0.7
  });

  // Helper to create organic flat extruded patch
  function addPatch(name, points, material, zOffset, thickness) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 8
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.set(0, H / 2, Z_FRONT + zOffset - thickness);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 1. Recessed rear mounting frame (flat back at z = -D/2)
  const mountW = W - MOUNT_INSET * 2;
  const mountH = H - MOUNT_INSET * 2;
  const mountGeo = new THREE.BoxGeometry(mountW, mountH, MOUNT_T);
  const mountMesh = new THREE.Mesh(mountGeo, matMountSteel);
  mountMesh.name = 'rear_mounting_frame';
  mountMesh.position.set(0, H / 2, Z_BACK + MOUNT_T / 2);
  mountMesh.castShadow = true;
  mountMesh.receiveShadow = true;
  group.add(mountMesh);

  // 2. Main Corten steel panel
  const panelGeo = new THREE.BoxGeometry(W, H, PANEL_T);
  const panelMesh = new THREE.Mesh(panelGeo, matCortenBase);
  panelMesh.name = 'corten_main_panel';
  panelMesh.position.set(0, H / 2, Z_PANEL_CENTER);
  panelMesh.castShadow = true;
  panelMesh.receiveShadow = true;
  group.add(panelMesh);

  // 3. Layered Corten rust & patina relief patches on front face
  // Dark oxidized corner & edge regions
  addPatch('rust_dark_top_left', [
    [-0.44, 0.66], [-0.22, 0.66], [-0.28, 0.50], [-0.38, 0.42], [-0.44, 0.46]
  ], matRustDark, 0.0008, 0.001);

  addPatch('rust_dark_bottom_right', [
    [0.18, -0.66], [0.44, -0.66], [0.44, -0.35], [0.30, -0.45], [0.22, -0.58]
  ], matRustDark, 0.0008, 0.001);

  // Top-center weathered silvery-rust area
  addPatch('rust_silver_top_center', [
    [-0.14, 0.65], [0.16, 0.65], [0.12, 0.50], [0.02, 0.44], [-0.08, 0.48], [-0.15, 0.56]
  ], matRustSilver, 0.0010, 0.001);

  // Top-left small green-gold fleck
  addPatch('patina_top_left', [
    [-0.26, 0.62], [-0.18, 0.64], [-0.19, 0.56], [-0.25, 0.52], [-0.28, 0.57]
  ], matPatinaLightGreen, 0.0014, 0.001);

  // Upper-right large diagonal patina cluster (green base)
  addPatch('patina_upper_right_base', [
    [0.02, 0.18], [0.10, 0.28], [0.22, 0.38], [0.30, 0.50], [0.40, 0.48],
    [0.42, 0.34], [0.34, 0.20], [0.24, 0.10], [0.12, 0.06], [0.04, 0.10]
  ], matPatinaGreen, 0.0012, 0.0012);

  // Upper-right light green overlay
  addPatch('patina_upper_right_light', [
    [0.08, 0.16], [0.18, 0.28], [0.28, 0.36], [0.36, 0.34],
    [0.32, 0.22], [0.22, 0.14], [0.12, 0.12]
  ], matPatinaLightGreen, 0.0016, 0.001);

  // Upper-right gold highlight
  addPatch('patina_upper_right_gold', [
    [0.18, 0.20], [0.25, 0.28], [0.31, 0.26], [0.28, 0.17], [0.20, 0.16]
  ], matPatinaGold, 0.0020, 0.001);

  // Center diagonal bright orange-rust streak
  addPatch('rust_bright_center_streak', [
    [-0.18, -0.05], [-0.04, 0.10], [0.06, 0.16], [0.02, 0.04], [-0.10, -0.10], [-0.20, -0.12]
  ], matRustBright, 0.0010, 0.001);

  // Middle-left edge patina
  addPatch('patina_mid_left_edge', [
    [-0.44, 0.10], [-0.36, 0.02], [-0.34, -0.14], [-0.38, -0.26], [-0.44, -0.28]
  ], matPatinaGreen, 0.0012, 0.0012);

  addPatch('patina_mid_left_gold', [
    [-0.42, 0.02], [-0.38, -0.04], [-0.37, -0.14], [-0.41, -0.18], [-0.43, -0.08]
  ], matPatinaGold, 0.0016, 0.001);

  // Bottom-left large green patina cluster
  addPatch('patina_bottom_left_base', [
    [-0.44, -0.34], [-0.32, -0.36], [-0.22, -0.44], [-0.12, -0.54],
    [-0.02, -0.60], [-0.04, -0.66], [-0.44, -0.66]
  ], matPatinaGreen, 0.0012, 0.0012);

  addPatch('patina_bottom_left_light', [
    [-0.38, -0.44], [-0.28, -0.48], [-0.22, -0.58], [-0.30, -0.64], [-0.40, -0.58]
  ], matPatinaLightGreen, 0.0016, 0.001);

  addPatch('rust_bright_bottom_left', [
    [-0.18, -0.48], [-0.08, -0.52], [-0.04, -0.60], [-0.14, -0.62], [-0.20, -0.55]
  ], matRustBright, 0.0018, 0.001);

  // Lower-right patina cluster
  addPatch('patina_lower_right_base', [
    [0.12, -0.42], [0.22, -0.26], [0.30, -0.24], [0.32, -0.34], [0.24, -0.44], [0.14, -0.46]
  ], matPatinaLightGreen, 0.0014, 0.001);

  addPatch('patina_lower_right_gold', [
    [0.18, -0.36], [0.25, -0.30], [0.27, -0.36], [0.20, -0.42]
  ], matPatinaGold, 0.0018, 0.001);

  // Lower-right small lower fleck
  addPatch('patina_lower_right_fleck', [
    [0.24, -0.54], [0.32, -0.48], [0.34, -0.56], [0.28, -0.62], [0.22, -0.60]
  ], matPatinaGreen, 0.0012, 0.001);

  return group;
}
