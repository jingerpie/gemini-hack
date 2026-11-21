function build(THREE) {
  const group = new THREE.Group();

  const OUTER_D = 0.28;
  const OUTER_R = OUTER_D / 2;
  const CENTER_Y = OUTER_R;
  const RING_R = 0.096;
  const TUBE_R = 0.020;
  const DEPTH = 0.060;
  const BACK_Z = -DEPTH / 2;

  const matBase = new THREE.MeshStandardMaterial({
    color: 0xd8cbb8,
    roughness: 0.85,
    metalness: 0.0
  });
  const matScallopLight = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.55,
    metalness: 0.02
  });
  const matScallopWarm = new THREE.MeshStandardMaterial({
    color: 0xe6dac8,
    roughness: 0.6,
    metalness: 0.02
  });
  const matWhelk = new THREE.MeshStandardMaterial({
    color: 0xede3d2,
    roughness: 0.5,
    metalness: 0.03
  });
  const matLoop = new THREE.MeshStandardMaterial({
    color: 0xe8dfd1,
    roughness: 0.9,
    metalness: 0.0
  });

  // 1. Base torus ring (flattened against the back plane)
  const baseGeo = new THREE.TorusGeometry(RING_R, TUBE_R, 12, 32);
  baseGeo.scale(1, 1, 0.55);
  const baseMesh = new THREE.Mesh(baseGeo, matBase);
  baseMesh.name = 'wreath_base_ring';
  baseMesh.position.set(0, CENTER_Y, BACK_Z + TUBE_R * 0.55);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Hanging fabric loop at top-back
  const loopGeo = new THREE.TorusGeometry(0.014, 0.0025, 8, 20);
  loopGeo.scale(0.65, 1.2, 0.5);
  const loopMesh = new THREE.Mesh(loopGeo, matLoop);
  loopMesh.name = 'hanging_loop';
  loopMesh.position.set(0, OUTER_D - 0.018, BACK_Z + 0.003);
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  // 3. Scallop shell geometry (fan-shaped dome)
  const scallopGeo = new THREE.SphereGeometry(0.024, 12, 8, 0, Math.PI, 0, Math.PI * 0.55);
  scallopGeo.scale(1.05, 1.15, 0.42);

  const SCALLOP_COUNT = 18;
  for (let i = 0; i < SCALLOP_COUNT; i++) {
    const angle = (i / SCALLOP_COUNT) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const r = isOuter ? RING_R + 0.015 : RING_R - 0.012;
    const x = Math.cos(angle) * r;
    const y = CENTER_Y + Math.sin(angle) * r;
    const z = BACK_Z + 0.024 + (i % 3) * 0.003;

    const scallop = new THREE.Mesh(
      scallopGeo,
      i % 2 === 0 ? matScallopLight : matScallopWarm
    );
    scallop.name = `scallop_shell_${i + 1}`;
    scallop.position.set(x, y, z);
    scallop.rotation.z = angle - Math.PI / 2;
    scallop.rotation.x = isOuter ? 0.25 : -0.2;
    scallop.castShadow = true;
    scallop.receiveShadow = true;
    group.add(scallop);
  }

  // 4. Spiral whelk shell geometry via LatheGeometry
  const whelkPoints = [
    new THREE.Vector2(0.000, -0.020),
    new THREE.Vector2(0.006, -0.014),
    new THREE.Vector2(0.011, -0.006),
    new THREE.Vector2(0.009, -0.002),
    new THREE.Vector2(0.013, 0.004),
    new THREE.Vector2(0.008, 0.010),
    new THREE.Vector2(0.010, 0.014),
    new THREE.Vector2(0.004, 0.019),
    new THREE.Vector2(0.000, 0.022)
  ];
  const whelkGeo = new THREE.LatheGeometry(whelkPoints, 14);

  const WHELK_COUNT = 16;
  for (let i = 0; i < WHELK_COUNT; i++) {
    const angle = ((i + 0.5) / WHELK_COUNT) * Math.PI * 2;
    const r = RING_R + (i % 2 === 0 ? 0.002 : -0.004);
    const x = Math.cos(angle) * r;
    const y = CENTER_Y + Math.sin(angle) * r;
    const z = BACK_Z + 0.038 + (i % 2) * 0.004;

    const whelk = new THREE.Mesh(whelkGeo, matWhelk);
    whelk.name = `whelk_shell_${i + 1}`;
    whelk.position.set(x, y, z);
    whelk.rotation.z = angle + (i % 2 === 0 ? 0.4 : -0.4);
    whelk.rotation.x = 0.35;
    whelk.castShadow = true;
    whelk.receiveShadow = true;
    group.add(whelk);
  }

  return group;
}
