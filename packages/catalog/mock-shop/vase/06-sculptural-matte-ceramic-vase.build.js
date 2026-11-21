function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.34;
  const BASE_R = 0.048;
  const BELLY_R = 0.095;
  const BASE_H = 0.135;

  // Materials (matte ceramic)
  const matTaupe = new THREE.MeshStandardMaterial({
    color: 0xa69a8d,
    roughness: 0.88,
    metalness: 0.02
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6e0d3,
    roughness: 0.85,
    metalness: 0.02
  });
  const matGrey = new THREE.MeshStandardMaterial({
    color: 0xbcb8b2,
    roughness: 0.88,
    metalness: 0.02
  });
  const matWarmBrown = new THREE.MeshStandardMaterial({
    color: 0x948371,
    roughness: 0.88,
    metalness: 0.02
  });
  const matLine = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.75,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bulbous base (LatheGeometry)
  const basePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R + 0.014, 0.018),
    new THREE.Vector2(0.082, 0.050),
    new THREE.Vector2(BELLY_R, 0.082),
    new THREE.Vector2(0.086, 0.112),
    new THREE.Vector2(0.060, BASE_H),
    new THREE.Vector2(0.0, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePts, 32);
  addMesh(baseGeo, matTaupe, "base_body");

  // 2. Lower-middle lobes
  const lobeGeo = new THREE.SphereGeometry(0.048, 24, 18);
  addMesh(lobeGeo, matGrey, "mid_lower_left_lobe", [-0.032, 0.158, 0.0], [0, 0, 0.25], [1.08, 0.82, 0.95]);
  addMesh(lobeGeo, matCream, "mid_lower_right_lobe", [0.030, 0.156, 0.004], [0, 0, -0.22], [1.08, 0.82, 0.95]);

  // 3. Upper-middle lobes
  const upperLobeGeo = new THREE.SphereGeometry(0.036, 24, 18);
  addMesh(upperLobeGeo, matCream, "mid_upper_left_lobe", [-0.024, 0.214, 0.0], [0, 0, 0.18], [1.05, 0.78, 0.92]);
  addMesh(upperLobeGeo, matGrey, "mid_upper_right_lobe", [0.024, 0.212, 0.0], [0, 0, -0.18], [1.0, 0.76, 0.92]);

  // 4. Neck core connecting middle lobes to top flared mouth
  const neckGeo = new THREE.CylinderGeometry(0.046, 0.032, 0.055, 24);
  addMesh(neckGeo, matWarmBrown, "neck_core", [0, 0.252, 0]);

  // 5. Top flared tulip-like wings (left & right)
  const wingPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.028, 0.0),
    new THREE.Vector2(0.046, 0.030),
    new THREE.Vector2(0.054, 0.068),
    new THREE.Vector2(0.050, 0.088),
    new THREE.Vector2(0.042, 0.090),
    new THREE.Vector2(0.036, 0.050),
    new THREE.Vector2(0.018, 0.015),
    new THREE.Vector2(0.0, 0.015)
  ];
  const wingGeo = new THREE.LatheGeometry(wingPts, 24);
  addMesh(wingGeo, matCream, "top_left_wing", [-0.024, 0.252, 0], [0, 0, 0.18], [0.95, 1.0, 0.85]);
  addMesh(wingGeo, matCream, "top_right_wing", [0.024, 0.252, 0], [0, 0, -0.18], [0.95, 1.0, 0.85]);

  // 6. Dark inlaid graphic seam lines (TubeGeometry)
  function addLineCurve(points, name, radius) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 24, radius || 0.0018, 8, false);
    addMesh(tubeGeo, matLine, name);
  }

  // Seam between base and lower lobes (front & back)
  addLineCurve([
    [-0.062, 0.128, 0.032],
    [-0.030, 0.132, 0.046],
    [0.0, 0.142, 0.045],
    [0.032, 0.132, 0.046],
    [0.062, 0.128, 0.032]
  ], "seam_base_front", 0.0018);

  // Vertical center seam between left and right lobes
  addLineCurve([
    [0.0, 0.142, 0.045],
    [-0.006, 0.172, 0.044],
    [0.005, 0.200, 0.040],
    [-0.002, 0.232, 0.034]
  ], "seam_vertical_front", 0.0018);

  // Seam between lower and upper lobes (left)
  addLineCurve([
    [-0.078, 0.156, 0.015],
    [-0.048, 0.182, 0.038],
    [-0.006, 0.188, 0.042]
  ], "seam_mid_left_front", 0.0018);

  // Seam between lower and upper lobes (right)
  addLineCurve([
    [0.076, 0.154, 0.015],
    [0.046, 0.182, 0.038],
    [0.005, 0.188, 0.042]
  ], "seam_mid_right_front", 0.0018);

  // Seam below top wings
  addLineCurve([
    [-0.056, 0.218, 0.018],
    [-0.026, 0.236, 0.032],
    [0.0, 0.232, 0.034],
    [0.026, 0.236, 0.032],
    [0.056, 0.218, 0.018]
  ], "seam_neck_front", 0.0018);

  // Top rim black edge (front V-dip)
  addLineCurve([
    [-0.072, H - 0.004, 0.0],
    [-0.048, H - 0.008, 0.030],
    [-0.020, H - 0.024, 0.034],
    [0.0, H - 0.036, 0.028],
    [0.020, H - 0.024, 0.034],
    [0.048, H - 0.008, 0.030],
    [0.072, H - 0.004, 0.0]
  ], "rim_line_front", 0.0016);

  // Top rim black edge (back V-dip)
  addLineCurve([
    [-0.072, H - 0.004, 0.0],
    [-0.048, H - 0.008, -0.030],
    [-0.020, H - 0.024, -0.034],
    [0.0, H - 0.036, -0.028],
    [0.020, H - 0.024, -0.034],
    [0.048, H - 0.008, -0.030],
    [0.072, H - 0.004, 0.0]
  ], "rim_line_back", 0.0016);

  return group;
}
