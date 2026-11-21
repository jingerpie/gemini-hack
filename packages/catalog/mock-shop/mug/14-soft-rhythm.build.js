function build(THREE) {
  const group = new THREE.Group();

  const H = 0.095;
  const R = 0.042;
  const FOOT_R = 0.035;
  const FOOT_H = 0.007;
  const WALL = 0.0045;
  const RIM_H = 0.011;
  const LOWER_BAND_H = 0.012;
  const RIB_H = H - FOOT_H - LOWER_BAND_H - RIM_H;
  const RIB_COUNT = 36;
  const RIB_DEPTH = 0.0014;
  const HANDLE_EXT = 0.031;
  const HANDLE_R = 0.0052;
  const CENTER_OFFSET_X = -HANDLE_EXT * 0.5;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x9c8e82,
    roughness: 0.46,
    metalness: 0.04,
  });

  // Main mug body (foot, lower smooth band, core behind ribs, smooth rim, hollow interior)
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FOOT_R - 0.002, 0),
    new THREE.Vector2(FOOT_R, 0.002),
    new THREE.Vector2(FOOT_R, FOOT_H),
    new THREE.Vector2(R - 0.002, FOOT_H + 0.002),
    new THREE.Vector2(R, FOOT_H + LOWER_BAND_H),
    new THREE.Vector2(R - 0.0005, FOOT_H + LOWER_BAND_H + 0.001),
    new THREE.Vector2(R - 0.0005, H - RIM_H - 0.001),
    new THREE.Vector2(R, H - RIM_H),
    new THREE.Vector2(R + 0.0008, H - 0.003),
    new THREE.Vector2(R - WALL * 0.45, H),
    new THREE.Vector2(R - WALL, H - 0.003),
    new THREE.Vector2(R - WALL, FOOT_H + 0.006),
    new THREE.Vector2(R - WALL - 0.004, FOOT_H + 0.003),
    new THREE.Vector2(0, FOOT_H + 0.003),
  ];

  const bodyGeo = new THREE.LatheGeometry(pts, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.position.x = CENTER_OFFSET_X;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Vertical ribbed band around the middle
  const ribShape = new THREE.Shape();
  const steps = RIB_COUNT * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wave = 0.5 + 0.5 * Math.cos(a * RIB_COUNT);
    const rad = R - 0.0004 + wave * RIB_DEPTH;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ribShape.moveTo(x, y);
    else ribShape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const x = Math.cos(a) * (R - WALL * 0.5);
    const y = Math.sin(a) * (R - WALL * 0.5);
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  ribShape.holes.push(hole);

  const ribGeo = new THREE.ExtrudeGeometry(ribShape, {
    depth: RIB_H - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0006,
    bevelSegments: 2,
    curveSegments: 1,
  });
  ribGeo.rotateX(-Math.PI / 2);

  const ribMesh = new THREE.Mesh(ribGeo, ceramicMat);
  ribMesh.name = 'mug_ribs';
  ribMesh.position.set(CENTER_OFFSET_X, FOOT_H + LOWER_BAND_H + 0.002, 0);
  ribMesh.castShadow = true;
  ribMesh.receiveShadow = true;
  group.add(ribMesh);

  // D-shaped ceramic handle on +X
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R - 0.003, H * 0.77, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.55, H * 0.79, 0),
    new THREE.Vector3(R + HANDLE_EXT, H * 0.65, 0),
    new THREE.Vector3(R + HANDLE_EXT, H * 0.36, 0),
    new THREE.Vector3(R + HANDLE_EXT * 0.55, H * 0.22, 0),
    new THREE.Vector3(R - 0.003, H * 0.23, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_R, 14, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'mug_handle';
  handleMesh.position.x = CENTER_OFFSET_X;
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
