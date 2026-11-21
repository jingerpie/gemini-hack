function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.34;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.025;
  const BASE_THICKNESS = 0.008;
  const RIM_THICKNESS = 0.009;
  const INNER_RADIUS = RADIUS - RIM_THICKNESS;
  const SEGMENTS = 32;

  const blackResinMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0c,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  });

  const goldVeinMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.32,
    metalness: 0.8
  });

  // Main tray body using LatheGeometry
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS - 0.004, 0),
    new THREE.Vector2(RADIUS, 0.004),
    new THREE.Vector2(RADIUS, HEIGHT - 0.004),
    new THREE.Vector2(RADIUS - 0.002, HEIGHT),
    new THREE.Vector2(INNER_RADIUS + 0.002, HEIGHT),
    new THREE.Vector2(INNER_RADIUS, HEIGHT - 0.004),
    new THREE.Vector2(INNER_RADIUS, BASE_THICKNESS + 0.002),
    new THREE.Vector2(INNER_RADIUS - 0.004, BASE_THICKNESS),
    new THREE.Vector2(0, BASE_THICKNESS)
  ];

  const trayGeo = new THREE.LatheGeometry(profile, SEGMENTS);
  const trayMesh = new THREE.Mesh(trayGeo, blackResinMat);
  trayMesh.name = 'tray_body';
  trayMesh.castShadow = true;
  trayMesh.receiveShadow = true;
  group.add(trayMesh);

  // Subtle gold rim accent arc
  const rimAccentGeo = new THREE.TorusGeometry(RADIUS - 0.0045, 0.0018, 8, SEGMENTS, Math.PI * 0.75);
  const rimAccent = new THREE.Mesh(rimAccentGeo, goldVeinMat);
  rimAccent.name = 'gold_rim_accent';
  rimAccent.rotation.x = Math.PI / 2;
  rimAccent.rotation.z = 0.4;
  rimAccent.position.y = HEIGHT - 0.0008;
  rimAccent.castShadow = true;
  rimAccent.receiveShadow = true;
  group.add(rimAccent);

  // Helper to create organic gold marbling veins on the tray floor
  const veinY = BASE_THICKNESS + 0.0004;
  function addGoldVein(name, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], veinY, p[1]))
    );
    const geo = new THREE.TubeGeometry(curve, 24, radius, 6, false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.scale.set(1, 0.25, 1);
    mesh.position.y = veinY * 0.75;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Primary upper gold swirl band
  addGoldVein('gold_vein_upper_main', [
    [-0.145, -0.02],
    [-0.08, -0.005],
    [-0.01, -0.015],
    [0.06, -0.055],
    [0.135, -0.075]
  ], 0.009, goldVeinMat);

  // Secondary upper gold branch
  addGoldVein('gold_vein_upper_branch', [
    [-0.12, -0.06],
    [-0.05, -0.045],
    [0.02, -0.065],
    [0.09, -0.105]
  ], 0.0045, goldAccentMat);

  // Thin upper wisp
  addGoldVein('gold_vein_upper_wisp', [
    [-0.04, -0.085],
    [0.01, -0.095],
    [0.065, -0.125]
  ], 0.0022, goldVeinMat);

  // Lower primary gold swirl band
  addGoldVein('gold_vein_lower_main', [
    [-0.09, 0.125],
    [-0.02, 0.095],
    [0.05, 0.055],
    [0.12, 0.065],
    [0.148, 0.045]
  ], 0.0085, goldVeinMat);

  // Mid-lower thin vein
  addGoldVein('gold_vein_mid_thin', [
    [-0.14, 0.025],
    [-0.06, 0.045],
    [0.02, 0.025],
    [0.09, -0.005],
    [0.145, 0.005]
  ], 0.003, goldAccentMat);

  // Lower fine branch
  addGoldVein('gold_vein_lower_branch', [
    [-0.03, 0.145],
    [0.04, 0.115],
    [0.105, 0.095]
  ], 0.0028, goldVeinMat);

  return group;
}
