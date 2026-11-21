function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.60;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.045;
  const FRAME_THICKNESS = 0.014;
  const GLASS_THICKNESS = 0.004;
  const BACKING_THICKNESS = 0.008;
  const CENTER_Y = RADIUS;
  const Z_BACK = -DEPTH / 2;
  const Z_FRONT = DEPTH / 2;
  const RADIAL_SEGMENTS = 32;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.42,
    metalness: 0.65
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x242426,
    roughness: 0.8,
    metalness: 0.1
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x8a8f94,
    roughness: 0.35,
    metalness: 0.85
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x121212,
    roughness: 0.9,
    metalness: 0.0
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main outer frame ring (LatheGeometry rotated so Y -> +Z)
  const innerR = RADIUS - FRAME_THICKNESS;
  const lipR = innerR - 0.004;
  const glassRecessZ = Z_BACK + BACKING_THICKNESS + GLASS_THICKNESS;

  const profile = [
    new THREE.Vector2(lipR, Z_BACK),
    new THREE.Vector2(RADIUS, Z_BACK),
    new THREE.Vector2(RADIUS, Z_FRONT - 0.002),
    new THREE.Vector2(RADIUS - 0.002, Z_FRONT),
    new THREE.Vector2(innerR + 0.002, Z_FRONT),
    new THREE.Vector2(innerR, Z_FRONT - 0.002),
    new THREE.Vector2(innerR, glassRecessZ),
    new THREE.Vector2(lipR, glassRecessZ),
    new THREE.Vector2(lipR, Z_BACK)
  ];

  const frameGeo = new THREE.LatheGeometry(profile, RADIAL_SEGMENTS);
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.rotation.x = Math.PI / 2;
  frameMesh.position.set(0, CENTER_Y, 0);
  addMesh(frameMesh, "frame_ring");

  // 2. Inner bevel/shadow ring at glass perimeter
  const bevelGeo = new THREE.TorusGeometry(innerR - 0.001, 0.0015, 8, RADIAL_SEGMENTS);
  const bevelMesh = new THREE.Mesh(bevelGeo, frameMat);
  bevelMesh.position.set(0, CENTER_Y, glassRecessZ + 0.001);
  addMesh(bevelMesh, "inner_bevel_ring");

  // 3. Mirror glass disc
  const glassGeo = new THREE.CylinderGeometry(innerR - 0.0005, innerR - 0.0005, GLASS_THICKNESS, RADIAL_SEGMENTS);
  const glassMesh = new THREE.Mesh(glassGeo, mirrorMat);
  glassMesh.rotation.x = Math.PI / 2;
  glassMesh.position.set(0, CENTER_Y, Z_BACK + BACKING_THICKNESS + GLASS_THICKNESS / 2);
  addMesh(glassMesh, "mirror_glass");

  // 4. Backing board
  const backingR = innerR - 0.001;
  const backingGeo = new THREE.CylinderGeometry(backingR, backingR, BACKING_THICKNESS, RADIAL_SEGMENTS);
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.rotation.x = Math.PI / 2;
  backingMesh.position.set(0, CENTER_Y, Z_BACK + BACKING_THICKNESS / 2);
  addMesh(backingMesh, "backing_board");

  // 5. Rear mounting bar (French cleat style, flush with Z_BACK)
  const barW = 0.28;
  const barH = 0.024;
  const barD = 0.004;
  const barGeo = new THREE.BoxGeometry(barW, barH, barD);
  const barMesh = new THREE.Mesh(barGeo, hardwareMat);
  barMesh.position.set(0, CENTER_Y + 0.14, Z_BACK + barD / 2);
  addMesh(barMesh, "mounting_bar");

  // 6. Keyhole mounting brackets (left & right)
  const bracketW = 0.028;
  const bracketH = 0.042;
  const bracketD = 0.003;
  const bracketX = 0.12;
  const bracketY = CENTER_Y + 0.14;
  const bracketGeo = new THREE.BoxGeometry(bracketW, bracketH, bracketD);

  const leftBracket = new THREE.Mesh(bracketGeo, hardwareMat);
  leftBracket.position.set(-bracketX, bracketY, Z_BACK + bracketD / 2);
  addMesh(leftBracket, "keyhole_bracket_left");

  const rightBracket = new THREE.Mesh(bracketGeo, hardwareMat);
  rightBracket.position.set(bracketX, bracketY, Z_BACK + bracketD / 2);
  addMesh(rightBracket, "keyhole_bracket_right");

  // 7. Mounting bracket screws
  const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12);
  const screwOffsets = [
    [-bracketX, bracketY + 0.013, "bracket_screw_left_top"],
    [-bracketX, bracketY - 0.013, "bracket_screw_left_bottom"],
    [bracketX, bracketY + 0.013, "bracket_screw_right_top"],
    [bracketX, bracketY - 0.013, "bracket_screw_right_bottom"]
  ];
  for (let i = 0; i < screwOffsets.length; i++) {
    const [sx, sy, sname] = screwOffsets[i];
    const screw = new THREE.Mesh(screwGeo, hardwareMat);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(sx, sy, Z_BACK + 0.0015);
    addMesh(screw, sname);
  }

  // 8. Rear rubber wall bumpers (4 pads near perimeter, flush with Z_BACK)
  const bumperR = 0.009;
  const bumperD = 0.002;
  const bumperGeo = new THREE.CylinderGeometry(bumperR, bumperR, bumperD, 16);
  const bumperDist = RADIUS - FRAME_THICKNESS - 0.025;
  const bumperAngles = [
    [Math.PI * 0.25, "wall_bumper_top_right"],
    [Math.PI * 0.75, "wall_bumper_top_left"],
    [Math.PI * 1.25, "wall_bumper_bottom_left"],
    [Math.PI * 1.75, "wall_bumper_bottom_right"]
  ];
  for (let i = 0; i < bumperAngles.length; i++) {
    const [angle, bname] = bumperAngles[i];
    const bumper = new THREE.Mesh(bumperGeo, rubberMat);
    bumper.rotation.x = Math.PI / 2;
    bumper.position.set(
      Math.cos(angle) * bumperDist,
      CENTER_Y + Math.sin(angle) * bumperDist,
      Z_BACK + bumperD / 2
    );
    addMesh(bumper, bname);
  }

  return group;
}
