function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.315;
  const D = 0.128;
  const H = 0.022;
  const FOOT_H = 0.002;
  const FOOT_R = 0.007;
  const CASE_H = H - FOOT_H - 0.005;
  const BEVEL_R = 0.008;

  const UNIT = 0.019;
  const KEY_GAP = 0.002;
  const KEY_H = 0.007;
  const GRID_W = 15 * UNIT;
  const GRID_D = 6 * UNIT;
  const START_X = -GRID_W / 2;
  const START_Z = -GRID_D / 2;

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.55,
    metalness: 0.25,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.7,
    metalness: 0.1,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.9,
    metalness: 0.0,
  });
  const keyLightMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.65,
    metalness: 0.02,
  });
  const keyBlueMat = new THREE.MeshStandardMaterial({
    color: 0x54667a,
    roughness: 0.65,
    metalness: 0.02,
  });

  // Helper for rounded rectangle shape
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

  // Rubber feet (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footOffsets = [
    [-W / 2 + 0.022, -D / 2 + 0.018],
    [W / 2 - 0.022, -D / 2 + 0.018],
    [-W / 2 + 0.022, D / 2 - 0.018],
    [W / 2 - 0.022, D / 2 - 0.018],
  ];
  footOffsets.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(pos[0], FOOT_H / 2, pos[1]);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Main keyboard case
  const caseShape = makeRoundedRectShape(W, D, BEVEL_R);
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
    depth: CASE_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
  });
  caseGeo.rotateX(Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, caseMat);
  caseMesh.name = 'keyboard_case';
  caseMesh.position.y = FOOT_H + CASE_H + 0.0015;
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  group.add(caseMesh);

  // Inner switch plate
  const plateGeo = new THREE.BoxGeometry(GRID_W + 0.004, 0.002, GRID_D + 0.004);
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.name = 'switch_plate';
  plateMesh.position.y = FOOT_H + CASE_H + 0.001;
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // Shared keycap geometry
  const keyGeo = new THREE.BoxGeometry(1, 1, 1);
  const keyBaseY = FOOT_H + CASE_H + 0.002 + KEY_H / 2;

  // Keyboard layout: [widthInUnits, isBlueModifier]
  const rows = [
    // Row 0: Esc, F1-F12, Del
    [
      [1, true], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [2, true],
    ],
    // Row 1: ~, 1-0, -, =, Backspace
    [
      [1, true], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [2, true],
    ],
    // Row 2: Tab, Q-P, [, ], \
    [
      [1.5, true], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1.5, true],
    ],
    // Row 3: Caps, A-L, ;, ', Enter
    [
      [1.75, true], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [2.25, true],
    ],
    // Row 4: LShift, Z-M, ,, ., /, RShift
    [
      [2.25, true], [1, false], [1, false], [1, false], [1, false],
      [1, false], [1, false], [1, false], [1, false], [1, false],
      [1, false], [2.75, true],
    ],
    // Row 5: Ctrl, Win, Alt, Space, Alt, Left, Down/Up, Right
    [
      [1.25, true], [1.25, true], [1.25, true], [6.25, false],
      [1.25, true], [1.25, true], [1.25, true], [1.25, true],
    ],
  ];

  let keyIndex = 1;
  rows.forEach((row, rIdx) => {
    let cursorX = START_X;
    const z = START_Z + (rIdx + 0.5) * UNIT;
    row.forEach((spec) => {
      const u = spec[0];
      const isBlue = spec[1];
      const kw = u * UNIT - KEY_GAP;
      const kd = UNIT - KEY_GAP;
      const keyMesh = new THREE.Mesh(keyGeo, isBlue ? keyBlueMat : keyLightMat);
      keyMesh.name = `keycap_${keyIndex++}`;
      keyMesh.scale.set(kw, KEY_H, kd);
      keyMesh.position.set(cursorX + (u * UNIT) / 2, keyBaseY, z);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      group.add(keyMesh);
      cursorX += u * UNIT;
    });
  });

  return group;
}
