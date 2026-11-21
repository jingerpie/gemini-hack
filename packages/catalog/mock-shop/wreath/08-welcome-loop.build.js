function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const H = 0.45;
  const D = 0.11;
  const CENTER_Y = H / 2;
  const BACK_Z = -D / 2;

  const RING_R = 0.152;
  const RING_TUBE = 0.020;

  // Materials
  const matRing = new THREE.MeshStandardMaterial({
    color: 0x3a4d32,
    roughness: 0.85,
    metalness: 0.0
  });
  const matLeafDark = new THREE.MeshStandardMaterial({
    color: 0x3d5434,
    roughness: 0.72,
    metalness: 0.0
  });
  const matLeafSage = new THREE.MeshStandardMaterial({
    color: 0x768970,
    roughness: 0.75,
    metalness: 0.0
  });
  const matRose = new THREE.MeshStandardMaterial({
    color: 0xe8b4b8,
    roughness: 0.65,
    metalness: 0.0
  });
  const matAnemone = new THREE.MeshStandardMaterial({
    color: 0xf2cfd2,
    roughness: 0.6,
    metalness: 0.0
  });
  const matAnemoneCenter = new THREE.MeshStandardMaterial({
    color: 0x3e3a2c,
    roughness: 0.9,
    metalness: 0.0
  });
  const matRanunculus = new THREE.MeshStandardMaterial({
    color: 0xebb9b3,
    roughness: 0.6,
    metalness: 0.0
  });
  const matBerry = new THREE.MeshStandardMaterial({
    color: 0x82946e,
    roughness: 0.5,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx !== undefined) mesh.rotation.set(rx, ry, rz);
    if (sx !== undefined) mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base structural ring (back lies at BACK_Z)
  const ringGeo = new THREE.TorusGeometry(RING_R, RING_TUBE, 14, 32);
  addMesh(
    ringGeo,
    matRing,
    'wreath_base_ring',
    0,
    CENTER_Y,
    BACK_Z + RING_TUBE
  );

  // 2. Hanging loop at top
  const loopGeo = new THREE.TorusGeometry(0.016, 0.0025, 8, 20);
  addMesh(
    loopGeo,
    matRing,
    'hanging_loop',
    0,
    H - 0.018,
    BACK_Z + 0.006,
    0,
    0,
    0,
    0.55,
    1.1,
    1.0
  );

  // Shared flower geometries
  // Rose: multi-tiered cup profile via LatheGeometry
  const rosePoints = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.018, 0.002),
    new THREE.Vector2(0.032, 0.012),
    new THREE.Vector2(0.036, 0.024),
    new THREE.Vector2(0.028, 0.028),
    new THREE.Vector2(0.022, 0.020),
    new THREE.Vector2(0.016, 0.029),
    new THREE.Vector2(0.009, 0.024),
    new THREE.Vector2(0.004, 0.028),
    new THREE.Vector2(0.000, 0.022)
  ];
  const roseGeo = new THREE.LatheGeometry(rosePoints, 20);

  // Anemone petals: wide shallow cup
  const anemonePoints = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.014, 0.003),
    new THREE.Vector2(0.028, 0.010),
    new THREE.Vector2(0.033, 0.016),
    new THREE.Vector2(0.024, 0.015),
    new THREE.Vector2(0.010, 0.008),
    new THREE.Vector2(0.000, 0.006)
  ];
  const anemoneGeo = new THREE.LatheGeometry(anemonePoints, 16);
  const anemoneCenterGeo = new THREE.SphereGeometry(0.010, 12, 10);

  // Ranunculus: compact rounded bud
  const ranunculusGeo = new THREE.SphereGeometry(0.021, 14, 12);

  // 3. Large Roses (6 around the ring)
  const roseAngles = [1.45, 2.55, 3.65, 4.75, 5.70, 0.48];
  roseAngles.forEach((ang, i) => {
    const r = RING_R + 0.004;
    const x = Math.cos(ang) * r;
    const y = CENTER_Y + Math.sin(ang) * r;
    const z = BACK_Z + 0.042;
    addMesh(
      roseGeo,
      matRose,
      `blush_rose_${i + 1}`,
      x,
      y,
      z,
      Math.PI / 2 - Math.sin(ang) * 0.18,
      Math.cos(ang) * 0.18,
      0,
      1.05,
      1.0,
      1.05
    );
  });

  // 4. Anemone Flowers with dark centers (5 around the ring)
  const anemoneAngles = [2.05, 3.10, 4.20, 5.20, 0.95];
  anemoneAngles.forEach((ang, i) => {
    const r = RING_R - 0.006;
    const x = Math.cos(ang) * r;
    const y = CENTER_Y + Math.sin(ang) * r;
    const z = BACK_Z + 0.044;
    const rx = Math.PI / 2 - Math.sin(ang) * 0.2;
    const ry = Math.cos(ang) * 0.2;

    addMesh(
      anemoneGeo,
      matAnemone,
      `anemone_petals_${i + 1}`,
      x,
      y,
      z,
      rx,
      ry,
      0
    );
    addMesh(
      anemoneCenterGeo,
      matAnemoneCenter,
      `anemone_center_${i + 1}`,
      x + Math.cos(ang) * 0.002,
      y + Math.sin(ang) * 0.002,
      z + 0.009,
      0,
      0,
      0,
      1.0,
      1.0,
      0.55
    );
  });

  // 5. Ranunculus buds (6 smaller blooms)
  const ranunculusAngles = [1.75, 2.30, 3.38, 4.45, 5.45, 0.15];
  ranunculusAngles.forEach((ang, i) => {
    const r = RING_R + 0.032;
    const x = Math.cos(ang) * r;
    const y = CENTER_Y + Math.sin(ang) * r;
    const z = BACK_Z + 0.036;
    addMesh(
      ranunculusGeo,
      matRanunculus,
      `ranunculus_bud_${i + 1}`,
      x,
      y,
      z,
      0,
      0,
      0,
      1.0,
      1.0,
      0.72
    );
  });

  // 6. Leaves (10 pointed leaves around outer and inner edges)
  const leafGeo = new THREE.SphereGeometry(0.024, 10, 8);
  const leafConfigs = [
    { ang: 0.70, rOff: 0.048, sage: true },
    { ang: 1.22, rOff: 0.046, sage: false },
    { ang: 1.90, rOff: 0.048, sage: true },
    { ang: 2.82, rOff: 0.050, sage: false },
    { ang: 3.48, rOff: 0.048, sage: true },
    { ang: 4.02, rOff: 0.046, sage: false },
    { ang: 4.95, rOff: 0.048, sage: true },
    { ang: 5.95, rOff: 0.050, sage: false },
    { ang: 0.30, rOff: -0.032, sage: false },
    { ang: 2.65, rOff: -0.032, sage: true }
  ];

  leafConfigs.forEach((cfg, i) => {
    const r = RING_R + cfg.rOff;
    const x = Math.cos(cfg.ang) * r;
    const y = CENTER_Y + Math.sin(cfg.ang) * r;
    const z = BACK_Z + 0.022;
    addMesh(
      leafGeo,
      cfg.sage ? matLeafSage : matLeafDark,
      `foliage_leaf_${i + 1}`,
      x,
      y,
      z,
      0.15,
      0.1,
      cfg.ang,
      1.25,
      0.52,
      0.18
    );
  });

  // 7. Berry clusters (5 small sage-olive clusters)
  const berryGeo = new THREE.SphereGeometry(0.011, 8, 8);
  const berryAngles = [1.15, 2.95, 3.85, 5.05, 6.05];
  berryAngles.forEach((ang, i) => {
    const r = RING_R + 0.036;
    const x = Math.cos(ang) * r;
    const y = CENTER_Y + Math.sin(ang) * r;
    const z = BACK_Z + 0.038;
    addMesh(
      berryGeo,
      matBerry,
      `berry_cluster_${i + 1}`,
      x,
      y,
      z,
      0,
      0,
      0,
      1.1,
      1.1,
      0.9
    );
  });

  return group;
}
