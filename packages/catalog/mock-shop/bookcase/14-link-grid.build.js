function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const D = 0.40;
  const CUBE_H = 0.40;
  const TUBE = 0.018;
  const HALF_TUBE = TUBE / 2;
  const FOOT_H = 0.015;
  const SEAM_GAP = 0.002;
  const PANEL_THICK = 0.012;
  const CORNER_SIZE = 0.022;
  const CORNER_LEN = 0.032;

  const X_POS = W / 2 - HALF_TUBE;
  const Z_POS = D / 2 - HALF_TUBE;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe6e2d8,
    roughness: 0.42,
    metalness: 0.15,
  });

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4da,
    roughness: 0.48,
    metalness: 0.1,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0xd8d3c8,
    roughness: 0.55,
    metalness: 0.2,
  });

  function addMesh(geo, mat, x, y, z, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Leveling feet (4)
  const footPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.013, 0.0),
    new THREE.Vector2(0.013, 0.004),
    new THREE.Vector2(0.005, 0.006),
    new THREE.Vector2(0.005, FOOT_H),
    new THREE.Vector2(0.0, FOOT_H),
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, 20);
  const corners = [
    [-X_POS, -Z_POS, 'back_left'],
    [X_POS, -Z_POS, 'back_right'],
    [-X_POS, Z_POS, 'front_left'],
    [X_POS, Z_POS, 'front_right'],
  ];
  for (const [cx, cz, label] of corners) {
    addMesh(footGeo, footMat, cx, 0, cz, `foot_${label}`);
  }

  // Geometries for cube frame
  const postH = CUBE_H - TUBE * 2;
  const postGeo = new THREE.BoxGeometry(TUBE, postH, TUBE);
  const railXLen = W - TUBE * 2;
  const railZLen = D - TUBE * 2;
  const railXGeo = new THREE.BoxGeometry(railXLen, TUBE, TUBE);
  const railZGeo = new THREE.BoxGeometry(TUBE, TUBE, railZLen);
  const panelGeo = new THREE.BoxGeometry(W - TUBE * 1.2, PANEL_THICK, D - TUBE * 1.2);
  const cornerGeo = new THREE.BoxGeometry(CORNER_SIZE, CORNER_LEN, CORNER_SIZE);

  // Build 2 stacked cubes
  for (let tier = 0; tier < 2; tier++) {
    const tierName = tier === 0 ? 'lower' : 'upper';
    const baseY = FOOT_H + tier * (CUBE_H + SEAM_GAP);

    // 4 vertical posts
    const postY = baseY + CUBE_H / 2;
    for (const [cx, cz, label] of corners) {
      addMesh(postGeo, frameMat, cx, postY, cz, `${tierName}_post_${label}`);
    }

    // Bottom and top horizontal rails
    const railLevels = [
      { y: baseY + HALF_TUBE, label: 'bottom' },
      { y: baseY + CUBE_H - HALF_TUBE, label: 'top' },
    ];
    for (const rl of railLevels) {
      addMesh(railXGeo, frameMat, 0, rl.y, Z_POS, `${tierName}_${rl.label}_rail_front`);
      addMesh(railXGeo, frameMat, 0, rl.y, -Z_POS, `${tierName}_${rl.label}_rail_back`);
      addMesh(railZGeo, frameMat, -X_POS, rl.y, 0, `${tierName}_${rl.label}_rail_left`);
      addMesh(railZGeo, frameMat, X_POS, rl.y, 0, `${tierName}_${rl.label}_rail_right`);
    }
  }

  // 3 shelf panels (lower bottom, upper bottom, upper top)
  addMesh(panelGeo, panelMat, 0, FOOT_H + HALF_TUBE, 0, 'shelf_panel_bottom');
  addMesh(panelGeo, panelMat, 0, FOOT_H + CUBE_H + SEAM_GAP + HALF_TUBE, 0, 'shelf_panel_middle');
  addMesh(panelGeo, panelMat, 0, FOOT_H + CUBE_H * 2 + SEAM_GAP - HALF_TUBE, 0, 'shelf_panel_top');

  // Outer corner sleeves (4 bottom, 4 top)
  for (const [cx, cz, label] of corners) {
    addMesh(cornerGeo, frameMat, cx, FOOT_H + CORNER_LEN / 2, cz, `corner_sleeve_bottom_${label}`);
    addMesh(
      cornerGeo,
      frameMat,
      cx,
      FOOT_H + CUBE_H * 2 + SEAM_GAP - CORNER_LEN / 2,
      cz,
      `corner_sleeve_top_${label}`
    );
  }

  return group;
}
