function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.095;
  const R_OUT = 0.041;
  const WALL = 0.004;
  const R_IN = R_OUT - WALL;
  const BASE_T = 0.006;
  const HANDLE_EXT = 0.032;
  const HANDLE_R = 0.0065;

  // Materials
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbc00e,
    roughness: 0.15,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  const blueLogoMat = new THREE.MeshStandardMaterial({
    color: 0x00479d,
    roughness: 0.25,
    metalness: 0.0,
  });

  const redLogoMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    roughness: 0.25,
    metalness: 0.0,
  });

  // 1. Mug Body (LatheGeometry)
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_OUT - 0.004, 0),
    new THREE.Vector2(R_OUT - 0.001, 0.0015),
    new THREE.Vector2(R_OUT, 0.005),
    new THREE.Vector2(R_OUT, H - 0.003),
    new THREE.Vector2(R_OUT - 0.001, H - 0.0008),
    new THREE.Vector2(R_OUT - WALL * 0.5, H),
    new THREE.Vector2(R_IN + 0.001, H - 0.0008),
    new THREE.Vector2(R_IN, H - 0.003),
    new THREE.Vector2(R_IN, BASE_T + 0.004),
    new THREE.Vector2(R_IN - 0.004, BASE_T),
    new THREE.Vector2(0, BASE_T),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Mug Handle (TubeGeometry)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R_OUT - 0.003, H * 0.78, 0),
    new THREE.Vector3(R_OUT + HANDLE_EXT * 0.5, H * 0.82, 0),
    new THREE.Vector3(R_OUT + HANDLE_EXT, H * 0.52, 0),
    new THREE.Vector3(R_OUT + HANDLE_EXT * 0.5, H * 0.22, 0),
    new THREE.Vector3(R_OUT - 0.003, H * 0.26, 0),
  ]);

  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, HANDLE_R, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'mug_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // 3. Front Logo ("m" arch + streaks)
  const logoZ = R_OUT - 0.0004;
  const logoDepth = 0.0012;

  // "m" left, center, right pillars
  const pillarGeo = new THREE.BoxGeometry(0.0045, 0.015, logoDepth);
  const pillarX = [-0.011, 0.0, 0.011];
  pillarX.forEach((px, idx) => {
    const pillar = new THREE.Mesh(pillarGeo, blueLogoMat);
    pillar.name = `logo_pillar_${idx + 1}`;
    pillar.position.set(px, 0.032, logoZ);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // "m" top bar
  const topBarGeo = new THREE.BoxGeometry(0.0265, 0.0045, logoDepth);
  const topBar = new THREE.Mesh(topBarGeo, blueLogoMat);
  topBar.name = 'logo_top_bar';
  topBar.position.set(0, 0.041, logoZ);
  topBar.castShadow = true;
  topBar.receiveShadow = true;
  group.add(topBar);

  // Diagonal blue streak
  const streakBlueGeo = new THREE.BoxGeometry(0.012, 0.0022, logoDepth);
  const streakBlue = new THREE.Mesh(streakBlueGeo, blueLogoMat);
  streakBlue.name = 'logo_streak_blue';
  streakBlue.position.set(0.018, 0.047, logoZ - 0.0015);
  streakBlue.rotation.z = Math.PI * 0.25;
  streakBlue.rotation.y = 0.35;
  streakBlue.castShadow = true;
  streakBlue.receiveShadow = true;
  group.add(streakBlue);

  // Diagonal red streak
  const streakRedGeo = new THREE.BoxGeometry(0.012, 0.0022, logoDepth);
  const streakRed = new THREE.Mesh(streakRedGeo, redLogoMat);
  streakRed.name = 'logo_streak_red';
  streakRed.position.set(0.0195, 0.0435, logoZ - 0.002);
  streakRed.rotation.z = Math.PI * 0.25;
  streakRed.rotation.y = 0.38;
  streakRed.castShadow = true;
  streakRed.receiveShadow = true;
  group.add(streakRed);

  return group;
}
