function build(THREE) {
  const group = new THREE.Group();

  const VASE_R = 0.14;
  const BODY_H = 0.17;
  const NECK_R = 0.028;
  const NECK_H = 0.045;
  const VASE_H = BODY_H + NECK_H;
  const WALL_T = 0.004;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xb83204,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x6e5a28,
    roughness: 0.85,
    metalness: 0.0
  });

  const blossomMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc2,
    roughness: 0.9,
    metalness: 0.0
  });

  // Vase profile (outer + inner wall)
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.058, 0.0),
    new THREE.Vector2(0.088, 0.01),
    new THREE.Vector2(0.118, 0.032),
    new THREE.Vector2(0.136, 0.062),
    new THREE.Vector2(VASE_R, 0.09),
    new THREE.Vector2(0.132, 0.122),
    new THREE.Vector2(0.106, 0.148),
    new THREE.Vector2(0.065, 0.164),
    new THREE.Vector2(NECK_R + 0.004, BODY_H),
    new THREE.Vector2(NECK_R, BODY_H + 0.006),
    new THREE.Vector2(NECK_R, VASE_H),
    new THREE.Vector2(NECK_R - WALL_T, VASE_H),
    new THREE.Vector2(NECK_R - WALL_T, BODY_H + 0.004),
    new THREE.Vector2(0.06, BODY_H - 0.008),
    new THREE.Vector2(0.125, 0.09),
    new THREE.Vector2(0.055, 0.006),
    new THREE.Vector2(0.0, 0.006)
  ];

  const vaseGeo = new THREE.LatheGeometry(pts, 32);
  const vaseMesh = new THREE.Mesh(vaseGeo, glassMat);
  vaseMesh.name = 'rouge_orb_vase';
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Dried floral stems arching from inside bottom-left through neck to upper-right
  const stemConfigs = [
    {
      name: 'stem_main_tall',
      points: [
        new THREE.Vector3(-0.075, 0.015, 0.005),
        new THREE.Vector3(-0.03, 0.11, 0.0),
        new THREE.Vector3(0.008, VASE_H, 0.0),
        new THREE.Vector3(0.048, 0.305, -0.008),
        new THREE.Vector3(0.082, 0.385, -0.012)
      ],
      radius: 0.0018,
      blossomRadius: 0.022
    },
    {
      name: 'stem_mid_right',
      points: [
        new THREE.Vector3(-0.062, 0.018, -0.012),
        new THREE.Vector3(-0.02, 0.115, -0.006),
        new THREE.Vector3(0.012, VASE_H, 0.004),
        new THREE.Vector3(0.075, 0.275, 0.01),
        new THREE.Vector3(0.145, 0.325, 0.018)
      ],
      radius: 0.0016,
      blossomRadius: 0.024
    },
    {
      name: 'stem_low_right',
      points: [
        new THREE.Vector3(-0.052, 0.02, 0.015),
        new THREE.Vector3(-0.015, 0.12, 0.008),
        new THREE.Vector3(0.015, VASE_H, 0.006),
        new THREE.Vector3(0.095, 0.245, 0.015),
        new THREE.Vector3(0.185, 0.265, 0.022)
      ],
      radius: 0.0015,
      blossomRadius: 0.02
    },
    {
      name: 'stem_upper_back',
      points: [
        new THREE.Vector3(-0.042, 0.022, -0.018),
        new THREE.Vector3(-0.012, 0.125, -0.01),
        new THREE.Vector3(0.01, VASE_H, -0.004),
        new THREE.Vector3(0.068, 0.288, -0.018),
        new THREE.Vector3(0.122, 0.352, -0.025)
      ],
      radius: 0.0015,
      blossomRadius: 0.021
    }
  ];

  stemConfigs.forEach((cfg, idx) => {
    const curve = new THREE.CatmullRomCurve3(cfg.points);
    const stemGeo = new THREE.TubeGeometry(curve, 20, cfg.radius, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = cfg.name;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    const tip = cfg.points[cfg.points.length - 1];
    const clusterGeo = new THREE.SphereGeometry(cfg.blossomRadius, 10, 8);
    clusterGeo.scale(1.2, 0.75, 1.0);
    const clusterMesh = new THREE.Mesh(clusterGeo, blossomMat);
    clusterMesh.name = 'blossom_cluster_' + (idx + 1);
    clusterMesh.position.copy(tip);
    clusterMesh.castShadow = true;
    clusterMesh.receiveShadow = true;
    group.add(clusterMesh);
  });

  return group;
}
