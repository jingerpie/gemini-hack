function build(THREE) {
  const group = new THREE.Group();

  const R = 0.0425;
  const H = 0.068;
  const WALL = 0.0012;
  const WAX_H = 0.056;
  const BEAD_Y = H - 0.012;
  const WICK_H = 0.011;
  const FLAME_H = 0.014;
  const SEG = 32;

  const tinMat = new THREE.MeshStandardMaterial({
    color: 0x9e7c46,
    metalness: 0.75,
    roughness: 0.36,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf4ebd9,
    metalness: 0.0,
    roughness: 0.65,
  });

  const speckMat = new THREE.MeshStandardMaterial({
    color: 0x4a3220,
    metalness: 0.0,
    roughness: 0.85,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xe6decb,
    metalness: 0.0,
    roughness: 0.9,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Tin body via LatheGeometry (hollow with rolled rim and bead)
  const tinPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.002, 0),
    new THREE.Vector2(R, 0.002),
    new THREE.Vector2(R, BEAD_Y - 0.0015),
    new THREE.Vector2(R + 0.0012, BEAD_Y),
    new THREE.Vector2(R, BEAD_Y + 0.0015),
    new THREE.Vector2(R, H - 0.0015),
    new THREE.Vector2(R + 0.0008, H - 0.0005),
    new THREE.Vector2(R - WALL * 0.5, H),
    new THREE.Vector2(R - WALL, H - 0.001),
    new THREE.Vector2(R - WALL, WAX_H - 0.005),
    new THREE.Vector2(0, WAX_H - 0.005),
  ];
  const tinGeo = new THREE.LatheGeometry(tinPts, SEG);
  const tinMesh = new THREE.Mesh(tinGeo, tinMat);
  tinMesh.name = 'tin_container';
  tinMesh.castShadow = true;
  tinMesh.receiveShadow = true;
  group.add(tinMesh);

  // Soy wax fill
  const waxGeo = new THREE.CylinderGeometry(R - WALL, R - WALL, WAX_H - 0.002, SEG);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'soy_wax';
  waxMesh.position.y = (WAX_H - 0.002) / 2 + 0.002;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // Vanilla bean specks on wax surface
  const speckPositions = [
    [0.014, 0.011],
    [-0.018, 0.008],
    [0.008, -0.020],
    [-0.011, -0.015],
    [0.024, -0.005],
    [-0.025, 0.014],
    [0.004, 0.026],
  ];
  const speckGeo = new THREE.SphereGeometry(0.0011, 8, 6);
  speckPositions.forEach(([sx, sz], idx) => {
    const speck = new THREE.Mesh(speckGeo, speckMat);
    speck.name = `vanilla_speck_${idx + 1}`;
    speck.scale.set(1.2, 0.35, 0.8);
    speck.position.set(sx, WAX_H + 0.0001, sz);
    speck.castShadow = true;
    speck.receiveShadow = true;
    group.add(speck);
  });

  // Braided cotton wick
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0014, WICK_H, 10);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'cotton_wick';
  wickMesh.position.y = WAX_H + WICK_H / 2 - 0.001;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // Lit flame teardrop
  const flamePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.0028, FLAME_H * 0.25),
    new THREE.Vector2(0.0025, FLAME_H * 0.5),
    new THREE.Vector2(0.0012, FLAME_H * 0.8),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePts, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = WAX_H + WICK_H - 0.0015;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
