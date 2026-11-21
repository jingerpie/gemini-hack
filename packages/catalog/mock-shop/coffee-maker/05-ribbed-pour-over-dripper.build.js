function build(THREE) {
  const group = new THREE.Group();

  const TOP_R = 0.060;
  const SAUCER_R = 0.052;
  const CONE_BASE_R = 0.024;
  const FOOT_R = 0.032;
  const HOLE_R = 0.012;
  const H = 0.100;
  const SAUCER_H = 0.012;
  const NUM_RIBS = 20;
  const RIB_R = 0.0014;
  const HANDLE_R = 0.0038;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xbcc4ba,
    roughness: 0.36,
    metalness: 0.04
  });

  // Main dripper body (foot, saucer, cone, rim, inner wall)
  const profile = [
    new THREE.Vector2(HOLE_R, 0.003),
    new THREE.Vector2(FOOT_R - 0.004, 0.003),
    new THREE.Vector2(FOOT_R - 0.002, 0.000),
    new THREE.Vector2(FOOT_R + 0.002, 0.000),
    new THREE.Vector2(FOOT_R + 0.006, 0.004),
    new THREE.Vector2(SAUCER_R - 0.002, 0.007),
    new THREE.Vector2(SAUCER_R, 0.010),
    new THREE.Vector2(SAUCER_R - 0.002, SAUCER_H + 0.001),
    new THREE.Vector2(CONE_BASE_R + 0.005, SAUCER_H + 0.004),
    new THREE.Vector2(CONE_BASE_R, 0.022),
    new THREE.Vector2(TOP_R - 0.002, H - 0.004),
    new THREE.Vector2(TOP_R, H - 0.001),
    new THREE.Vector2(TOP_R - 0.002, H),
    new THREE.Vector2(TOP_R - 0.005, H),
    new THREE.Vector2(TOP_R - 0.007, H - 0.004),
    new THREE.Vector2(CONE_BASE_R - 0.004, 0.020),
    new THREE.Vector2(HOLE_R, 0.010),
    new THREE.Vector2(HOLE_R, 0.003)
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'dripper_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Inner spiral ribs
  const ribTopY = H - 0.007;
  const ribBotY = 0.024;
  const ribTopR = TOP_R - 0.0075;
  const ribBotR = CONE_BASE_R - 0.004;

  for (let i = 0; i < NUM_RIBS; i++) {
    const baseAngle = (i / NUM_RIBS) * Math.PI * 2;
    const pts = [];
    const steps = 6;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const y = ribTopY - t * (ribTopY - ribBotY);
      const r = ribTopR - t * (ribTopR - ribBotR);
      const angle = baseAngle + t * 0.65;
      pts.push(new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const ribGeo = new THREE.TubeGeometry(curve, 12, RIB_R, 6, false);
    const ribMesh = new THREE.Mesh(ribGeo, ceramicMat);
    ribMesh.name = `inner_rib_${i + 1}`;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  }

  // Loop handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CONE_BASE_R - 0.001, 0.020, 0),
    new THREE.Vector3(CONE_BASE_R + 0.016, 0.032, 0),
    new THREE.Vector3(SAUCER_R + 0.014, 0.030, 0),
    new THREE.Vector3(SAUCER_R + 0.016, 0.018, 0),
    new THREE.Vector3(SAUCER_R - 0.003, 0.010, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 20, HANDLE_R, 10, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'dripper_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
