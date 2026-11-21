function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SPEAKER_W = 0.21;
  const SPEAKER_H = 0.34;
  const SPEAKER_D = 0.26;
  const GAP = 0.04;
  const FOOT_H = 0.008;

  const BAFFLE_W = SPEAKER_W - 0.016;
  const BAFFLE_H = SPEAKER_H - 0.016;
  const BAFFLE_D = 0.012;

  const TWEETER_Y = FOOT_H + SPEAKER_H * 0.74;
  const WOOFER_Y = FOOT_H + SPEAKER_H * 0.37;
  const FRONT_Z = SPEAKER_D / 2 + 0.002;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x624432,
    roughness: 0.55,
    metalness: 0.04
  });

  const baffleMat = new THREE.MeshStandardMaterial({
    color: 0x262423,
    roughness: 0.65,
    metalness: 0.05
  });

  const gunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x525457,
    roughness: 0.4,
    metalness: 0.65
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.85,
    metalness: 0.02
  });

  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x2e3033,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.45,
    metalness: 0.15
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.9
  });

  // Shared Geometries
  const cabinetGeo = new THREE.BoxGeometry(SPEAKER_W, SPEAKER_H, SPEAKER_D);
  const baffleGeo = new THREE.BoxGeometry(BAFFLE_W, BAFFLE_H, BAFFLE_D);
  const footGeo = new THREE.CylinderGeometry(0.012, 0.012, FOOT_H, 16);

  const tweeterPlateGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.004, 32);
  const tweeterDomeGeo = new THREE.SphereGeometry(0.015, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);

  const wooferRingGeo = new THREE.TorusGeometry(0.076, 0.006, 12, 32);
  const wooferSurroundGeo = new THREE.TorusGeometry(0.066, 0.007, 12, 32);
  const wooferConeGeo = new THREE.CylinderGeometry(0.062, 0.022, 0.018, 32, 1, true);
  const wooferCapGeo = new THREE.SphereGeometry(0.022, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);

  const termPlateGeo = new THREE.BoxGeometry(0.004, 0.065, 0.055);
  const postGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.018, 16);

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx !== 0 || ry !== 0 || rz !== 0) {
      mesh.rotation.set(rx, ry, rz);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const speakers = [
    { prefix: 'left', x: -(SPEAKER_W / 2 + GAP / 2), sideSign: -1 },
    { prefix: 'right', x: SPEAKER_W / 2 + GAP / 2, sideSign: 1 }
  ];

  for (const spk of speakers) {
    const sx = spk.x;
    const p = spk.prefix;

    // Cabinet
    addMesh(cabinetGeo, walnutMat, `${p}_cabinet`, sx, FOOT_H + SPEAKER_H / 2, 0);

    // Front Baffle
    addMesh(
      baffleGeo,
      baffleMat,
      `${p}_baffle`,
      sx,
      FOOT_H + SPEAKER_H / 2,
      SPEAKER_D / 2 - BAFFLE_D / 2 + 0.002
    );

    // 4 Rubber Feet
    const footOffsetX = SPEAKER_W / 2 - 0.024;
    const footOffsetZ = SPEAKER_D / 2 - 0.024;
    const footCoords = [
      [-footOffsetX, -footOffsetZ, 'fl'],
      [footOffsetX, -footOffsetZ, 'fr'],
      [-footOffsetX, footOffsetZ, 'bl'],
      [footOffsetX, footOffsetZ, 'br']
    ];
    for (const [fx, fz, tag] of footCoords) {
      addMesh(footGeo, rubberMat, `${p}_foot_${tag}`, sx + fx, FOOT_H / 2, fz);
    }

    // Tweeter
    addMesh(
      tweeterPlateGeo,
      gunmetalMat,
      `${p}_tweeter_plate`,
      sx,
      TWEETER_Y,
      FRONT_Z,
      Math.PI / 2,
      0,
      0
    );
    addMesh(
      tweeterDomeGeo,
      domeMat,
      `${p}_tweeter_dome`,
      sx,
      TWEETER_Y,
      FRONT_Z + 0.001,
      Math.PI / 2,
      0,
      0
    );

    // Woofer
    addMesh(wooferRingGeo, gunmetalMat, `${p}_woofer_ring`, sx, WOOFER_Y, FRONT_Z + 0.001);
    addMesh(wooferSurroundGeo, rubberMat, `${p}_woofer_surround`, sx, WOOFER_Y, FRONT_Z + 0.001);
    addMesh(
      wooferConeGeo,
      coneMat,
      `${p}_woofer_cone`,
      sx,
      WOOFER_Y,
      FRONT_Z - 0.006,
      Math.PI / 2,
      0,
      0
    );
    addMesh(
      wooferCapGeo,
      domeMat,
      `${p}_woofer_cap`,
      sx,
      WOOFER_Y,
      FRONT_Z - 0.008,
      Math.PI / 2,
      0,
      0
    );

    // Binding Post Terminal Plate & 4 Posts on outer side
    const sideX = sx + spk.sideSign * (SPEAKER_W / 2);
    const termY = FOOT_H + 0.055;
    const termZ = -SPEAKER_D / 2 + 0.055;

    addMesh(termPlateGeo, rubberMat, `${p}_terminal_plate`, sideX, termY, termZ);

    const postOffsets = [
      [0.014, -0.012, 'tl'],
      [0.014, 0.012, 'tr'],
      [-0.014, -0.012, 'bl'],
      [-0.014, 0.012, 'br']
    ];
    for (const [dy, dz, tag] of postOffsets) {
      addMesh(
        postGeo,
        goldMat,
        `${p}_binding_post_${tag}`,
        sideX + spk.sideSign * 0.009,
        termY + dy,
        termZ + dz,
        0,
        0,
        Math.PI / 2
      );
    }
  }

  return group;
}
