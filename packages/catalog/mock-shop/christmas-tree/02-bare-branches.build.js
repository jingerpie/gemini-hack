function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.46;
  const BASE_R = 0.068;
  const BASE_H = 0.014;
  const HOUSE_W = 0.105;
  const HOUSE_H = 0.075;
  const HOUSE_THICK = 0.008;
  const TRUNK_R = 0.011;
  const BRANCH_R = 0.0045;
  const TWIG_R = 0.0028;
  const GHOST_W = 0.032;
  const GHOST_H = 0.042;
  const GHOST_THICK = 0.003;
  const STRING_R = 0.0008;

  // Materials
  const treeMat = new THREE.MeshStandardMaterial({
    color: 0x1b2232,
    roughness: 0.72,
    metalness: 0.05
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x181f2e,
    roughness: 0.55,
    metalness: 0.08
  });
  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xe6dec8,
    roughness: 0.65,
    metalness: 0.02
  });
  const stringMat = new THREE.MeshStandardMaterial({
    color: 0x141822,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Round Base Disc
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32);
  const baseMesh = addMesh(baseGeo, baseMat, 'base_disc');
  baseMesh.position.y = BASE_H * 0.5;

  // 2. Haunted House Cross-Slotted Stand
  const houseShape = new THREE.Shape();
  const hw = HOUSE_W * 0.5;
  const wallH = HOUSE_H * 0.58;
  const roofOverhang = 0.008;
  houseShape.moveTo(-hw, 0);
  houseShape.lineTo(hw, 0);
  houseShape.lineTo(hw, wallH);
  houseShape.lineTo(hw + roofOverhang, wallH);
  houseShape.lineTo(0, HOUSE_H);
  houseShape.lineTo(-hw - roofOverhang, wallH);
  houseShape.lineTo(-hw, wallH);
  houseShape.closePath();

  // Window cutouts
  const win1 = new THREE.Path();
  win1.moveTo(-0.032, 0.016);
  win1.lineTo(-0.016, 0.016);
  win1.lineTo(-0.016, 0.036);
  win1.lineTo(-0.032, 0.036);
  win1.closePath();
  houseShape.holes.push(win1);

  const win2 = new THREE.Path();
  win2.moveTo(0.016, 0.016);
  win2.lineTo(0.032, 0.016);
  win2.lineTo(0.032, 0.036);
  win2.lineTo(0.016, 0.036);
  win2.closePath();
  houseShape.holes.push(win2);

  const houseGeo = new THREE.ExtrudeGeometry(houseShape, {
    depth: HOUSE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2
  });
  houseGeo.translate(0, 0, -HOUSE_THICK * 0.5);

  const houseFront = addMesh(houseGeo, baseMat, 'house_stand_front');
  houseFront.position.y = BASE_H - 0.001;

  const houseSide = addMesh(houseGeo, baseMat, 'house_stand_side');
  houseSide.position.y = BASE_H - 0.001;
  houseSide.rotation.y = Math.PI * 0.5;

  // 3. Helper for curved branches
  function makeBranch(points, radius, name) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 24, radius, 10, false);
    return addMesh(tubeGeo, treeMat, name);
  }

  // Main Trunk
  makeBranch(
    [
      [0, BASE_H + 0.02, 0],
      [0.002, 0.12, 0.002],
      [0.0, 0.19, 0.0],
      [-0.004, 0.26, -0.003],
      [-0.012, 0.34, -0.005],
      [-0.045, 0.41, -0.008],
      [-0.052, 0.445, -0.008],
      [-0.036, 0.456, -0.006],
      [-0.028, 0.442, -0.005]
    ],
    TRUNK_R * 0.72,
    'main_trunk_and_crown'
  );

  // Lower-left main branch
  makeBranch(
    [
      [-0.002, 0.185, 0.0],
      [-0.045, 0.215, 0.012],
      [-0.095, 0.205, 0.018],
      [-0.145, 0.235, 0.015],
      [-0.175, 0.25, 0.01],
      [-0.185, 0.242, 0.008],
      [-0.176, 0.236, 0.008]
    ],
    BRANCH_R,
    'branch_lower_left'
  );

  // Mid-left main branch
  makeBranch(
    [
      [-0.004, 0.245, -0.002],
      [-0.048, 0.295, -0.01],
      [-0.095, 0.33, -0.012],
      [-0.135, 0.325, -0.008],
      [-0.15, 0.31, -0.005],
      [-0.14, 0.302, -0.004]
    ],
    BRANCH_R,
    'branch_mid_left'
  );

  // Upper-left twig
  makeBranch(
    [
      [-0.02, 0.365, -0.005],
      [-0.055, 0.375, 0.005],
      [-0.072, 0.395, 0.008]
    ],
    TWIG_R,
    'twig_upper_left'
  );

  // Far-left upward curl twig
  makeBranch(
    [
      [-0.13, 0.228, 0.014],
      [-0.165, 0.265, 0.016],
      [-0.178, 0.295, 0.014],
      [-0.168, 0.305, 0.012]
    ],
    TWIG_R,
    'twig_far_left'
  );

  // Lower-right main branch
  makeBranch(
    [
      [0.002, 0.185, 0.0],
      [0.05, 0.215, -0.012],
      [0.105, 0.20, -0.015],
      [0.155, 0.225, -0.01],
      [0.178, 0.255, -0.006],
      [0.165, 0.265, -0.004]
    ],
    BRANCH_R,
    'branch_lower_right'
  );

  // Mid-right main branch
  makeBranch(
    [
      [0.002, 0.255, 0.0],
      [0.048, 0.305, 0.012],
      [0.095, 0.335, 0.016],
      [0.128, 0.37, 0.012],
      [0.135, 0.39, 0.008],
      [0.122, 0.392, 0.006]
    ],
    BRANCH_R,
    'branch_mid_right'
  );

  // Upper-right main branch
  makeBranch(
    [
      [-0.002, 0.295, -0.002],
      [0.025, 0.345, -0.008],
      [0.048, 0.385, -0.006],
      [0.042, 0.415, -0.004],
      [0.028, 0.41, -0.003]
    ],
    BRANCH_R * 0.9,
    'branch_upper_right'
  );

  // Secondary right twig
  makeBranch(
    [
      [0.04, 0.355, -0.005],
      [0.068, 0.358, 0.006],
      [0.078, 0.372, 0.008],
      [0.07, 0.375, 0.007]
    ],
    TWIG_R,
    'twig_upper_right'
  );

  // 4. Ghost Ornament Geometry
  const ghostShape = new THREE.Shape();
  const gw = GHOST_W * 0.5;
  const gh = GHOST_H;
  ghostShape.moveTo(-gw * 0.55, 0);
  // Wavy bottom hem
  ghostShape.quadraticCurveTo(-gw * 0.28, -0.004, 0, 0);
  ghostShape.quadraticCurveTo(gw * 0.28, -0.004, gw * 0.6, 0);
  // Right side + arm
  ghostShape.quadraticCurveTo(gw * 0.55, gh * 0.35, gw * 0.95, gh * 0.52);
  ghostShape.quadraticCurveTo(gw * 1.0, gh * 0.64, gw * 0.55, gh * 0.62);
  // Head
  ghostShape.quadraticCurveTo(gw * 0.45, gh, 0, gh);
  ghostShape.quadraticCurveTo(-gw * 0.45, gh, -gw * 0.55, gh * 0.62);
  // Left arm
  ghostShape.quadraticCurveTo(-gw * 1.0, gh * 0.64, -gw * 0.95, gh * 0.52);
  ghostShape.quadraticCurveTo(-gw * 0.55, gh * 0.35, -gw * 0.55, 0);

  const ghostGeo = new THREE.ExtrudeGeometry(ghostShape, {
    depth: GHOST_THICK,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 2
  });
  ghostGeo.translate(0, 0, -GHOST_THICK * 0.5);

  // 5. Place 7 Hanging Ghosts deterministically
  const ghostPlacements = [
    { name: 'ghost_upper_left', x: -0.048, y: 0.295, z: 0.005, attachY: 0.375, rotY: 0.1 },
    { name: 'ghost_mid_left', x: -0.098, y: 0.235, z: -0.012, attachY: 0.328, rotY: -0.15 },
    { name: 'ghost_lower_left', x: -0.122, y: 0.155, z: 0.016, attachY: 0.215, rotY: 0.12 },
    { name: 'ghost_center_low', x: -0.032, y: 0.21, z: 0.015, attachY: 0.285, rotY: -0.08 },
    { name: 'ghost_mid_right', x: 0.042, y: 0.235, z: 0.01, attachY: 0.312, rotY: 0.1 },
    { name: 'ghost_upper_right', x: 0.102, y: 0.268, z: 0.014, attachY: 0.345, rotY: -0.12 },
    { name: 'ghost_lower_right', x: 0.112, y: 0.148, z: -0.014, attachY: 0.205, rotY: 0.15 }
  ];

  ghostPlacements.forEach(gp => {
    const gMesh = addMesh(ghostGeo, ghostMat, gp.name);
    gMesh.position.set(gp.x, gp.y, gp.z);
    gMesh.rotation.y = gp.rotY;

    const strLen = gp.attachY - (gp.y + GHOST_H * 0.92);
    if (strLen > 0.002) {
      const strGeo = new THREE.CylinderGeometry(STRING_R, STRING_R, strLen, 6);
      const strMesh = addMesh(strGeo, stringMat, gp.name + '_string');
      strMesh.position.set(gp.x, gp.y + GHOST_H * 0.92 + strLen * 0.5, gp.z);
    }
  });

  return group;
}
