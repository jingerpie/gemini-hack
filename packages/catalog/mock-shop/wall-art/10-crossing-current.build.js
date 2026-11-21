function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters (portrait gallery-wrapped canvas)
  const W = 0.60;
  const H = 0.75;
  const D = 0.038;
  const LAYER_T = 0.0012;

  // Materials (reused)
  const matCanvas = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.85,
    metalness: 0.0
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0xa85227,
    roughness: 0.62,
    metalness: 0.02
  });
  const matBurntSienna = new THREE.MeshStandardMaterial({
    color: 0x8c3f1d,
    roughness: 0.65,
    metalness: 0.02
  });
  const matWarmOchre = new THREE.MeshStandardMaterial({
    color: 0xb57b2e,
    roughness: 0.68,
    metalness: 0.02
  });
  const matOlive = new THREE.MeshStandardMaterial({
    color: 0x556638,
    roughness: 0.70,
    metalness: 0.02
  });
  const matCharcoal = new THREE.MeshStandardMaterial({
    color: 0x3c4347,
    roughness: 0.72,
    metalness: 0.03
  });
  const matLightSienna = new THREE.MeshStandardMaterial({
    color: 0xc26e3d,
    roughness: 0.60,
    metalness: 0.02
  });

  // 1. Stretched canvas base
  const canvasBase = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matCanvas);
  canvasBase.position.set(0, H / 2, 0);
  canvasBase.name = 'canvas_base';
  canvasBase.castShadow = true;
  canvasBase.receiveShadow = true;
  group.add(canvasBase);

  // Helper to add a flat brushstroke band on the +Z face
  const frontZ = D / 2;
  function addStroke(name, x, y, len, wid, angleRad, layerIdx, mat) {
    const geo = new THREE.BoxGeometry(len, wid, LAYER_T);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, frontZ + layerIdx * 0.0005);
    mesh.rotation.z = angleRad;
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Helper to add a gallery-wrap edge patch
  function addEdgePatch(name, x, y, z, sx, sy, sz, mat) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Underlay strokes (layer 1 - 2)
  addStroke('stroke_under_ochre_top', -0.04, 0.63, 0.22, 0.09, 0.65, 1, matWarmOchre);
  addStroke('stroke_under_olive_left', -0.18, 0.44, 0.26, 0.09, -0.58, 1, matOlive);
  addStroke('stroke_under_charcoal_right', 0.19, 0.28, 0.22, 0.08, -0.72, 1, matCharcoal);
  addStroke('stroke_under_olive_mid', -0.02, 0.26, 0.28, 0.08, 0.78, 1, matOlive);
  addStroke('stroke_under_charcoal_bot', -0.14, 0.08, 0.20, 0.07, 0.0, 2, matCharcoal);
  addStroke('stroke_under_ochre_mid_left', -0.16, 0.24, 0.22, 0.075, 0.02, 2, matWarmOchre);

  // Mid-layer diagonal & crossing strokes (layer 3 - 5)
  addStroke('stroke_diag_top_left_sienna', -0.18, 0.62, 0.22, 0.095, -0.78, 3, matBurntSienna);
  addStroke('stroke_diag_top_right_terracotta', 0.06, 0.56, 0.34, 0.095, 0.76, 3, matTerracotta);
  addStroke('stroke_diag_mid_left_olive', -0.14, 0.34, 0.34, 0.09, 0.80, 3, matOlive);
  addStroke('stroke_diag_mid_right_ochre', 0.14, 0.40, 0.34, 0.095, 0.78, 4, matWarmOchre);
  addStroke('stroke_diag_center_sienna', -0.02, 0.46, 0.30, 0.095, -0.74, 4, matTerracotta);
  addStroke('stroke_diag_lower_right_charcoal', 0.20, 0.34, 0.20, 0.085, -0.75, 4, matCharcoal);
  addStroke('stroke_diag_bot_left_terracotta', -0.02, 0.12, 0.28, 0.09, 0.82, 5, matBurntSienna);
  addStroke('stroke_diag_bot_right_sienna', 0.21, 0.10, 0.20, 0.085, -0.78, 5, matTerracotta);

  // Prominent foreground vertical & horizontal strokes (layer 6 - 8)
  addStroke('stroke_horiz_top_left', -0.20, 0.57, 0.19, 0.085, 0.02, 6, matLightSienna);
  addStroke('stroke_horiz_upper_right', 0.16, 0.53, 0.26, 0.085, -0.03, 6, matTerracotta);
  addStroke('stroke_vert_top_right', 0.16, 0.61, 0.24, 0.095, 1.56, 7, matBurntSienna);
  addStroke('stroke_vert_top_right_slate', 0.19, 0.62, 0.22, 0.035, 1.57, 8, matCharcoal);

  addStroke('stroke_vert_main_left', -0.10, 0.48, 0.48, 0.10, 1.57, 7, matTerracotta);
  addStroke('stroke_vert_main_left_highlight', -0.09, 0.47, 0.44, 0.03, 1.57, 8, matLightSienna);

  addStroke('stroke_diag_fg_center', 0.04, 0.28, 0.34, 0.095, -0.79, 7, matTerracotta);
  addStroke('stroke_horiz_bot_main', -0.06, 0.16, 0.46, 0.09, 0.02, 8, matBurntSienna);
  addStroke('stroke_horiz_bot_right', 0.22, 0.21, 0.15, 0.08, 0.01, 8, matLightSienna);
  addStroke('stroke_vert_bot_left', -0.11, 0.06, 0.12, 0.09, 1.57, 7, matTerracotta);
  addStroke('stroke_vert_bot_right', 0.12, 0.09, 0.16, 0.085, 1.57, 7, matBurntSienna);

  // Gallery-wrap edge patches (left, right, top, bottom)
  addEdgePatch('wrap_left_top', -W / 2 - 0.0004, 0.57, 0.0, 0.0008, 0.09, D * 0.96, matLightSienna);
  addEdgePatch('wrap_left_mid', -W / 2 - 0.0004, 0.38, 0.0, 0.0008, 0.11, D * 0.96, matOlive);
  addEdgePatch('wrap_left_bot', -W / 2 - 0.0004, 0.16, 0.0, 0.0008, 0.09, D * 0.96, matBurntSienna);
  addEdgePatch('wrap_right_upper', W / 2 + 0.0004, 0.53, 0.0, 0.0008, 0.09, D * 0.96, matTerracotta);
  addEdgePatch('wrap_right_lower', W / 2 + 0.0004, 0.21, 0.0, 0.0008, 0.08, D * 0.96, matLightSienna);
  addEdgePatch('wrap_top_left', -0.10, H + 0.0004, 0.0, 0.10, 0.0008, D * 0.96, matTerracotta);
  addEdgePatch('wrap_top_right', 0.16, H + 0.0004, 0.0, 0.10, 0.0008, D * 0.96, matBurntSienna);
  addEdgePatch('wrap_bot_left', -0.11, -0.0004, 0.0, 0.09, 0.0008, D * 0.96, matTerracotta);
  addEdgePatch('wrap_bot_right', 0.12, -0.0004, 0.0, 0.09, 0.0008, D * 0.96, matBurntSienna);

  return group;
}
