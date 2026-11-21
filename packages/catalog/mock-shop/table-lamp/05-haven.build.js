function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, total height = 0.38 m)
  const H = 0.38;
  const PAD_H = 0.003;
  const BASE_H = 0.16;
  const BASE_R = 0.056;
  const NECK_H = 0.055;
  const NECK_R = 0.014;
  const SOCKET_H = 0.032;
  const SOCKET_R = 0.017;
  const BULB_R = 0.026;

  const SHADE_BOTTOM_Y = 0.195;
  const SHADE_TOP_Y = H;
  const SHADE_H = SHADE_TOP_Y - SHADE_BOTTOM_Y;
  const SHADE_R_BOT = 0.135;
  const SHADE_R_TOP = 0.118;
  const SHADE_R_MID = (SHADE_R_BOT + SHADE_R_TOP) * 0.5;
  const SHADE_MID_Y = (SHADE_BOTTOM_Y + SHADE_TOP_Y) * 0.5;
  const SHADE_TILT = Math.atan2(SHADE_R_BOT - SHADE_R_TOP, SHADE_H);
  const PLEAT_COUNT = 24;

  // Materials
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x2a2724,
    roughness: 0.9,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd5c9b8,
    roughness: 0.65,
    metalness: 0.05,
  });

  const neckMat = new THREE.MeshStandardMaterial({
    color: 0xdfd3c3,
    roughness: 0.5,
    metalness: 0.1,
  });

  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x3b3733,
    roughness: 0.5,
    metalness: 0.2,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  const shadeCoreMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8b0,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });

  const shadePleatMat = new THREE.MeshStandardMaterial({
    color: 0xcab89e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xb8a68e,
    roughness: 0.75,
    metalness: 0.05,
  });

  // 1. Base pad (y = 0 to PAD_H)
  const padGeo = new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.96, PAD_H, 32);
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.name = 'base_pad';
  padMesh.position.y = PAD_H * 0.5;
  padMesh.castShadow = true;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // 2. Cylindrical base body
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H - PAD_H, 32);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.name = 'base_body';
  baseMesh.position.y = PAD_H + (BASE_H - PAD_H) * 0.5;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. Neck stem
  const neckGeo = new THREE.CylinderGeometry(NECK_R, NECK_R, NECK_H, 24);
  const neckMesh = new THREE.Mesh(neckGeo, neckMat);
  neckMesh.name = 'neck_stem';
  neckMesh.position.y = BASE_H + NECK_H * 0.5 - 0.005;
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  group.add(neckMesh);

  // 4. Bulb socket
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R, SOCKET_R * 0.92, SOCKET_H, 24);
  const socketMesh = new THREE.Mesh(socketGeo, socketMat);
  socketMesh.name = 'bulb_socket';
  socketMesh.position.y = BASE_H + NECK_H - 0.005 + SOCKET_H * 0.5;
  socketMesh.castShadow = true;
  socketMesh.receiveShadow = true;
  group.add(socketMesh);

  // 5. Emissive bulb inside shade
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 20, 16);
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.name = 'emit_bulb';
  bulbMesh.position.y = BASE_H + NECK_H - 0.005 + SOCKET_H + BULB_R * 0.7;
  bulbMesh.castShadow = true;
  bulbMesh.receiveShadow = true;
  group.add(bulbMesh);

  // 6. Shade inner core (open-ended tapered cylinder)
  const shadeCoreGeo = new THREE.CylinderGeometry(SHADE_R_TOP, SHADE_R_BOT, SHADE_H, 32, 1, true);
  const shadeCoreMesh = new THREE.Mesh(shadeCoreGeo, shadeCoreMat);
  shadeCoreMesh.name = 'shade_core';
  shadeCoreMesh.position.y = SHADE_MID_Y;
  shadeCoreMesh.castShadow = true;
  shadeCoreMesh.receiveShadow = true;
  group.add(shadeCoreMesh);

  // 7. Shade top & bottom trim rings
  const topRingGeo = new THREE.TorusGeometry(SHADE_R_TOP, 0.003, 10, 32);
  const topRingMesh = new THREE.Mesh(topRingGeo, trimMat);
  topRingMesh.name = 'shade_top_ring';
  topRingMesh.rotation.x = Math.PI * 0.5;
  topRingMesh.position.y = SHADE_TOP_Y - 0.003;
  topRingMesh.castShadow = true;
  topRingMesh.receiveShadow = true;
  group.add(topRingMesh);

  const botRingGeo = new THREE.TorusGeometry(SHADE_R_BOT, 0.0035, 10, 32);
  const botRingMesh = new THREE.Mesh(botRingGeo, trimMat);
  botRingMesh.name = 'shade_bottom_ring';
  botRingMesh.rotation.x = Math.PI * 0.5;
  botRingMesh.position.y = SHADE_BOTTOM_Y + 0.0035;
  botRingMesh.castShadow = true;
  botRingMesh.receiveShadow = true;
  group.add(botRingMesh);

  // 8. Vertical pleats around the shade
  const pleatLen = Math.hypot(SHADE_H - 0.004, SHADE_R_BOT - SHADE_R_TOP);
  const pleatGeo = new THREE.CylinderGeometry(0.0055, 0.007, pleatLen, 8);
  for (let i = 0; i < PLEAT_COUNT; i++) {
    const angle = (i / PLEAT_COUNT) * Math.PI * 2;
    const pleat = new THREE.Mesh(pleatGeo, shadePleatMat);
    pleat.name = `shade_pleat_${String(i + 1).padStart(2, '0')}`;
    pleat.position.set(
      Math.cos(angle) * SHADE_R_MID,
      SHADE_MID_Y,
      Math.sin(angle) * SHADE_R_MID
    );
    pleat.rotation.order = 'YXZ';
    pleat.rotation.y = Math.atan2(Math.cos(angle), Math.sin(angle));
    pleat.rotation.x = -SHADE_TILT;
    pleat.castShadow = true;
    pleat.receiveShadow = true;
    group.add(pleat);
  }

  return group;
}
