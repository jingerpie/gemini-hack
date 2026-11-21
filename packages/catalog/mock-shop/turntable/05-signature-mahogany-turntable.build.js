function build(THREE) {
  const group = new THREE.Group();

  const W = 0.45;
  const D = 0.36;
  const FOOT_H = 0.018;
  const FOOT_R = 0.024;
  const PLINTH_H = 0.056;
  const PLINTH_TOP = FOOT_H + PLINTH_H;

  const PLATTER_X = -0.042;
  const PLATTER_Z = 0.0;
  const PLATTER_R = 0.148;
  const PLATTER_H = 0.020;

  const MAT_R = 0.142;
  const MAT_H = 0.003;
  const SPINDLE_R = 0.0035;
  const SPINDLE_H = 0.016;

  const KNOB_X = -0.165;
  const KNOB_Z = 0.125;

  const PIVOT_X = 0.145;
  const PIVOT_Y = PLINTH_TOP + 0.036;
  const PIVOT_Z = -0.105;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7a3322,
    roughness: 0.48,
    metalness: 0.05
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.75,
    metalness: 0.1
  });
  const metalSilverMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b4,
    roughness: 0.32,
    metalness: 0.85
  });
  const matMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.85,
    metalness: 0.05
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.15,
    metalness: 0.95
  });
  const tonearmMat = new THREE.MeshStandardMaterial({
    color: 0x3a3632,
    roughness: 0.38,
    metalness: 0.75
  });
  const cartridgeMat = new THREE.MeshStandardMaterial({
    color: 0xa82820,
    roughness: 0.4,
    metalness: 0.2
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 4 Isolation Feet
  const footGeom = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 24);
  const footOffX = W / 2 - 0.048;
  const footOffZ = D / 2 - 0.045;
  addMesh(footGeom, footMat, "foot_fl", -footOffX, FOOT_H / 2, footOffZ);
  addMesh(footGeom, footMat, "foot_fr", footOffX, FOOT_H / 2, footOffZ);
  addMesh(footGeom, footMat, "foot_bl", -footOffX, FOOT_H / 2, -footOffZ);
  addMesh(footGeom, footMat, "foot_br", footOffX, FOOT_H / 2, -footOffZ);

  // Mahogany Plinth
  const plinthGeom = new THREE.BoxGeometry(W, PLINTH_H, D);
  addMesh(plinthGeom, woodMat, "plinth", 0, FOOT_H + PLINTH_H / 2, 0);

  // Platter
  const platterGeom = new THREE.CylinderGeometry(PLATTER_R, PLATTER_R, PLATTER_H, 32);
  addMesh(platterGeom, metalSilverMat, "platter", PLATTER_X, PLINTH_TOP + PLATTER_H / 2, PLATTER_Z);

  // Platter Mat
  const matTopY = PLINTH_TOP + PLATTER_H + MAT_H;
  const matGeom = new THREE.CylinderGeometry(MAT_R, MAT_R, MAT_H, 32);
  addMesh(matGeom, matMat, "platter_mat", PLATTER_X, PLINTH_TOP + PLATTER_H + MAT_H / 2, PLATTER_Z);

  // Concentric Mat Grooves
  const ringOuterGeom = new THREE.TorusGeometry(0.105, 0.0012, 8, 32);
  const ringOuter = addMesh(ringOuterGeom, footMat, "mat_ring_outer", PLATTER_X, matTopY, PLATTER_Z);
  ringOuter.rotation.x = Math.PI / 2;

  const ringInnerGeom = new THREE.TorusGeometry(0.062, 0.0012, 8, 32);
  const ringInner = addMesh(ringInnerGeom, footMat, "mat_ring_inner", PLATTER_X, matTopY, PLATTER_Z);
  ringInner.rotation.x = Math.PI / 2;

  // Center Spindle
  const spindleGeom = new THREE.CylinderGeometry(SPINDLE_R, SPINDLE_R, SPINDLE_H, 16);
  addMesh(spindleGeom, chromeMat, "spindle", PLATTER_X, matTopY + SPINDLE_H / 2, PLATTER_Z);

  const spindleTipGeom = new THREE.SphereGeometry(SPINDLE_R, 12, 8);
  addMesh(spindleTipGeom, chromeMat, "spindle_tip", PLATTER_X, matTopY + SPINDLE_H, PLATTER_Z);

  // Speed/Power Knob
  const knobBaseGeom = new THREE.CylinderGeometry(0.022, 0.023, 0.003, 24);
  addMesh(knobBaseGeom, metalSilverMat, "knob_base", KNOB_X, PLINTH_TOP + 0.0015, KNOB_Z);

  const knobGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.013, 24);
  addMesh(knobGeom, metalSilverMat, "knob", KNOB_X, PLINTH_TOP + 0.003 + 0.0065, KNOB_Z);

  // Tonearm Base & Gimbal
  const taBaseGeom = new THREE.CylinderGeometry(0.028, 0.030, 0.008, 24);
  addMesh(taBaseGeom, tonearmMat, "tonearm_base", PIVOT_X, PLINTH_TOP + 0.004, PIVOT_Z);

  const taPillarGeom = new THREE.CylinderGeometry(0.014, 0.016, 0.024, 20);
  addMesh(taPillarGeom, tonearmMat, "tonearm_pillar", PIVOT_X, PLINTH_TOP + 0.008 + 0.012, PIVOT_Z);

  const gimbalGeom = new THREE.BoxGeometry(0.028, 0.026, 0.028);
  addMesh(gimbalGeom, tonearmMat, "gimbal_housing", PIVOT_X, PIVOT_Y, PIVOT_Z);

  // Counterweight
  const cwGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 20);
  const cw = addMesh(cwGeom, tonearmMat, "counterweight", PIVOT_X, PIVOT_Y, PIVOT_Z - 0.028);
  cw.rotation.x = Math.PI / 2;

  // Tonearm Tube
  const tubeLen = 0.21;
  const tubeAngleY = 0.14;
  const tubeGeom = new THREE.CylinderGeometry(0.004, 0.0045, tubeLen, 12);
  const tubeCenterX = PIVOT_X - Math.sin(tubeAngleY) * (tubeLen / 2);
  const tubeCenterZ = PIVOT_Z + Math.cos(tubeAngleY) * (tubeLen / 2);
  const tube = addMesh(tubeGeom, metalSilverMat, "tonearm_tube", tubeCenterX, PIVOT_Y - 0.002, tubeCenterZ);
  tube.rotation.order = "YXZ";
  tube.rotation.y = -tubeAngleY;
  tube.rotation.x = Math.PI / 2 + 0.02;

  // Tonearm Rest
  const restPostGeom = new THREE.CylinderGeometry(0.0035, 0.004, 0.032, 12);
  addMesh(restPostGeom, tonearmMat, "tonearm_rest_post", 0.130, PLINTH_TOP + 0.016, -0.020);

  const restClipGeom = new THREE.BoxGeometry(0.014, 0.006, 0.010);
  addMesh(restClipGeom, tonearmMat, "tonearm_rest_clip", 0.130, PLINTH_TOP + 0.032, -0.020);

  // Headshell & Cartridge
  const headX = PIVOT_X - Math.sin(tubeAngleY) * tubeLen;
  const headZ = PIVOT_Z + Math.cos(tubeAngleY) * tubeLen;
  const headY = PIVOT_Y - 0.006;

  const headshellGeom = new THREE.BoxGeometry(0.018, 0.006, 0.036);
  const headshell = addMesh(headshellGeom, tonearmMat, "headshell", headX, headY, headZ + 0.012);
  headshell.rotation.y = -tubeAngleY;

  const liftGeom = new THREE.CylinderGeometry(0.0015, 0.0015, 0.016, 8);
  const lift = addMesh(liftGeom, tonearmMat, "headshell_lift", headX + 0.014, headY + 0.002, headZ + 0.016);
  lift.rotation.z = Math.PI / 2 - 0.2;

  const cartGeom = new THREE.BoxGeometry(0.015, 0.012, 0.020);
  const cart = addMesh(cartGeom, cartridgeMat, "cartridge", headX, headY - 0.008, headZ + 0.016);
  cart.rotation.y = -tubeAngleY;

  return group;
}
