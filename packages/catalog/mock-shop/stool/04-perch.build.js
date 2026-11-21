function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.34;
  const H = 0.45;
  const SEAT_THICK = 0.022;
  const SEAT_CURVE_RISE = 0.028;
  const FRAME_W = 0.27;
  const FRAME_D = 0.21;
  const FRAME_H = 0.036;
  const FRAME_THICK = 0.014;
  const LEG_RADIUS_TOP = 0.014;
  const LEG_RADIUS_BOT = 0.012;
  const FOOT_H = 0.008;
  const SPLAY_X = 0.065;
  const SPLAY_Z = 0.05;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88655,
    roughness: 0.55,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e30,
    roughness: 0.45,
    metalness: 0.65
  });

  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xb0b5ba,
    roughness: 0.3,
    metalness: 0.85
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.85,
    metalness: 0.05
  });

  // 1. Molded plywood seat (curved saddle profile extruded along Z)
  const seatShape = new THREE.Shape();
  const hw = W * 0.5 - 0.012;
  const seatTopY = H - SEAT_CURVE_RISE;

  seatShape.moveTo(-hw, SEAT_CURVE_RISE);
  seatShape.quadraticCurveTo(0, -SEAT_CURVE_RISE * 0.45, hw, SEAT_CURVE_RISE);
  seatShape.lineTo(hw, SEAT_CURVE_RISE - SEAT_THICK);
  seatShape.quadraticCurveTo(0, -SEAT_CURVE_RISE * 0.45 - SEAT_THICK, -hw, SEAT_CURVE_RISE - SEAT_THICK);
  seatShape.closePath();

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: D - 0.024,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4,
    curveSegments: 20
  });
  seatGeo.translate(0, 0, -(D - 0.024) * 0.5);

  const seatMesh = new THREE.Mesh(seatGeo, woodMat);
  seatMesh.position.y = seatTopY;
  seatMesh.name = 'plywood_seat';
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  group.add(seatMesh);

  // 2. Under-seat steel frame / apron
  const frameY = seatTopY - SEAT_THICK - FRAME_H * 0.5 - 0.004;

  const railFBGeo = new THREE.BoxGeometry(FRAME_W, FRAME_H, FRAME_THICK);
  const railLRGeo = new THREE.BoxGeometry(FRAME_THICK, FRAME_H, FRAME_D);

  const frontRail = new THREE.Mesh(railFBGeo, metalMat);
  frontRail.position.set(0, frameY, FRAME_D * 0.5 - FRAME_THICK * 0.5);
  frontRail.name = 'frame_rail_front';
  frontRail.castShadow = true;
  frontRail.receiveShadow = true;
  group.add(frontRail);

  const backRail = new THREE.Mesh(railFBGeo, metalMat);
  backRail.position.set(0, frameY, -FRAME_D * 0.5 + FRAME_THICK * 0.5);
  backRail.name = 'frame_rail_back';
  backRail.castShadow = true;
  backRail.receiveShadow = true;
  group.add(backRail);

  const leftRail = new THREE.Mesh(railLRGeo, metalMat);
  leftRail.position.set(-FRAME_W * 0.5 + FRAME_THICK * 0.5, frameY, 0);
  leftRail.name = 'frame_rail_left';
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railLRGeo, metalMat);
  rightRail.position.set(FRAME_W * 0.5 - FRAME_THICK * 0.5, frameY, 0);
  rightRail.name = 'frame_rail_right';
  rightRail.castShadow = true;
  rightRail.receiveShadow = true;
  group.add(rightRail);

  // 3. Four splayed tubular legs + floor glides
  const legTopY = frameY + FRAME_H * 0.35;
  const legBotY = FOOT_H * 0.5;

  const legConfigs = [
    { name: 'leg_front_left', sx: -1, sz: 1 },
    { name: 'leg_front_right', sx: 1, sz: 1 },
    { name: 'leg_back_left', sx: -1, sz: -1 },
    { name: 'leg_back_right', sx: 1, sz: -1 }
  ];

  const footGeo = new THREE.CylinderGeometry(LEG_RADIUS_BOT * 1.02, LEG_RADIUS_BOT * 0.95, FOOT_H, 16);

  legConfigs.forEach((cfg) => {
    const topPos = new THREE.Vector3(
      cfg.sx * (FRAME_W * 0.5 - LEG_RADIUS_TOP * 0.4),
      legTopY,
      cfg.sz * (FRAME_D * 0.5 - LEG_RADIUS_TOP * 0.4)
    );
    const botPos = new THREE.Vector3(
      cfg.sx * (FRAME_W * 0.5 + SPLAY_X),
      legBotY,
      cfg.sz * (FRAME_D * 0.5 + SPLAY_Z)
    );

    const dir = new THREE.Vector3().subVectors(botPos, topPos);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(topPos, botPos).multiplyScalar(0.5);

    const legGeo = new THREE.CylinderGeometry(LEG_RADIUS_TOP, LEG_RADIUS_BOT, len, 18);
    const legMesh = new THREE.Mesh(legGeo, metalMat);
    legMesh.position.copy(mid);
    legMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    legMesh.name = cfg.name;
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    // Floor glide / cap
    const footMesh = new THREE.Mesh(footGeo, footMat);
    footMesh.position.set(botPos.x, FOOT_H * 0.5, botPos.z);
    footMesh.name = cfg.name + '_foot';
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    group.add(footMesh);
  });

  // 4. Visible hex bolts on the frame rails
  const boltGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 6);
  const boltPositions = [
    // Front & back rails
    { x: -FRAME_W * 0.34, y: frameY, z: FRAME_D * 0.5 + 0.002, rx: Math.PI * 0.5, rz: 0, name: 'bolt_front_left' },
    { x: FRAME_W * 0.34, y: frameY, z: FRAME_D * 0.5 + 0.002, rx: Math.PI * 0.5, rz: 0, name: 'bolt_front_right' },
    { x: -FRAME_W * 0.34, y: frameY, z: -FRAME_D * 0.5 - 0.002, rx: Math.PI * 0.5, rz: 0, name: 'bolt_back_left' },
    { x: FRAME_W * 0.34, y: frameY, z: -FRAME_D * 0.5 - 0.002, rx: Math.PI * 0.5, rz: 0, name: 'bolt_back_right' },
    // Left & right rails
    { x: -FRAME_W * 0.5 - 0.002, y: frameY, z: FRAME_D * 0.3, rx: 0, rz: Math.PI * 0.5, name: 'bolt_left_front' },
    { x: -FRAME_W * 0.5 - 0.002, y: frameY, z: -FRAME_D * 0.3, rx: 0, rz: Math.PI * 0.5, name: 'bolt_left_back' },
    { x: FRAME_W * 0.5 + 0.002, y: frameY, z: FRAME_D * 0.3, rx: 0, rz: Math.PI * 0.5, name: 'bolt_right_front' },
    { x: FRAME_W * 0.5 + 0.002, y: frameY, z: -FRAME_D * 0.3, rx: 0, rz: Math.PI * 0.5, name: 'bolt_right_back' }
  ];

  boltPositions.forEach((b) => {
    const boltMesh = new THREE.Mesh(boltGeo, boltMat);
    boltMesh.position.set(b.x, b.y, b.z);
    boltMesh.rotation.set(b.rx, 0, b.rz);
    boltMesh.name = b.name;
    boltMesh.castShadow = true;
    boltMesh.receiveShadow = true;
    group.add(boltMesh);
  });

  return group;
}
