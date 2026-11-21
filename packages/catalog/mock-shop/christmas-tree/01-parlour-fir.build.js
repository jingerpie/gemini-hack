function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.38;
  const BASE_R = 0.058;
  const BASE_H = 0.032;
  const TRUNK_R = 0.009;
  const TRUNK_VISIBLE_H = 0.048;
  const FOLIAGE_START_Y = BASE_H + TRUNK_VISIBLE_H;
  const FOLIAGE_H = TOTAL_H - FOLIAGE_START_Y;
  const MAX_TREE_R = 0.105;
  const TIER_COUNT = 10;

  // Materials
  const baseWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.65,
    metalness: 0.02
  });

  const trunkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x7c5032,
    roughness: 0.72,
    metalness: 0.02
  });

  const paperGreenMat = new THREE.MeshStandardMaterial({
    color: 0x265429,
    roughness: 0.90,
    metalness: 0.0
  });

  // 1. Wooden Base (chamfered puck via LatheGeometry)
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R - 0.004, 0.0),
    new THREE.Vector2(BASE_R, 0.004),
    new THREE.Vector2(BASE_R, BASE_H - 0.005),
    new THREE.Vector2(BASE_R - 0.005, BASE_H),
    new THREE.Vector2(0.0, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(baseProfile, 28);
  const baseMesh = new THREE.Mesh(baseGeo, baseWoodMat);
  baseMesh.name = 'wooden_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Wooden Trunk
  const trunkTotalH = TRUNK_VISIBLE_H + FOLIAGE_H * 0.55;
  const trunkGeo = new THREE.CylinderGeometry(TRUNK_R * 0.88, TRUNK_R, trunkTotalH, 16);
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkWoodMat);
  trunkMesh.name = 'wooden_trunk';
  trunkMesh.position.y = BASE_H - 0.003 + trunkTotalH * 0.5;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // 3. Stacked Flared Conical Paper Tiers (10 overlapping tiers)
  for (let t = 0; t < TIER_COUNT; t++) {
    const progress = t / (TIER_COUNT - 1); // 0 = bottom, 1 = top
    const bottomR = MAX_TREE_R * (1.0 - progress * 0.80);
    const topR = t === TIER_COUNT - 1 ? 0.002 : bottomR * 0.36;
    const tierH = FOLIAGE_H * (0.18 - progress * 0.05);
    const tierY = FOLIAGE_START_Y + progress * (FOLIAGE_H - tierH);

    // Flared conical profile (slightly concave outward flare at bottom rim)
    const midR = bottomR * 0.62;
    const tierProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(bottomR * 0.92, 0.0),
      new THREE.Vector2(bottomR, 0.002),
      new THREE.Vector2(midR, tierH * 0.45),
      new THREE.Vector2(topR, tierH),
      new THREE.Vector2(0.0, tierH)
    ];

    const tierGeo = new THREE.LatheGeometry(tierProfile, 28);
    const tierMesh = new THREE.Mesh(tierGeo, paperGreenMat);
    tierMesh.name = `paper_tier_${t + 1}`;
    tierMesh.position.y = tierY;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    group.add(tierMesh);
  }

  return group;
}
