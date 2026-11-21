function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.24;
  const MAX_R = 0.088;
  const BASE_R = 0.042;
  const NECK_R = 0.036;
  const NECK_BASE_Y = 0.202;
  const RIM_THICK = 0.0045;
  const RIB_COUNT = 20;
  const RIB_R = 0.0085;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xd1ab90,
    roughness: 0.72,
    metalness: 0.02,
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x9c7b65,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Profile points for the core vase body (from bottom center, up outer wall, over rim, into inner cavity)
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R + 0.015, 0.014),
    new THREE.Vector2(MAX_R * 0.82, 0.045),
    new THREE.Vector2(MAX_R * 0.97, 0.085),
    new THREE.Vector2(MAX_R, 0.112),
    new THREE.Vector2(MAX_R * 0.95, 0.145),
    new THREE.Vector2(MAX_R * 0.78, 0.175),
    new THREE.Vector2(NECK_R + 0.007, 0.194),
    new THREE.Vector2(NECK_R + 0.002, NECK_BASE_Y),
    new THREE.Vector2(NECK_R, H - 0.004),
    new THREE.Vector2(NECK_R - RIM_THICK * 0.5, H),
    new THREE.Vector2(NECK_R - RIM_THICK, H - 0.003),
    new THREE.Vector2(NECK_R - RIM_THICK, NECK_BASE_Y),
    new THREE.Vector2(0.0, NECK_BASE_Y - 0.02),
  ];

  const coreGeo = new THREE.LatheGeometry(profilePoints, 32);
  const coreMesh = new THREE.Mesh(coreGeo, ceramicMat);
  coreMesh.name = 'vase_core_body';
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // Darkened inner cavity disc for depth
  const cavityGeo = new THREE.CylinderGeometry(NECK_R - RIM_THICK, NECK_R - RIM_THICK * 1.4, 0.03, 24);
  const cavityMesh = new THREE.Mesh(cavityGeo, innerMat);
  cavityMesh.name = 'vase_inner_cavity';
  cavityMesh.position.y = H - 0.022;
  cavityMesh.castShadow = true;
  cavityMesh.receiveShadow = true;
  group.add(cavityMesh);

  // Smooth rim torus
  const rimGeo = new THREE.TorusGeometry(NECK_R - RIM_THICK * 0.5, RIM_THICK * 0.65, 12, 32);
  const rimMesh = new THREE.Mesh(rimGeo, ceramicMat);
  rimMesh.name = 'vase_rim';
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = H - RIM_THICK * 0.4;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Vertical ribs following the outer silhouette
  const ribCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(BASE_R - 0.001, 0.004, 0),
    new THREE.Vector3(BASE_R + 0.015, 0.015, 0),
    new THREE.Vector3(MAX_R * 0.82, 0.045, 0),
    new THREE.Vector3(MAX_R * 0.97, 0.085, 0),
    new THREE.Vector3(MAX_R, 0.112, 0),
    new THREE.Vector3(MAX_R * 0.95, 0.145, 0),
    new THREE.Vector3(MAX_R * 0.78, 0.175, 0),
    new THREE.Vector3(NECK_R + 0.006, 0.194, 0),
    new THREE.Vector3(NECK_R + 0.001, NECK_BASE_Y, 0),
    new THREE.Vector3(NECK_R - 0.001, H - 0.005, 0),
  ]);

  const ribGeo = new THREE.TubeGeometry(ribCurve, 28, RIB_R, 10, false);

  for (let i = 0; i < RIB_COUNT; i++) {
    const angle = (i / RIB_COUNT) * Math.PI * 2;
    const ribMesh = new THREE.Mesh(ribGeo, ceramicMat);
    ribMesh.name = `vase_rib_${i + 1}`;
    ribMesh.rotation.y = angle;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  }

  return group;
}
