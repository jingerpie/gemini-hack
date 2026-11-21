function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.62;
  const BASE_H = 0.31;
  const FOOT_H = 0.008;
  const FOOT_R = 0.068;
  const BASE_MAX_R = 0.125;
  const NECK_R = 0.042;
  const STEM_R = 0.013;
  const SHADE_BOTTOM_Y = 0.34;
  const SHADE_H = TOTAL_H - SHADE_BOTTOM_Y;
  const SHADE_R = 0.20;
  const TRIM_TUBE_R = 0.003;

  // Materials
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1c1714,
    roughness: 0.9,
    metalness: 0.05,
  });

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xc2a88d,
    roughness: 0.72,
    metalness: 0.02,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89b6a,
    roughness: 0.35,
    metalness: 0.85,
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xd48832,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x5c3614,
    roughness: 0.65,
    metalness: 0.15,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d4,
    emissive: 0xffb85c,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Foot pad at y = 0
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.96, FOOT_H, 32);
  const footMesh = new THREE.Mesh(footGeo, footMat);
  footMesh.name = 'base_foot_pad';
  footMesh.position.y = FOOT_H * 0.5;
  addMesh(footMesh);

  // 2. Ceramic vase body (LatheGeometry)
  const lathePts = [
    new THREE.Vector2(0.001, FOOT_H),
    new THREE.Vector2(FOOT_R, FOOT_H),
    new THREE.Vector2(0.082, 0.035),
    new THREE.Vector2(0.105, 0.085),
    new THREE.Vector2(0.120, 0.145),
    new THREE.Vector2(BASE_MAX_R, 0.200),
    new THREE.Vector2(0.118, 0.235),
    new THREE.Vector2(0.092, 0.262),
    new THREE.Vector2(0.056, 0.280),
    new THREE.Vector2(NECK_R, 0.295),
    new THREE.Vector2(NECK_R * 0.96, BASE_H),
    new THREE.Vector2(0.001, BASE_H),
  ];
  const ceramicGeo = new THREE.LatheGeometry(lathePts, 32);
  const ceramicMesh = new THREE.Mesh(ceramicGeo, ceramicMat);
  ceramicMesh.name = 'ceramic_base';
  addMesh(ceramicMesh);

  // 3. Neck collar
  const collarH = 0.008;
  const collarGeo = new THREE.CylinderGeometry(0.024, 0.028, collarH, 24);
  const collarMesh = new THREE.Mesh(collarGeo, brassMat);
  collarMesh.name = 'neck_collar';
  collarMesh.position.y = BASE_H + collarH * 0.5 - 0.002;
  addMesh(collarMesh);

  // 4. Metal stem
  const stemTopY = SHADE_BOTTOM_Y + 0.05;
  const stemH = stemTopY - BASE_H;
  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, stemH, 20);
  const stemMesh = new THREE.Mesh(stemGeo, brassMat);
  stemMesh.name = 'neck_stem';
  stemMesh.position.y = BASE_H + stemH * 0.5;
  addMesh(stemMesh);

  // 5. Socket base & body
  const socketCupGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.018, 24);
  const socketCupMesh = new THREE.Mesh(socketCupGeo, brassMat);
  socketCupMesh.name = 'socket_base';
  socketCupMesh.position.y = stemTopY + 0.005;
  addMesh(socketCupMesh);

  const socketBodyGeo = new THREE.CylinderGeometry(0.021, 0.021, 0.045, 24);
  const socketBodyMesh = new THREE.Mesh(socketBodyGeo, brassMat);
  socketBodyMesh.name = 'socket_body';
  socketBodyMesh.position.y = stemTopY + 0.035;
  addMesh(socketBodyMesh);

  // 6. Emissive light bulb inside shade
  const bulbGeo = new THREE.SphereGeometry(0.034, 24, 18);
  bulbGeo.scale(1, 1.32, 1);
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.name = 'emit_bulb';
  bulbMesh.position.y = stemTopY + 0.095;
  addMesh(bulbMesh);

  // 7. Harp / spider support at top of shade
  const spiderY = TOTAL_H - 0.025;
  const spiderRingGeo = new THREE.TorusGeometry(0.018, 0.003, 10, 24);
  spiderRingGeo.rotateX(Math.PI / 2);
  const spiderRingMesh = new THREE.Mesh(spiderRingGeo, brassMat);
  spiderRingMesh.name = 'spider_ring';
  spiderRingMesh.position.y = spiderY;
  addMesh(spiderRingMesh);

  const finialGeo = new THREE.CylinderGeometry(0.006, 0.009, 0.018, 16);
  const finialMesh = new THREE.Mesh(finialGeo, brassMat);
  finialMesh.name = 'finial_nut';
  finialMesh.position.y = spiderY + 0.009;
  addMesh(finialMesh);

  // 3 radial spider arms connecting center ring to shade top rim
  const armLen = SHADE_R - 0.016;
  const armGeo = new THREE.CylinderGeometry(0.0022, 0.0022, armLen, 8);
  armGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const armMesh = new THREE.Mesh(armGeo, brassMat);
    armMesh.name = `spider_arm_${i + 1}`;
    const midR = 0.016 + armLen * 0.5;
    armMesh.position.set(
      Math.cos(angle) * midR,
      spiderY,
      Math.sin(angle) * midR
    );
    armMesh.rotation.y = -angle;
    addMesh(armMesh);
  }

  // 8. Amber linen drum shade (open-ended cylinder)
  const shadeGeo = new THREE.CylinderGeometry(
    SHADE_R,
    SHADE_R,
    SHADE_H,
    32,
    1,
    true
  );
  const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);
  shadeMesh.name = 'shade_drum';
  shadeMesh.position.y = SHADE_BOTTOM_Y + SHADE_H * 0.5;
  addMesh(shadeMesh);

  // 9. Shade top and bottom trim rings
  const trimGeo = new THREE.TorusGeometry(SHADE_R, TRIM_TUBE_R, 10, 32);
  trimGeo.rotateX(Math.PI / 2);

  const topTrimMesh = new THREE.Mesh(trimGeo, trimMat);
  topTrimMesh.name = 'shade_trim_top';
  topTrimMesh.position.y = TOTAL_H;
  addMesh(topTrimMesh);

  const bottomTrimMesh = new THREE.Mesh(trimGeo, trimMat);
  bottomTrimMesh.name = 'shade_trim_bottom';
  bottomTrimMesh.position.y = SHADE_BOTTOM_Y;
  addMesh(bottomTrimMesh);

  return group;
}
