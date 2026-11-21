function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.90;
  const H = 0.44;

  const FOOT_H = 0.005;
  const PLINTH_H = 0.038;
  const PLINTH_INSET = 0.045;
  const BODY_H = 0.220;
  const CUSHION_H = H - FOOT_H - PLINTH_H - BODY_H; // ~0.177

  const CORNER_R = 0.045;
  const BODY_BEVEL = 0.028;
  const CUSHION_BEVEL = 0.025;
  const PIPING_R = 0.0045;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb6b0a4,
    roughness: 0.92,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xa7a195,
    roughness: 0.9,
    metalness: 0.0
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x6b655e,
    roughness: 0.65,
    metalness: 0.08
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2b2927,
    roughness: 0.85,
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

  function addMesh(geometry, material, name, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Subtle rubber feet pads touching y = 0
  const plinthW = W - PLINTH_INSET * 2;
  const plinthD = D - PLINTH_INSET * 2;
  const footGeo = new THREE.CylinderGeometry(0.022, 0.024, FOOT_H, 16);
  const footOffsetX = plinthW / 2 - 0.05;
  const footOffsetZ = plinthD / 2 - 0.05;

  addMesh(footGeo, footMat, 'foot_pad_fl', -footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, footMat, 'foot_pad_fr', footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, footMat, 'foot_pad_bl', -footOffsetX, FOOT_H / 2, -footOffsetZ);
  addMesh(footGeo, footMat, 'foot_pad_br', footOffsetX, FOOT_H / 2, -footOffsetZ);

  // 2. Recessed plinth base
  const plinthGeo = new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD);
  addMesh(plinthGeo, plinthMat, 'plinth_base', 0, FOOT_H + PLINTH_H / 2, 0);

  // 3. Lower upholstered body
  const bodyCoreW = W - BODY_BEVEL * 2;
  const bodyCoreD = D - BODY_BEVEL * 2;
  const bodyShape = createRoundedRectShape(bodyCoreW, bodyCoreD, CORNER_R);
  const bodyExtrudeDepth = BODY_H - BODY_BEVEL * 2;

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyExtrudeDepth,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: BODY_BEVEL,
    bevelThickness: BODY_BEVEL,
    curveSegments: 12
  });
  bodyGeo.rotateX(-Math.PI / 2);

  const bodyBottomY = FOOT_H + PLINTH_H;
  addMesh(bodyGeo, fabricMat, 'lower_body', 0, bodyBottomY + BODY_BEVEL, 0);

  // 4. Upper seat cushion
  const cushionCoreW = W - CUSHION_BEVEL * 2;
  const cushionCoreD = D - CUSHION_BEVEL * 2;
  const cushionShape = createRoundedRectShape(cushionCoreW, cushionCoreD, CORNER_R);
  const cushionExtrudeDepth = CUSHION_H - CUSHION_BEVEL * 2;

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: cushionExtrudeDepth,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: CUSHION_BEVEL,
    bevelThickness: CUSHION_BEVEL,
    curveSegments: 12
  });
  cushionGeo.rotateX(-Math.PI / 2);

  // Slight overlap with lower body so there is no gap
  const cushionBottomY = bodyBottomY + BODY_H - 0.004;
  addMesh(cushionGeo, fabricMat, 'upper_cushion', 0, cushionBottomY + CUSHION_BEVEL, 0);

  // 5. Piping (welt) around the top perimeter of the cushion
  const pipingY = cushionBottomY + CUSHION_H - CUSHION_BEVEL * 0.72;
  const pipingSpanW = cushionCoreW - CORNER_R * 2;
  const pipingSpanD = cushionCoreD - CORNER_R * 2;
  const pipingEdgeX = W / 2 - CUSHION_BEVEL * 0.45;
  const pipingEdgeZ = D / 2 - CUSHION_BEVEL * 0.45;

  const pipeGeoX = new THREE.CylinderGeometry(PIPING_R, PIPING_R, pipingSpanW, 10);
  pipeGeoX.rotateZ(Math.PI / 2);

  const pipeGeoZ = new THREE.CylinderGeometry(PIPING_R, PIPING_R, pipingSpanD, 10);
  pipeGeoZ.rotateX(Math.PI / 2);

  addMesh(pipeGeoX, pipingMat, 'piping_top_front', 0, pipingY, pipingEdgeZ);
  addMesh(pipeGeoX, pipingMat, 'piping_top_back', 0, pipingY, -pipingEdgeZ);
  addMesh(pipeGeoZ, pipingMat, 'piping_top_left', -pipingEdgeX, pipingY, 0);
  addMesh(pipeGeoZ, pipingMat, 'piping_top_right', pipingEdgeX, pipingY, 0);

  // Corner piping arcs
  const cornerArcR = pipingEdgeX - pipingSpanW / 2;
  const cornerTorusGeo = new THREE.TorusGeometry(cornerArcR, PIPING_R, 10, 12, Math.PI / 2);
  cornerTorusGeo.rotateX(Math.PI / 2);

  const cornerCenterX = pipingSpanW / 2;
  const cornerCenterZ = pipingSpanD / 2;

  const cFR = addMesh(cornerTorusGeo, pipingMat, 'piping_corner_fr', cornerCenterX, pipingY, cornerCenterZ);
  cFR.rotation.y = 0;

  const cFL = addMesh(cornerTorusGeo, pipingMat, 'piping_corner_fl', -cornerCenterX, pipingY, cornerCenterZ);
  cFL.rotation.y = -Math.PI / 2;

  const cBL = addMesh(cornerTorusGeo, pipingMat, 'piping_corner_bl', -cornerCenterX, pipingY, -cornerCenterZ);
  cBL.rotation.y = Math.PI;

  const cBR = addMesh(cornerTorusGeo, pipingMat, 'piping_corner_br', cornerCenterX, pipingY, -cornerCenterZ);
  cBR.rotation.y = Math.PI / 2;

  // 6. Subtle bottom seam piping on the cushion
  const lowerPipingY = cushionBottomY + CUSHION_BEVEL * 0.72;
  addMesh(pipeGeoX, pipingMat, 'piping_bottom_front', 0, lowerPipingY, pipingEdgeZ);
  addMesh(pipeGeoX, pipingMat, 'piping_bottom_back', 0, lowerPipingY, -pipingEdgeZ);
  addMesh(pipeGeoZ, pipingMat, 'piping_bottom_left', -pipingEdgeX, lowerPipingY, 0);
  addMesh(pipeGeoZ, pipingMat, 'piping_bottom_right', pipingEdgeX, lowerPipingY, 0);

  return group;
}
