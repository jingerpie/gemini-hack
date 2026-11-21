function build(THREE) {
  const group = new THREE.Group();

  const H = 0.18;
  const MAX_R = 0.098;
  const BASE_R = 0.044;
  const RIM_R = 0.058;
  const WALL_T = 0.005;
  const BASE_T = 0.012;
  const RADIAL_SEGMENTS = 32;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x585c5e,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.62,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide
  });

  const darkGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x2f3336,
    roughness: 0.05,
    metalness: 0.05,
    transparent: true,
    opacity: 0.75,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03
  });

  // Main thick-walled vase body via LatheGeometry
  const outerPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R + 0.012, 0.008),
    new THREE.Vector2(MAX_R * 0.78, 0.032),
    new THREE.Vector2(MAX_R * 0.96, 0.065),
    new THREE.Vector2(MAX_R, 0.095),
    new THREE.Vector2(MAX_R * 0.94, 0.130),
    new THREE.Vector2(MAX_R * 0.78, 0.158),
    new THREE.Vector2(RIM_R + 0.004, 0.175),
    new THREE.Vector2(RIM_R, H),
    new THREE.Vector2(RIM_R - WALL_T, H),
    new THREE.Vector2(RIM_R - WALL_T + 0.003, 0.174),
    new THREE.Vector2((MAX_R * 0.78) - WALL_T, 0.156),
    new THREE.Vector2((MAX_R * 0.94) - WALL_T, 0.128),
    new THREE.Vector2(MAX_R - WALL_T, 0.095),
    new THREE.Vector2((MAX_R * 0.96) - WALL_T, 0.065),
    new THREE.Vector2((MAX_R * 0.78) - WALL_T, 0.035),
    new THREE.Vector2(BASE_R - 0.002, BASE_T),
    new THREE.Vector2(0.0, BASE_T)
  ];

  const bodyGeo = new THREE.LatheGeometry(outerPoints, RADIAL_SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, glassMat);
  bodyMesh.name = 'vase_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Smooth thickened rim lip
  const rimGeo = new THREE.TorusGeometry(RIM_R - WALL_T * 0.5, WALL_T * 0.55, 12, RADIAL_SEGMENTS);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, darkGlassMat);
  rimMesh.position.y = H - WALL_T * 0.55;
  rimMesh.name = 'vase_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Heavy glass base disc
  const baseGeo = new THREE.CylinderGeometry(BASE_R * 0.95, BASE_R * 0.98, BASE_T * 0.6, RADIAL_SEGMENTS);
  const baseMesh = new THREE.Mesh(baseGeo, darkGlassMat);
  baseMesh.position.y = BASE_T * 0.3;
  baseMesh.name = 'vase_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Folded current dimples / ripples around the belly
  const foldCount = 5;
  const foldRadius = MAX_R * 0.87;
  const foldY = 0.092;

  for (let i = 0; i < foldCount; i++) {
    const angle = (i / foldCount) * Math.PI * 2 + 0.35;
    const foldGeo = new THREE.TorusGeometry(0.022, 0.0045, 10, 20, Math.PI * 0.85);
    const foldMesh = new THREE.Mesh(foldGeo, darkGlassMat);

    foldMesh.position.set(
      Math.cos(angle) * foldRadius,
      foldY + (i % 2 === 0 ? 0.005 : -0.005),
      Math.sin(angle) * foldRadius
    );
    foldMesh.rotation.y = -angle + Math.PI / 2;
    foldMesh.rotation.z = (i % 2 === 0 ? 0.25 : -0.25) + Math.PI * 0.55;
    foldMesh.scale.set(1.0, 1.35, 0.65);

    foldMesh.name = 'vase_fold_' + (i + 1);
    foldMesh.castShadow = true;
    foldMesh.receiveShadow = true;
    group.add(foldMesh);
  }

  return group;
}
