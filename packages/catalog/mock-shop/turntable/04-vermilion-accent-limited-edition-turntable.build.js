function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.35;
  const CORNER_R = 0.012;

  const FOOT_H = 0.018;
  const FOOT_R = 0.023;
  const FOOT_INSET_X = 0.048;
  const FOOT_INSET_Z = 0.045;

  const PLINTH_RED_H = 0.022;
  const PLINTH_GREY_H = 0.022;
  const PLINTH_Y = FOOT_H;
  const TOP_Y = PLINTH_Y + PLINTH_RED_H + PLINTH_GREY_H;

  const PLATTER_R = 0.148;
  const PLATTER_H = 0.016;
  const PLATTER_X = -0.036;
  const PLATTER_Z = 0.006;

  const MAT_R = 0.142;
  const MAT_H = 0.004;

  const TONEARM_BASE_X = 0.148;
  const TONEARM_BASE_Z = -0.088;

  // Materials
  const matRedPlinth = new THREE.MeshStandardMaterial({
    color: 0xc83e2b,
    roughness: 0.48,
    metalness: 0.05
  });
  const matGreyPlinth = new THREE.MeshStandardMaterial({
    color: 0xd9dad5,
    roughness: 0.52,
    metalness: 0.04
  });
  const matBlackRubber = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.75,
    metalness: 0.08
  });
  const matMatGrey = new THREE.MeshStandardMaterial({
    color: 0x2c2d2e,
    roughness: 0.85,
    metalness: 0.02
  });
  const matSilver = new THREE.MeshStandardMaterial({
    color: 0xd0d3d6,
    roughness: 0.25,
    metalness: 0.88
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x222325,
    roughness: 0.35,
    metalness: 0.65
  });
  const matAmber = new THREE.MeshStandardMaterial({
    color: 0xd4883a,
    roughness: 0.35,
    metalness: 0.15
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Four isolation feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R * 0.92, FOOT_R, FOOT_H, 24);
  const footPositions = [
    [-W / 2 + FOOT_INSET_X, FOOT_H / 2, D / 2 - FOOT_INSET_Z, 'foot_front_left'],
    [W / 2 - FOOT_INSET_X, FOOT_H / 2, D / 2 - FOOT_INSET_Z, 'foot_front_right'],
    [-W / 2 + FOOT_INSET_X, FOOT_H / 2, -D / 2 + FOOT_INSET_Z, 'foot_back_left'],
    [W / 2 - FOOT_INSET_X, FOOT_H / 2, -D / 2 + FOOT_INSET_Z, 'foot_back_right']
  ];
  for (const [fx, fy, fz, fname] of footPositions) {
    addMesh(footGeo, matBlackRubber, fname, fx, fy, fz);
  }

  // 2. Plinth (two-tone: vermilion lower, light grey upper)
  const plinthShape = createRoundedRectShape(W, D, CORNER_R);

  const redPlinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: PLINTH_RED_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  redPlinthGeo.rotateX(-Math.PI / 2);
  addMesh(redPlinthGeo, matRedPlinth, 'plinth_vermilion_lower', 0, PLINTH_Y, 0);

  const greyPlinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: PLINTH_GREY_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  greyPlinthGeo.rotateX(-Math.PI / 2);
  addMesh(greyPlinthGeo, matGreyPlinth, 'plinth_grey_upper', 0, PLINTH_Y + PLINTH_RED_H, 0);

  // 3. Platter & Mat & Spindle
  const platterGeo = new THREE.CylinderGeometry(PLATTER_R, PLATTER_R, PLATTER_H, 32);
  addMesh(platterGeo, matSilver, 'platter_aluminum', PLATTER_X, TOP_Y + PLATTER_H / 2, PLATTER_Z);

  const matGeo = new THREE.CylinderGeometry(MAT_R, MAT_R, MAT_H, 32);
  addMesh(matGeo, matMatGrey, 'platter_mat', PLATTER_X, TOP_Y + PLATTER_H + MAT_H / 2, PLATTER_Z);

  const matGrooveGeo = new THREE.TorusGeometry(MAT_R * 0.58, 0.0008, 8, 32);
  addMesh(
    matGrooveGeo,
    matBlackRubber,
    'platter_mat_groove',
    PLATTER_X,
    TOP_Y + PLATTER_H + MAT_H,
    PLATTER_Z,
    Math.PI / 2,
    0,
    0
  );

  const spindleGeo = new THREE.CylinderGeometry(0.0036, 0.0036, 0.018, 16);
  addMesh(
    spindleGeo,
    matSilver,
    'center_spindle',
    PLATTER_X,
    TOP_Y + PLATTER_H + MAT_H + 0.009,
    PLATTER_Z
  );

  const spindleTipGeo = new THREE.ConeGeometry(0.0036, 0.004, 16);
  addMesh(
    spindleTipGeo,
    matSilver,
    'center_spindle_tip',
    PLATTER_X,
    TOP_Y + PLATTER_H + MAT_H + 0.02,
    PLATTER_Z
  );

  // 4. Left-side controls
  const frontKnobGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.014, 24);
  addMesh(frontKnobGeo, matBlackRubber, 'speed_knob_front_left', -0.175, TOP_Y + 0.007, 0.12);

  const backCapGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.011, 24);
  addMesh(backCapGeo, matDarkMetal, 'pulley_cap_back_left', -0.155, TOP_Y + 0.0055, -0.12);

  const backCapTopGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.002, 24);
  addMesh(backCapTopGeo, matSilver, 'pulley_cap_top', -0.155, TOP_Y + 0.0115, -0.12);

  // 5. Tonearm assembly (back-right)
  const baseRingGeo = new THREE.CylinderGeometry(0.039, 0.039, 0.003, 28);
  addMesh(baseRingGeo, matRedPlinth, 'tonearm_base_red_ring', TONEARM_BASE_X, TOP_Y + 0.0015, TONEARM_BASE_Z);

  const basePlateGeo = new THREE.CylinderGeometry(0.036, 0.037, 0.008, 28);
  addMesh(basePlateGeo, matDarkMetal, 'tonearm_base_plate', TONEARM_BASE_X, TOP_Y + 0.006, TONEARM_BASE_Z);

  // Gimbal pivot housing
  const pivotPostGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.026, 20);
  addMesh(pivotPostGeo, matDarkMetal, 'tonearm_pivot_post', TONEARM_BASE_X, TOP_Y + 0.023, TONEARM_BASE_Z);

  const gimbalYokeGeo = new THREE.BoxGeometry(0.028, 0.022, 0.024);
  addMesh(gimbalYokeGeo, matDarkMetal, 'tonearm_gimbal_yoke', TONEARM_BASE_X, TOP_Y + 0.042, TONEARM_BASE_Z);

  // Counterweight at the back of the tonearm
  const counterweightGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.022, 20);
  addMesh(
    counterweightGeo,
    matSilver,
    'tonearm_counterweight',
    TONEARM_BASE_X + 0.003,
    TOP_Y + 0.042,
    TONEARM_BASE_Z - 0.028,
    Math.PI / 2,
    0,
    0.08
  );

  // Tonearm tube extending forward (+Z) and slightly inward (-X)
  const armAngleY = 0.08;
  const armLen = 0.165;
  const armTubeGeo = new THREE.CylinderGeometry(0.004, 0.004, armLen, 16);
  addMesh(
    armTubeGeo,
    matSilver,
    'tonearm_tube',
    TONEARM_BASE_X - Math.sin(armAngleY) * (armLen / 2 - 0.01),
    TOP_Y + 0.042,
    TONEARM_BASE_Z + Math.cos(armAngleY) * (armLen / 2 - 0.01),
    Math.PI / 2,
    0,
    armAngleY
  );

  // Headshell at the front tip of the tonearm
  const headshellX = TONEARM_BASE_X - Math.sin(armAngleY) * (armLen - 0.005);
  const headshellZ = TONEARM_BASE_Z + Math.cos(armAngleY) * (armLen - 0.005);
  const headshellGeo = new THREE.BoxGeometry(0.016, 0.006, 0.032);
  addMesh(
    headshellGeo,
    matDarkMetal,
    'tonearm_headshell',
    headshellX,
    TOP_Y + 0.041,
    headshellZ + 0.012,
    0,
    -armAngleY,
    0
  );

  // Finger lift on headshell
  const fingerLiftGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.018, 8);
  addMesh(
    fingerLiftGeo,
    matDarkMetal,
    'headshell_finger_lift',
    headshellX + 0.013,
    TOP_Y + 0.041,
    headshellZ + 0.012,
    0,
    0,
    Math.PI / 2
  );

  // Amber/orange cartridge under headshell
  const cartridgeGeo = new THREE.BoxGeometry(0.012, 0.011, 0.018);
  addMesh(
    cartridgeGeo,
    matAmber,
    'phono_cartridge',
    headshellX,
    TOP_Y + 0.033,
    headshellZ + 0.014,
    0,
    -armAngleY,
    0
  );

  // Cueing lever / anti-skate knob on the right of the tonearm base
  const cueKnobGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.008, 16);
  addMesh(
    cueKnobGeo,
    matAmber,
    'tonearm_cue_knob',
    TONEARM_BASE_X + 0.034,
    TOP_Y + 0.014,
    TONEARM_BASE_Z + 0.008
  );

  return group;
}
