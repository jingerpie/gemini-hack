function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.52;
  const D = 0.54;
  const H = 0.80;
  const SEAT_H = 0.45;
  const SEAT_W = 0.46;
  const SEAT_D = 0.44;
  const SHELL_THICK = 0.016;
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

  // 4. Wrap-around wooden backrest shell
  // Lower/side wrap-around cylinder arc
  const shellRadius = 0.235;
  const shellHeight = 0.23;
  const shellGeo = new THREE.CylinderGeometry(
    shellRadius,
    shellRadius,
    shellHeight,
    32,
    1,
    true,
    Math.PI * 0.42,
    Math.PI * 1.16
  );
  // Thicken the shell by adding a slightly smaller inner cylinder or using a torus/tube rim
  addMesh(shellGeo, woodMat, 'backrest_wood_shell_lower', [0, SEAT_H + shellHeight / 2 - 0.005, -0.01]);

  const shellInnerGeo = new THREE.CylinderGeometry(
    shellRadius - SHELL_THICK,
    shellRadius - SHELL_THICK,
    shellHeight,
    32,
    1,
    true,
    Math.PI * 0.42,
    Math.PI * 1.16
  );
  // Flip normals for inner face by scaling X by -1? Better: use DoubleSide or a second mesh
  woodMat.side = THREE.DoubleSide;
  addMesh(shellInnerGeo, woodMat, 'backrest_wood_shell_inner', [0, SEAT_H + shellHeight / 2 - 0.005, -0.01]);

  // Arched upper wooden backrest
  const archShape = new THREE.Shape();
  const aw = 0.21;
  const ah = H - SEAT_H;
  archShape.moveTo(-aw, 0.08);
  archShape.lineTo(-aw, ah - 0.14);
  archShape.quadraticCurveTo(-aw, ah, 0, ah);
  archShape.quadraticCurveTo(aw, ah, aw, ah - 0.14);
  archShape.lineTo(aw, 0.08);
  archShape.lineTo(-aw, 0.08);

  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: SHELL_THICK,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 20,
  });
  addMesh(archGeo, woodMat, 'backrest_wood_arch', [0, SEAT_H - 0.005, -0.235]);

  // Smooth wooden rim tube framing the arched backrest
  const rimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.228, SEAT_H + 0.02,  0.04),
    new THREE.Vector3(-0.232, SEAT_H + 0.18, -0.08),
    new THREE.Vector3(-0.185, H - 0.04,      -0.20),
    new THREE.Vector3( 0.0,   H - 0.008,     -0.232),
    new THREE.Vector3( 0.185, H - 0.04,      -0.20),
    new THREE.Vector3( 0.232, SEAT_H + 0.18, -0.08),
    new THREE.Vector3( 0.228, SEAT_H + 0.02,  0.04),
  ]);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 32, 0.011, 12, false);
  addMesh(rimGeo, woodMat, 'backrest_wood_rim', [0, 0, 0]);

  // 5. Upholstered backrest cushion (sits inside the wooden shell)
  const backCushionShape = new THREE.Shape();
  const bw = 0.165;
  const bh = ah - 0.035;
  backCushionShape.moveTo(-bw, 0.02);
  backCushionShape.lineTo(-bw - 0.01, bh * 0.45);
  backCushionShape.quadraticCurveTo(-bw, bh, 0, bh);
  backCushionShape.quadraticCurveTo(bw, bh, bw + 0.01, bh * 0.45);
  backCushionShape.lineTo(bw, 0.02);
  backCushionShape.quadraticCurveTo(0, 0.005, -bw, 0.02);

  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.018,
    bevelSegments: 6,
    curveSegments: 20,
  });
  addMesh(backCushionGeo, fabricMat, 'backrest_cushion', [0, SEAT_H + 0.01, -0.205], [-0.06, 0, 0]);

  return group;
}
