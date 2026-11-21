function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - realistic espresso cup
  const CUP_R = 0.034;          // outer radius (6.8 cm diameter)
  const CUP_H = 0.062;          // total height (6.2 cm)
  const WALL_T = 0.0045;        // ceramic wall thickness
  const FOOT_H = 0.004;         // unglazed clay foot height
  const FOOT_R = 0.0295;        // outer radius of foot ring
  const HANDLE_EXTENT = 0.026;  // how far handle protrudes beyond CUP_R
  const HANDLE_TUBE_R = 0.0045; // handle cross-section radius
  const RADIAL_SEGS = 32;

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xb5a796,
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2
  });

  const clayFootMat = new THREE.MeshStandardMaterial({
    color: 0xa4623b,
    roughness: 0.88,
    metalness: 0.0
  });

  // Sub-group for cup assembly so we can center the bounding box on X = 0
  const cupAssembly = new THREE.Group();

  // 1. Unglazed terracotta foot ring (y = 0 to FOOT_H)
  const footPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FOOT_R, 0.0),
    new THREE.Vector2(FOOT_R + 0.0015, FOOT_H * 0.5),
    new THREE.Vector2(CUP_R - 0.001, FOOT_H + 0.001),
    new THREE.Vector2(0.0, FOOT_H + 0.001)
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, RADIAL_SEGS);
  const footMesh = new THREE.Mesh(footGeo, clayFootMat);
  footMesh.name = 'unglazed_clay_foot';
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  cupAssembly.add(footMesh);

  // 2. Main glazed ceramic body (outer wall, rounded rim, inner wall, inner floor)
  const innerR = CUP_R - WALL_T;
  const innerFloorY = FOOT_H + 0.005;
  const bodyPoints = [
    new THREE.Vector2(CUP_R - 0.0012, FOOT_H),
    new THREE.Vector2(CUP_R, FOOT_H + 0.004),
    new THREE.Vector2(CUP_R, CUP_H - 0.003),
    new THREE.Vector2(CUP_R - 0.0008, CUP_H - 0.001),
    new THREE.Vector2(CUP_R - WALL_T * 0.5, CUP_H),
    new THREE.Vector2(innerR + 0.0008, CUP_H - 0.001),
    new THREE.Vector2(innerR, CUP_H - 0.003),
    new THREE.Vector2(innerR, innerFloorY + 0.006),
    new THREE.Vector2(innerR - 0.004, innerFloorY + 0.0015),
    new THREE.Vector2(0.0, innerFloorY)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, RADIAL_SEGS);
  const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
  bodyMesh.name = 'glazed_cup_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  cupAssembly.add(bodyMesh);

  // 3. Ceramic ear handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CUP_R - 0.003, CUP_H * 0.76, 0),
    new THREE.Vector3(CUP_R + HANDLE_EXTENT * 0.55, CUP_H * 0.80, 0),
    new THREE.Vector3(CUP_R + HANDLE_EXTENT - HANDLE_TUBE_R, CUP_H * 0.60, 0),
    new THREE.Vector3(CUP_R + HANDLE_EXTENT * 0.72, CUP_H * 0.36, 0),
    new THREE.Vector3(CUP_R - 0.003, CUP_H * 0.22, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_TUBE_R, 14, false);
  const handleMesh = new THREE.Mesh(handleGeo, glazeMat);
  handleMesh.name = 'ceramic_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  cupAssembly.add(handleMesh);

  // 4. Subtle handle attachment fillets where handle meets cup wall
  const filletGeo = new THREE.SphereGeometry(HANDLE_TUBE_R * 1.18, 12, 10);
  const topFillet = new THREE.Mesh(filletGeo, glazeMat);
  topFillet.name = 'handle_top_attachment';
  topFillet.position.set(CUP_R - 0.0015, CUP_H * 0.76, 0);
  topFillet.scale.set(0.8, 1.2, 1.0);
  topFillet.castShadow = true;
  topFillet.receiveShadow = true;
  cupAssembly.add(topFillet);

  const bottomFillet = new THREE.Mesh(filletGeo, glazeMat);
  bottomFillet.name = 'handle_bottom_attachment';
  bottomFillet.position.set(CUP_R - 0.0015, CUP_H * 0.22, 0);
  bottomFillet.scale.set(0.8, 1.25, 1.0);
  bottomFillet.castShadow = true;
  bottomFillet.receiveShadow = true;
  cupAssembly.add(bottomFillet);

  // Center the bounding box on X = 0
  cupAssembly.position.x = -HANDLE_EXTENT * 0.5;
  group.add(cupAssembly);

  return group;
}
