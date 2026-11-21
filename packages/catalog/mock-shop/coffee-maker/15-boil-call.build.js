function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BODY_R = 0.105;
  const BODY_H = 0.125;
  const LID_R = 0.054;
  const KNOB_R = 0.018;
  const KNOB_H = 0.022;
  const HANDLE_TUBE_R = 0.0115;
  const SPOUT_R_BASE = 0.022;
  const SPOUT_R_TIP = 0.018;
  const SPOUT_LEN = 0.052;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    metalness: 0.88,
    roughness: 0.26,
  });

  const darkPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x3a3e42,
    metalness: 0.1,
    roughness: 0.65,
  });

  const darkHoleMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    metalness: 0.2,
    roughness: 0.8,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Kettle Body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BODY_R - 0.006, 0.0),
    new THREE.Vector2(BODY_R, 0.004),
    new THREE.Vector2(BODY_R, 0.036),
    new THREE.Vector2(BODY_R - 0.004, 0.058),
    new THREE.Vector2(BODY_R - 0.014, 0.080),
    new THREE.Vector2(BODY_R - 0.028, 0.100),
    new THREE.Vector2(LID_R + 0.006, 0.118),
    new THREE.Vector2(LID_R + 0.001, BODY_H),
    new THREE.Vector2(LID_R - 0.002, BODY_H - 0.004),
    new THREE.Vector2(0.0, BODY_H - 0.004),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  addMesh(bodyGeo, steelMat, 'kettle_body');

  // 2. Rolled Bottom Rim
  const baseRimGeo = new THREE.TorusGeometry(BODY_R, 0.0028, 12, 32);
  baseRimGeo.rotateX(Math.PI / 2);
  const baseRim = addMesh(baseRimGeo, steelMat, 'base_rim');
  baseRim.position.y = 0.003;

  // 3. Lid
  const lidPoints = [
    new THREE.Vector2(0.0, BODY_H + 0.007),
    new THREE.Vector2(0.022, BODY_H + 0.006),
    new THREE.Vector2(0.040, BODY_H + 0.003),
    new THREE.Vector2(LID_R, BODY_H - 0.001),
    new THREE.Vector2(LID_R - 0.002, BODY_H - 0.003),
    new THREE.Vector2(0.0, BODY_H - 0.003),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  addMesh(lidGeo, steelMat, 'lid');

  // 4. Lid Knob
  const knobPoints = [
    new THREE.Vector2(0.0, BODY_H + 0.005),
    new THREE.Vector2(0.009, BODY_H + 0.005),
    new THREE.Vector2(0.008, BODY_H + 0.014),
    new THREE.Vector2(KNOB_R, BODY_H + 0.022),
    new THREE.Vector2(KNOB_R - 0.002, BODY_H + KNOB_H + 0.005),
    new THREE.Vector2(0.0, BODY_H + KNOB_H + 0.006),
  ];
  const knobGeo = new THREE.LatheGeometry(knobPoints, 24);
  addMesh(knobGeo, darkPlasticMat, 'lid_knob');

  // 5. Arched Handle (YZ plane, spanning +Z to -Z)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.106, 0.068),
    new THREE.Vector3(0, 0.165, 0.072),
    new THREE.Vector3(0, 0.214, 0.042),
    new THREE.Vector3(0, 0.228, 0.0),
    new THREE.Vector3(0, 0.214, -0.042),
    new THREE.Vector3(0, 0.165, -0.072),
    new THREE.Vector3(0, 0.106, -0.068),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 32, HANDLE_TUBE_R, 16, false);
  addMesh(handleGeo, steelMat, 'handle_arch');

  // 6 & 7. Handle Base Collars
  const collarGeo = new THREE.CylinderGeometry(HANDLE_TUBE_R + 0.002, HANDLE_TUBE_R + 0.004, 0.01, 16);
  const frontCollar = addMesh(collarGeo, steelMat, 'handle_front_collar');
  frontCollar.position.set(0, 0.108, 0.068);
  frontCollar.rotation.x = 0.25;

  const backCollar = addMesh(collarGeo, steelMat, 'handle_back_collar');
  backCollar.position.set(0, 0.108, -0.068);
  backCollar.rotation.x = -0.25;

  // 8. Trigger Lever under front of handle
  const triggerShape = new THREE.Shape();
  triggerShape.moveTo(0, 0);
  triggerShape.quadraticCurveTo(0.012, -0.006, 0.022, -0.018);
  triggerShape.lineTo(0.016, -0.022);
  triggerShape.quadraticCurveTo(0.006, -0.012, -0.004, -0.006);
  triggerShape.closePath();

  const triggerGeo = new THREE.ExtrudeGeometry(triggerShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
  });
  triggerGeo.translate(0, 0, -0.006);
  triggerGeo.rotateY(Math.PI / 2);
  const trigger = addMesh(triggerGeo, darkPlasticMat, 'trigger_lever');
  trigger.position.set(0, 0.195, 0.056);

  // 9. Spout Group (angled forward +Z and up +Y)
  const spoutPivot = new THREE.Group();
  spoutPivot.position.set(0, 0.082, 0.082);
  spoutPivot.rotation.x = Math.PI / 4; // 45 degrees forward-up
  group.add(spoutPivot);

  function addSpoutMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    spoutPivot.add(mesh);
    return mesh;
  }

  // Spout Flange
  const flangeGeo = new THREE.TorusGeometry(SPOUT_R_BASE + 0.002, 0.003, 12, 24);
  flangeGeo.rotateX(Math.PI / 2);
  const flange = addSpoutMesh(flangeGeo, steelMat, 'spout_flange');
  flange.position.y = 0.002;

  // Spout Tube
  const spoutGeo = new THREE.CylinderGeometry(SPOUT_R_TIP, SPOUT_R_BASE, SPOUT_LEN, 24);
  const spoutTube = addSpoutMesh(spoutGeo, steelMat, 'spout_tube');
  spoutTube.position.y = SPOUT_LEN / 2;

  // Whistle Cap
  const capGeo = new THREE.CylinderGeometry(SPOUT_R_TIP + 0.002, SPOUT_R_TIP + 0.002, 0.008, 24);
  const whistleCap = addSpoutMesh(capGeo, steelMat, 'whistle_cap');
  whistleCap.position.y = SPOUT_LEN + 0.003;

  // Whistle Cap Rim
  const capRimGeo = new THREE.TorusGeometry(SPOUT_R_TIP + 0.001, 0.002, 10, 24);
  capRimGeo.rotateX(Math.PI / 2);
  const capRim = addSpoutMesh(capRimGeo, steelMat, 'whistle_cap_rim');
  capRim.position.y = SPOUT_LEN + 0.007;

  // Whistle Hole
  const holeGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 16);
  const whistleHole = addSpoutMesh(holeGeo, darkHoleMat, 'whistle_hole');
  whistleHole.position.y = SPOUT_LEN + 0.0065;

  // Whistle Hinge Arm
  const armGeo = new THREE.BoxGeometry(0.012, 0.022, 0.014);
  const hingeArm = addSpoutMesh(armGeo, steelMat, 'whistle_hinge_arm');
  hingeArm.position.set(0, SPOUT_LEN - 0.002, -SPOUT_R_TIP - 0.004);

  // Whistle Hinge Pin
  const pinGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 12);
  pinGeo.rotateZ(Math.PI / 2);
  const hingePin = addSpoutMesh(pinGeo, darkPlasticMat, 'whistle_hinge_pin');
  hingePin.position.set(0, SPOUT_LEN - 0.004, -SPOUT_R_TIP - 0.004);

  // Linkage Rod connecting hinge arm to front of handle
  const rodGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.028, 8);
  const linkageRod = addSpoutMesh(rodGeo, steelMat, 'linkage_rod');
  linkageRod.position.set(0, SPOUT_LEN - 0.006, -SPOUT_R_TIP - 0.012);
  linkageRod.rotation.x = -0.6;

  return group;
}
