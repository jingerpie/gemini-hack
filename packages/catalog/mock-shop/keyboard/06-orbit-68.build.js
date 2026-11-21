function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.320;
  const D = 0.135;
  const H = 0.036;
  const TILT = 0.095; // ~5.4 deg typing angle
  const U = 0.01905;  // standard 1u key pitch
  const KEY_GAP = 0.0022;
  const KEY_H = 0.0095;
  const CASE_H = 0.020;
  const FOOT_H = 0.0025;
  const FOOT_R = 0.006;

  // Materials
  const matCase = new THREE.MeshStandardMaterial({
    color: 0x383b40,
    roughness: 0.42,
    metalness: 0.65
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: 0x1e2024,
    roughness: 0.6,
    metalness: 0.4
  });
  const matFeet = new THREE.MeshStandardMaterial({
    color: 0x151517,
    roughness: 0.9,
    metalness: 0.05
  });
  const matWhite = new THREE.MeshStandardMaterial({
    color: 0xe6e5e0,
    roughness: 0.45,
    metalness: 0.05
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x26282c,
    roughness: 0.45,
    metalness: 0.05
  });
  const matRed = new THREE.MeshStandardMaterial({
    color: 0xb52b27,
    roughness: 0.4,
    metalness: 0.05
  });
  const matBlue = new THREE.MeshStandardMaterial({
    color: 0x2464a3,
    roughness: 0.4,
    metalness: 0.05
  });

  // Shared geometries
  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);

  // Tilted keyboard assembly
  const bodyGroup = new THREE.Group();
  // Position so front-bottom of case rests on feet at y = 0
  const frontZ = D / 2;
  const tiltOffsetY = Math.sin(TILT) * frontZ + (CASE_H / 2) * Math.cos(TILT) + FOOT_H;
  bodyGroup.position.set(0, tiltOffsetY, 0);
  bodyGroup.rotation.x = TILT;
  group.add(bodyGroup);

  // Main case
  const caseMesh = new THREE.Mesh(unitBoxGeo, matCase);
  caseMesh.scale.set(W, CASE_H, D);
  caseMesh.name = 'keyboard_case';
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  bodyGroup.add(caseMesh);

  // Inner switch plate
  const plateW = 15 * U + 0.004;
  const plateD = 6 * U + 0.004;
  const plateMesh = new THREE.Mesh(unitBoxGeo, matPlate);
  plateMesh.scale.set(plateW, 0.002, plateD);
  plateMesh.position.set(0, CASE_H / 2 + 0.0005, 0);
  plateMesh.name = 'switch_plate';
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  bodyGroup.add(plateMesh);

  // Four rubber feet touching y = 0
  const footPositions = [
    [-W / 2 + 0.022, FOOT_H / 2, D / 2 - 0.016],
    [W / 2 - 0.022, FOOT_H / 2, D / 2 - 0.016],
    [-W / 2 + 0.022, FOOT_H / 2 + Math.sin(TILT) * (D - 0.032), -D / 2 + 0.016],
    [W / 2 - 0.022, FOOT_H / 2 + Math.sin(TILT) * (D - 0.032), -D / 2 + 0.016]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, matFeet);
    foot.position.set(pos[0], pos[1], pos[2]);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Key layout: [widthInU, material]
  const rows = [
    // Row 0: F-row
    [
      [1, matRed], [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matDark], [1, matDark], [1, matDark], [1, matDark],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matDark], [1, matDark]
    ],
    // Row 1: Number row
    [
      [1, matDark],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [2, matDark]
    ],
    // Row 2: QWERTY
    [
      [1.5, matDark],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1.5, matDark]
    ],
    // Row 3: ASDF
    [
      [1.75, matDark],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite],
      [2.25, matBlue]
    ],
    // Row 4: ZXCV
    [
      [2.25, matDark],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite], [1, matWhite], [1, matWhite],
      [1, matWhite], [1, matWhite],
      [1.75, matDark], [1, matDark]
    ],
    // Row 5: Bottom row
    [
      [1.25, matDark], [1.25, matDark], [1.25, matDark],
      [6.25, matDark],
      [1, matDark], [1, matDark], [1, matDark], [1, matDark], [1, matDark]
    ]
  ];

  const startX = -(15 * U) / 2;
  const startZ = -(6 * U) / 2 + U / 2;
  const keyY = CASE_H / 2 + 0.0015 + KEY_H / 2;

  let keyIndex = 0;
  rows.forEach((row, rIdx) => {
    let cursorX = startX;
    const z = startZ + rIdx * U;
    row.forEach(([uWidth, mat]) => {
      const w = uWidth * U - KEY_GAP;
      const d = U - KEY_GAP;
      const key = new THREE.Mesh(unitBoxGeo, mat);
      key.scale.set(w, KEY_H, d);
      key.position.set(cursorX + (uWidth * U) / 2, keyY, z);
      key.name = `keycap_${++keyIndex}`;
      key.castShadow = true;
      key.receiveShadow = true;
      bodyGroup.add(key);
      cursorX += uWidth * U;
    });
  });

  return group;
}
