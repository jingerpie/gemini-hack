function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.48;
  const D = 0.46;
  const SEAT_H = 0.65;
  const TOTAL_H = 0.90;

  const LEG_TOP_Y = SEAT_H - 0.028;
  const LEG_R_TOP = 0.019;
  const LEG_R_BOT = 0.013;

  const TOP_X = 0.185;
  const TOP_Z = 0.165;
  const BOT_X = 0.225;
  const BOT_Z = 0.205;

  const FOOTREST_Y = 0.22;
  const FOOTREST_R = 0.009;

  // Materials
  const legWoodMat = new THREE.MeshStandardMaterial({
    color: 0x9b7248,
    roughness: 0.65,
    metalness: 0.02,
  });

  const shellWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc9a579,
    roughness: 0.55,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9c9890,
    roughness: 0.92,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x767676,
    roughness: 0.35,
    metalness: 0.75,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    group.add(mesh);
    return mesh;
  }

  // 1. Four tapered, splayed wooden legs
  const legDefs = [
    { name: 'leg_front_left', sx: -1, sz: 1 },
    { name: 'leg_front_right', sx: 1, sz: 1 },
    { name: 'leg_back_left', sx: -1, sz: -1 },
    { name: 'leg_back_right', sx: 1, sz: -1 },
  ];

  const upVec = new THREE.Vector3(0, 1, 0);
  for (const d of legDefs) {
    const bot = new THREE.Vector3(d.sx * BOT_X, 0, d.sz * BOT_Z);
    const top = new THREE.Vector3(d.sx * TOP_X, LEG_TOP_Y, d.sz * TOP_Z);
    const dir = new THREE.Vector3().subVectors(top, bot);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(bot, top).multiplyScalar(0.5);

    const legGeo = new THREE.CylinderGeometry(LEG_R_TOP, LEG_R_BOT, len, 20);
    const legMesh = new THREE.Mesh(legGeo, legWoodMat);
    legMesh.name = d.name;
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legMesh.position.copy(mid);
    legMesh.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
    group.add(legMesh);
  }

  // 2. Under-seat wooden apron rails
  const railH = 0.032;
  const railT = 0.022;
  const railY = LEG_TOP_Y - railH * 0.5 - 0.005;

  const frontBackRailGeo = new THREE.BoxGeometry(TOP_X * 2, railH, railT);
  addMesh(frontBackRailGeo, legWoodMat, 'apron_front', [0, railY, TOP_Z - 0.005]);
  addMesh(frontBackRailGeo, legWoodMat, 'apron_back', [0, railY, -TOP_Z + 0.005]);

  const sideRailGeo = new THREE.BoxGeometry(railT, railH, TOP_Z * 2);
  addMesh(sideRailGeo, legWoodMat, 'apron_left', [-TOP_X + 0.005, railY, 0]);
  addMesh(sideRailGeo, legWoodMat, 'apron_right', [TOP_X - 0.005, railY, 0]);

  // 3. H-shaped metal footrest
  const tFoot = FOOTREST_Y / LEG_TOP_Y;
  const footX = BOT_X + (TOP_X - BOT_X) * tFoot;
  const footZ = BOT_Z + (TOP_Z - BOT_Z) * tFoot;

  const fbBarGeo = new THREE.CylinderGeometry(FOOTREST_R, FOOTREST_R, footX * 2, 16);
  addMesh(fbBarGeo, metalMat, 'footrest_front', [0, FOOTREST_Y, footZ], [0, 0, Math.PI / 2]);
  addMesh(fbBarGeo, metalMat, 'footrest_back', [0, FOOTREST_Y, -footZ], [0, 0, Math.PI / 2]);

  const centerBarGeo = new THREE.CylinderGeometry(FOOTREST_R, FOOTREST_R, footZ * 2, 16);
  addMesh(centerBarGeo, metalMat, 'footrest_center', [0, FOOTREST_Y, 0], [Math.PI / 2, 0, 0]);

  // 4. Bentwood seat pan
  const seatPanShape = new THREE.Shape();
  const sw = W * 0.48;
  const sd = D * 0.46;
  seatPanShape.absellipse(0, 0, sw, sd, 0, Math.PI * 2, false, 0);

  const seatPanGeo = new THREE.ExtrudeGeometry(seatPanShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 28,
  });
  seatPanGeo.rotateX(Math.PI / 2);
  addMesh(seatPanGeo, shellWoodMat, 'seat_pan', [0, LEG_TOP_Y + 0.016, 0.005]);

  // 5. Upholstered seat cushion
  const cushionGeo = new THREE.SphereGeometry(1, 28, 16);
  cushionGeo.scale(W * 0.45, 0.026, D * 0.43);
  addMesh(cushionGeo, fabricMat, 'seat_cushion', [0, SEAT_H - 0.006, 0.01]);

  // 6. Curved bentwood backrest shell
  const backOuterR = W * 0.48;
  const backThickness = 0.014;
  const backInnerR = backOuterR - backThickness;
  const backArc = Math.PI * 1.05;
  const backStartAngle = Math.PI * 0.5 - backArc * 0.5;
  const backEndAngle = Math.PI * 0.5 + backArc * 0.5;

  const backShape = new THREE.Shape();
  backShape.absarc(0, 0, backOuterR, backStartAngle, backEndAngle, false);
  backShape.absarc(0, 0, backInnerR, backEndAngle, backStartAngle, true);
  backShape.closePath();

  const backH = TOTAL_H - (LEG_TOP_Y + 0.01);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: backH,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 28,
  });
  backGeo.rotateX(-Math.PI / 2);
  addMesh(backGeo, shellWoodMat, 'backrest_shell', [0, LEG_TOP_Y + 0.01, -0.01]);

  return group;
}
