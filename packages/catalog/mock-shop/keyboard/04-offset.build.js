function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a Tenkeyless (TKL) mechanical keyboard
  const W = 0.36;
  const D = 0.136;
  const CASE_H = 0.020;
  const LED_H = 0.0025;
  const TILT = 0.085; // ~4.9 deg typing angle
  const FOOT_H = 0.012;
  const KEY_PITCH = 0.01905; // standard 19.05mm key pitch
  const KEY_GAP = 0.0022;
  const KEY_H = 0.0095;

  // Materials
  const matCase = new THREE.MeshStandardMaterial({
    color: 0x3e434a,
    roughness: 0.45,
    metalness: 0.35
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: 0x2a2e33,
    roughness: 0.6,
    metalness: 0.2
  });
  const matLightKey = new THREE.MeshStandardMaterial({
    color: 0xd2d6dc,
    roughness: 0.5,
    metalness: 0.05
  });
  const matDarkKey = new THREE.MeshStandardMaterial({
    color: 0x363a40,
    roughness: 0.5,
    metalness: 0.05
  });
  const matCyan = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00d8ff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.1
  });
  const matCable = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.7,
    metalness: 0.1
  });
  const matFoot = new THREE.MeshStandardMaterial({
    color: 0x202327,
    roughness: 0.85,
    metalness: 0.05
  });

  function addMesh(parent, geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Keyboard chassis group (tilted)
  const kbGroup = new THREE.Group();
  const frontBottomY = Math.sin(TILT) * (D * 0.5);
  kbGroup.position.set(0, frontBottomY + 0.002, 0);
  kbGroup.rotation.x = TILT;
  group.add(kbGroup);

  // Lower case
  const lowerH = CASE_H * 0.45;
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(W, lowerH, D),
    matCase,
    'case_lower',
    0,
    lowerH * 0.5,
    0
  );

  // Perimeter cyan LED strip
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(W + 0.001, LED_H, D + 0.001),
    matCyan,
    'perimeter_led_strip',
    0,
    lowerH + LED_H * 0.5,
    0
  );

  // Upper case
  const upperH = CASE_H * 0.55;
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(W, upperH, D),
    matCase,
    'case_upper',
    0,
    lowerH + LED_H + upperH * 0.5,
    0
  );

  const topY = lowerH + LED_H + upperH;

  // Cyan backlight glow plate under keys
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(W - 0.016, 0.001, D - 0.016),
    matCyan,
    'key_backlight_plate',
    0,
    topY + 0.0005,
    0
  );

  // Dark switch plate
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(W - 0.018, 0.0015, D - 0.018),
    matPlate,
    'switch_plate',
    0,
    topY + 0.0012,
    0
  );

  // Flip-out rear feet (touching y = 0)
  const footX = W * 0.38;
  const footZ = -D * 0.36;
  const footY = FOOT_H * 0.5;
  addMesh(
    group,
    new THREE.BoxGeometry(0.026, FOOT_H, 0.014),
    matFoot,
    'rear_foot_left',
    -footX,
    footY,
    footZ
  );
  addMesh(
    group,
    new THREE.BoxGeometry(0.026, FOOT_H, 0.014),
    matFoot,
    'rear_foot_right',
    footX,
    footY,
    footZ
  );

  // Front rubber pads (touching y = 0)
  addMesh(
    group,
    new THREE.BoxGeometry(0.024, 0.0025, 0.010),
    matFoot,
    'front_pad_left',
    -footX,
    0.00125,
    D * 0.42
  );
  addMesh(
    group,
    new THREE.BoxGeometry(0.024, 0.0025, 0.010),
    matFoot,
    'front_pad_right',
    footX,
    0.00125,
    D * 0.42
  );

  // USB-C port & cable on the back (-Z) edge
  const usbZ = -D * 0.5 - 0.008;
  const usbY = lowerH + LED_H * 0.5;
  addMesh(
    kbGroup,
    new THREE.BoxGeometry(0.012, 0.007, 0.018),
    matCable,
    'usbc_connector',
    0,
    usbY,
    usbZ
  );

  // Cable curve in world space from the back of the keyboard
  const cableStart = new THREE.Vector3(0, frontBottomY + usbY + 0.008, -D * 0.5 - 0.016);
  const cableCurve = new THREE.CatmullRomCurve3([
    cableStart,
    new THREE.Vector3(0.01, 0.012, -D * 0.5 - 0.06),
    new THREE.Vector3(0.06, 0.004, -D * 0.5 - 0.14),
    new THREE.Vector3(0.14, 0.003, -D * 0.5 - 0.22)
  ]);
  addMesh(
    group,
    new THREE.TubeGeometry(cableCurve, 24, 0.0024, 8, false),
    matCable,
    'usbc_cable',
    0,
    0,
    0
  );

  // Shared keycap geometry (1x1x1 unit box scaled per key)
  const keyGeo = new THREE.BoxGeometry(1, 1, 1);
  const keyBaseY = topY + 0.002 + KEY_H * 0.5;

  // Helper to place a row of keys
  // originX is left edge of main block, originZ is center of row
  const mainLeft = -W * 0.5 + 0.010;
  const row0Z = -D * 0.5 + 0.018; // Function row (back, -Z)

  function addKeyRow(rowIdx, keys, startX) {
    let cursorX = startX;
    const z = row0Z + rowIdx * KEY_PITCH + (rowIdx > 0 ? 0.004 : 0);
    for (let i = 0; i < keys.length; i++) {
      const [u, isDark, label] = keys[i];
      if (label === 'GAP') {
        cursorX += u * KEY_PITCH;
        continue;
      }
      const kw = u * KEY_PITCH - KEY_GAP;
      const kd = KEY_PITCH - KEY_GAP;
      const kx = cursorX + (u * KEY_PITCH) * 0.5;
      const mesh = new THREE.Mesh(keyGeo, isDark ? matDarkKey : matLightKey);
      mesh.name = `key_${label}`;
      mesh.scale.set(kw, KEY_H, kd);
      mesh.position.set(kx, keyBaseY, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      kbGroup.add(mesh);
      cursorX += u * KEY_PITCH;
    }
  }

  // Row 0: Function row (Esc, F1-F12, PrtSc, ScrLk, Pause)
  addKeyRow(0, [
    [1, true, 'esc'], [1, false, 'GAP'],
    [1, true, 'f1'], [1, true, 'f2'], [1, true, 'f3'], [1, true, 'f4'], [0.5, false, 'GAP'],
    [1, false, 'f5'], [1, false, 'f6'], [1, false, 'f7'], [1, false, 'f8'], [0.5, false, 'GAP'],
    [1, true, 'f9'], [1, true, 'f10'], [1, true, 'f11'], [1, true, 'f12'],
    [0.25, false, 'GAP'],
    [1, true, 'prtsc'], [1, true, 'scrlk'], [1, true, 'pause']
  ], mainLeft);

  // Row 1: Number row + Ins/Home/PgUp
  addKeyRow(1, [
    [1, true, 'grave'], [1, false, '1'], [1, false, '2'], [1, false, '3'], [1, false, '4'],
    [1, false, '5'], [1, false, '6'], [1, false, '7'], [1, false, '8'], [1, false, '9'],
    [1, false, '0'], [1, false, 'minus'], [1, false, 'equal'], [2, true, 'backspace'],
    [0.25, false, 'GAP'],
    [1, true, 'ins'], [1, true, 'home'], [1, true, 'pgup']
  ], mainLeft);

  // Row 2: QWERTY + Del/End/PgDn
  addKeyRow(2, [
    [1.5, true, 'tab'], [1, false, 'q'], [1, false, 'w'], [1, false, 'e'], [1, false, 'r'],
    [1, false, 't'], [1, false, 'y'], [1, false, 'u'], [1, false, 'i'], [1, false, 'o'],
    [1, false, 'p'], [1, false, 'lbracket'], [1, false, 'rbracket'], [1.5, true, 'backslash'],
    [0.25, false, 'GAP'],
    [1, true, 'del'], [1, true, 'end'], [1, true, 'pgdn']
  ], mainLeft);

  // Row 3: ASDF
  addKeyRow(3, [
    [1.75, true, 'caps'], [1, false, 'a'], [1, false, 's'], [1, false, 'd'], [1, false, 'f'],
    [1, false, 'g'], [1, false, 'h'], [1, false, 'j'], [1, false, 'k'], [1, false, 'l'],
    [1, false, 'semicolon'], [1, false, 'quote'], [2.25, true, 'enter']
  ], mainLeft);

  // Row 4: ZXCV + Up Arrow
  addKeyRow(4, [
    [2.25, true, 'lshift'], [1, false, 'z'], [1, false, 'x'], [1, false, 'c'], [1, false, 'v'],
    [1, false, 'b'], [1, false, 'n'], [1, false, 'm'], [1, false, 'comma'], [1, false, 'period'],
    [1, false, 'slash'], [2.75, true, 'rshift'],
    [1.25, false, 'GAP'],
    [1, true, 'up']
  ], mainLeft);

  // Row 5: Bottom modifiers + Spacebar + Left/Down/Right Arrows
  addKeyRow(5, [
    [1.25, true, 'lctrl'], [1.25, true, 'lwin'], [1.25, true, 'lalt'],
    [6.25, false, 'space'],
    [1.25, true, 'ralt'], [1.25, true, 'fn'], [1.25, true, 'menu'], [1.25, true, 'rctrl'],
    [0.25, false, 'GAP'],
    [1, true, 'left'], [1, true, 'down'], [1, true, 'right']
  ], mainLeft);

  return group;
}
