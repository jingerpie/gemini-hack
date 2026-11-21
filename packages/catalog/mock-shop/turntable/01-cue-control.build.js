function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const D = 0.36;
  const FOOT_H = 0.018;
  const FOOT_R = 0.026;
  const PLINTH_H = 0.068;
  const TOP_Y = FOOT_H + PLINTH_H;
  const LID_H = 0.056;
  const PLATTER_R = 0.158;
  const PLATTER_H = 0.018;
  const PLATTER_X = -0.045;
  const PLATTER_Z = 0.005;

  // Materials
  const matPlinth = new THREE.MeshStandardMaterial({
    color: 0x222326,
    roughness: 0.45,
    metalness: 0.15,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x151517,
    roughness: 0.85,
    metalness: 0.05,
  });
  const matSilver = new THREE.MeshStandardMaterial({
    color: 0xd0d3d8,
    roughness: 0.25,
    metalness: 0.85,
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x35373b,
    roughness: 0.35,
    metalness: 0.7,
  });
  const matLid = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f8,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.25,
    clearcoat: 1.0,
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

  // 1. Feet (4 corners)
  const footGeo = new THREE.CylinderGeometry(FOOT_R * 0.9, FOOT_R, FOOT_H, 24);
  const footOffsets = [
    [-W / 2 + 0.045, -D / 2 + 0.045],
    [W / 2 - 0.045, -D / 2 + 0.045],
    [-W / 2 + 0.045, D / 2 - 0.045],
    [W / 2 - 0.045, D / 2 - 0.045],
  ];
  footOffsets.forEach(([fx, fz], i) => {
    addMesh(footGeo, matRubber, `foot_${i + 1}`, fx, FOOT_H / 2, fz);
  });

  // 2. Plinth (main body)
  const plinthGeo = new THREE.BoxGeometry(W, PLINTH_H, D);
  addMesh(plinthGeo, matPlinth, "plinth", 0, FOOT_H + PLINTH_H / 2, 0);

  // 3. Platter (beveled silver rim + black rubber mat + spindle)
  const rimPoints = [
    new THREE.Vector2(PLATTER_R - 0.015, 0),
    new THREE.Vector2(PLATTER_R, 0),
    new THREE.Vector2(PLATTER_R - 0.008, PLATTER_H),
    new THREE.Vector2(PLATTER_R - 0.018, PLATTER_H),
  ];
  const rimGeo = new THREE.LatheGeometry(rimPoints, 32);
  addMesh(rimGeo, matSilver, "platter_rim", PLATTER_X, TOP_Y, PLATTER_Z);

  const matGeo = new THREE.CylinderGeometry(PLATTER_R - 0.016, PLATTER_R - 0.016, PLATTER_H + 0.002, 32);
  addMesh(matGeo, matRubber, "platter_mat", PLATTER_X, TOP_Y + (PLATTER_H + 0.002) / 2, PLATTER_Z);

  const spindleGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.014, 16);
  addMesh(spindleGeo, matSilver, "spindle", PLATTER_X, TOP_Y + PLATTER_H + 0.007, PLATTER_Z);

  // 4. 45 RPM Adapter (top-left)
  const adapterGeo = new THREE.CylinderGeometry(0.017, 0.017, 0.008, 24);
  addMesh(adapterGeo, matSilver, "adapter_45rpm", -W / 2 + 0.055, TOP_Y + 0.004, -D / 2 + 0.04);

  // 5. Power / Speed Rotary Knob (front-left)
  const knobGeo = new THREE.CylinderGeometry(0.014, 0.015, 0.016, 24);
  addMesh(knobGeo, matDarkMetal, "power_knob", -W / 2 + 0.036, TOP_Y + 0.008, D / 2 - 0.075);

  // 6. Start / Stop Button (front-left corner)
  const startBtnGeo = new THREE.BoxGeometry(0.04, 0.007, 0.026);
  addMesh(startBtnGeo, matSilver, "start_stop_button", -W / 2 + 0.036, TOP_Y + 0.0035, D / 2 - 0.032);

  // 7. Speed Buttons (33 / 45 RPM)
  const speedBtnGeo = new THREE.BoxGeometry(0.02, 0.006, 0.012);
  addMesh(speedBtnGeo, matSilver, "speed_button_33", -W / 2 + 0.078, TOP_Y + 0.003, D / 2 - 0.025);
  addMesh(speedBtnGeo, matSilver, "speed_button_45", -W / 2 + 0.102, TOP_Y + 0.003, D / 2 - 0.025);

  // 8. Strobe / Target Light Post
  const strobeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.016, 16);
  addMesh(strobeGeo, matSilver, "strobe_light_post", 0.032, TOP_Y + 0.008, D / 2 - 0.042);

  // 9. Tonearm Assembly (right side)
  const ARM_X = 0.14;
  const ARM_Z = -0.065;

  const armBaseGeo = new THREE.CylinderGeometry(0.045, 0.048, 0.008, 32);
  addMesh(armBaseGeo, matRubber, "tonearm_base", ARM_X, TOP_Y + 0.004, ARM_Z);

  const gimbalGeo = new THREE.BoxGeometry(0.034, 0.032, 0.034);
  addMesh(gimbalGeo, matDarkMetal, "tonearm_gimbal", ARM_X, TOP_Y + 0.022, ARM_Z);

  const counterweightGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.026, 24);
  addMesh(
    counterweightGeo,
    matSilver,
    "tonearm_counterweight",
    ARM_X,
    TOP_Y + 0.028,
    ARM_Z - 0.034,
    Math.PI / 2,
    0,
    0
  );

  const antiSkateGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.012, 20);
  addMesh(antiSkateGeo, matDarkMetal, "anti_skate_dial", ARM_X + 0.032, TOP_Y + 0.012, ARM_Z + 0.005);

  // S-shaped tonearm tube
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ARM_X, TOP_Y + 0.028, ARM_Z + 0.012),
    new THREE.Vector3(ARM_X + 0.012, TOP_Y + 0.028, ARM_Z + 0.065),
    new THREE.Vector3(ARM_X + 0.018, TOP_Y + 0.026, ARM_Z + 0.115),
    new THREE.Vector3(ARM_X - 0.005, TOP_Y + 0.024, ARM_Z + 0.155),
    new THREE.Vector3(ARM_X - 0.022, TOP_Y + 0.022, ARM_Z + 0.175),
  ]);
  const armTubeGeo = new THREE.TubeGeometry(armCurve, 24, 0.0038, 12, false);
  addMesh(armTubeGeo, matSilver, "tonearm_tube", 0, 0, 0);

  // Headshell + Cartridge
  const headshellGeo = new THREE.BoxGeometry(0.016, 0.009, 0.034);
  addMesh(
    headshellGeo,
    matDarkMetal,
    "headshell",
    ARM_X - 0.032,
    TOP_Y + 0.02,
    ARM_Z + 0.192,
    0,
    0.45,
    0
  );

  // Tonearm rest
  const restGeo = new THREE.CylinderGeometry(0.004, 0.005, 0.024, 12);
  addMesh(restGeo, matDarkMetal, "tonearm_rest", ARM_X + 0.018, TOP_Y + 0.012, ARM_Z + 0.085);

  // 10. Pitch Fader (front-right)
  const PITCH_X = 0.175;
  const PITCH_Z = 0.075;

  const pitchSlotGeo = new THREE.BoxGeometry(0.018, 0.003, 0.095);
  addMesh(pitchSlotGeo, matRubber, "pitch_fader_slot", PITCH_X, TOP_Y + 0.0015, PITCH_Z);

  const pitchKnobGeo = new THREE.BoxGeometry(0.02, 0.01, 0.014);
  addMesh(pitchKnobGeo, matSilver, "pitch_fader_knob", PITCH_X, TOP_Y + 0.006, PITCH_Z);

  const pitchResetGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 16);
  addMesh(pitchResetGeo, matSilver, "pitch_reset_button", PITCH_X - 0.024, TOP_Y + 0.003, PITCH_Z + 0.032);

  // 11. Hinges (back)
  const hingeGeo = new THREE.BoxGeometry(0.032, 0.018, 0.016);
  addMesh(hingeGeo, matDarkMetal, "hinge_left", -W / 2 + 0.09, TOP_Y + 0.009, -D / 2 + 0.008);
  addMesh(hingeGeo, matDarkMetal, "hinge_right", W / 2 - 0.09, TOP_Y + 0.009, -D / 2 + 0.008);

  // 12. Dust Cover (closed)
  const lidGeo = new THREE.BoxGeometry(W - 0.004, LID_H, D - 0.004);
  addMesh(lidGeo, matLid, "dust_cover", 0, TOP_Y + LID_H / 2, 0);

  return group;
}
