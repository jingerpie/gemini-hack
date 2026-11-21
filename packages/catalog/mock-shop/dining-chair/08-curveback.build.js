function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const D = 0.52;
  const H = 0.78;
  const SEAT_H = 0.45;
  const SEAT_W = 0.45;
  const SEAT_D = 0.43;
  const SEAT_THICK = 0.042;
  const APRON_H = 0.045;
  const APRON_THICK = 0.022;
  const LEG_R_TOP = 0.017;
  const LEG_R_BOT = 0.013;
  const GLIDE_H = 0.006;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc59f75,
    roughness: 0.65,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcabca6,
    roughness: 0.9,
    metalness: 0.0
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2a2520,
    roughness: 0.8,
    metalness: 0.05
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

  // Helper: create a tapered leg between two 3D points
  function createLeg(pTop, pBot, rTop, rBot, mat, name) {
    const dir = new THREE.Vector3().subVectors(pTop, pBot);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.copy(pBot).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Leg coordinates
  const frontTopX = 0.195;
  const frontTopZ = 0.185;
  const frontBotX = 0.22;
  const frontBotZ = 0.215;

  const backTopX = 0.175;
  const backTopZ = -0.175;
  const backBotX = 0.205;
  const backBotZ = -0.225;

  const apronTopY = SEAT_H - SEAT_THICK * 0.6;
  const apronBotY = apronTopY - APRON_H;

  // Front legs
  const flTop = new THREE.Vector3(-frontTopX, apronTopY, frontTopZ);
  const flBot = new THREE.Vector3(-frontBotX, GLIDE_H, frontBotZ);
  createLeg(flTop, flBot, LEG_R_TOP, LEG_R_BOT, oakMat, 'front_left_leg');

  const frTop = new THREE.Vector3(frontTopX, apronTopY, frontTopZ);
  const frBot = new THREE.Vector3(frontBotX, GLIDE_H, frontBotZ);
  createLeg(frTop, frBot, LEG_R_TOP, LEG_R_BOT, oakMat, 'front_right_leg');

  // Back legs (lower section from floor to apron)
  const blMid = new THREE.Vector3(-backTopX, apronTopY, backTopZ);
  const blBot = new THREE.Vector3(-backBotX, GLIDE_H, backBotZ);
  createLeg(blMid, blBot, LEG_R_TOP, LEG_R_BOT, oakMat, 'back_left_leg_lower');

  const brMid = new THREE.Vector3(backTopX, apronTopY, backTopZ);
  const brBot = new THREE.Vector3(backBotX, GLIDE_H, backBotZ);
  createLeg(brMid, brBot, LEG_R_TOP, LEG_R_BOT, oakMat, 'back_right_leg_lower');

  // Back legs (upper backrest posts)
  const postTopY = H - 0.09;
  const postTopZ = -0.225;
  const postTopX = 0.17;
  const blPostTop = new THREE.Vector3(-postTopX, postTopY, postTopZ);
  const brPostTop = new THREE.Vector3(postTopX, postTopY, postTopZ);
  createLeg(blPostTop, blMid, LEG_R_BOT * 1.1, LEG_R_TOP, oakMat, 'back_left_post');
  createLeg(brPostTop, brMid, LEG_R_BOT * 1.1, LEG_R_TOP, oakMat, 'back_right_post');

  // Floor glides
  const glideGeo = new THREE.CylinderGeometry(LEG_R_BOT * 0.95, LEG_R_BOT * 0.9, GLIDE_H, 16);
  addMesh(glideGeo, glideMat, 'glide_front_left', [-frontBotX, GLIDE_H * 0.5, frontBotZ]);
  addMesh(glideGeo, glideMat, 'glide_front_right', [frontBotX, GLIDE_H * 0.5, frontBotZ]);
  addMesh(glideGeo, glideMat, 'glide_back_left', [-backBotX, GLIDE_H * 0.5, backBotZ]);
  addMesh(glideGeo, glideMat, 'glide_back_right', [backBotX, GLIDE_H * 0.5, backBotZ]);

  // Seat apron rails
  const railY = apronBotY + APRON_H * 0.5;

  // Front rail
  const frontRailW = frontTopX * 2;
  const frontRailGeo = new THREE.BoxGeometry(frontRailW, APRON_H, APRON_THICK);
  addMesh(frontRailGeo, oakMat, 'front_apron_rail', [0, railY, frontTopZ]);

  // Back rail
  const backRailW = backTopX * 2;
  const backRailGeo = new THREE.BoxGeometry(backRailW, APRON_H, APRON_THICK);
  addMesh(backRailGeo, oakMat, 'back_apron_rail', [0, railY, backTopZ]);

  // Side rails
  function createRailBetween(p1, p2, name) {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const geo = new THREE.BoxGeometry(APRON_THICK, APRON_H, len);
    addMesh(
      geo,
      oakMat,
      name,
      [(p1.x + p2.x) * 0.5, railY, (p1.z + p2.z) * 0.5],
      [0, angle, 0]
    );
  }

  createRailBetween(
    new THREE.Vector3(-frontTopX, railY, frontTopZ),
    new THREE.Vector3(-backTopX, railY, backTopZ),
    'left_apron_rail'
  );
  createRailBetween(
    new THREE.Vector3(frontTopX, railY, frontTopZ),
    new THREE.Vector3(backTopX, railY, backTopZ),
    'right_apron_rail'
  );

  // Upholstered seat cushion (rounded rectangle extruded with bevel)
  const seatShape = new THREE.Shape();
  const sw = SEAT_W * 0.5 - 0.03;
  const sd = SEAT_D * 0.5 - 0.03;
  const sr = 0.055;
  seatShape.moveTo(-sw + sr, -sd);
  seatShape.lineTo(sw - sr, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + sr);
  seatShape.lineTo(sw, sd - sr);
  seatShape.quadraticCurveTo(sw, sd, sw - sr, sd);
  seatShape.lineTo(-sw + sr, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - sr);
  seatShape.lineTo(-sw, -sd + sr);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + sr, -sd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK * 0.45,
    bevelEnabled: true,
    bevelThickness: SEAT_THICK * 0.35,
    bevelSize: 0.03,
    bevelSegments: 5,
    curveSegments: 16
  });
  seatGeo.rotateX(Math.PI * 0.5);
  seatGeo.center();
  addMesh(seatGeo, fabricMat, 'seat_cushion', [0, SEAT_H - SEAT_THICK * 0.35, 0.01]);

  // Curved wooden backrest
  const backW = 0.44;
  const backH = 0.22;
  const backThick = 0.018;
  const br = 0.065;
  const bw = backW * 0.5 - 0.01;
  const bh = backH * 0.5 - 0.01;

  const backShape = new THREE.Shape();
  backShape.moveTo(-bw + br, -bh);
  backShape.lineTo(bw - br, -bh);
  backShape.quadraticCurveTo(bw, -bh, bw, -bh + br);
  backShape.lineTo(bw, bh - br);
  backShape.quadraticCurveTo(bw, bh, bw - br, bh);
  backShape.lineTo(-bw + br, bh);
  backShape.quadraticCurveTo(-bw, bh, -bw, bh - br);
  backShape.lineTo(-bw, -bh + br);
  backShape.quadraticCurveTo(-bw, -bh, -bw + br, -bh);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: backThick,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16
  });
  backGeo.center();

  // Apply gentle concave curvature along X
  const posAttr = backGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    posAttr.setZ(i, z + 1.15 * x * x);
  }
  backGeo.computeVertexNormals();

  addMesh(
    backGeo,
    oakMat,
    'curved_backrest',
    [0, H - backH * 0.5 - 0.005, -0.225],
    [-0.14, 0, 0]
  );

  return group;
}
