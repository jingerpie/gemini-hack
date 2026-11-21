function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.085;
  const PAD_H = 0.004;
  const BASE_H = 0.008;
  const STEM_R = 0.007;
  const STEM_H = 0.21;
  const COLLAR_R = 0.014;
  const COLLAR_H = 0.014;
  const SOCKET_R = 0.017;
  const SOCKET_H = 0.038;
  const BULB_R = 0.024;
  const SHADE_H = 0.22;
  const SHADE_MAX_R = 0.125;
  const SHADE_TOP_R = 0.068;
  const CORD_R = 0.0032;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a25d,
    roughness: 0.28,
    metalness: 0.88,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.75,
    metalness: 0.05,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    roughness: 0.2,
    metalness: 0.9,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc9a36a,
    roughness: 0.14,
    metalness: 0.04,
    transparent: true,
    opacity: 0.68,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base pad & brass disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.98, BASE_R * 0.98, PAD_H, 32),
    blackMat,
    'base_pad',
    0,
    PAD_H * 0.5,
    0
  );

  const baseTopY = PAD_H + BASE_H;
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    brassMat,
    'base_disc',
    0,
    PAD_H + BASE_H * 0.5,
    0
  );

  // 2. Vertical stem
  const stemTopY = baseTopY + STEM_H;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 20),
    brassMat,
    'stem',
    0,
    baseTopY + STEM_H * 0.5,
    0
  );

  // 3. Stem collar & socket
  addMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R * 0.9, COLLAR_H, 24),
    brassMat,
    'stem_collar',
    0,
    stemTopY + COLLAR_H * 0.5 - 0.002,
    0
  );

  const socketBaseY = stemTopY + COLLAR_H - 0.002;
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R, SOCKET_R, SOCKET_H, 24),
    brassMat,
    'socket_body',
    0,
    socketBaseY + SOCKET_H * 0.5,
    0
  );

  addMesh(
    new THREE.TorusGeometry(SOCKET_R * 1.15, 0.003, 10, 24),
    brassMat,
    'socket_ring',
    0,
    socketBaseY + SOCKET_H * 0.55,
    0,
    Math.PI * 0.5,
    0,
    0
  );

  // 4. Emissive bulb
  const bulbY = socketBaseY + SOCKET_H + BULB_R * 0.65;
  addMesh(
    new THREE.SphereGeometry(BULB_R, 20, 16),
    bulbMat,
    'emit_bulb',
    0,
    bulbY,
    0
  );

  // 5. Pleated glass shade (LatheGeometry with radial pleat displacement)
  const shadeBaseY = stemTopY + 0.006;
  const profile = [
    new THREE.Vector2(0.022, 0.0),
    new THREE.Vector2(0.065, 0.002),
    new THREE.Vector2(0.108, 0.012),
    new THREE.Vector2(SHADE_MAX_R, 0.042),
    new THREE.Vector2(SHADE_MAX_R * 0.96, 0.085),
    new THREE.Vector2(SHADE_MAX_R * 0.84, 0.135),
    new THREE.Vector2(SHADE_TOP_R * 1.12, 0.185),
    new THREE.Vector2(SHADE_TOP_R, SHADE_H),
  ];

  const shadeGeo = new THREE.LatheGeometry(profile, 32);
  const pos = shadeGeo.attributes.position;
  const PLEATS = 8;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const r = Math.hypot(vx, vz);
    if (r > 0.03) {
      const angle = Math.atan2(vz, vx);
      const heightFactor = Math.min(1, vy / 0.03);
      const pleatAmp = 0.0075 * heightFactor;
      const newR = r + pleatAmp * Math.sin(angle * PLEATS);
      const scale = newR / r;
      pos.setX(i, vx * scale);
      pos.setZ(i, vz * scale);
    }
  }
  shadeGeo.computeVertexNormals();

  addMesh(shadeGeo, glassMat, 'glass_shade', 0, shadeBaseY, 0);

  // 6. Power cord, inline switch, and plug
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, PAD_H + 0.002, -BASE_R * 0.9),
    new THREE.Vector3(0.04, CORD_R, -BASE_R - 0.02),
    new THREE.Vector3(0.11, CORD_R, -0.07),
    new THREE.Vector3(0.16, CORD_R, -0.03),
    new THREE.Vector3(0.18, CORD_R, 0.03),
    new THREE.Vector3(0.14, CORD_R, 0.06),
    new THREE.Vector3(0.10, CORD_R, 0.03),
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 32, CORD_R, 8, false),
    blackMat,
    'cord'
  );

  // Inline switch along the cord
  const switchX = 0.11;
  const switchZ = -0.07;
  addMesh(
    new THREE.BoxGeometry(0.038, 0.012, 0.018),
    blackMat,
    'switch_body',
    switchX,
    0.006,
    switchZ,
    0,
    -0.4,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.014, 0.006, 0.008),
    blackMat,
    'switch_button',
    switchX,
    0.013,
    switchZ,
    0,
    -0.4,
    0.15
  );

  // Plug at the end of the cord
  const plugX = 0.092;
  const plugZ = 0.024;
  addMesh(
    new THREE.BoxGeometry(0.024, 0.012, 0.016),
    blackMat,
    'plug_body',
    plugX,
    0.006,
    plugZ,
    0,
    0.5,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.012, 0.0015, 0.003),
    chromeMat,
    'plug_prong_left',
    plugX - 0.015,
    0.006,
    plugZ + 0.002,
    0,
    0.5,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.012, 0.0015, 0.003),
    chromeMat,
    'plug_prong_right',
    plugX - 0.012,
    0.006,
    plugZ + 0.008,
    0,
    0.5,
    0
  );

  return group;
}
