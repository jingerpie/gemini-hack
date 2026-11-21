function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_W = 0.18;
  const BASE_D = 0.18;
  const H = 0.045;
  const THICK = 0.004;
  const TILT = 0.22; // outward flare angle in radians
  const WALL_LEN = BASE_W + 0.012;
  const WALL_H = H / Math.cos(TILT);

  // Materials
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a22,
    roughness: 0.52,
    metalness: 0.05,
  });

  const suedeMat = new THREE.MeshStandardMaterial({
    color: 0x5c4234,
    roughness: 0.88,
    metalness: 0.02,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8c6c2,
    roughness: 0.28,
    metalness: 0.88,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Base outer (leather)
  addMesh(
    new THREE.BoxGeometry(BASE_W, THICK, BASE_D),
    leatherMat,
    'tray_base_outer',
    [0, THICK / 2, 0]
  );

  // Base inner (suede lining)
  addMesh(
    new THREE.BoxGeometry(BASE_W - 0.004, 0.002, BASE_D - 0.004),
    suedeMat,
    'tray_base_lining',
    [0, THICK + 0.0005, 0]
  );

  // Four flared walls (front +Z, back -Z, right +X, left -X)
  const wallConfigs = [
    { name: 'front', x: 0, z: BASE_D / 2, ry: 0, rx: TILT, rz: 0, dx: 0, dz: 1 },
    { name: 'back', x: 0, z: -BASE_D / 2, ry: Math.PI, rx: TILT, rz: 0, dx: 0, dz: -1 },
    { name: 'right', x: BASE_W / 2, z: 0, ry: Math.PI / 2, rx: TILT, rz: 0, dx: 1, dz: 0 },
    { name: 'left', x: -BASE_W / 2, z: 0, ry: -Math.PI / 2, rx: TILT, rz: 0, dx: -1, dz: 0 },
  ];

  const halfOffset = (WALL_H / 2) * Math.sin(TILT);
  const centerY = THICK / 2 + (WALL_H / 2) * Math.cos(TILT);

  for (const w of wallConfigs) {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(w.x + w.dx * halfOffset, centerY, w.z + w.dz * halfOffset);
    wallGroup.rotation.y = w.ry;

    // Outer leather wall
    const outerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_LEN, WALL_H, THICK),
      leatherMat
    );
    outerMesh.name = `wall_${w.name}_outer`;
    outerMesh.rotation.x = w.rx;
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    wallGroup.add(outerMesh);

    // Inner suede lining
    const innerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_LEN - 0.006, WALL_H - 0.004, 0.002),
      suedeMat
    );
    innerMesh.name = `wall_${w.name}_lining`;
    innerMesh.position.set(0, 0, -THICK / 2 - 0.0005);
    innerMesh.rotation.x = w.rx;
    innerMesh.castShadow = true;
    innerMesh.receiveShadow = true;
    wallGroup.add(innerMesh);

    group.add(wallGroup);
  }

  // Four pinched corners with metallic snap buttons
  const cornerDist = (BASE_W / 2 + halfOffset * 1.65) * Math.SQRT2;
  const cornerY = H * 0.72;
  const snapGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 20);
  const pinchGeo = new THREE.BoxGeometry(0.018, H * 0.65, 0.009);

  const corners = [
    { name: 'front_right', angle: Math.PI / 4 },
    { name: 'front_left', angle: (3 * Math.PI) / 4 },
    { name: 'back_left', angle: (-3 * Math.PI) / 4 },
    { name: 'back_right', angle: -Math.PI / 4 },
  ];

  for (const c of corners) {
    const cx = Math.cos(c.angle) * (cornerDist * 0.72);
    const cz = Math.sin(c.angle) * (cornerDist * 0.72);

    // Pinched leather ear
    addMesh(
      pinchGeo,
      leatherMat,
      `corner_pinch_${c.name}`,
      [cx, cornerY, cz],
      [0, -c.angle, -0.18]
    );

    // Metallic snap button on the outer side of the pinch
    const sx = cx + Math.cos(c.angle) * 0.002;
    const sz = cz + Math.sin(c.angle) * 0.002;
    const snap = new THREE.Mesh(snapGeo, metalMat);
    snap.name = `corner_snap_${c.name}`;
    snap.position.set(sx, cornerY + 0.004, sz);
    snap.rotation.set(Math.PI / 2, 0, c.angle);
    snap.castShadow = true;
    snap.receiveShadow = true;
    group.add(snap);
  }

  return group;
}
