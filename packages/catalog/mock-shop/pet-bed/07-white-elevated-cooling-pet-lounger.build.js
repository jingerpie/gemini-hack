function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.05;
  const D = 0.72;
  const H = 0.21;
  const TUBE_R = 0.014;
  const CORNER_R = 0.055;
  const FOOT_R = 0.0165;
  const FOOT_H = 0.032;
  const BED_THICK = 0.018;

  const frameY = H - TUBE_R;
  const halfW = W / 2 - TUBE_R;
  const halfD = D / 2 - TUBE_R;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4b637e,
    roughness: 0.42,
    metalness: 0.35,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e33,
    roughness: 0.85,
    metalness: 0.05,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9ec6d4,
    roughness: 0.82,
    metalness: 0.02,
  });

  const meshPanelMat = new THREE.MeshStandardMaterial({
    color: 0x94becc,
    roughness: 0.9,
    metalness: 0.0,
  });

  function makeMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // 4 corners: [sx, sz, label]
  const corners = [
    [-1, -1, 'back_left'],
    [1, -1, 'back_right'],
    [-1, 1, 'front_left'],
    [1, 1, 'front_right'],
  ];

  const legTopY = frameY - CORNER_R;
  const legH = legTopY - FOOT_H;

  corners.forEach(([sx, sz, label]) => {
    const lx = sx * halfW;
    const lz = sz * halfD;

    // Rubber foot cap
    const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.96, FOOT_H, 16);
    const foot = makeMesh(footGeo, footMat, `foot_${label}`);
    foot.position.set(lx, FOOT_H / 2, lz);
    group.add(foot);

    // Vertical leg tube
    const legGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, legH, 16);
    const leg = makeMesh(legGeo, frameMat, `leg_${label}`);
    leg.position.set(lx, FOOT_H + legH / 2, lz);
    group.add(leg);

    // Curved corner elbow connecting vertical leg to horizontal frame
    const curvePts = [
      new THREE.Vector3(lx, legTopY, lz),
      new THREE.Vector3(lx, frameY - CORNER_R * 0.35, lz - sz * CORNER_R * 0.15),
      new THREE.Vector3(lx - sx * CORNER_R * 0.35, frameY, lz - sz * CORNER_R * 0.35),
      new THREE.Vector3(lx - sx * CORNER_R, frameY, lz - sz * CORNER_R * 0.1),
    ];
    const elbowCurve = new THREE.CatmullRomCurve3(curvePts);
    const elbowGeo = new THREE.TubeGeometry(elbowCurve, 12, TUBE_R, 12, false);
    const elbow = makeMesh(elbowGeo, frameMat, `elbow_${label}`);
    group.add(elbow);
  });

  // Horizontal frame rails (front, back, left, right)
  const railLenX = W - 2 * (TUBE_R + CORNER_R * 0.5);
  const railLenZ = D - 2 * (TUBE_R + CORNER_R * 0.5);

  const frontRailGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, railLenX, 16);
  frontRailGeo.rotateZ(Math.PI / 2);

  const frontRail = makeMesh(frontRailGeo, frameMat, 'rail_front');
  frontRail.position.set(0, frameY, halfD);
  group.add(frontRail);

  const backRail = makeMesh(frontRailGeo, frameMat, 'rail_back');
  backRail.position.set(0, frameY, -halfD);
  group.add(backRail);

  const sideRailGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, railLenZ, 16);
  sideRailGeo.rotateX(Math.PI / 2);

  const leftRail = makeMesh(sideRailGeo, frameMat, 'rail_left');
  leftRail.position.set(-halfW, frameY, 0);
  group.add(leftRail);

  const rightRail = makeMesh(sideRailGeo, frameMat, 'rail_right');
  rightRail.position.set(halfW, frameY, 0);
  group.add(rightRail);

  // Fabric sleeves wrapping the 4 horizontal rails (leaving corners exposed)
  const sleeveR = TUBE_R + 0.0045;
  const sleeveLenX = W - 2 * (TUBE_R + CORNER_R * 1.15);
  const sleeveLenZ = D - 2 * (TUBE_R + CORNER_R * 1.15);

  const sleeveXGeo = new THREE.CylinderGeometry(sleeveR, sleeveR, sleeveLenX, 16);
  sleeveXGeo.rotateZ(Math.PI / 2);

  const sleeveFront = makeMesh(sleeveXGeo, fabricMat, 'sleeve_front');
  sleeveFront.position.set(0, frameY, halfD);
  group.add(sleeveFront);

  const sleeveBack = makeMesh(sleeveXGeo, fabricMat, 'sleeve_back');
  sleeveBack.position.set(0, frameY, -halfD);
  group.add(sleeveBack);

  const sleeveZGeo = new THREE.CylinderGeometry(sleeveR, sleeveR, sleeveLenZ, 16);
  sleeveZGeo.rotateX(Math.PI / 2);

  const sleeveLeft = makeMesh(sleeveZGeo, fabricMat, 'sleeve_left');
  sleeveLeft.position.set(-halfW, frameY, 0);
  group.add(sleeveLeft);

  const sleeveRight = makeMesh(sleeveZGeo, fabricMat, 'sleeve_right');
  sleeveRight.position.set(halfW, frameY, 0);
  group.add(sleeveRight);

  // Main fabric bed surface with chamfered corners
  const bedW = W - TUBE_R * 2;
  const bedD = D - TUBE_R * 2;
  const chamfer = 0.055;

  const bedShape = new THREE.Shape();
  bedShape.moveTo(-bedW / 2 + chamfer, -bedD / 2);
  bedShape.lineTo(bedW / 2 - chamfer, -bedD / 2);
  bedShape.lineTo(bedW / 2, -bedD / 2 + chamfer);
  bedShape.lineTo(bedW / 2, bedD / 2 - chamfer);
  bedShape.lineTo(bedW / 2 - chamfer, bedD / 2);
  bedShape.lineTo(-bedW / 2 + chamfer, bedD / 2);
  bedShape.lineTo(-bedW / 2, bedD / 2 - chamfer);
  bedShape.lineTo(-bedW / 2, -bedD / 2 + chamfer);
  bedShape.closePath();

  const bedGeo = new THREE.ExtrudeGeometry(bedShape, {
    depth: BED_THICK,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  bedGeo.rotateX(-Math.PI / 2);

  const bedSurface = makeMesh(bedGeo, fabricMat, 'bed_surface');
  bedSurface.position.set(0, frameY - BED_THICK / 2, 0);
  group.add(bedSurface);

  // Central cooling mesh panel
  const panelW = bedW - 0.14;
  const panelD = bedD - 0.14;
  const panelGeo = new THREE.BoxGeometry(panelW, 0.004, panelD);
  const meshPanel = makeMesh(panelGeo, meshPanelMat, 'cooling_mesh_panel');
  meshPanel.position.set(0, frameY + BED_THICK / 2 + 0.002, 0);
  group.add(meshPanel);

  return group;
}
