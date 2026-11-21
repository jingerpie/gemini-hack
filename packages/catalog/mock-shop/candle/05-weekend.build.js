function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const TIN_RADIUS = 0.0425;
  const TIN_HEIGHT = 0.050;
  const WAX_HEIGHT = 0.040;
  const WICK_HEIGHT = 0.006;
  const FLAME_HEIGHT = 0.011;
  const LID_RADIUS = 0.0445;
  const LID_HEIGHT = 0.011;
  const LID_TILT = -0.82; // radians, leaning against +X side of tin

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.82,
    roughness: 0.32,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf3eee2,
    roughness: 0.65,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xe5dec9,
    roughness: 0.9,
    metalness: 0.0,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffd27d,
    emissive: 0xffaa33,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Assembly group for tin + wax + wick + flame + label
  const tinGroup = new THREE.Group();

  // 1. Tin body (LatheGeometry with rounded bottom, bead ridge, and rolled top rim)
  const tinPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(TIN_RADIUS - 0.005, 0.0),
    new THREE.Vector2(TIN_RADIUS - 0.001, 0.0015),
    new THREE.Vector2(TIN_RADIUS, 0.0045),
    new THREE.Vector2(TIN_RADIUS, 0.036),
    new THREE.Vector2(TIN_RADIUS + 0.0012, 0.038),
    new THREE.Vector2(TIN_RADIUS, 0.040),
    new THREE.Vector2(TIN_RADIUS, TIN_HEIGHT - 0.0015),
    new THREE.Vector2(TIN_RADIUS - 0.0008, TIN_HEIGHT),
    new THREE.Vector2(TIN_RADIUS - 0.0016, TIN_HEIGHT - 0.0015),
    new THREE.Vector2(TIN_RADIUS - 0.0014, 0.038),
    new THREE.Vector2(0.0, 0.038),
  ];
  const tinGeo = new THREE.LatheGeometry(tinPoints, 32);
  const tinMesh = new THREE.Mesh(tinGeo, brassMat);
  tinMesh.name = 'tin_body';
  tinMesh.castShadow = true;
  tinMesh.receiveShadow = true;
  tinGroup.add(tinMesh);

  // 2. Wax fill
  const waxGeo = new THREE.CylinderGeometry(
    TIN_RADIUS - 0.0012,
    TIN_RADIUS - 0.0012,
    WAX_HEIGHT,
    32
  );
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'wax_fill';
  waxMesh.position.y = 0.002 + WAX_HEIGHT / 2;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  tinGroup.add(waxMesh);

  // 3. Cotton wick
  const wickTopY = 0.002 + WAX_HEIGHT + WICK_HEIGHT;
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0014, WICK_HEIGHT, 8);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'cotton_wick';
  wickMesh.position.y = 0.002 + WAX_HEIGHT + WICK_HEIGHT / 2;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  tinGroup.add(wickMesh);

  // 4. Lit flame (teardrop)
  const flamePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.0022, FLAME_HEIGHT * 0.25),
    new THREE.Vector2(0.0024, FLAME_HEIGHT * 0.45),
    new THREE.Vector2(0.0014, FLAME_HEIGHT * 0.72),
    new THREE.Vector2(0.0004, FLAME_HEIGHT * 0.92),
    new THREE.Vector2(0.0, FLAME_HEIGHT),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = wickTopY - 0.0005;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  tinGroup.add(flameMesh);

  // 5. Front paper label (curved arc on +Z side)
  const labelGeo = new THREE.CylinderGeometry(
    TIN_RADIUS + 0.0004,
    TIN_RADIUS + 0.0004,
    0.022,
    24,
    1,
    true,
    -0.58,
    1.16
  );
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.name = 'front_label';
  labelMesh.position.y = 0.019;
  labelMesh.castShadow = true;
  labelMesh.receiveShadow = true;
  tinGroup.add(labelMesh);

  // 6. Leaning lid on +X side
  const lidPoints = [
    new THREE.Vector2(0.0, LID_HEIGHT - 0.0015),
    new THREE.Vector2(LID_RADIUS - 0.006, LID_HEIGHT - 0.0015),
    new THREE.Vector2(LID_RADIUS - 0.0045, LID_HEIGHT),
    new THREE.Vector2(LID_RADIUS - 0.0015, LID_HEIGHT),
    new THREE.Vector2(LID_RADIUS, LID_HEIGHT - 0.0018),
    new THREE.Vector2(LID_RADIUS, 0.0012),
    new THREE.Vector2(LID_RADIUS + 0.0008, 0.0006),
    new THREE.Vector2(LID_RADIUS, 0.0),
    new THREE.Vector2(LID_RADIUS - 0.0012, 0.0),
    new THREE.Vector2(LID_RADIUS - 0.0012, LID_HEIGHT - 0.0025),
    new THREE.Vector2(0.0, LID_HEIGHT - 0.0025),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  const lidMesh = new THREE.Mesh(lidGeo, brassMat);
  lidMesh.name = 'tin_lid';
  lidMesh.rotation.z = LID_TILT;

  // Position lid so its lowest rim touches y = 0 and its inner face rests against the tin
  const cosT = Math.cos(Math.abs(LID_TILT));
  const sinT = Math.sin(Math.abs(LID_TILT));
  const lidCenterY = LID_RADIUS * sinT;
  const lidCenterX = TIN_RADIUS + LID_RADIUS * cosT * 0.62;
  lidMesh.position.set(lidCenterX, lidCenterY, 0);
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;

  // Center the combined bounding box on X = 0
  const minX = -TIN_RADIUS;
  const maxX = lidCenterX + LID_RADIUS * cosT + LID_HEIGHT * sinT;
  const shiftX = -(minX + maxX) / 2;

  tinGroup.position.x = shiftX;
  lidMesh.position.x += shiftX;

  group.add(tinGroup);
  group.add(lidMesh);

  return group;
}
