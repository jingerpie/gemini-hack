function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const R_BOTTOM = 0.19;
  const R_TOP = 0.22;
  const H = 0.36;
  const WALL = 0.016;
  const RIM_R = 0.014;
  const RIB_R = 0.008;
  const HANDLE_R = 0.009;

  // Materials
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xc2a378,
    roughness: 0.88,
    metalness: 0.02
  });

  const strawDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa8885c,
    roughness: 0.9,
    metalness: 0.02
  });

  const strawLightMat = new THREE.MeshStandardMaterial({
    color: 0xd1b68e,
    roughness: 0.85,
    metalness: 0.02
  });

  // 1. Main hollow basket body via LatheGeometry
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R_BOTTOM - 0.015, 0.0),
    new THREE.Vector2(R_BOTTOM, 0.018),
    new THREE.Vector2(R_BOTTOM + 0.008, 0.06),
    new THREE.Vector2(R_TOP - 0.006, H - 0.04),
    new THREE.Vector2(R_TOP, H - 0.012),
    new THREE.Vector2(R_TOP + 0.004, H - 0.004),
    new THREE.Vector2(R_TOP - WALL * 0.5, H),
    new THREE.Vector2(R_TOP - WALL, H - 0.008),
    new THREE.Vector2(R_TOP - WALL - 0.004, H - 0.04),
    new THREE.Vector2(R_BOTTOM - WALL + 0.006, 0.06),
    new THREE.Vector2(R_BOTTOM - WALL, 0.022),
    new THREE.Vector2(0.0, 0.02)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, strawMat);
  bodyMesh.name = "basket_body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Rolled top rim
  const rimGeo = new THREE.TorusGeometry(R_TOP - WALL * 0.45, RIM_R, 12, 32);
  const rimMesh = new THREE.Mesh(rimGeo, strawLightMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = H - RIM_R * 0.35;
  rimMesh.name = "basket_top_rim";
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 3. Horizontal woven courses along the exterior
  const courseCount = 10;
  for (let i = 0; i < courseCount; i++) {
    const t = (i + 1) / (courseCount + 1);
    const y = 0.025 + t * (H - 0.06);
    const r = THREE.MathUtils.lerp(R_BOTTOM + 0.004, R_TOP - 0.002, t);
    const courseGeo = new THREE.TorusGeometry(r, 0.0045, 8, 32);
    const courseMesh = new THREE.Mesh(courseGeo, i % 2 === 0 ? strawDarkMat : strawLightMat);
    courseMesh.rotation.x = Math.PI / 2;
    courseMesh.position.y = y;
    courseMesh.name = `woven_course_${i + 1}`;
    courseMesh.castShadow = true;
    courseMesh.receiveShadow = true;
    group.add(courseMesh);
  }

  // 4. Vertical inverted-U woven ribs around the perimeter (4 pairs)
  const archAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const archHalfSpan = 0.24; // radians
  const archTopY = H * 0.74;

  archAngles.forEach((baseAngle, idx) => {
    const a1 = baseAngle - archHalfSpan;
    const a2 = baseAngle + archHalfSpan;
    const rBot = R_BOTTOM + 0.004;
    const rTop = THREE.MathUtils.lerp(R_BOTTOM, R_TOP, 0.74) + 0.004;

    const pts = [
      new THREE.Vector3(Math.cos(a1) * rBot, 0.012, Math.sin(a1) * rBot),
      new THREE.Vector3(Math.cos(a1) * THREE.MathUtils.lerp(rBot, rTop, 0.5), archTopY * 0.5, Math.sin(a1) * THREE.MathUtils.lerp(rBot, rTop, 0.5)),
      new THREE.Vector3(Math.cos(a1) * rTop, archTopY - 0.015, Math.sin(a1) * rTop),
      new THREE.Vector3(Math.cos(baseAngle) * (rTop + 0.003), archTopY, Math.sin(baseAngle) * (rTop + 0.003)),
      new THREE.Vector3(Math.cos(a2) * rTop, archTopY - 0.015, Math.sin(a2) * rTop),
      new THREE.Vector3(Math.cos(a2) * THREE.MathUtils.lerp(rBot, rTop, 0.5), archTopY * 0.5, Math.sin(a2) * THREE.MathUtils.lerp(rBot, rTop, 0.5)),
      new THREE.Vector3(Math.cos(a2) * rBot, 0.012, Math.sin(a2) * rBot)
    ];

    const curve = new THREE.CatmullRomCurve3(pts);
    const ribGeo = new THREE.TubeGeometry(curve, 24, RIB_R, 8, false);
    const ribMesh = new THREE.Mesh(ribGeo, strawDarkMat);
    ribMesh.name = `vertical_rib_arch_${idx + 1}`;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  });

  // 5. Two drooping loop handles on -X and +X sides
  const handleSides = [
    { sign: -1, name: "handle_left" },
    { sign: 1, name: "handle_right" }
  ];

  handleSides.forEach((side) => {
    const rAttach = THREE.MathUtils.lerp(R_BOTTOM, R_TOP, 0.72);
    const yAttach = H * 0.72;
    const zOffset = 0.068;
    const loopOut = rAttach + 0.065;
    const loopLowY = H * 0.41;

    const handlePts = [
      new THREE.Vector3(side.sign * (rAttach - 0.005), yAttach, -zOffset),
      new THREE.Vector3(side.sign * (rAttach + 0.035), yAttach - 0.03, -zOffset * 0.85),
      new THREE.Vector3(side.sign * loopOut, loopLowY, 0.0),
      new THREE.Vector3(side.sign * (rAttach + 0.035), yAttach - 0.03, zOffset * 0.85),
      new THREE.Vector3(side.sign * (rAttach - 0.005), yAttach, zOffset)
    ];

    const handleCurve = new THREE.CatmullRomCurve3(handlePts);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_R, 8, false);
    const handleMesh = new THREE.Mesh(handleGeo, strawDarkMat);
    handleMesh.name = side.name;
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    group.add(handleMesh);
  });

  return group;
}
