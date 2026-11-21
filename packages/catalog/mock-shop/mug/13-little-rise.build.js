function build(THREE) {
  const group = new THREE.Group();

  const H = 0.095;
  const CUP_R = 0.046;
  const FOOT_R = 0.036;
  const STEM_R = 0.013;
  const WALL_T = 0.0045;
  const FOOT_H = 0.032;
  const INNER_BOTTOM_Y = 0.042;
  const RADIAL_SEGS = 32;

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2bdb6,
    roughness: 0.48,
    metalness: 0.02,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4
  });

  // Lathe profile for the pedestal cup (outer foot -> stem -> bowl -> rim -> inner bowl)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(FOOT_R - 0.003, 0.0),
    new THREE.Vector2(FOOT_R, 0.0025),
    new THREE.Vector2(FOOT_R, 0.006),
    new THREE.Vector2(FOOT_R - 0.006, 0.012),
    new THREE.Vector2(STEM_R + 0.005, 0.019),
    new THREE.Vector2(STEM_R, 0.026),
    new THREE.Vector2(STEM_R + 0.002, FOOT_H),
    new THREE.Vector2(CUP_R * 0.62, 0.038),
    new THREE.Vector2(CUP_R * 0.88, 0.052),
    new THREE.Vector2(CUP_R, 0.072),
    new THREE.Vector2(CUP_R, H - 0.003),
    new THREE.Vector2(CUP_R - WALL_T * 0.5, H),
    new THREE.Vector2(CUP_R - WALL_T, H - 0.003),
    new THREE.Vector2(CUP_R - WALL_T, 0.072),
    new THREE.Vector2((CUP_R - WALL_T) * 0.85, 0.054),
    new THREE.Vector2((CUP_R - WALL_T) * 0.5, 0.044),
    new THREE.Vector2(0.0, INNER_BOTTOM_Y)
  ];

  const cupGeo = new THREE.LatheGeometry(profile, RADIAL_SEGS);
  const cupMesh = new THREE.Mesh(cupGeo, ceramicMat);
  cupMesh.name = 'pedestal_cup_body';
  cupMesh.castShadow = true;
  cupMesh.receiveShadow = true;
  group.add(cupMesh);

  // Handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(CUP_R - 0.003, H - 0.016, 0),
    new THREE.Vector3(CUP_R + 0.014, H - 0.013, 0),
    new THREE.Vector3(CUP_R + 0.022, H - 0.026, 0),
    new THREE.Vector3(CUP_R + 0.015, H - 0.041, 0),
    new THREE.Vector3(CUP_R - 0.009, H - 0.045, 0)
  ]);

  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0042, 12, false);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.name = 'cup_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  return group;
}
