function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SAUCER_R = 0.078;
  const SAUCER_H = 0.018;
  const SAUCER_WELL_Y = 0.006;

  const CUP_H = 0.068;
  const CUP_TOP_R = 0.046;
  const CUP_BASE_R = 0.028;
  const CUP_FOOT_H = 0.006;
  const CUP_WALL = 0.0035;

  const HANDLE_TUBE_R = 0.0052;
  const RADIAL_SEGS = 32;

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xe5ddd0,
    roughness: 0.24,
    metalness: 0.02,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
  });

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xb39776,
    roughness: 0.88,
    metalness: 0.0,
  });

  // 1. Saucer (LatheGeometry)
  const saucerPts = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(0.028, 0.002),
    new THREE.Vector2(0.031, 0.0),       // foot ring touching y = 0
    new THREE.Vector2(0.034, 0.0),
    new THREE.Vector2(0.037, 0.003),
    new THREE.Vector2(0.062, 0.008),
    new THREE.Vector2(SAUCER_R - 0.004, 0.015),
    new THREE.Vector2(SAUCER_R, SAUCER_H),
    new THREE.Vector2(SAUCER_R - 0.002, SAUCER_H + 0.0015),
    new THREE.Vector2(0.060, 0.011),
    new THREE.Vector2(0.035, 0.007),
    new THREE.Vector2(0.028, SAUCER_WELL_Y),
    new THREE.Vector2(0.0, SAUCER_WELL_Y),
  ];
  const saucerGeo = new THREE.LatheGeometry(saucerPts, RADIAL_SEGS);
  const saucerMesh = new THREE.Mesh(saucerGeo, glazeMat);
  saucerMesh.name = "saucer";
  saucerMesh.castShadow = true;
  saucerMesh.receiveShadow = true;
  group.add(saucerMesh);

  // 2. Cup unglazed clay foot ring
  const cupFootPts = [
    new THREE.Vector2(0.0, SAUCER_WELL_Y),
    new THREE.Vector2(CUP_BASE_R - 0.002, SAUCER_WELL_Y),
    new THREE.Vector2(CUP_BASE_R, SAUCER_WELL_Y + CUP_FOOT_H),
    new THREE.Vector2(CUP_BASE_R - CUP_WALL, SAUCER_WELL_Y + CUP_FOOT_H),
    new THREE.Vector2(0.0, SAUCER_WELL_Y + 0.002),
  ];
  const cupFootGeo = new THREE.LatheGeometry(cupFootPts, RADIAL_SEGS);
  const cupFootMesh = new THREE.Mesh(cupFootGeo, clayMat);
  cupFootMesh.name = "cup_clay_foot";
  cupFootMesh.castShadow = true;
  cupFootMesh.receiveShadow = true;
  group.add(cupFootMesh);

  // 3. Cup glazed body
  const cupTopY = SAUCER_WELL_Y + CUP_H;
  const cupFootTopY = SAUCER_WELL_Y + CUP_FOOT_H;
  const cupPts = [
    new THREE.Vector2(CUP_BASE_R, cupFootTopY),
    new THREE.Vector2(CUP_BASE_R + 0.004, cupFootTopY + 0.014),
    new THREE.Vector2(CUP_BASE_R + 0.010, cupFootTopY + 0.034),
    new THREE.Vector2(CUP_TOP_R - 0.003, cupTopY - 0.010),
    new THREE.Vector2(CUP_TOP_R, cupTopY),
    new THREE.Vector2(CUP_TOP_R - CUP_WALL * 0.5, cupTopY + 0.0015),
    new THREE.Vector2(CUP_TOP_R - CUP_WALL, cupTopY),
    new THREE.Vector2(CUP_TOP_R - CUP_WALL - 0.003, cupTopY - 0.010),
    new THREE.Vector2(CUP_BASE_R + 0.010 - CUP_WALL, cupFootTopY + 0.034),
    new THREE.Vector2(CUP_BASE_R + 0.004 - CUP_WALL, cupFootTopY + 0.014),
    new THREE.Vector2(CUP_BASE_R - CUP_WALL, cupFootTopY + 0.002),
    new THREE.Vector2(0.0, cupFootTopY + 0.001),
  ];
  const cupGeo = new THREE.LatheGeometry(cupPts, RADIAL_SEGS);
  const cupMesh = new THREE.Mesh(cupGeo, glazeMat);
  cupMesh.name = "cup_body";
  cupMesh.castShadow = true;
  cupMesh.receiveShadow = true;
  group.add(cupMesh);

  // 4. Cup handle (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CUP_TOP_R - 0.006, cupTopY - 0.013, 0),
    new THREE.Vector3(CUP_TOP_R + 0.012, cupTopY - 0.010, 0),
    new THREE.Vector3(CUP_TOP_R + 0.022, cupTopY - 0.022, 0),
    new THREE.Vector3(CUP_TOP_R + 0.018, cupFootTopY + 0.018, 0),
    new THREE.Vector3(CUP_BASE_R + 0.003, cupFootTopY + 0.010, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_TUBE_R, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, glazeMat);
  handleMesh.name = "cup_handle";
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
