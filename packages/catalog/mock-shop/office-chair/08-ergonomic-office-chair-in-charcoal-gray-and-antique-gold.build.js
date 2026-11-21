function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.68;
  const H = 1.18;
  const D = 0.66;
  const SEAT_H = 0.47;
  const SEAT_W = 0.52;
  const SEAT_D = 0.49;
  const SEAT_THICK = 0.10;
  const BASE_R = 0.33;
  const CASTER_R = 0.026;
  const HUB_Y = 0.13;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x46494e,
    roughness: 0.85,
    metalness: 0.05
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xb8944f,
    roughness: 0.32,
    metalness: 0.78
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,
    roughness: 0.65,
    metalness: 0.2
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    roughness: 0.15,
    metalness: 0.95
  });

  function addMesh(geo, mat, name, pos, rot) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    group.add(m);
    return m;
  }

  // 1. Central Hub & Gas Lift
  addMesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.09, 24),
    goldMat,
    "base_hub",
    [0, HUB_Y, 0]
  );
  addMesh(
    new THREE.CylinderGeometry(0.026, 0.028, 0.10, 20),
    goldMat,
    "gas_lift_collar",
    [0, HUB_Y + 0.075, 0]
  );
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.14, 20),
    chromeMat,
    "gas_lift_rod",
    [0, HUB_Y + 0.16, 0]
  );

  // 2. Five-Star Base Legs & Casters
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;

    // Tapered leg arm
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, HUB_Y + 0.015, 0.025),
      new THREE.Vector3(0, HUB_Y - 0.015, BASE_R * 0.5),
      new THREE.Vector3(0, CASTER_R * 2.0 + 0.01, BASE_R)
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 12, 0.018, 12, false);
    const legMesh = new THREE.Mesh(legGeo, goldMat);
    legMesh.name = `base_leg_${i + 1}`;
    legMesh.scale.set(0.85, 1.15, 1);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legGroup.add(legMesh);

    // Caster socket
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.03, 14),
      goldMat
    );
    socket.name = `caster_socket_${i + 1}`;
    socket.position.set(0, CASTER_R * 2.0, BASE_R);
    socket.castShadow = true;
    socket.receiveShadow = true;
    legGroup.add(socket);

    // Caster wheel
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.036, 20),
      blackMat
    );
    wheel.name = `caster_wheel_${i + 1}`;
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, CASTER_R, BASE_R);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    legGroup.add(wheel);

    group.add(legGroup);
  }

  // 3. Under-seat Mechanism & Levers
  const mechY = SEAT_H - SEAT_THICK + 0.01;
  addMesh(
    new THREE.BoxGeometry(0.18, 0.055, 0.22),
    blackMat,
    "tilt_mechanism",
    [0, mechY - 0.02, -0.02]
  );
  addMesh(
    new THREE.CylinderGeometry(0.024, 0.02, 0.055, 16),
    blackMat,
    "tension_knob",
    [0.03, mechY - 0.065, 0.02]
  );

  // Height & tilt levers
  const leverCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, mechY - 0.025, 0.0),
    new THREE.Vector3(0.18, mechY - 0.035, 0.02),
    new THREE.Vector3(0.22, mechY - 0.04, 0.05)
  ]);
  addMesh(
    new THREE.TubeGeometry(leverCurveR, 10, 0.007, 8, false),
    blackMat,
    "height_lever_right"
  );

  const leverCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, mechY - 0.025, -0.04),
    new THREE.Vector3(-0.18, mechY - 0.035, -0.06),
    new THREE.Vector3(-0.22, mechY - 0.04, -0.09)
  ]);
  addMesh(
    new THREE.TubeGeometry(leverCurveL, 10, 0.007, 8, false),
    blackMat,
    "tilt_lever_left"
  );

  // 4. Seat Cushion (contoured + channeled)
  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2;
  const sd = SEAT_D / 2;
  seatShape.moveTo(-sw + 0.06, -sd);
  seatShape.lineTo(sw - 0.06, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + 0.06);
  seatShape.lineTo(sw, sd - 0.06);
  seatShape.quadraticCurveTo(sw, sd, sw - 0.06, sd);
  seatShape.lineTo(-sw + 0.06, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - 0.06);
  seatShape.lineTo(-sw, -sd + 0.06);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + 0.06, -sd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4
  });
  seatGeo.rotateX(Math.PI / 2);
  addMesh(
    seatGeo,
    fabricMat,
    "seat_cushion",
    [0, SEAT_H, 0.02],
    [-0.03, 0, 0]
  );

  // Seat side bolsters for sculpted look
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CapsuleGeometry(0.042, SEAT_D * 0.68, 8, 14),
      fabricMat,
      side > 0 ? "seat_bolster_right" : "seat_bolster_left",
      [side * (SEAT_W * 0.39), SEAT_H - 0.015, 0.03],
      [Math.PI / 2 - 0.03, 0, 0]
    );
  }

  // 5. Backrest Spine & Segmented Cushions
  const backGroup = new THREE.Group();
  backGroup.position.set(0, SEAT_H - 0.02, -SEAT_D * 0.44);
  backGroup.rotation.x = -0.14; // Ergonomic recline

  // Antique gold spine bracket
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.05, 0.03),
    new THREE.Vector3(0, 0.08, -0.04),
    new THREE.Vector3(0, 0.28, -0.05)
  ]);
  const spineMesh = new THREE.Mesh(
    new THREE.TubeGeometry(spineCurve, 12, 0.022, 10, false),
    goldMat
  );
  spineMesh.name = "backrest_spine";
  spineMesh.castShadow = true;
  spineMesh.receiveShadow = true;
  backGroup.add(spineMesh);

  // Lower lumbar cushion
  const lumbarGeo = new THREE.BoxGeometry(0.46, 0.20, 0.09);
  const lumbarMesh = new THREE.Mesh(lumbarGeo, fabricMat);
  lumbarMesh.name = "backrest_lumbar_cushion";
  lumbarMesh.position.set(0, 0.14, 0.02);
  lumbarMesh.castShadow = true;
  lumbarMesh.receiveShadow = true;
  backGroup.add(lumbarMesh);

  // Middle backrest cushion
  const midGeo = new THREE.BoxGeometry(0.45, 0.28, 0.085);
  const midMesh = new THREE.Mesh(midGeo, fabricMat);
  midMesh.name = "backrest_middle_cushion";
  midMesh.position.set(0, 0.37, 0.015);
  midMesh.castShadow = true;
  midMesh.receiveShadow = true;
  backGroup.add(midMesh);

  // Side bolsters on middle backrest
  for (const side of [-1, 1]) {
    const bolster = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.36, 8, 14),
      fabricMat
    );
    bolster.name = side > 0 ? "backrest_bolster_right" : "backrest_bolster_left";
    bolster.position.set(side * 0.20, 0.26, 0.03);
    bolster.castShadow = true;
    bolster.receiveShadow = true;
    backGroup.add(bolster);
  }

  // Upper headrest cushion
  const headGeo = new THREE.BoxGeometry(0.40, 0.19, 0.085);
  const headMesh = new THREE.Mesh(headGeo, fabricMat);
  headMesh.name = "backrest_headrest_cushion";
  headMesh.position.set(0, 0.60, 0.025);
  headMesh.rotation.x = 0.08;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  backGroup.add(headMesh);

  // Rounded top cap on headrest
  const headCap = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.042, 0.32, 8, 14),
    fabricMat
  );
  headCap.name = "headrest_top_cap";
  headCap.rotation.z = Math.PI / 2;
  headCap.position.set(0, 0.69, 0.032);
  headCap.castShadow = true;
  headCap.receiveShadow = true;
  backGroup.add(headCap);

  group.add(backGroup);

  // 6. Antique Gold Loop Armrests & Padded Tops
  for (const side of [-1, 1]) {
    const xPos = side * (SEAT_W / 2 + 0.035);
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xPos, SEAT_H - 0.03, -0.14),
      new THREE.Vector3(xPos + side * 0.015, SEAT_H + 0.05, -0.17),
      new THREE.Vector3(xPos + side * 0.015, SEAT_H + 0.19, -0.15),
      new THREE.Vector3(xPos, SEAT_H + 0.20, 0.08),
      new THREE.Vector3(xPos, SEAT_H + 0.08, 0.13),
      new THREE.Vector3(xPos - side * 0.02, SEAT_H - 0.02, 0.05),
      new THREE.Vector3(xPos - side * 0.06, SEAT_H - 0.04, -0.05)
    ]);

    addMesh(
      new THREE.TubeGeometry(armCurve, 28, 0.017, 12, false),
      goldMat,
      side > 0 ? "armrest_frame_right" : "armrest_frame_left"
    );

    // Outer pivot boss detail
    addMesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.028, 18),
      goldMat,
      side > 0 ? "armrest_pivot_right" : "armrest_pivot_left",
      [xPos + side * 0.02, SEAT_H + 0.10, -0.16],
      [0, 0, Math.PI / 2]
    );

    // Padded fabric armrest top
    addMesh(
      new THREE.CapsuleGeometry(0.026, 0.21, 8, 14),
      fabricMat,
      side > 0 ? "armrest_pad_right" : "armrest_pad_left",
      [xPos, SEAT_H + 0.215, -0.02],
      [Math.PI / 2, 0, 0]
    );
  }

  return group;
}
