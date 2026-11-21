function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const D = 0.36;
  const FOOT_H = 0.022;
  const FOOT_R = 0.028;
  const PLINTH_H = 0.062;
  const CORNER_R = 0.012;

  const PLATTER_R = 0.15;
  const PLATTER_H = 0.022;
  const PLATTER_X = -0.042;
  const PLATTER_Z = 0.0;

  const MAT_R = 0.142;
  const MAT_H = 0.004;
  const SPINDLE_R = 0.0036;
  const SPINDLE_H = 0.018;

  const KNOB_R = 0.018;
  const KNOB_H = 0.010;
  const KNOB_X = -0.175;
  const KNOB_Z = 0.125;

  const ARM_X = 0.148;
  const ARM_Z = -0.075;
  const ARM_BASE_R = 0.036;
  const ARM_BASE_H = 0.010;

  const PLINTH_TOP = FOOT_H + PLINTH_H;

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xd4d7db,
    metalness: 0.85,
    roughness: 0.28,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xebeff2,
    metalness: 0.95,
    roughness: 0.12,
  });

  const blackAnodizedMat = new THREE.MeshStandardMaterial({
    color: 0x1c1d20,
    metalness: 0.4,
    roughness: 0.55,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    metalness: 0.05,
    roughness: 0.82,
  });

  const redButtonMat = new THREE.MeshStandardMaterial({
    color: 0xd0261e,
    metalness: 0.1,
    roughness: 0.3,
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

  // 1. Isolation Feet (4x)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.94, FOOT_H, 28);
  const footOffsetX = W / 2 - 0.048;
  const footOffsetZ = D / 2 - 0.045;
  const footPositions = [
    ['foot_fl', -footOffsetX, footOffsetZ],
    ['foot_fr', footOffsetX, footOffsetZ],
    ['foot_bl', -footOffsetX, -footOffsetZ],
    ['foot_br', footOffsetX, -footOffsetZ],
  ];
  for (const [name, fx, fz] of footPositions) {
    addMesh(footGeo, rubberMat, name, fx, FOOT_H / 2, fz);
  }

  // 2. Brushed Aluminum Plinth (rounded rectangle extruded vertically)
  const plinthShape = new THREE.Shape();
  const hw = W / 2;
  const hd = D / 2;
  plinthShape.moveTo(-hw + CORNER_R, -hd);
  plinthShape.lineTo(hw - CORNER_R, -hd);
  plinthShape.quadraticCurveTo(hw, -hd, hw, -hd + CORNER_R);
  plinthShape.lineTo(hw, hd - CORNER_R);
  plinthShape.quadraticCurveTo(hw, hd, hw - CORNER_R, hd);
  plinthShape.lineTo(-hw + CORNER_R, hd);
  plinthShape.quadraticCurveTo(-hw, hd, -hw, hd - CORNER_R);
  plinthShape.lineTo(-hw, -hd + CORNER_R);
  plinthShape.quadraticCurveTo(-hw, -hd, -hw + CORNER_R, -hd);

  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: PLINTH_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12,
  });
  plinthGeo.rotateX(-Math.PI / 2);
  addMesh(plinthGeo, aluminumMat, 'plinth', 0, FOOT_H, 0);

  // 3. Front Red Button & Bezel
  const bezelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.004, 24);
  addMesh(bezelGeo, chromeMat, 'front_button_bezel', 0, FOOT_H + PLINTH_H * 0.5, D / 2 + 0.001, Math.PI / 2, 0, 0);

  const redBtnGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.005, 24);
  addMesh(redBtnGeo, redButtonMat, 'front_button_red', 0, FOOT_H + PLINTH_H * 0.5, D / 2 + 0.002, Math.PI / 2, 0, 0);

  // 4. Speed / Power Knob (front-left)
  const knobGeo = new THREE.CylinderGeometry(KNOB_R * 0.96, KNOB_R, KNOB_H, 28);
  addMesh(knobGeo, aluminumMat, 'speed_knob', KNOB_X, PLINTH_TOP + KNOB_H / 2, KNOB_Z);

  // 5. Platter & Rubber Mat & Spindle
  const platterGeo = new THREE.CylinderGeometry(PLATTER_R, PLATTER_R, PLATTER_H, 32);
  addMesh(platterGeo, aluminumMat, 'platter_base', PLATTER_X, PLINTH_TOP + PLATTER_H / 2, PLATTER_Z);

  const matGeo = new THREE.CylinderGeometry(MAT_R, MAT_R, MAT_H, 32);
  addMesh(matGeo, rubberMat, 'platter_mat', PLATTER_X, PLINTH_TOP + PLATTER_H + MAT_H / 2, PLATTER_Z);

  const matRingGeo = new THREE.TorusGeometry(MAT_R * 0.55, 0.0012, 8, 32);
  addMesh(matRingGeo, blackAnodizedMat, 'platter_mat_ring', PLATTER_X, PLINTH_TOP + PLATTER_H + MAT_H, PLATTER_Z, Math.PI / 2, 0, 0);

  const spindleGeo = new THREE.CylinderGeometry(SPINDLE_R * 0.7, SPINDLE_R, SPINDLE_H, 16);
  addMesh(spindleGeo, chromeMat, 'center_spindle', PLATTER_X, PLINTH_TOP + PLATTER_H + MAT_H + SPINDLE_H / 2, PLATTER_Z);

  // 6. Tonearm Assembly
  const armBaseGeo = new THREE.CylinderGeometry(ARM_BASE_R, ARM_BASE_R * 1.04, ARM_BASE_H, 28);
  addMesh(armBaseGeo, blackAnodizedMat, 'tonearm_base', ARM_X, PLINTH_TOP + ARM_BASE_H / 2, ARM_Z);

  const pillarH = 0.026;
  const pillarGeo = new THREE.CylinderGeometry(0.011, 0.013, pillarH, 20);
  addMesh(pillarGeo, blackAnodizedMat, 'tonearm_pillar', ARM_X, PLINTH_TOP + ARM_BASE_H + pillarH / 2, ARM_Z);

  const gimbalY = PLINTH_TOP + ARM_BASE_H + pillarH + 0.008;
  const gimbalGeo = new THREE.BoxGeometry(0.028, 0.024, 0.026);
  addMesh(gimbalGeo, aluminumMat, 'tonearm_gimbal', ARM_X, gimbalY, ARM_Z);

  // Counterweight behind gimbal (-Z)
  const cwGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.022, 24);
  addMesh(cwGeo, chromeMat, 'tonearm_counterweight', ARM_X, gimbalY, ARM_Z - 0.026, Math.PI / 2, 0, 0);

  // Tonearm Tube extending forward (+Z)
  const armLen = 0.165;
  const armTubeGeo = new THREE.CylinderGeometry(0.0042, 0.0045, armLen, 16);
  const armYaw = -0.12;
  const armCenterX = ARM_X + Math.sin(armYaw) * (armLen / 2);
  const armCenterZ = ARM_Z + Math.cos(armYaw) * (armLen / 2);
  addMesh(armTubeGeo, aluminumMat, 'tonearm_tube', armCenterX, gimbalY, armCenterZ, Math.PI / 2, 0, armYaw);

  // Tonearm Rest Post
  const restX = ARM_X + 0.028;
  const restZ = ARM_Z + 0.048;
  const restPostGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.032, 12);
  addMesh(restPostGeo, blackAnodizedMat, 'tonearm_rest_post', restX, PLINTH_TOP + 0.016, restZ);

  const restClipGeo = new THREE.BoxGeometry(0.012, 0.005, 0.008);
  addMesh(restClipGeo, blackAnodizedMat, 'tonearm_rest_clip', restX - 0.006, PLINTH_TOP + 0.032, restZ);

  // Headshell & Cartridge at front tip of tonearm
  const tipX = ARM_X + Math.sin(armYaw) * armLen;
  const tipZ = ARM_Z + Math.cos(armYaw) * armLen;

  const headshellGeo = new THREE.BoxGeometry(0.018, 0.006, 0.036);
  addMesh(headshellGeo, blackAnodizedMat, 'headshell', tipX, gimbalY, tipZ + 0.014, 0, armYaw - 0.15, 0);

  const liftGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 0.018, 8);
  addMesh(liftGeo, blackAnodizedMat, 'headshell_lift', tipX + 0.014, gimbalY + 0.002, tipZ + 0.012, 0, 0, Math.PI / 2.4);

  const cartridgeGeo = new THREE.BoxGeometry(0.014, 0.012, 0.024);
  addMesh(cartridgeGeo, redButtonMat, 'cartridge_body', tipX, gimbalY - 0.008, tipZ + 0.015, 0, armYaw - 0.15, 0);

  const stylusGeo = new THREE.ConeGeometry(0.002, 0.005, 8);
  addMesh(stylusGeo, chromeMat, 'stylus_tip', tipX, gimbalY - 0.016, tipZ + 0.022, Math.PI, 0, 0);

  return group;
}
