function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.28;
  const BASE_R = 0.044;
  const MAX_R = 0.092;
  const NECK_R = 0.045;
  const RIM_R = 0.058;
  const WALL_T = 0.006;

  // Materials
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb64c2e,
    roughness: 0.72,
    metalness: 0.02
  });

  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xd19b4c,
    roughness: 0.68,
    metalness: 0.02
  });

  const darkCarveMat = new THREE.MeshStandardMaterial({
    color: 0x4f2619,
    roughness: 0.85,
    metalness: 0.02
  });

  // 1. Main vase body via LatheGeometry (outer profile + rim + inner cavity)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R + 0.004, 0.015),
    new THREE.Vector2(0.056, 0.045),
    new THREE.Vector2(0.072, 0.085),
    new THREE.Vector2(0.086, 0.125),
    new THREE.Vector2(MAX_R, 0.158),
    new THREE.Vector2(0.087, 0.185),
    new THREE.Vector2(0.066, 0.205),
    new THREE.Vector2(NECK_R + 0.004, 0.220),
    new THREE.Vector2(NECK_R, 0.238),
    new THREE.Vector2(NECK_R + 0.003, 0.258),
    new THREE.Vector2(RIM_R - 0.002, 0.273),
    new THREE.Vector2(RIM_R, 0.277),
    new THREE.Vector2(RIM_R - 0.002, H),
    new THREE.Vector2(RIM_R - WALL_T, H),
    new THREE.Vector2(NECK_R - WALL_T, 0.242),
    new THREE.Vector2(NECK_R - WALL_T, 0.215),
    new THREE.Vector2(0.074, 0.158),
    new THREE.Vector2(0.036, 0.030),
    new THREE.Vector2(0.0, 0.025)
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, terracottaMat);
  bodyMesh.name = 'vase_body';
  group.add(bodyMesh);

  // 2. Horizontal carved ochre bands
  const bandSpecs = [
    { name: 'band_lower_ochre', y: 0.024, r: 0.049, tube: 0.0022, mat: ochreMat },
    { name: 'band_mid_lower_ochre', y: 0.078, r: 0.069, tube: 0.0025, mat: ochreMat },
    { name: 'band_mid_lower_dark', y: 0.084, r: 0.071, tube: 0.0018, mat: darkCarveMat },
    { name: 'band_shoulder_ochre', y: 0.198, r: 0.073, tube: 0.0025, mat: ochreMat },
    { name: 'band_neck_base_ochre', y: 0.218, r: 0.049, tube: 0.0022, mat: ochreMat },
    { name: 'band_neck_upper_ochre', y: 0.258, r: 0.048, tube: 0.0022, mat: ochreMat }
  ];

  for (const spec of bandSpecs) {
    const geo = new THREE.TorusGeometry(spec.r, spec.tube, 10, 32);
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, spec.mat);
    mesh.position.y = spec.y;
    mesh.name = spec.name;
    group.add(mesh);
  }

  // 3. Carved floral medallions on the belly (front +Z and back -Z)
  const flowerAngles = [0, Math.PI];
  for (let i = 0; i < flowerAngles.length; i++) {
    const angle = flowerAngles[i];
    const sideLabel = i === 0 ? 'front' : 'back';
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(
      Math.sin(angle) * (MAX_R - 0.002),
      0.145,
      Math.cos(angle) * (MAX_R - 0.002)
    );
    flowerGroup.rotation.y = angle;

    // Flower center
    const centerGeo = new THREE.SphereGeometry(0.007, 12, 10);
    centerGeo.scale(1, 1, 0.45);
    const centerMesh = new THREE.Mesh(centerGeo, ochreMat);
    centerMesh.name = `flower_center_${sideLabel}`;
    flowerGroup.add(centerMesh);

    // 8 petals around the center
    const petalGeo = new THREE.SphereGeometry(0.0075, 10, 8);
    petalGeo.scale(0.55, 1.5, 0.35);
    const numPetals = 8;
    for (let p = 0; p < numPetals; p++) {
      const pAngle = (p / numPetals) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, p % 2 === 0 ? terracottaMat : ochreMat);
      petal.position.set(Math.cos(pAngle) * 0.015, Math.sin(pAngle) * 0.015, -0.001);
      petal.rotation.z = pAngle - Math.PI / 2;
      petal.name = `flower_petal_${sideLabel}_${p}`;
      flowerGroup.add(petal);
    }

    group.add(flowerGroup);
  }

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
