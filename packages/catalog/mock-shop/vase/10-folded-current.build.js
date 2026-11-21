function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const HEIGHT = 0.22;
  const BODY_HEIGHT = 0.20;
  const RIDGE_Y = 0.065;
  const BASE_RADIUS = 0.048;
  const MAX_RADIUS = 0.078;
  const TOP_RADIUS = 0.054;
  const COLLAR_RADIUS = 0.038;
  const COLLAR_TUBE = 0.004;
  const GLASS_RADIUS = 0.033;
  const GLASS_WALL = 0.002;
  const GLASS_DEPTH = 0.14;
  const GLASS_TOP_Y = HEIGHT;
  const FACETS = 8;

  // Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x202225,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true
  });

  const resinMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0b0d,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a64a,
    roughness: 0.28,
    metalness: 0.88
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x161719,
    roughness: 0.75,
    metalness: 0.05
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f6,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  // 1. Faceted concrete body
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_RADIUS, 0.0),
    new THREE.Vector2(MAX_RADIUS, RIDGE_Y),
    new THREE.Vector2(TOP_RADIUS, BODY_HEIGHT),
    new THREE.Vector2(GLASS_RADIUS, BODY_HEIGHT),
    new THREE.Vector2(GLASS_RADIUS, BODY_HEIGHT - 0.04),
    new THREE.Vector2(0.0, BODY_HEIGHT - 0.04)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, FACETS);
  bodyGeo.rotateY(Math.PI / FACETS);
  const bodyMesh = new THREE.Mesh(bodyGeo, concreteMat);
  bodyMesh.name = 'concrete_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Front glossy black resin seam (+Z)
  const seamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.002, BASE_RADIUS * 0.92),
    new THREE.Vector3(0, RIDGE_Y, MAX_RADIUS * 0.92),
    new THREE.Vector3(0, BODY_HEIGHT - 0.002, TOP_RADIUS * 0.92)
  ]);
  const seamGeo = new THREE.TubeGeometry(seamCurve, 16, 0.009, 8, false);
  seamGeo.scale(1.0, 1.0, 0.55);
  const seamMesh = new THREE.Mesh(seamGeo, resinMat);
  seamMesh.name = 'resin_seam';
  seamMesh.castShadow = true;
  seamMesh.receiveShadow = true;
  group.add(seamMesh);

  // 3. Gold leaf accents embedded in the resin seam
  const goldSpecs = [
    { y: 0.022, z: 0.054, sx: 0.006, sy: 0.012, rz: 0.25 },
    { y: 0.055, z: 0.069, sx: 0.007, sy: 0.016, rz: -0.2 },
    { y: 0.095, z: 0.068, sx: 0.005, sy: 0.014, rz: 0.3 },
    { y: 0.135, z: 0.061, sx: 0.006, sy: 0.015, rz: -0.15 },
    { y: 0.172, z: 0.053, sx: 0.005, sy: 0.011, rz: 0.2 }
  ];
  goldSpecs.forEach((spec, idx) => {
    const flakeGeo = new THREE.BoxGeometry(spec.sx, spec.sy, 0.002);
    const flakeMesh = new THREE.Mesh(flakeGeo, goldMat);
    flakeMesh.name = `gold_flake_${idx + 1}`;
    flakeMesh.position.set(0, spec.y, spec.z);
    flakeMesh.rotation.z = spec.rz;
    flakeMesh.castShadow = true;
    flakeMesh.receiveShadow = true;
    group.add(flakeMesh);
  });

  // 4. Dark rubber/matte collar around the glass opening
  const collarGeo = new THREE.TorusGeometry(COLLAR_RADIUS, COLLAR_TUBE, 12, 32);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.name = 'neck_collar';
  collarMesh.position.y = BODY_HEIGHT + COLLAR_TUBE * 0.6;
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);

  // 5. Clear glass cylinder insert
  const glassPoints = [
    new THREE.Vector2(GLASS_RADIUS - GLASS_WALL, GLASS_TOP_Y - GLASS_DEPTH),
    new THREE.Vector2(GLASS_RADIUS, GLASS_TOP_Y - GLASS_DEPTH),
    new THREE.Vector2(GLASS_RADIUS, GLASS_TOP_Y - 0.002),
    new THREE.Vector2(GLASS_RADIUS - GLASS_WALL, GLASS_TOP_Y - 0.002)
  ];
  const glassGeo = new THREE.LatheGeometry(glassPoints, 32);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.name = 'glass_insert';
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  group.add(glassMesh);

  // 6. Glass top rim lip
  const glassRimGeo = new THREE.TorusGeometry(GLASS_RADIUS - GLASS_WALL * 0.5, GLASS_WALL * 0.75, 10, 32);
  glassRimGeo.rotateX(Math.PI / 2);
  const glassRimMesh = new THREE.Mesh(glassRimGeo, glassMat);
  glassRimMesh.name = 'glass_rim';
  glassRimMesh.position.y = GLASS_TOP_Y - GLASS_WALL * 0.75;
  glassRimMesh.castShadow = true;
  glassRimMesh.receiveShadow = true;
  group.add(glassRimMesh);

  return group;
}
