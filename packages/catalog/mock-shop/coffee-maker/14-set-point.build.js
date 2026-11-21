function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const FOOT_H = 0.003;
  const FOOT_R = 0.009;
  const BASE_W = 0.185;
  const BASE_D = 0.185;
  const BASE_H = 0.022;
  const BASE_R = 0.012;

  const KETTLE_Y = FOOT_H + BASE_H;
  const KETTLE_H = 0.172;
  const KETTLE_BOT_R = 0.068;
  const KETTLE_MID_R = 0.072;
  const KETTLE_TOP_R = 0.052;

  const LID_KNOB_R = 0.018;
  const LID_KNOB_H = 0.009;
  const DIAL_R = 0.014;
  const DIAL_H = 0.011;
  const SCREEN_R = 0.016;

  // Materials
  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.52,
    metalness: 0.25,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.48,
    metalness: 0.22,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xa2a8ae,
    roughness: 0.25,
    metalness: 0.85,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x101214,
    roughness: 0.12,
    metalness: 0.1,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x18191b,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Helper to create rounded rectangle shape
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Base Feet (4)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);
  const footOffset = BASE_W / 2 - 0.022;
  const footPositions = [
    [-footOffset, -footOffset],
    [footOffset, -footOffset],
    [-footOffset, footOffset],
    [footOffset, footOffset],
  ];
  footPositions.forEach(([fx, fz], idx) => {
    const foot = new THREE.Mesh(footGeo, cordMat);
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.name = `base_foot_${idx + 1}`;
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // 2. Power Base
  const baseShape = createRoundedRectShape(BASE_W - 0.004, BASE_D - 0.004, BASE_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3,
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = FOOT_H + BASE_H - 0.002;
  baseMesh.name = 'power_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. Base Circular Contact Ring
  const ringGeo = new THREE.CylinderGeometry(KETTLE_BOT_R * 0.96, KETTLE_BOT_R * 0.98, 0.002, 32);
  const ringMesh = new THREE.Mesh(ringGeo, cordMat);
  ringMesh.position.y = KETTLE_Y + 0.0005;
  ringMesh.name = 'base_contact_ring';
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  group.add(ringMesh);

  // 4. Base Display Screen (front-left)
  const screenGeo = new THREE.CylinderGeometry(SCREEN_R, SCREEN_R, 0.0015, 24);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(-BASE_W * 0.28, KETTLE_Y + 0.0005, BASE_D * 0.34);
  screenMesh.name = 'base_display_screen';
  screenMesh.castShadow = true;
  screenMesh.receiveShadow = true;
  group.add(screenMesh);

  // 5. Base Rotary Dial (front-right)
  const dialGeo = new THREE.CylinderGeometry(DIAL_R, DIAL_R, DIAL_H, 28);
  const dialMesh = new THREE.Mesh(dialGeo, matteBlackMat);
  dialMesh.position.set(BASE_W * 0.26, KETTLE_Y + DIAL_H / 2, BASE_D * 0.34);
  dialMesh.name = 'base_rotary_dial';
  dialMesh.castShadow = true;
  dialMesh.receiveShadow = true;
  group.add(dialMesh);

  // 6. Kettle Body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(KETTLE_BOT_R - 0.004, 0.0),
    new THREE.Vector2(KETTLE_BOT_R, 0.005),
    new THREE.Vector2(KETTLE_MID_R, 0.025),
    new THREE.Vector2(KETTLE_MID_R * 0.96, 0.055),
    new THREE.Vector2(KETTLE_TOP_R * 1.12, 0.095),
    new THREE.Vector2(KETTLE_TOP_R * 1.02, 0.130),
    new THREE.Vector2(KETTLE_TOP_R, KETTLE_H - 0.004),
    new THREE.Vector2(KETTLE_TOP_R - 0.002, KETTLE_H),
    new THREE.Vector2(KETTLE_TOP_R - 0.004, KETTLE_H - 0.003),
    new THREE.Vector2(KETTLE_TOP_R - 0.006, KETTLE_H - 0.010),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, matteBlackMat);
  bodyMesh.position.y = KETTLE_Y;
  bodyMesh.name = 'kettle_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 7. Kettle Lid (LatheGeometry)
  const lidPoints = [
    new THREE.Vector2(0.0, -0.006),
    new THREE.Vector2(KETTLE_TOP_R * 0.45, -0.006),
    new THREE.Vector2(KETTLE_TOP_R * 0.85, -0.002),
    new THREE.Vector2(KETTLE_TOP_R - 0.004, 0.0),
    new THREE.Vector2(KETTLE_TOP_R - 0.006, -0.004),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  const lidMesh = new THREE.Mesh(lidGeo, matteBlackMat);
  lidMesh.position.y = KETTLE_Y + KETTLE_H - 0.002;
  lidMesh.name = 'kettle_lid';
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  group.add(lidMesh);

  // 8. Lid Knob Stem & Cap
  const knobStemGeo = new THREE.CylinderGeometry(0.009, 0.010, 0.009, 20);
  const knobStem = new THREE.Mesh(knobStemGeo, matteBlackMat);
  knobStem.position.y = KETTLE_Y + KETTLE_H - 0.003;
  knobStem.name = 'lid_knob_stem';
  knobStem.castShadow = true;
  knobStem.receiveShadow = true;
  group.add(knobStem);

  const knobCapGeo = new THREE.CylinderGeometry(LID_KNOB_R, LID_KNOB_R * 0.96, LID_KNOB_H, 28);
  const knobCap = new THREE.Mesh(knobCapGeo, matteBlackMat);
  knobCap.position.y = KETTLE_Y + KETTLE_H + 0.005;
  knobCap.name = 'lid_knob_cap';
  knobCap.castShadow = true;
  knobCap.receiveShadow = true;
  group.add(knobCap);

  // 9. Gooseneck Spout (-X side)
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-KETTLE_MID_R * 0.92, KETTLE_Y + 0.025, 0),
    new THREE.Vector3(-0.095, KETTLE_Y + 0.028, 0),
    new THREE.Vector3(-0.112, KETTLE_Y + 0.055, 0),
    new THREE.Vector3(-0.120, KETTLE_Y + 0.115, 0),
    new THREE.Vector3(-0.132, KETTLE_Y + 0.148, 0),
    new THREE.Vector3(-0.152, KETTLE_Y + 0.165, 0),
  ]);
  const spoutGeo = new THREE.TubeGeometry(spoutCurve, 28, 0.0065, 16, false);
  const spoutMesh = new THREE.Mesh(spoutGeo, matteBlackMat);
  spoutMesh.name = 'gooseneck_spout';
  spoutMesh.castShadow = true;
  spoutMesh.receiveShadow = true;
  group.add(spoutMesh);

  // Spout Tip Rim
  const spoutTipGeo = new THREE.TorusGeometry(0.0058, 0.0012, 8, 16);
  const spoutTip = new THREE.Mesh(spoutTipGeo, steelMat);
  spoutTip.position.set(-0.152, KETTLE_Y + 0.165, 0);
  spoutTip.rotation.y = Math.PI / 2;
  spoutTip.rotation.x = -0.65;
  spoutTip.name = 'spout_tip_rim';
  spoutTip.castShadow = true;
  spoutTip.receiveShadow = true;
  group.add(spoutTip);

  // 10. Handle (+X side)
  const handleY = KETTLE_Y + KETTLE_H * 0.78;
  // Metallic collar
  const collarGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.012, 20);
  collarGeo.rotateZ(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, steelMat);
  collarMesh.position.set(KETTLE_TOP_R + 0.003, handleY, 0);
  collarMesh.name = 'handle_collar';
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);

  // Horizontal handle arm
  const armGeo = new THREE.CylinderGeometry(0.010, 0.011, 0.042, 20);
  armGeo.rotateZ(Math.PI / 2);
  const armMesh = new THREE.Mesh(armGeo, matteBlackMat);
  armMesh.position.set(KETTLE_TOP_R + 0.028, handleY + 0.002, 0);
  armMesh.rotation.z = 0.12;
  armMesh.name = 'handle_arm';
  armMesh.castShadow = true;
  armMesh.receiveShadow = true;
  group.add(armMesh);

  // Angled main grip
  const gripGeo = new THREE.CylinderGeometry(0.012, 0.0105, 0.115, 20);
  const gripMesh = new THREE.Mesh(gripGeo, matteBlackMat);
  gripMesh.position.set(KETTLE_TOP_R + 0.062, handleY - 0.032, 0);
  gripMesh.rotation.z = 0.38;
  gripMesh.name = 'handle_grip';
  gripMesh.castShadow = true;
  gripMesh.receiveShadow = true;
  group.add(gripMesh);

  // Handle bottom cap
  const gripCapGeo = new THREE.SphereGeometry(0.0105, 16, 12);
  const gripCap = new THREE.Mesh(gripCapGeo, matteBlackMat);
  gripCap.position.set(KETTLE_TOP_R + 0.083, handleY - 0.085, 0);
  gripCap.name = 'handle_bottom_cap';
  gripCap.castShadow = true;
  gripCap.receiveShadow = true;
  group.add(gripCap);

  // 11. Power Cord & Plug (-Z side)
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, FOOT_H + 0.006, -BASE_D / 2 + 0.002),
    new THREE.Vector3(0.01, FOOT_H + 0.005, -BASE_D / 2 - 0.045),
    new THREE.Vector3(0.045, FOOT_H + 0.004, -BASE_D / 2 - 0.095),
    new THREE.Vector3(0.075, FOOT_H + 0.005, -BASE_D / 2 - 0.135),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 20, 0.0032, 10, false);
  const cordMesh = new THREE.Mesh(cordGeo, cordMat);
  cordMesh.name = 'power_cord';
  cordMesh.castShadow = true;
  cordMesh.receiveShadow = true;
  group.add(cordMesh);

  // Plug body
  const plugGeo = new THREE.BoxGeometry(0.018, 0.014, 0.026);
  const plugMesh = new THREE.Mesh(plugGeo, cordMat);
  plugMesh.position.set(0.082, FOOT_H + 0.007, -BASE_D / 2 - 0.148);
  plugMesh.rotation.y = -0.45;
  plugMesh.name = 'power_plug';
  plugMesh.castShadow = true;
  plugMesh.receiveShadow = true;
  group.add(plugMesh);

  // Plug prongs
  const prongGeo = new THREE.BoxGeometry(0.0015, 0.006, 0.014);
  [-0.0045, 0.0045].forEach((px, idx) => {
    const prong = new THREE.Mesh(prongGeo, steelMat);
    prong.position.set(
      0.082 + Math.cos(-0.45) * px - Math.sin(-0.45) * (-0.018),
      FOOT_H + 0.007,
      -BASE_D / 2 - 0.148 - Math.sin(-0.45) * px - Math.cos(-0.45) * (-0.018)
    );
    prong.rotation.y = -0.45;
    prong.name = `plug_prong_${idx + 1}`;
    prong.castShadow = true;
    prong.receiveShadow = true;
    group.add(prong);
  });

  return group;
}
