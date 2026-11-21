function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (27-inch gaming monitor)
  const W = 0.614;          // Monitor width
  const SCREEN_H = 0.352;   // Monitor panel height
  const H = 0.475;          // Total height from y=0
  const D = 0.230;          // Total depth (stand front-to-back)

  const BEZEL = 0.008;
  const PANEL_D = 0.018;
  const REAR_HUB_D = 0.032;
  const SCREEN_BOTTOM_Y = 0.115;
  const SCREEN_CENTER_Y = SCREEN_BOTTOM_Y + SCREEN_H * 0.5;
  const SCREEN_Z = 0.025;

  const STAND_COL_W = 0.044;
  const STAND_COL_D = 0.048;
  const STAND_COL_H = 0.335;
  const STAND_COL_Z = -0.058;

  const LEG_LEN = 0.195;
  const LEG_W_BASE = 0.034;
  const LEG_W_TIP = 0.014;
  const LEG_H_BASE = 0.022;
  const LEG_H_TIP = 0.008;
  const LEG_SPREAD_X = 0.145;
  const LEG_FRONT_Z = 0.115;

  // Materials
  const matBodyDark = new THREE.MeshStandardMaterial({
    color: 0x1b1d21,
    roughness: 0.48,
    metalness: 0.25,
  });

  const matBodySatin = new THREE.MeshStandardMaterial({
    color: 0x25282e,
    roughness: 0.38,
    metalness: 0.35,
  });

  const matStandMetal = new THREE.MeshStandardMaterial({
    color: 0x22252b,
    roughness: 0.32,
    metalness: 0.65,
  });

  const matRecess = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.6,
    metalness: 0.15,
  });

  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x0b111a,
    emissive: 0x8fb8ff,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.1,
  });

  const matLed = new THREE.MeshStandardMaterial({
    color: 0xdbe9ff,
    emissive: 0x9ec5ff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main monitor outer frame / bezel backing
  const frameGeo = new THREE.BoxGeometry(W, SCREEN_H, PANEL_D);
  addMesh(frameGeo, matBodyDark, 'monitor_frame', [0, SCREEN_CENTER_Y, SCREEN_Z]);

  // 2. Lit screen panel (slightly in front of the bezel on +Z)
  const screenW = W - BEZEL * 2;
  const screenH = SCREEN_H - BEZEL * 2 - 0.004;
  const screenGeo = new THREE.BoxGeometry(screenW, screenH, 0.003);
  addMesh(screenGeo, matScreen, 'emit_screen', [0, SCREEN_CENTER_Y + 0.002, SCREEN_Z + PANEL_D * 0.5 + 0.001]);

  // 3. Lower chin trim on front
  const chinGeo = new THREE.BoxGeometry(W, 0.010, PANEL_D + 0.002);
  addMesh(chinGeo, matBodySatin, 'front_chin_trim', [0, SCREEN_BOTTOM_Y + 0.005, SCREEN_Z + 0.001]);

  // 4. Rear angled outer shell (chamfered look via extruded trapezoid)
  const rearShellShape = new THREE.Shape();
  rearShellShape.moveTo(-W * 0.46, -SCREEN_H * 0.44);
  rearShellShape.lineTo(W * 0.46, -SCREEN_H * 0.44);
  rearShellShape.lineTo(W * 0.48, SCREEN_H * 0.44);
  rearShellShape.lineTo(-W * 0.48, SCREEN_H * 0.44);
  rearShellShape.closePath();

  const rearShellGeo = new THREE.ExtrudeGeometry(rearShellShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  addMesh(rearShellGeo, matBodyDark, 'rear_outer_shell', [0, SCREEN_CENTER_Y, SCREEN_Z - PANEL_D * 0.5 - 0.012]);

  // 5. Rear central raised trapezoidal housing
  const hubShape = new THREE.Shape();
  hubShape.moveTo(-0.145, -0.115);
  hubShape.lineTo(0.145, -0.115);
  hubShape.lineTo(0.205, 0.085);
  hubShape.lineTo(-0.205, 0.085);
  hubShape.closePath();

  const hubGeo = new THREE.ExtrudeGeometry(hubShape, {
    depth: REAR_HUB_D,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  addMesh(hubGeo, matBodySatin, 'rear_central_housing', [0, SCREEN_CENTER_Y - 0.005, SCREEN_Z - PANEL_D * 0.5 - REAR_HUB_D - 0.005]);

  // 6. VESA mounting plate recess
  const vesaGeo = new THREE.BoxGeometry(0.105, 0.105, 0.008);
  addMesh(vesaGeo, matRecess, 'vesa_mount_plate', [0, SCREEN_CENTER_Y - 0.015, SCREEN_Z - PANEL_D * 0.5 - REAR_HUB_D - 0.008]);

  // 7. Rear joystick / control button near top of central housing
  const joyGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.008, 16);
  addMesh(joyGeo, matRecess, 'rear_control_joystick', [0, SCREEN_CENTER_Y + 0.068, SCREEN_Z - PANEL_D * 0.5 - REAR_HUB_D - 0.008], [Math.PI * 0.5, 0, 0]);

  // 8. Rear bottom LED accent strips (3 subtle down-facing/rear-facing lights)
  const ledGeo = new THREE.BoxGeometry(0.024, 0.003, 0.006);
  const ledY = SCREEN_BOTTOM_Y + 0.012;
  const ledZ = SCREEN_Z - PANEL_D * 0.5 - 0.016;
  addMesh(ledGeo, matLed, 'emit_led_left', [-0.135, ledY, ledZ]);
  addMesh(ledGeo, matLed, 'emit_led_center', [0, ledY, ledZ]);
  addMesh(ledGeo, matLed, 'emit_led_right', [0.135, ledY, ledZ]);

  // 9. Stand VESA neck (connects column to VESA plate)
  const neckGeo = new THREE.BoxGeometry(0.036, 0.038, 0.055);
  addMesh(neckGeo, matStandMetal, 'stand_vesa_neck', [0, SCREEN_CENTER_Y - 0.015, STAND_COL_Z + 0.025]);

  // 10. Stand vertical column (chamfered/faceted profile)
  const colShape = new THREE.Shape();
  const cw = STAND_COL_W * 0.5;
  const cd = STAND_COL_D * 0.5;
  colShape.moveTo(-cw * 0.7, -cd);
  colShape.lineTo(cw * 0.7, -cd);
  colShape.lineTo(cw, -cd * 0.35);
  colShape.lineTo(cw, cd * 0.65);
  colShape.lineTo(0, cd);
  colShape.lineTo(-cw, cd * 0.65);
  colShape.lineTo(-cw, -cd * 0.35);
  colShape.closePath();

  const colGeo = new THREE.ExtrudeGeometry(colShape, {
    depth: STAND_COL_H,
    bevelEnabled: false,
  });
  colGeo.rotateX(-Math.PI * 0.5);
  addMesh(colGeo, matStandMetal, 'stand_column', [0, 0.018, STAND_COL_Z]);

  // 11. Stand column top beveled cap
  const capGeo = new THREE.ConeGeometry(STAND_COL_W * 0.62, 0.018, 6);
  addMesh(capGeo, matBodySatin, 'stand_column_cap', [0, 0.018 + STAND_COL_H + 0.009, STAND_COL_Z], [0, Math.PI / 6, 0]);

  // 12. Stand column cable-management recess
  const cableHoleGeo = new THREE.BoxGeometry(0.018, 0.038, 0.012);
  addMesh(cableHoleGeo, matRecess, 'stand_cable_cutout', [0, 0.072, STAND_COL_Z - STAND_COL_D * 0.5 + 0.002]);

  // 13. Stand rear hub (where V-legs and column meet)
  const rearHubGeo = new THREE.BoxGeometry(0.068, 0.028, 0.056);
  addMesh(rearHubGeo, matStandMetal, 'stand_rear_hub', [0, 0.014, STAND_COL_Z - 0.004]);

  // 14. Left and Right V-stand legs (tapered beams from rear hub to front-outer tips)
  function createStandLeg(side) {
    const legGroup = new THREE.Group();
    const startX = side * 0.016;
    const startZ = STAND_COL_Z + 0.004;
    const endX = side * LEG_SPREAD_X;
    const endZ = LEG_FRONT_Z;

    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);

    // Tapered leg body using ExtrudeGeometry along length
    const legProfile = new THREE.Shape();
    legProfile.moveTo(0, 0);
    legProfile.lineTo(length, 0);
    legProfile.lineTo(length, LEG_H_TIP);
    legProfile.lineTo(0, LEG_H_BASE);
    legProfile.closePath();

    const legGeo = new THREE.ExtrudeGeometry(legProfile, {
      depth: LEG_W_BASE,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 1,
    });
    // Center width on X, orient length along +Z
    legGeo.translate(0, 0, -LEG_W_BASE * 0.5);
    legGeo.rotateY(-Math.PI * 0.5);

    const mesh = new THREE.Mesh(legGeo, matStandMetal);
    mesh.name = side < 0 ? 'stand_leg_left' : 'stand_leg_right';
    mesh.position.set(startX, 0.002, startZ);
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Rubber foot pad under leg tip
    const footGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.003, 12);
    addMesh(footGeo, matRecess, side < 0 ? 'stand_foot_left' : 'stand_foot_right', [endX, 0.0015, endZ]);
  }

  createStandLeg(-1);
  createStandLeg(1);

  // Rear center rubber foot pad
  const rearFootGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 12);
  addMesh(rearFootGeo, matRecess, 'stand_foot_rear', [0, 0.0015, STAND_COL_Z - 0.018]);

  return group;
}
