function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 0.64;
  const BASE_H = 0.345;
  const SHADE_H = 0.27;
  const SHADE_Y_BOT = H - SHADE_H; // 0.37
  const SHADE_R_BOT = 0.195;
  const SHADE_R_TOP = 0.175;
  const STEM_R = 0.014;
  const RADIAL_SEGMENTS = 32;

  // Materials
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a3a,
    roughness: 0.88,
    metalness: 0.02
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x2b221e,
    roughness: 0.95,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a22,
    roughness: 0.45,
    metalness: 0.65
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xded4c3,
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd999,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // 1. Felt pad at y = 0
  const feltGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.004, RADIAL_SEGMENTS);
  const feltPad = new THREE.Mesh(feltGeo, feltMat);
  feltPad.name = "base_felt_pad";
  feltPad.position.y = 0.002;
  feltPad.castShadow = true;
  feltPad.receiveShadow = true;
  group.add(feltPad);

  // 2. Sculptural 3-tier mocha clay base (LatheGeometry)
  const basePoints = [
    new THREE.Vector2(0.0, 0.004),
    new THREE.Vector2(0.074, 0.004),
    new THREE.Vector2(0.095, 0.022),
    new THREE.Vector2(0.116, 0.050),
    new THREE.Vector2(0.126, 0.082), // bottom tier max
    new THREE.Vector2(0.118, 0.115),
    new THREE.Vector2(0.095, 0.140),
    new THREE.Vector2(0.070, 0.155), // waist 1
    new THREE.Vector2(0.088, 0.172),
    new THREE.Vector2(0.106, 0.198),
    new THREE.Vector2(0.109, 0.215), // middle tier max
    new THREE.Vector2(0.100, 0.240),
    new THREE.Vector2(0.080, 0.260),
    new THREE.Vector2(0.060, 0.272), // waist 2
    new THREE.Vector2(0.076, 0.288),
    new THREE.Vector2(0.086, 0.308), // top tier max
    new THREE.Vector2(0.080, 0.328),
    new THREE.Vector2(0.058, 0.340),
    new THREE.Vector2(0.026, BASE_H),
    new THREE.Vector2(0.0, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, RADIAL_SEGMENTS);
  const clayBase = new THREE.Mesh(baseGeo, clayMat);
  clayBase.name = "clay_base";
  clayBase.castShadow = true;
  clayBase.receiveShadow = true;
  group.add(clayBase);

  // 3. Neck collar
  const collarGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.008, RADIAL_SEGMENTS);
  const neckCollar = new THREE.Mesh(collarGeo, metalMat);
  neckCollar.name = "neck_collar";
  neckCollar.position.y = BASE_H + 0.002;
  neckCollar.castShadow = true;
  neckCollar.receiveShadow = true;
  group.add(neckCollar);

  // 4. Stem
  const stemH = 0.065;
  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, stemH, 24);
  const stem = new THREE.Mesh(stemGeo, metalMat);
  stem.name = "lamp_stem";
  stem.position.y = BASE_H + stemH / 2;
  stem.castShadow = true;
  stem.receiveShadow = true;
  group.add(stem);

  // 5. Socket cup
  const socketGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.045, 24);
  const socket = new THREE.Mesh(socketGeo, metalMat);
  socket.name = "socket_cup";
  socket.position.y = BASE_H + stemH + 0.018;
  socket.castShadow = true;
  socket.receiveShadow = true;
  group.add(socket);

  // 6. Emissive bulb
  const bulbGeo = new THREE.SphereGeometry(0.032, 24, 16);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.name = "emit_bulb";
  bulb.scale.set(1.0, 1.25, 1.0);
  bulb.position.y = BASE_H + stemH + 0.065;
  bulb.castShadow = true;
  bulb.receiveShadow = true;
  group.add(bulb);

  // 7. Shade (tapered drum, open-ended)
  const shadeGeo = new THREE.CylinderGeometry(
    SHADE_R_TOP,
    SHADE_R_BOT,
    SHADE_H,
    RADIAL_SEGMENTS,
    1,
    true
  );
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.name = "linen_shade";
  shade.position.y = SHADE_Y_BOT + SHADE_H / 2;
  shade.castShadow = true;
  shade.receiveShadow = true;
  group.add(shade);

  // 8. Shade top & bottom trim rings
  const topRingGeo = new THREE.TorusGeometry(SHADE_R_TOP, 0.0025, 12, RADIAL_SEGMENTS);
  const topRing = new THREE.Mesh(topRingGeo, metalMat);
  topRing.name = "shade_top_ring";
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = H - 0.002;
  topRing.castShadow = true;
  topRing.receiveShadow = true;
  group.add(topRing);

  const botRingGeo = new THREE.TorusGeometry(SHADE_R_BOT, 0.0025, 12, RADIAL_SEGMENTS);
  const botRing = new THREE.Mesh(botRingGeo, metalMat);
  botRing.name = "shade_bottom_ring";
  botRing.rotation.x = Math.PI / 2;
  botRing.position.y = SHADE_Y_BOT + 0.002;
  botRing.castShadow = true;
  botRing.receiveShadow = true;
  group.add(botRing);

  // 9. Spider arms supporting the shade from the socket
  const spiderY = BASE_H + stemH + 0.032;
  const spiderR = SHADE_R_BOT - 0.01;
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const armGeo = new THREE.CylinderGeometry(0.0025, 0.0025, spiderR, 8);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.name = "spider_arm_" + (i + 1);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = angle;
    arm.position.set(
      Math.cos(angle) * (spiderR / 2),
      spiderY,
      -Math.sin(angle) * (spiderR / 2)
    );
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);
  }

  // 10. Cord grommet at back (-Z) of base
  const grommetGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16);
  const grommet = new THREE.Mesh(grommetGeo, feltMat);
  grommet.name = "cord_grommet";
  grommet.rotation.x = Math.PI / 2;
  grommet.position.set(0, 0.022, -0.092);
  grommet.castShadow = true;
  grommet.receiveShadow = true;
  group.add(grommet);

  return group;
}
