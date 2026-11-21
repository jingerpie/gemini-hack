function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.090;
  const MAX_R = 0.048;
  const RIM_R = 0.041;
  const FOOT_R = 0.029;
  const WALL_T = 0.004;
  const WAX_H = 0.072;
  const WICK_H = 0.010;
  const FLAME_H = 0.014;
  const SEGMENTS = 32;

  // Materials
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0x9c523b,
    roughness: 0.92,
    metalness: 0.0
  });

  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc85518,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2e6d0,
    roughness: 0.65,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x2b211a,
    roughness: 0.95,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffcc55,
    emissive: 0xff8811,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // 1. Unglazed terracotta lower body & foot
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FOOT_R, 0.0),
    new THREE.Vector2(FOOT_R + 0.001, 0.004),
    new THREE.Vector2(MAX_R, 0.015),
    new THREE.Vector2(MAX_R - 0.002, 0.042),
    new THREE.Vector2(MAX_R - WALL_T - 0.002, 0.042),
    new THREE.Vector2(MAX_R - WALL_T - 0.002, 0.010),
    new THREE.Vector2(0.0, 0.010)
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, SEGMENTS);
  const baseMesh = new THREE.Mesh(baseGeo, terracottaMat);
  baseMesh.name = 'terracotta_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Glazed upper body, rim, and inner wall
  const glazePoints = [
    new THREE.Vector2(MAX_R - 0.002, 0.040),
    new THREE.Vector2(MAX_R - 0.0018, 0.042),
    new THREE.Vector2(RIM_R, H - 0.002),
    new THREE.Vector2(RIM_R - 0.001, H),
    new THREE.Vector2(RIM_R - WALL_T * 0.5, H),
    new THREE.Vector2(RIM_R - WALL_T, H - 0.002),
    new THREE.Vector2(RIM_R - WALL_T, WAX_H - 0.004),
    new THREE.Vector2(MAX_R - WALL_T - 0.002, 0.040)
  ];
  const glazeGeo = new THREE.LatheGeometry(glazePoints, SEGMENTS);
  const glazeMesh = new THREE.Mesh(glazeGeo, glazeMat);
  glazeMesh.name = 'glazed_upper_body';
  glazeMesh.castShadow = true;
  glazeMesh.receiveShadow = true;
  group.add(glazeMesh);

  // 3. Candle wax fill
  const waxR = RIM_R - WALL_T + 0.001;
  const waxGeo = new THREE.CylinderGeometry(waxR, waxR, 0.012, SEGMENTS);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'wax_fill';
  waxMesh.position.y = WAX_H - 0.006;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 4. Wick
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0015, WICK_H, 12);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'wick';
  wickMesh.position.y = WAX_H + WICK_H * 0.5 - 0.001;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // 5. Lit flame (teardrop)
  const flamePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.0032, FLAME_H * 0.25),
    new THREE.Vector2(0.0028, FLAME_H * 0.55),
    new THREE.Vector2(0.0012, FLAME_H * 0.85),
    new THREE.Vector2(0.0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = WAX_H + WICK_H - 0.002;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
