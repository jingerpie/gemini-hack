function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.50;
  const H = 0.74;

  const TOP_T = 0.022;
  const LAMINATE_T = 0.003;
  const PLY_T = TOP_T - LAMINATE_T;
  const CORNER_R = 0.025;

  const FOOT_H = 0.010;
  const FOOT_R = 0.012;
  const LEG_R_TOP = 0.014;
  const LEG_R_BOT = 0.011;

  // Leg top and bottom centers (splayed slightly outward toward the floor)
  const LEG_TOP_X = W / 2 - 0.065;
  const LEG_TOP_Z = D / 2 - 0.055;
  const LEG_BOT_X = W / 2 - 0.045;
  const LEG_BOT_Z = D / 2 - 0.040;

  const LEG_TOP_Y = H - TOP_T;
  const LEG_BOT_Y = FOOT_H;

  const STRETCHER_Y = 0.21;
  const STRETCHER_H = 0.028;
  const STRETCHER_T = 0.012;

  // Materials
  const matLaminate = new THREE.MeshStandardMaterial({
    color: 0xd0d4d6,
    roughness: 0.65,
    metalness: 0.05,
  });

  const matPlywood = new THREE.MeshStandardMaterial({
    color: 0xb89b78,
    roughness: 0.72,
    metalness: 0.02,
  });

  const matFrame = new THREE.MeshStandardMaterial({
    color: 0x383e42,
    roughness: 0.45,
    metalness: 0.55,
  });

  const matTray = new THREE.MeshStandardMaterial({
    color: 0x7b8287,
    roughness: 0.50,
    metalness: 0.40,
  });

  const matFoot = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.80,
    metalness: 0.10,
  });

  function makeRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Desktop (plywood core + grey laminate top)
  const topShape = makeRoundedRectShape(W, D, CORNER_R);

  const plyGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: PLY_T,
    bevelEnabled: false,
    curveSegments: 12,
  });
  plyGeo.rotateX(Math.PI / 2);
  const plyMesh = new THREE.Mesh(plyGeo, matPlywood);
  plyMesh.position.y = H - LAMINATE_T;
  addMesh(plyMesh, 'desktop_plywood');

  const lamGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: LAMINATE_T,
    bevelEnabled: false,
    curveSegments: 12,
  });
  lamGeo.rotateX(Math.PI / 2);
  const lamMesh = new THREE.Mesh(lamGeo, matLaminate);
  lamMesh.position.y = H;
  addMesh(lamMesh, 'desktop_laminate');

  // 2. Under-desk shallow tray/drawer
  const trayW = 0.42;
  const trayD = 0.24;
  const trayH = 0.022;
  const trayGeo = new THREE.BoxGeometry(trayW, trayH, trayD);
  const trayMesh = new THREE.Mesh(trayGeo, matTray);
  trayMesh.position.set(0, H - TOP_T - trayH / 2, D / 2 - trayD / 2 - 0.035);
  addMesh(trayMesh, 'under_desk_tray');

  // 3. Legs, top brackets, and leveling feet
  const legCorners = [
    { key: 'fl', sx: -1, sz: 1 },
    { key: 'fr', sx: 1, sz: 1 },
    { key: 'bl', sx: -1, sz: -1 },
    { key: 'br', sx: 1, sz: -1 },
  ];

  const upVec = new THREE.Vector3(0, 1, 0);

  for (const c of legCorners) {
    const topPos = new THREE.Vector3(c.sx * LEG_TOP_X, LEG_TOP_Y, c.sz * LEG_TOP_Z);
    const botPos = new THREE.Vector3(c.sx * LEG_BOT_X, LEG_BOT_Y, c.sz * LEG_BOT_Z);
    const dir = new THREE.Vector3().subVectors(topPos, botPos);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(topPos, botPos).multiplyScalar(0.5);

    const legGeo = new THREE.CylinderGeometry(LEG_R_TOP, LEG_R_BOT, len, 20);
    const legMesh = new THREE.Mesh(legGeo, matFrame);
    legMesh.position.copy(mid);
    legMesh.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
    addMesh(legMesh, `leg_${c.key}`);

    // Flared mounting bracket at top of leg
    const bracketH = 0.028;
    const bracketGeo = new THREE.CylinderGeometry(0.028, LEG_R_TOP * 1.05, bracketH, 20);
    const bracketMesh = new THREE.Mesh(bracketGeo, matFrame);
    bracketMesh.position.set(topPos.x, LEG_TOP_Y - bracketH / 2 + 0.002, topPos.z);
    addMesh(bracketMesh, `leg_bracket_${c.key}`);

    // Leveling foot at bottom of leg
    const footGeo = new THREE.CylinderGeometry(FOOT_R * 0.9, FOOT_R, FOOT_H, 16);
    const footMesh = new THREE.Mesh(footGeo, matFoot);
    footMesh.position.set(botPos.x, FOOT_H / 2, botPos.z);
    addMesh(footMesh, `foot_${c.key}`);
  }

  // Interpolate X and Z at STRETCHER_Y along the leg
  const tStretcher = (STRETCHER_Y - LEG_BOT_Y) / (LEG_TOP_Y - LEG_BOT_Y);
  const stX = LEG_BOT_X + (LEG_TOP_X - LEG_BOT_X) * tStretcher;
  const stZ = LEG_BOT_Z + (LEG_TOP_Z - LEG_BOT_Z) * tStretcher;

  // 4. Side stretchers (left and right)
  const sideLen = stZ * 2;
  const sideGeo = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, sideLen);

  const sideL = new THREE.Mesh(sideGeo, matFrame);
  sideL.position.set(-stX, STRETCHER_Y, 0);
  addMesh(sideL, 'side_stretcher_l');

  const sideR = new THREE.Mesh(sideGeo, matFrame);
  sideR.position.set(stX, STRETCHER_Y, 0);
  addMesh(sideR, 'side_stretcher_r');

  // 5. Rear horizontal stretcher connecting left and right side stretchers
  const rearLen = stX * 2;
  const rearGeo = new THREE.BoxGeometry(rearLen, STRETCHER_H, STRETCHER_T);
  const rearMesh = new THREE.Mesh(rearGeo, matFrame);
  rearMesh.position.set(0, STRETCHER_Y, -stZ + 0.02);
  addMesh(rearMesh, 'rear_stretcher');

  return group;
}
