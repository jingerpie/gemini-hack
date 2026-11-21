function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.20;
  const MAX_R = 0.11;
  const BASE_R = 0.048;
  const RIM_OUTER_R = 0.052;
  const RIM_INNER_R = 0.042;
  const FOOT_H = 0.0015;
  const SEGMENTS = 32;

  // Materials
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.48,
    metalness: 0.05
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b0c,
    roughness: 0.85,
    metalness: 0.0
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2c2a29,
    roughness: 0.9,
    metalness: 0.0
  });

  // Vase body profile (outer wall, rounded lip, inner wall)
  const points = [
    new THREE.Vector2(0, FOOT_H),
    new THREE.Vector2(BASE_R * 0.85, FOOT_H),
    new THREE.Vector2(BASE_R, FOOT_H + 0.002),
    new THREE.Vector2(BASE_R + 0.022, 0.014),
    new THREE.Vector2(MAX_R * 0.84, 0.038),
    new THREE.Vector2(MAX_R * 0.97, 0.072),
    new THREE.Vector2(MAX_R, H * 0.50),
    new THREE.Vector2(MAX_R * 0.96, H * 0.68),
    new THREE.Vector2(MAX_R * 0.83, H * 0.84),
    new THREE.Vector2(RIM_OUTER_R + 0.016, H * 0.945),
    new THREE.Vector2(RIM_OUTER_R, H - 0.004),
    new THREE.Vector2((RIM_OUTER_R + RIM_INNER_R) * 0.5, H),
    new THREE.Vector2(RIM_INNER_R, H - 0.005),
    new THREE.Vector2(RIM_INNER_R - 0.002, H * 0.72),
    new THREE.Vector2(RIM_INNER_R + 0.006, H * 0.35),
    new THREE.Vector2(0.032, 0.02),
    new THREE.Vector2(0, 0.02)
  ];

  const bodyGeo = new THREE.LatheGeometry(points, SEGMENTS);
  bodyGeo.computeVertexNormals();
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'vase_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Dark interior floor disc for deep shadow look
  const innerFloorGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.004, SEGMENTS);
  const innerFloorMesh = new THREE.Mesh(innerFloorGeo, innerMat);
  innerFloorMesh.name = 'vase_inner_floor';
  innerFloorMesh.position.y = 0.022;
  innerFloorMesh.castShadow = true;
  innerFloorMesh.receiveShadow = true;
  group.add(innerFloorMesh);

  // Base foot pad touching y = 0
  const footGeo = new THREE.CylinderGeometry(BASE_R * 0.86, BASE_R * 0.84, FOOT_H, SEGMENTS);
  const footMesh = new THREE.Mesh(footGeo, footMat);
  footMesh.name = 'vase_foot_pad';
  footMesh.position.y = FOOT_H * 0.5;
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  return group;
}
