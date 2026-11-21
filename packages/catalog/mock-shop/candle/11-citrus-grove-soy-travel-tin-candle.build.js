function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.086;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.056;
  const WALL_THICKNESS = 0.003;
  const SPLIT_H = 0.024;
  const WAX_H = 0.042;
  const WICK_H = 0.008;
  const WICK_R = 0.0012;
  const FLAME_H = 0.014;
  const FLAME_R = 0.0035;
  const RADIAL_SEGMENTS = 32;

  const matLower = new THREE.MeshStandardMaterial({
    color: 0x8c7f60,
    roughness: 0.65,
    metalness: 0.05
  });

  const matUpper = new THREE.MeshStandardMaterial({
    color: 0x91644f,
    roughness: 0.7,
    metalness: 0.05
  });

  const matWax = new THREE.MeshStandardMaterial({
    color: 0xf2ebd9,
    roughness: 0.55,
    metalness: 0.0
  });

  const matWick = new THREE.MeshStandardMaterial({
    color: 0xe3d8be,
    roughness: 0.9,
    metalness: 0.0
  });

  const matFlame = new THREE.MeshStandardMaterial({
    color: 0xffcc55,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // Lower vessel body (olive/taupe)
  const lowerPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS * 0.72, 0),
    new THREE.Vector2(RADIUS * 0.86, 0.004),
    new THREE.Vector2(RADIUS * 0.96, 0.012),
    new THREE.Vector2(RADIUS, SPLIT_H),
    new THREE.Vector2(RADIUS - WALL_THICKNESS, SPLIT_H),
    new THREE.Vector2(RADIUS * 0.85 - WALL_THICKNESS, 0.005),
    new THREE.Vector2(0, 0.005)
  ];
  const lowerGeo = new THREE.LatheGeometry(lowerPoints, RADIAL_SEGMENTS);
  const lowerMesh = new THREE.Mesh(lowerGeo, matLower);
  lowerMesh.name = 'vessel_lower';
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  group.add(lowerMesh);

  // Upper vessel body & rolled rim (terracotta)
  const upperPoints = [
    new THREE.Vector2(RADIUS - WALL_THICKNESS, SPLIT_H),
    new THREE.Vector2(RADIUS, SPLIT_H),
    new THREE.Vector2(RADIUS * 0.99, 0.036),
    new THREE.Vector2(RADIUS * 0.95, 0.047),
    new THREE.Vector2(RADIUS * 0.97, 0.053),
    new THREE.Vector2(RADIUS * 0.955, HEIGHT),
    new THREE.Vector2(RADIUS * 0.92, HEIGHT),
    new THREE.Vector2(RADIUS * 0.90, 0.052),
    new THREE.Vector2(RADIUS * 0.91, 0.044),
    new THREE.Vector2(RADIUS - WALL_THICKNESS, SPLIT_H)
  ];
  const upperGeo = new THREE.LatheGeometry(upperPoints, RADIAL_SEGMENTS);
  const upperMesh = new THREE.Mesh(upperGeo, matUpper);
  upperMesh.name = 'vessel_upper';
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  group.add(upperMesh);

  // Soy wax fill
  const waxRadius = RADIUS * 0.915;
  const waxGeo = new THREE.CylinderGeometry(waxRadius, waxRadius, WAX_H - 0.005, RADIAL_SEGMENTS);
  const waxMesh = new THREE.Mesh(waxGeo, matWax);
  waxMesh.name = 'soy_wax';
  waxMesh.position.y = 0.005 + (WAX_H - 0.005) / 2;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // Cotton wick
  const wickGeo = new THREE.CylinderGeometry(WICK_R * 0.85, WICK_R, WICK_H, 12);
  const wickMesh = new THREE.Mesh(wickGeo, matWick);
  wickMesh.name = 'candle_wick';
  wickMesh.position.y = WAX_H + WICK_H / 2 - 0.001;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // Lit flame teardrop
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.7, FLAME_H * 0.15),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.65),
    new THREE.Vector2(FLAME_R * 0.25, FLAME_H * 0.88),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, matFlame);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = WAX_H + WICK_H - 0.002;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
