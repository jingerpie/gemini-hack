function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.32;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.045;
  const RIM_THICKNESS = 0.016;
  const BASE_THICKNESS = 0.014;
  const INNER_RADIUS = RADIUS - RIM_THICKNESS;
  const SEGMENTS = 32;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb6793c,
    roughness: 0.48,
    metalness: 0.02
  });

  const knotDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2313,
    roughness: 0.65,
    metalness: 0.0
  });

  const knotMidMat = new THREE.MeshStandardMaterial({
    color: 0x6b4223,
    roughness: 0.58,
    metalness: 0.0
  });

  // Lathe profile for the turned wooden tray
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS - 0.012, 0),
    new THREE.Vector2(RADIUS - 0.004, 0.004),
    new THREE.Vector2(RADIUS, 0.012),
    new THREE.Vector2(RADIUS, HEIGHT - 0.006),
    new THREE.Vector2(RADIUS - 0.003, HEIGHT - 0.0015),
    new THREE.Vector2(RADIUS - RIM_THICKNESS * 0.5, HEIGHT),
    new THREE.Vector2(INNER_RADIUS + 0.003, HEIGHT - 0.0015),
    new THREE.Vector2(INNER_RADIUS, HEIGHT - 0.006),
    new THREE.Vector2(INNER_RADIUS - 0.002, BASE_THICKNESS + 0.008),
    new THREE.Vector2(INNER_RADIUS - 0.008, BASE_THICKNESS + 0.002),
    new THREE.Vector2(INNER_RADIUS - 0.016, BASE_THICKNESS),
    new THREE.Vector2(0, BASE_THICKNESS)
  ];

  const trayGeo = new THREE.LatheGeometry(points, SEGMENTS);
  const trayMesh = new THREE.Mesh(trayGeo, woodMat);
  trayMesh.name = 'tray_body';
  trayMesh.castShadow = true;
  trayMesh.receiveShadow = true;
  group.add(trayMesh);

  // Subtle rustic wood knot on the interior floor
  const KNOT_X = -0.058;
  const KNOT_Z = 0.068;

  const knotOuterGeo = new THREE.CylinderGeometry(0.012, 0.013, 0.0012, 20);
  const knotOuter = new THREE.Mesh(knotOuterGeo, knotMidMat);
  knotOuter.name = 'wood_knot_outer';
  knotOuter.position.set(KNOT_X, BASE_THICKNESS + 0.0002, KNOT_Z);
  knotOuter.scale.set(1.15, 1, 0.9);
  knotOuter.rotation.y = 0.4;
  knotOuter.castShadow = true;
  knotOuter.receiveShadow = true;
  group.add(knotOuter);

  const knotInnerGeo = new THREE.CylinderGeometry(0.0065, 0.007, 0.0014, 16);
  const knotInner = new THREE.Mesh(knotInnerGeo, knotDarkMat);
  knotInner.name = 'wood_knot_inner';
  knotInner.position.set(KNOT_X + 0.001, BASE_THICKNESS + 0.0003, KNOT_Z);
  knotInner.scale.set(0.85, 1, 1.1);
  knotInner.rotation.y = 0.2;
  knotInner.castShadow = true;
  knotInner.receiveShadow = true;
  group.add(knotInner);

  return group;
}
