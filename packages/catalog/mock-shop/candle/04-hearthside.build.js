function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const JAR_R = 0.044;
  const JAR_H = 0.105;
  const NECK_R = 0.039;
  const NECK_H = 0.018;
  const BASE_THICK = 0.005;
  const WAX_R = 0.0405;
  const WAX_H = 0.080;
  const LABEL_H = 0.048;
  const WICK_R = 0.0013;
  const WICK_H = 0.011;
  const FLAME_R = 0.0038;
  const FLAME_H = 0.015;
  const LID_R = 0.042;
  const LID_H = 0.012;

  const JAR_X = -0.018;
  const SEGMENTS = 32;

  // Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2ebd9,
    roughness: 0.72,
    metalness: 0.0
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d0,
    roughness: 0.88,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xc8bca4,
    roughness: 0.95,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffcc55,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0xa8a399,
    roughness: 0.32,
    metalness: 0.85
  });

  // 1. Glass Jar (LatheGeometry)
  const bodyTopY = JAR_H - NECK_H;
  const jarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(JAR_R - 0.004, 0),
    new THREE.Vector2(JAR_R, 0.005),
    new THREE.Vector2(JAR_R, bodyTopY - 0.006),
    new THREE.Vector2(NECK_R, bodyTopY),
    new THREE.Vector2(NECK_R, JAR_H - 0.002),
    new THREE.Vector2(NECK_R + 0.0015, JAR_H - 0.001),
    new THREE.Vector2(NECK_R - 0.002, JAR_H),
    new THREE.Vector2(NECK_R - 0.0035, JAR_H - 0.002),
    new THREE.Vector2(NECK_R - 0.0035, bodyTopY),
    new THREE.Vector2(JAR_R - 0.003, bodyTopY - 0.006),
    new THREE.Vector2(JAR_R - 0.003, BASE_THICK + 0.003),
    new THREE.Vector2(0, BASE_THICK)
  ];
  const jarGeo = new THREE.LatheGeometry(jarPoints, SEGMENTS);
  const jarMesh = new THREE.Mesh(jarGeo, glassMat);
  jarMesh.name = 'glass_jar';
  jarMesh.position.x = JAR_X;
  jarMesh.castShadow = true;
  jarMesh.receiveShadow = true;
  group.add(jarMesh);

  // Thread rings on neck
  for (let i = 0; i < 2; i++) {
    const threadGeo = new THREE.TorusGeometry(NECK_R + 0.0008, 0.0011, 8, SEGMENTS);
    const threadMesh = new THREE.Mesh(threadGeo, glassMat);
    threadMesh.name = `jar_thread_${i + 1}`;
    threadMesh.rotation.x = Math.PI / 2;
    threadMesh.position.set(JAR_X, bodyTopY + 0.005 + i * 0.006, 0);
    threadMesh.castShadow = true;
    threadMesh.receiveShadow = true;
    group.add(threadMesh);
  }

  // 2. Wax Body
  const waxGeo = new THREE.CylinderGeometry(WAX_R, WAX_R, WAX_H, SEGMENTS);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'wax_body';
  waxMesh.position.set(JAR_X, BASE_THICK + WAX_H / 2, 0);
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 3. Paper Label (curved front wrap)
  const labelGeo = new THREE.CylinderGeometry(
    JAR_R + 0.0005,
    JAR_R + 0.0005,
    LABEL_H,
    SEGMENTS,
    1,
    true,
    -0.68,
    1.36
  );
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.name = 'paper_label';
  labelMesh.position.set(JAR_X, BASE_THICK + WAX_H * 0.46, 0);
  labelMesh.castShadow = true;
  labelMesh.receiveShadow = true;
  group.add(labelMesh);

  // 4. Wick
  const waxTopY = BASE_THICK + WAX_H;
  const wickGeo = new THREE.CylinderGeometry(WICK_R, WICK_R, WICK_H, 12);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'wick';
  wickMesh.position.set(JAR_X, waxTopY + WICK_H / 2 - 0.001, 0);
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // 5. Lit Flame (teardrop LatheGeometry)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.85, FLAME_H * 0.2),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.42),
    new THREE.Vector2(FLAME_R * 0.6, FLAME_H * 0.72),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.set(JAR_X, waxTopY + WICK_H - 0.002, 0);
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  // 6. Brushed Metal Lid (leaning against right side of jar)
  const lidGroup = new THREE.Group();
  const lidGeo = new THREE.CylinderGeometry(LID_R, LID_R, LID_H, SEGMENTS);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.name = 'metal_lid';
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  lidGroup.add(lidMesh);

  const lidRidgeGeo = new THREE.TorusGeometry(LID_R * 0.84, 0.0014, 8, SEGMENTS);
  const lidRidgeMesh = new THREE.Mesh(lidRidgeGeo, lidMat);
  lidRidgeMesh.name = 'lid_emboss_ring';
  lidRidgeMesh.rotation.x = Math.PI / 2;
  lidRidgeMesh.position.y = LID_H / 2;
  lidRidgeMesh.castShadow = true;
  lidRidgeMesh.receiveShadow = true;
  lidGroup.add(lidRidgeMesh);

  // Tilt lid upright leaning against the jar on +X
  lidGroup.rotation.z = -1.28;
  lidGroup.position.set(JAR_X + JAR_R + 0.016, LID_R * 0.96, 0.005);
  group.add(lidGroup);

  return group;
}
