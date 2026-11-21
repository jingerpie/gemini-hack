function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a 75% mechanical keyboard
  const W = 0.328;
  const D = 0.148;
  const BASE_H = 0.012;
  const UPPER_W = 0.312;
  const UPPER_D = 0.134;
  const UPPER_H = 0.018;
  const TILT_RAD = 0.09; // ~5.1 degrees typing angle

  const KEY_PITCH = 0.01905; // Standard 19.05mm key pitch
  const KEY_W = 0.0172;
  const KEY_D = 0.0172;
  const KEY_H = 0.009;

  // Materials
  const caseDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.42,
    metalness: 0.65
  });
  const baseTrimMat = new THREE.MeshStandardMaterial({
    color: 0x55585e,
    roughness: 0.32,
    metalness: 0.85
  });
  const keyDarkMat = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.55,
    metalness: 0.08
  });
  const keyLightMat = new THREE.MeshStandardMaterial({
    color: 0x52555a,
    roughness: 0.52,
    metalness: 0.08
  });
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x16171a,
    roughness: 0.35,
    metalness: 0.78
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x222326,
    roughness: 0.8,
    metalness: 0.1
  });
  const metalPlugMat = new THREE.MeshStandardMaterial({
    color: 0x7a7d82,
    roughness: 0.3,
    metalness: 0.9
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

  // 1. Lower base (touches y = 0)
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  addMesh(group, baseGeo, caseDarkMat, 'lower_base', 0, BASE_H / 2, 0);

  // Subtle metallic trim around the top edge of the lower base
  const trimGeo = new THREE.BoxGeometry(W + 0.001, 0.002, D + 0.001);
  addMesh(group, trimGeo, baseTrimMat, 'base_trim_rim', 0, BASE_H - 0.001, 0);

  // 2. Tilted upper deck group
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, BASE_H + 0.004, 0);
  deckGroup.rotation.x = TILT_RAD;
  group.add(deckGroup);

  const upperCaseGeo = new THREE.BoxGeometry(UPPER_W, UPPER_H, UPPER_D);
  addMesh(deckGroup, upperCaseGeo, caseDarkMat, 'upper_deck', 0, UPPER_H / 2, 0);

  // Inner switch plate
  const plateGeo = new THREE.BoxGeometry(UPPER_W - 0.012, 0.002, UPPER_D - 0.012);
  addMesh(deckGroup, plateGeo, keyDarkMat, 'switch_plate', 0, UPPER_H + 0.0005, 0);

  // 3. Rotary knob at top-right (+X, -Z)
  const knobR = 0.0095;
  const knobH = 0.011;
  const knobGeo = new THREE.CylinderGeometry(knobR, knobR, knobH, 28);
  const knobX = UPPER_W / 2 - 0.018;
  const knobZ = -UPPER_D / 2 + 0.016;
  addMesh(deckGroup, knobGeo, knobMat, 'rotary_knob', knobX, UPPER_H + knobH / 2, knobZ);

  // 4. Keycaps (75% layout)
  const keyGeo = new THREE.BoxGeometry(KEY_W, KEY_H, KEY_D);
  const keyY = UPPER_H + KEY_H / 2 + 0.001;
  const startX = -UPPER_W / 2 + 0.0155;
  const startZ = -UPPER_D / 2 + 0.016;

  // Helper to place a row of keys: each entry is [widthInU, isDark, gapBeforeInU]
  const rows = [
    // Row 0: F-row (Esc, F1-F4 light, F5-F8 dark, F9-F12 light, Del)
    [
      [1, true, 0],
      [1, false, 0.25], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, true, 0.2], [1, true, 0], [1, true, 0], [1, true, 0],
      [1, false, 0.2], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, true, 0.2]
    ],
    // Row 1: Number row
    [
      [1, true, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [2, true, 0], [1, true, 0.25]
    ],
    // Row 2: QWERTY row
    [
      [1.5, true, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1.5, true, 0], [1, true, 0.25]
    ],
    // Row 3: Home row
    [
      [1.75, true, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0],
      [2.25, true, 0], [1, true, 0.25]
    ],
    // Row 4: Shift row
    [
      [2.25, true, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0], [1, false, 0], [1, false, 0],
      [1, false, 0], [1, false, 0],
      [1.75, true, 0], [1, true, 0.15]
    ],
    // Row 5: Bottom row (Ctrl, Win, Alt, Spacebar, Alt, Fn, Left, Down, Right)
    [
      [1.25, true, 0], [1.25, true, 0], [1.25, true, 0],
      [6.25, false, 0],
      [1, true, 0], [1, true, 0],
      [1, true, 0.15], [1, true, 0], [1, true, 0]
    ]
  ];

  let keyIndex = 0;
  for (let r = 0; r < rows.length; r++) {
    let cursorU = 0;
    const zPos = startZ + r * KEY_PITCH + (r > 0 ? 0.002 : 0);
    for (let c = 0; c < rows[r].length; c++) {
      const [uWidth, isDark, gapU] = rows[r][c];
      cursorU += gapU;
      const xPos = startX + (cursorU + uWidth / 2) * KEY_PITCH;
      const keyMesh = new THREE.Mesh(keyGeo, isDark ? keyDarkMat : keyLightMat);
      keyMesh.name = `keycap_r${r}_c${c}_${keyIndex++}`;
      keyMesh.position.set(xPos, keyY, zPos);
      if (uWidth !== 1) {
        keyMesh.scale.x = (uWidth * KEY_PITCH - 0.0018) / KEY_W;
      }
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      deckGroup.add(keyMesh);
      cursorU += uWidth;
    }
  }

  // 5. USB-C cable exiting the back (-Z)
  const plugGeo = new THREE.BoxGeometry(0.011, 0.006, 0.014);
  const plugZ = -D / 2 - 0.004;
  const plugY = BASE_H + 0.006;
  addMesh(group, plugGeo, metalPlugMat, 'usbc_plug', 0.01, plugY, plugZ);

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.01, plugY, plugZ - 0.006),
    new THREE.Vector3(0.025, 0.008, plugZ - 0.035),
    new THREE.Vector3(0.065, 0.004, plugZ - 0.075),
    new THREE.Vector3(0.14, 0.003, plugZ - 0.095),
    new THREE.Vector3(0.24, 0.003, plugZ - 0.09)
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 24, 0.0028, 12, false);
  addMesh(group, cableGeo, cableMat, 'usbc_cable', 0, 0, 0);

  // Cylindrical ferrite/connector barrel on the cable
  const barrelGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.018, 16);
  addMesh(group, barrelGeo, cableMat, 'cable_ferrite_barrel', 0.048, 0.006, plugZ - 0.058, Math.PI / 2, 0, -0.7);

  return group;
}
