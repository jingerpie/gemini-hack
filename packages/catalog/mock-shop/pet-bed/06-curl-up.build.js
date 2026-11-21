function build(THREE) {
  const group = new THREE.Group();

  const OUTER_DIAMETER = 0.40;
  const OUTER_RADIUS = OUTER_DIAMETER / 2;
  const BED_HEIGHT = 0.155;
  const RIM_TUBE_R = 0.022;
  const RIM_MAJOR_R = OUTER_RADIUS - RIM_TUBE_R;
  const RIM_CENTER_Y = BED_HEIGHT - RIM_TUBE_R;
  const WALL_THICKNESS = 0.024;
  const BASE_HEIGHT = 0.018;
  const CUSHION_RADIUS = RIM_MAJOR_R - WALL_THICKNESS * 0.55;
  const CUSHION_TOP_Y = 0.115;

  const yarnMat = new THREE.MeshStandardMaterial({
    color: 0x7b6959,
    roughness: 0.92,
    metalness: 0.0
  });

  const yarnDarkMat = new THREE.MeshStandardMaterial({
    color: 0x6e5d4e,
    roughness: 0.95,
    metalness: 0.0
  });

  // Base disc
  const baseGeo = new THREE.CylinderGeometry(0.176, 0.172, BASE_HEIGHT, 32);
  const baseMesh = new THREE.Mesh(baseGeo, yarnDarkMat);
  baseMesh.position.y = BASE_HEIGHT / 2;
  baseMesh.name = 'basket_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Basket wall core (LatheGeometry)
  const wallPoints = [
    new THREE.Vector2(0.150, BASE_HEIGHT),
    new THREE.Vector2(0.176, BASE_HEIGHT),
    new THREE.Vector2(0.188, 0.055),
    new THREE.Vector2(0.191, 0.095),
    new THREE.Vector2(0.186, RIM_CENTER_Y),
    new THREE.Vector2(0.162, RIM_CENTER_Y),
    new THREE.Vector2(0.165, 0.095),
    new THREE.Vector2(0.162, 0.055),
    new THREE.Vector2(0.150, BASE_HEIGHT)
  ];
  const wallGeo = new THREE.LatheGeometry(wallPoints, 32);
  const wallMesh = new THREE.Mesh(wallGeo, yarnDarkMat);
  wallMesh.name = 'basket_wall_core';
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  group.add(wallMesh);

  // Outer crochet rows on the basket wall
  const wallRowCount = 7;
  for (let i = 0; i < wallRowCount; i++) {
    const t = i / (wallRowCount - 1);
    const y = 0.022 + t * (RIM_CENTER_Y - 0.032);
    const profileR = 0.174 + Math.sin(t * Math.PI) * 0.016;
    const rowGeo = new THREE.TorusGeometry(profileR, 0.0085, 10, 32);
    const rowMesh = new THREE.Mesh(rowGeo, yarnMat);
    rowMesh.rotation.x = Math.PI / 2;
    rowMesh.position.y = y;
    rowMesh.name = `wall_crochet_row_${i}`;
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    group.add(rowMesh);
  }

  // Thick rolled top rim
  const rimGeo = new THREE.TorusGeometry(RIM_MAJOR_R, RIM_TUBE_R, 16, 32);
  const rimMesh = new THREE.Mesh(rimGeo, yarnMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = RIM_CENTER_Y;
  rimMesh.name = 'basket_rolled_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Inner cushion body
  const cushionHeight = CUSHION_TOP_Y - BASE_HEIGHT;
  const cushionGeo = new THREE.SphereGeometry(CUSHION_RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cushionMesh = new THREE.Mesh(cushionGeo, yarnDarkMat);
  cushionMesh.scale.set(1, cushionHeight / CUSHION_RADIUS, 1);
  cushionMesh.position.y = BASE_HEIGHT;
  cushionMesh.name = 'inner_cushion_core';
  cushionMesh.castShadow = true;
  cushionMesh.receiveShadow = true;
  group.add(cushionMesh);

  // Concentric crochet rings on top of the inner cushion
  const cushionRingCount = 7;
  for (let i = 0; i < cushionRingCount; i++) {
    const frac = (i + 0.5) / cushionRingCount;
    const r = frac * (CUSHION_RADIUS - 0.012);
    const domeY = BASE_HEIGHT + cushionHeight * Math.sqrt(Math.max(0, 1 - (r / CUSHION_RADIUS) * (r / CUSHION_RADIUS)));
    const ringGeo = new THREE.TorusGeometry(r, 0.0075, 10, 32);
    const ringMesh = new THREE.Mesh(ringGeo, yarnMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = domeY - 0.002;
    ringMesh.name = `cushion_crochet_ring_${i}`;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    group.add(ringMesh);
  }

  return group;
}
