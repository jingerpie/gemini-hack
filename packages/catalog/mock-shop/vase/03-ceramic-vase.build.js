function build(THREE) {
  const group = new THREE.Group();

  const H = 0.34;
  const R_MAX = 0.095;
  const R_NECK = 0.042;
  const R_BASE = 0.042;
  const R_WAIST = 0.048;
  const WALL_T = 0.006;
  const SEGMENTS = 32;

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xb54836,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x3b1812,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Profile points (radius, y) from bottom center up the outer wall and down the inner neck
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R_BASE - 0.003, 0.0),
    new THREE.Vector2(R_BASE, 0.004),
    new THREE.Vector2(R_BASE, 0.052),
    new THREE.Vector2(R_BASE + 0.004, 0.056),

    // Lower bicone
    new THREE.Vector2(R_MAX - 0.004, 0.102),
    new THREE.Vector2(R_MAX, 0.107),
    new THREE.Vector2(R_MAX - 0.003, 0.112),

    // Waist
    new THREE.Vector2(R_WAIST + 0.003, 0.168),
    new THREE.Vector2(R_WAIST, 0.172),
    new THREE.Vector2(R_WAIST + 0.003, 0.176),

    // Upper bicone
    new THREE.Vector2(R_MAX - 0.003, 0.228),
    new THREE.Vector2(R_MAX, 0.233),
    new THREE.Vector2(R_MAX - 0.004, 0.238),

    // Neck
    new THREE.Vector2(R_NECK + 0.004, 0.278),
    new THREE.Vector2(R_NECK, 0.283),
    new THREE.Vector2(R_NECK, H - 0.003),

    // Rim and inner wall
    new THREE.Vector2(R_NECK - 0.002, H),
    new THREE.Vector2(R_NECK - WALL_T + 0.002, H),
    new THREE.Vector2(R_NECK - WALL_T, H - 0.003),
    new THREE.Vector2(R_NECK - WALL_T, 0.275),
    new THREE.Vector2(0.0, 0.275),
  ];

  const vaseGeo = new THREE.LatheGeometry(pts, SEGMENTS);
  vaseGeo.computeVertexNormals();
  const vaseMesh = new THREE.Mesh(vaseGeo, ceramicMat);
  vaseMesh.name = 'vase_body';
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Darkened interior disc to give depth inside the neck
  const interiorGeo = new THREE.CylinderGeometry(
    R_NECK - WALL_T - 0.001,
    R_NECK - WALL_T - 0.001,
    0.004,
    SEGMENTS
  );
  const interiorMesh = new THREE.Mesh(interiorGeo, interiorMat);
  interiorMesh.name = 'vase_interior_base';
  interiorMesh.position.y = 0.277;
  interiorMesh.castShadow = true;
  interiorMesh.receiveShadow = true;
  group.add(interiorMesh);

  return group;
}
