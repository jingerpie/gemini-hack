function build(THREE) {
  const W = 0.36;
  const D = 0.25;
  const BASE_H = 0.015;
  const FOOT_H = 0.002;
  const LID_THICK = 0.006;
  const LID_H = 0.24;
  const BEZEL = 0.007;
  const OPEN_ANGLE_RAD = (15 * Math.PI) / 180; // 105 deg open = 15 deg tilted back from vertical
  const Z_OFFSET = (LID_H * Math.sin(OPEN_ANGLE_RAD)) * 0.5;

  const group = new THREE.Group();

  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x4d5156,
    roughness: 0.38,
    metalness: 0.78
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x26282b,
    roughness: 0.5,
    metalness: 0.6
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.35,
    metalness: 0.2
  });
  const matKey = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.65,
    metalness: 0.1
  });
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0x43474c,
    roughness: 0.32,
    metalness: 0.7
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.9,
    metalness: 0.05
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    roughness: 0.25,
    metalness: 0.85
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x6b93b8,
    emissive: 0x6b93b8,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.1
  });

  function addMesh(parent, name, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const laptop = new THREE.Group();
  laptop.position.set(0, 0, Z_OFFSET);
  group.add(laptop);

  // 4 rubber feet touching y = 0
  const footGeo = new THREE.CylinderGeometry(0.008, 0.008, FOOT_H, 16);
  const footX = W * 0.42;
  const footZ = D * 0.4;
  addMesh(laptop, 'foot_fl', footGeo, matRubber, -footX, FOOT_H / 2, footZ);
  addMesh(laptop, 'foot_fr', footGeo, matRubber, footX, FOOT_H / 2, footZ);
  addMesh(laptop, 'foot_bl', footGeo, matRubber, -footX, FOOT_H / 2, -footZ);
  addMesh(laptop, 'foot_br', footGeo, matRubber, footX, FOOT_H / 2, -footZ);

  // Base chassis
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  addMesh(laptop, 'base_chassis', baseGeo, matChassis, 0, FOOT_H + BASE_H / 2, 0);

  // Front thumb-notch accent
  const notchGeo = new THREE.BoxGeometry(0.055, 0.003, 0.004);
  addMesh(laptop, 'front_notch', notchGeo, matAccent, 0, FOOT_H + BASE_H - 0.002, D / 2 + 0.0005);

  // Keyboard recess bed
  const kbW = W * 0.84;
  const kbD = D * 0.42;
  const kbZ = -D * 0.14;
  const kbBedGeo = new THREE.BoxGeometry(kbW, 0.002, kbD);
  addMesh(laptop, 'keyboard_bed', kbBedGeo, matDarkMetal, 0, FOOT_H + BASE_H + 0.0002, kbZ);

  // Keyboard key rows (6 rows)
  const rowGeo = new THREE.BoxGeometry(kbW - 0.008, 0.0025, (kbD - 0.014) / 6 - 0.002);
  for (let i = 0; i < 6; i++) {
    const rz = kbZ - kbD / 2 + 0.007 + ((kbD - 0.014) / 6) * (i + 0.5);
    addMesh(laptop, `keyboard_row_${i + 1}`, rowGeo, matKey, 0, FOOT_H + BASE_H + 0.0015, rz);
  }

  // Trackpad
  const tpW = W * 0.34;
  const tpD = D * 0.28;
  const tpGeo = new THREE.BoxGeometry(tpW, 0.0015, tpD);
  addMesh(laptop, 'trackpad', tpGeo, matTrackpad, 0, FOOT_H + BASE_H + 0.0005, D * 0.26);

  // Hinge bar at back
  const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, W * 0.78, 16);
  addMesh(laptop, 'hinge_bar', hingeGeo, matDarkMetal, 0, FOOT_H + BASE_H, -D / 2 + 0.008, 0, 0, Math.PI / 2);

  // Lid group pivoted at hinge
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, FOOT_H + BASE_H, -D / 2 + 0.008);
  lidGroup.rotation.x = -OPEN_ANGLE_RAD;
  laptop.add(lidGroup);

  // Lid backplate
  const lidBackGeo = new THREE.BoxGeometry(W, LID_H, LID_THICK);
  addMesh(lidGroup, 'lid_backplate', lidBackGeo, matChassis, 0, LID_H / 2, -LID_THICK / 2);

  // Screen bezel
  const bezelGeo = new THREE.BoxGeometry(W - 0.002, LID_H - 0.002, 0.002);
  addMesh(lidGroup, 'screen_bezel', bezelGeo, matBezel, 0, LID_H / 2, 0.0005);

  // Lit screen
  const screenW = W - BEZEL * 2;
  const screenH = LID_H - BEZEL * 2.4;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.0015);
  addMesh(lidGroup, 'emit_screen', screenGeo, matScreen, 0, LID_H / 2 + BEZEL * 0.15, 0.0015);

  // Webcam dot
  const camGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.0015, 12);
  addMesh(lidGroup, 'webcam', camGeo, matDarkMetal, 0, LID_H - BEZEL * 0.65, 0.0018, Math.PI / 2, 0, 0);

  return group;
}
