function build(THREE) {
  const group = new THREE.Group();

  const CANDLE_R_TOP = 0.032;
  const CANDLE_R_BOT = 0.029;
  const CANDLE_H = 0.070;
  const GLASS_THICK = 0.003;
  const BASE_H = 0.009;
  const WAX_H = 0.052;
  const WICK_H = 0.009;
  const WICK_R = 0.0012;
  const FLAME_H = 0.014;
  const FLAME_R = 0.0035;
  const SPACING_X = 0.105;
  const SPACING_Z = 0.105;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.65,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const glassProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(CANDLE_R_BOT - 0.002, 0),
    new THREE.Vector2(CANDLE_R_BOT, 0.002),
    new THREE.Vector2(CANDLE_R_TOP, CANDLE_H - 0.001),
    new THREE.Vector2(CANDLE_R_TOP - GLASS_THICK * 0.5, CANDLE_H),
    new THREE.Vector2(CANDLE_R_TOP - GLASS_THICK, CANDLE_H - 0.001),
    new THREE.Vector2(CANDLE_R_BOT - GLASS_THICK, BASE_H),
    new THREE.Vector2(0, BASE_H)
  ];
  const glassGeo = new THREE.LatheGeometry(glassProfile, 32);

  const waxRBot = CANDLE_R_BOT - GLASS_THICK - 0.0003;
  const waxRTop = waxRBot + (CANDLE_R_TOP - CANDLE_R_BOT) * (WAX_H / (CANDLE_H - BASE_H));
  const waxGeo = new THREE.CylinderGeometry(waxRTop, waxRBot, WAX_H, 28);

  const wickGeo = new THREE.CylinderGeometry(WICK_R, WICK_R, WICK_H, 8);

  const flameProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.85, FLAME_H * 0.18),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.65, FLAME_H * 0.65),
    new THREE.Vector2(FLAME_R * 0.2, FLAME_H * 0.88),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flameProfile, 16);

  const positions = [
    [-SPACING_X / 2, -SPACING_Z / 2],
    [SPACING_X / 2, -SPACING_Z / 2],
    [-SPACING_X / 2, SPACING_Z / 2],
    [SPACING_X / 2, SPACING_Z / 2]
  ];

  for (let i = 0; i < positions.length; i++) {
    const [px, pz] = positions[i];
    const idx = i + 1;

    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.name = `votive_glass_${idx}`;
    glassMesh.position.set(px, 0, pz);
    glassMesh.castShadow = true;
    glassMesh.receiveShadow = true;
    group.add(glassMesh);

    const waxMesh = new THREE.Mesh(waxGeo, waxMat);
    waxMesh.name = `votive_wax_${idx}`;
    waxMesh.position.set(px, BASE_H + WAX_H / 2, pz);
    waxMesh.castShadow = true;
    waxMesh.receiveShadow = true;
    group.add(waxMesh);

    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.name = `votive_wick_${idx}`;
    wickMesh.position.set(px, BASE_H + WAX_H + WICK_H / 2 - 0.001, pz);
    wickMesh.castShadow = true;
    wickMesh.receiveShadow = true;
    group.add(wickMesh);

    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.name = `emit_flame_${idx}`;
    flameMesh.position.set(px, BASE_H + WAX_H + WICK_H - 0.0015, pz);
    flameMesh.castShadow = true;
    flameMesh.receiveShadow = true;
    group.add(flameMesh);
  }

  return group;
}
