function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.28;
  const MAX_R = 0.082;
  const FOOT_R = 0.048;
  const NECK_R = 0.036;
  const RIM_R = 0.053;
  const WALL_T = 0.006;

  // Materials
  const celadonMat = new THREE.MeshPhysicalMaterial({
    color: 0x6f9776,
    roughness: 0.22,
    metalness: 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });

  const coralMat = new THREE.MeshPhysicalMaterial({
    color: 0xc46743,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });

  const ochreMat = new THREE.MeshPhysicalMaterial({
    color: 0xc4a03a,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });

  const blueLeafMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b5784,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
  });

  const stamenMat = new THREE.MeshStandardMaterial({
    color: 0xd1c154,
    roughness: 0.45,
    metalness: 0.0,
  });

  // Main vase body via LatheGeometry (outer profile + rim + inner neck)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FOOT_R * 0.92, 0.0),
    new THREE.Vector2(FOOT_R, 0.008),
    new THREE.Vector2(FOOT_R * 0.98, 0.016),
    new THREE.Vector2(FOOT_R * 0.88, 0.024),
    new THREE.Vector2(FOOT_R * 0.91, 0.032),
    new THREE.Vector2(0.052, 0.055),
    new THREE.Vector2(0.068, 0.095),
    new THREE.Vector2(0.079, 0.138),
    new THREE.Vector2(MAX_R, 0.172),
    new THREE.Vector2(0.075, 0.198),
    new THREE.Vector2(0.055, 0.214),
    new THREE.Vector2(0.042, 0.222),
    new THREE.Vector2(NECK_R, 0.242),
    new THREE.Vector2(0.041, 0.262),
    new THREE.Vector2(RIM_R, 0.274),
    new THREE.Vector2(RIM_R * 0.98, H),
    new THREE.Vector2(RIM_R - WALL_T, H),
    new THREE.Vector2(NECK_R - WALL_T * 0.6, 0.242),
    new THREE.Vector2(0.028, 0.205),
    new THREE.Vector2(0.0, 0.205),
  ];

  const vaseGeo = new THREE.LatheGeometry(profile, 32);
  const vaseMesh = new THREE.Mesh(vaseGeo, celadonMat);
  vaseMesh.name = "vase_body";
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Helper to place relief floral accents embedded on the vase surface
  function addReliefCluster(name, radius, y, angle, mat, scaleX, scaleY, scaleZ) {
    const geo = new THREE.SphereGeometry(1, 14, 10);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.scale.set(scaleX, scaleY, scaleZ);
    mesh.position.set(
      Math.sin(angle) * radius,
      y,
      Math.cos(angle) * radius
    );
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Front peony blossom (coral petals + yellow stamen center)
  addReliefCluster("front_peony_blossom", MAX_R * 0.97, 0.135, 0.08, coralMat, 0.026, 0.024, 0.007);
  addReliefCluster("front_peony_center", MAX_R * 0.99, 0.138, 0.08, stamenMat, 0.008, 0.007, 0.005);

  // Side & back peony blossoms
  addReliefCluster("left_peony_blossom", MAX_R * 0.96, 0.132, -1.65, coralMat, 0.024, 0.022, 0.007);
  addReliefCluster("right_peony_blossom", MAX_R * 0.96, 0.132, 1.75, coralMat, 0.024, 0.022, 0.007);
  addReliefCluster("back_peony_blossom", MAX_R * 0.96, 0.136, Math.PI, coralMat, 0.025, 0.023, 0.007);

  // Neck peony blossom (front)
  addReliefCluster("neck_peony_blossom", NECK_R * 0.98, 0.244, 0.0, coralMat, 0.017, 0.016, 0.005);
  addReliefCluster("neck_peony_center", NECK_R * 1.01, 0.246, 0.0, stamenMat, 0.005, 0.005, 0.004);

  // Yellow-ochre upper shoulder flowers
  addReliefCluster("ochre_flower_left", 0.068, 0.194, -0.45, ochreMat, 0.015, 0.012, 0.006);
  addReliefCluster("ochre_flower_right", 0.068, 0.194, 0.48, ochreMat, 0.015, 0.012, 0.006);
  addReliefCluster("ochre_leaf_mid", MAX_R * 0.96, 0.168, -0.08, ochreMat, 0.011, 0.016, 0.005);

  // Slate-blue accent leaves
  addReliefCluster("blue_leaf_lower_left", 0.064, 0.078, -0.42, blueLeafMat, 0.014, 0.011, 0.005);
  addReliefCluster("blue_leaf_lower_right", 0.064, 0.078, 0.22, blueLeafMat, 0.014, 0.011, 0.005);
  addReliefCluster("blue_leaf_mid_left", MAX_R * 0.97, 0.135, -0.65, blueLeafMat, 0.012, 0.016, 0.005);
  addReliefCluster("blue_leaf_mid_right", MAX_R * 0.97, 0.138, 0.85, blueLeafMat, 0.012, 0.016, 0.005);
  addReliefCluster("blue_leaf_shoulder", 0.062, 0.204, 0.02, blueLeafMat, 0.013, 0.008, 0.005);

  return group;
}
