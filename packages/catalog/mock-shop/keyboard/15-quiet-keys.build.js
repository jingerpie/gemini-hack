function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.310;
  const D = 0.125;
  const CASE_H = 0.022;
  const FOOT_H = 0.002;
  const U = 0.01905; // Standard 1u key pitch
  const KEY_GAP = 0.0014;
  const KEY_H = 0.009;
  const TILT_RAD = 0.045; // Subtle ergonomic tilt

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d3,
    roughness: 0.45,
    metalness: 0.02
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.7,
    metalness: 0.1
  });
  const creamKeyMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d0,
    roughness: 0.4,
    metalness: 0.02
  });
  const yellowKeyMat = new THREE.MeshStandardMaterial({
    color: 0xd4a638,
    roughness: 0.4,
    metalness: 0.02
  });
  const navyKeyMat = new THREE.MeshStandardMaterial({
    color: 0x2d4361,
    roughness: 0.4,
    metalness: 0.02
  });
  const orangeKeyMat = new THREE.MeshStandardMaterial({
    color: 0xc45b33,
    roughness: 0.4,
    metalness: 0.02
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.3,
    metalness: 0.2
  });

  // Helper to create rounded rectangle shape
  function makeRoundedRectShape(w, d, r) {
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

  // Rubber feet at y = 0
  const footGeo = new THREE.CylinderGeometry(0.007, 0.007, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + 0.022, FOOT_H / 2, D / 2 - 0.018],
    [W / 2 - 0.022, FOOT_H / 2, D / 2 - 0.018],
    [-W / 2 + 0.022, FOOT_H / 2, -D / 2 + 0.018],
    [W / 2 - 0.022, FOOT_H / 2, -D / 2 + 0.018]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(pos[0], pos[1], pos[2]);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Tilted keyboard body group
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, FOOT_H + Math.sin(TILT_RAD) * (D / 2), 0);
  bodyGroup.rotation.x = TILT_RAD;
  group.add(bodyGroup);

  // Main case
  const caseShape = makeRoundedRectShape(W, D, 0.008);
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
    depth: CASE_H - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 3
  });
  caseGeo.rotateX(-Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, caseMat);
  caseMesh.name = 'keyboard_case';
  caseMesh.position.y = 0.0015;
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  bodyGroup.add(caseMesh);

  // Dark inner plate under keys
  const plateW = 15 * U + 0.002;
  const plateD = 5 * U + 0.002;
  const plateGeo = new THREE.BoxGeometry(plateW, 0.002, plateD);
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.name = 'key_plate';
  const keyAreaZ = 0.006; // Slightly toward +Z to leave top bezel
  plateMesh.position.set(0, CASE_H + 0.0002, keyAreaZ);
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  bodyGroup.add(plateMesh);

  // Top bezel details (indicators on left, buttons & switch on right)
  const bezelZ = -D / 2 + 0.009;
  const bezelY = CASE_H + 0.0012;

  const ledGeo = new THREE.BoxGeometry(0.005, 0.0015, 0.002);
  for (let i = 0; i < 3; i++) {
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.name = `indicator_led_${i + 1}`;
    led.position.set(-W / 2 + 0.022 + i * 0.011, bezelY, bezelZ);
    led.castShadow = true;
    led.receiveShadow = true;
    bodyGroup.add(led);
  }

  const btnGeo = new THREE.BoxGeometry(0.013, 0.0022, 0.0045);
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(btnGeo, caseMat);
    btn.name = `mode_button_${i + 1}`;
    btn.position.set(W / 2 - 0.068 + i * 0.015, bezelY + 0.0004, bezelZ);
    btn.castShadow = true;
    btn.receiveShadow = true;
    bodyGroup.add(btn);
  }

  // Orange toggle switch on top-right
  const switchBaseGeo = new THREE.BoxGeometry(0.014, 0.0015, 0.005);
  const switchBase = new THREE.Mesh(switchBaseGeo, plateMat);
  switchBase.name = 'power_switch_slot';
  switchBase.position.set(W / 2 - 0.020, bezelY, bezelZ);
  switchBase.castShadow = true;
  switchBase.receiveShadow = true;
  bodyGroup.add(switchBase);

  const switchNubGeo = new THREE.BoxGeometry(0.007, 0.003, 0.0045);
  const switchNub = new THREE.Mesh(switchNubGeo, orangeKeyMat);
  switchNub.name = 'power_switch_nub';
  switchNub.position.set(W / 2 - 0.017, bezelY + 0.001, bezelZ);
  switchNub.castShadow = true;
  switchNub.receiveShadow = true;
  bodyGroup.add(switchNub);

  // Keycap geometry cache by width in units
  const keyGeoCache = {};
  function getKeyGeo(units) {
    const key = String(units);
    if (!keyGeoCache[key]) {
      const kw = units * U - KEY_GAP;
      const kd = U - KEY_GAP;
      keyGeoCache[key] = new THREE.BoxGeometry(kw, KEY_H, kd);
    }
    return keyGeoCache[key];
  }

  // 60% Keyboard layout: [units, material, name]
  const rows = [
    [
      [1, yellowKeyMat, 'esc'],
      [1, creamKeyMat, '1'], [1, creamKeyMat, '2'], [1, creamKeyMat, '3'],
      [1, creamKeyMat, '4'], [1, creamKeyMat, '5'], [1, creamKeyMat, '6'],
      [1, creamKeyMat, '7'], [1, creamKeyMat, '8'], [1, creamKeyMat, '9'],
      [1, creamKeyMat, '0'], [1, creamKeyMat, 'minus'], [1, creamKeyMat, 'equal'],
      [2, navyKeyMat, 'backspace']
    ],
    [
      [1.5, navyKeyMat, 'tab'],
      [1, creamKeyMat, 'q'], [1, creamKeyMat, 'w'], [1, creamKeyMat, 'e'],
      [1, creamKeyMat, 'r'], [1, creamKeyMat, 't'], [1, creamKeyMat, 'y'],
      [1, creamKeyMat, 'u'], [1, creamKeyMat, 'i'], [1, creamKeyMat, 'o'],
      [1, creamKeyMat, 'p'], [1, creamKeyMat, 'lbracket'], [1, creamKeyMat, 'rbracket'],
      [1.5, creamKeyMat, 'backslash']
    ],
    [
      [1.75, navyKeyMat, 'caps'],
      [1, creamKeyMat, 'a'], [1, creamKeyMat, 's'], [1, creamKeyMat, 'd'],
      [1, creamKeyMat, 'f'], [1, creamKeyMat, 'g'], [1, creamKeyMat, 'h'],
      [1, creamKeyMat, 'j'], [1, creamKeyMat, 'k'], [1, creamKeyMat, 'l'],
      [1, creamKeyMat, 'semicolon'], [1, creamKeyMat, 'quote'],
      [2.25, yellowKeyMat, 'enter']
    ],
    [
      [2.25, navyKeyMat, 'lshift'],
      [1, creamKeyMat, 'z'], [1, creamKeyMat, 'x'], [1, creamKeyMat, 'c'],
      [1, creamKeyMat, 'v'], [1, creamKeyMat, 'b'], [1, creamKeyMat, 'n'],
      [1, creamKeyMat, 'm'], [1, creamKeyMat, 'comma'], [1, creamKeyMat, 'period'],
      [1, creamKeyMat, 'slash'],
      [2.75, navyKeyMat, 'rshift']
    ],
    [
      [1.25, yellowKeyMat, 'lctrl'],
      [1.25, yellowKeyMat, 'win'],
      [1.25, yellowKeyMat, 'lalt'],
      [6.25, navyKeyMat, 'space'],
      [1, yellowKeyMat, 'ralt'],
      [1, yellowKeyMat, 'fn'],
      [1, orangeKeyMat, 'left'],
      [1, orangeKeyMat, 'up_down'],
      [1, orangeKeyMat, 'right']
    ]
  ];

  const startX = -(15 * U) / 2;
  const startZ = keyAreaZ - (5 * U) / 2 + U / 2;
  const keyY = CASE_H + KEY_H / 2;

  rows.forEach((row, rIdx) => {
    let curX = startX;
    const z = startZ + rIdx * U;
    row.forEach(([units, mat, label]) => {
      const keyW = units * U;
      const mesh = new THREE.Mesh(getKeyGeo(units), mat);
      mesh.name = `key_${label}`;
      mesh.position.set(curX + keyW / 2, keyY, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bodyGroup.add(mesh);
      curX += keyW;
    });
  });

  return group;
}
