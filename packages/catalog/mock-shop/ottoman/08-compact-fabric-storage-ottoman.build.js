function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.38;
  const D = 0.38;
  const H = 0.40;
  const CORNER_R = 0.022;

  const BOTTOM_TRIM_H = 0.014;
  const BODY_H = 0.315;
  const LID_OVERHANG = 0.008;
  const LID_TRIM_H = 0.018;
  const LID_SIDE_H = 0.042;
  const CUSHION_H = 0.024;
  const PIPING_R = 0.004;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc2b6a3,
    roughness: 0.92,
    metalness: 0.0
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x7d6752,
    roughness: 0.88,
    metalness: 0.0
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x3a3532,
    roughness: 0.55,
    metalness: 0.05
  });

  // Helper to create a rounded rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);

    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // Helper to extrude a rounded rectangle vertically along +Y
  function createRoundedBoxGeo(width, depth, height, radius, bevel = 0) {
    const shape = createRoundedRectShape(width - bevel * 2, depth - bevel * 2, Math.max(0.001, radius - bevel));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, height - bevel * 2),
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 8
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bottom trim band (touches y = 0)
  const bottomTrimGeo = createRoundedBoxGeo(W + 0.002, D + 0.002, BOTTOM_TRIM_H, CORNER_R, 0.002);
  addMesh(bottomTrimGeo, trimMat, 'bottom_trim', 0, 0.002, 0);

  // 2. Main fabric body
  const bodyGeo = createRoundedBoxGeo(W, D, BODY_H - BOTTOM_TRIM_H + 0.004, CORNER_R, 0.003);
  addMesh(bodyGeo, fabricMat, 'body_core', 0, BOTTOM_TRIM_H - 0.002, 0);

  // 3. Corner vertical seam details on the body
  const seamGeo = new THREE.CylinderGeometry(0.0025, 0.0025, BODY_H - BOTTOM_TRIM_H, 8);
  const seamOffsetX = W / 2 - CORNER_R * 0.29;
  const seamOffsetZ = D / 2 - CORNER_R * 0.29;
  const seamY = BOTTOM_TRIM_H + (BODY_H - BOTTOM_TRIM_H) / 2;
  addMesh(seamGeo, fabricMat, 'vertical_seam_fl', -seamOffsetX, seamY, seamOffsetZ);
  addMesh(seamGeo, fabricMat, 'vertical_seam_fr', seamOffsetX, seamY, seamOffsetZ);
  addMesh(seamGeo, fabricMat, 'vertical_seam_bl', -seamOffsetX, seamY, -seamOffsetZ);
  addMesh(seamGeo, fabricMat, 'vertical_seam_br', seamOffsetX, seamY, -seamOffsetZ);

  // 4. Lid bottom trim band
  const lidW = W + LID_OVERHANG * 2;
  const lidD = D + LID_OVERHANG * 2;
  const lidR = CORNER_R + LID_OVERHANG * 0.5;
  const lidTrimGeo = createRoundedBoxGeo(lidW + 0.002, lidD + 0.002, LID_TRIM_H, lidR, 0.002);
  addMesh(lidTrimGeo, trimMat, 'lid_bottom_trim', 0, BODY_H - 0.004, 0);

  // 5. Lid side fabric band
  const lidSideGeo = createRoundedBoxGeo(lidW, lidD, LID_SIDE_H - LID_TRIM_H + 0.006, lidR, 0.003);
  addMesh(lidSideGeo, fabricMat, 'lid_side_band', 0, BODY_H + LID_TRIM_H - 0.004, 0);

  // 6. Lid top piping (TubeGeometry along rounded rectangle)
  const pipingY = BODY_H + LID_SIDE_H - 0.002;
  const pw = lidW / 2 - 0.002;
  const pd = lidD / 2 - 0.002;
  const pr = lidR - 0.002;
  const pipingPts = [
    new THREE.Vector3(-pw + pr, pipingY, -pd),
    new THREE.Vector3(pw - pr, pipingY, -pd),
    new THREE.Vector3(pw - pr * 0.29, pipingY, -pd + pr * 0.29),
    new THREE.Vector3(pw, pipingY, -pd + pr),
    new THREE.Vector3(pw, pipingY, pd - pr),
    new THREE.Vector3(pw - pr * 0.29, pipingY, pd - pr * 0.29),
    new THREE.Vector3(pw - pr, pipingY, pd),
    new THREE.Vector3(-pw + pr, pipingY, pd),
    new THREE.Vector3(-pw + pr * 0.29, pipingY, pd - pr * 0.29),
    new THREE.Vector3(-pw, pipingY, pd - pr),
    new THREE.Vector3(-pw, pipingY, -pd + pr),
    new THREE.Vector3(-pw + pr * 0.29, pipingY, -pd + pr * 0.29)
  ];
  const pipingCurve = new THREE.CatmullRomCurve3(pipingPts, true, 'catmullrom', 0.2);
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 48, PIPING_R, 8, true);
  addMesh(pipingGeo, trimMat, 'lid_top_piping', 0, 0, 0);

  // 7. Lid top cushion (one flat padded square cushion)
  const cushionY = BODY_H + LID_SIDE_H - 0.004;
  const cushionGeo = createRoundedBoxGeo(lidW - 0.004, lidD - 0.004, CUSHION_H, lidR - 0.002, 0.010);
  addMesh(cushionGeo, fabricMat, 'lid_top_cushion', 0, cushionY, 0);

  // 8. Center tuft button
  const buttonGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.005, 16);
  addMesh(buttonGeo, buttonMat, 'center_button', 0, cushionY + CUSHION_H - 0.001, 0);

  return group;
}
