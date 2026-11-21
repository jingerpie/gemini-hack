function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions in meters (180g scented candle)
  const H = 0.094;
  const R_BODY = 0.043;
  const R_FOOT = 0.039;
  const FOOT_H = 0.008;
  const RIM_H = 0.011;
  const GROOVE_DEPTH = 0.0012;
  const WALL_THICK = 0.0045;
  const WAX_TOP_Y = H - 0.013;
  const WICK_H = 0.009;
  const FLAME_H = 0.014;
  const FLAME_R = 0.0035;

  // Materials
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x5d6160,
    roughness: 0.72,
    metalness: 0.04,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0ea,
    roughness: 0.45,
    metalness: 0.0,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xedece6,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c7,
    roughness: 0.9,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Ceramic vessel (LatheGeometry from bottom center, up outer wall, over rim, down inner wall)
  const vesselPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_FOOT - 0.002, 0),
    new THREE.Vector2(R_FOOT, 0.002),
    new THREE.Vector2(R_FOOT, FOOT_H),
    new THREE.Vector2(R_BODY, FOOT_H + 0.003),
    new THREE.Vector2(R_BODY, H - RIM_H - 0.002),
    new THREE.Vector2(R_BODY - GROOVE_DEPTH, H - RIM_H),
    new THREE.Vector2(R_BODY + 0.0005, H - RIM_H + 0.002),
    new THREE.Vector2(R_BODY + 0.0005, H - 0.003),
    new THREE.Vector2(R_BODY - 0.001, H),
    new THREE.Vector2(R_BODY - WALL_THICK + 0.001, H),
    new THREE.Vector2(R_BODY - WALL_THICK, H - 0.002),
    new THREE.Vector2(R_BODY - WALL_THICK, WAX_TOP_Y - 0.005),
    new THREE.Vector2(0, WAX_TOP_Y - 0.005),
  ];
  const vesselGeo = new THREE.LatheGeometry(vesselPoints, 32);
  const vesselMesh = new THREE.Mesh(vesselGeo, ceramicMat);
  vesselMesh.name = 'ceramic_vessel';
  vesselMesh.castShadow = true;
  vesselMesh.receiveShadow = true;
  group.add(vesselMesh);

  // 2. Candle wax
  const waxR = R_BODY - WALL_THICK + 0.0002;
  const waxH = 0.01;
  const waxGeo = new THREE.CylinderGeometry(waxR, waxR, waxH, 32);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'candle_wax';
  waxMesh.position.y = WAX_TOP_Y - waxH / 2;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // 3. Front paper label (curved arc on +Z side)
  const labelH = 0.044;
  const labelArc = Math.PI * 0.56;
  const labelGeo = new THREE.CylinderGeometry(
    R_BODY + 0.0004,
    R_BODY + 0.0004,
    labelH,
    24,
    1,
    true,
    -labelArc / 2,
    labelArc
  );
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.name = 'front_label';
  labelMesh.position.y = FOOT_H + (H - RIM_H - FOOT_H) * 0.46;
  labelMesh.castShadow = true;
  labelMesh.receiveShadow = true;
  group.add(labelMesh);

  // 4. Candle wick
  const wickGeo = new THREE.CylinderGeometry(0.0011, 0.0013, WICK_H, 10);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'candle_wick';
  wickMesh.position.y = WAX_TOP_Y + WICK_H / 2 - 0.001;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // 5. Lit flame (teardrop via LatheGeometry)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.12),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.32),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.6),
    new THREE.Vector2(FLAME_R * 0.28, FLAME_H * 0.85),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = WAX_TOP_Y + WICK_H - 0.0015;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
