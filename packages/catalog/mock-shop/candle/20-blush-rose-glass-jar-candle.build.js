function build(THREE) {
  const group = new THREE.Group();

  const JAR_RADIUS = 0.06;
  const NECK_RADIUS = 0.046;
  const JAR_HEIGHT = 0.095;
  const WALL_THICKNESS = 0.003;
  const WAX_TOP_Y = 0.072;
  const LID_RADIUS = 0.048;
  const LID_HEIGHT = 0.012;
  const WICK_HEIGHT = 0.008;
  const WICK_RADIUS = 0.0012;
  const WICK_OFFSET = 0.014;
  const FLAME_HEIGHT = 0.011;
  const FLAME_RADIUS = 0.0032;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4c6c8,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xe8b9bc,
    roughness: 0.72,
    metalness: 0.0
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0xc9cccf,
    roughness: 0.28,
    metalness: 0.85
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd6ccbe,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffd27d,
    emissive: 0xffaa33,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // 1. Glass Jar (LatheGeometry)
  const jarPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.036, 0.0),
    new THREE.Vector2(0.046, 0.006),
    new THREE.Vector2(0.055, 0.022),
    new THREE.Vector2(JAR_RADIUS, 0.045),
    new THREE.Vector2(0.058, 0.068),
    new THREE.Vector2(0.051, 0.084),
    new THREE.Vector2(NECK_RADIUS, JAR_HEIGHT)
  ];
  const jarGeo = new THREE.LatheGeometry(jarPoints, 32);
  const jarMesh = new THREE.Mesh(jarGeo, glassMat);
  jarMesh.name = 'glass_jar';
  jarMesh.castShadow = true;
  jarMesh.receiveShadow = true;
  group.add(jarMesh);

  // 2. Wax Fill (LatheGeometry)
  const waxPoints = [
    new THREE.Vector2(0.0, 0.005),
    new THREE.Vector2(0.042, 0.006),
    new THREE.Vector2(0.051, 0.022),
    new THREE.Vector2(JAR_RADIUS - WALL_THICKNESS, 0.045),
    new THREE.Vector2(0.055 - WALL_THICKNESS, WAX_TOP_Y),
    new THREE.Vector2(0.0, WAX_TOP_Y)
  ];
  const waxGeo = new THREE.LatheGeometry(waxPoints, 32);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'candle_wax';
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 3. Embossed floral/petal details on the glass exterior
  const petalGeo = new THREE.SphereGeometry(0.014, 16, 12);
  const petalAngles = [0, 1.05, 2.1, 3.14, 4.19, 5.24];
  for (let i = 0; i < petalAngles.length; i++) {
    const angle = petalAngles[i];
    const yPos = i % 2 === 0 ? 0.048 : 0.036;
    const rPos = i % 2 === 0 ? JAR_RADIUS - 0.004 : 0.057;
    const petal = new THREE.Mesh(petalGeo, glassMat);
    petal.name = `embossed_petal_${i + 1}`;
    petal.position.set(Math.cos(angle) * rPos, yPos, Math.sin(angle) * rPos);
    petal.rotation.y = -angle;
    petal.scale.set(0.35, 1.0, 1.15);
    petal.castShadow = true;
    petal.receiveShadow = true;
    group.add(petal);
  }

  // 4. Three Wicks and Flames
  const wickGeo = new THREE.CylinderGeometry(WICK_RADIUS, WICK_RADIUS, WICK_HEIGHT, 8);
  const flamePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FLAME_RADIUS, FLAME_HEIGHT * 0.35),
    new THREE.Vector2(FLAME_RADIUS * 0.65, FLAME_HEIGHT * 0.7),
    new THREE.Vector2(0.0, FLAME_HEIGHT)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 12);

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const wx = Math.cos(angle) * WICK_OFFSET;
    const wz = Math.sin(angle) * WICK_OFFSET;

    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.name = `candle_wick_${i + 1}`;
    wick.position.set(wx, WAX_TOP_Y + WICK_HEIGHT / 2, wz);
    wick.castShadow = true;
    wick.receiveShadow = true;
    group.add(wick);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.name = `emit_flame_${i + 1}`;
    flame.position.set(wx, WAX_TOP_Y + WICK_HEIGHT - 0.001, wz);
    flame.castShadow = true;
    flame.receiveShadow = true;
    group.add(flame);
  }

  // 5. Brushed Metal Lid
  const lidGeo = new THREE.CylinderGeometry(LID_RADIUS, LID_RADIUS, LID_HEIGHT, 32);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.name = 'metal_lid';
  lidMesh.position.y = JAR_HEIGHT + LID_HEIGHT / 2 - 0.002;
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  group.add(lidMesh);

  return group;
}
