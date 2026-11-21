function build(THREE) {
  const DIAMETER = 0.45;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.028;
  const FRAME_THICKNESS = 0.008;
  const FRAME_DEPTH = 0.026;
  const GLASS_THICKNESS = 0.004;
  const BACKING_THICKNESS = 0.006;
  const CY = RADIUS;
  const Z_MIN = -DEPTH / 2;
  const Z_MAX = DEPTH / 2;

  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xc2c6ca,
    metalness: 0.75,
    roughness: 0.32
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d30,
    metalness: 0.1,
    roughness: 0.8
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x3a3b3c,
    metalness: 0.05,
    roughness: 0.85
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x8d9297,
    metalness: 0.85,
    roughness: 0.3
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Outer circular frame
  const innerRadius = RADIUS - FRAME_THICKNESS;
  const frameShape = new THREE.Shape();
  frameShape.absarc(0, 0, RADIUS, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  frameShape.holes.push(holePath);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 32
  });
  addMesh(frameGeo, frameMat, 'frame_outer_ring', 0, CY, Z_MAX - FRAME_DEPTH - 0.001);

  // Mirror glass disc (slightly recessed from front edge)
  const glassRadius = innerRadius + 0.001;
  const glassGeo = new THREE.CylinderGeometry(glassRadius, glassRadius, GLASS_THICKNESS, 32);
  const glassZ = Z_MAX - 0.004 - GLASS_THICKNESS / 2;
  addMesh(glassGeo, mirrorMat, 'mirror_glass', 0, CY, glassZ, Math.PI / 2, 0, 0);

  // Thin inner gasket between glass and frame
  const gasketGeo = new THREE.TorusGeometry(innerRadius + 0.0005, 0.0012, 8, 32);
  addMesh(gasketGeo, gasketMat, 'mirror_gasket', 0, CY, Z_MAX - 0.0035);

  // Backing board behind mirror glass
  const backingGeo = new THREE.CylinderGeometry(glassRadius, glassRadius, BACKING_THICKNESS, 32);
  const backingZ = glassZ - GLASS_THICKNESS / 2 - BACKING_THICKNESS / 2;
  addMesh(backingGeo, backingMat, 'backing_board', 0, CY, backingZ, Math.PI / 2, 0, 0);

  // Horizontal mounting reinforcement bar on back
  const barW = DIAMETER * 0.55;
  const barH = 0.022;
  const barD = 0.004;
  const barZ = backingZ - BACKING_THICKNESS / 2 - barD / 2;
  const barGeo = new THREE.BoxGeometry(barW, barH, barD);
  addMesh(barGeo, hardwareMat, 'mounting_bar', 0, CY + RADIUS * 0.35, barZ);

  // Left and right keyhole mounting brackets
  const bracketGeo = new THREE.BoxGeometry(0.024, 0.032, 0.003);
  const bracketX = barW * 0.38;
  const bracketY = CY + RADIUS * 0.35;
  const bracketZ = barZ - barD / 2 - 0.0015;
  addMesh(bracketGeo, hardwareMat, 'mounting_bracket_left', -bracketX, bracketY, bracketZ);
  addMesh(bracketGeo, hardwareMat, 'mounting_bracket_right', bracketX, bracketY, bracketZ);

  // 4 mounting screws
  const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12);
  const screwZ = bracketZ - 0.0015;
  addMesh(screwGeo, hardwareMat, 'bracket_screw_1', -bracketX - 0.006, bracketY, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, hardwareMat, 'bracket_screw_2', -bracketX + 0.006, bracketY, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, hardwareMat, 'bracket_screw_3', bracketX - 0.006, bracketY, screwZ, Math.PI / 2, 0, 0);
  addMesh(screwGeo, hardwareMat, 'bracket_screw_4', bracketX + 0.006, bracketY, screwZ, Math.PI / 2, 0, 0);

  // 4 wall spacer bumpers (back faces touch z = Z_MIN)
  const bumperR = 0.008;
  const bumperD = (Z_MAX - FRAME_DEPTH - 0.001) - Z_MIN + 0.002;
  const bumperZ = Z_MIN + bumperD / 2;
  const bumperOffset = RADIUS - FRAME_THICKNESS * 2.5;
  const bumperGeo = new THREE.CylinderGeometry(bumperR, bumperR, bumperD, 16);

  addMesh(bumperGeo, gasketMat, 'wall_bumper_top', 0, CY + bumperOffset, bumperZ, Math.PI / 2, 0, 0);
  addMesh(bumperGeo, gasketMat, 'wall_bumper_bottom', 0, CY - bumperOffset, bumperZ, Math.PI / 2, 0, 0);
  addMesh(bumperGeo, gasketMat, 'wall_bumper_left', -bumperOffset, CY, bumperZ, Math.PI / 2, 0, 0);
  addMesh(bumperGeo, gasketMat, 'wall_bumper_right', bumperOffset, CY, bumperZ, Math.PI / 2, 0, 0);

  return group;
}
