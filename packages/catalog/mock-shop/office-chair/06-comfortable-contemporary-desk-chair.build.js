function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.72;
  const H = 1.18;
  const D = 0.68;
  const SEAT_H = 0.46;
  const BASE_R = 0.33;
  const WHEEL_R = 0.028;
  const WHEEL_W = 0.024;
  const HUB_Y = 0.15;
  const MECH_Y = 0.37;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcabaa6,
    roughness: 0.88,
    metalness: 0.02,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xb5a38e,
    roughness: 0.92,
    metalness: 0.02,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x635448,
    roughness: 0.45,
    metalness: 0.35,
  });

  const casterMat = new THREE.MeshStandardMaterial({
    color: 0x4d4137,
    roughness: 0.6,
    metalness: 0.2,
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. 5-Star Base & Casters
  const hubGeo = new THREE.CylinderGeometry(0.042, 0.046, 0.065, 24);
  addMesh(hubGeo, baseMat, 'base_hub', [0, HUB_Y, 0]);

  const legGeo = new THREE.BoxGeometry(0.036, 0.032, BASE_R);
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 20);
  const stemGeo = new THREE.CylinderGeometry(0.011, 0.014, 0.055, 12);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Leg sloping from hub down to caster stem
    const legMidR = BASE_R * 0.5;
    const legY = HUB_Y - 0.035;
    const leg = addMesh(
      legGeo,
      baseMat,
      `base_leg_${i}`,
      [sinA * legMidR, legY, cosA * legMidR],
      [0, angle, 0]
    );
    leg.rotateX(0.22);

    // Caster stem
    const tipR = BASE_R - 0.015;
    addMesh(
      stemGeo,
      baseMat,
      `caster_stem_${i}`,
      [sinA * tipR, WHEEL_R + 0.025, cosA * tipR]
    );

    // Caster wheel
    addMesh(
      wheelGeo,
      casterMat,
      `caster_wheel_${i}`,
      [sinA * tipR, WHEEL_R, cosA * tipR],
      [0, angle, Math.PI / 2]
    );
  }

  // 2. Gas Lift & Under-seat Mechanism
  const liftGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.22, 20);
  addMesh(liftGeo, baseMat, 'gas_lift', [0, (HUB_Y + MECH_Y) * 0.5, 0]);

  const collarGeo = new THREE.CylinderGeometry(0.031, 0.031, 0.06, 20);
  addMesh(collarGeo, baseMat, 'gas_lift_collar', [0, HUB_Y + 0.05, 0]);

  const mechGeo = new THREE.BoxGeometry(0.16, 0.045, 0.18);
  addMesh(mechGeo, baseMat, 'tilt_mechanism', [0, MECH_Y, -0.01]);

  // Height adjustment lever on viewer's left (-X)
  const leverRodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10);
  addMesh(
    leverRodGeo,
    baseMat,
    'height_lever_rod',
    [-0.14, MECH_Y - 0.005, 0.02],
    [0, 0, Math.PI / 2 - 0.08]
  );

  const leverPaddleGeo = new THREE.BoxGeometry(0.042, 0.016, 0.032);
  addMesh(
    leverPaddleGeo,
    casterMat,
    'height_lever_paddle',
    [-0.25, MECH_Y - 0.018, 0.02],
    [0, 0, 0.35]
  );

  // 3. Continuous Sculpted Seat Shell & Backrest
  // Seat bucket base
  const shellBaseGeo = new THREE.SphereGeometry(0.28, 28, 18);
  addMesh(
    shellBaseGeo,
    fabricMat,
    'seat_shell_base',
    [0, SEAT_H - 0.04, 0.02],
    [0, 0, 0],
    [1.08, 0.22, 1.02]
  );

  // Seat cushion
  const seatCushionGeo = new THREE.SphereGeometry(0.25, 28, 18);
  addMesh(
    seatCushionGeo,
    fabricMat,
    'seat_cushion',
    [0, SEAT_H + 0.015, 0.04],
    [0, 0, 0],
    [1.02, 0.22, 0.96]
  );

  // Subtle piping around seat cushion
  const pipingGeo = new THREE.TorusGeometry(0.245, 0.007, 10, 32);
  addMesh(
    pipingGeo,
    seamMat,
    'seat_cushion_piping',
    [0, SEAT_H + 0.005, 0.04],
    [Math.PI / 2, 0, 0],
    [1.02, 0.96, 1.0]
  );

  // Continuous Backrest Shell (ExtrudeGeometry for smooth tapered silhouette)
  const backShape = new THREE.Shape();
  backShape.moveTo(-0.24, 0.0);
  backShape.bezierCurveTo(-0.27, 0.14, -0.24, 0.28, -0.20, 0.40);
  backShape.bezierCurveTo(-0.17, 0.50, -0.15, 0.56, -0.10, 0.57);
  backShape.quadraticCurveTo(0.0, 0.58, 0.10, 0.57);
  backShape.bezierCurveTo(0.15, 0.56, 0.17, 0.50, 0.20, 0.40);
  backShape.bezierCurveTo(0.24, 0.28, 0.27, 0.14, 0.24, 0.0);
  backShape.quadraticCurveTo(0.0, -0.04, -0.24, 0.0);

  const backExtrudeGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 8,
    curveSegments: 20,
  });
  addMesh(
    backExtrudeGeo,
    fabricMat,
    'backrest_shell',
    [0, SEAT_H - 0.02, -0.18],
    [-0.16, 0, 0]
  );

  // Horizontal lumbar seam across the backrest
  const seamGeo = new THREE.TorusGeometry(0.23, 0.005, 8, 28, Math.PI * 0.78);
  addMesh(
    seamGeo,
    seamMat,
    'backrest_lumbar_seam',
    [0, SEAT_H + 0.26, -0.14],
    [Math.PI / 2 - 0.16, 0, Math.PI * 0.11],
    [1.02, 0.28, 1.0]
  );

  // 4. Wrap-around Armrest Wings (continuous with seat bucket & backrest)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-0.14, 0.0);
  wingShape.bezierCurveTo(-0.16, 0.14, -0.12, 0.26, -0.04, 0.28);
  wingShape.bezierCurveTo(0.04, 0.28, 0.10, 0.22, 0.16, 0.19);
  wingShape.bezierCurveTo(0.22, 0.16, 0.25, 0.10, 0.23, 0.02);
  wingShape.bezierCurveTo(0.20, -0.04, 0.05, -0.05, -0.14, 0.0);

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.025,
    bevelSegments: 6,
    curveSegments: 16,
  });

  // Left wing (-X)
  addMesh(
    wingGeo,
    fabricMat,
    'shell_wing_left',
    [-W * 0.34, SEAT_H - 0.02, 0.02],
    [0, Math.PI / 2, -0.22]
  );

  // Right wing (+X)
  addMesh(
    wingGeo,
    fabricMat,
    'shell_wing_right',
    [W * 0.34, SEAT_H - 0.02, 0.02],
    [0, Math.PI / 2, 0.22]
  );

  // 5. Integrated Headrest (flush rounded-rectangle cushion on top of backrest)
  const headShape = new THREE.Shape();
  const hw = 0.11;
  const hh = 0.045;
  const hr = 0.025;
  headShape.moveTo(-hw + hr, -hh);
  headShape.lineTo(hw - hr, -hh);
  headShape.quadraticCurveTo(hw, -hh, hw, -hh + hr);
  headShape.lineTo(hw, hh - hr);
  headShape.quadraticCurveTo(hw, hh, hw - hr, hh);
  headShape.lineTo(-hw + hr, hh);
  headShape.quadraticCurveTo(-hw, hh, -hw, hh - hr);
  headShape.lineTo(-hw, -hh + hr);
  headShape.quadraticCurveTo(-hw, -hh, -hw + hr, -hh);

  const headGeo = new THREE.ExtrudeGeometry(headShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.038,
    bevelSize: 0.032,
    bevelSegments: 6,
    curveSegments: 14,
  });
  addMesh(
    headGeo,
    fabricMat,
    'headrest',
    [0, H - 0.09, -0.25],
    [-0.12, 0, 0]
  );

  return group;
}
