function build(THREE) {
  const group = new THREE.Group();

  const W = 0.435;
  const D = 0.135;
  const BODY_H = 0.013;
  const BEVEL = 0.002;
  const CORNER_R = 0.006;
  const TILT = 0.045;
  const FOOT_H = 0.002;

  const PITCH = 0.0185;
  const KEY_GAP = 0.0022;
  const KEY_H = 0.0045;

  const CABLE_R = 0.0018;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1c1d20,
    roughness: 0.55,
    metalness: 0.15
  });

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x222326,
    roughness: 0.45,
    metalness: 0.08
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x111112,
    roughness: 0.85,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.25,
    metalness: 0.9
  });

  // Keyboard chassis (tilted deck)
  const deckGroup = new THREE.Group();
  const frontLift = Math.sin(TILT) * (D * 0.5) + FOOT_H + BEVEL;
  deckGroup.position.set(0, frontLift, 0);
  deckGroup.rotation.x = TILT;
  group.add(deckGroup);

  // Rounded rectangle shape for the main body
  const hw = W * 0.5 - BEVEL;
  const hd = D * 0.5 - BEVEL;
  const r = CORNER_R;
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-hw + r, -hd);
  bodyShape.lineTo(hw - r, -hd);
  bodyShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  bodyShape.lineTo(hw, hd - r);
  bodyShape.quadraticCurveTo(hw, hd, hw - r, hd);
  bodyShape.lineTo(-hw + r, hd);
  bodyShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  bodyShape.lineTo(-hw, -hd + r);
  bodyShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3
  });
  bodyGeo.rotateX(Math.PI * 0.5);

  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = 'keyboard_chassis';
  bodyMesh.position.y = BODY_H - BEVEL;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  deckGroup.add(bodyMesh);

  // Rubber feet underneath
  const footGeo = new THREE.CylinderGeometry(0.006, 0.006, FOOT_H, 16);
  const footPositions = [
    [-W * 0.42, -D * 0.36],
    [W * 0.42, -D * 0.36],
    [-W * 0.42, D * 0.36],
    [W * 0.42, D * 0.36]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, rubberMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(pos[0], -FOOT_H * 0.5, pos[1]);
    foot.castShadow = true;
    foot.receiveShadow = true;
    deckGroup.add(foot);
  });

  // Shared unit key geometry
  const keyGeo = new THREE.BoxGeometry(1, KEY_H, 1);
  const keyTopY = BODY_H + KEY_H * 0.5 - 0.0005;

  const totalUnitsW = 22.8;
  const startX = -(totalUnitsW * PITCH) * 0.5;
  const startZ = -(6 * PITCH) * 0.5;

  let keyCounter = 0;
  function addKey(uX, uZ, uW, uD, label) {
    keyCounter++;
    const w = uW * PITCH - KEY_GAP;
    const d = uD * PITCH - KEY_GAP;
    const mesh = new THREE.Mesh(keyGeo, keyMat);
    mesh.name = `key_${label || keyCounter}`;
    mesh.scale.set(w, 1, d);
    mesh.position.set(
      startX + (uX + uW * 0.5) * PITCH,
      keyTopY,
      startZ + (uZ + uD * 0.5) * PITCH
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    deckGroup.add(mesh);
  }

  // Row 0: Function keys
  addKey(0, 0, 1.25, 1, 'esc');
  for (let i = 0; i < 4; i++) addKey(1.75 + i, 0, 1, 1, `f${i + 1}`);
  for (let i = 0; i < 4; i++) addKey(6.25 + i, 0, 1, 1, `f${i + 5}`);
  for (let i = 0; i < 4; i++) addKey(10.75 + i, 0, 1, 1, `f${i + 9}`);

  // Row 1: Number row
  for (let i = 0; i < 13; i++) addKey(i, 1, 1, 1, `num_row_${i}`);
  addKey(13, 1, 2, 1, 'backspace');

  // Row 2: QWERTY row
  addKey(0, 2, 1.5, 1, 'tab');
  for (let i = 0; i < 12; i++) addKey(1.5 + i, 2, 1, 1, `qwerty_${i}`);
  addKey(13.5, 2, 1.5, 1, 'backslash');

  // Row 3: ASDF row
  addKey(0, 3, 1.75, 1, 'caps_lock');
  for (let i = 0; i < 11; i++) addKey(1.75 + i, 3, 1, 1, `asdf_${i}`);
  addKey(12.75, 3, 2.25, 1, 'enter');

  // Row 4: ZXCV row
  addKey(0, 4, 2.25, 1, 'left_shift');
  for (let i = 0; i < 10; i++) addKey(2.25 + i, 4, 1, 1, `zxcv_${i}`);
  addKey(12.25, 4, 2.75, 1, 'right_shift');

  // Row 5: Bottom modifier & spacebar row
  addKey(0, 5, 1.25, 1, 'left_ctrl');
  addKey(1.25, 5, 1.25, 1, 'left_win');
  addKey(2.5, 5, 1.25, 1, 'left_alt');
  addKey(3.75, 5, 6.25, 1, 'spacebar');
  addKey(10, 5, 1.25, 1, 'right_alt');
  addKey(11.25, 5, 1.25, 1, 'fn');
  addKey(12.5, 5, 1.25, 1, 'menu');
  addKey(13.75, 5, 1.25, 1, 'right_ctrl');

  // Navigation cluster (starts at uX = 15.4)
  const navX = 15.4;
  for (let i = 0; i < 3; i++) addKey(navX + i, 0, 1, 1, `nav_top_${i}`);
  for (let i = 0; i < 3; i++) addKey(navX + i, 1, 1, 1, `nav_mid1_${i}`);
  for (let i = 0; i < 3; i++) addKey(navX + i, 2, 1, 1, `nav_mid2_${i}`);
  addKey(navX + 1, 4, 1, 1, 'arrow_up');
  addKey(navX + 0, 5, 1, 1, 'arrow_left');
  addKey(navX + 1, 5, 1, 1, 'arrow_down');
  addKey(navX + 2, 5, 1, 1, 'arrow_right');

  // Numpad cluster (starts at uX = 18.8)
  const numX = 18.8;
  for (let i = 0; i < 4; i++) addKey(numX + i, 0, 1, 1, `media_${i}`);
  for (let i = 0; i < 4; i++) addKey(numX + i, 1, 1, 1, `num_top_${i}`);
  for (let i = 0; i < 3; i++) addKey(numX + i, 2, 1, 1, `num_r2_${i}`);
  for (let i = 0; i < 3; i++) addKey(numX + i, 3, 1, 1, `num_r3_${i}`);
  addKey(numX + 3, 2, 1, 2, 'num_plus');
  for (let i = 0; i < 3; i++) addKey(numX + i, 4, 1, 1, `num_r4_${i}`);
  addKey(numX + 3, 4, 1, 2, 'num_enter');
  addKey(numX + 0, 5, 2, 1, 'num_0');
  addKey(numX + 2, 5, 1, 1, 'num_dot');

  // Cable strain relief at back-center
  const reliefGeo = new THREE.BoxGeometry(0.008, 0.006, 0.008);
  const relief = new THREE.Mesh(reliefGeo, rubberMat);
  relief.name = 'cable_strain_relief';
  relief.position.set(0, BODY_H * 0.45, -D * 0.5 - 0.003);
  relief.castShadow = true;
  relief.receiveShadow = true;
  deckGroup.add(relief);

  // USB Cable curving behind the keyboard
  const cableStartZ = -D * 0.5 - 0.006;
  const cableStartY = frontLift + BODY_H * 0.45;
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, cableStartY, cableStartZ),
    new THREE.Vector3(0, CABLE_R + 0.001, cableStartZ - 0.025),
    new THREE.Vector3(0.03, CABLE_R, cableStartZ - 0.06),
    new THREE.Vector3(0.14, CABLE_R, cableStartZ - 0.065),
    new THREE.Vector3(0.26, CABLE_R, cableStartZ - 0.065),
    new THREE.Vector3(0.28, CABLE_R, cableStartZ - 0.045),
    new THREE.Vector3(0.18, CABLE_R, cableStartZ - 0.04),
    new THREE.Vector3(0.10, CABLE_R, cableStartZ - 0.04)
  ]);

  const cableGeo = new THREE.TubeGeometry(cableCurve, 48, CABLE_R, 10, false);
  const cableMesh = new THREE.Mesh(cableGeo, rubberMat);
  cableMesh.name = 'usb_cable';
  cableMesh.castShadow = true;
  cableMesh.receiveShadow = true;
  group.add(cableMesh);

  // USB-A Plug at the end of the cable
  const usbGroup = new THREE.Group();
  usbGroup.position.set(0.088, 0.004, cableStartZ - 0.04);
  group.add(usbGroup);

  const usbBodyGeo = new THREE.BoxGeometry(0.022, 0.008, 0.014);
  const usbBody = new THREE.Mesh(usbBodyGeo, rubberMat);
  usbBody.name = 'usb_plug_housing';
  usbBody.castShadow = true;
  usbBody.receiveShadow = true;
  usbGroup.add(usbBody);

  const usbMetalGeo = new THREE.BoxGeometry(0.012, 0.005, 0.011);
  const usbMetal = new THREE.Mesh(usbMetalGeo, metalMat);
  usbMetal.name = 'usb_plug_connector';
  usbMetal.position.set(-0.017, 0, 0);
  usbMetal.castShadow = true;
  usbMetal.receiveShadow = true;
  usbGroup.add(usbMetal);

  return group;
}
