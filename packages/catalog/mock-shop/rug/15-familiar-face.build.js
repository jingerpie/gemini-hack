function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.80;
  const D = 1.00;
  const THICK = 0.015;

  const BORDER_W = 0.065;
  const CREAM_LINE_W = 0.010;
  const INNER_W = W - 2 * BORDER_W;
  const INNER_D = D - 2 * BORDER_W;
  const PILE_H = 0.002;
  const TOP_Y = THICK;

  // Materials (matte tufted wool)
  const matOuterSage = new THREE.MeshStandardMaterial({
    color: 0x778970,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matLightSage = new THREE.MeshStandardMaterial({
    color: 0xa7b59e,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matShirtSage = new THREE.MeshStandardMaterial({
    color: 0x677a61,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matHairSage = new THREE.MeshStandardMaterial({
    color: 0x72846b,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matDarkSage = new THREE.MeshStandardMaterial({
    color: 0x4b5a46,
    roughness: 0.90,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe3dfd2,
    roughness: 0.90,
    metalness: 0.0,
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeTube(points, radius, mat, name) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 24, radius, 8, false);
    const mesh = new THREE.Mesh(geo, mat);
    return addMesh(mesh, name);
  }

  function makeExtrude(shape, depth, mat, name, yOffset) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 20,
    });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = yOffset;
    return addMesh(mesh, name);
  }

  // 1. Rug base
  const baseGeo = new THREE.BoxGeometry(W, THICK, D);
  const baseMesh = new THREE.Mesh(baseGeo, matOuterSage);
  baseMesh.position.y = THICK / 2;
  addMesh(baseMesh, 'rug_base');

  // 2. Inner light sage field
  const fieldGeo = new THREE.BoxGeometry(INNER_W, PILE_H, INNER_D);
  const fieldMesh = new THREE.Mesh(fieldGeo, matLightSage);
  fieldMesh.position.y = TOP_Y + PILE_H / 2 - 0.0005;
  addMesh(fieldMesh, 'rug_inner_field');

  // 3. Cream rectangular border
  const borderY = TOP_Y + PILE_H;
  const bTop = new THREE.Mesh(new THREE.BoxGeometry(INNER_W + CREAM_LINE_W, PILE_H, CREAM_LINE_W), matCream);
  bTop.position.set(0, borderY, -INNER_D / 2);
  addMesh(bTop, 'border_top');

  const bBot = new THREE.Mesh(new THREE.BoxGeometry(INNER_W + CREAM_LINE_W, PILE_H, CREAM_LINE_W), matCream);
  bBot.position.set(0, borderY, INNER_D / 2);
  addMesh(bBot, 'border_bottom');

  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(CREAM_LINE_W, PILE_H, INNER_D), matCream);
  bLeft.position.set(-INNER_W / 2, borderY, 0);
  addMesh(bLeft, 'border_left');

  const bRight = new THREE.Mesh(new THREE.BoxGeometry(CREAM_LINE_W, PILE_H, INNER_D), matCream);
  bRight.position.set(INNER_W / 2, borderY, 0);
  addMesh(bRight, 'border_right');

  // Portrait coordinates: 2D shape X -> 3D X, 2D shape Y -> 3D -Z
  const detailY = TOP_Y + PILE_H + 0.001;

  // 4. Shirt / Shoulders
  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(-INNER_W / 2 + 0.005, -INNER_D / 2 + 0.005);
  shirtShape.lineTo(INNER_W / 2 - 0.005, -INNER_D / 2 + 0.005);
  shirtShape.lineTo(INNER_W / 2 - 0.005, -0.32);
  shirtShape.quadraticCurveTo(0.18, -0.24, 0.11, -0.22);
  shirtShape.quadraticCurveTo(0.0, -0.30, -0.11, -0.22);
  shirtShape.quadraticCurveTo(-0.18, -0.24, -INNER_W / 2 + 0.005, -0.32);
  shirtShape.closePath();
  makeExtrude(shirtShape, PILE_H, matShirtSage, 'shirt_body', TOP_Y + 0.0005);

  // Shirt cream collar & shoulder lines
  makeTube([
    new THREE.Vector3(-0.11, detailY, 0.22),
    new THREE.Vector3(-0.05, detailY, 0.265),
    new THREE.Vector3(0.0, detailY, 0.28),
    new THREE.Vector3(0.05, detailY, 0.265),
    new THREE.Vector3(0.11, detailY, 0.22),
  ], 0.0045, matCream, 'shirt_collar');

  makeTube([
    new THREE.Vector3(-0.11, detailY, 0.22),
    new THREE.Vector3(-0.22, detailY, 0.26),
    new THREE.Vector3(-INNER_W / 2 + 0.008, detailY, 0.32),
  ], 0.004, matCream, 'shoulder_line_left');

  makeTube([
    new THREE.Vector3(0.11, detailY, 0.22),
    new THREE.Vector3(0.22, detailY, 0.26),
    new THREE.Vector3(INNER_W / 2 - 0.008, detailY, 0.32),
  ], 0.004, matCream, 'shoulder_line_right');

  // 5. Neck & Ponytail
  const neckShape = new THREE.Shape();
  neckShape.moveTo(-0.095, -0.22);
  neckShape.quadraticCurveTo(-0.085, -0.14, -0.09, -0.09);
  neckShape.lineTo(0.09, -0.09);
  neckShape.quadraticCurveTo(0.085, -0.14, 0.095, -0.22);
  neckShape.quadraticCurveTo(0.0, -0.27, -0.095, -0.22);
  makeExtrude(neckShape, PILE_H, matLightSage, 'neck', TOP_Y + 0.0005);

  const ponyShape = new THREE.Shape();
  ponyShape.moveTo(0.09, -0.12);
  ponyShape.quadraticCurveTo(0.14, -0.16, 0.15, -0.22);
  ponyShape.lineTo(0.10, -0.21);
  ponyShape.closePath();
  makeExtrude(ponyShape, PILE_H, matHairSage, 'hair_ponytail', TOP_Y + 0.0006);

  // 6. Face base
  const faceShape = new THREE.Shape();
  faceShape.moveTo(0, -0.15);
  faceShape.bezierCurveTo(0.08, -0.15, 0.135, -0.05, 0.135, 0.06);
  faceShape.bezierCurveTo(0.135, 0.17, 0.08, 0.24, 0, 0.24);
  faceShape.bezierCurveTo(-0.08, 0.24, -0.135, 0.17, -0.135, 0.06);
  faceShape.bezierCurveTo(-0.135, -0.05, -0.08, -0.15, 0, -0.15);
  makeExtrude(faceShape, PILE_H, matLightSage, 'face_base', TOP_Y + 0.0008);

  // Face dark outline
  makeTube([
    new THREE.Vector3(-0.132, detailY, -0.04),
    new THREE.Vector3(-0.125, detailY, 0.06),
    new THREE.Vector3(-0.075, detailY, 0.13),
    new THREE.Vector3(0.0, detailY, 0.15),
    new THREE.Vector3(0.075, detailY, 0.13),
    new THREE.Vector3(0.125, detailY, 0.06),
    new THREE.Vector3(0.132, detailY, -0.04),
  ], 0.004, matDarkSage, 'face_outline');

  // 7. Ears
  const earGeo = new THREE.CylinderGeometry(0.022, 0.022, PILE_H, 16);
  const earLeft = new THREE.Mesh(earGeo, matLightSage);
  earLeft.scale.set(0.75, 1, 1.55);
  earLeft.position.set(-0.145, TOP_Y + PILE_H, 0.005);
  addMesh(earLeft, 'ear_left');

  const earRight = new THREE.Mesh(earGeo, matLightSage);
  earRight.scale.set(0.75, 1, 1.55);
  earRight.position.set(0.145, TOP_Y + PILE_H, 0.005);
  addMesh(earRight, 'ear_right');

  // 8. Hair (left and right parted)
  const hairLeftShape = new THREE.Shape();
  hairLeftShape.moveTo(0, 0.285);
  hairLeftShape.bezierCurveTo(-0.11, 0.285, -0.175, 0.18, -0.165, 0.04);
  hairLeftShape.lineTo(-0.135, 0.04);
  hairLeftShape.bezierCurveTo(-0.13, 0.16, -0.07, 0.22, 0, 0.225);
  hairLeftShape.closePath();
  makeExtrude(hairLeftShape, PILE_H * 1.2, matHairSage, 'hair_left', TOP_Y + 0.001);

  const hairRightShape = new THREE.Shape();
  hairRightShape.moveTo(0, 0.285);
  hairRightShape.bezierCurveTo(0.11, 0.285, 0.175, 0.18, 0.165, 0.04);
  hairRightShape.lineTo(0.135, 0.04);
  hairRightShape.bezierCurveTo(0.13, 0.16, 0.07, 0.22, 0, 0.225);
  hairRightShape.closePath();
  makeExtrude(hairRightShape, PILE_H * 1.2, matHairSage, 'hair_right', TOP_Y + 0.001);

  // Hair cream highlights
  makeTube([
    new THREE.Vector3(-0.015, detailY + 0.001, -0.265),
    new THREE.Vector3(-0.085, detailY + 0.001, -0.235),
    new THREE.Vector3(-0.135, detailY + 0.001, -0.14),
  ], 0.0035, matCream, 'hair_highlight_left');

  makeTube([
    new THREE.Vector3(0.015, detailY + 0.001, -0.265),
    new THREE.Vector3(0.085, detailY + 0.001, -0.235),
    new THREE.Vector3(0.135, detailY + 0.001, -0.14),
  ], 0.0035, matCream, 'hair_highlight_right');

  // 9. Eyebrows
  makeTube([
    new THREE.Vector3(-0.105, detailY, -0.05),
    new THREE.Vector3(-0.065, detailY, -0.065),
    new THREE.Vector3(-0.028, detailY, -0.055),
  ], 0.0045, matDarkSage, 'eyebrow_left');

  makeTube([
    new THREE.Vector3(0.028, detailY, -0.055),
    new THREE.Vector3(0.065, detailY, -0.065),
    new THREE.Vector3(0.105, detailY, -0.05),
  ], 0.0045, matDarkSage, 'eyebrow_right');

  // 10. Eyes
  const eyeGeo = new THREE.CylinderGeometry(0.011, 0.011, PILE_H, 16);
  const eyeLeft = new THREE.Mesh(eyeGeo, matDarkSage);
  eyeLeft.position.set(-0.062, detailY, -0.025);
  addMesh(eyeLeft, 'eye_left');

  const eyeRight = new THREE.Mesh(eyeGeo, matDarkSage);
  eyeRight.position.set(0.062, detailY, -0.025);
  addMesh(eyeRight, 'eye_right');

  makeTube([
    new THREE.Vector3(-0.095, detailY, -0.022),
    new THREE.Vector3(-0.062, detailY, -0.036),
    new THREE.Vector3(-0.030, detailY, -0.022),
  ], 0.0028, matDarkSage, 'eye_outline_left');

  makeTube([
    new THREE.Vector3(0.030, detailY, -0.022),
    new THREE.Vector3(0.062, detailY, -0.036),
    new THREE.Vector3(0.095, detailY, -0.022),
  ], 0.0028, matDarkSage, 'eye_outline_right');

  // 11. Nose
  makeTube([
    new THREE.Vector3(-0.018, detailY, -0.02),
    new THREE.Vector3(-0.016, detailY, 0.025),
    new THREE.Vector3(-0.022, detailY, 0.042),
    new THREE.Vector3(0.0, detailY, 0.048),
    new THREE.Vector3(0.022, detailY, 0.042),
  ], 0.0032, matDarkSage, 'nose_bridge');

  // 12. Mouth
  makeTube([
    new THREE.Vector3(-0.048, detailY, 0.088),
    new THREE.Vector3(-0.018, detailY, 0.082),
    new THREE.Vector3(0.0, detailY, 0.085),
    new THREE.Vector3(0.018, detailY, 0.082),
    new THREE.Vector3(0.048, detailY, 0.088),
  ], 0.0035, matDarkSage, 'mouth');

  return group;
}
