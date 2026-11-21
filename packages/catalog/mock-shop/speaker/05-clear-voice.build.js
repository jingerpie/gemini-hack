function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const TOTAL_H = 1.65;
  const SPK_W = 0.36;
  const SPK_H = 0.56;
  const SPK_D = 0.32;
  const SPK_Y = TOTAL_H - SPK_H; // 1.09

  const STAND_X = -0.22;
  const STAND_Z = -0.02;
  const LEG_SPREAD = 0.42;
  const HUB_TOP_Y = 0.52;
  const HUB_BOT_Y = 0.22;
  const POLE_R_LOW = 0.020;
  const POLE_R_HIGH = 0.017;

  const MIX_W = 0.22;
  const MIX_D = 0.20;
  const MIX_H = 0.045;

  const REC_W = 0.20;
  const REC_D = 0.14;
  const REC_H = 0.042;

  // Shared materials
  const matCabinet = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.65,
    metalness: 0.08
  });
  const matGrille = new THREE.MeshStandardMaterial({
    color: 0x2a2d30,
    roughness: 0.45,
    metalness: 0.55
  });
  const matDriver = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.75,
    metalness: 0.1
  });
  const matStandMetal = new THREE.MeshStandardMaterial({
    color: 0x25282c,
    roughness: 0.4,
    metalness: 0.65
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x141517,
    roughness: 0.88,
    metalness: 0.02
  });
  const matMicBody = new THREE.MeshStandardMaterial({
    color: 0x2b2e33,
    roughness: 0.45,
    metalness: 0.4
  });
  const matMicGrille = new THREE.MeshStandardMaterial({
    color: 0x454950,
    roughness: 0.35,
    metalness: 0.75
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x3b4046,
    roughness: 0.4,
    metalness: 0.5
  });

  function addMesh(geom, mat, name, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geom, mat);
    m.name = name;
    m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // --- 1. TRIPOD STAND ---
  // Lower telescoping pole
  const poleLowH = 0.80 - HUB_BOT_Y;
  addMesh(
    new THREE.CylinderGeometry(POLE_R_LOW, POLE_R_LOW, poleLowH, 20),
    matStandMetal,
    "stand_pole_lower",
    STAND_X, HUB_BOT_Y + poleLowH / 2, STAND_Z
  );

  // Upper telescoping pole
  const poleHighH = SPK_Y - 0.78 + 0.04;
  addMesh(
    new THREE.CylinderGeometry(POLE_R_HIGH, POLE_R_HIGH, poleHighH, 20),
    matStandMetal,
    "stand_pole_upper",
    STAND_X, 0.78 + poleHighH / 2, STAND_Z
  );

  // Height adjustment collar & knob
  addMesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.045, 20),
    matRubber,
    "stand_collar",
    STAND_X, 0.80, STAND_Z
  );
  addMesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12),
    matRubber,
    "stand_collar_knob",
    STAND_X - 0.03, 0.80, STAND_Z,
    0, 0, Math.PI / 2
  );

  // Upper & lower leg hubs
  addMesh(
    new THREE.CylinderGeometry(0.036, 0.038, 0.04, 20),
    matRubber,
    "stand_hub_upper",
    STAND_X, HUB_TOP_Y, STAND_Z
  );
  addMesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.035, 20),
    matRubber,
    "stand_hub_lower",
    STAND_X, HUB_BOT_Y, STAND_Z
  );

  // 3 Tripod legs + rubber feet + spreader struts
  const legAngles = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];
  const legStart = new THREE.Vector3(STAND_X, HUB_TOP_Y, STAND_Z);
  const strutStart = new THREE.Vector3(STAND_X, HUB_BOT_Y, STAND_Z);

  for (let i = 0; i < 3; i++) {
    const ang = legAngles[i];
    const fx = STAND_X + Math.cos(ang) * LEG_SPREAD;
    const fz = STAND_Z + Math.sin(ang) * LEG_SPREAD;
    const footPos = new THREE.Vector3(fx, 0.015, fz);

    // Leg tube
    const legVec = new THREE.Vector3().subVectors(footPos, legStart);
    const legLen = legVec.length();
    const legMid = new THREE.Vector3().addVectors(legStart, footPos).multiplyScalar(0.5);
    const legMesh = addMesh(
      new THREE.CylinderGeometry(0.014, 0.014, legLen, 16),
      matStandMetal,
      "stand_leg_" + (i + 1),
      legMid.x, legMid.y, legMid.z
    );
    legMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legVec.clone().normalize());

    // Rubber foot
    addMesh(
      new THREE.CylinderGeometry(0.017, 0.020, 0.03, 16),
      matRubber,
      "stand_foot_" + (i + 1),
      fx, 0.015, fz
    );

    // Spreader strut
    const strutEnd = new THREE.Vector3().lerpVectors(legStart, footPos, 0.55);
    const strutVec = new THREE.Vector3().subVectors(strutEnd, strutStart);
    const strutLen = strutVec.length();
    const strutMid = new THREE.Vector3().addVectors(strutStart, strutEnd).multiplyScalar(0.5);
    const strutMesh = addMesh(
      new THREE.CylinderGeometry(0.008, 0.008, strutLen, 12),
      matStandMetal,
      "stand_strut_" + (i + 1),
      strutMid.x, strutMid.y, strutMid.z
    );
    strutMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), strutVec.clone().normalize());
  }

  // --- 2. PA SPEAKER CABINET ---
  // Main enclosure
  addMesh(
    new THREE.BoxGeometry(SPK_W, SPK_H, SPK_D),
    matCabinet,
    "speaker_cabinet",
    STAND_X, SPK_Y + SPK_H / 2, STAND_Z
  );

  // Top & bottom bezel trims
  addMesh(
    new THREE.BoxGeometry(SPK_W + 0.008, 0.022, SPK_D + 0.008),
    matCabinet,
    "speaker_top_bezel",
    STAND_X, SPK_Y + SPK_H - 0.011, STAND_Z
  );
  addMesh(
    new THREE.BoxGeometry(SPK_W + 0.008, 0.022, SPK_D + 0.008),
    matCabinet,
    "speaker_bottom_bezel",
    STAND_X, SPK_Y + 0.011, STAND_Z
  );

  // Front perforated grille plate
  addMesh(
    new THREE.BoxGeometry(SPK_W - 0.02, SPK_H - 0.044, 0.012),
    matGrille,
    "speaker_grille",
    STAND_X, SPK_Y + SPK_H / 2, STAND_Z + SPK_D / 2 + 0.002
  );

  // Woofer cone & dust cap (visible behind/on grille)
  const wooferY = SPK_Y + 0.19;
  addMesh(
    new THREE.CylinderGeometry(0.135, 0.135, 0.014, 28),
    matDriver,
    "speaker_woofer_surround",
    STAND_X, wooferY, STAND_Z + SPK_D / 2 + 0.004,
    Math.PI / 2
  );
  addMesh(
    new THREE.SphereGeometry(0.045, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    matCabinet,
    "speaker_woofer_dustcap",
    STAND_X, wooferY, STAND_Z + SPK_D / 2 + 0.008,
    Math.PI / 2
  );

  // Horn tweeter
  addMesh(
    new THREE.BoxGeometry(0.18, 0.11, 0.014),
    matDriver,
    "speaker_tweeter_horn",
    STAND_X, SPK_Y + 0.43, STAND_Z + SPK_D / 2 + 0.004
  );

  // Small speaker feet on bottom
  const spkFootOffX = SPK_W * 0.36;
  const spkFootOffZ = SPK_D * 0.34;
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.018, 0.012, 12),
    matRubber,
    "speaker_foot_fl",
    STAND_X - spkFootOffX, SPK_Y - 0.006, STAND_Z + spkFootOffZ
  );
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.018, 0.012, 12),
    matRubber,
    "speaker_foot_fr",
    STAND_X + spkFootOffX, SPK_Y - 0.006, STAND_Z + spkFootOffZ
  );

  // --- 3. AUDIO MIXER (on floor, center-right) ---
  const mixX = 0.16;
  const mixZ = 0.14;
  addMesh(
    new THREE.BoxGeometry(MIX_W, MIX_H, MIX_D),
    matCabinet,
    "mixer_chassis",
    mixX, MIX_H / 2, mixZ,
    0.08
  );
  addMesh(
    new THREE.BoxGeometry(MIX_W - 0.02, 0.008, MIX_D - 0.03),
    matAccent,
    "mixer_control_surface",
    mixX, MIX_H + 0.002, mixZ,
    0.08
  );

  // --- 4. WIRELESS RECEIVER (on floor, far right-back) ---
  const recX = 0.42;
  const recZ = 0.02;
  addMesh(
    new THREE.BoxGeometry(REC_W, REC_H, REC_D),
    matCabinet,
    "receiver_chassis",
    recX, REC_H / 2, recZ
  );
  addMesh(
    new THREE.BoxGeometry(0.08, 0.018, 0.006),
    matDriver,
    "receiver_display",
    recX - 0.02, REC_H * 0.5, recZ + REC_D / 2 + 0.002
  );
  addMesh(
    new THREE.CylinderGeometry(0.004, 0.005, 0.12, 10),
    matRubber,
    "receiver_antenna_left",
    recX - 0.075, REC_H + 0.06, recZ - REC_D / 2 + 0.015
  );
  addMesh(
    new THREE.CylinderGeometry(0.004, 0.005, 0.12, 10),
    matRubber,
    "receiver_antenna_right",
    recX + 0.075, REC_H + 0.06, recZ - REC_D / 2 + 0.015
  );

  // --- 5. TWO HANDHELD MICROPHONES (on floor) ---
  // Mic 1 (near front-center)
  const mic1X = -0.02;
  const mic1Z = 0.24;
  addMesh(
    new THREE.CylinderGeometry(0.017, 0.014, 0.17, 16),
    matMicBody,
    "microphone_1_handle",
    mic1X, 0.017, mic1Z,
    Math.PI / 2, 0, -0.15
  );
  addMesh(
    new THREE.SphereGeometry(0.025, 16, 12),
    matMicGrille,
    "microphone_1_grille",
    mic1X - 0.014, 0.025, mic1Z - 0.095
  );

  // Mic 2 (in front of receiver)
  const mic2X = 0.44;
  const mic2Z = 0.16;
  addMesh(
    new THREE.CylinderGeometry(0.017, 0.014, 0.17, 16),
    matMicBody,
    "microphone_2_handle",
    mic2X, 0.017, mic2Z,
    0, 0, Math.PI / 2
  );
  addMesh(
    new THREE.SphereGeometry(0.025, 16, 12),
    matMicGrille,
    "microphone_2_grille",
    mic2X - 0.095, 0.025, mic2Z
  );

  // --- 6. COILED CABLES (on floor) ---
  addMesh(
    new THREE.TorusGeometry(0.075, 0.009, 10, 24),
    matRubber,
    "coiled_cable_1",
    0.26, 0.009, 0.30,
    Math.PI / 2
  );
  addMesh(
    new THREE.TorusGeometry(0.075, 0.009, 10, 24),
    matRubber,
    "coiled_cable_2",
    0.46, 0.009, 0.28,
    Math.PI / 2
  );

  return group;
}
