function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const H = 0.60;
  const D = 0.024;
  const FRAME_W = 0.010;
  const R_OUTER = W / 2;
  const R_INNER = R_OUTER - FRAME_W;
  const STRAIGHT_H = H - R_OUTER;
  const Z_BACK = -D / 2;

  const BACKING_D = 0.006;
  const GLASS_D = 0.004;
  const GLASS_Z = Z_BACK + BACKING_D;
  const RECESS_D = D - BACKING_D - GLASS_D;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xa69b90,
    roughness: 0.42,
    metalness: 0.25,
  });

  const innerLipMat = new THREE.MeshStandardMaterial({
    color: 0x877d73,
    roughness: 0.55,
    metalness: 0.2,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x3b3530,
    roughness: 0.85,
    metalness: 0.05,
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x7a7d80,
    roughness: 0.35,
    metalness: 0.85,
  });

  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create an arched 2D shape
  function createArchShape(halfW, straightH, radius) {
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(halfW, straightH);
    shape.absarc(0, straightH, radius, 0, Math.PI, false);
    shape.lineTo(-halfW, 0);
    return shape;
  }

  // 1. Backing board (flush with Z_BACK)
  const backingShape = createArchShape(R_OUTER - 0.002, STRAIGHT_H, R_OUTER - 0.002);
  const backingGeo = new THREE.ExtrudeGeometry(backingShape, {
    depth: BACKING_D,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(backingGeo, backingMat, "backing_board", 0, 0.002, Z_BACK);

  // 2. Mirror glass
  const glassShape = createArchShape(R_INNER + 0.001, STRAIGHT_H, R_INNER + 0.001);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: GLASS_D,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(glassGeo, glassMat, "mirror_glass", 0, FRAME_W - 0.001, GLASS_Z);

  // 3. Outer frame - straight sides and bottom
  const bottomGeo = new THREE.BoxGeometry(W, FRAME_W, D);
  addMesh(bottomGeo, frameMat, "frame_bottom", 0, FRAME_W / 2, 0);

  const sideH = STRAIGHT_H - FRAME_W;
  const sideGeo = new THREE.BoxGeometry(FRAME_W, sideH, D);
  addMesh(sideGeo, frameMat, "frame_left", -R_OUTER + FRAME_W / 2, FRAME_W + sideH / 2, 0);
  addMesh(sideGeo, frameMat, "frame_right", R_OUTER - FRAME_W / 2, FRAME_W + sideH / 2, 0);

  // 4. Outer frame - semicircular arch
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, R_OUTER, 0, Math.PI, false);
  archShape.lineTo(-R_INNER, 0);
  archShape.absarc(0, 0, R_INNER, Math.PI, 0, true);
  archShape.closePath();

  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: D,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(archGeo, frameMat, "frame_arch", 0, STRAIGHT_H, Z_BACK);

  // 5. Inner recessed lip around glass
  const lipW = 0.002;
  const lipZ = GLASS_Z + GLASS_D + RECESS_D / 2 - 0.002;
  const lipBottomGeo = new THREE.BoxGeometry(W - FRAME_W * 2, lipW, RECESS_D * 0.5);
  addMesh(lipBottomGeo, innerLipMat, "inner_lip_bottom", 0, FRAME_W + lipW / 2, lipZ);

  const lipSideGeo = new THREE.BoxGeometry(lipW, sideH, RECESS_D * 0.5);
  addMesh(lipSideGeo, innerLipMat, "inner_lip_left", -R_INNER + lipW / 2, FRAME_W + sideH / 2, lipZ);
  addMesh(lipSideGeo, innerLipMat, "inner_lip_right", R_INNER - lipW / 2, FRAME_W + sideH / 2, lipZ);

  // 6. Back mounting hardware (flush with Z_BACK)
  const hangerW = 0.022;
  const hangerH = 0.036;
  const hangerD = 0.002;
  const hangerGeo = new THREE.BoxGeometry(hangerW, hangerH, hangerD);
  const hangerY = STRAIGHT_H - 0.04;
  const hangerX = R_OUTER - 0.055;
  addMesh(hangerGeo, hardwareMat, "mounting_bracket_left", -hangerX, hangerY, Z_BACK + hangerD / 2);
  addMesh(hangerGeo, hardwareMat, "mounting_bracket_right", hangerX, hangerY, Z_BACK + hangerD / 2);

  // 7. Bottom wall bumpers (flush with Z_BACK)
  const bumperR = 0.006;
  const bumperD = 0.002;
  const bumperGeo = new THREE.CylinderGeometry(bumperR, bumperR, bumperD, 16);
  const bumperX = R_OUTER - 0.035;
  const bumperY = 0.030;
  addMesh(bumperGeo, bumperMat, "wall_bumper_left", -bumperX, bumperY, Z_BACK + bumperD / 2, Math.PI / 2, 0, 0);
  addMesh(bumperGeo, bumperMat, "wall_bumper_right", bumperX, bumperY, Z_BACK + bumperD / 2, Math.PI / 2, 0, 0);

  return group;
}
