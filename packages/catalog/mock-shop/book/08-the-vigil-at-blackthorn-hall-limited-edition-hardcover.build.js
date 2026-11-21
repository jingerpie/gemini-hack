function build(THREE) {
  const W = 0.165;
  const D = 0.245;
  const H = 0.042;
  const BOARD_T = 0.0035;
  const OVERHANG = 0.004;
  const SPINE_R = H / 2;
  const BOARD_W = W - SPINE_R;
  const BOARD_CX = SPINE_R / 2;

  const group = new THREE.Group();

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.78,
    metalness: 0.05
  });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf0ead8,
    roughness: 0.9,
    metalness: 0.0
  });
  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xd8ceb4,
    roughness: 0.85,
    metalness: 0.0
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x7a1f1d,
    roughness: 0.75,
    metalness: 0.05
  });
  const plumMat = new THREE.MeshStandardMaterial({
    color: 0x4b3854,
    roughness: 0.78,
    metalness: 0.05
  });
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x6f7a3e,
    roughness: 0.8,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Back cover
  addMesh(
    new THREE.BoxGeometry(BOARD_W, BOARD_T, D),
    leatherMat,
    'back_cover',
    BOARD_CX,
    BOARD_T / 2,
    0
  );

  // Front cover
  addMesh(
    new THREE.BoxGeometry(BOARD_W, BOARD_T, D),
    leatherMat,
    'front_cover',
    BOARD_CX,
    H - BOARD_T / 2,
    0
  );

  // Spine (half cylinder on -X side)
  addMesh(
    new THREE.CylinderGeometry(SPINE_R, SPINE_R, D, 24, 1, false, Math.PI, Math.PI),
    leatherMat,
    'spine',
    -W / 2 + SPINE_R,
    SPINE_R,
    0,
    Math.PI / 2,
    0,
    0
  );

  // Page block
  const pageW = BOARD_W - OVERHANG;
  const pageH = H - 2 * BOARD_T;
  const pageD = D - 2 * OVERHANG;
  addMesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    paperMat,
    'page_block',
    BOARD_CX - OVERHANG / 2,
    H / 2,
    0
  );

  // Spine raised bands (4 hubs)
  const bandZPositions = [-0.072, -0.024, 0.024, 0.072];
  bandZPositions.forEach((bz, idx) => {
    addMesh(
      new THREE.CylinderGeometry(SPINE_R + 0.0014, SPINE_R + 0.0014, 0.005, 20, 1, false, Math.PI, Math.PI),
      leatherMat,
      `spine_band_${idx + 1}`,
      -W / 2 + SPINE_R,
      SPINE_R,
      bz,
      Math.PI / 2,
      0,
      0
    );
  });

  // Spine decorative color blocks
  const spineInsetGeo = new THREE.CylinderGeometry(SPINE_R + 0.0006, SPINE_R + 0.0006, 0.032, 16, 1, false, Math.PI * 1.15, Math.PI * 0.7);
  addMesh(spineInsetGeo, parchmentMat, 'spine_inset_top', -W / 2 + SPINE_R, SPINE_R, -0.096, Math.PI / 2, 0, 0);
  addMesh(spineInsetGeo, parchmentMat, 'spine_inset_mid', -W / 2 + SPINE_R, SPINE_R, 0.0, Math.PI / 2, 0, 0);
  addMesh(spineInsetGeo, crimsonMat, 'spine_inset_bottom', -W / 2 + SPINE_R, SPINE_R, 0.096, Math.PI / 2, 0, 0);

  // Front cover decorative layers
  const topY = H + 0.0004;
  const panelW = BOARD_W * 0.78;
  const panelD = D * 0.84;

  // Parchment background panel
  addMesh(
    new THREE.BoxGeometry(panelW, 0.0008, panelD),
    parchmentMat,
    'cover_parchment_panel',
    BOARD_CX,
    topY,
    0
  );

  // Intertwined vine border accents (crimson & plum)
  addMesh(
    new THREE.BoxGeometry(panelW * 0.92, 0.001, panelD * 0.94),
    crimsonMat,
    'cover_vine_border_crimson',
    BOARD_CX,
    topY + 0.0002,
    0
  );
  addMesh(
    new THREE.BoxGeometry(panelW * 0.86, 0.0011, panelD * 0.89),
    plumMat,
    'cover_vine_border_plum',
    BOARD_CX,
    topY + 0.0003,
    0
  );
  addMesh(
    new THREE.BoxGeometry(panelW * 0.80, 0.0012, panelD * 0.84),
    parchmentMat,
    'cover_parchment_inner',
    BOARD_CX,
    topY + 0.0004,
    0
  );

  // Central gothic shield medallion
  const shieldW = panelW * 0.62;
  const shieldD = panelD * 0.68;
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, -shieldD / 2);
  shieldShape.lineTo(shieldW / 2, -shieldD * 0.3);
  shieldShape.lineTo(shieldW / 2, shieldD * 0.3);
  shieldShape.lineTo(0, shieldD / 2);
  shieldShape.lineTo(-shieldW / 2, shieldD * 0.3);
  shieldShape.lineTo(-shieldW / 2, -shieldD * 0.3);
  shieldShape.closePath();

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.001,
    bevelEnabled: false
  });
  addMesh(
    shieldGeo,
    leatherMat,
    'cover_center_shield',
    BOARD_CX,
    topY + 0.0012,
    0,
    -Math.PI / 2,
    0,
    0
  );

  // Crimson winged emblem in upper half of shield
  addMesh(
    new THREE.CylinderGeometry(shieldW * 0.28, shieldW * 0.2, 0.001, 16),
    crimsonMat,
    'cover_crimson_emblem',
    BOARD_CX,
    topY + 0.002,
    -shieldD * 0.16
  );

  // Moss-green skeletal hand motifs in lower half of shield
  addMesh(
    new THREE.BoxGeometry(shieldW * 0.14, 0.001, shieldD * 0.26),
    mossMat,
    'cover_skeletal_hand_left',
    BOARD_CX - shieldW * 0.18,
    topY + 0.002,
    shieldD * 0.16
  );
  addMesh(
    new THREE.BoxGeometry(shieldW * 0.14, 0.001, shieldD * 0.26),
    mossMat,
    'cover_skeletal_hand_right',
    BOARD_CX + shieldW * 0.18,
    topY + 0.002,
    shieldD * 0.16
  );

  // Plum gothic spire accent between hands
  addMesh(
    new THREE.BoxGeometry(shieldW * 0.1, 0.001, shieldD * 0.22),
    plumMat,
    'cover_plum_spire',
    BOARD_CX,
    topY + 0.002,
    shieldD * 0.18
  );

  return group;
}
