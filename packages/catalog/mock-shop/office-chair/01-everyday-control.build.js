function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.64;
  const D = 0.62;
  const H = 1.05;
  const SEAT_H = 0.46;
  const SEAT_W = 0.49;
  const SEAT_D = 0.46;
  const BASE_R = 0.31;
  const CASTER_R = 0.026;
  const HUB_Y = 0.115;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x3b3c3e,
    roughness: 0.88,
    metalness: 0.02
  });
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x252628,
    roughness: 0.55,
    metalness: 0.08
  });
  const armpadMat = new THREE.MeshStandardMaterial({
    color: 0x2c2d30,
    roughness: 0.65,
    metalness: 0.05
  });
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    roughness: 0.28,
    metalness: 0.78
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    roughness: 0.18,
    metalness: 0.9
  });

  function addMesh(geo, mat, name, pos, rot) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. 5-Star Base Hub
  addMesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.065, 24),
    aluminumMat,
    'base_hub',
    [0, HUB_Y, 0]
  );

  // 2. 5-Star Base Legs & Casters
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + Math.PI / 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);

    // Tapered leg arm
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dx * 0.03, HUB_Y + 0.015, dz * 0.03),
      new THREE.Vector3(dx * (BASE_R * 0.55), HUB_Y - 0.01, dz * (BASE_R * 0.55)),
      new THREE.Vector3(dx * BASE_R, CASTER_R * 2 + 0.012, dz * BASE_R)
    ]);
    addMesh(
      new THREE.TubeGeometry(legCurve, 12, 0.016, 12, false),
      aluminumMat,
      `base_leg_${i + 1}`
    );

    // Caster wheel (dual-wheel look using wide cylinder)
    const wheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.042, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    addMesh(
      wheelGeo,
      plasticMat,
      `caster_wheel_${i + 1}`,
      [dx * BASE_R, CASTER_R, dz * BASE_R],
      [0, -angle, 0]
    );
  }

  // 3. Gas Lift Cylinder
  addMesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.14, 20),
    plasticMat,
    'gas_lift_outer',
    [0, HUB_Y + 0.08, 0]
  );
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.16, 20),
    chromeMat,
    'gas_lift_piston',
    [0, HUB_Y + 0.18, 0]
  );

  // 4. Under-Seat Mechanism
  addMesh(
    new THREE.BoxGeometry(0.18, 0.055, 0.22),
    plasticMat,
    'mechanism_housing',
    [0, SEAT_H - 0.085, -0.01]
  );
  addMesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.045, 16),
    plasticMat,
    'tension_knob',
    [0, SEAT_H - 0.125, 0.05]
  );
  // Adjustment levers
  addMesh(
    new THREE.BoxGeometry(0.11, 0.012, 0.028),
    plasticMat,
    'lever_right',
    [0.14, SEAT_H - 0.095, 0.03],
    [0, 0, -0.12]
  );
  addMesh(
    new THREE.BoxGeometry(0.11, 0.012, 0.028),
    plasticMat,
    'lever_left',
    [-0.14, SEAT_H - 0.095, -0.02],
    [0, 0, 0.12]
  );

  // 5. Seat Pan & Cushion
  addMesh(
    new THREE.BoxGeometry(SEAT_W - 0.03, 0.028, SEAT_D - 0.03),
    plasticMat,
    'seat_pan',
    [0, SEAT_H - 0.048, 0.02]
  );

  // Contoured seat cushion via ExtrudeGeometry (side profile extruded along X)
  const seatShape = new THREE.Shape();
  const hsD = SEAT_D / 2;
  seatShape.moveTo(-hsD + 0.02, 0);
  seatShape.lineTo(hsD - 0.03, 0);
  seatShape.quadraticCurveTo(hsD + 0.01, 0.01, hsD, 0.045);
  seatShape.quadraticCurveTo(hsD - 0.02, 0.075, hsD - 0.08, 0.072);
  seatShape.lineTo(-hsD + 0.04, 0.068);
  seatShape.quadraticCurveTo(-hsD, 0.065, -hsD, 0.03);
  seatShape.quadraticCurveTo(-hsD, 0, -hsD + 0.02, 0);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_W - 0.04,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4
  });
  seatGeo.rotateY(Math.PI / 2);
  seatGeo.translate(-(SEAT_W - 0.04) / 2, SEAT_H - 0.04, 0.03);
  addMesh(seatGeo, fabricMat, 'seat_cushion');

  // 6. Backrest Spine Frame (2 side rails + top handle)
  const backTopY = H - 0.02;
  const backW = 0.44;
  for (const side of [-1, 1]) {
    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.14, SEAT_H - 0.065, -0.05),
      new THREE.Vector3(side * (backW / 2), SEAT_H - 0.04, -0.21),
      new THREE.Vector3(side * (backW / 2), SEAT_H + 0.18, -0.23),
      new THREE.Vector3(side * (backW / 2 - 0.015), backTopY, -0.27)
    ]);
    addMesh(
      new THREE.TubeGeometry(railCurve, 20, 0.016, 12, false),
      plasticMat,
      side < 0 ? 'back_frame_left' : 'back_frame_right'
    );
  }

  // Top handle bar
  const handleGeo = new THREE.CylinderGeometry(0.014, 0.014, backW - 0.03, 16);
  handleGeo.rotateZ(Math.PI / 2);
  addMesh(
    handleGeo,
    plasticMat,
    'back_top_handle',
    [0, backTopY, -0.27]
  );

  // 7. Backrest Cushion (3 horizontal padded sections)
  const backCushionW = backW - 0.035;
  const sectionH = 0.155;
  const backTilt = -0.14;
  for (let i = 0; i < 3; i++) {
    const yPos = SEAT_H + 0.14 + i * (sectionH + 0.006);
    const zPos = -0.215 - i * 0.022;
    const secGeo = new THREE.BoxGeometry(backCushionW, sectionH, 0.045);
    addMesh(
      secGeo,
      fabricMat,
      `back_cushion_section_${i + 1}`,
      [0, yPos, zPos],
      [backTilt, 0, 0]
    );
  }

  // 8. Armrests (Left & Right)
  const armX = W / 2 - 0.045;
  const armH = SEAT_H + 0.21;
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';
    // Vertical post
    const postCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.21, SEAT_H - 0.055, -0.02),
      new THREE.Vector3(side * armX, SEAT_H - 0.03, -0.01),
      new THREE.Vector3(side * armX, armH - 0.015, 0.0)
    ]);
    addMesh(
      new THREE.TubeGeometry(postCurve, 12, 0.018, 12, false),
      plasticMat,
      `arm_post_${label}`
    );

    // Armpad
    const padGeo = new THREE.BoxGeometry(0.085, 0.026, 0.24);
    addMesh(
      padGeo,
      armpadMat,
      `arm_pad_${label}`,
      [side * armX, armH, 0.02]
    );
  }

  return group;
}
