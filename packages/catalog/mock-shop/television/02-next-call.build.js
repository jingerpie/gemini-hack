function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.05;
  const H = 0.65;
  const D = 0.11;

  const BEZEL_SIDE = 0.014;
  const BEZEL_TOP = 0.014;
  const BEZEL_BOTTOM = 0.052;
  const TV_DEPTH = 0.036;
  const MOUNT_DEPTH = D - TV_DEPTH;

  const SCREEN_W = W - BEZEL_SIDE * 2;
  const SCREEN_H = H - BEZEL_TOP - BEZEL_BOTTOM;
  const SCREEN_CENTER_Y = BEZEL_BOTTOM + SCREEN_H / 2;

  const Z_WALL = -D / 2;
  const Z_TV_BACK = Z_WALL + MOUNT_DEPTH;
  const Z_TV_FRONT = D / 2;

  // Materials
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x454547,
    roughness: 0.45,
    metalness: 0.55,
  });

  const matInnerFrame = new THREE.MeshStandardMaterial({
    color: 0x151517,
    roughness: 0.35,
    metalness: 0.2,
  });

  const matSpeaker = new THREE.MeshStandardMaterial({
    color: 0x202022,
    roughness: 0.75,
    metalness: 0.3,
  });

  const matMount = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.5,
    metalness: 0.7,
  });

  const matScrew = new THREE.MeshStandardMaterial({
    color: 0x88888c,
    roughness: 0.3,
    metalness: 0.85,
  });

  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x111822,
    emissive: 0xdbeeff,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  function addMesh(name, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Main rear housing
  const housingDepth = TV_DEPTH - 0.008;
  addMesh(
    'tv_back_housing',
    new THREE.BoxGeometry(W - 0.004, H - 0.004, housingDepth),
    matChassis,
    0,
    H / 2,
    Z_TV_BACK + housingDepth / 2
  );

  // Outer bezel frame
  const bezelZ = Z_TV_FRONT - 0.004 - 0.004;
  const bezelDepth = 0.01;

  addMesh(
    'bezel_top',
    new THREE.BoxGeometry(W, BEZEL_TOP, bezelDepth),
    matChassis,
    0,
    H - BEZEL_TOP / 2,
    bezelZ
  );

  addMesh(
    'bezel_bottom',
    new THREE.BoxGeometry(W, BEZEL_BOTTOM, bezelDepth),
    matChassis,
    0,
    BEZEL_BOTTOM / 2,
    bezelZ
  );

  const sideH = H - BEZEL_TOP - BEZEL_BOTTOM;
  addMesh(
    'bezel_left',
    new THREE.BoxGeometry(BEZEL_SIDE, sideH, bezelDepth),
    matChassis,
    -W / 2 + BEZEL_SIDE / 2,
    SCREEN_CENTER_Y,
    bezelZ
  );

  addMesh(
    'bezel_right',
    new THREE.BoxGeometry(BEZEL_SIDE, sideH, bezelDepth),
    matChassis,
    W / 2 - BEZEL_SIDE / 2,
    SCREEN_CENTER_Y,
    bezelZ
  );

  // Speaker grilles on bottom bezel
  const spkW = 0.095;
  const spkH = 0.018;
  const spkD = 0.003;
  const spkX = W / 2 - 0.14;
  const spkY = BEZEL_BOTTOM * 0.45;
  const spkZ = bezelZ + bezelDepth / 2 + spkD / 2 - 0.001;

  addMesh(
    'speaker_grille_left',
    new THREE.BoxGeometry(spkW, spkH, spkD),
    matSpeaker,
    -spkX,
    spkY,
    spkZ
  );

  addMesh(
    'speaker_grille_right',
    new THREE.BoxGeometry(spkW, spkH, spkD),
    matSpeaker,
    spkX,
    spkY,
    spkZ
  );

  // Inner dark screen border
  addMesh(
    'screen_inner_frame',
    new THREE.BoxGeometry(SCREEN_W, SCREEN_H, 0.004),
    matInnerFrame,
    0,
    SCREEN_CENTER_Y,
    bezelZ + bezelDepth / 2 - 0.001
  );

  // Emissive screen panel slightly in front of bezel
  const screenPanelD = 0.002;
  addMesh(
    'emit_screen',
    new THREE.BoxGeometry(SCREEN_W - 0.008, SCREEN_H - 0.008, screenPanelD),
    matScreen,
    0,
    SCREEN_CENTER_Y,
    Z_TV_FRONT - screenPanelD / 2
  );

  // VESA plate on back of TV
  const vesaSize = 0.24;
  const vesaD = 0.006;
  addMesh(
    'vesa_plate',
    new THREE.BoxGeometry(vesaSize, vesaSize, vesaD),
    matMount,
    0,
    H * 0.5,
    Z_TV_BACK - vesaD / 2 + 0.001
  );

  // VESA corner screws
  const screwGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12);
  screwGeo.rotateX(Math.PI / 2);
  const screwOffset = vesaSize * 0.4;
  const screwZ = Z_TV_BACK - vesaD - 0.001;

  addMesh('vesa_screw_tl', screwGeo, matScrew, -screwOffset, H * 0.5 + screwOffset, screwZ);
  addMesh('vesa_screw_tr', screwGeo, matScrew, screwOffset, H * 0.5 + screwOffset, screwZ);
  addMesh('vesa_screw_bl', screwGeo, matScrew, -screwOffset, H * 0.5 - screwOffset, screwZ);
  addMesh('vesa_screw_br', screwGeo, matScrew, screwOffset, H * 0.5 - screwOffset, screwZ);

  // Wall mount bracket
  const wallPlateW = 0.26;
  const wallPlateH = 0.28;
  const wallPlateD = 0.012;
  addMesh(
    'mount_wall_plate',
    new THREE.BoxGeometry(wallPlateW, wallPlateH, wallPlateD),
    matMount,
    0,
    H * 0.5,
    Z_WALL + wallPlateD / 2
  );

  // Side vertical rails on wall plate
  const railW = 0.025;
  const railH = wallPlateH + 0.02;
  const railD = 0.022;
  addMesh(
    'mount_rail_left',
    new THREE.BoxGeometry(railW, railH, railD),
    matMount,
    -wallPlateW / 2 + railW / 2,
    H * 0.5,
    Z_WALL + railD / 2
  );

  addMesh(
    'mount_rail_right',
    new THREE.BoxGeometry(railW, railH, railD),
    matMount,
    wallPlateW / 2 - railW / 2,
    H * 0.5,
    Z_WALL + railD / 2
  );

  // Top and bottom flanges
  const flangeH = 0.016;
  const flangeD = 0.026;
  addMesh(
    'mount_top_flange',
    new THREE.BoxGeometry(wallPlateW, flangeH, flangeD),
    matMount,
    0,
    H * 0.5 + wallPlateH / 2 - flangeH / 2,
    Z_WALL + flangeD / 2
  );

  addMesh(
    'mount_bottom_flange',
    new THREE.BoxGeometry(wallPlateW, flangeH, flangeD),
    matMount,
    0,
    H * 0.5 - wallPlateH / 2 + flangeH / 2,
    Z_WALL + flangeD / 2
  );

  // Central spacer arm connecting wall plate to VESA plate
  const armD = MOUNT_DEPTH - wallPlateD - vesaD + 0.004;
  addMesh(
    'mount_arm_main',
    new THREE.BoxGeometry(0.11, 0.16, armD),
    matMount,
    0,
    H * 0.5,
    Z_WALL + wallPlateD + armD / 2 - 0.002
  );

  return group;
}
