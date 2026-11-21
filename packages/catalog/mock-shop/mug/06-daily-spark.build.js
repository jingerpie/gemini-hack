function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions for an espresso cup (meters)
  const RADIUS = 0.034;
  const HEIGHT = 0.068;
  const WALL_THICK = 0.0045;
  const FOOT_RADIUS = 0.025;
  const HANDLE_EXTENT = 0.026;
  const HANDLE_TUBE_R = 0.0048;

  // Materials
  const ceramicYellowMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4cf47,
    roughness: 0.18,
    metalness: 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  const boltMainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e12,
    roughness: 0.25,
    metalness: 0.02,
    clearcoat: 0.6
  });

  const boltCoralMat = new THREE.MeshPhysicalMaterial({
    color: 0xe06246,
    roughness: 0.3,
    metalness: 0.02
  });

  const boltTealMat = new THREE.MeshPhysicalMaterial({
    color: 0x5d8aa0,
    roughness: 0.3,
    metalness: 0.02
  });

  // 1. Cup Body (LatheGeometry for smooth rounded bottom, rim, and hollow interior)
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FOOT_RADIUS, 0),
    new THREE.Vector2(FOOT_RADIUS + 0.002, 0.0015),
    new THREE.Vector2(RADIUS - 0.004, 0.005),
    new THREE.Vector2(RADIUS - 0.001, 0.011),
    new THREE.Vector2(RADIUS, 0.018),
    new THREE.Vector2(RADIUS, HEIGHT - 0.004),
    new THREE.Vector2(RADIUS - 0.001, HEIGHT - 0.001),
    new THREE.Vector2(RADIUS - WALL_THICK * 0.5, HEIGHT),
    new THREE.Vector2(RADIUS - WALL_THICK + 0.001, HEIGHT - 0.001),
    new THREE.Vector2(RADIUS - WALL_THICK, HEIGHT - 0.004),
    new THREE.Vector2(RADIUS - WALL_THICK, 0.014),
    new THREE.Vector2(RADIUS - WALL_THICK - 0.004, 0.008),
    new THREE.Vector2(0, 0.006)
  ];

  const bodyGeo = new THREE.LatheGeometry(pts, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicYellowMat);
  bodyMesh.name = 'cup_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Handle (TubeGeometry along a smooth C-curve on +X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(RADIUS - 0.003, HEIGHT - 0.013, 0),
    new THREE.Vector3(RADIUS + HANDLE_EXTENT * 0.55, HEIGHT - 0.012, 0),
    new THREE.Vector3(RADIUS + HANDLE_EXTENT, HEIGHT * 0.52, 0),
    new THREE.Vector3(RADIUS + HANDLE_EXTENT * 0.55, 0.017, 0),
    new THREE.Vector3(RADIUS - 0.003, 0.015, 0)
  ]);

  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_TUBE_R, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicYellowMat);
  handleMesh.name = 'cup_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // 3. Lightning Bolt Graphic on +Z front face
  function createBoltShape(scale) {
    const s = new THREE.Shape();
    s.moveTo(-0.0022 * scale, 0.014 * scale);
    s.lineTo(0.0052 * scale, 0.015 * scale);
    s.lineTo(0.0015 * scale, 0.003 * scale);
    s.lineTo(0.0068 * scale, 0.004 * scale);
    s.lineTo(-0.0048 * scale, -0.016 * scale);
    s.lineTo(-0.0016 * scale, -0.002 * scale);
    s.lineTo(-0.0065 * scale, -0.003 * scale);
    s.closePath();
    return s;
  }

  const boltY = HEIGHT * 0.49;
  const boltZ = RADIUS - 0.0006;

  // Main golden-orange bolt
  const boltGeo = new THREE.ExtrudeGeometry(createBoltShape(1.0), {
    depth: 0.0014,
    bevelEnabled: false
  });
  const boltMesh = new THREE.Mesh(boltGeo, boltMainMat);
  boltMesh.name = 'lightning_bolt_main';
  boltMesh.position.set(0, boltY, boltZ);
  boltMesh.castShadow = true;
  boltMesh.receiveShadow = true;
  group.add(boltMesh);

  // Subtle coral-orange right/bottom-right accent
  const coralGeo = new THREE.ExtrudeGeometry(createBoltShape(1.06), {
    depth: 0.001,
    bevelEnabled: false
  });
  const coralMesh = new THREE.Mesh(coralGeo, boltCoralMat);
  coralMesh.name = 'lightning_bolt_coral_accent';
  coralMesh.position.set(0.0007, boltY - 0.0005, boltZ - 0.0002);
  coralMesh.castShadow = true;
  coralMesh.receiveShadow = true;
  group.add(coralMesh);

  // Subtle teal left/bottom-left accent
  const tealGeo = new THREE.ExtrudeGeometry(createBoltShape(1.05), {
    depth: 0.001,
    bevelEnabled: false
  });
  const tealMesh = new THREE.Mesh(tealGeo, boltTealMat);
  tealMesh.name = 'lightning_bolt_teal_accent';
  tealMesh.position.set(-0.0006, boltY - 0.0003, boltZ - 0.0002);
  tealMesh.castShadow = true;
  tealMesh.receiveShadow = true;
  group.add(tealMesh);

  return group;
}
