function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.68;          // Overall width
  const H = 0.96;          // Overall height
  const D = 0.88;          // Overall depth (rocker length)
  const SEAT_W = 0.56;     // Seat cushion width
  const SEAT_D = 0.50;     // Seat cushion depth
  const SEAT_THICK = 0.10; // Seat cushion thickness
  const SEAT_H = 0.42;     // Front seat height
  const BACK_W = 0.54;     // Backrest width
  const BACK_H = 0.62;     // Backrest height
  const BACK_THICK = 0.09; // Backrest thickness
  const ARM_H = 0.58;      // Armrest height at front
  const SIDE_X = 0.29;     // X offset of left/right frame

  const TILT_SEAT = -0.10; // Seat tilt backward (radians)
  const TILT_BACK = -0.28; // Backrest tilt backward (radians)

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.55,
    metalness: 0.02
  });

  const pegMat = new THREE.MeshStandardMaterial({
    color: 0x6e4b2a,
    roughness: 0.65,
    metalness: 0.0
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece1,
    roughness: 0.88,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create a rounded-corner extruded cushion
  function createCushionGeo(width, height, depth, radius) {
    const hw = width / 2 - radius;
    const hh = height / 2 - radius;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh - radius);
    shape.lineTo(hw, -hh - radius);
    shape.quadraticCurveTo(hw + radius, -hh - radius, hw + radius, -hh);
    shape.lineTo(hw + radius, hh);
    shape.quadraticCurveTo(hw + radius, hh + radius, hw, hh + radius);
    shape.lineTo(-hw, hh + radius);
    shape.quadraticCurveTo(-hw - radius, hh + radius, -hw - radius, hh);
    shape.lineTo(-hw - radius, -hh);
    shape.quadraticCurveTo(-hw - radius, -hh - radius, -hw, -hh - radius);

    const extrudeSettings = {
      steps: 1,
      depth: depth - radius * 2,
      bevelEnabled: true,
      bevelThickness: radius,
      bevelSize: radius,
      bevelSegments: 4
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  // 1. Rockers (Left & Right)
  // Curve touches y = 0 at z = 0.02, curves up at front (+Z) and back (-Z)
  const rockerPoints = [
    new THREE.Vector3(0, 0.11, -D / 2 + 0.02),
    new THREE.Vector3(0, 0.035, -D / 4),
    new THREE.Vector3(0, 0.018, 0.02),
    new THREE.Vector3(0, 0.04, D / 4),
    new THREE.Vector3(0, 0.10, D / 2 - 0.02)
  ];
  const rockerCurve = new THREE.CatmullRomCurve3(rockerPoints);
  const rockerGeo = new THREE.TubeGeometry(rockerCurve, 28, 0.018, 12, false);
  // Flatten rocker slightly in X
  rockerGeo.scale(0.85, 1.0, 1.0);

  const rockerCapGeo = new THREE.SphereGeometry(0.018, 12, 10);
  rockerCapGeo.scale(0.85, 1.0, 1.0);

  [-SIDE_X, SIDE_X].forEach((xPos, idx) => {
    const side = idx === 0 ? "left" : "right";
    addMesh(rockerGeo, woodMat, `rocker_${side}`, [xPos, 0, 0]);
    addMesh(rockerCapGeo, woodMat, `rocker_${side}_front_cap`, [xPos, 0.10, D / 2 - 0.02]);
    addMesh(rockerCapGeo, woodMat, `rocker_${side}_back_cap`, [xPos, 0.11, -D / 2 + 0.02]);
  });

  // 2. Legs (Front & Back)
  const frontLegGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.54, 14);
  const backLegGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.50, 14);

  [-SIDE_X, SIDE_X].forEach((xPos, idx) => {
    const side = idx === 0 ? "left" : "right";
    // Front leg: from rocker (z ~ 0.26, y ~ 0.04) up to armrest (z ~ 0.20, y ~ 0.57)
    addMesh(frontLegGeo, woodMat, `front_leg_${side}`, [xPos, 0.305, 0.23], [-0.11, 0, 0]);
    // Back leg: from rocker (z ~ -0.28, y ~ 0.04) up to armrest (z ~ -0.20, y ~ 0.52)
    addMesh(backLegGeo, woodMat, `back_leg_${side}`, [xPos, 0.28, -0.24], [0.16, 0, 0]);
  });

  // 3. Armrests
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.51, -0.26),
    new THREE.Vector3(0, 0.545, -0.02),
    new THREE.Vector3(0, ARM_H, 0.24)
  ]);
  const armGeo = new THREE.TubeGeometry(armCurve, 20, 0.018, 12, false);
  armGeo.scale(1.15, 0.7, 1.0);

  const armCapGeo = new THREE.SphereGeometry(0.018, 12, 10);
  armCapGeo.scale(1.15, 0.7, 1.0);

  [-SIDE_X, SIDE_X].forEach((xPos, idx) => {
    const side = idx === 0 ? "left" : "right";
    addMesh(armGeo, woodMat, `armrest_${side}`, [xPos, 0, 0]);
    addMesh(armCapGeo, woodMat, `armrest_${side}_front_cap`, [xPos, ARM_H, 0.24]);
    addMesh(armCapGeo, woodMat, `armrest_${side}_back_cap`, [xPos, 0.51, -0.26]);
  });

  // 4. Side Rails & Cross Rails
  const sideRailGeo = new THREE.BoxGeometry(0.024, 0.042, 0.48);
  [-SIDE_X, SIDE_X].forEach((xPos, idx) => {
    const side = idx === 0 ? "left" : "right";
    addMesh(sideRailGeo, woodMat, `side_rail_${side}`, [xPos, 0.31, -0.01], [0.08, 0, 0]);
  });

  // Front rail (curved slightly)
  const frontRailGeo = new THREE.BoxGeometry(SIDE_X * 2 - 0.02, 0.045, 0.024);
  addMesh(frontRailGeo, woodMat, "front_rail", [0, 0.33, 0.215]);

  // Back rail
  const backRailGeo = new THREE.BoxGeometry(SIDE_X * 2 - 0.02, 0.040, 0.024);
  addMesh(backRailGeo, woodMat, "back_rail", [0, 0.29, -0.235]);

  // 5. Decorative Wood Dowel Pegs on outer legs
  const pegGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 10);
  pegGeo.rotateZ(Math.PI / 2);
  [-SIDE_X - 0.015, SIDE_X + 0.015].forEach((xPos, idx) => {
    const side = idx === 0 ? "left" : "right";
    addMesh(pegGeo, pegMat, `peg_front_rail_${side}`, [xPos, 0.33, 0.225]);
    addMesh(pegGeo, pegMat, `peg_back_rail_${side}`, [xPos, 0.29, -0.24]);
    addMesh(pegGeo, pegMat, `peg_back_arm_${side}`, [xPos, 0.51, -0.21]);
  });

  // 6. Seat Cushion
  const seatGeo = createCushionGeo(SEAT_W, SEAT_THICK, SEAT_D, 0.022);
  addMesh(seatGeo, fabricMat, "seat_cushion", [0, SEAT_H - SEAT_THICK / 2 + 0.01, 0.01], [TILT_SEAT, 0, 0]);

  // 7. Backrest Cushion
  const backGeo = createCushionGeo(BACK_W, BACK_H, BACK_THICK, 0.024);
  addMesh(backGeo, fabricMat, "backrest_cushion", [0, 0.66, -0.21], [TILT_BACK, 0, 0]);

  return group;
}
