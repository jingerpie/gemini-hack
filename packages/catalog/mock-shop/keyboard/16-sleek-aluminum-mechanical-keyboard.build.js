function build(THREE) {
  const W = 0.326;
  const D = 0.136;
  const H = 0.032;
  const FOOT_H = 0.002;
  const CASE_H = 0.018;
  const BEZEL = 0.009;
  const PLATE_H = 0.002;
  const KEY_U = 0.019;
  const KEY_GAP = 0.0014;
  const KEY_H = 0.0085;
  const TILT = 0.075; // ~4.3 deg typing angle

  const group = new THREE.Group();

  const matCase = new THREE.MeshStandardMaterial({
    color: 0x28384a,
    roughness: 0.38,
    metalness: 0.75
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: 0x181c22,
    roughness: 0.7,
    metalness: 0.2
  });
  const matFoot = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0
  });
  const matKeyCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.55,
    metalness: 0.05
  });
  const matKeyNavy = new THREE.MeshStandardMaterial({
    color: 0x2d3d50,
    roughness: 0.55,
    metalness: 0.05
  });
  const matKeyRed = new THREE.MeshStandardMaterial({
    color: 0xd14836,
    roughness: 0.5,
    metalness: 0.05
  });
  const matKeyYellow = new THREE.MeshStandardMaterial({
    color: 0xe2b03b,
    roughness: 0.5,
    metalness: 0.05
  });

  // Rubber feet touching y = 0
  const footGeo = new THREE.CylinderGeometry(0.007, 0.007, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + 0.02, -D / 2 + 0.018],
    [W / 2 - 0.02, -D / 2 + 0.018],
    [-W / 2 + 0.02, D / 2 - 0.018],
    [W / 2 - 0.02, D / 2 - 0.018]
  ];
  footPositions.forEach(([fx, fz], idx) => {
    const foot = new THREE.Mesh(footGeo, matFoot);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Tilted keyboard assembly
  const boardGroup = new THREE.Group();
  const pivotY = FOOT_H + CASE_H / 2 + (D / 2) * Math.sin(TILT);
  boardGroup.position.set(0, pivotY, 0);
  boardGroup.rotation.x = TILT;
  group.add(boardGroup);

  // Main case body
  const caseBase = new THREE.Mesh(new THREE.BoxGeometry(W, CASE_H, D), matCase);
  caseBase.name = 'keyboard_case_base';
  caseBase.castShadow = true;
  caseBase.receiveShadow = true;
  boardGroup.add(caseBase);

  // Inner plate
  const innerW = W - BEZEL * 2;
  const innerD = D - BEZEL * 2;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(innerW, PLATE_H, innerD), matPlate);
  plate.name = 'keyboard_plate';
  plate.position.set(0, CASE_H / 2 + PLATE_H / 2 - 0.002, 0);
  plate.castShadow = true;
  plate.receiveShadow = true;
  boardGroup.add(plate);

  // Raised bezel walls around the keys
  const bezelH = 0.006;
  const bezelY = CASE_H / 2 + bezelH / 2 - 0.001;
  const bezelParts = [
    { name: 'case_bezel_back', w: W, d: BEZEL, x: 0, z: -D / 2 + BEZEL / 2 },
    { name: 'case_bezel_front', w: W, d: BEZEL, x: 0, z: D / 2 - BEZEL / 2 },
    { name: 'case_bezel_left', w: BEZEL, d: innerD, x: -W / 2 + BEZEL / 2, z: 0 },
    { name: 'case_bezel_right', w: BEZEL, d: innerD, x: W / 2 - BEZEL / 2, z: 0 }
  ];
  bezelParts.forEach((b) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, bezelH, b.d), matCase);
    mesh.name = b.name;
    mesh.position.set(b.x, bezelY, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    boardGroup.add(mesh);
  });

  // Keycap layout (75% mechanical keyboard)
  // Each row: array of [width_in_U, material, gap_after_in_U]
  const rows = [
    // Row 0: Function row
    [
      [1, matKeyRed, 0.25],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0.25],
      [1, matKeyNavy, 0], [1, matKeyNavy, 0], [1, matKeyNavy, 0.25],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0.25],
      [1, matKeyRed, 0]
    ],
    // Row 1: Number row
    [
      [1, matKeyNavy, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [2, matKeyNavy, 0],
      [1, matKeyNavy, 0]
    ],
    // Row 2: QWERTY row
    [
      [1.5, matKeyNavy, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1.5, matKeyCream, 0],
      [1, matKeyNavy, 0]
    ],
    // Row 3: ASDF row
    [
      [1.75, matKeyNavy, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [2.25, matKeyRed, 0],
      [1, matKeyNavy, 0]
    ],
    // Row 4: ZXCV row
    [
      [2.25, matKeyNavy, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1, matKeyCream, 0], [1, matKeyCream, 0],
      [1.75, matKeyNavy, 0],
      [1, matKeyRed, 0]
    ],
    // Row 5: Bottom row
    [
      [1.25, matKeyNavy, 0],
      [1.25, matKeyNavy, 0],
      [1.25, matKeyNavy, 0],
      [6.25, matKeyCream, 0],
      [1, matKeyNavy, 0],
      [1, matKeyNavy, 0],
      [1, matKeyYellow, 0],
      [1, matKeyYellow, 0],
      [1, matKeyYellow, 0]
    ]
  ];

  const keyGeo = new THREE.BoxGeometry(1, 1, 1);
  const startX = -innerW / 2 + 0.002;
  const startZ = -innerD / 2 + 0.002 + KEY_U / 2;
  const keyY = CASE_H / 2 + PLATE_H / 2 + KEY_H / 2 - 0.001;

  let keyIndex = 0;
  rows.forEach((row, rIdx) => {
    let cursorX = startX;
    const z = startZ + rIdx * KEY_U;
    row.forEach(([uWidth, mat, gapAfter]) => {
      const kw = uWidth * KEY_U - KEY_GAP;
      const kd = KEY_U - KEY_GAP;
      const keyMesh = new THREE.Mesh(keyGeo, mat);
      keyIndex += 1;
      keyMesh.name = `keycap_${rIdx}_${keyIndex}`;
      keyMesh.scale.set(kw, KEY_H, kd);
      keyMesh.position.set(cursorX + (uWidth * KEY_U) / 2, keyY, z);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      boardGroup.add(keyMesh);
      cursorX += (uWidth + gapAfter) * KEY_U;
    });
  });

  return group;
}
