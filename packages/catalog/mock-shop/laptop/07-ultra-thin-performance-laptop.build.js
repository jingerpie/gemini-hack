function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.315;
  const D = 0.220;
  const BASE_H = 0.011;
  const FOOT_H = 0.0015;
  const LID_H = 0.215;
  const LID_T = 0.005;
  const OPEN_RAD = (105 * Math.PI) / 180;
  const TILT_BACK = OPEN_RAD - Math.PI / 2; // 15 deg tilted back from vertical
  const Z_OFFSET = 0.025; // center overall bounding box on z = 0

  // Materials
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x3b3f45,
    metalness: 0.85,
    roughness: 0.28,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x18191b,
    metalness: 0.05,
    roughness: 0.85,
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.1,
    roughness: 0.45,
  });
  const matKeys = new THREE.MeshStandardMaterial({
    color: 0xe6e7e9,
    metalness: 0.05,
    roughness: 0.4,
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0x52575e,
    metalness: 0.4,
    roughness: 0.35,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xd4af6a,
    metalness: 0.9,
    roughness: 0.25,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x4b5d6e,
    emissive: 0x5b7083,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.1,
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

  const laptop = new THREE.Group();
  laptop.position.z = Z_OFFSET;
  group.add(laptop);

  // Rubber feet touching y = 0
  const footGeo = new THREE.CylinderGeometry(0.008, 0.008, FOOT_H, 16);
  const footX = W / 2 - 0.022;
  const footZ = D / 2 - 0.02;
  addMesh(laptop, footGeo, matRubber, "foot_fl", -footX, FOOT_H / 2, footZ);
  addMesh(laptop, footGeo, matRubber, "foot_fr", footX, FOOT_H / 2, footZ);
  addMesh(laptop, footGeo, matRubber, "foot_bl", -footX, FOOT_H / 2, -footZ);
  addMesh(laptop, footGeo, matRubber, "foot_br", footX, FOOT_H / 2, -footZ);

  // Base chassis
  const baseY = FOOT_H + BASE_H / 2;
  addMesh(
    laptop,
    new THREE.BoxGeometry(W, BASE_H, D),
    matChassis,
    "base_chassis",
    0,
    baseY,
    0
  );

  // Keyboard recess
  const kbW = W - 0.036;
  const kbD = 0.095;
  const kbZ = -0.032;
  const topY = FOOT_H + BASE_H;
  addMesh(
    laptop,
    new THREE.BoxGeometry(kbW, 0.001, kbD),
    matBezel,
    "keyboard_recess",
    0,
    topY + 0.0002,
    kbZ
  );

  // 5 rows of white chiclet keys
  const rowCount = 5;
  const rowD = (kbD - 0.012) / rowCount;
  const keyGeo = new THREE.BoxGeometry(kbW - 0.008, 0.0022, rowD * 0.78);
  for (let i = 0; i < rowCount; i++) {
    const rz = kbZ - kbD / 2 + 0.006 + (i + 0.5) * rowD;
    addMesh(
      laptop,
      keyGeo,
      matKeys,
      `key_row_${i + 1}`,
      0,
      topY + 0.0012,
      rz
    );
  }

  // Trackpad
  addMesh(
    laptop,
    new THREE.BoxGeometry(0.11, 0.001, 0.068),
    matTrackpad,
    "trackpad",
    0,
    topY + 0.0004,
    0.062
  );

  // Hinge
  const hingeY = topY;
  const hingeZ = -D / 2 + 0.004;
  const hingeGeo = new THREE.CylinderGeometry(0.0045, 0.0045, W - 0.05, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  addMesh(laptop, hingeGeo, matBezel, "hinge", 0, hingeY, hingeZ);

  // Lid pivot group
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY, hingeZ);
  lidPivot.rotation.x = -TILT_BACK;
  laptop.add(lidPivot);

  // Lid back shell
  addMesh(
    lidPivot,
    new THREE.BoxGeometry(W, LID_H, LID_T),
    matChassis,
    "lid_back",
    0,
    LID_H / 2,
    0
  );

  // Screen bezel
  addMesh(
    lidPivot,
    new THREE.BoxGeometry(W - 0.004, LID_H - 0.004, 0.0015),
    matBezel,
    "screen_bezel",
    0,
    LID_H / 2,
    LID_T / 2 + 0.0005
  );

  // Lit screen
  const screenW = W - 0.014;
  const screenH = LID_H - 0.026;
  const screenY = LID_H / 2 + 0.006;
  addMesh(
    lidPivot,
    new THREE.BoxGeometry(screenW, screenH, 0.001),
    matScreen,
    "emit_screen",
    0,
    screenY,
    LID_T / 2 + 0.0012
  );

  // Gold logo on bottom chin
  const logoGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.001, 16);
  logoGeo.rotateX(Math.PI / 2);
  addMesh(
    lidPivot,
    logoGeo,
    matGold,
    "chin_logo",
    0,
    0.009,
    LID_T / 2 + 0.0014
  );

  // Webcam dot on top bezel
  const camGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.001, 12);
  camGeo.rotateX(Math.PI / 2);
  addMesh(
    lidPivot,
    camGeo,
    matTrackpad,
    "webcam_dot",
    0,
    LID_H - 0.006,
    LID_T / 2 + 0.0014
  );

  return group;
}
