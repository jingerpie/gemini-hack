function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.25;
  const RADIUS = DIAMETER / 2; // 0.125
  const TOTAL_H = 0.20;
  const BODY_H = 0.155;
  const WALL_T = 0.010;
  const RIM_TUBE_R = 0.009;
  const COIL_TUBE_R = 0.0045;
  const RIB_TUBE_R = 0.0055;
  const HANDLE_TUBE_R = 0.008;

  // Materials
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xb89668,
    roughness: 0.88,
    metalness: 0.0,
  });

  const strawDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa38052,
    roughness: 0.90,
    metalness: 0.0,
  });

  const strawInnerMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a4e,
    roughness: 0.92,
    metalness: 0.0,
  });

  function setupMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main woven basket body (LatheGeometry with rounded bottom and inner cavity)
  const bodyR = RADIUS - COIL_TUBE_R * 0.6;
  const innerR = bodyR - WALL_T;
  const baseBevel = 0.016;
  const bodyTopY = BODY_H - RIM_TUBE_R;

  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(bodyR - baseBevel, 0.0),
    new THREE.Vector2(bodyR - baseBevel * 0.4, baseBevel * 0.25),
    new THREE.Vector2(bodyR, baseBevel),
    new THREE.Vector2(bodyR, bodyTopY),
    new THREE.Vector2(innerR, bodyTopY),
    new THREE.Vector2(innerR, WALL_T + 0.006),
    new THREE.Vector2(innerR - 0.008, WALL_T),
    new THREE.Vector2(0.0, WALL_T),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, strawInnerMat);
  setupMesh(bodyMesh, "basket_body");

  // 2. Top braided rim
  const rimGeo = new THREE.TorusGeometry(bodyR - WALL_T * 0.5, RIM_TUBE_R, 14, 32);
  const rimMesh = new THREE.Mesh(rimGeo, strawMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = bodyTopY;
  setupMesh(rimMesh, "top_rim");

  // 3. Horizontal woven coils along the exterior wall
  const coilCount = 12;
  const coilStartY = baseBevel + 0.006;
  const coilEndY = bodyTopY - RIM_TUBE_R - 0.004;
  for (let i = 0; i < coilCount; i++) {
    const t = i / (coilCount - 1);
    const y = coilStartY + t * (coilEndY - coilStartY);
    const coilGeo = new THREE.TorusGeometry(bodyR, COIL_TUBE_R, 8, 32);
    const coilMesh = new THREE.Mesh(coilGeo, i % 2 === 0 ? strawMat : strawDarkMat);
    coilMesh.rotation.x = Math.PI / 2;
    coilMesh.position.y = y;
    setupMesh(coilMesh, `woven_coil_${i + 1}`);
  }

  // 4. Two upright loop handles on -X and +X sides + 4 vertical braided ribs
  const handleSpreadZ = 0.046;
  const handleApexY = TOTAL_H - HANDLE_TUBE_R;
  const handleSides = [
    { side: "left", signX: -1 },
    { side: "right", signX: 1 },
  ];

  handleSides.forEach(({ side, signX }) => {
    const attachX = signX * (bodyR - WALL_T * 0.45);

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(attachX, bodyTopY, -handleSpreadZ),
      new THREE.Vector3(attachX * 1.03, bodyTopY + (handleApexY - bodyTopY) * 0.65, -handleSpreadZ * 0.85),
      new THREE.Vector3(attachX * 1.05, handleApexY, 0),
      new THREE.Vector3(attachX * 1.03, bodyTopY + (handleApexY - bodyTopY) * 0.65, handleSpreadZ * 0.85),
      new THREE.Vector3(attachX, bodyTopY, handleSpreadZ),
    ]);

    const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_TUBE_R, 12, false);
    const handleMesh = new THREE.Mesh(handleGeo, strawMat);
    setupMesh(handleMesh, `${side}_handle`);

    // Vertical ribs running down from each handle attachment point
    [-1, 1].forEach((signZ, idx) => {
      const zPos = signZ * handleSpreadZ;
      const ribX = signX * Math.sqrt(Math.max(0.0001, bodyR * bodyR - zPos * zPos));
      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ribX, bodyTopY, zPos),
        new THREE.Vector3(ribX + signX * 0.002, bodyTopY * 0.5, zPos),
        new THREE.Vector3(ribX * 0.96, baseBevel * 0.5, zPos * 0.96),
      ]);
      const ribGeo = new THREE.TubeGeometry(ribCurve, 12, RIB_TUBE_R, 8, false);
      const ribMesh = new THREE.Mesh(ribGeo, strawDarkMat);
      setupMesh(ribMesh, `${side}_vertical_rib_${idx + 1}`);

      // Small collar where handle meets the rim
      const collarGeo = new THREE.TorusGeometry(HANDLE_TUBE_R * 1.05, 0.003, 8, 16);
      const collarMesh = new THREE.Mesh(collarGeo, strawDarkMat);
      collarMesh.rotation.x = Math.PI / 2;
      collarMesh.position.set(attachX, bodyTopY + 0.004, zPos);
      setupMesh(collarMesh, `${side}_handle_collar_${idx + 1}`);
    });
  });

  return group;
}
