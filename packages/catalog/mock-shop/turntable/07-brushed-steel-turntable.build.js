function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.35;
  const FOOT_H = 0.014;
  const FOOT_R = 0.024;
  const FOOT_INSET_X = 0.045;
  const FOOT_INSET_Z = 0.042;
  const PLINTH_H = 0.036;
  const PLINTH_Y = FOOT_H + PLINTH_H * 0.5;

  const PLATTER_R = 0.15;
  const PLATTER_H = 0.024;
  const PLATTER_X = -0.025;
  const PLATTER_Z = 0.005;
  const PLATTER_Y = FOOT_H + PLINTH_H + PLATTER_H * 0.5;

  const MAT_R = 0.146;
  const MAT_H = 0.003;
  const MAT_Y = FOOT_H + PLINTH_H + PLATTER_H + MAT_H * 0.5;

  const SPINDLE_R = 0.0036;
  const SPINDLE_H = 0.014;
  const SPINDLE_Y = FOOT_H + PLINTH_H + PLATTER_H + MAT_H + SPINDLE_H * 0.5;

  const ARM_BASE_X = 0.165;
  const ARM_BASE_Z = -0.105;
  const ARM_BASE_R = 0.024;
  const ARM_BASE_H = 0.008;
  const TOP_SURFACE_Y = FOOT_H + PLINTH_H;

  // Materials
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    metalness: 0.85,
    roughness: 0.32
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x52565a,
    metalness: 0.8,
    roughness: 0.38
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    metalness: 0.05,
    roughness: 0.85
  });
  const vinylMat = new THREE.MeshStandardMaterial({
    color: 0x222326,
    metalness: 0.15,
    roughness: 0.45
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    metalness: 0.95,
    roughness: 0.15
  });
  const stylusYellowMat = new THREE.MeshStandardMaterial({
    color: 0xd49b27,
    metalness: 0.1,
    roughness: 0.4
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 4 Rubber Feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.95, FOOT_H, 24);
  const footPositions = [
    ['foot_fl', -W * 0.5 + FOOT_INSET_X, D * 0.5 - FOOT_INSET_Z],
    ['foot_fr', W * 0.5 - FOOT_INSET_X, D * 0.5 - FOOT_INSET_Z],
    ['foot_bl', -W * 0.5 + FOOT_INSET_X, -D * 0.5 + FOOT_INSET_Z],
    ['foot_br', W * 0.5 - FOOT_INSET_X, -D * 0.5 + FOOT_INSET_Z]
  ];
  for (const [name, fx, fz] of footPositions) {
    addMesh(footGeo, rubberMat, name, fx, FOOT_H * 0.5, fz);
  }

  // Plinth (Brushed Steel Base)
  const plinthGeo = new THREE.BoxGeometry(W, PLINTH_H, D);
  addMesh(plinthGeo, brushedSteelMat, 'plinth', 0, PLINTH_Y, 0);

  // Platter
  const platterGeo = new THREE.CylinderGeometry(PLATTER_R, PLATTER_R, PLATTER_H, 32);
  addMesh(platterGeo, brushedSteelMat, 'platter', PLATTER_X, PLATTER_Y, PLATTER_Z);

  // Platter Mat
  const matGeo = new THREE.CylinderGeometry(MAT_R, MAT_R, MAT_H, 32);
  addMesh(matGeo, vinylMat, 'platter_mat', PLATTER_X, MAT_Y, PLATTER_Z);

  // Center Spindle
  const spindleGeo = new THREE.CylinderGeometry(SPINDLE_R, SPINDLE_R, SPINDLE_H, 16);
  addMesh(spindleGeo, chromeMat, 'spindle', PLATTER_X, SPINDLE_Y, PLATTER_Z);

  const spindleTipGeo = new THREE.SphereGeometry(SPINDLE_R, 16, 12);
  addMesh(
    spindleTipGeo,
    chromeMat,
    'spindle_tip',
    PLATTER_X,
    SPINDLE_Y + SPINDLE_H * 0.5,
    PLATTER_Z
  );

  // Tonearm Base
  const armBaseGeo = new THREE.CylinderGeometry(ARM_BASE_R, ARM_BASE_R * 1.05, ARM_BASE_H, 24);
  addMesh(
    armBaseGeo,
    darkSteelMat,
    'tonearm_base',
    ARM_BASE_X,
    TOP_SURFACE_Y + ARM_BASE_H * 0.5,
    ARM_BASE_Z
  );

  // Tonearm Pillar
  const pillarH = 0.026;
  const pillarY = TOP_SURFACE_Y + ARM_BASE_H + pillarH * 0.5;
  const pillarGeo = new THREE.CylinderGeometry(0.011, 0.013, pillarH, 20);
  addMesh(pillarGeo, darkSteelMat, 'tonearm_pillar', ARM_BASE_X, pillarY, ARM_BASE_Z);

  // Tonearm Gimbal Yoke
  const gimbalY = TOP_SURFACE_Y + ARM_BASE_H + pillarH + 0.006;
  const gimbalGeo = new THREE.BoxGeometry(0.026, 0.016, 0.022);
  addMesh(gimbalGeo, chromeMat, 'tonearm_gimbal_yoke', ARM_BASE_X, gimbalY, ARM_BASE_Z);

  // Tonearm Pivot Barrel
  const pivotGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 16);
  addMesh(
    pivotGeo,
    darkSteelMat,
    'tonearm_pivot_barrel',
    ARM_BASE_X,
    gimbalY,
    ARM_BASE_Z,
    0,
    0.35,
    Math.PI * 0.5
  );

  // Tonearm Assembly (angled toward platter)
  const armYaw = 0.36;
  const armGroup = new THREE.Group();
  armGroup.position.set(ARM_BASE_X, gimbalY, ARM_BASE_Z);
  armGroup.rotation.y = armYaw;
  group.add(armGroup);

  function addArmMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    armGroup.add(mesh);
    return mesh;
  }

  // Counterweight (behind pivot, -Z in armGroup)
  const cwGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.022, 20);
  addArmMesh(cwGeo, darkSteelMat, 'tonearm_counterweight', 0, 0, -0.026, Math.PI * 0.5, 0, 0);

  // Tonearm Tube (extending forward, +Z in armGroup)
  const tubeLen = 0.165;
  const tubeGeo = new THREE.CylinderGeometry(0.0032, 0.0038, tubeLen, 14);
  addArmMesh(tubeGeo, chromeMat, 'tonearm_tube', 0, 0, tubeLen * 0.5 - 0.01, Math.PI * 0.5, 0, 0);

  // Headshell
  const headshellZ = tubeLen - 0.005;
  const headshellGeo = new THREE.BoxGeometry(0.015, 0.004, 0.032);
  addArmMesh(headshellGeo, darkSteelMat, 'tonearm_headshell', -0.003, 0.001, headshellZ, 0, 0.18, 0);

  // Cartridge
  const cartGeo = new THREE.BoxGeometry(0.012, 0.009, 0.02);
  addArmMesh(cartGeo, rubberMat, 'tonearm_cartridge', -0.004, -0.005, headshellZ + 0.004, 0, 0.18, 0);

  // Stylus (yellow/gold)
  const stylusGeo = new THREE.BoxGeometry(0.011, 0.005, 0.01);
  addArmMesh(stylusGeo, stylusYellowMat, 'tonearm_stylus', -0.005, -0.008, headshellZ + 0.01, 0, 0.18, 0);

  // Finger Lift
  const liftGeo = new THREE.BoxGeometry(0.014, 0.002, 0.003);
  addArmMesh(liftGeo, chromeMat, 'tonearm_finger_lift', -0.012, 0.002, headshellZ + 0.006, 0, 0.18, 0);

  // Tonearm Rest Post
  const restX = ARM_BASE_X + 0.018;
  const restZ = ARM_BASE_Z + 0.035;
  const restH = 0.028;
  const restPostGeo = new THREE.CylinderGeometry(0.003, 0.0035, restH, 12);
  addMesh(restPostGeo, darkSteelMat, 'tonearm_rest_post', restX, TOP_SURFACE_Y + restH * 0.5, restZ);

  const restCradleGeo = new THREE.BoxGeometry(0.01, 0.005, 0.008);
  addMesh(restCradleGeo, rubberMat, 'tonearm_rest_cradle', restX, TOP_SURFACE_Y + restH, restZ);

  return group;
}
