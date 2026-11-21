function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.38;
  const D = 0.38;
  const H = 0.36;

  const SEAT_THICK = 0.012;
  const SEAT_Y = H - SEAT_THICK - 0.004;

  const LEG_R = 0.011;
  const LEG_X = 0.142;
  const LEG_X_OFFSET = 0.008;
  const LEG_BOT_Z = 0.155;
  const LEG_TOP_Z = 0.142;
  const LEG_BOT_Y = 0.015;
  const LEG_TOP_Y = H - 0.02;

  const FOOT_R_TOP = 0.013;
  const FOOT_R_BOT = 0.015;
  const FOOT_H = 0.028;

  const HUB_Y = (LEG_BOT_Y + LEG_TOP_Y) * 0.48;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x6b4c35,
    roughness: 0.88,
    metalness: 0.02,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xa28650,
    roughness: 0.34,
    metalness: 0.78,
  });

  const darkPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x282523,
    roughness: 0.65,
    metalness: 0.08,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.88,
    metalness: 0.02,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Seat fabric (rounded square with slightly concave edges)
  const hw = W * 0.5 - 0.01;
  const hd = D * 0.5 - 0.01;
  const cr = 0.032; // corner radius
  const sag = 0.012; // slight inward curve on edges

  const seatShape = new THREE.Shape();
  seatShape.moveTo(-hw + cr, -hd);
  seatShape.quadraticCurveTo(0, -hd + sag, hw - cr, -hd);
  seatShape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  seatShape.quadraticCurveTo(hw - sag, 0, hw, hd - cr);
  seatShape.quadraticCurveTo(hw, hd, hw - cr, hd);
  seatShape.quadraticCurveTo(0, hd - sag, -hw + cr, hd);
  seatShape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
  seatShape.quadraticCurveTo(-hw + sag, 0, -hw, -hd + cr);
  seatShape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16,
  });
  seatGeo.rotateX(Math.PI / 2);
  const seatMesh = addMesh(seatGeo, fabricMat, 'seat_fabric');
  seatMesh.position.y = SEAT_Y + SEAT_THICK;

  // 2. Corner rivets (top) & corner pockets (bottom)
  const rivetGeo = new THREE.CylinderGeometry(0.014, 0.015, 0.005, 20);
  const pocketGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.016, 20);

  const corners = [
    { name: 'fl', x: -LEG_X, z: LEG_TOP_Z },
    { name: 'fr', x: LEG_X, z: LEG_TOP_Z },
    { name: 'bl', x: -LEG_X, z: -LEG_TOP_Z },
    { name: 'br', x: LEG_X, z: -LEG_TOP_Z },
  ];

  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const rivet = addMesh(rivetGeo, darkPlasticMat, 'corner_rivet_' + c.name);
    rivet.position.set(c.x, H - 0.002, c.z);

    const pocket = addMesh(pocketGeo, fabricMat, 'corner_pocket_' + c.name);
    pocket.position.set(c.x, SEAT_Y - 0.006, c.z);
  }

  // 3. Helper to create a cylinder between two 3D points
  function createTubeBetween(p1, p2, radius, mat, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 20);
    const mesh = addMesh(geo, mat, name);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  }

  // 4. X-frame legs (left and right)
  const legDefs = [
    {
      name: 'leg_l1',
      p1: new THREE.Vector3(-LEG_X - LEG_X_OFFSET, LEG_BOT_Y, LEG_BOT_Z),
      p2: new THREE.Vector3(-LEG_X - LEG_X_OFFSET, LEG_TOP_Y, -LEG_TOP_Z),
      footName: 'foot_fl',
    },
    {
      name: 'leg_l2',
      p1: new THREE.Vector3(-LEG_X + LEG_X_OFFSET, LEG_BOT_Y, -LEG_BOT_Z),
      p2: new THREE.Vector3(-LEG_X + LEG_X_OFFSET, LEG_TOP_Y, LEG_TOP_Z),
      footName: 'foot_bl',
    },
    {
      name: 'leg_r1',
      p1: new THREE.Vector3(LEG_X + LEG_X_OFFSET, LEG_BOT_Y, LEG_BOT_Z),
      p2: new THREE.Vector3(LEG_X + LEG_X_OFFSET, LEG_TOP_Y, -LEG_TOP_Z),
      footName: 'foot_fr',
    },
    {
      name: 'leg_r2',
      p1: new THREE.Vector3(LEG_X - LEG_X_OFFSET, LEG_BOT_Y, -LEG_BOT_Z),
      p2: new THREE.Vector3(LEG_X - LEG_X_OFFSET, LEG_TOP_Y, LEG_TOP_Z),
      footName: 'foot_br',
    },
  ];

  const footGeo = new THREE.CylinderGeometry(FOOT_R_TOP, FOOT_R_BOT, FOOT_H, 20);

  for (let i = 0; i < legDefs.length; i++) {
    const leg = legDefs[i];
    createTubeBetween(leg.p1, leg.p2, LEG_R, frameMat, leg.name);

    // Rubber foot cap at bottom of each leg
    const foot = addMesh(footGeo, rubberMat, leg.footName);
    const dir = new THREE.Vector3().subVectors(leg.p2, leg.p1).normalize();
    foot.position.copy(leg.p1).addScaledVector(dir, FOOT_H * 0.15);
    foot.position.y = FOOT_H * 0.5;
    foot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }

  // 5. X-frame hubs (left and right)
  const hubGeo = new THREE.BoxGeometry(0.036, 0.042, 0.042);
  const hubLeft = addMesh(hubGeo, darkPlasticMat, 'hub_left');
  hubLeft.position.set(-LEG_X, HUB_Y, 0);

  const hubRight = addMesh(hubGeo, darkPlasticMat, 'hub_right');
  hubRight.position.set(LEG_X, HUB_Y, 0);

  // 6. Horizontal crossbar connecting the two hubs
  createTubeBetween(
    new THREE.Vector3(-LEG_X, HUB_Y, 0),
    new THREE.Vector3(LEG_X, HUB_Y, 0),
    LEG_R,
    frameMat,
    'crossbar'
  );

  return group;
}
