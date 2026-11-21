function build(THREE) {
  const group = new THREE.Group();

  const W = 0.90;
  const H = 0.085;
  const D = 0.095;
  const FOOT_H = 0.004;
  const BODY_H = H - FOOT_H;
  const CORNER_R = 0.012;
  const BEVEL = 0.003;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3c3e42,
    roughness: 0.45,
    metalness: 0.25,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x222427,
    roughness: 0.78,
    metalness: 0.15,
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x282a2d,
    roughness: 0.5,
    metalness: 0.2,
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c1e,
    roughness: 0.6,
    metalness: 0.3,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x161718,
    roughness: 0.85,
    metalness: 0.05,
  });

  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0x8a8f96,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x2a2d32,
    emissiveIntensity: 0.35,
  });

  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    shape.moveTo(-hw + radius, -hh);
    shape.lineTo(hw - radius, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
    shape.lineTo(hw, hh - radius);
    shape.quadraticCurveTo(hw, hh, hw - radius, hh);
    shape.lineTo(-hw + radius, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
    shape.lineTo(-hw, -hh + radius);
    shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
    return shape;
  }

  function addMesh(geometry, material, name, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Main housing body
  const bodyShape = createRoundedRectShape(W - 2 * BEVEL, BODY_H - 2 * BEVEL, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: D - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  bodyGeo.translate(0, 0, -(D - 2 * BEVEL) / 2);
  addMesh(bodyGeo, bodyMat, 'main_body', 0, FOOT_H + BODY_H / 2, 0);

  // Front speaker grille
  const grilleW = W - 0.016;
  const grilleH = BODY_H - 0.016;
  const grilleShape = createRoundedRectShape(grilleW, grilleH, CORNER_R - 0.003);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 12,
  });
  addMesh(grilleGeo, grilleMat, 'front_grille', 0, FOOT_H + BODY_H / 2, D / 2 - 0.0025);

  // Subtle front LED indicator
  const indicatorGeo = new THREE.BoxGeometry(0.042, 0.008, 0.001);
  addMesh(indicatorGeo, indicatorMat, 'hdmi_indicator', 0, FOOT_H + BODY_H / 2, D / 2 + 0.0016);

  // Top control buttons
  const buttonGeo = new THREE.CylinderGeometry(0.011, 0.012, 0.0025, 24);
  const buttonY = H + 0.0005;
  const buttonZ = 0.012;
  addMesh(buttonGeo, buttonMat, 'top_button_left', -0.045, buttonY, buttonZ);
  addMesh(buttonGeo, buttonMat, 'top_button_center', 0, buttonY, buttonZ);
  addMesh(buttonGeo, buttonMat, 'top_button_right', 0.045, buttonY, buttonZ);

  // Rear wall-mount brackets
  const bracketW = 0.042;
  const bracketH = 0.026;
  const bracketR = 0.006;
  const bracketShape = createRoundedRectShape(bracketW, bracketH, bracketR);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0.002, 0.0045, 0, Math.PI * 2, true);
  bracketShape.holes.push(holePath);

  const bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 12,
  });
  const bracketX = 0.22;
  const bracketY = H + 0.004;
  const bracketZ = -D / 2 + 0.004;
  addMesh(bracketGeo, bracketMat, 'rear_bracket_left', -bracketX, bracketY, bracketZ);
  addMesh(bracketGeo, bracketMat, 'rear_bracket_right', bracketX, bracketY, bracketZ);

  // Bottom rubber feet
  const footGeo = new THREE.CylinderGeometry(0.014, 0.014, FOOT_H, 16);
  const footX = W / 2 - 0.06;
  const footZ = D / 2 - 0.022;
  addMesh(footGeo, footMat, 'foot_front_left', -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_front_right', footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_back_left', -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, footMat, 'foot_back_right', footX, FOOT_H / 2, -footZ);

  return group;
}
