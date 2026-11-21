function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SPK_W = 0.20;
  const SPK_H = 0.33;
  const SPK_D = 0.24;
  const GAP = 0.06;
  const WALL_T = 0.014;
  const RECESS_D = 0.012;

  const TWEETER_R = 0.044;
  const TWEETER_DOME_R = 0.014;
  const TWEETER_Y = 0.235;

  const WOOFER_R = 0.072;
  const WOOFER_Y = 0.105;

  const PORT_R = 0.022;
  const PORT_Y = 0.235;
  const PORT_Z = -0.025;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x7a5c43,
    roughness: 0.62,
    metalness: 0.04
  });

  const baffleMat = new THREE.MeshStandardMaterial({
    color: 0x85786c,
    roughness: 0.72,
    metalness: 0.05
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x8b7e72,
    roughness: 0.88,
    metalness: 0.02
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.45,
    metalness: 0.15
  });

  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x5c534c,
    roughness: 0.75,
    metalness: 0.05
  });

  const dustCapMat = new THREE.MeshStandardMaterial({
    color: 0x3b3530,
    roughness: 0.55,
    metalness: 0.1
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc9a959,
    roughness: 0.3,
    metalness: 0.85
  });

  function addMesh(parent, geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function buildCabinet(prefix, xOffset, sideSign) {
    const spk = new THREE.Group();
    spk.position.set(xOffset, 0, 0);
    group.add(spk);

    // Main cabinet body (slightly shorter in Z to leave room for recessed front rim)
    const bodyD = SPK_D - RECESS_D;
    addMesh(
      spk,
      new THREE.BoxGeometry(SPK_W, SPK_H, bodyD),
      walnutMat,
      `${prefix}_cabinet_body`,
      0, SPK_H / 2, -RECESS_D / 2
    );

    // Recessed front baffle
    addMesh(
      spk,
      new THREE.BoxGeometry(SPK_W - 2 * WALL_T, SPK_H - 2 * WALL_T, 0.004),
      baffleMat,
      `${prefix}_front_baffle`,
      0, SPK_H / 2, bodyD / 2 - RECESS_D / 2 + 0.001
    );

    // Front rim strips (top, bottom, left, right)
    const rimZ = SPK_D / 2 - RECESS_D / 2;
    addMesh(
      spk,
      new THREE.BoxGeometry(SPK_W, WALL_T, RECESS_D),
      walnutMat,
      `${prefix}_rim_top`,
      0, SPK_H - WALL_T / 2, rimZ
    );
    addMesh(
      spk,
      new THREE.BoxGeometry(SPK_W, WALL_T, RECESS_D),
      walnutMat,
      `${prefix}_rim_bottom`,
      0, WALL_T / 2, rimZ
    );
    addMesh(
      spk,
      new THREE.BoxGeometry(WALL_T, SPK_H - 2 * WALL_T, RECESS_D),
      walnutMat,
      `${prefix}_rim_left`,
      -SPK_W / 2 + WALL_T / 2, SPK_H / 2, rimZ
    );
    addMesh(
      spk,
      new THREE.BoxGeometry(WALL_T, SPK_H - 2 * WALL_T, RECESS_D),
      walnutMat,
      `${prefix}_rim_right`,
      SPK_W / 2 - WALL_T / 2, SPK_H / 2, rimZ
    );

    // Side bass reflex port (on outer side)
    const portX = sideSign * (SPK_W / 2);
    addMesh(
      spk,
      new THREE.TorusGeometry(PORT_R, 0.006, 12, 24),
      blackMat,
      `${prefix}_port_ring`,
      portX, PORT_Y, PORT_Z,
      0, Math.PI / 2, 0
    );
    addMesh(
      spk,
      new THREE.CylinderGeometry(PORT_R * 0.85, PORT_R * 0.85, 0.01, 24),
      blackMat,
      `${prefix}_port_throat`,
      portX - sideSign * 0.004, PORT_Y, PORT_Z,
      0, 0, Math.PI / 2
    );

    // Side terminal cup & binding posts (lower rear outer side)
    const termZ = -0.055;
    const termY = 0.075;
    addMesh(
      spk,
      new THREE.BoxGeometry(0.006, 0.068, 0.048),
      blackMat,
      `${prefix}_terminal_cup`,
      portX, termY, termZ
    );
    addMesh(
      spk,
      new THREE.CylinderGeometry(0.006, 0.006, 0.016, 16),
      brassMat,
      `${prefix}_binding_post_pos`,
      portX + sideSign * 0.008, termY - 0.01, termZ - 0.01,
      0, 0, Math.PI / 2
    );
    addMesh(
      spk,
      new THREE.CylinderGeometry(0.006, 0.006, 0.016, 16),
      brassMat,
      `${prefix}_binding_post_neg`,
      portX + sideSign * 0.008, termY - 0.01, termZ + 0.01,
      0, 0, Math.PI / 2
    );

    return spk;
  }

  const leftX = -(SPK_W / 2 + GAP / 2);
  const rightX = SPK_W / 2 + GAP / 2;

  // Left Speaker (with grille)
  const leftSpk = buildCabinet("left", leftX, -1);
  addMesh(
    leftSpk,
    new THREE.BoxGeometry(SPK_W - 2 * WALL_T - 0.004, SPK_H - 2 * WALL_T - 0.004, 0.01),
    grilleMat,
    "left_fabric_grille",
    0, SPK_H / 2, SPK_D / 2 - 0.004
  );

  // Right Speaker (exposed drivers)
  const rightSpk = buildCabinet("right", rightX, 1);
  const baffleFrontZ = (SPK_D - RECESS_D) / 2 - RECESS_D / 2 + 0.003;

  // 4 corner grille mounting sockets
  const sockX = SPK_W / 2 - WALL_T - 0.014;
  const sockYTop = SPK_H - WALL_T - 0.014;
  const sockYBot = WALL_T + 0.014;
  const sockets = [
    [-sockX, sockYTop, "tl"],
    [sockX, sockYTop, "tr"],
    [-sockX, sockYBot, "bl"],
    [sockX, sockYBot, "br"]
  ];
  for (const [sx, sy, tag] of sockets) {
    addMesh(
      rightSpk,
      new THREE.CylinderGeometry(0.005, 0.005, 0.004, 12),
      blackMat,
      `right_grille_socket_${tag}`,
      sx, sy, baffleFrontZ + 0.001,
      Math.PI / 2, 0, 0
    );
  }

  // Tweeter
  addMesh(
    rightSpk,
    new THREE.CylinderGeometry(TWEETER_R, TWEETER_R, 0.005, 28),
    blackMat,
    "right_tweeter_faceplate",
    0, TWEETER_Y, baffleFrontZ + 0.002,
    Math.PI / 2, 0, 0
  );
  addMesh(
    rightSpk,
    new THREE.SphereGeometry(TWEETER_DOME_R, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    blackMat,
    "right_tweeter_dome",
    0, TWEETER_Y, baffleFrontZ + 0.004,
    Math.PI / 2, 0, 0
  );

  // Woofer
  addMesh(
    rightSpk,
    new THREE.TorusGeometry(WOOFER_R, 0.006, 12, 32),
    blackMat,
    "right_woofer_trim",
    0, WOOFER_Y, baffleFrontZ + 0.003
  );
  addMesh(
    rightSpk,
    new THREE.TorusGeometry(WOOFER_R * 0.84, 0.008, 12, 32),
    blackMat,
    "right_woofer_surround",
    0, WOOFER_Y, baffleFrontZ + 0.002
  );
  addMesh(
    rightSpk,
    new THREE.CylinderGeometry(WOOFER_R * 0.28, WOOFER_R * 0.78, 0.016, 32),
    coneMat,
    "right_woofer_cone",
    0, WOOFER_Y, baffleFrontZ - 0.004,
    Math.PI / 2, 0, 0
  );
  addMesh(
    rightSpk,
    new THREE.SphereGeometry(WOOFER_R * 0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    dustCapMat,
    "right_woofer_dust_cap",
    0, WOOFER_Y, baffleFrontZ + 0.001,
    Math.PI / 2, 0, 0
  );

  return group;
}
