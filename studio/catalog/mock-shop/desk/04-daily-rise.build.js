function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.10;
  const D = 0.60;
  const H = 0.75;
  const TOP_THICK = 0.026;
  const TOP_SURFACE_THICK = 0.003;
  const CORNER_R = 0.025;

  const LEG_X = 0.415;
  const GLIDE_H = 0.006;
  const FOOT_LEN = 0.54;
  const FOOT_W = 0.068;
  const FOOT_H = 0.018;

  const LOWER_COL_W = 0.058;
  const LOWER_COL_D = 0.080;
  const LOWER_COL_H = 0.44;
  const UPPER_COL_W = 0.048;
  const UPPER_COL_D = 0.070;

  const CROSSBAR_Y = 0.36;
  const CROSSBAR_H = 0.052;
  const CROSSBAR_D = 0.024;

  const BRACKET_W = 0.044;
  const BRACKET_H = 0.024;
  const BRACKET_LEN = 0.46;

  // Materials
  const matGreyTop = new THREE.MeshStandardMaterial({
    color: 0x9aa0a3,
    roughness: 0.65,
    metalness: 0.02
  });

  const matPlywood = new THREE.MeshStandardMaterial({
    color: 0xcab08e,
    roughness: 0.72,
    metalness: 0.0
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x2f3336,
    roughness: 0.45,
    metalness: 0.55
  });

  const matDarkPlastic = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.6,
    metalness: 0.1
  });

  const matButton = new THREE.MeshStandardMaterial({
    color: 0x55595c,
    roughness: 0.4,
    metalness: 0.2
  });

  // Helper for rounded rectangle shape
  function makeRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Desktop (Plywood core + Grey laminate top)
  const topShape = makeRoundedRectShape(W, D, CORNER_R);

  const plyGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK - TOP_SURFACE_THICK,
    bevelEnabled: false,
    curveSegments: 12
  });
  plyGeo.rotateX(Math.PI / 2);
  addMesh(plyGeo, matPlywood, "desktop_plywood_core", 0, H - TOP_SURFACE_THICK, 0);

  const surfaceGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_SURFACE_THICK,
    bevelEnabled: false,
    curveSegments: 12
  });
  surfaceGeo.rotateX(Math.PI / 2);
  addMesh(surfaceGeo, matGreyTop, "desktop_grey_surface", 0, H, 0);

  // 2. Legs (Left and Right)
  const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_LEN);
  const glideGeo = new THREE.CylinderGeometry(0.016, 0.018, GLIDE_H, 16);
  const lowerColGeo = new THREE.BoxGeometry(LOWER_COL_W, LOWER_COL_H, LOWER_COL_D);
  const collarGeo = new THREE.BoxGeometry(LOWER_COL_W + 0.004, 0.012, LOWER_COL_D + 0.004);

  const upperColBottomY = GLIDE_H + FOOT_H + LOWER_COL_H - 0.04;
  const upperColTopY = H - TOP_THICK - BRACKET_H + 0.005;
  const upperColH = upperColTopY - upperColBottomY;
  const upperColGeo = new THREE.BoxGeometry(UPPER_COL_W, upperColH, UPPER_COL_D);

  const bracketGeo = new THREE.BoxGeometry(BRACKET_W, BRACKET_H, BRACKET_LEN);

  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? "left" : "right";
    const x = side * LEG_X;

    // Leveling glides
    addMesh(glideGeo, matDarkPlastic, `glide_${sideName}_front`, x, GLIDE_H / 2, FOOT_LEN / 2 - 0.04);
    addMesh(glideGeo, matDarkPlastic, `glide_${sideName}_back`, x, GLIDE_H / 2, -FOOT_LEN / 2 + 0.04);

    // Foot
    addMesh(footGeo, matMetal, `foot_${sideName}`, x, GLIDE_H + FOOT_H / 2, 0);

    // Lower outer column
    const lowerColY = GLIDE_H + FOOT_H + LOWER_COL_H / 2;
    addMesh(lowerColGeo, matMetal, `lower_column_${sideName}`, x, lowerColY, 0);

    // Column collar
    addMesh(collarGeo, matDarkPlastic, `column_collar_${sideName}`, x, GLIDE_H + FOOT_H + LOWER_COL_H, 0);

    // Upper inner column
    addMesh(upperColGeo, matMetal, `upper_column_${sideName}`, x, upperColBottomY + upperColH / 2, 0);

    // Under-desk support bracket
    addMesh(bracketGeo, matMetal, `support_bracket_${sideName}`, x, H - TOP_THICK - BRACKET_H / 2, 0);
  });

  // 3. Crossbar & end plates
  const crossbarLen = LEG_X * 2 - LOWER_COL_W;
  const crossbarGeo = new THREE.BoxGeometry(crossbarLen, CROSSBAR_H, CROSSBAR_D);
  addMesh(crossbarGeo, matMetal, "crossbar", 0, CROSSBAR_Y, 0);

  const endPlateGeo = new THREE.BoxGeometry(0.008, CROSSBAR_H + 0.024, CROSSBAR_D + 0.016);
  addMesh(endPlateGeo, matMetal, "crossbar_plate_left", -LEG_X + LOWER_COL_W / 2 + 0.002, CROSSBAR_Y, 0);
  addMesh(endPlateGeo, matMetal, "crossbar_plate_right", LEG_X - LOWER_COL_W / 2 - 0.002, CROSSBAR_Y, 0);

  // 4. Control panel (handset) under front-right edge
  const ctrlW = 0.115;
  const ctrlH = 0.020;
  const ctrlD = 0.042;
  const ctrlX = 0.21;
  const ctrlY = H - TOP_THICK - ctrlH / 2 + 0.002;
  const ctrlZ = D / 2 - 0.035;

  const ctrlGeo = new THREE.BoxGeometry(ctrlW, ctrlH, ctrlD);
  addMesh(ctrlGeo, matDarkPlastic, "control_panel", ctrlX, ctrlY, ctrlZ, 0.22, 0, 0);

  const btnGeo = new THREE.BoxGeometry(0.014, 0.008, 0.004);
  for (let i = 0; i < 4; i++) {
    const bx = ctrlX - 0.03 + i * 0.02;
    addMesh(btnGeo, matButton, `control_button_${i + 1}`, bx, ctrlY - 0.002, ctrlZ + ctrlD / 2, 0.22, 0, 0);
  }

  return group;
}
