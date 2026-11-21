function build(THREE) {
  const group = new THREE.Group();

  const RADIUS = 0.04;
  const HEIGHT = 0.13;
  const BEVEL = 0.0025;
  const WICK_H = 0.014;
  const WICK_R = 0.0014;
  const FLAME_H = 0.022;
  const FLAME_R = 0.0045;

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xc9961c,
    roughness: 0.65,
    metalness: 0.0,
  });

  const poolMat = new THREE.MeshStandardMaterial({
    color: 0xb88214,
    roughness: 0.35,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6cc,
    roughness: 0.9,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffbb44,
    emissive: 0xff8811,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Main beeswax pillar body with subtle top/bottom bevels
  const pillarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS - BEVEL, 0),
    new THREE.Vector2(RADIUS, BEVEL),
    new THREE.Vector2(RADIUS, HEIGHT - BEVEL),
    new THREE.Vector2(RADIUS - BEVEL, HEIGHT),
    new THREE.Vector2(RADIUS * 0.45, HEIGHT - 0.001),
    new THREE.Vector2(0, HEIGHT - 0.0015),
  ];
  const pillarGeo = new THREE.LatheGeometry(pillarPoints, 28);
  const pillar = new THREE.Mesh(pillarGeo, waxMat);
  pillar.name = "wax_pillar";
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Subtle melted wax pool around the wick
  const poolGeo = new THREE.CylinderGeometry(RADIUS * 0.42, RADIUS * 0.42, 0.001, 24);
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.name = "wax_pool";
  pool.position.y = HEIGHT - 0.001;
  pool.castShadow = true;
  pool.receiveShadow = true;
  group.add(pool);

  // Braided cotton wick with slight natural curve
  const wickCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, HEIGHT - 0.002, 0),
    new THREE.Vector3(0.0005, HEIGHT + WICK_H * 0.5, 0),
    new THREE.Vector3(0.0012, HEIGHT + WICK_H, 0.0003),
  ]);
  const wickGeo = new THREE.TubeGeometry(wickCurve, 8, WICK_R, 8, false);
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.name = "candle_wick";
  wick.castShadow = true;
  wick.receiveShadow = true;
  group.add(wick);

  // Teardrop flame above the wick
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.12),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.32),
    new THREE.Vector2(FLAME_R * 0.72, FLAME_H * 0.62),
    new THREE.Vector2(FLAME_R * 0.25, FLAME_H * 0.86),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.name = "emit_flame";
  flame.position.set(0.0012, HEIGHT + WICK_H - 0.002, 0.0003);
  flame.castShadow = true;
  flame.receiveShadow = true;
  group.add(flame);

  return group;
}
