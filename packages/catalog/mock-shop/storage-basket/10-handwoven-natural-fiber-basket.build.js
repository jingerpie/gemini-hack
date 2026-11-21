function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.28;
  const R_BASE = 0.11;
  const R_BELLY = 0.19;
  const R_TOP = 0.125;
  const BELLY_Y_RATIO = 0.40;
  const COIL_COUNT = 18;
  const TUBE_R = 0.0095;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe6dcc8,
    roughness: 0.92,
    metalness: 0.0
  });
  const creamAltMat = new THREE.MeshStandardMaterial({
    color: 0xdcd0ba,
    roughness: 0.94,
    metalness: 0.0
  });
  const juteMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a4c,
    roughness: 0.9,
    metalness: 0.0
  });
  const juteAltMat = new THREE.MeshStandardMaterial({
    color: 0x8a693d,
    roughness: 0.92,
    metalness: 0.0
  });

  // Flat woven base
  const baseGeo = new THREE.CylinderGeometry(R_BASE, R_BASE * 0.92, TUBE_R * 1.4, 32);
  const baseMesh = new THREE.Mesh(baseGeo, creamMat);
  baseMesh.name = 'basket_base';
  baseMesh.position.y = TUBE_R * 0.7;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Profile radius function for the belly silhouette
  function getRadiusAt(t) {
    if (t <= BELLY_Y_RATIO) {
      const u = t / BELLY_Y_RATIO;
      const ease = Math.sin(u * Math.PI * 0.5);
      return R_BASE + (R_BELLY - R_BASE) * ease;
    } else {
      const u = (t - BELLY_Y_RATIO) / (1 - BELLY_Y_RATIO);
      const ease = 0.5 - 0.5 * Math.cos(u * Math.PI);
      return R_BELLY + (R_TOP - R_BELLY) * ease;
    }
  }

  // Stacked braided coils
  const yStart = TUBE_R;
  const yEnd = H - TUBE_R;
  const creamCutoff = 0.33;

  for (let i = 0; i < COIL_COUNT; i++) {
    const t = i / (COIL_COUNT - 1);
    const y = yStart + t * (yEnd - yStart);
    const majorR = getRadiusAt(t);
    const tubeR = i === COIL_COUNT - 1 ? TUBE_R * 1.15 : TUBE_R;

    const coilGeo = new THREE.TorusGeometry(majorR, tubeR, 10, 32);
    coilGeo.rotateX(Math.PI / 2);

    let mat;
    if (t < creamCutoff) {
      mat = i % 2 === 0 ? creamMat : creamAltMat;
    } else {
      mat = i % 2 === 0 ? juteMat : juteAltMat;
    }

    const coil = new THREE.Mesh(coilGeo, mat);
    coil.name = i === COIL_COUNT - 1 ? 'basket_rim_coil' : `basket_coil_${i + 1}`;
    coil.position.y = y;
    coil.castShadow = true;
    coil.receiveShadow = true;
    group.add(coil);
  }

  return group;
}
