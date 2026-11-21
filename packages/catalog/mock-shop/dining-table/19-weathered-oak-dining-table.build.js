function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.15;
  const H = 0.76;
  const D = 0.98;

  const TOP_T = 0.042;
  const OVERHANG_X = 0.065;
  const OVERHANG_Z = 0.055;

  const LEG_W = 0.085;
  const FOOT_H = 0.004;
  const LEG_H = H - TOP_T - FOOT_H;

  const APRON_H = 0.092;
  const APRON_T = 0.032;

  const PLANK_COUNT = 4;
  const PLANK_GAP = 0.003;
  const PLANK_D = (D - PLANK_GAP * (PLANK_COUNT - 1)) / PLANK_COUNT;

  const FRAME_W = W - OVERHANG_X * 2;
  const FRAME_D = D - OVERHANG_Z * 2;

  const LEG_X = FRAME_W / 2 - LEG_W / 2;
  const LEG_Z = FRAME_D / 2 - LEG_W / 2;

  // Materials
  const oakMainMat = new THREE.MeshStandardMaterial({
    color: 0xa69078,
    roughness: 0.84,
    metalness: 0.02,
  });

  const oakApronMat = new THREE.MeshStandardMaterial({
    color: 0x99836b,
    roughness: 0.86,
    metalness: 0.02,
  });

  const footPadMat = new THREE.MeshStandardMaterial({
    color: 0x4a4238,
    roughness: 0.9,
    metalness: 0.05,
  });

  function makeMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop planks (running along X)
  const plankGeo = new THREE.BoxGeometry(W, TOP_T, PLANK_D);
  const topY = H - TOP_T / 2;
  for (let i = 0; i < PLANK_COUNT; i++) {
    const pz = -D / 2 + PLANK_D / 2 + i * (PLANK_D + PLANK_GAP);
    makeMesh(plankGeo, oakMainMat, `tabletop_plank_${i + 1}`, 0, topY, pz);
  }

  // 2. Legs and foot pads
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const footGeo = new THREE.BoxGeometry(LEG_W * 0.92, FOOT_H, LEG_W * 0.92);
  const legY = FOOT_H + LEG_H / 2;
  const footY = FOOT_H / 2;

  const legPositions = [
    { name: 'front_left', x: -LEG_X, z: LEG_Z },
    { name: 'front_right', x: LEG_X, z: LEG_Z },
    { name: 'back_left', x: -LEG_X, z: -LEG_Z },
    { name: 'back_right', x: LEG_X, z: -LEG_Z },
  ];

  for (const pos of legPositions) {
    makeMesh(legGeo, oakMainMat, `leg_${pos.name}`, pos.x, legY, pos.z);
    makeMesh(footGeo, footPadMat, `foot_pad_${pos.name}`, pos.x, footY, pos.z);
  }

  // 3. Apron rails (recessed slightly from outer leg faces)
  const apronY = H - TOP_T - APRON_H / 2;
  const apronSideLen = FRAME_D - LEG_W * 2;
  const apronEndLen = FRAME_W - LEG_W * 2;

  const sideApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, apronSideLen);
  const endApronGeo = new THREE.BoxGeometry(apronEndLen, APRON_H, APRON_T);

  const sideApronX = FRAME_W / 2 - LEG_W / 2;
  const endApronZ = FRAME_D / 2 - LEG_W / 2;

  makeMesh(sideApronGeo, oakApronMat, 'apron_left', -sideApronX, apronY, 0);
  makeMesh(sideApronGeo, oakApronMat, 'apron_right', sideApronX, apronY, 0);
  makeMesh(endApronGeo, oakApronMat, 'apron_front', 0, apronY, endApronZ);
  makeMesh(endApronGeo, oakApronMat, 'apron_back', 0, apronY, -endApronZ);

  // 4. Under-tabletop support cleats (running perpendicular to planks, along Z)
  const cleatLen = FRAME_D - LEG_W;
  const cleatGeo = new THREE.BoxGeometry(0.045, 0.035, cleatLen);
  const cleatY = H - TOP_T - 0.035 / 2;
  makeMesh(cleatGeo, oakApronMat, 'support_cleat_left', -FRAME_W * 0.2, cleatY, 0);
  makeMesh(cleatGeo, oakApronMat, 'support_cleat_right', FRAME_W * 0.2, cleatY, 0);

  return group;
}
