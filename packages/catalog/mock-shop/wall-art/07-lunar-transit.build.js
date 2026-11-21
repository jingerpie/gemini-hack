function build(THREE) {
  const group = new THREE.Group();

  const W = 0.55;
  const H = 0.30;
  const D = 0.04;

  const BAR_R = 0.005;
  const DISC_R = 0.080;
  const DISC_T = 0.004;
  const RING_TUBE_R = 0.004;
  const RING_R = DISC_R - RING_TUBE_R;

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x2a2927,
    roughness: 0.55,
    metalness: 0.85
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xa6633c,
    roughness: 0.38,
    metalness: 0.82
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x5c5852,
    roughness: 0.42,
    metalness: 0.85
  });

  const halfSpanX = W / 2 - BAR_R;
  const midY = H / 2;

  // Curved spine bar 1
  const curve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-halfSpanX, midY + 0.055, -0.002),
    new THREE.Vector3(-halfSpanX * 0.5, midY - 0.035, 0.004),
    new THREE.Vector3(0, midY + 0.025, -0.002),
    new THREE.Vector3(halfSpanX * 0.5, midY + 0.040, 0.004),
    new THREE.Vector3(halfSpanX, midY - 0.050, -0.002)
  ]);
  const bar1Geo = new THREE.TubeGeometry(curve1, 32, BAR_R, 12, false);
  const bar1 = new THREE.Mesh(bar1Geo, ironMat);
  bar1.name = 'spine_bar_1';
  bar1.castShadow = true;
  bar1.receiveShadow = true;
  group.add(bar1);

  // Curved spine bar 2
  const curve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-halfSpanX, midY - 0.050, 0.002),
    new THREE.Vector3(-halfSpanX * 0.5, midY + 0.040, -0.004),
    new THREE.Vector3(0, midY - 0.025, 0.002),
    new THREE.Vector3(halfSpanX * 0.5, midY - 0.035, -0.004),
    new THREE.Vector3(halfSpanX, midY + 0.055, 0.002)
  ]);
  const bar2Geo = new THREE.TubeGeometry(curve2, 32, BAR_R, 12, false);
  const bar2 = new THREE.Mesh(bar2Geo, ironMat);
  bar2.name = 'spine_bar_2';
  bar2.castShadow = true;
  bar2.receiveShadow = true;
  group.add(bar2);

  // Three hammered copper discs
  const discGeo = new THREE.CylinderGeometry(DISC_R, DISC_R, DISC_T, 32);
  const discPositions = [
    { x: -0.115, y: H - DISC_R, z: -0.008, name: 'copper_disc_left' },
    { x: 0.000, y: DISC_R, z: 0.000, name: 'copper_disc_center' },
    { x: 0.115, y: H - DISC_R, z: -0.008, name: 'copper_disc_right' }
  ];

  discPositions.forEach((pos) => {
    const disc = new THREE.Mesh(discGeo, copperMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(pos.x, pos.y, pos.z);
    disc.name = pos.name;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);
  });

  // Three open metal rings
  const ringGeo = new THREE.TorusGeometry(RING_R, RING_TUBE_R, 12, 32);
  const ringPositions = [
    { x: -0.120, y: DISC_R, z: 0.010, name: 'metal_ring_left' },
    { x: 0.000, y: H - DISC_R, z: 0.012, name: 'metal_ring_center' },
    { x: 0.120, y: DISC_R, z: 0.010, name: 'metal_ring_right' }
  ];

  ringPositions.forEach((pos) => {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.name = pos.name;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  });

  // Standoff connectors between spine and discs/rings
  const connGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.016, 10);
  const connPositions = [
    { x: -0.115, y: midY + 0.015, z: 0.002, name: 'connector_left' },
    { x: 0.000, y: midY, z: 0.004, name: 'connector_center' },
    { x: 0.115, y: midY + 0.015, z: 0.002, name: 'connector_right' }
  ];

  connPositions.forEach((pos) => {
    const conn = new THREE.Mesh(connGeo, ironMat);
    conn.rotation.x = Math.PI / 2;
    conn.position.set(pos.x, pos.y, pos.z);
    conn.name = pos.name;
    conn.castShadow = true;
    conn.receiveShadow = true;
    group.add(conn);
  });

  // Back wall-mounting loops
  const mountGeo = new THREE.TorusGeometry(0.008, 0.002, 8, 16);
  const mountPositions = [
    { x: -0.115, y: midY + 0.045, z: -D / 2 + 0.004, name: 'wall_mount_left' },
    { x: 0.115, y: midY + 0.045, z: -D / 2 + 0.004, name: 'wall_mount_right' }
  ];

  mountPositions.forEach((pos) => {
    const mount = new THREE.Mesh(mountGeo, ironMat);
    mount.position.set(pos.x, pos.y, pos.z);
    mount.name = pos.name;
    mount.castShadow = true;
    mount.receiveShadow = true;
    group.add(mount);
  });

  return group;
}
