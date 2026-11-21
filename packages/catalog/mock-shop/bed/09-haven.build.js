function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const MATTRESS_W = 1.52;
  const MATTRESS_L = 2.03;
  const CLEARANCE = 0.02;
  const INNER_W = MATTRESS_W + CLEARANCE;
  const INNER_L = MATTRESS_L + CLEARANCE;

  const RAIL_T = 0.045;
  const RAIL_H = 0.14;
  const CORNER_R = 0.045;

  const FRAME_W = INNER_W + 2 * RAIL_T;
  const FRAME_L = INNER_L + 2 * RAIL_T;

  const LEG_H = 0.12;
  const LEG_R = 0.018;

  const HB_T = 0.09;
  const HB_H = 0.78;
  const HB_Y_BOTTOM = LEG_H + 0.02;
  const TOTAL_L = FRAME_L + HB_T * 0.5;

  // Centering offset along Z
  const Z_CENTER_OFFSET = HB_T * 0.25;
  const FRAME_Z_CENTER = Z_CENTER_OFFSET;
  const FRONT_Z = FRAME_Z_CENTER + FRAME_L * 0.5;
  const BACK_Z = FRAME_Z_CENTER - FRAME_L * 0.5;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa67449,
    roughness: 0.55,
    metalness: 0.05
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xd4b48c,
    roughness: 0.65,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb5afa6,
    roughness: 0.9,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.4,
    metalness: 0.75
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Legs (4 corner legs + 1 center support leg)
  const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R * 0.9, LEG_H, 16);
  const legInsetX = FRAME_W * 0.5 - 0.12;
  const legFrontZ = FRONT_Z - 0.12;
  const legBackZ = BACK_Z + 0.12;

  addMesh(legGeo, metalMat, 'leg_front_left', -legInsetX, LEG_H * 0.5, legFrontZ);
  addMesh(legGeo, metalMat, 'leg_front_right', legInsetX, LEG_H * 0.5, legFrontZ);
  addMesh(legGeo, metalMat, 'leg_back_left', -legInsetX, LEG_H * 0.5, legBackZ);
  addMesh(legGeo, metalMat, 'leg_back_right', legInsetX, LEG_H * 0.5, legBackZ);
  addMesh(legGeo, metalMat, 'leg_center', 0, LEG_H * 0.5, FRAME_Z_CENTER);

  // 2. Wooden Frame Rails
  const railY = LEG_H + RAIL_H * 0.5;

  // Front rail (between rounded corners)
  const frontRailW = FRAME_W - 2 * CORNER_R;
  const frontRailGeo = new THREE.BoxGeometry(frontRailW, RAIL_H, RAIL_T);
  addMesh(frontRailGeo, woodMat, 'frame_front_rail', 0, railY, FRONT_Z - RAIL_T * 0.5);

  // Back rail
  const backRailGeo = new THREE.BoxGeometry(FRAME_W, RAIL_H, RAIL_T);
  addMesh(backRailGeo, woodMat, 'frame_back_rail', 0, railY, BACK_Z + RAIL_T * 0.5);

  // Side rails (from back rail to front rounded corners)
  const sideRailL = FRAME_L - RAIL_T - CORNER_R;
  const sideRailZ = BACK_Z + RAIL_T + sideRailL * 0.5;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailL);
  addMesh(sideRailGeo, woodMat, 'frame_left_rail', -FRAME_W * 0.5 + RAIL_T * 0.5, railY, sideRailZ);
  addMesh(sideRailGeo, woodMat, 'frame_right_rail', FRAME_W * 0.5 - RAIL_T * 0.5, railY, sideRailZ);

  // Rounded front corners
  const cornerGeo = new THREE.CylinderGeometry(CORNER_R, CORNER_R, RAIL_H, 20);
  const cornerX = FRAME_W * 0.5 - CORNER_R;
  const cornerZ = FRONT_Z - CORNER_R;
  addMesh(cornerGeo, woodMat, 'frame_corner_front_left', -cornerX, railY, cornerZ);
  addMesh(cornerGeo, woodMat, 'frame_corner_front_right', cornerX, railY, cornerZ);

  // 3. Center Support Beam
  const beamH = 0.035;
  const beamW = 0.04;
  const beamGeo = new THREE.BoxGeometry(beamW, beamH, INNER_L);
  addMesh(beamGeo, metalMat, 'center_support_beam', 0, LEG_H + beamH * 0.5, FRAME_Z_CENTER);

  // 4. Wooden Slats
  const slatCount = 14;
  const slatW = INNER_W - 0.01;
  const slatH = 0.018;
  const slatD = 0.065;
  const slatY = LEG_H + beamH + slatH * 0.5;
  const slatGeo = new THREE.BoxGeometry(slatW, slatH, slatD);

  const slatStartZ = BACK_Z + RAIL_T + 0.07;
  const slatEndZ = FRONT_Z - RAIL_T - 0.07;
  const slatStep = (slatEndZ - slatStartZ) / (slatCount - 1);

  for (let i = 0; i < slatCount; i++) {
    const z = slatStartZ + i * slatStep;
    addMesh(slatGeo, slatMat, `slat_${i + 1}`, 0, slatY, z);
  }

  // 5. Upholstered Headboard (rounded rectangle extruded)
  const hbW = FRAME_W + 0.02;
  const hbRadius = 0.04;
  const hbShape = new THREE.Shape();
  const hw = hbW * 0.5;
  const hh = HB_H * 0.5;

  hbShape.moveTo(-hw + hbRadius, -hh);
  hbShape.lineTo(hw - hbRadius, -hh);
  hbShape.quadraticCurveTo(hw, -hh, hw, -hh + hbRadius);
  hbShape.lineTo(hw, hh - hbRadius);
  hbShape.quadraticCurveTo(hw, hh, hw - hbRadius, hh);
  hbShape.lineTo(-hw + hbRadius, hh);
  hbShape.quadraticCurveTo(-hw, hh, -hw, hh - hbRadius);
  hbShape.lineTo(-hw, -hh + hbRadius);
  hbShape.quadraticCurveTo(-hw, -hh, -hw + hbRadius, -hh);

  const hbGeo = new THREE.ExtrudeGeometry(hbShape, {
    depth: HB_T - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  hbGeo.center();

  const hbY = HB_Y_BOTTOM + HB_H * 0.5;
  const hbZ = BACK_Z - HB_T * 0.35;
  addMesh(hbGeo, fabricMat, 'headboard_upholstered', 0, hbY, hbZ);

  return group;
}
