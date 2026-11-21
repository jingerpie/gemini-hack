function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.85;
  const D = 1.35;
  const H = 0.44;
  const TOP_T = 0.055;
  const LEG_W = 0.11;
  const LEG_D = 0.11;
  const LEG_H = H - TOP_T;
  const LEG_X = W * 0.5 - 0.135;
  const LEG_Z = D * 0.5 - 0.15;

  const APRON_H = 0.065;
  const APRON_T = 0.045;
  const STRETCHER_H = 0.065;
  const STRETCHER_T = 0.06;
  const STRETCHER_Y = 0.12;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3f,
    roughness: 0.68,
    metalness: 0.0
  });

  const woodAltMat = new THREE.MeshStandardMaterial({
    color: 0x8f6036,
    roughness: 0.72,
    metalness: 0.0
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x362012,
    roughness: 0.85,
    metalness: 0.0
  });

  function makeMesh(geom, mat, name) {
    const m = new THREE.Mesh(geom, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Helper to create a live-edge plank extruded vertically
  function createPlank(isLeft) {
    const shape = new THREE.Shape();
    const halfW = W * 0.5;
    const halfD = D * 0.5;
    const sign = isLeft ? -1 : 1;

    // Inner edge along X ~ 0 (with subtle organic wave)
    const innerPts = [
      [sign * 0.004, -halfD],
      [sign * 0.008, -halfD * 0.6],
      [sign * 0.002, -halfD * 0.2],
      [sign * 0.012, halfD * 0.15],
      [sign * 0.003, halfD * 0.5],
      [sign * 0.006, halfD * 0.8],
      [sign * 0.003, halfD]
    ];

    // Outer live edge
    const outerPts = [
      [sign * (halfW - 0.01), halfD],
      [sign * (halfW + 0.005), halfD * 0.65],
      [sign * (halfW - 0.012), halfD * 0.3],
      [sign * (halfW + 0.008), -halfD * 0.05],
      [sign * (halfW - 0.006), -halfD * 0.45],
      [sign * (halfW + 0.004), -halfD * 0.8],
      [sign * (halfW - 0.01), -halfD]
    ];

    shape.moveTo(innerPts[0][0], innerPts[0][1]);
    for (let i = 1; i < innerPts.length; i++) {
      shape.lineTo(innerPts[i][0], innerPts[i][1]);
    }
    for (let i = 0; i < outerPts.length; i++) {
      shape.lineTo(outerPts[i][0], outerPts[i][1]);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: TOP_T - 0.014,
      bevelEnabled: true,
      bevelThickness: 0.007,
      bevelSize: 0.007,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }

  // Tabletop planks
  const leftPlank = makeMesh(createPlank(true), woodMat, 'top_plank_left');
  leftPlank.position.y = LEG_H + 0.007;
  group.add(leftPlank);

  const rightPlank = makeMesh(createPlank(false), woodMat, 'top_plank_right');
  rightPlank.position.y = LEG_H + 0.007;
  group.add(rightPlank);

  // Dark center crack fill
  const crackGeom = new THREE.BoxGeometry(0.012, TOP_T - 0.012, D - 0.02);
  const centerCrack = makeMesh(crackGeom, darkWoodMat, 'top_center_crack');
  centerCrack.position.set(0, LEG_H + TOP_T * 0.5 - 0.004, 0);
  group.add(centerCrack);

  // Distinctive knots / voids on the top surface & front edge
  const knotData = [
    { name: 'top_knot_front_left', x: -0.09, y: H - 0.012, z: D * 0.5 - 0.03, sx: 0.035, sy: 0.022, sz: 0.045 },
    { name: 'top_knot_front_right', x: 0.11, y: H - 0.012, z: D * 0.5 - 0.035, sx: 0.032, sy: 0.02, sz: 0.038 },
    { name: 'top_knot_mid_left', x: -0.1, y: H - 0.004, z: 0.25, sx: 0.018, sy: 0.01, sz: 0.09 },
    { name: 'top_knot_mid_right', x: 0.095, y: H - 0.004, z: -0.18, sx: 0.016, sy: 0.01, sz: 0.075 }
  ];

  knotData.forEach((k) => {
    const kGeom = new THREE.BoxGeometry(k.sx, k.sy, k.sz);
    const kMesh = makeMesh(kGeom, darkWoodMat, k.name);
    kMesh.position.set(k.x, k.y, k.z);
    group.add(kMesh);
  });

  // 4 Block Legs
  const legGeom = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const legPositions = [
    { name: 'leg_front_left', x: -LEG_X, z: LEG_Z },
    { name: 'leg_front_right', x: LEG_X, z: LEG_Z },
    { name: 'leg_back_left', x: -LEG_X, z: -LEG_Z },
    { name: 'leg_back_right', x: LEG_X, z: -LEG_Z }
  ];

  legPositions.forEach((lp) => {
    const leg = makeMesh(legGeom, woodMat, lp.name);
    leg.position.set(lp.x, LEG_H * 0.5, lp.z);
    group.add(leg);
  });

  // Subtle vertical crack detail on front-right leg
  const legCrackGeom = new THREE.BoxGeometry(0.01, 0.12, 0.014);
  const legCrack = makeMesh(legCrackGeom, darkWoodMat, 'leg_crack_front_right');
  legCrack.position.set(LEG_X - LEG_W * 0.35, LEG_H * 0.55, LEG_Z + LEG_D * 0.5 - 0.004);
  legCrack.rotation.z = 0.08;
  group.add(legCrack);

  // Upper Aprons (front and back)
  const crossSpan = LEG_X * 2 - LEG_W + 0.01;
  const apronGeom = new THREE.BoxGeometry(crossSpan, APRON_H, APRON_T);

  const apronFront = makeMesh(apronGeom, woodAltMat, 'apron_front');
  apronFront.position.set(0, LEG_H - APRON_H * 0.5, LEG_Z);
  group.add(apronFront);

  const apronBack = makeMesh(apronGeom, woodAltMat, 'apron_back');
  apronBack.position.set(0, LEG_H - APRON_H * 0.5, -LEG_Z);
  group.add(apronBack);

  // Lower Cross Stretchers (front and back)
  const crossStretcherGeom = new THREE.BoxGeometry(crossSpan, STRETCHER_H, STRETCHER_T);

  const stretcherFront = makeMesh(crossStretcherGeom, woodAltMat, 'stretcher_front');
  stretcherFront.position.set(0, STRETCHER_Y, LEG_Z);
  group.add(stretcherFront);

  const stretcherBack = makeMesh(crossStretcherGeom, woodAltMat, 'stretcher_back');
  stretcherBack.position.set(0, STRETCHER_Y, -LEG_Z);
  group.add(stretcherBack);

  // Central Longitudinal Stretcher
  const centerSpan = LEG_Z * 2;
  const centerStretcherGeom = new THREE.BoxGeometry(STRETCHER_T + 0.01, STRETCHER_H, centerSpan);
  const stretcherCenter = makeMesh(centerStretcherGeom, woodAltMat, 'stretcher_center');
  stretcherCenter.position.set(0, STRETCHER_Y, 0);
  group.add(stretcherCenter);

  // Exposed Tenon Ends on front and back stretchers
  const tenonGeom = new THREE.BoxGeometry(STRETCHER_T + 0.012, STRETCHER_H - 0.012, 0.012);
  const tenonFront = makeMesh(tenonGeom, darkWoodMat, 'tenon_front');
  tenonFront.position.set(0, STRETCHER_Y, LEG_Z + STRETCHER_T * 0.5);
  group.add(tenonFront);

  const tenonBack = makeMesh(tenonGeom, darkWoodMat, 'tenon_back');
  tenonBack.position.set(0, STRETCHER_Y, -LEG_Z - STRETCHER_T * 0.5);
  group.add(tenonBack);

  return group;
}
