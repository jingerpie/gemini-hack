function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.00;
  const D = 0.38;
  const H = 0.46;

  const CUSHION_H = 0.065;
  const FRAME_H = 0.045;
  const LEG_H = H - CUSHION_H - FRAME_H;
  const LEG_R = 0.022;
  const LEG_INSET_X = 0.10;
  const LEG_INSET_Z = 0.065;
  const LEG_X = W / 2 - LEG_INSET_X;
  const LEG_Z = D / 2 - LEG_INSET_Z;

  const SHELF_Y = 0.11;
  const RAIL_H = 0.024;
  const RAIL_T = 0.022;
  const SLAT_H = 0.012;
  const SLAT_W = 0.024;
  const SLAT_COUNT = 15;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa6825b,
    roughness: 0.65,
    metalness: 0.0
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xa69d91,
    roughness: 0.88,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.4,
    metalness: 0.7
  });

  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw, hd);
    shape.moveTo(-hw + cr, -hd);
    shape.lineTo(hw - cr, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    shape.lineTo(hw, hd - cr);
    shape.quadraticCurveTo(hw, hd, hw - cr, hd);
    shape.lineTo(-hw + cr, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    shape.lineTo(-hw, -hd + cr);
    shape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return shape;
  }

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

  // 1. Wooden Seat Frame
  const frameBevel = 0.012;
  const frameShape = makeRoundedRectShape(
    W - frameBevel * 2,
    D - frameBevel * 2,
    0.05
  );
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_H - frameBevel * 2,
    bevelEnabled: true,
    bevelThickness: frameBevel,
    bevelSize: frameBevel,
    bevelSegments: 4,
    curveSegments: 16
  });
  frameGeo.rotateX(-Math.PI / 2);
  addMesh(frameGeo, woodMat, "seat_frame", 0, LEG_H + frameBevel, 0);

  // 2. Top Cushion
  const cushionBevel = 0.018;
  const cushionInset = 0.015;
  const cushionShape = makeRoundedRectShape(
    W - cushionInset * 2 - cushionBevel * 2,
    D - cushionInset * 2 - cushionBevel * 2,
    0.045
  );
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - cushionBevel * 2,
    bevelEnabled: true,
    bevelThickness: cushionBevel,
    bevelSize: cushionBevel,
    bevelSegments: 5,
    curveSegments: 16
  });
  cushionGeo.rotateX(-Math.PI / 2);
  addMesh(cushionGeo, fabricMat, "seat_cushion", 0, LEG_H + FRAME_H + cushionBevel - 0.004, 0);

  // 3. Four Cylindrical Legs
  const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R, LEG_H + 0.005, 24);
  const legPositions = [
    ["leg_front_left", -LEG_X, LEG_Z],
    ["leg_front_right", LEG_X, LEG_Z],
    ["leg_back_left", -LEG_X, -LEG_Z],
    ["leg_back_right", LEG_X, -LEG_Z]
  ];
  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, woodMat, name, lx, (LEG_H + 0.005) / 2, lz);
  }

  // 4. Lower Shelf Rails
  const longRailLen = LEG_X * 2;
  const longRailGeo = new THREE.BoxGeometry(longRailLen, RAIL_H, RAIL_T);
  addMesh(longRailGeo, woodMat, "shelf_rail_front", 0, SHELF_Y + RAIL_H / 2, LEG_Z);
  addMesh(longRailGeo, woodMat, "shelf_rail_back", 0, SHELF_Y + RAIL_H / 2, -LEG_Z);

  const sideRailLen = LEG_Z * 2;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailLen);
  addMesh(sideRailGeo, woodMat, "shelf_rail_left", -LEG_X, SHELF_Y + RAIL_H / 2, 0);
  addMesh(sideRailGeo, woodMat, "shelf_rail_right", LEG_X, SHELF_Y + RAIL_H / 2, 0);

  // 5. Lower Shelf Slats
  const slatLen = LEG_Z * 2 + RAIL_T * 0.6;
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, slatLen);
  const usableSpan = LEG_X * 2 - LEG_R * 2 - 0.02;
  const step = usableSpan / (SLAT_COUNT - 1);
  const startX = -usableSpan / 2;
  for (let i = 0; i < SLAT_COUNT; i++) {
    const sx = startX + i * step;
    addMesh(slatGeo, woodMat, `shelf_slat_${i + 1}`, sx, SHELF_Y + RAIL_H + SLAT_H / 2 - 0.002, 0);
  }

  // 6. Small Metal Corner Brackets under Shelf
  const bracketGeo = new THREE.BoxGeometry(0.028, 0.018, 0.014);
  const bracketOffset = LEG_R + 0.012;
  addMesh(bracketGeo, metalMat, "bracket_front_left", -LEG_X + bracketOffset, SHELF_Y - 0.006, LEG_Z);
  addMesh(bracketGeo, metalMat, "bracket_front_right", LEG_X - bracketOffset, SHELF_Y - 0.006, LEG_Z);
  addMesh(bracketGeo, metalMat, "bracket_back_left", -LEG_X + bracketOffset, SHELF_Y - 0.006, -LEG_Z);
  addMesh(bracketGeo, metalMat, "bracket_back_right", LEG_X - bracketOffset, SHELF_Y - 0.006, -LEG_Z);

  return group;
}
