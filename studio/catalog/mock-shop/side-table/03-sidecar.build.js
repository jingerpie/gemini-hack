function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.42;
  const D = 0.46;
  const H_TOP = 0.60;
  const TUBE = 0.024;
  const GLIDE_H = 0.004;
  const TOP_THICK = 0.018;
  const LIP_H = 0.020;
  const LIP_T = 0.016;
  const R_OUT = 0.045;
  const R_IN = R_OUT - TUBE;
  const TOP_OVERHANG = 0.025;

  const FRAME_Y0 = GLIDE_H;
  const FRAME_Y1 = H_TOP - TOP_THICK;
  const Z_BACK = -D / 2;
  const Z_FRONT = D / 2;
  const Z_TOP_FRONT = Z_FRONT - TOP_OVERHANG;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.45,
    metalness: 0.65,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.72,
    metalness: 0.05,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x0e0f10,
    roughness: 0.35,
    metalness: 0.8,
  });

  // 2D C-frame profile in (Z, Y) coordinates
  const cShape = new THREE.Shape();
  cShape.moveTo(Z_FRONT, FRAME_Y0);
  cShape.lineTo(Z_BACK + R_OUT, FRAME_Y0);
  cShape.absarc(Z_BACK + R_OUT, FRAME_Y0 + R_OUT, R_OUT, -Math.PI / 2, -Math.PI, true);
  cShape.lineTo(Z_BACK, FRAME_Y1 - R_OUT);
  cShape.absarc(Z_BACK + R_OUT, FRAME_Y1 - R_OUT, R_OUT, Math.PI, Math.PI / 2, true);
  cShape.lineTo(Z_TOP_FRONT, FRAME_Y1);
  cShape.lineTo(Z_TOP_FRONT, FRAME_Y1 - TUBE);
  cShape.lineTo(Z_BACK + R_OUT, FRAME_Y1 - TUBE);
  cShape.absarc(Z_BACK + R_OUT, FRAME_Y1 - R_OUT, R_IN, Math.PI / 2, Math.PI, false);
  cShape.lineTo(Z_BACK + TUBE, FRAME_Y0 + R_OUT);
  cShape.absarc(Z_BACK + R_OUT, FRAME_Y0 + R_OUT, R_IN, Math.PI, -Math.PI / 2, false);
  cShape.lineTo(Z_FRONT, FRAME_Y0 + TUBE);
  cShape.closePath();

  const frameGeo = new THREE.ExtrudeGeometry(cShape, {
    depth: TUBE,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 16,
  });
  // Rotate so shape X->Z, Y->Y, extrude Z->X
  frameGeo.rotateY(-Math.PI / 2);

  const leftFrame = new THREE.Mesh(frameGeo, metalMat);
  leftFrame.name = 'left_c_frame';
  leftFrame.position.x = -W / 2 + TUBE;
  group.add(leftFrame);

  const rightFrame = new THREE.Mesh(frameGeo, metalMat);
  rightFrame.name = 'right_c_frame';
  rightFrame.position.x = W / 2;
  group.add(rightFrame);

  // Bottom crossbars connecting left and right C-frames
  const barLen = W - 2 * TUBE;
  const barGeo = new THREE.BoxGeometry(barLen, TUBE, TUBE);

  const bottomFrontBar = new THREE.Mesh(barGeo, metalMat);
  bottomFrontBar.name = 'bottom_front_bar';
  bottomFrontBar.position.set(0, FRAME_Y0 + TUBE / 2, Z_FRONT - TUBE / 2);
  group.add(bottomFrontBar);

  const bottomBackBar = new THREE.Mesh(barGeo, metalMat);
  bottomBackBar.name = 'bottom_back_bar';
  bottomBackBar.position.set(0, FRAME_Y0 + TUBE / 2, Z_BACK + TUBE / 2);
  group.add(bottomBackBar);

  // Floor glides
  const glideGeo = new THREE.CylinderGeometry(0.010, 0.010, GLIDE_H, 16);
  const glideX = W / 2 - TUBE / 2;
  const glidePositions = [
    [-glideX, Z_FRONT - TUBE / 2, 'glide_front_left'],
    [glideX, Z_FRONT - TUBE / 2, 'glide_front_right'],
    [-glideX, Z_BACK + R_OUT, 'glide_back_left'],
    [glideX, Z_BACK + R_OUT, 'glide_back_right'],
  ];
  glidePositions.forEach(([gx, gz, name]) => {
    const glide = new THREE.Mesh(glideGeo, screwMat);
    glide.name = name;
    glide.position.set(gx, GLIDE_H / 2, gz);
    group.add(glide);
  });

  // Tabletop
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  const tabletop = new THREE.Mesh(topGeo, woodMat);
  tabletop.name = 'tabletop';
  tabletop.position.set(0, FRAME_Y1 + TOP_THICK / 2, 0);
  group.add(tabletop);

  // Back raised lip on tabletop
  const lipGeo = new THREE.BoxGeometry(W, LIP_H, LIP_T);
  const backLip = new THREE.Mesh(lipGeo, woodMat);
  backLip.name = 'tabletop_back_lip';
  backLip.position.set(0, H_TOP + LIP_H / 2, Z_BACK + LIP_T / 2);
  group.add(backLip);

  // Visible side screws on top horizontal rails (3 per side)
  const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 12);
  screwGeo.rotateZ(Math.PI / 2);
  const screwZPositions = [Z_BACK + R_OUT + 0.02, 0, Z_TOP_FRONT - 0.03];
  const screwY = FRAME_Y1 - TUBE / 2;

  screwZPositions.forEach((sz, idx) => {
    const leftScrew = new THREE.Mesh(screwGeo, screwMat);
    leftScrew.name = `left_rail_screw_${idx + 1}`;
    leftScrew.position.set(-W / 2 - 0.001, screwY, sz);
    group.add(leftScrew);

    const rightScrew = new THREE.Mesh(screwGeo, screwMat);
    rightScrew.name = `right_rail_screw_${idx + 1}`;
    rightScrew.position.set(W / 2 + 0.001, screwY, sz);
    group.add(rightScrew);
  });

  // Enable shadows on all meshes
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
