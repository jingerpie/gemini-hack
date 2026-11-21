function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a 13-inch detachable 2-in-1 laptop
  const W = 0.29;
  const TAB_H = 0.205;
  const TAB_T = 0.008;
  const KB_D = 0.205;
  const KB_T = 0.005;
  const TILT_RAD = (15 * Math.PI) / 180; // 105 deg open angle (90 + 15)

  // Centering offset along Z so the overall laptop footprint is centered near z = 0
  const KICK_BACK = 0.095;
  const Z_HINGE = -(KB_D - KICK_BACK) * 0.5;

  // Materials
  const matAluminum = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.32,
    metalness: 0.85,
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    roughness: 0.45,
    metalness: 0.65,
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.25,
    metalness: 0.1,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x4f6d8a,
    emissive: 0x5c7f9e,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.05,
  });
  const matFabric = new THREE.MeshStandardMaterial({
    color: 0xb6b8ba,
    roughness: 0.88,
    metalness: 0.02,
  });
  const matKey = new THREE.MeshStandardMaterial({
    color: 0xcfd1d3,
    roughness: 0.65,
    metalness: 0.05,
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0xaeb0b3,
    roughness: 0.45,
    metalness: 0.05,
  });
  const matCable = new THREE.MeshStandardMaterial({
    color: 0x2e3033,
    roughness: 0.75,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, pos, rot, parent) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (parent || group).add(mesh);
    return mesh;
  }

  // 1. Keyboard Deck (flat on y = 0)
  addMesh(
    new THREE.BoxGeometry(W, KB_T, KB_D),
    matFabric,
    'keyboard_deck',
    [0, KB_T * 0.5, Z_HINGE + KB_D * 0.5]
  );

  // Hinge spine connecting keyboard to tablet
  addMesh(
    new THREE.BoxGeometry(W * 0.96, KB_T * 0.9, 0.012),
    matFabric,
    'keyboard_hinge',
    [0, KB_T * 0.5, Z_HINGE]
  );

  // Keybed rows (5 rows of keys)
  const keyAreaW = W * 0.88;
  const keyRowD = 0.014;
  const keyRowGap = 0.003;
  const keyStartZ = Z_HINGE + 0.022;
  for (let i = 0; i < 5; i++) {
    addMesh(
      new THREE.BoxGeometry(keyAreaW, 0.0018, keyRowD),
      matKey,
      'key_row_' + (i + 1),
      [0, KB_T + 0.0009, keyStartZ + i * (keyRowD + keyRowGap)]
    );
  }

  // Trackpad
  addMesh(
    new THREE.BoxGeometry(0.105, 0.0012, 0.068),
    matTrackpad,
    'trackpad',
    [0, KB_T + 0.0006, Z_HINGE + KB_D - 0.048]
  );

  // 2. Tablet Group (pivoted at Z_HINGE, tilted back 15 deg)
  const tabletGroup = new THREE.Group();
  tabletGroup.position.set(0, KB_T, Z_HINGE);
  tabletGroup.rotation.x = -TILT_RAD;
  group.add(tabletGroup);

  // Tablet aluminum body
  addMesh(
    new THREE.BoxGeometry(W, TAB_H, TAB_T),
    matAluminum,
    'tablet_body',
    [0, TAB_H * 0.5, 0],
    null,
    tabletGroup
  );

  // Screen bezel
  addMesh(
    new THREE.BoxGeometry(W - 0.006, TAB_H - 0.006, 0.0012),
    matBezel,
    'screen_bezel',
    [0, TAB_H * 0.5, TAB_T * 0.5 + 0.0004],
    null,
    tabletGroup
  );

  // Lit screen (emit_screen)
  addMesh(
    new THREE.BoxGeometry(W - 0.018, TAB_H - 0.018, 0.001),
    matScreen,
    'emit_screen',
    [0, TAB_H * 0.5, TAB_T * 0.5 + 0.0011],
    null,
    tabletGroup
  );

  // 3. Kickstand (hinged at mid-back of tablet, reaching y = 0)
  const kickTopY = TAB_H * 0.48;
  const kickWorldTopY = KB_T + kickTopY * Math.cos(TILT_RAD);
  const kickWorldTopZ = Z_HINGE - kickTopY * Math.sin(TILT_RAD) - TAB_T * 0.5;
  const kickBottomZ = Z_HINGE - KICK_BACK;
  const kickDY = kickWorldTopY;
  const kickDZ = kickWorldTopZ - kickBottomZ;
  const kickLen = Math.sqrt(kickDY * kickDY + kickDZ * kickDZ);
  const kickAngle = Math.atan2(kickDZ, kickDY);

  addMesh(
    new THREE.BoxGeometry(W * 0.94, kickLen, 0.004),
    matDarkMetal,
    'kickstand',
    [0, kickWorldTopY * 0.5, (kickWorldTopZ + kickBottomZ) * 0.5],
    [kickAngle, 0, 0]
  );

  // 4. USB-C Plug & Charging Cable on left side (-X)
  const portH = TAB_H * 0.38;
  const portWorldY = KB_T + portH * Math.cos(TILT_RAD);
  const portWorldZ = Z_HINGE - portH * Math.sin(TILT_RAD);
  const portX = -W * 0.5;

  addMesh(
    new THREE.BoxGeometry(0.014, 0.008, 0.011),
    matAluminum,
    'usb_plug',
    [portX - 0.007, portWorldY, portWorldZ],
    [-TILT_RAD, 0, 0]
  );

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(portX - 0.014, portWorldY, portWorldZ),
    new THREE.Vector3(portX - 0.045, portWorldY * 0.72, portWorldZ - 0.01),
    new THREE.Vector3(portX - 0.085, 0.012, portWorldZ - 0.045),
    new THREE.Vector3(portX - 0.055, 0.003, portWorldZ - 0.085),
    new THREE.Vector3(portX + 0.02, 0.003, portWorldZ - 0.065),
  ]);
  addMesh(
    new THREE.TubeGeometry(cableCurve, 24, 0.0022, 8, false),
    matCable,
    'usb_cable'
  );

  // 5. Stylus Pen resting on table to the right (+X)
  const penX = W * 0.5 + 0.048;
  const penZ = Z_HINGE + 0.055;
  const penR = 0.0045;
  const penLen = 0.142;

  addMesh(
    new THREE.CylinderGeometry(penR, penR, penLen, 16),
    matAluminum,
    'stylus_body',
    [penX, penR, penZ],
    [Math.PI * 0.5, 0, 0.22]
  );

  addMesh(
    new THREE.ConeGeometry(penR, 0.014, 16),
    matDarkMetal,
    'stylus_tip',
    [
      penX - Math.sin(0.22) * (penLen * 0.5 + 0.007),
      penR,
      penZ + Math.cos(0.22) * (penLen * 0.5 + 0.007),
    ],
    [Math.PI * 0.5, 0, 0.22]
  );

  return group;
}
