function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 0.42;
  const BASE_H = 0.135;
  const BASE_R = 0.052;
  const FELT_H = 0.002;
  const STEM_R = 0.006;
  const SOCKET_H = 0.022;
  const SOCKET_R = 0.016;
  const SHADE_H = 0.155;
  const SHADE_R = 0.115;
  const SHADE_WALL = 0.0025;
  const SHADE_Y_BOTTOM = H - SHADE_H;
  const STEM_H = SHADE_Y_BOTTOM - BASE_H;

  // Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.92,
    metalness: 0.04,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x121212,
    roughness: 0.98,
    metalness: 0.0,
  });

  const resinMat = new THREE.MeshPhysicalMaterial({
    color: 0x14100a,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const amberVeinMat = new THREE.MeshStandardMaterial({
    color: 0x8a5a19,
    roughness: 0.25,
    metalness: 0.45,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb8964e,
    roughness: 0.32,
    metalness: 0.88,
  });

  const shadeOuterMat = new THREE.MeshStandardMaterial({
    color: 0x121212,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.FrontSide,
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd999,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base felt pad
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.002, BASE_R - 0.002, FELT_H, 32),
    feltMat,
    'base_felt_pad',
    0,
    FELT_H / 2,
    0
  );

  // 2. Main concrete base column
  const colH = BASE_H - FELT_H - 0.004;
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, colH, 32),
    concreteMat,
    'base_column',
    0,
    FELT_H + 0.002 + colH / 2,
    0
  );

  // 3. Base bottom bevel
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R - 0.002, 0.002, 32),
    concreteMat,
    'base_chamfer_bottom',
    0,
    FELT_H + 0.001,
    0
  );

  // 4. Base top bevel
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.002, BASE_R, 0.002, 32),
    concreteMat,
    'base_chamfer_top',
    0,
    BASE_H - 0.001,
    0
  );

  // 5. Glossy dark-amber resin inset on front (+Z) of base
  const insetH = BASE_H * 0.68;
  const insetW = BASE_R * 1.05;
  const insetD = 0.012;
  addMesh(
    new THREE.BoxGeometry(insetW, insetH, insetD),
    resinMat,
    'base_inset_panel',
    0,
    BASE_H * 0.48,
    BASE_R - insetD / 2 + 0.001
  );

  // 6. Subtle amber/gold veins on the inset
  addMesh(
    new THREE.CylinderGeometry(0.0015, 0.0025, insetH * 0.72, 12),
    amberVeinMat,
    'base_inset_vein_1',
    -0.012,
    BASE_H * 0.47,
    BASE_R + 0.0005,
    0,
    0,
    0.22
  );
  addMesh(
    new THREE.CylinderGeometry(0.001, 0.002, insetH * 0.55, 12),
    amberVeinMat,
    'base_inset_vein_2',
    0.01,
    BASE_H * 0.44,
    BASE_R + 0.0005,
    0,
    0,
    -0.3
  );

  // 7. Bottom brass collar at base-stem junction
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.7, STEM_R * 1.9, 0.005, 24),
    brassMat,
    'stem_collar_bottom',
    0,
    BASE_H + 0.0025,
    0
  );

  // 8. Brushed brass stem rod
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 24),
    brassMat,
    'stem_rod',
    0,
    BASE_H + STEM_H / 2,
    0
  );

  // 9. Brass socket holder just under shade
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R, SOCKET_R * 0.92, SOCKET_H, 24),
    brassMat,
    'socket_holder',
    0,
    SHADE_Y_BOTTOM - SOCKET_H / 2 + 0.003,
    0
  );

  // 10. Inner socket inside shade
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R * 0.85, 0.028, 24),
    brassMat,
    'socket_inner',
    0,
    SHADE_Y_BOTTOM + 0.014,
    0
  );

  // 11. Emissive light bulb inside shade
  addMesh(
    new THREE.SphereGeometry(0.026, 20, 16),
    bulbMat,
    'emit_bulb',
    0,
    SHADE_Y_BOTTOM + 0.052,
    0
  );

  // 12. Drum shade outer fabric
  addMesh(
    new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true),
    shadeOuterMat,
    'shade_outer',
    0,
    SHADE_Y_BOTTOM + SHADE_H / 2,
    0
  );

  // 13. Drum shade inner lining
  addMesh(
    new THREE.CylinderGeometry(SHADE_R - SHADE_WALL, SHADE_R - SHADE_WALL, SHADE_H, 32, 1, true),
    shadeInnerMat,
    'shade_inner',
    0,
    SHADE_Y_BOTTOM + SHADE_H / 2,
    0
  );

  // 14. Shade top rim
  addMesh(
    new THREE.TorusGeometry(SHADE_R - SHADE_WALL / 2, SHADE_WALL / 2, 12, 32),
    shadeOuterMat,
    'shade_rim_top',
    0,
    H - SHADE_WALL / 2,
    0,
    Math.PI / 2,
    0,
    0
  );

  // 15. Shade bottom rim
  addMesh(
    new THREE.TorusGeometry(SHADE_R - SHADE_WALL / 2, SHADE_WALL / 2, 12, 32),
    shadeOuterMat,
    'shade_rim_bottom',
    0,
    SHADE_Y_BOTTOM + SHADE_WALL / 2,
    0,
    Math.PI / 2,
    0,
    0
  );

  // 16. Spider ring & arms connecting socket to shade
  const spiderY = SHADE_Y_BOTTOM + 0.018;
  addMesh(
    new THREE.TorusGeometry(SOCKET_R * 0.95, 0.002, 8, 24),
    brassMat,
    'shade_spider_ring',
    0,
    spiderY,
    0,
    Math.PI / 2,
    0,
    0
  );

  const armLen = SHADE_R - SHADE_WALL - SOCKET_R * 0.95;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const midR = SOCKET_R * 0.95 + armLen / 2;
    addMesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, armLen, 8),
      brassMat,
      `shade_spider_arm_${i + 1}`,
      Math.sin(angle) * midR,
      spiderY,
      Math.cos(angle) * midR,
      Math.PI / 2,
      0,
      -angle
    );
  }

  return group;
}
