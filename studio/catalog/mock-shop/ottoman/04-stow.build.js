function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.85;
  const D = 0.48;
  const H = 0.44;

  const TUBE = 0.018;
  const LEG_H = 0.058;
  const BODY_H = 0.285;
  const SEAM_H = 0.003;
  const LID_H = H - LEG_H - BODY_H - SEAM_H;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd6cfc2,
    roughness: 0.88,
    metalness: 0.02
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x8a8275,
    roughness: 0.9,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3f,
    roughness: 0.45,
    metalness: 0.7
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

  // Helper: rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Metal Sled Base
  const frameW = W - 0.006;
  const frameD = D - 0.006;
  const legX = frameW / 2 - TUBE / 2;
  const legZ = frameD / 2 - TUBE / 2;

  const legGeo = new THREE.BoxGeometry(TUBE, LEG_H, TUBE);
  addMesh(legGeo, metalMat, 'leg_front_left', -legX, LEG_H / 2, legZ);
  addMesh(legGeo, metalMat, 'leg_front_right', legX, LEG_H / 2, legZ);
  addMesh(legGeo, metalMat, 'leg_back_left', -legX, LEG_H / 2, -legZ);
  addMesh(legGeo, metalMat, 'leg_back_right', legX, LEG_H / 2, -legZ);

  // Side bottom runners (connecting front & back legs at floor)
  const sideRailLen = frameD - TUBE * 2;
  const sideRailGeo = new THREE.BoxGeometry(TUBE, TUBE, sideRailLen);
  addMesh(sideRailGeo, metalMat, 'side_bottom_rail_left', -legX, TUBE / 2, 0);
  addMesh(sideRailGeo, metalMat, 'side_bottom_rail_right', legX, TUBE / 2, 0);

  // Side top rails (under upholstered body)
  const topRailY = LEG_H - TUBE / 2;
  addMesh(sideRailGeo, metalMat, 'side_top_rail_left', -legX, topRailY, 0);
  addMesh(sideRailGeo, metalMat, 'side_top_rail_right', legX, topRailY, 0);

  // Front and back top rails (under upholstered body)
  const fbRailLen = frameW - TUBE * 2;
  const fbRailGeo = new THREE.BoxGeometry(fbRailLen, TUBE, TUBE);
  addMesh(fbRailGeo, metalMat, 'front_top_rail', 0, topRailY, legZ);
  addMesh(fbRailGeo, metalMat, 'back_top_rail', 0, topRailY, -legZ);

  // 2. Upholstered Body
  const bodyBevel = 0.008;
  const bodyShape = roundedRectShape(W - bodyBevel * 2, D - bodyBevel * 2, 0.012);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_H - bodyBevel * 2,
    bevelEnabled: true,
    bevelThickness: bodyBevel,
    bevelSize: bodyBevel,
    bevelSegments: 3
  });
  bodyGeo.rotateX(-Math.PI / 2);
  addMesh(bodyGeo, fabricMat, 'ottoman_body', 0, LEG_H + bodyBevel, 0);

  // 3. Seam / Shadow Gap between Body and Lid
  const seamShape = roundedRectShape(W - 0.018, D - 0.018, 0.01);
  const seamGeo = new THREE.ExtrudeGeometry(seamShape, {
    depth: SEAM_H + 0.004,
    bevelEnabled: false
  });
  seamGeo.rotateX(-Math.PI / 2);
  addMesh(seamGeo, seamMat, 'lid_seam', 0, LEG_H + BODY_H - 0.002, 0);

  // 4. Padded Hinged Lid
  const lidBevelSize = 0.016;
  const lidBevelThick = 0.022;
  const lidShape = roundedRectShape(W - lidBevelSize * 2, D - lidBevelSize * 2, 0.016);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_H - lidBevelThick * 2,
    bevelEnabled: true,
    bevelThickness: lidBevelThick,
    bevelSize: lidBevelSize,
    bevelSegments: 4
  });
  lidGeo.rotateX(-Math.PI / 2);
  addMesh(lidGeo, fabricMat, 'ottoman_lid', 0, LEG_H + BODY_H + SEAM_H + lidBevelThick, 0);

  // 5. Front Fabric Pull Tab
  const tabW = 0.032;
  const tabD = 0.024;
  const tabT = 0.005;
  const tabY = LEG_H + BODY_H + SEAM_H / 2;
  const tabZ = D / 2 + tabD / 2 - 0.006;

  const tabTopGeo = new THREE.BoxGeometry(tabW, tabT, tabD);
  addMesh(tabTopGeo, fabricMat, 'pull_tab_top', 0, tabY - 0.004, tabZ, 0.25, 0, 0);

  const tabBotGeo = new THREE.BoxGeometry(tabW, tabT, tabD);
  addMesh(tabBotGeo, fabricMat, 'pull_tab_bottom', 0, tabY - 0.009, tabZ - 0.001, 0.25, 0, 0);

  const tabFoldGeo = new THREE.CylinderGeometry(tabT * 0.9, tabT * 0.9, tabW, 12);
  tabFoldGeo.rotateZ(Math.PI / 2);
  addMesh(tabFoldGeo, fabricMat, 'pull_tab_fold', 0, tabY - 0.009, tabZ + tabD / 2 - 0.002);

  return group;
}
