function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.40;
  const H = 0.85;
  const D = 0.06;

  const BAR_H = 0.055;
  const WALL_T = 0.006;
  const DIFFUSER_H = 0.008;

  const CANOPY_W = 0.72;
  const CANOPY_D = 0.09;
  const CANOPY_H = 0.032;
  const FLANGE_H = 0.006;
  const FLANGE_OVERHANG = 0.008;

  const CABLE_X = 0.31;
  const CABLE_R = 0.002;
  const GRIPPER_R = 0.0055;
  const GRIPPER_H = 0.012;

  // Materials
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x2a2d30,
    roughness: 0.45,
    metalness: 0.7,
  });

  const matCable = new THREE.MeshStandardMaterial({
    color: 0x3a3d40,
    roughness: 0.4,
    metalness: 0.8,
  });

  const matEmit = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffecd2,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeStadiumShape(w, d) {
    const r = d / 2;
    const halfS = (w - d) / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfS, -r);
    shape.lineTo(halfS, -r);
    shape.absarc(halfS, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-halfS, r);
    shape.absarc(-halfS, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    return shape;
  }

  // Linear light bar housing (bottom at y = 0, top at y = BAR_H)
  const topPlateGeom = new THREE.BoxGeometry(W, WALL_T, D);
  addMesh(topPlateGeom, matMetal, 'bar_top_plate', 0, BAR_H - WALL_T / 2, 0);

  const sideWallH = BAR_H - WALL_T;
  const sideWallGeom = new THREE.BoxGeometry(W, sideWallH, WALL_T);
  addMesh(sideWallGeom, matMetal, 'bar_front_wall', 0, sideWallH / 2, (D - WALL_T) / 2);
  addMesh(sideWallGeom, matMetal, 'bar_back_wall', 0, sideWallH / 2, -(D - WALL_T) / 2);

  const endCapGeom = new THREE.BoxGeometry(WALL_T, sideWallH, D - WALL_T * 2);
  addMesh(endCapGeom, matMetal, 'bar_left_endcap', -(W - WALL_T) / 2, sideWallH / 2, 0);
  addMesh(endCapGeom, matMetal, 'bar_right_endcap', (W - WALL_T) / 2, sideWallH / 2, 0);

  // Glowing diffuser at the bottom of the bar
  const diffuserGeom = new THREE.BoxGeometry(W - WALL_T * 2, DIFFUSER_H, D - WALL_T * 2);
  addMesh(diffuserGeom, matEmit, 'emit_diffuser', 0, DIFFUSER_H / 2, 0);

  // Ceiling canopy (top at y = H)
  const canopyShape = makeStadiumShape(CANOPY_W, CANOPY_D);
  const canopyGeom = new THREE.ExtrudeGeometry(canopyShape, {
    depth: CANOPY_H - FLANGE_H,
    bevelEnabled: false,
    curveSegments: 24,
  });
  canopyGeom.rotateX(Math.PI / 2);
  addMesh(canopyGeom, matMetal, 'ceiling_canopy', 0, H, 0);

  const flangeShape = makeStadiumShape(CANOPY_W + FLANGE_OVERHANG * 2, CANOPY_D + FLANGE_OVERHANG * 2);
  const flangeGeom = new THREE.ExtrudeGeometry(flangeShape, {
    depth: FLANGE_H,
    bevelEnabled: false,
    curveSegments: 24,
  });
  flangeGeom.rotateX(Math.PI / 2);
  addMesh(flangeGeom, matMetal, 'canopy_flange', 0, H - CANOPY_H + FLANGE_H, 0);

  // Suspension cables and grippers
  const cableBottomY = BAR_H;
  const cableTopY = H - CANOPY_H;
  const cableLen = cableTopY - cableBottomY;
  const cableMidY = (cableBottomY + cableTopY) / 2;

  const cableGeom = new THREE.CylinderGeometry(CABLE_R, CABLE_R, cableLen, 12);
  const gripperGeom = new THREE.CylinderGeometry(GRIPPER_R, GRIPPER_R, GRIPPER_H, 16);

  addMesh(cableGeom, matCable, 'suspension_cable_left', -CABLE_X, cableMidY, 0);
  addMesh(cableGeom, matCable, 'suspension_cable_right', CABLE_X, cableMidY, 0);

  addMesh(gripperGeom, matMetal, 'bar_gripper_left', -CABLE_X, BAR_H + GRIPPER_H / 2, 0);
  addMesh(gripperGeom, matMetal, 'bar_gripper_right', CABLE_X, BAR_H + GRIPPER_H / 2, 0);

  addMesh(gripperGeom, matMetal, 'canopy_gripper_left', -CABLE_X, cableTopY - GRIPPER_H / 2, 0);
  addMesh(gripperGeom, matMetal, 'canopy_gripper_right', CABLE_X, cableTopY - GRIPPER_H / 2, 0);

  return group;
}
