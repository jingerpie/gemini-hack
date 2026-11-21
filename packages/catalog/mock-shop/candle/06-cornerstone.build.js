function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SAUCER_R = 0.058;
  const SAUCER_H = 0.012;
  const SAUCER_THICK = 0.002;

  const CANDLE_R = 0.042;
  const CANDLE_H = 0.155;
  const CANDLE_BASE_Y = SAUCER_THICK;

  const LABEL_H = 0.066;
  const LABEL_R = CANDLE_R + 0.0006;

  const WICK_R = 0.0014;
  const WICK_H = 0.012;

  const FLAME_R = 0.0045;
  const FLAME_H = 0.022;

  // Materials
  const saucerMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.45,
    metalness: 0.65,
  });

  const waxMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6d3a7,
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.6,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.9,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c0,
    roughness: 0.95,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffdd77,
    emissive: 0xffaa33,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Matte black saucer
  const saucerPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(SAUCER_R * 0.72, 0),
    new THREE.Vector2(SAUCER_R * 0.88, SAUCER_H * 0.35),
    new THREE.Vector2(SAUCER_R, SAUCER_H),
    new THREE.Vector2(SAUCER_R - SAUCER_THICK * 0.7, SAUCER_H),
    new THREE.Vector2(SAUCER_R * 0.86, SAUCER_H * 0.35 + SAUCER_THICK),
    new THREE.Vector2(SAUCER_R * 0.7, SAUCER_THICK),
    new THREE.Vector2(0, SAUCER_THICK),
  ];
  const saucerGeo = new THREE.LatheGeometry(saucerPoints, 32);
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.name = "saucer_dish";
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  group.add(saucer);

  // 2. Wax pillar body with dished top
  const waxTopY = CANDLE_BASE_Y + CANDLE_H;
  const dishDepth = 0.008;
  const waxPoints = [
    new THREE.Vector2(0, CANDLE_BASE_Y),
    new THREE.Vector2(CANDLE_R - 0.003, CANDLE_BASE_Y),
    new THREE.Vector2(CANDLE_R, CANDLE_BASE_Y + 0.004),
    new THREE.Vector2(CANDLE_R, waxTopY - 0.005),
    new THREE.Vector2(CANDLE_R - 0.004, waxTopY),
    new THREE.Vector2(CANDLE_R * 0.75, waxTopY - 0.001),
    new THREE.Vector2(CANDLE_R * 0.4, waxTopY - dishDepth * 0.7),
    new THREE.Vector2(0, waxTopY - dishDepth),
  ];
  const waxGeo = new THREE.LatheGeometry(waxPoints, 32);
  const waxBody = new THREE.Mesh(waxGeo, waxMat);
  waxBody.name = "wax_pillar";
  waxBody.castShadow = true;
  waxBody.receiveShadow = true;
  group.add(waxBody);

  // 3. Paper label band
  const labelGeo = new THREE.CylinderGeometry(LABEL_R, LABEL_R, LABEL_H, 32, 1, true);
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.name = "paper_label";
  label.position.y = CANDLE_BASE_Y + CANDLE_H * 0.48;
  label.castShadow = true;
  label.receiveShadow = true;
  group.add(label);

  // 4. Wick
  const wickBaseY = waxTopY - dishDepth;
  const wickGeo = new THREE.CylinderGeometry(WICK_R, WICK_R * 1.15, WICK_H, 12);
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.name = "candle_wick";
  wick.position.y = wickBaseY + WICK_H * 0.5;
  wick.castShadow = true;
  wick.receiveShadow = true;
  group.add(wick);

  // 5. Lit flame (teardrop)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.85, FLAME_H * 0.2),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.4),
    new THREE.Vector2(FLAME_R * 0.65, FLAME_H * 0.7),
    new THREE.Vector2(FLAME_R * 0.2, FLAME_H * 0.9),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 20);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.name = "emit_flame";
  flame.position.y = wickBaseY + WICK_H - 0.001;
  flame.castShadow = false;
  flame.receiveShadow = false;
  group.add(flame);

  return group;
}
