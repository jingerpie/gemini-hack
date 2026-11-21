function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.095;
  const R = 0.045;
  const WALL = 0.005;
  const R_IN = R - WALL;
  const BASE_H = 0.008;
  const WAX_H = H - 0.014;
  const WICK_W = 0.011;
  const WICK_H = 0.012;
  const WICK_D = 0.0018;
  const WICK_TOP = WAX_H + 0.007;
  const FLAME_H = 0.014;
  const FLAME_R = 0.0035;

  // Materials
  const jarMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29b,
    roughness: 0.85,
    metalness: 0.02,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0dc,
    roughness: 0.7,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x9e6b43,
    roughness: 0.85,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff8c1a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Earth-toned glass jar (LatheGeometry)
  const jarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.014, 0),
    new THREE.Vector2(R - 0.006, 0.002),
    new THREE.Vector2(R - 0.002, 0.006),
    new THREE.Vector2(R, 0.014),
    new THREE.Vector2(R, H - 0.003),
    new THREE.Vector2(R - 0.0015, H),
    new THREE.Vector2(R_IN + 0.0015, H),
    new THREE.Vector2(R_IN, H - 0.003),
    new THREE.Vector2(R_IN, BASE_H),
    new THREE.Vector2(0, BASE_H),
  ];
  const jarGeo = new THREE.LatheGeometry(jarPoints, 32);
  const jarMesh = new THREE.Mesh(jarGeo, jarMat);
  jarMesh.name = 'earth_toned_jar';
  jarMesh.castShadow = true;
  jarMesh.receiveShadow = true;
  group.add(jarMesh);

  // 2. Lavender soy wax fill
  const waxHeight = WAX_H - BASE_H;
  const waxGeo = new THREE.CylinderGeometry(R_IN, R_IN, waxHeight, 32);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'lavender_soy_wax';
  waxMesh.position.y = BASE_H + waxHeight / 2;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 3. Wooden wick
  const wickGeo = new THREE.BoxGeometry(WICK_W, WICK_H, WICK_D);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'wooden_wick';
  wickMesh.position.y = WICK_TOP - WICK_H / 2;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // 4. Lit flame (teardrop)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.15),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.7, FLAME_H * 0.65),
    new THREE.Vector2(FLAME_R * 0.25, FLAME_H * 0.88),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = WICK_TOP - 0.001;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
