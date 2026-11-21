function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.56;
  const BASE_R = 0.088;
  const BASE_H = 0.032;
  const COL_H = 0.318;
  const SOCKET_R = 0.018;
  const SOCKET_H = 0.042;
  const SHADE_TOP_R = 0.105;
  const SHADE_BOT_R = 0.172;
  const SHADE_H = 0.21;
  const SHADE_BOT_Y = TOTAL_H - SHADE_H;
  const PLEAT_COUNT = 24;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3b2214,
    roughness: 0.36,
    metalness: 0.04
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x241e1a,
    roughness: 0.42,
    metalness: 0.72
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a39,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const linerMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3b0,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd580,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Turned wooden base (LatheGeometry)
  const basePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BASE_R, 0),
    new THREE.Vector2(BASE_R, BASE_H * 0.45),
    new THREE.Vector2(BASE_R * 0.92, BASE_H * 0.65),
    new THREE.Vector2(BASE_R * 0.78, BASE_H * 0.82),
    new THREE.Vector2(BASE_R * 0.42, BASE_H),
    new THREE.Vector2(0, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(baseGeo, woodMat, "wooden_base", 0, 0, 0);

  // 2. Turned wooden column (LatheGeometry)
  const colProfile = [
    [0.028, 0.00],
    [0.028, 0.06],
    [0.032, 0.09],
    [0.022, 0.12],
    [0.025, 0.15],
    [0.020, 0.19],
    [0.029, 0.34],
    [0.030, 0.45],
    [0.024, 0.62],
    [0.019, 0.74],
    [0.024, 0.78],
    [0.031, 0.82],
    [0.022, 0.86],
    [0.027, 0.90],
    [0.020, 0.94],
    [0.025, 0.97],
    [0.022, 1.00]
  ];
  const colPoints = colProfile.map(([r, t]) => new THREE.Vector2(r, t * COL_H));
  const colGeo = new THREE.LatheGeometry(colPoints, 28);
  addMesh(colGeo, woodMat, "turned_column", 0, BASE_H - 0.002, 0);

  // 3. Socket
  const socketY = BASE_H + COL_H - 0.004;
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R, SOCKET_R * 0.9, SOCKET_H, 20);
  addMesh(socketGeo, metalMat, "lamp_socket", 0, socketY + SOCKET_H * 0.5, 0);

  // 4. Emissive bulb
  const bulbY = socketY + SOCKET_H + 0.026;
  const bulbGeo = new THREE.SphereGeometry(0.028, 20, 16);
  bulbGeo.scale(1, 1.3, 1);
  addMesh(bulbGeo, bulbMat, "emit_bulb", 0, bulbY, 0);

  // 5. Spider wire arms holding the shade
  const spiderY = socketY + SOCKET_H * 0.75;
  const spiderLen = SHADE_BOT_R * 0.85;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const wireGeo = new THREE.CylinderGeometry(0.002, 0.002, spiderLen, 8);
    wireGeo.rotateZ(Math.PI / 2);
    const wire = addMesh(
      wireGeo,
      metalMat,
      `shade_spider_arm_${i + 1}`,
      Math.cos(angle) * (spiderLen * 0.5),
      spiderY,
      Math.sin(angle) * (spiderLen * 0.5)
    );
    wire.rotation.y = -angle;
  }

  // 6. Lampshade inner liner cone (open-ended)
  const shadeCenterY = SHADE_BOT_Y + SHADE_H * 0.5;
  const linerGeo = new THREE.CylinderGeometry(
    SHADE_TOP_R - 0.002,
    SHADE_BOT_R - 0.002,
    SHADE_H - 0.004,
    32,
    1,
    true
  );
  addMesh(linerGeo, linerMat, "shade_inner_liner", 0, shadeCenterY, 0);

  // 7. Lampshade outer fabric cone (open-ended)
  const outerShadeGeo = new THREE.CylinderGeometry(
    SHADE_TOP_R,
    SHADE_BOT_R,
    SHADE_H,
    32,
    1,
    true
  );
  addMesh(outerShadeGeo, shadeMat, "shade_fabric_body", 0, shadeCenterY, 0);

  // 8. Lampshade top and bottom fabric trim rings
  const topTrimGeo = new THREE.TorusGeometry(SHADE_TOP_R, 0.0045, 10, 32);
  topTrimGeo.rotateX(Math.PI / 2);
  addMesh(topTrimGeo, shadeMat, "shade_top_trim", 0, TOTAL_H - 0.002, 0);

  const botTrimGeo = new THREE.TorusGeometry(SHADE_BOT_R, 0.005, 10, 32);
  botTrimGeo.rotateX(Math.PI / 2);
  addMesh(botTrimGeo, shadeMat, "shade_bottom_trim", 0, SHADE_BOT_Y + 0.002, 0);

  // 9. Pleated fabric ribs around the shade
  const slopeAngle = Math.atan2(SHADE_BOT_R - SHADE_TOP_R, SHADE_H);
  const slantH = Math.hypot(SHADE_BOT_R - SHADE_TOP_R, SHADE_H);
  const midR = (SHADE_TOP_R + SHADE_BOT_R) * 0.5 + 0.002;
  const pleatGeo = new THREE.CylinderGeometry(0.0035, 0.0055, slantH - 0.006, 6);

  for (let i = 0; i < PLEAT_COUNT; i++) {
    const theta = (i * Math.PI * 2) / PLEAT_COUNT;
    const pleat = new THREE.Mesh(pleatGeo, shadeMat);
    pleat.name = `shade_pleat_${i + 1}`;
    pleat.position.set(
      Math.cos(theta) * midR,
      shadeCenterY,
      Math.sin(theta) * midR
    );
    pleat.rotation.order = "YXZ";
    pleat.rotation.y = -theta + Math.PI / 2;
    pleat.rotation.x = -slopeAngle;
    pleat.castShadow = true;
    pleat.receiveShadow = true;
    group.add(pleat);
  }

  return group;
}
