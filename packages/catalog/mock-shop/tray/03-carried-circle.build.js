function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const DIAM = 0.42;
  const RADIUS = DIAM / 2;
  const H = 0.046;
  const BASE_THICK = 0.004;
  const WALL_THICK = 0.004;
  const HANDLE_BOT_H = 0.018;
  const HANDLE_TOP_Y = 0.034;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xa6894c,
    roughness: 0.34,
    metalness: 0.86,
  });

  const etchedBrassMat = new THREE.MeshStandardMaterial({
    color: 0x5c4924,
    roughness: 0.55,
    metalness: 0.72,
  });

  // 1. Flat circular base
  const baseGeo = new THREE.CylinderGeometry(
    RADIUS - 0.005,
    RADIUS - 0.009,
    BASE_THICK,
    32
  );
  const baseMesh = new THREE.Mesh(baseGeo, brassMat);
  baseMesh.name = 'tray_base';
  baseMesh.position.y = BASE_THICK / 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Rim profile points for LatheGeometry (full height with rolled top lip)
  const fullRimPoints = [
    new THREE.Vector2(RADIUS - 0.009, 0.0),
    new THREE.Vector2(RADIUS - 0.004, 0.004),
    new THREE.Vector2(RADIUS - 0.001, H - 0.005),
    new THREE.Vector2(RADIUS + 0.002, H - 0.002),
    new THREE.Vector2(RADIUS, H),
    new THREE.Vector2(RADIUS - WALL_THICK, H - 0.001),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.002, H - 0.005),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.005, BASE_THICK),
    new THREE.Vector2(RADIUS - 0.009, BASE_THICK),
  ];

  // Front (+Z) and Back (-Z) full-height rim arcs
  const rimArcConfigs = [
    { name: 'rim_front_arc', start: -0.4 * Math.PI, len: 0.8 * Math.PI },
    { name: 'rim_back_arc', start: 0.6 * Math.PI, len: 0.8 * Math.PI },
  ];

  for (const cfg of rimArcConfigs) {
    const geo = new THREE.LatheGeometry(fullRimPoints, 28, cfg.start, cfg.len);
    const mesh = new THREE.Mesh(geo, brassMat);
    mesh.name = cfg.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 3. Handle cutout sections at +X (0.4*PI to 0.6*PI) and -X (1.4*PI to 1.6*PI)
  const handleLowerPoints = [
    new THREE.Vector2(RADIUS - 0.009, 0.0),
    new THREE.Vector2(RADIUS - 0.004, 0.004),
    new THREE.Vector2(RADIUS - 0.002, HANDLE_BOT_H),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.003, HANDLE_BOT_H),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.005, BASE_THICK),
    new THREE.Vector2(RADIUS - 0.009, BASE_THICK),
  ];

  const handleUpperPoints = [
    new THREE.Vector2(RADIUS - 0.001, HANDLE_TOP_Y),
    new THREE.Vector2(RADIUS + 0.002, H - 0.002),
    new THREE.Vector2(RADIUS, H),
    new THREE.Vector2(RADIUS - WALL_THICK, H - 0.001),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.002, HANDLE_TOP_Y),
    new THREE.Vector2(RADIUS - 0.001, HANDLE_TOP_Y),
  ];

  const handleConfigs = [
    { side: 'right', start: 0.4 * Math.PI, len: 0.2 * Math.PI },
    { side: 'left', start: 1.4 * Math.PI, len: 0.2 * Math.PI },
  ];

  for (const hCfg of handleConfigs) {
    const lowerGeo = new THREE.LatheGeometry(handleLowerPoints, 10, hCfg.start, hCfg.len);
    const lowerMesh = new THREE.Mesh(lowerGeo, brassMat);
    lowerMesh.name = `handle_lower_${hCfg.side}`;
    lowerMesh.castShadow = true;
    lowerMesh.receiveShadow = true;
    group.add(lowerMesh);

    const upperGeo = new THREE.LatheGeometry(handleUpperPoints, 10, hCfg.start, hCfg.len);
    const upperMesh = new THREE.Mesh(upperGeo, brassMat);
    upperMesh.name = `handle_upper_${hCfg.side}`;
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    group.add(upperMesh);
  }

  // 4. Engraved geometric medallion in the center of the tray floor
  const MEDALLION_R = RADIUS * 0.56;
  const ENGRAVE_Y = BASE_THICK + 0.0003;

  const ringRadii = [MEDALLION_R, MEDALLION_R * 0.92, MEDALLION_R * 0.55, MEDALLION_R * 0.22];
  ringRadii.forEach((r, idx) => {
    const ringGeo = new THREE.TorusGeometry(r, 0.0008, 6, 32);
    const ringMesh = new THREE.Mesh(ringGeo, etchedBrassMat);
    ringMesh.name = `engraved_ring_${idx + 1}`;
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.scale.z = 0.35;
    ringMesh.position.y = ENGRAVE_Y;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    group.add(ringMesh);
  });

  // Radial geometric star bars
  const NUM_SPOKES = 6;
  const spokeGeo = new THREE.BoxGeometry(MEDALLION_R * 1.82, 0.0005, 0.0016);
  for (let i = 0; i < NUM_SPOKES; i++) {
    const spoke = new THREE.Mesh(spokeGeo, etchedBrassMat);
    spoke.name = `engraved_spoke_${i + 1}`;
    spoke.position.y = ENGRAVE_Y;
    spoke.rotation.y = (i * Math.PI) / NUM_SPOKES;
    spoke.castShadow = true;
    spoke.receiveShadow = true;
    group.add(spoke);
  }

  return group;
}
