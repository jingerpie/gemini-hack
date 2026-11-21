function build(THREE) {
  const group = new THREE.Group();

  const H = 0.28;
  const BODY_R = 0.07;
  const BASE_R = 0.052;
  const NECK_MIN_R = 0.029;
  const RIM_R = 0.039;
  const WALL_T = 0.004;
  const BASE_T = 0.022;
  const SHOULDER_Y = 0.168;
  const NECK_Y = 0.205;
  const FLUTE_COUNT = 18;
  const FLUTE_R = 0.0028;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeae6df,
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide
  });

  // Main vase body (outer + inner profile via LatheGeometry)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R * 0.85, 0.0),
    new THREE.Vector2(BASE_R, 0.004),
    new THREE.Vector2(BODY_R * 0.94, 0.016),
    new THREE.Vector2(BODY_R, 0.032),
    new THREE.Vector2(BODY_R, SHOULDER_Y),
    new THREE.Vector2(BODY_R * 0.86, SHOULDER_Y + 0.016),
    new THREE.Vector2(NECK_MIN_R + 0.008, NECK_Y - 0.01),
    new THREE.Vector2(NECK_MIN_R, NECK_Y),
    new THREE.Vector2(NECK_MIN_R + 0.002, NECK_Y + 0.025),
    new THREE.Vector2(RIM_R - 0.002, H - 0.012),
    new THREE.Vector2(RIM_R, H),
    new THREE.Vector2(RIM_R - WALL_T, H),
    new THREE.Vector2(RIM_R - WALL_T - 0.002, H - 0.012),
    new THREE.Vector2(NECK_MIN_R - WALL_T + 0.002, NECK_Y + 0.025),
    new THREE.Vector2(NECK_MIN_R - WALL_T, NECK_Y),
    new THREE.Vector2(BODY_R - WALL_T, SHOULDER_Y - 0.002),
    new THREE.Vector2(BODY_R - WALL_T, BASE_T + 0.012),
    new THREE.Vector2(BASE_R * 0.85, BASE_T),
    new THREE.Vector2(0.0, BASE_T)
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, glassMat);
  bodyMesh.name = 'vase_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Top rim torus for a clean thickened glass lip
  const rimGeo = new THREE.TorusGeometry(RIM_R - WALL_T * 0.5, WALL_T * 0.55, 10, 32);
  const rimMesh = new THREE.Mesh(rimGeo, glassMat);
  rimMesh.name = 'vase_rim';
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = H;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Vertical flutes along the cylindrical body and shoulder
  const fluteCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BODY_R * 0.94, 0.018, 0),
    new THREE.Vector3(BODY_R, 0.034, 0),
    new THREE.Vector3(BODY_R, SHOULDER_Y, 0),
    new THREE.Vector3(BODY_R * 0.85, SHOULDER_Y + 0.016, 0),
    new THREE.Vector3(NECK_MIN_R + 0.007, NECK_Y - 0.008, 0)
  ]);
  const fluteGeo = new THREE.TubeGeometry(fluteCurve, 16, FLUTE_R, 6, false);

  for (let i = 0; i < FLUTE_COUNT; i++) {
    const angle = (i / FLUTE_COUNT) * Math.PI * 2;
    const fluteMesh = new THREE.Mesh(fluteGeo, glassMat);
    fluteMesh.name = `vase_flute_${i + 1}`;
    fluteMesh.rotation.y = angle;
    fluteMesh.castShadow = true;
    fluteMesh.receiveShadow = true;
    group.add(fluteMesh);
  }

  return group;
}
