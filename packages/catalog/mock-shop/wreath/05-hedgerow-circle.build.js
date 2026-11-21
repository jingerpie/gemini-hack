function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.25;
  const H = 0.25;
  const D = 0.06;
  const RING_CENTER_Y = 0.115;
  const RING_RADIUS = 0.095;
  const TUBE_RADIUS = 0.011;
  const BACK_Z = -D / 2;

  // Materials
  const twigMat = new THREE.MeshStandardMaterial({
    color: 0x5c432d,
    roughness: 0.92,
    metalness: 0.0
  });
  const twineMat = new THREE.MeshStandardMaterial({
    color: 0xe3dccf,
    roughness: 0.95,
    metalness: 0.0
  });
  const creamFlowerMat = new THREE.MeshStandardMaterial({
    color: 0xe8dec8,
    roughness: 0.85,
    metalness: 0.0
  });
  const orangeFlowerMat = new THREE.MeshStandardMaterial({
    color: 0xd47e37,
    roughness: 0.85,
    metalness: 0.0
  });
  const poppyPodMat = new THREE.MeshStandardMaterial({
    color: 0x9e9280,
    roughness: 0.9,
    metalness: 0.0
  });
  const wheatMat = new THREE.MeshStandardMaterial({
    color: 0xc9b382,
    roughness: 0.88,
    metalness: 0.0
  });
  const sageLeafMat = new THREE.MeshStandardMaterial({
    color: 0x7d8768,
    roughness: 0.9,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Woven twig base (4 intertwined rings)
  const ringConfigs = [
    { r: RING_RADIUS, tr: TUBE_RADIUS, z: BACK_Z + 0.014, rx: 0.03, ry: 0.02 },
    { r: RING_RADIUS + 0.004, tr: TUBE_RADIUS * 0.75, z: BACK_Z + 0.016, rx: -0.04, ry: 0.03 },
    { r: RING_RADIUS - 0.005, tr: TUBE_RADIUS * 0.7, z: BACK_Z + 0.018, rx: 0.02, ry: -0.04 },
    { r: RING_RADIUS + 0.001, tr: TUBE_RADIUS * 0.6, z: BACK_Z + 0.021, rx: -0.02, ry: -0.02 }
  ];
  ringConfigs.forEach((cfg, i) => {
    const geo = new THREE.TorusGeometry(cfg.r, cfg.tr, 10, 32);
    addMesh(geo, twigMat, `woven_twig_ring_${i + 1}`, 0, RING_CENTER_Y, cfg.z, cfg.rx, cfg.ry, 0);
  });

  // 2. Hanging twine loop at top
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.006, RING_CENTER_Y + RING_RADIUS - 0.005, BACK_Z + 0.012),
    new THREE.Vector3(-0.010, H - 0.012, BACK_Z + 0.012),
    new THREE.Vector3(0, H - 0.002, BACK_Z + 0.012),
    new THREE.Vector3(0.010, H - 0.012, BACK_Z + 0.012),
    new THREE.Vector3(0.006, RING_CENTER_Y + RING_RADIUS - 0.005, BACK_Z + 0.012)
  ]);
  const loopGeo = new THREE.TubeGeometry(loopCurve, 20, 0.0022, 8, false);
  addMesh(loopGeo, twineMat, 'hanging_twine_loop', 0, 0, 0);

  // Helper to place elements along the decorated arc (from 80 deg counter-clockwise to 305 deg)
  function arcPos(angleDeg, radiusOffset = 0, zOffset = 0.026) {
    const rad = (angleDeg * Math.PI) / 180;
    const r = RING_RADIUS + radiusOffset;
    return {
      x: Math.cos(rad) * r,
      y: RING_CENTER_Y + Math.sin(rad) * r,
      z: BACK_Z + zOffset,
      rad
    };
  }

  // 3. Cream strawflowers (flattened spheres with small centers)
  const creamFlowerAngles = [
    { deg: 145, rOff: 0.004, scale: 1.0 },
    { deg: 162, rOff: -0.002, scale: 1.15 },
    { deg: 192, rOff: 0.002, scale: 1.2 },
    { deg: 225, rOff: 0.004, scale: 1.05 },
    { deg: 278, rOff: -0.002, scale: 1.25 },
    { deg: 295, rOff: 0.006, scale: 0.95 },
    { deg: 304, rOff: -0.004, scale: 1.05 }
  ];
  const flowerGeo = new THREE.SphereGeometry(0.013, 14, 10);
  creamFlowerAngles.forEach((f, i) => {
    const p = arcPos(f.deg, f.rOff, 0.036);
    addMesh(
      flowerGeo,
      creamFlowerMat,
      `cream_strawflower_${i + 1}`,
      p.x, p.y, p.z,
      0.15, (f.deg % 2 === 0 ? 0.15 : -0.15), 0,
      f.scale, f.scale, 0.45 * f.scale
    );
  });

  // 4. Burnt orange strawflowers
  const orangeFlowerAngles = [
    { deg: 128, rOff: 0.005, scale: 0.95 },
    { deg: 140, rOff: -0.004, scale: 0.85 },
    { deg: 185, rOff: 0.010, scale: 0.9 },
    { deg: 205, rOff: 0.006, scale: 0.85 },
    { deg: 240, rOff: -0.002, scale: 0.9 },
    { deg: 265, rOff: -0.006, scale: 0.85 }
  ];
  orangeFlowerAngles.forEach((f, i) => {
    const p = arcPos(f.deg, f.rOff, 0.038);
    addMesh(
      flowerGeo,
      orangeFlowerMat,
      `orange_strawflower_${i + 1}`,
      p.x, p.y, p.z,
      -0.1, 0.1, 0,
      f.scale * 0.85, f.scale * 0.85, 0.45 * f.scale
    );
  });

  // 5. Poppy seed pods
  const poppyAngles = [
    { deg: 108, rOff: 0.014, scale: 1.0 },
    { deg: 175, rOff: 0.012, scale: 0.95 },
    { deg: 215, rOff: 0.015, scale: 0.9 },
    { deg: 248, rOff: 0.008, scale: 1.05 },
    { deg: 272, rOff: -0.012, scale: 0.9 },
    { deg: 300, rOff: 0.012, scale: 0.9 }
  ];
  const poppyGeo = new THREE.SphereGeometry(0.009, 12, 10);
  poppyAngles.forEach((f, i) => {
    const p = arcPos(f.deg, f.rOff, 0.034);
    addMesh(
      poppyGeo,
      poppyPodMat,
      `poppy_seed_pod_${i + 1}`,
      p.x, p.y, p.z,
      0.2, 0.1, p.rad,
      f.scale, f.scale * 1.25, f.scale
    );
  });

  // 6. Wheat stalks (elongated cones tangent to the ring)
  const wheatAngles = [
    { deg: 88, rOff: 0.008, tilt: 0.35 },
    { deg: 118, rOff: 0.016, tilt: 0.4 },
    { deg: 148, rOff: 0.018, tilt: 0.3 },
    { deg: 198, rOff: 0.018, tilt: 0.35 },
    { deg: 235, rOff: 0.016, tilt: 0.3 },
    { deg: 262, rOff: -0.008, tilt: 0.25 },
    { deg: 312, rOff: 0.014, tilt: -0.35 }
  ];
  const wheatGeo = new THREE.ConeGeometry(0.0055, 0.042, 8);
  wheatAngles.forEach((f, i) => {
    const p = arcPos(f.deg, f.rOff, 0.028);
    addMesh(
      wheatGeo,
      wheatMat,
      `wheat_stalk_${i + 1}`,
      p.x, p.y, p.z,
      0.1, 0, p.rad + f.tilt,
      1.0, 1.0, 0.7
    );
  });

  // 7. Sage green foliage / grass clusters
  const leafAngles = [
    { deg: 112, rOff: 0.006, scale: 1.0 },
    { deg: 135, rOff: 0.012, scale: 1.1 },
    { deg: 170, rOff: 0.016, scale: 1.15 },
    { deg: 190, rOff: 0.018, scale: 1.1 },
    { deg: 218, rOff: 0.014, scale: 1.05 },
    { deg: 255, rOff: 0.005, scale: 1.0 },
    { deg: 315, rOff: 0.006, scale: 1.1 }
  ];
  const leafGeo = new THREE.ConeGeometry(0.009, 0.036, 7);
  leafAngles.forEach((f, i) => {
    const p = arcPos(f.deg, f.rOff, 0.025);
    addMesh(
      leafGeo,
      sageLeafMat,
      `sage_foliage_cluster_${i + 1}`,
      p.x, p.y, p.z,
      0.08, 0, p.rad + 0.2,
      f.scale, f.scale, 0.6
    );
  });

  return group;
}
