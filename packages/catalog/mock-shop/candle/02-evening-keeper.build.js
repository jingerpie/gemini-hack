function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const JAR_R = 0.0425;
  const JAR_H = 0.10;
  const GLASS_THICK = 0.003;
  const GLASS_BASE_H = 0.006;

  const WAX_R = JAR_R - GLASS_THICK - 0.0005;
  const WAX_H = 0.078;

  const WICK_R = 0.0012;
  const WICK_H = 0.012;

  const FLAME_R = 0.0045;
  const FLAME_H = 0.016;

  const LID_R = 0.043;
  const LID_BASE_H = 0.008;
  const LID_PLUG_R = 0.037;
  const LID_PLUG_H = 0.007;
  const SEAL_TUBE_R = 0.0018;

  const JAR_X = -0.05;
  const LID_X = 0.05;
  const RADIAL_SEGMENTS = 32;

  // Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    depthWrite: false
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2ebd9,
    roughness: 0.65,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd8cbb8,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff8c1a,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.0
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc89b67,
    roughness: 0.55,
    metalness: 0.0
  });

  const sealMat = new THREE.MeshStandardMaterial({
    color: 0xe6e6e0,
    roughness: 0.4,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85
  });

  // 1. Glass Jar (LatheGeometry for wall, base, and rounded rim)
  const jarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(JAR_R - 0.002, 0),
    new THREE.Vector2(JAR_R, 0.002),
    new THREE.Vector2(JAR_R, JAR_H - 0.002),
    new THREE.Vector2(JAR_R - GLASS_THICK * 0.5, JAR_H),
    new THREE.Vector2(JAR_R - GLASS_THICK, JAR_H - 0.002),
    new THREE.Vector2(JAR_R - GLASS_THICK, GLASS_BASE_H),
    new THREE.Vector2(0, GLASS_BASE_H)
  ];
  const jarGeo = new THREE.LatheGeometry(jarPoints, RADIAL_SEGMENTS);
  const jarMesh = new THREE.Mesh(jarGeo, glassMat);
  jarMesh.name = 'glass_jar';
  jarMesh.position.set(JAR_X, 0, 0);
  jarMesh.castShadow = true;
  jarMesh.receiveShadow = true;
  group.add(jarMesh);

  // 2. Candle Wax
  const waxGeo = new THREE.CylinderGeometry(WAX_R, WAX_R, WAX_H, RADIAL_SEGMENTS);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'candle_wax';
  waxMesh.position.set(JAR_X, GLASS_BASE_H + WAX_H / 2, 0);
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 3. Cotton Wick
  const wickGeo = new THREE.CylinderGeometry(WICK_R * 0.8, WICK_R, WICK_H, 12);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'candle_wick';
  wickMesh.position.set(JAR_X, GLASS_BASE_H + WAX_H + WICK_H / 2 - 0.001, 0);
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // 4. Lit Flame (teardrop via LatheGeometry)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.2),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.45),
    new THREE.Vector2(FLAME_R * 0.65, FLAME_H * 0.75),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.set(JAR_X, GLASS_BASE_H + WAX_H + WICK_H - 0.002, 0);
  flameMesh.castShadow = false;
  flameMesh.receiveShadow = false;
  group.add(flameMesh);

  // 5. Wooden Lid (resting upside-down beside the jar)
  const lidBaseGeo = new THREE.CylinderGeometry(LID_R, LID_R - 0.001, LID_BASE_H, RADIAL_SEGMENTS);
  const lidBaseMesh = new THREE.Mesh(lidBaseGeo, woodMat);
  lidBaseMesh.name = 'wooden_lid_base';
  lidBaseMesh.position.set(LID_X, LID_BASE_H / 2, 0);
  lidBaseMesh.castShadow = true;
  lidBaseMesh.receiveShadow = true;
  group.add(lidBaseMesh);

  const lidPlugGeo = new THREE.CylinderGeometry(LID_PLUG_R, LID_PLUG_R, LID_PLUG_H, RADIAL_SEGMENTS);
  const lidPlugMesh = new THREE.Mesh(lidPlugGeo, woodMat);
  lidPlugMesh.name = 'wooden_lid_plug';
  lidPlugMesh.position.set(LID_X, LID_BASE_H + LID_PLUG_H / 2, 0);
  lidPlugMesh.castShadow = true;
  lidPlugMesh.receiveShadow = true;
  group.add(lidPlugMesh);

  // 6. Silicone Sealing Ring on Lid Plug
  const sealGeo = new THREE.TorusGeometry(LID_PLUG_R + SEAL_TUBE_R * 0.4, SEAL_TUBE_R, 12, RADIAL_SEGMENTS);
  const sealMesh = new THREE.Mesh(sealGeo, sealMat);
  sealMesh.name = 'lid_silicone_seal';
  sealMesh.rotation.x = Math.PI / 2;
  sealMesh.position.set(LID_X, LID_BASE_H + LID_PLUG_H * 0.5, 0);
  sealMesh.castShadow = true;
  sealMesh.receiveShadow = true;
  group.add(sealMesh);

  return group;
}
