function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.66;
  const H = 1.02;
  const D = 0.62;
  const SEAT_H = 0.46;
  const SEAT_W = 0.50;
  const SEAT_D = 0.46;
  const SEAT_THICK = 0.075;
  const BASE_R = 0.31;
  const CASTER_R = 0.027;
  const HUB_Y = 0.115;

  // Materials
  const matFabric = new THREE.MeshStandardMaterial({
    color: 0xd5cbb8,
    roughness: 0.85,
    metalness: 0.0,
  });

  const matMesh = new THREE.MeshPhysicalMaterial({
    color: 0xcfc4b0,
    roughness: 0.75,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });

  const matLumbar = new THREE.MeshStandardMaterial({
    color: 0xa69c8a,
    roughness: 0.7,
    metalness: 0.0,
  });

  const matDarkPlastic = new THREE.MeshStandardMaterial({
    color: 0x44484c,
    roughness: 0.45,
    metalness: 0.1,
  });

  const matGasLift = new THREE.MeshStandardMaterial({
    color: 0x2a2d30,
    roughness: 0.3,
    metalness: 0.6,
  });

  const matBaseGrey = new THREE.MeshStandardMaterial({
    color: 0xa4a8ab,
    roughness: 0.4,
    metalness: 0.25,
  });

  const matCasterWheel = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.5,
    metalness: 0.1,
  });

  function setupMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Five-star base hub
  const hubGeo = new THREE.CylinderGeometry(0.045, 0.052, 0.055, 24);
  const hubMesh = new THREE.Mesh(hubGeo, matBaseGrey);
  hubMesh.position.set(0, HUB_Y, 0);
  setupMesh(hubMesh, "base_hub");

  // 2. Five-star legs and casters
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);

    // Leg arm
    const legLen = BASE_R - 0.03;
    const legShape = new THREE.Shape();
    legShape.moveTo(0, -0.018);
    legShape.lineTo(legLen, -0.012);
    legShape.lineTo(legLen, 0.012);
    legShape.lineTo(0, 0.018);
    legShape.closePath();

    const legGeo = new THREE.ExtrudeGeometry(legShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    legGeo.rotateX(Math.PI / 2);

    const legMesh = new THREE.Mesh(legGeo, matBaseGrey);
    legMesh.position.set(dirX * 0.03, HUB_Y + 0.01, dirZ * 0.03);
    legMesh.rotation.y = -angle + Math.PI / 2;
    legMesh.rotation.z = -0.14;
    setupMesh(legMesh, `base_leg_${i + 1}`);

    // Caster housing/stem
    const casterX = dirX * BASE_R;
    const casterZ = dirZ * BASE_R;
    const casterHousingGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.042, 16);
    const casterHousing = new THREE.Mesh(casterHousingGeo, matBaseGrey);
    casterHousing.position.set(casterX, CASTER_R * 2 - 0.002, casterZ);
    setupMesh(casterHousing, `caster_stem_${i + 1}`);

    // Dual-wheel caster
    const wheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.034, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMesh = new THREE.Mesh(wheelGeo, matCasterWheel);
    wheelMesh.position.set(casterX, CASTER_R, casterZ);
    wheelMesh.rotation.y = angle + 0.3;
    setupMesh(wheelMesh, `caster_wheel_${i + 1}`);
  }

  // 3. Gas lift column
  const liftOuterGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.14, 20);
  const liftOuter = new THREE.Mesh(liftOuterGeo, matGasLift);
  liftOuter.position.set(0, HUB_Y + 0.08, 0);
  setupMesh(liftOuter, "gas_lift_outer");

  const liftInnerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.18, 20);
  const liftInner = new THREE.Mesh(liftInnerGeo, matGasLift);
  liftInner.position.set(0, HUB_Y + 0.16, 0);
  setupMesh(liftInner, "gas_lift_inner");

  // 4. Under-seat mechanism
  const mechGeo = new THREE.BoxGeometry(0.24, 0.065, 0.24);
  const mechMesh = new THREE.Mesh(mechGeo, matDarkPlastic);
  mechMesh.position.set(0, SEAT_H - SEAT_THICK - 0.035, -0.01);
  setupMesh(mechMesh, "seat_mechanism");

  // Adjustment levers (left and right)
  for (let side = -1; side <= 1; side += 2) {
    const leverGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.16, 12);
    leverGeo.rotateZ(Math.PI / 2);
    const lever = new THREE.Mesh(leverGeo, matDarkPlastic);
    lever.position.set(side * 0.14, SEAT_H - SEAT_THICK - 0.04, 0.04);
    setupMesh(lever, side < 0 ? "adjustment_lever_left" : "adjustment_lever_right");

    const knobGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.035, 16);
    knobGeo.rotateZ(Math.PI / 2);
    const knob = new THREE.Mesh(knobGeo, matDarkPlastic);
    knob.position.set(side * 0.22, SEAT_H - SEAT_THICK - 0.04, 0.04);
    setupMesh(knob, side < 0 ? "adjustment_knob_left" : "adjustment_knob_right");
  }

  // 5. Seat pan & cushion
  const panGeo = new THREE.BoxGeometry(SEAT_W - 0.02, 0.025, SEAT_D - 0.02);
  const panMesh = new THREE.Mesh(panGeo, matDarkPlastic);
  panMesh.position.set(0, SEAT_H - SEAT_THICK + 0.005, 0.02);
  setupMesh(panMesh, "seat_pan");

  // Rounded seat cushion using ExtrudeGeometry
  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2 - 0.02;
  const sd = SEAT_D / 2 - 0.02;
  const sr = 0.04;
  seatShape.moveTo(-sw + sr, -sd);
  seatShape.lineTo(sw - sr, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + sr);
  seatShape.lineTo(sw, sd - sr);
  seatShape.quadraticCurveTo(sw, sd, sw - sr, sd);
  seatShape.lineTo(-sw + sr, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - sr);
  seatShape.lineTo(-sw, -sd + sr);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + sr, -sd);

  const cushionGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.025,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 4,
  });
  cushionGeo.rotateX(Math.PI / 2);
  const cushionMesh = new THREE.Mesh(cushionGeo, matFabric);
  cushionMesh.position.set(0, SEAT_H - 0.01, 0.025);
  setupMesh(cushionMesh, "seat_cushion");

  // 6. Backrest spine & frame
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, SEAT_H - SEAT_THICK - 0.03, -0.06),
    new THREE.Vector3(0, SEAT_H - 0.02, -0.21),
    new THREE.Vector3(0, SEAT_H + 0.14, -0.24),
  ]);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 16, 0.024, 12, false);
  const spineMesh = new THREE.Mesh(spineGeo, matDarkPlastic);
  setupMesh(spineMesh, "backrest_spine");

  // Backrest outer frame
  const backW = 0.44;
  const backH = 0.54;
  const backY = SEAT_H + 0.29;
  const backZ = -0.22;

  const backFrameGeo = new THREE.BoxGeometry(backW + 0.02, backH + 0.02, 0.022);
  const backFrame = new THREE.Mesh(backFrameGeo, matDarkPlastic);
  backFrame.position.set(0, backY, backZ - 0.012);
  backFrame.rotation.x = -0.1;
  setupMesh(backFrame, "backrest_frame");

  // Backrest mesh panel
  const backMeshGeo = new THREE.BoxGeometry(backW, backH, 0.02);
  const backMesh = new THREE.Mesh(backMeshGeo, matMesh);
  backMesh.position.set(0, backY, backZ + 0.002);
  backMesh.rotation.x = -0.1;
  setupMesh(backMesh, "backrest_mesh");

  // Lumbar support pad
  const lumbarGeo = new THREE.CapsuleGeometry(0.05, 0.16, 8, 16);
  lumbarGeo.rotateZ(Math.PI / 2);
  lumbarGeo.scale(1, 1, 0.35);
  const lumbarMesh = new THREE.Mesh(lumbarGeo, matLumbar);
  lumbarMesh.position.set(0, SEAT_H + 0.17, backZ - 0.005);
  lumbarMesh.rotation.x = -0.1;
  setupMesh(lumbarMesh, "lumbar_support");

  // 7. Armrests (Left & Right)
  const armX = W / 2 - 0.05;
  const armY = SEAT_H + 0.19;

  for (let side = -1; side <= 1; side += 2) {
    const sideLabel = side < 0 ? "left" : "right";

    // Lower horizontal bracket connecting to mechanism
    const armBracketGeo = new THREE.CylinderGeometry(0.016, 0.016, armX - 0.06, 12);
    armBracketGeo.rotateZ(Math.PI / 2);
    const armBracket = new THREE.Mesh(armBracketGeo, matDarkPlastic);
    armBracket.position.set(side * (armX / 2 + 0.03), SEAT_H - SEAT_THICK - 0.01, -0.02);
    setupMesh(armBracket, `armrest_bracket_${sideLabel}`);

    // Vertical arm post
    const postGeo = new THREE.CylinderGeometry(0.018, 0.022, armY - (SEAT_H - SEAT_THICK), 14);
    const post = new THREE.Mesh(postGeo, matDarkPlastic);
    post.position.set(side * armX, (armY + SEAT_H - SEAT_THICK) / 2, -0.02);
    post.rotation.x = 0.08;
    setupMesh(post, `armrest_post_${sideLabel}`);

    // Armrest pad base
    const padBaseGeo = new THREE.BoxGeometry(0.085, 0.014, 0.23);
    const padBase = new THREE.Mesh(padBaseGeo, matDarkPlastic);
    padBase.position.set(side * armX, armY, 0.01);
    setupMesh(padBase, `armrest_pad_base_${sideLabel}`);

    // Upholstered armrest pad
    const padGeo = new THREE.CapsuleGeometry(0.038, 0.15, 8, 16);
    padGeo.rotateX(Math.PI / 2);
    padGeo.scale(1.15, 0.45, 1);
    const pad = new THREE.Mesh(padGeo, matFabric);
    pad.position.set(side * armX, armY + 0.016, 0.01);
    setupMesh(pad, `armrest_pad_${sideLabel}`);
  }

  return group;
}
