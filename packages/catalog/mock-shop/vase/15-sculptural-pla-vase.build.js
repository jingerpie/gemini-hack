function build(THREE) {
  const group = new THREE.Group();

  const H = 0.28;
  const W = 0.176;
  const D = 0.176;
  const TUBE_R = 0.024;
  const LOBE_COUNT = 6;

  const R_BASE = 0.022;
  const R_BELLY = 0.064;
  const R_NECK = 0.018;
  const R_RIM = 0.021;

  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe8dfd1,
    roughness: 0.78,
    metalness: 0.02
  });
  const matBeige = new THREE.MeshStandardMaterial({
    color: 0xe0d5c3,
    roughness: 0.78,
    metalness: 0.02
  });
  const matSage = new THREE.MeshStandardMaterial({
    color: 0x6e735b,
    roughness: 0.8,
    metalness: 0.02
  });
  const matTan = new THREE.MeshStandardMaterial({
    color: 0xc7a070,
    roughness: 0.78,
    metalness: 0.02
  });
  const matGrey = new THREE.MeshStandardMaterial({
    color: 0xcfd2d1,
    roughness: 0.78,
    metalness: 0.02
  });
  const matInterior = new THREE.MeshStandardMaterial({
    color: 0x2b2623,
    roughness: 0.9,
    metalness: 0.0
  });

  const lobeConfigs = [
    { name: 'lobe_front_cream', angle: 0, mat: matCream },
    { name: 'lobe_front_right_tan', angle: Math.PI / 3, mat: matTan },
    { name: 'lobe_back_right_grey', angle: (2 * Math.PI) / 3, mat: matGrey },
    { name: 'lobe_back_sage', angle: Math.PI, mat: matSage },
    { name: 'lobe_back_left_beige', angle: -(2 * Math.PI) / 3, mat: matBeige },
    { name: 'lobe_front_left_sage', angle: -Math.PI / 3, mat: matSage }
  ];

  // Inner core to keep the form watertight and grounded at y = 0
  const corePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R_BASE + TUBE_R * 0.65, 0.0),
    new THREE.Vector2(R_BELLY + TUBE_R * 0.45, H * 0.35),
    new THREE.Vector2(0.036 + TUBE_R * 0.45, H * 0.65),
    new THREE.Vector2(R_NECK + TUBE_R * 0.5, H * 0.86),
    new THREE.Vector2(R_RIM + TUBE_R * 0.5, H - 0.002),
    new THREE.Vector2(R_RIM * 0.75, H - 0.002),
    new THREE.Vector2(R_RIM * 0.75, H * 0.82),
    new THREE.Vector2(0.0, H * 0.82)
  ];
  const coreGeo = new THREE.LatheGeometry(corePoints, 32);
  const coreMesh = new THREE.Mesh(coreGeo, matCream);
  coreMesh.name = 'vase_core';
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // Dark interior cavity disc near the top opening
  const cavityGeo = new THREE.CylinderGeometry(R_RIM * 0.78, R_RIM * 0.7, 0.004, 24);
  const cavityMesh = new THREE.Mesh(cavityGeo, matInterior);
  cavityMesh.name = 'vase_interior_cavity';
  cavityMesh.position.y = H * 0.84;
  cavityMesh.castShadow = false;
  cavityMesh.receiveShadow = true;
  group.add(cavityMesh);

  // Sculptural undulating lobes
  const yStart = TUBE_R;
  const yEnd = H - TUBE_R;
  const ySpan = yEnd - yStart;

  for (let i = 0; i < LOBE_COUNT; i++) {
    const cfg = lobeConfigs[i];
    const a0 = cfg.angle;

    const pts = [
      new THREE.Vector3(
        R_BASE * Math.sin(a0),
        yStart,
        R_BASE * Math.cos(a0)
      ),
      new THREE.Vector3(
        R_BELLY * Math.sin(a0 - 0.38),
        yStart + ySpan * 0.35,
        R_BELLY * Math.cos(a0 - 0.38)
      ),
      new THREE.Vector3(
        0.036 * Math.sin(a0 - 0.1),
        yStart + ySpan * 0.65,
        0.036 * Math.cos(a0 - 0.1)
      ),
      new THREE.Vector3(
        R_NECK * Math.sin(a0 + 0.05),
        yStart + ySpan * 0.86,
        R_NECK * Math.cos(a0 + 0.05)
      ),
      new THREE.Vector3(
        R_RIM * Math.sin(a0 + 0.05),
        yEnd,
        R_RIM * Math.cos(a0 + 0.05)
      )
    ];

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, TUBE_R, 16, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, cfg.mat);
    tubeMesh.name = cfg.name;
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    group.add(tubeMesh);
  }

  return group;
}
