function build(THREE) {
  const group = new THREE.Group();

  const R_OUTER = 0.09;
  const H = 0.032;
  const WALL_T = 0.011;
  const BASE_T = 0.008;
  const SEGMENTS = 32;

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0x9c7356,
    roughness: 0.92,
    metalness: 0.0,
  });

  const terracottaDarkMat = new THREE.MeshStandardMaterial({
    color: 0x876147,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Main tray body profile
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_OUTER - 0.012, 0),
    new THREE.Vector2(R_OUTER - 0.005, 0.003),
    new THREE.Vector2(R_OUTER - 0.002, 0.009),
    new THREE.Vector2(R_OUTER, H - 0.004),
    new THREE.Vector2(R_OUTER - 0.0015, H - 0.001),
    new THREE.Vector2(R_OUTER - 0.0055, H),
    new THREE.Vector2(R_OUTER - 0.0095, H - 0.001),
    new THREE.Vector2(R_OUTER - WALL_T, H - 0.004),
    new THREE.Vector2(R_OUTER - WALL_T - 0.0015, BASE_T + 0.005),
    new THREE.Vector2(R_OUTER - WALL_T - 0.005, BASE_T + 0.0015),
    new THREE.Vector2(R_OUTER - WALL_T - 0.011, BASE_T),
    new THREE.Vector2(0, BASE_T),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, terracottaMat);
  bodyMesh.name = 'tray_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Subtle inner floor disc for slight tonal variation
  const innerFloorGeo = new THREE.CylinderGeometry(
    R_OUTER - WALL_T - 0.01,
    R_OUTER - WALL_T - 0.01,
    0.001,
    SEGMENTS
  );
  const innerFloorMesh = new THREE.Mesh(innerFloorGeo, terracottaDarkMat);
  innerFloorMesh.name = 'tray_inner_floor';
  innerFloorMesh.position.y = BASE_T + 0.0002;
  innerFloorMesh.castShadow = true;
  innerFloorMesh.receiveShadow = true;
  group.add(innerFloorMesh);

  // Subtle bottom foot ring
  const footRingGeo = new THREE.TorusGeometry(R_OUTER - 0.016, 0.0015, 8, SEGMENTS);
  footRingGeo.rotateX(Math.PI / 2);
  const footRingMesh = new THREE.Mesh(footRingGeo, terracottaDarkMat);
  footRingMesh.name = 'tray_foot_ring';
  footRingMesh.position.y = 0.0015;
  footRingMesh.castShadow = true;
  footRingMesh.receiveShadow = true;
  group.add(footRingMesh);

  return group;
}
