function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - realistic espresso cup
  const H = 0.074;
  const R_FOOT = 0.024;
  const R_BELLY = 0.032;
  const R_TOP = 0.038;
  const WALL = 0.004;
  const FOOT_H = 0.008;
  const HANDLE_EXTENT = 0.026;
  const HANDLE_R = 0.0042;

  // Materials
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc8216,
    roughness: 0.36,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35
  });

  const paintMat = new THREE.MeshStandardMaterial({
    color: 0xf2de9b,
    roughness: 0.55,
    metalness: 0.0
  });

  // Cup body via LatheGeometry (outer profile -> rim -> inner profile -> inner bottom)
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_FOOT - 0.001, 0),
    new THREE.Vector2(R_FOOT, 0.002),
    new THREE.Vector2(R_FOOT + 0.001, FOOT_H),
    new THREE.Vector2(R_BELLY, FOOT_H + 0.008),
    new THREE.Vector2(R_BELLY + 0.003, H * 0.45),
    new THREE.Vector2(R_TOP - 0.001, H - 0.006),
    new THREE.Vector2(R_TOP, H - 0.002),
    new THREE.Vector2(R_TOP - WALL * 0.5, H),
    new THREE.Vector2(R_TOP - WALL, H - 0.002),
    new THREE.Vector2(R_TOP - WALL - 0.001, H - 0.008),
    new THREE.Vector2(R_BELLY - WALL + 0.001, H * 0.45),
    new THREE.Vector2(R_BELLY - WALL - 0.002, FOOT_H + 0.008),
    new THREE.Vector2(R_FOOT - WALL, FOOT_H + 0.002),
    new THREE.Vector2(0, FOOT_H + 0.002)
  ];

  const bodyGeo = new THREE.LatheGeometry(pts, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'cup_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R_TOP - 0.004, H * 0.78, 0),
    new THREE.Vector3(R_TOP + HANDLE_EXTENT * 0.65, H * 0.80, 0),
    new THREE.Vector3(R_TOP + HANDLE_EXTENT, H * 0.56, 0),
    new THREE.Vector3(R_TOP + HANDLE_EXTENT * 0.65, H * 0.34, 0),
    new THREE.Vector3(R_BELLY + 0.001, H * 0.34, 0)
  ]);

  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_R, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'cup_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // Rising sun motif on +Z front face
  const sunCenterY = FOOT_H + 0.009;
  const sunGeo = new THREE.SphereGeometry(0.012, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  sunGeo.scale(1.15, 0.85, 0.25);
  const sunMesh = new THREE.Mesh(sunGeo, paintMat);
  sunMesh.name = 'sun_dome';
  sunMesh.position.set(0, sunCenterY, R_BELLY + 0.0005);
  sunMesh.rotation.x = -0.12;
  sunMesh.castShadow = true;
  sunMesh.receiveShadow = true;
  group.add(sunMesh);

  // Radiating sun rays
  const rayCount = 11;
  const rayGeo = new THREE.CapsuleGeometry(0.0011, 0.017, 4, 8);
  for (let i = 0; i < rayCount; i++) {
    const t = i / (rayCount - 1);
    const angle = (t - 0.5) * Math.PI * 0.82;
    const distFromSun = 0.021;
    const rx = Math.sin(angle) * distFromSun;
    const ry = sunCenterY + Math.cos(angle) * distFromSun;

    // Follow cup curvature along X
    const cupRadiusAtY = R_BELLY + (ry / H) * (R_TOP - R_BELLY) * 0.7;
    const rz = Math.sqrt(Math.max(0.0001, cupRadiusAtY * cupRadiusAtY - rx * rx)) + 0.0006;

    const rayMesh = new THREE.Mesh(rayGeo, paintMat);
    rayMesh.name = 'sun_ray_' + (i + 1);
    rayMesh.position.set(rx, ry, rz);
    rayMesh.rotation.z = -angle;
    rayMesh.rotation.y = Math.atan2(rx, rz);
    rayMesh.rotation.x = -0.14;
    rayMesh.castShadow = true;
    rayMesh.receiveShadow = true;
    group.add(rayMesh);
  }

  return group;
}
