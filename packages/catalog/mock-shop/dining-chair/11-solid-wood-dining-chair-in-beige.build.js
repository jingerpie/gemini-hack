function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.48;
  const D = 0.52;
  const H = 0.78;
  const SEAT_H = 0.46;
  const APRON_H = 0.048;
  const APRON_T = 0.028;
  const CUSHION_H = 0.045;
  const LEG_TOP_R = 0.02;
  const LEG_BOT_R = 0.012;
  const GLIDE_H = 0.004;

  const SEAT_BASE_Y = SEAT_H - CUSHION_H;
  const APRON_CENTER_Y = SEAT_BASE_Y - APRON_H * 0.5;

  const FRONT_Z = D * 0.5 - 0.045;
  const BACK_Z = -D * 0.5 + 0.065;
  const SIDE_X = W * 0.5 - 0.035;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc59f75,
    roughness: 0.62,
    metalness: 0.0,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcbc2b4,
    roughness: 0.88,
    metalness: 0.0,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x554c42,
    roughness: 0.9,
    metalness: 0.0,
  });

  const addMesh = (geo, mat, name, pos, rot) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    group.add(mesh);
    return mesh;
  };

  // Helper for rounded rectangle shape
  const createRoundedRectShape = (w, h, r) => {
    const shape = new THREE.Shape();
    const x = -w * 0.5;
    const y = -h * 0.5;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  };

  // 1. Front Legs (tapered cylinders)
  const frontLegH = SEAT_BASE_Y - GLIDE_H;
  const frontLegGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, frontLegH, 20);
  const glideGeo = new THREE.CylinderGeometry(LEG_BOT_R * 0.95, LEG_BOT_R * 0.95, GLIDE_H, 16);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const x = side * SIDE_X;
    addMesh(
      frontLegGeo,
      woodMat,
      `front_${label}_leg`,
      [x, GLIDE_H + frontLegH * 0.5, FRONT_Z],
      [0.02, 0, side * -0.02]
    );
    addMesh(
      glideGeo,
      glideMat,
      `front_${label}_glide`,
      [x + side * 0.004, GLIDE_H * 0.5, FRONT_Z - 0.004]
    );
  });

  // 2. Back Legs & Backrest Uprights (continuous curved tubes)
  const backTopY = H - 0.04;
  const backBotZ = BACK_Z - 0.055;
  const backTopZ = BACK_Z - 0.075;

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const x = side * (SIDE_X - 0.01);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x + side * 0.005, GLIDE_H, backBotZ),
      new THREE.Vector3(x, APRON_CENTER_Y - 0.02, BACK_Z),
      new THREE.Vector3(x, SEAT_BASE_Y + 0.02, BACK_Z - 0.008),
      new THREE.Vector3(x - side * 0.015, backTopY, backTopZ),
    ]);
    const backLegGeo = new THREE.TubeGeometry(curve, 24, LEG_TOP_R * 0.88, 16, false);
    addMesh(backLegGeo, woodMat, `back_${label}_leg_upright`);

    addMesh(
      glideGeo,
      glideMat,
      `back_${label}_glide`,
      [x + side * 0.005, GLIDE_H * 0.5, backBotZ]
    );
  });

  // 3. Seat Apron Frame
  const frontRailW = SIDE_X * 2;
  const sideRailD = FRONT_Z - BACK_Z;

  const frontRailGeo = new THREE.BoxGeometry(frontRailW, APRON_H, APRON_T);
  addMesh(frontRailGeo, woodMat, 'apron_front_rail', [0, APRON_CENTER_Y, FRONT_Z]);

  const backRailGeo = new THREE.BoxGeometry(frontRailW - 0.02, APRON_H, APRON_T);
  addMesh(backRailGeo, woodMat, 'apron_back_rail', [0, APRON_CENTER_Y, BACK_Z]);

  const sideRailGeo = new THREE.BoxGeometry(APRON_T, APRON_H, sideRailD);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    addMesh(
      sideRailGeo,
      woodMat,
      `apron_${label}_rail`,
      [side * (SIDE_X - 0.004), APRON_CENTER_Y, (FRONT_Z + BACK_Z) * 0.5]
    );
  });

  // Smooth corner joints at front legs
  const cornerGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_TOP_R, APRON_H, 16);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    addMesh(cornerGeo, woodMat, `front_${label}_corner_joint`, [
      side * SIDE_X,
      APRON_CENTER_Y,
      FRONT_Z,
    ]);
  });

  // 4. Seat Cushion
  const cushionW = W - 0.02;
  const cushionD = D - 0.075;
  const cushionShape = createRoundedRectShape(cushionW, cushionD, 0.045);
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H * 0.55,
    bevelEnabled: true,
    bevelThickness: CUSHION_H * 0.45,
    bevelSize: 0.018,
    bevelSegments: 5,
    curveSegments: 16,
  });
  cushionGeo.rotateX(-Math.PI * 0.5);
  addMesh(
    cushionGeo,
    fabricMat,
    'seat_cushion',
    [0, SEAT_BASE_Y, (FRONT_Z + BACK_Z) * 0.5 + 0.008]
  );

  // 5. Curved Wooden Backrest Panel
  const backPanelW = W - 0.03;
  const backPanelH = 0.165;
  const backPanelT = 0.022;
  const backShape = createRoundedRectShape(backPanelW, backPanelH, 0.028);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: backPanelT,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16,
  });
  backGeo.translate(0, 0, -backPanelT * 0.5);

  // Curve the backrest slightly forward on the edges (concave toward +Z)
  const posAttr = backGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const curveOffset = (vx * vx) * 0.42;
    posAttr.setZ(i, vz + curveOffset);
  }
  backGeo.computeVertexNormals();

  addMesh(
    backGeo,
    woodMat,
    'backrest_panel',
    [0, H - backPanelH * 0.5 - 0.01, backTopZ + 0.015],
    [-0.14, 0, 0]
  );

  return group;
}
