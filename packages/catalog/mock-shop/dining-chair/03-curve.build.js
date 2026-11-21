function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.52;
  const D = 0.54;
  const H = 0.80;
  const SEAT_H = 0.45;
  const SEAT_W = 0.46;
  const SEAT_D = 0.44;
  const BACK_H = H - SEAT_H;
  const SHELL_THICK = 0.016;
  const SHELL_R_OUT = 0.235;
  const SHELL_R_IN = SHELL_R_OUT - SHELL_THICK;
  const LEG_TOP_R = 0.022;
  const LEG_BOT_R = 0.014;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88655,
    roughness: 0.48,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9e9589,
    roughness: 0.68,
    metalness: 0.02,
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x7a746c,
    roughness: 0.45,
    metalness: 0.25,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2927,
    roughness: 0.8,
    metalness: 0.05,
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

  // 1. Four tapered splayed legs + floor glides
  const legConfigs = [
    { name: 'leg_front_left',  top: [-0.175, SEAT_H - 0.03,  0.155], bot: [-0.215, 0.008,  0.205] },
    { name: 'leg_front_right', top: [ 0.175, SEAT_H - 0.03,  0.155], bot: [ 0.215, 0.008,  0.205] },
    { name: 'leg_back_left',   top: [-0.155, SEAT_H - 0.03, -0.155], bot: [-0.185, 0.008, -0.215] },
    { name: 'leg_back_right',  top: [ 0.155, SEAT_H - 0.03, -0.155], bot: [ 0.185, 0.008, -0.215] },
  ];

  const upVec = new THREE.Vector3(0, 1, 0);
  legConfigs.forEach((cfg) => {
    const pTop = new THREE.Vector3(...cfg.top);
    const pBot = new THREE.Vector3(...cfg.bot);
    const dir = new THREE.Vector3().subVectors(pTop, pBot);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(pTop, pBot).multiplyScalar(0.5);

    const legGeo = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, len, 20);
    const legMesh = new THREE.Mesh(legGeo, woodMat);
    legMesh.name = cfg.name;
    legMesh.position.copy(mid);
    legMesh.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    // Floor glide touching y = 0
    const glideGeo = new THREE.CylinderGeometry(LEG_BOT_R * 0.95, LEG_BOT_R * 0.85, 0.008, 16);
    addMesh(glideGeo, glideMat, cfg.name + '_glide', [cfg.bot[0], 0.004, cfg.bot[2]]);

    // Under-seat mounting bracket
    const bracketGeo = new THREE.BoxGeometry(0.036, 0.028, 0.042);
    addMesh(
      bracketGeo,
      bracketMat,
      cfg.name + '_bracket',
      [cfg.top[0] * 0.92, SEAT_H - 0.025, cfg.top[2] * 0.92]
    );
  });

  // Under-seat cross support frame
  const crossGeoX = new THREE.BoxGeometry(0.32, 0.02, 0.03);
  addMesh(crossGeoX, bracketMat, 'under_seat_crossbar_front', [0, SEAT_H - 0.022, 0.12]);
  addMesh(crossGeoX, bracketMat, 'under_seat_crossbar_back', [0, SEAT_H - 0.022, -0.12]);

  // 2. Wooden seat base (rounded oval/squircle)
  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2;
  const sd = SEAT_D / 2;
  seatShape.moveTo(-sw + 0.08, -sd);
  seatShape.lineTo(sw - 0.08, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + 0.08);
  seatShape.lineTo(sw, sd - 0.09);
  seatShape.quadraticCurveTo(sw, sd, sw - 0.1, sd);
  seatShape.lineTo(-sw + 0.1, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - 0.09);
  seatShape.lineTo(-sw, -sd + 0.08);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + 0.08, -sd);

  const seatBaseGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 4,
    curveSegments: 16,
  });
  seatBaseGeo.rotateX(Math.PI / 2);
  addMesh(seatBaseGeo, woodMat, 'seat_wood_base', [0, SEAT_H - 0.002, 0.01]);

  // 3. Upholstered seat cushion
  const cushionGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.012,
    bevelSegments: 6,
    curveSegments: 16,
  });
  cushionGeo.rotateX(Math.PI / 2);
  addMesh(cushionGeo, fabricMat, 'seat_cushion', [0, SEAT_H + 0.028, 0.01]);

  // 4. Continuous U-shaped bent-plywood backrest shell
  const shellStart = -Math.PI * 0.08;
  const shellEnd = Math.PI * 1.08;
  const shellShape = new THREE.Shape();
  shellShape.absarc(0, 0, SHELL_R_OUT, shellStart, shellEnd, false);
  shellShape.absarc(0, 0, SHELL_R_IN, shellEnd, shellStart, true);
  shellShape.closePath();

  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: BACK_H,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.005,
    bevelSegments: 4,
    curveSegments: 32,
  });
  shellGeo.rotateX(-Math.PI / 2);
  addMesh(shellGeo, woodMat, 'backrest_wood_shell', [0, SEAT_H - 0.002, -0.01]);

  // 5. Curved upholstered backrest pad following the inside of the shell
  const padStart = -Math.PI * 0.02;
  const padEnd = Math.PI * 1.02;
  const padROut = SHELL_R_IN - 0.001;
  const padRIn = padROut - 0.036;
  const padShape = new THREE.Shape();
  padShape.absarc(0, 0, padROut, padStart, padEnd, false);
  padShape.absarc(0, 0, padRIn, padEnd, padStart, true);
  padShape.closePath();

  const padGeo = new THREE.ExtrudeGeometry(padShape, {
    depth: BACK_H - 0.045,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.01,
    bevelSegments: 6,
    curveSegments: 32,
  });
  padGeo.rotateX(-Math.PI / 2);
  addMesh(padGeo, fabricMat, 'backrest_cushion', [0, SEAT_H + 0.022, -0.01]);

  return group;
}
