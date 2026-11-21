function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_RADIUS = 0.28;
  const CASTER_WHEEL_R = 0.024;
  const CASTER_WHEEL_W = 0.012;
  const CASTER_STEM_H = 0.022;
  const HUB_Y = 0.115;
  const HUB_H = 0.055;
  const OUTER_COL_H = 0.21;
  const INNER_ROD_H = 0.11;
  const MECH_Y = HUB_Y + HUB_H * 0.5 + OUTER_COL_H + INNER_ROD_H - 0.03;
  const SEAT_H = 0.56;
  const SEAT_W = 0.44;
  const SEAT_D = 0.35;
  const SEAT_GAP = 0.048;

  // Materials
  const matAluminum = new THREE.MeshStandardMaterial({
    color: 0xc2c5c8,
    roughness: 0.32,
    metalness: 0.85,
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.48,
    metalness: 0.6,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.15,
    metalness: 0.95,
  });
  const matPlastic = new THREE.MeshStandardMaterial({
    color: 0x333538,
    roughness: 0.65,
    metalness: 0.1,
  });
  const matCasterWheel = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.7,
    metalness: 0.05,
  });
  const matLeather = new THREE.MeshStandardMaterial({
    color: 0x4c4e50,
    roughness: 0.58,
    metalness: 0.04,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x || 0, y || 0, z || 0);
    if (rx || ry || rz) {
      m.rotation.set(rx || 0, ry || 0, rz || 0);
    }
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Central Base Hub
  const hubGeo = new THREE.CylinderGeometry(0.036, 0.04, HUB_H, 24);
  addMesh(hubGeo, matAluminum, "base_hub", 0, HUB_Y, 0);

  // 5-Star Base Legs & Casters
  const legShape = new THREE.Shape();
  legShape.moveTo(0.03, 0.018);
  legShape.lineTo(BASE_RADIUS - 0.015, -0.022);
  legShape.lineTo(BASE_RADIUS, -0.026);
  legShape.lineTo(BASE_RADIUS, -0.052);
  legShape.lineTo(BASE_RADIUS - 0.018, -0.052);
  legShape.lineTo(BASE_RADIUS - 0.018, -0.036);
  legShape.lineTo(0.03, -0.012);
  legShape.closePath();

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  legGeo.translate(0, 0, -0.012);

  const casterHoodGeo = new THREE.CylinderGeometry(0.012, 0.015, CASTER_STEM_H, 12);
  const wheelGeo = new THREE.CylinderGeometry(CASTER_WHEEL_R, CASTER_WHEEL_R, CASTER_WHEEL_W, 20);
  wheelGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const legMesh = new THREE.Mesh(legGeo, matAluminum);
    legMesh.name = `base_leg_${i + 1}`;
    legMesh.position.set(0, HUB_Y, 0);
    legMesh.rotation.y = Math.PI / 2 - angle;
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    const cx = Math.sin(angle) * (BASE_RADIUS - 0.009);
    const cz = -Math.cos(angle) * (BASE_RADIUS - 0.009);

    addMesh(
      casterHoodGeo,
      matPlastic,
      `caster_hood_${i + 1}`,
      cx,
      CASTER_WHEEL_R * 2 + CASTER_STEM_H * 0.5 - 0.004,
      cz
    );

    const wheelOffset = 0.011;
    const wx1 = cx + Math.cos(angle) * wheelOffset;
    const wz1 = cz + Math.sin(angle) * wheelOffset;
    const wx2 = cx - Math.cos(angle) * wheelOffset;
    const wz2 = cz - Math.sin(angle) * wheelOffset;

    addMesh(wheelGeo, matCasterWheel, `caster_wheel_${i + 1}_a`, wx1, CASTER_WHEEL_R, wz1, 0, -angle, 0);
    addMesh(wheelGeo, matCasterWheel, `caster_wheel_${i + 1}_b`, wx2, CASTER_WHEEL_R, wz2, 0, -angle, 0);
  }

  // Gas Lift Outer Cylinder
  const outerColY = HUB_Y + HUB_H * 0.5 + OUTER_COL_H * 0.5 - 0.02;
  const outerColGeo = new THREE.CylinderGeometry(0.025, 0.026, OUTER_COL_H, 24);
  addMesh(outerColGeo, matDarkMetal, "gas_lift_outer", 0, outerColY, 0);

  // Gas Lift Inner Piston
  const innerRodY = outerColY + OUTER_COL_H * 0.5 + INNER_ROD_H * 0.5 - 0.01;
  const innerRodGeo = new THREE.CylinderGeometry(0.014, 0.014, INNER_ROD_H, 20);
  addMesh(innerRodGeo, matChrome, "gas_lift_piston", 0, innerRodY, 0);

  // Tension / Adjustment Collar under mechanism
  const collarGeo = new THREE.CylinderGeometry(0.028, 0.024, 0.042, 20);
  addMesh(collarGeo, matPlastic, "tension_collar", 0, MECH_Y - 0.025, 0);

  // Under-seat Mechanism Plate
  const mechGeo = new THREE.BoxGeometry(0.16, 0.022, 0.14);
  addMesh(mechGeo, matDarkMetal, "seat_mechanism_plate", 0, MECH_Y, 0);

  // Height Adjustment Lever (on -X side)
  const leverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, MECH_Y - 0.005, 0.02),
    new THREE.Vector3(-0.105, MECH_Y - 0.032, 0.025),
    new THREE.Vector3(-0.175, MECH_Y - 0.05, 0.03),
  ]);
  const leverRodGeo = new THREE.TubeGeometry(leverCurve, 12, 0.005, 8, false);
  addMesh(leverRodGeo, matDarkMetal, "adjustment_lever_rod", 0, 0, 0);

  const leverPaddleGeo = new THREE.BoxGeometry(0.06, 0.013, 0.026);
  addMesh(leverPaddleGeo, matPlastic, "adjustment_lever_paddle", -0.195, MECH_Y - 0.056, 0.03, 0, 0, 0.28);

  // Split Saddle Seat (Two separate bean/teardrop padded halves with clear ~4.8 cm gap)
  const bevelSize = 0.018;
  const innerEdgeX = SEAT_GAP * 0.5 + bevelSize;
  const halfShape = new THREE.Shape();
  halfShape.moveTo(innerEdgeX + 0.004, -SEAT_D * 0.42);
  halfShape.bezierCurveTo(
    innerEdgeX + 0.075,
    -SEAT_D * 0.48,
    SEAT_W * 0.46,
    -SEAT_D * 0.34,
    SEAT_W * 0.48,
    -0.02
  );
  halfShape.bezierCurveTo(
    SEAT_W * 0.49,
    SEAT_D * 0.32,
    innerEdgeX + 0.105,
    SEAT_D * 0.46,
    innerEdgeX + 0.006,
    SEAT_D * 0.36
  );
  halfShape.bezierCurveTo(
    innerEdgeX - 0.004,
    SEAT_D * 0.16,
    innerEdgeX - 0.004,
    -SEAT_D * 0.18,
    innerEdgeX + 0.004,
    -SEAT_D * 0.42
  );

  const halfGeo = new THREE.ExtrudeGeometry(halfShape, {
    depth: 0.034,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: bevelSize,
    bevelSegments: 5,
    curveSegments: 24,
  });
  halfGeo.rotateX(Math.PI / 2);

  // Right half (+X), tilted outward and downward
  addMesh(
    halfGeo,
    matLeather,
    "seat_cushion_right",
    0,
    SEAT_H - 0.052,
    0,
    -0.05,
    0,
    -0.32
  );

  // Left half (-X), mirrored on X
  const leftSeat = addMesh(
    halfGeo,
    matLeather,
    "seat_cushion_left",
    0,
    SEAT_H - 0.052,
    0,
    -0.05,
    0,
    0.32
  );
  leftSeat.scale.x = -1;

  return group;
}
