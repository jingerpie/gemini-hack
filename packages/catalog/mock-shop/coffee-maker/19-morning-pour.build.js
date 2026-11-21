function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const BASE_R = 0.08;
  const BASE_H = 0.022;
  const CONNECTOR_H = 0.014;
  const KETTLE_BOTTOM_Y = BASE_H + CONNECTOR_H - 0.004; // slight overlap into connector
  const KETTLE_H = 0.195;
  const KETTLE_R_BOT = 0.075;
  const KETTLE_R_TOP = 0.061;
  const HANDLE_OUTER_X = 0.125;
  const CORD_R = 0.0038;

  // Materials
  const matBody = new THREE.MeshStandardMaterial({
    color: 0xc4b7a3,
    roughness: 0.62,
    metalness: 0.04,
  });

  const matBodyDark = new THREE.MeshStandardMaterial({
    color: 0xa89b87,
    roughness: 0.65,
    metalness: 0.05,
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xd6d9dc,
    roughness: 0.25,
    metalness: 0.88,
  });

  const matWindowFrame = new THREE.MeshPhysicalMaterial({
    color: 0xe6e4e0,
    roughness: 0.25,
    metalness: 0.0,
    transparent: true,
    opacity: 0.72,
    clearcoat: 0.4,
  });

  const matWindowInner = new THREE.MeshPhysicalMaterial({
    color: 0x3b3834,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    clearcoat: 0.8,
  });

  const matTick = new THREE.MeshStandardMaterial({
    color: 0x7a756e,
    roughness: 0.5,
    metalness: 0.1,
  });

  const matClearSwitch = new THREE.MeshPhysicalMaterial({
    color: 0xeef2f5,
    roughness: 0.12,
    metalness: 0.0,
    transparent: true,
    opacity: 0.65,
    clearcoat: 0.9,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Power Base (LatheGeometry for smooth rounded profile)
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R - 0.012, 0.0),
    new THREE.Vector2(BASE_R - 0.002, 0.005),
    new THREE.Vector2(BASE_R, 0.011),
    new THREE.Vector2(BASE_R - 0.002, 0.018),
    new THREE.Vector2(BASE_R - 0.01, BASE_H),
    new THREE.Vector2(0.0, BASE_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(baseGeo, matBody, 'power_base');

  // 2. Brushed Steel Ring on Base
  const steelRingGeo = new THREE.CylinderGeometry(BASE_R - 0.018, BASE_R - 0.016, 0.003, 32);
  const steelRing = addMesh(steelRingGeo, matSteel, 'base_steel_ring');
  steelRing.position.y = BASE_H + 0.0005;

  // 3. Base Screws (6 small screws around the steel ring)
  const screwGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 12);
  const screwRadius = BASE_R - 0.025;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.25;
    const screw = addMesh(screwGeo, matSteel, `base_screw_${i + 1}`);
    screw.position.set(
      Math.cos(angle) * screwRadius,
      BASE_H + 0.002,
      Math.sin(angle) * screwRadius
    );
  }

  // 4. Central Power Connector Post
  const connectorGeo = new THREE.CylinderGeometry(0.038, 0.044, CONNECTOR_H, 28);
  const connector = addMesh(connectorGeo, matBodyDark, 'base_connector');
  connector.position.y = BASE_H + CONNECTOR_H * 0.5;

  // 5. Coiled Power Cord (at the back-right of the base)
  const cordPoints = [];
  const coilTurns = 2.5;
  const coilSteps = 48;
  for (let i = 0; i <= coilSteps; i++) {
    const t = i / coilSteps;
    const angle = t * Math.PI * 2 * coilTurns;
    const r = 0.036 + Math.sin(t * Math.PI) * 0.006;
    const x = 0.085 + Math.cos(angle) * r;
    const z = -0.055 + Math.sin(angle) * r;
    const y = CORD_R + (i / coilSteps) * CORD_R * 2.2;
    cordPoints.push(new THREE.Vector3(x, y, z));
  }
  const cordCurve = new THREE.CatmullRomCurve3(cordPoints);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 48, CORD_R, 10, false);
  addMesh(cordGeo, matBodyDark, 'power_cord');

  // 6. Kettle Main Body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, KETTLE_BOTTOM_Y),
    new THREE.Vector2(KETTLE_R_BOT - 0.015, KETTLE_BOTTOM_Y),
    new THREE.Vector2(KETTLE_R_BOT - 0.003, KETTLE_BOTTOM_Y + 0.008),
    new THREE.Vector2(KETTLE_R_BOT, KETTLE_BOTTOM_Y + 0.022),
    new THREE.Vector2(KETTLE_R_BOT - 0.001, KETTLE_BOTTOM_Y + 0.026),
    new THREE.Vector2(KETTLE_R_BOT - 0.002, KETTLE_BOTTOM_Y + 0.028),
    new THREE.Vector2(KETTLE_R_TOP + 0.003, KETTLE_BOTTOM_Y + KETTLE_H - 0.012),
    new THREE.Vector2(KETTLE_R_TOP, KETTLE_BOTTOM_Y + KETTLE_H),
    new THREE.Vector2(KETTLE_R_TOP - 0.004, KETTLE_BOTTOM_Y + KETTLE_H + 0.002),
    new THREE.Vector2(0.0, KETTLE_BOTTOM_Y + KETTLE_H + 0.002),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  addMesh(bodyGeo, matBody, 'kettle_body');

  // 7. Kettle Seam Groove Ring
  const seamGeo = new THREE.TorusGeometry(KETTLE_R_BOT - 0.0005, 0.001, 8, 32);
  const seam = addMesh(seamGeo, matBodyDark, 'kettle_seam_ring');
  seam.rotation.x = Math.PI / 2;
  seam.position.y = KETTLE_BOTTOM_Y + 0.027;

  // 8. Kettle Lid (slightly domed)
  const lidGeo = new THREE.SphereGeometry(KETTLE_R_TOP - 0.005, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.24);
  const lid = addMesh(lidGeo, matBody, 'kettle_lid');
  lid.scale.set(1, 0.35, 1);
  lid.position.y = KETTLE_BOTTOM_Y + KETTLE_H - 0.012;

  // 9. Lid Hinge / Accent Detail
  const lidAccentGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.003, 18);
  const lidAccent = addMesh(lidAccentGeo, matBodyDark, 'lid_hinge_detail');
  lidAccent.position.set(-0.028, KETTLE_BOTTOM_Y + KETTLE_H + 0.004, 0);
  lidAccent.rotation.z = 0.08;

  // 10. Stainless Steel Spout (-X side, near top)
  const spoutGeo = new THREE.CylinderGeometry(0.005, 0.022, 0.044, 16);
  const spout = addMesh(spoutGeo, matSteel, 'kettle_spout');
  spout.position.set(-KETTLE_R_TOP - 0.012, KETTLE_BOTTOM_Y + KETTLE_H - 0.026, 0);
  spout.rotation.z = Math.PI * 0.32;
  spout.scale.set(0.85, 1, 0.72);

  // 11. Ergonomic Handle (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(KETTLE_R_TOP - 0.005, KETTLE_BOTTOM_Y + KETTLE_H - 0.016, 0),
    new THREE.Vector3(HANDLE_OUTER_X - 0.018, KETTLE_BOTTOM_Y + KETTLE_H - 0.018, 0),
    new THREE.Vector3(HANDLE_OUTER_X, KETTLE_BOTTOM_Y + KETTLE_H - 0.042, 0),
    new THREE.Vector3(HANDLE_OUTER_X + 0.004, KETTLE_BOTTOM_Y + 0.085, 0),
    new THREE.Vector3(HANDLE_OUTER_X - 0.015, KETTLE_BOTTOM_Y + 0.055, 0),
    new THREE.Vector3(KETTLE_R_BOT - 0.006, KETTLE_BOTTOM_Y + 0.042, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, 0.0115, 14, false);
  addMesh(handleGeo, matBody, 'kettle_handle');

  // 12. Lid Release Button (on top of handle)
  const btnGeo = new THREE.BoxGeometry(0.022, 0.007, 0.014);
  const btn = addMesh(btnGeo, matBody, 'lid_release_button');
  btn.position.set(HANDLE_OUTER_X - 0.032, KETTLE_BOTTOM_Y + KETTLE_H - 0.007, 0);
  btn.rotation.z = -0.15;

  // 13. Clear Power Switch Lever (bottom-right of kettle body)
  const switchGeo = new THREE.BoxGeometry(0.024, 0.007, 0.014);
  const powerSwitch = addMesh(switchGeo, matClearSwitch, 'power_switch');
  powerSwitch.position.set(KETTLE_R_BOT + 0.008, KETTLE_BOTTOM_Y + 0.018, 0);

  // 14. Water Level Window Frame (+Z face)
  const winY = KETTLE_BOTTOM_Y + 0.098;
  const winZ = KETTLE_R_BOT - 0.011;
  const winFrameGeo = new THREE.CapsuleGeometry(0.015, 0.082, 8, 16);
  const winFrame = addMesh(winFrameGeo, matWindowFrame, 'water_window_frame');
  winFrame.position.set(0, winY, winZ);
  winFrame.rotation.x = -0.072;
  winFrame.scale.set(1, 1, 0.45);

  // 15. Water Level Window Inner Dark Backing
  const winInnerGeo = new THREE.CapsuleGeometry(0.01, 0.074, 8, 14);
  const winInner = addMesh(winInnerGeo, matWindowInner, 'water_window_inner');
  winInner.position.set(0, winY, winZ + 0.002);
  winInner.rotation.x = -0.072;
  winInner.scale.set(1, 1, 0.4);

  // 16. Water Level Tick Marks
  const tickGeo = new THREE.BoxGeometry(0.008, 0.0012, 0.002);
  for (let i = 0; i < 4; i++) {
    const tick = addMesh(tickGeo, matTick, `water_level_tick_${i + 1}`);
    const yOffset = -0.028 + i * 0.019;
    tick.position.set(0, winY + yOffset, winZ + 0.006 - yOffset * 0.072);
    tick.rotation.x = -0.072;
  }

  return group;
}
