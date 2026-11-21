function build(THREE) {
  const group = new THREE.Group();

  const CUP_SPECS = [
    { r: 0.048, h: 0.092, wall: 0.0065, base: 0.009 },
    { r: 0.041, h: 0.080, wall: 0.0060, base: 0.008 },
    { r: 0.035, h: 0.070, wall: 0.0055, base: 0.007 },
    { r: 0.029, h: 0.060, wall: 0.0050, base: 0.006 },
    { r: 0.024, h: 0.052, wall: 0.0045, base: 0.005 },
  ];
  const GAP = 0.012;
  const SEGMENTS = 32;

  const TOTAL_W =
    CUP_SPECS.reduce((sum, c) => sum + c.r * 2, 0) + GAP * (CUP_SPECS.length - 1);

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xd97d48,
    roughness: 0.58,
    metalness: 0.02,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.65,
    metalness: 0.0,
  });

  let cursorX = -TOTAL_W / 2;

  CUP_SPECS.forEach((spec, idx) => {
    const { r, h, wall, base } = spec;
    const rIn = r - wall;
    const bottomBevel = r * 0.22;
    const rimBevel = wall * 0.35;
    const cx = cursorX + r;

    // Outer painted shell
    const outerPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(r - bottomBevel, 0),
      new THREE.Vector2(r - bottomBevel * 0.45, bottomBevel * 0.15),
      new THREE.Vector2(r - bottomBevel * 0.12, bottomBevel * 0.5),
      new THREE.Vector2(r, bottomBevel),
      new THREE.Vector2(r, h - rimBevel),
    ];
    const outerGeo = new THREE.LatheGeometry(outerPts, SEGMENTS);
    const outerMesh = new THREE.Mesh(outerGeo, terracottaMat);
    outerMesh.name = `cup_${idx + 1}_outer`;
    outerMesh.position.set(cx, 0, 0);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    group.add(outerMesh);

    // Inner natural wood liner + rounded rim
    const innerPts = [
      new THREE.Vector2(r, h - rimBevel),
      new THREE.Vector2(r - rimBevel * 0.3, h - rimBevel * 0.15),
      new THREE.Vector2(r - rimBevel, h),
      new THREE.Vector2(rIn + rimBevel, h),
      new THREE.Vector2(rIn + rimBevel * 0.3, h - rimBevel * 0.15),
      new THREE.Vector2(rIn, h - rimBevel),
      new THREE.Vector2(rIn, base + 0.003),
      new THREE.Vector2(rIn - 0.003, base),
      new THREE.Vector2(0, base),
    ];
    const innerGeo = new THREE.LatheGeometry(innerPts, SEGMENTS);
    const innerMesh = new THREE.Mesh(innerGeo, woodMat);
    innerMesh.name = `cup_${idx + 1}_inner`;
    innerMesh.position.set(cx, 0, 0);
    innerMesh.castShadow = true;
    innerMesh.receiveShadow = true;
    group.add(innerMesh);

    cursorX += r * 2 + GAP;
  });

  return group;
}
