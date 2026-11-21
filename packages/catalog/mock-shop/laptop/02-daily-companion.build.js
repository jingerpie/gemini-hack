function build(THREE) {
  const W = 0.36;
  const D = 0.24;
  const BASE_H = 0.015;
  const LID_H = 0.006;
  const FOOT_H = 0.002;
  const OPEN_ANGLE_RAD = (15 * Math.PI) / 180; // 105 deg open = 15 deg back from vertical
  const Z_OFFSET = 0.02; // shift forward slightly so open assembly centers near z = 0

  const group = new THREE.Group();

  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x4b525c,
    roughness: 0.45,
    metalness: 0.35
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.6,
    metalness: 0.1
  });
  const matKey = new THREE.MeshStandardMaterial({
    color: 0x202328,
    roughness: 0.55,
    metalness: 0.1
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0x555d68,
    roughness: 0.35,
    metalness: 0.3
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x121315,
    roughness: 0.9,
    metalness: 0.0
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x3b5978,
    emissive: 0x5c8ab8,
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.05
  });

  function addMesh(parent, geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Rubber feet at y = 0
  const footGeo = new THREE.CylinderGeometry(0.007, 0.007, FOOT_H, 16);
  const fx = W / 2 - 0.022;
  const fzFront = Z_OFFSET + D / 2 - 0.02;
  const fzBack = Z_OFFSET - D / 2 + 0.02;
  addMesh(group, footGeo, matRubber, "rubber_foot_fl", -fx, FOOT_H / 2, fzFront);
  addMesh(group, footGeo, matRubber, "rubber_foot_fr", fx, FOOT_H / 2, fzFront);
  addMesh(group, footGeo, matRubber, "rubber_foot_bl", -fx, FOOT_H / 2, fzBack);
  addMesh(group, footGeo, matRubber, "rubber_foot_br", fx, FOOT_H / 2, fzBack);

  // Base chassis
  const baseTopY = FOOT_H + BASE_H;
  addMesh(
    group,
    new THREE.BoxGeometry(W, BASE_H, D),
    matChassis,
    "base_chassis",
    0,
    FOOT_H + BASE_H / 2,
    Z_OFFSET
  );

  // Keyboard well
  const kbW = W - 0.036;
  const kbD = 0.102;
  const kbZ = Z_OFFSET - D / 2 + 0.072;
  addMesh(
    group,
    new THREE.BoxGeometry(kbW, 0.001, kbD),
    matBezel,
    "keyboard_well",
    0,
    baseTopY + 0.0005,
    kbZ
  );

  // 6 rows of keys
  const rowCount = 6;
  const rowDepth = 0.013;
  const rowGap = 0.003;
  const startRowZ = kbZ - kbD / 2 + 0.01;
  const rowGeo = new THREE.BoxGeometry(kbW - 0.008, 0.002, rowDepth);
  for (let i = 0; i < rowCount; i++) {
    addMesh(
      group,
      rowGeo,
      matKey,
      `key_row_${i + 1}`,
      0,
      baseTopY + 0.0015,
      startRowZ + i * (rowDepth + rowGap)
    );
  }

  // Trackpad (offset slightly left as in photo)
  addMesh(
    group,
    new THREE.BoxGeometry(0.105, 0.001, 0.068),
    matTrackpad,
    "trackpad",
    -0.028,
    baseTopY + 0.0006,
    Z_OFFSET + D / 2 - 0.052
  );

  // Power button
  addMesh(
    group,
    new THREE.CylinderGeometry(0.004, 0.004, 0.0015, 16),
    matKey,
    "power_button",
    W / 2 - 0.022,
    baseTopY + 0.00075,
    Z_OFFSET - D / 2 + 0.012
  );

  // Hinge bar
  const hingeZ = Z_OFFSET - D / 2 + 0.008;
  const hingeMesh = addMesh(
    group,
    new THREE.CylinderGeometry(0.006, 0.006, W * 0.72, 16),
    matBezel,
    "hinge_bar",
    0,
    baseTopY - 0.002,
    hingeZ
  );
  hingeMesh.rotation.z = Math.PI / 2;

  // Lid group (hinged at back, tilted back 15 deg for 105 deg open pose)
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, baseTopY - 0.002, hingeZ);
  lidGroup.rotation.x = -OPEN_ANGLE_RAD;
  group.add(lidGroup);

  // Lid back shell
  addMesh(
    lidGroup,
    new THREE.BoxGeometry(W, D, LID_H),
    matChassis,
    "lid_back",
    0,
    D / 2,
    0
  );

  // Screen bezel
  addMesh(
    lidGroup,
    new THREE.BoxGeometry(W - 0.004, D - 0.006, 0.0015),
    matBezel,
    "screen_bezel",
    0,
    D / 2,
    LID_H / 2 + 0.00075
  );

  // Lit screen
  addMesh(
    lidGroup,
    new THREE.BoxGeometry(W - 0.022, D - 0.036, 0.001),
    matScreen,
    "emit_screen",
    0,
    D / 2 + 0.005,
    LID_H / 2 + 0.0016
  );

  // Webcam module
  addMesh(
    lidGroup,
    new THREE.BoxGeometry(0.018, 0.005, 0.0012),
    matRubber,
    "webcam_module",
    0,
    D - 0.008,
    LID_H / 2 + 0.0016
  );

  return group;
}
