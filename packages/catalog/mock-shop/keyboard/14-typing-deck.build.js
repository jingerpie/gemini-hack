function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters (real-world full-size wireless keyboard)
  const W = 0.440;
  const D = 0.142;
  const H_BODY = 0.018;
  const CORNER_R = 0.008;
  const FOOT_H = 0.002;
  const TILT_ANGLE = 0.055; // slight ergonomic forward tilt (~3.1 deg)

  const KEY_PITCH = 0.019; // standard 19mm key pitch
  const KEY_GAP = 0.0025;
  const KEY_H = 0.007;
  const KEY_BASE_Y = FOOT_H + H_BODY;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1c1d20,
    roughness: 0.55,
    metalness: 0.06
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x121315,
    roughness: 0.75,
    metalness: 0.05
  });

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x242528,
    roughness: 0.62,
    metalness: 0.03
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x101012,
    roughness: 0.9,
    metalness: 0.0
  });

  // Helper to create rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r);
    s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r);
    s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  }

  // Tilted deck sub-group so keys and body tilt together cleanly
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, FOOT_H + Math.sin(TILT_ANGLE) * (D / 2), 0);
  deckGroup.rotation.x = TILT_ANGLE;
  group.add(deckGroup);

  // Main keyboard chassis
  const bodyShape = roundedRectShape(W, D, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: H_BODY - 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2
  });
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = H_BODY - 0.0015;
  bodyMesh.name = 'keyboard_chassis';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  deckGroup.add(bodyMesh);

  // Recessed inner switch plate
  const plateGeo = new THREE.BoxGeometry(W - 0.016, 0.002, D - 0.016);
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.position.set(0, H_BODY - 0.0005, 0);
  plateMesh.name = 'switch_plate';
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  deckGroup.add(plateMesh);

  // Rubber feet on the bottom (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.006, 0.006, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + 0.025, FOOT_H / 2, D / 2 - 0.018],
    [W / 2 - 0.025, FOOT_H / 2, D / 2 - 0.018],
    [-W / 2 + 0.025, FOOT_H / 2 + Math.sin(TILT_ANGLE) * (D - 0.036), -D / 2 + 0.018],
    [W / 2 - 0.025, FOOT_H / 2 + Math.sin(TILT_ANGLE) * (D - 0.036), -D / 2 + 0.018]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(pos[0], pos[1], pos[2]);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Reusable unit keycap geometry
  const unitKeyGeo = new THREE.BoxGeometry(1, 1, 1);

  const originX = -W / 2 + 0.013;
  const originZ = -D / 2 + 0.014;
  let keyIndex = 0;

  function addKey(colU, rowIdx, widthU, depthU = 1, label = 'key') {
    const kw = widthU * KEY_PITCH - KEY_GAP;
    const kd = depthU * KEY_PITCH - KEY_GAP;
    const cx = originX + (colU + widthU / 2) * KEY_PITCH;
    const cz = originZ + (rowIdx + depthU / 2) * KEY_PITCH;

    const key = new THREE.Mesh(unitKeyGeo, keyMat);
    key.scale.set(kw, KEY_H, kd);
    key.position.set(cx, H_BODY + KEY_H / 2 - 0.0005, cz);
    key.name = `${label}_${++keyIndex}`;
    key.castShadow = true;
    key.receiveShadow = true;
    deckGroup.add(key);
  }

  // Row 0: Function row
  addKey(0, 0, 1, 1, 'key_esc');
  for (let i = 0; i < 4; i++) addKey(2 + i, 0, 1, 1, 'key_f');
  for (let i = 0; i < 4; i++) addKey(6.5 + i, 0, 1, 1, 'key_f');
  for (let i = 0; i < 4; i++) addKey(11 + i, 0, 1, 1, 'key_f');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, 0, 1, 1, 'key_sys');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, 0, 1, 1, 'key_media');

  // Row 1: Number row
  for (let i = 0; i < 13; i++) addKey(i, 1.15, 1, 1, 'key_num');
  addKey(13, 1.15, 2, 1, 'key_backspace');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, 1.15, 1, 1, 'key_nav');
  for (let i = 0; i < 4; i++) addKey(18.5 + i, 1.15, 1, 1, 'key_numpad');

  // Row 2: QWERTY row
  addKey(0, 2.15, 1.5, 1, 'key_tab');
  for (let i = 0; i < 12; i++) addKey(1.5 + i, 2.15, 1, 1, 'key_alpha');
  addKey(13.5, 2.15, 1.5, 1, 'key_backslash');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, 2.15, 1, 1, 'key_nav');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, 2.15, 1, 1, 'key_numpad');
  addKey(21.5, 2.15, 1, 2, 'key_numpad_plus');

  // Row 3: ASDF row
  addKey(0, 3.15, 1.75, 1, 'key_caps');
  for (let i = 0; i < 11; i++) addKey(1.75 + i, 3.15, 1, 1, 'key_alpha');
  addKey(12.75, 3.15, 2.25, 1, 'key_enter');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, 3.15, 1, 1, 'key_numpad');

  // Row 4: ZXCV row
  addKey(0, 4.15, 2.25, 1, 'key_lshift');
  for (let i = 0; i < 10; i++) addKey(2.25 + i, 4.15, 1, 1, 'key_alpha');
  addKey(12.25, 4.15, 2.75, 1, 'key_rshift');
  addKey(16.25, 4.15, 1, 1, 'key_arrow_up');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, 4.15, 1, 1, 'key_numpad');
  addKey(21.5, 4.15, 1, 2, 'key_numpad_enter');

  // Row 5: Bottom row
  addKey(0, 5.15, 1.25, 1, 'key_lctrl');
  addKey(1.25, 5.15, 1.25, 1, 'key_win');
  addKey(2.5, 5.15, 1.25, 1, 'key_lalt');
  addKey(3.75, 5.15, 6.25, 1, 'key_spacebar');
  addKey(10, 5.15, 1.25, 1, 'key_ralt');
  addKey(11.25, 5.15, 1.25, 1, 'key_fn');
  addKey(12.5, 5.15, 1.25, 1, 'key_menu');
  addKey(13.75, 5.15, 1.25, 1, 'key_rctrl');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, 5.15, 1, 1, 'key_arrow');
  addKey(18.5, 5.15, 2, 1, 'key_numpad_0');
  addKey(20.5, 5.15, 1, 1, 'key_numpad_dot');

  return group;
}
