function build(THREE) {
  const group = new THREE.Group();

  // Overall dimensions (meters)
  const W = 1.00;           // Overall width along X (100 cm)
  const D = 0.56;           // Overall depth along Z
  const H = 0.42;           // Overall height along Y

  const TOP_T = 0.036;      // Tabletop thickness
  const OVERHANG_X = 0.045; // Top overhang on left/right
  const OVERHANG_Z = 0.035; // Top overhang on front/back

  const LEG_W = 0.055;      // Leg width/depth
  const LEG_H = H - TOP_T;  // Leg height from floor to underside of top

  const UPPER_RAIL_H = 0.062;
  const RAIL_T = 0.028;

  const LOWER_RAIL_H = 0.042;
  const LOWER_RAIL_Y = 0.065; // Bottom of lower rail from floor
  const SHELF_T = 0.022;

  const PEG_R = 0.0045;
  const PEG_L = 0.006;

  const BASE_W = W - 2 * OVERHANG_X;
  const BASE_D = D - 2 * OVERHANG_Z;
  const LEG_X = BASE_W / 2 - LEG_W / 2;
  const LEG_Z = BASE_D / 2 - LEG_W / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4e29,
    roughness: 0.62,
    metalness: 0.02
  });

  const pegMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c15,
    roughness: 0.72,
    metalness: 0.02
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

  // Tabletop with slightly beveled edges
  const bevel = 0.005;
  const topShape = new THREE.Shape();
  const hw = W / 2 - bevel;
  const hd = D / 2 - bevel;
  topShape.moveTo(-hw, -hd);
  topShape.lineTo(hw, -hd);
  topShape.lineTo(hw, hd);
  topShape.lineTo(-hw, hd);
  topShape.closePath();

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, woodMat, 'tabletop', 0, H - bevel, 0);

  // 4 Legs
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

  // Upper rails (front, back, left, right)
  const longRailLen = BASE_W - 2 * LEG_W;
  const shortRailLen = BASE_D - 2 * LEG_W;
  const upperRailY = LEG_H - UPPER_RAIL_H / 2;
  const railZOffset = BASE_D / 2 - RAIL_T / 2;
  const railXOffset = BASE_W / 2 - RAIL_T / 2;

  const upperLongGeo = new THREE.BoxGeometry(longRailLen, UPPER_RAIL_H, RAIL_T);
  const upperShortGeo = new THREE.BoxGeometry(RAIL_T, UPPER_RAIL_H, shortRailLen);

  addMesh(upperLongGeo, woodMat, 'upper_rail_front', 0, upperRailY, railZOffset);
  addMesh(upperLongGeo, woodMat, 'upper_rail_back', 0, upperRailY, -railZOffset);
  addMesh(upperShortGeo, woodMat, 'upper_rail_left', -railXOffset, upperRailY, 0);
  addMesh(upperShortGeo, woodMat, 'upper_rail_right', railXOffset, upperRailY, 0);

  // Lower rails (front, back, left, right)
  const lowerRailCenterY = LOWER_RAIL_Y + LOWER_RAIL_H / 2;
  const lowerLongGeo = new THREE.BoxGeometry(longRailLen, LOWER_RAIL_H, RAIL_T);
  const lowerShortGeo = new THREE.BoxGeometry(RAIL_T, LOWER_RAIL_H, shortRailLen);

  addMesh(lowerLongGeo, woodMat, 'lower_rail_front', 0, lowerRailCenterY, railZOffset);
  addMesh(lowerLongGeo, woodMat, 'lower_rail_back', 0, lowerRailCenterY, -railZOffset);
  addMesh(lowerShortGeo, woodMat, 'lower_rail_left', -railXOffset, lowerRailCenterY, 0);
  addMesh(lowerShortGeo, woodMat, 'lower_rail_right', railXOffset, lowerRailCenterY, 0);

  // Lower shelf
  const shelfW = BASE_W - 2 * RAIL_T;
  const shelfD = BASE_D - 2 * RAIL_T;
  const shelfY = LOWER_RAIL_Y + LOWER_RAIL_H - SHELF_T / 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_T, shelfD);
  addMesh(shelfGeo, woodMat, 'lower_shelf', 0, shelfY, 0);

  // Wooden dowel pegs on front and back of each leg at rail joints
  const pegGeo = new THREE.CylinderGeometry(PEG_R, PEG_R, PEG_L, 10);
  const upperPegOffsets = [upperRailY + UPPER_RAIL_H * 0.24, upperRailY - UPPER_RAIL_H * 0.24];
  const lowerPegOffsets = [lowerRailCenterY + LOWER_RAIL_H * 0.22, lowerRailCenterY - LOWER_RAIL_H * 0.22];

  for (const [legName, lx, lz] of legPositions) {
    const zSign = lz > 0 ? 1 : -1;
    const pegZ = lz + zSign * (LEG_W / 2 + PEG_L / 2 - 0.002);
    upperPegOffsets.forEach((py, idx) => {
      addMesh(pegGeo, pegMat, `${legName}_upper_peg_${idx + 1}`, lx, py, pegZ, Math.PI / 2, 0, 0);
    });
    lowerPegOffsets.forEach((py, idx) => {
      addMesh(pegGeo, pegMat, `${legName}_lower_peg_${idx + 1}`, lx, py, pegZ, Math.PI / 2, 0, 0);
    });
  }

  return group;
}
