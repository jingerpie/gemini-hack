function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.60;
  const D = 0.80;
  const H = 0.74;
  const TOP_T = 0.028;
  const TOP_RADIUS = 0.015;

  const LEG_X = 0.56;
  const FOOT_W = 0.065;
  const FOOT_L = 0.66;
  const FOOT_H = 0.022;
  const GLIDE_H = 0.006;

  const COL_LOWER_W = 0.065;
  const COL_LOWER_D = 0.095;
  const COL_LOWER_H = 0.48;

  const COL_UPPER_W = 0.052;
  const COL_UPPER_D = 0.078;
  const COL_UPPER_H = H - TOP_T - FOOT_H - GLIDE_H - COL_LOWER_H + 0.04;

  const CROSSBAR_H = 0.13;
  const CROSSBAR_D = 0.024;
  const CROSSBAR_Y = GLIDE_H + FOOT_H + COL_LOWER_H * 0.72;

  // Materials
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xc4c4c2,
    roughness: 0.65,
    metalness: 0.05
  });

  const grommetMat = new THREE.MeshStandardMaterial({
    color: 0xa8a8a6,
    roughness: 0.5,
    metalness: 0.15
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2c2e,
    roughness: 0.42,
    metalness: 0.65
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.1
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x111315,
    roughness: 0.2,
    metalness: 0.4,
    emissive: 0x223344,
    emissiveIntensity: 0.35
  });

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

  // Rounded-corner desktop
  const topShape = new THREE.Shape();
  const hw = W / 2;
  const hd = D / 2;
  const r = TOP_RADIUS;
  topShape.moveTo(-hw + r, -hd);
  topShape.lineTo(hw - r, -hd);
  topShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  topShape.lineTo(hw, hd - r);
  topShape.quadraticCurveTo(hw, hd, hw - r, hd);
  topShape.lineTo(-hw + r, hd);
  topShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  topShape.lineTo(-hw, -hd + r);
  topShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, topMat, 'desktop', 0, H, 0);

  // Cable grommet on back center of desktop
  const grommetW = 0.22;
  const grommetD = 0.075;
  const grommetZ = -D * 0.28;
  addMesh(
    new THREE.BoxGeometry(grommetW, 0.004, grommetD),
    grommetMat,
    'cable_grommet_frame',
    0, H + 0.001, grommetZ
  );
  addMesh(
    new THREE.BoxGeometry(grommetW - 0.016, 0.005, grommetD - 0.016),
    topMat,
    'cable_grommet_lid',
    0, H + 0.0015, grommetZ
  );

  // Legs (left and right)
  const footY = GLIDE_H + FOOT_H / 2;
  const lowerColY = GLIDE_H + FOOT_H + COL_LOWER_H / 2;
  const upperColY = H - TOP_T - COL_UPPER_H / 2;
  const bracketY = H - TOP_T - 0.012;

  const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_L);
  const glideGeo = new THREE.CylinderGeometry(0.018, 0.02, GLIDE_H, 16);
  const lowerColGeo = new THREE.BoxGeometry(COL_LOWER_W, COL_LOWER_H, COL_LOWER_D);
  const upperColGeo = new THREE.BoxGeometry(COL_UPPER_W, COL_UPPER_H, COL_UPPER_D);
  const bracketGeo = new THREE.BoxGeometry(0.08, 0.024, 0.46);

  [-1, 1].forEach((side) => {
    const prefix = side < 0 ? 'left' : 'right';
    const lx = side * LEG_X;

    addMesh(footGeo, metalMat, `${prefix}_foot`, lx, footY, 0);
    addMesh(glideGeo, glideMat, `${prefix}_glide_front`, lx, GLIDE_H / 2, FOOT_L * 0.42);
    addMesh(glideGeo, glideMat, `${prefix}_glide_back`, lx, GLIDE_H / 2, -FOOT_L * 0.42);

    addMesh(lowerColGeo, metalMat, `${prefix}_column_lower`, lx, lowerColY, 0);
    addMesh(upperColGeo, metalMat, `${prefix}_column_upper`, lx, upperColY, 0);
    addMesh(bracketGeo, metalMat, `${prefix}_top_bracket`, lx, bracketY, 0);
  });

  // Horizontal crossbar between lower columns
  const crossbarW = LEG_X * 2 - COL_LOWER_W * 0.8;
  addMesh(
    new THREE.BoxGeometry(crossbarW, CROSSBAR_H, CROSSBAR_D),
    metalMat,
    'crossbar',
    0, CROSSBAR_Y, 0
  );

  // Under-desk support rail / cable tray
  addMesh(
    new THREE.BoxGeometry(LEG_X * 2 - 0.1, 0.028, 0.07),
    metalMat,
    'under_frame_rail',
    0, H - TOP_T - 0.014, -0.05
  );

  // Control panel (handset) on front-right underside
  const ctrlX = LEG_X + 0.10;
  const ctrlZ = D / 2 - 0.03;
  const ctrlY = H - TOP_T - 0.014;
  addMesh(
    new THREE.BoxGeometry(0.095, 0.022, 0.045),
    metalMat,
    'control_panel_body',
    ctrlX, ctrlY, ctrlZ,
    0.25, 0, 0
  );
  addMesh(
    new THREE.BoxGeometry(0.055, 0.008, 0.004),
    screenMat,
    'control_panel_screen',
    ctrlX, ctrlY - 0.002, ctrlZ + 0.022,
    0.25, 0, 0
  );

  return group;
}
