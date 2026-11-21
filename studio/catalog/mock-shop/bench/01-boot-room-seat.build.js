function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.32;
  const H = 0.46;
  const D = 0.40;

  const TOP_THICK = 0.032;
  const OVERHANG_X = 0.035;
  const OVERHANG_Z = 0.02;

  const LEG_W = 0.05;
  const LEG_H = H - TOP_THICK;
  const LEG_X = W / 2 - OVERHANG_X - LEG_W / 2;
  const LEG_Z = D / 2 - OVERHANG_Z - LEG_W / 2;

  const APRON_H = 0.065;
  const APRON_THICK = 0.024;
  const APRON_Y = LEG_H - APRON_H / 2;

  const SHELF_Y = 0.11;
  const LOWER_RAIL_H = 0.038;
  const LOWER_RAIL_THICK = 0.024;

  const SLAT_COUNT = 14;
  const SLAT_W = 0.042;
  const SLAT_THICK = 0.016;
  const SLAT_LEN = LEG_Z * 2;

  const PEG_R = 0.0065;
  const PEG_D = 0.005;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.65,
    metalness: 0.04
  });

  const pegMat = new THREE.MeshStandardMaterial({
    color: 0x6e441f,
    roughness: 0.7,
    metalness: 0.04
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx || ry || rz) {
      mesh.rotation.set(rx, ry, rz);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Top seat
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, woodMat, 'seat_top', 0, H - TOP_THICK / 2, 0);

  // Four legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legPositions = [
    ['leg_front_left', -LEG_X, LEG_Z],
    ['leg_front_right', LEG_X, LEG_Z],
    ['leg_back_left', -LEG_X, -LEG_Z],
    ['leg_back_right', LEG_X, -LEG_Z]
  ];
  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, woodMat, name, lx, LEG_H / 2, lz);
  }

  // Upper aprons
  const frontBackSpan = LEG_X * 2 - LEG_W;
  const sideSpan = LEG_Z * 2 - LEG_W;

  const fbApronGeo = new THREE.BoxGeometry(frontBackSpan, APRON_H, APRON_THICK);
  addMesh(fbApronGeo, woodMat, 'apron_front', 0, APRON_Y, LEG_Z - 0.004);
  addMesh(fbApronGeo, woodMat, 'apron_back', 0, APRON_Y, -LEG_Z + 0.004);

  const sideApronGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideSpan);
  addMesh(sideApronGeo, woodMat, 'apron_left', -LEG_X + 0.004, APRON_Y, 0);
  addMesh(sideApronGeo, woodMat, 'apron_right', LEG_X - 0.004, APRON_Y, 0);

  // Lower rails
  const fbLowerGeo = new THREE.BoxGeometry(frontBackSpan, LOWER_RAIL_H, LOWER_RAIL_THICK);
  addMesh(fbLowerGeo, woodMat, 'lower_rail_front', 0, SHELF_Y, LEG_Z - 0.004);
  addMesh(fbLowerGeo, woodMat, 'lower_rail_back', 0, SHELF_Y, -LEG_Z + 0.004);

  const sideLowerGeo = new THREE.BoxGeometry(LOWER_RAIL_THICK, LOWER_RAIL_H, sideSpan);
  addMesh(sideLowerGeo, woodMat, 'lower_rail_left', -LEG_X + 0.004, SHELF_Y, 0);
  addMesh(sideLowerGeo, woodMat, 'lower_rail_right', LEG_X - 0.004, SHELF_Y, 0);

  // Lower shelf slats
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_THICK, SLAT_LEN);
  const usableW = frontBackSpan - 0.03;
  const slatStep = usableW / (SLAT_COUNT - 1);
  const slatStartX = -usableW / 2;
  const slatY = SHELF_Y + LOWER_RAIL_H / 2 - SLAT_THICK / 2 + 0.002;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const sx = slatStartX + i * slatStep;
    addMesh(slatGeo, woodMat, `shelf_slat_${i + 1}`, sx, slatY, 0);
  }

  // Wooden pegs on front and back
  const pegGeo = new THREE.CylinderGeometry(PEG_R, PEG_R, PEG_D, 12);
  const pegZFront = LEG_Z + LEG_W / 2 + PEG_D / 2 - 0.001;
  const pegZBack = -(LEG_Z + LEG_W / 2 + PEG_D / 2 - 0.001);
  const pegYTop = APRON_Y + 0.015;
  const pegYBot = APRON_Y - 0.015;

  const legPegPositions = [
    ['peg_front_left_top', -LEG_X, pegYTop, pegZFront],
    ['peg_front_left_bot', -LEG_X, pegYBot, pegZFront],
    ['peg_front_right_top', LEG_X, pegYTop, pegZFront],
    ['peg_front_right_bot', LEG_X, pegYBot, pegZFront],
    ['peg_back_left_top', -LEG_X, pegYTop, pegZBack],
    ['peg_back_left_bot', -LEG_X, pegYBot, pegZBack],
    ['peg_back_right_top', LEG_X, pegYTop, pegZBack],
    ['peg_back_right_bot', LEG_X, pegYBot, pegZBack]
  ];
  for (const [name, px, py, pz] of legPegPositions) {
    addMesh(pegGeo, pegMat, name, px, py, pz, Math.PI / 2, 0, 0);
  }

  const apronPegZFront = LEG_Z - 0.004 + APRON_THICK / 2 + PEG_D / 2 - 0.001;
  const apronPegZBack = -(LEG_Z - 0.004 + APRON_THICK / 2 + PEG_D / 2 - 0.001);
  const apronPegX = frontBackSpan * 0.22;

  addMesh(pegGeo, pegMat, 'peg_apron_front_left', -apronPegX, APRON_Y, apronPegZFront, Math.PI / 2, 0, 0);
  addMesh(pegGeo, pegMat, 'peg_apron_front_right', apronPegX, APRON_Y, apronPegZFront, Math.PI / 2, 0, 0);
  addMesh(pegGeo, pegMat, 'peg_apron_back_left', -apronPegX, APRON_Y, apronPegZBack, Math.PI / 2, 0, 0);
  addMesh(pegGeo, pegMat, 'peg_apron_back_right', apronPegX, APRON_Y, apronPegZBack, Math.PI / 2, 0, 0);

  return group;
}
