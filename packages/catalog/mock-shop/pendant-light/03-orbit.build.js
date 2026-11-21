function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.65;
  const TOTAL_H = 0.85;
  const CANOPY_R = 0.065;
  const CANOPY_H = 0.03;
  const ROD_R = 0.009;
  const HUB_BOT_Y = 0.14;
  const HUB_TOP_Y = 0.25;
  const GLOBE_R = 0.085;
  const ARM_R = DIAMETER / 2 - GLOBE_R; // 0.24 m
  const ARM_TUBE_R = 0.008;
  const GLOBE_Y = 0.22;
  const SOCKET_R = 0.034;
  const SOCKET_H = 0.022;
  const SOCKET_Y = GLOBE_Y - GLOBE_R + 0.006;
  const ARM_COUNT = 5;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    metalness: 0.85,
    roughness: 0.32,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xfaf6ee,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.82,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffdfaa,
    emissiveIntensity: 1.5,
    roughness: 0.2,
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

  // Ceiling canopy
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  addMesh(canopyGeo, brassMat, 'canopy_plate', [0, TOTAL_H - CANOPY_H / 2, 0]);

  const collarGeo = new THREE.CylinderGeometry(ROD_R * 1.8, ROD_R * 1.4, 0.016, 24);
  addMesh(collarGeo, brassMat, 'canopy_collar', [0, TOTAL_H - CANOPY_H - 0.008, 0]);

  // Downrod
  const rodH = TOTAL_H - CANOPY_H - HUB_TOP_Y;
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, rodH, 20);
  addMesh(rodGeo, brassMat, 'downrod', [0, HUB_TOP_Y + rodH / 2, 0]);

  // Central hub (turned profile)
  const hubPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.03, 0.0),
    new THREE.Vector2(0.032, 0.025),
    new THREE.Vector2(0.028, 0.045),
    new THREE.Vector2(0.018, 0.075),
    new THREE.Vector2(ROD_R * 1.2, 0.11),
    new THREE.Vector2(0.0, 0.11),
  ];
  const hubGeo = new THREE.LatheGeometry(hubPoints, 28);
  addMesh(hubGeo, brassMat, 'central_hub', [0, HUB_BOT_Y, 0]);

  // Shared geometries for arms, sockets, globes, and bulbs
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R, SOCKET_R * 0.45, SOCKET_H, 24);
  const globeGeo = new THREE.SphereGeometry(GLOBE_R, 28, 20);
  const bulbGeo = new THREE.SphereGeometry(GLOBE_R * 0.38, 16, 12);

  for (let i = 0; i < ARM_COUNT; i++) {
    const angle = (i * Math.PI * 2) / ARM_COUNT;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Curved arm from hub bottom down to y = ARM_TUBE_R, then up to socket
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.018 * cosA, HUB_BOT_Y + 0.01, 0.018 * sinA),
      new THREE.Vector3(0.035 * cosA, 0.06, 0.035 * sinA),
      new THREE.Vector3(0.115 * cosA, ARM_TUBE_R, 0.115 * sinA),
      new THREE.Vector3(0.205 * cosA, 0.055, 0.205 * sinA),
      new THREE.Vector3(ARM_R * cosA, SOCKET_Y - SOCKET_H * 0.4, ARM_R * sinA),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 28, ARM_TUBE_R, 12, false);
    addMesh(armGeo, brassMat, `chandelier_arm_${i}`);

    // Socket cup
    addMesh(socketGeo, brassMat, `socket_cup_${i}`, [
      ARM_R * cosA,
      SOCKET_Y,
      ARM_R * sinA,
    ]);

    // Frosted glass globe
    addMesh(globeGeo, glassMat, `glass_globe_${i}`, [
      ARM_R * cosA,
      GLOBE_Y,
      ARM_R * sinA,
    ]);

    // Emissive bulb inside globe
    addMesh(bulbGeo, bulbMat, `emit_bulb_${i}`, [
      ARM_R * cosA,
      GLOBE_Y,
      ARM_R * sinA,
    ]);
  }

  return group;
}
