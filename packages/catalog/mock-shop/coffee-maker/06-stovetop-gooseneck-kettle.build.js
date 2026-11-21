function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const BODY_R_BOTTOM = 0.060;
  const BODY_R_MAX = 0.072;
  const BODY_R_TOP = 0.048;
  const BODY_H = 0.125;
  const LID_H = 0.015;
  const KNOB_H = 0.025;
  const SPOUT_RADIUS = 0.0072;
  const HANDLE_RADIUS = 0.0085;
  const CENTER_OFFSET_X = 0.0075;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8c5be,
    metalness: 0.88,
    roughness: 0.28,
  });

  const steelPolishedMat = new THREE.MeshStandardMaterial({
    color: 0xd4d1ca,
    metalness: 0.92,
    roughness: 0.18,
  });

  const darkInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.7,
  });

  const kettleGroup = new THREE.Group();
  kettleGroup.position.x = CENTER_OFFSET_X;
  group.add(kettleGroup);

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    kettleGroup.add(mesh);
    return mesh;
  }

  // 1. Kettle body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BODY_R_BOTTOM - 0.004, 0.0),
    new THREE.Vector2(BODY_R_BOTTOM + 0.005, 0.004),
    new THREE.Vector2(BODY_R_MAX, 0.022),
    new THREE.Vector2(BODY_R_MAX - 0.001, 0.042),
    new THREE.Vector2(0.066, 0.072),
    new THREE.Vector2(0.058, 0.098),
    new THREE.Vector2(BODY_R_TOP + 0.002, BODY_H - 0.005),
    new THREE.Vector2(BODY_R_TOP, BODY_H),
    new THREE.Vector2(BODY_R_TOP - 0.003, BODY_H),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  addMesh(bodyGeo, steelMat, 'kettle_body');

  // 2. Base ring
  const baseRingGeo = new THREE.CylinderGeometry(BODY_R_BOTTOM - 0.005, BODY_R_BOTTOM - 0.005, 0.002, 32);
  const baseRing = addMesh(baseRingGeo, steelPolishedMat, 'kettle_base_plate');
  baseRing.position.y = 0.001;

  // 3. Top rim
  const rimGeo = new THREE.TorusGeometry(BODY_R_TOP - 0.001, 0.0022, 12, 32);
  const rim = addMesh(rimGeo, steelPolishedMat, 'kettle_top_rim');
  rim.rotation.x = Math.PI / 2;
  rim.position.y = BODY_H;

  // 4. Lid seam shadow ring
  const seamGeo = new THREE.TorusGeometry(BODY_R_TOP - 0.0005, 0.0012, 8, 32);
  const seam = addMesh(seamGeo, darkInteriorMat, 'lid_seam');
  seam.rotation.x = Math.PI / 2;
  seam.position.y = BODY_H + 0.001;

  // 5. Domed lid (LatheGeometry)
  const lidPoints = [
    new THREE.Vector2(BODY_R_TOP - 0.001, BODY_H + 0.0015),
    new THREE.Vector2(BODY_R_TOP + 0.001, BODY_H + 0.003),
    new THREE.Vector2(0.040, BODY_H + 0.0085),
    new THREE.Vector2(0.025, BODY_H + 0.0135),
    new THREE.Vector2(0.010, BODY_H + LID_H),
    new THREE.Vector2(0.0, BODY_H + LID_H),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  addMesh(lidGeo, steelMat, 'kettle_lid');

  // 6. Lid knob (LatheGeometry)
  const knobBaseY = BODY_H + LID_H - 0.001;
  const knobPoints = [
    new THREE.Vector2(0.0, knobBaseY),
    new THREE.Vector2(0.0095, knobBaseY),
    new THREE.Vector2(0.008, knobBaseY + 0.004),
    new THREE.Vector2(0.0085, knobBaseY + 0.010),
    new THREE.Vector2(0.0145, knobBaseY + 0.016),
    new THREE.Vector2(0.0155, knobBaseY + 0.020),
    new THREE.Vector2(0.0135, knobBaseY + 0.0235),
    new THREE.Vector2(0.006, knobBaseY + KNOB_H),
    new THREE.Vector2(0.0, knobBaseY + KNOB_H),
  ];
  const knobGeo = new THREE.LatheGeometry(knobPoints, 32);
  addMesh(knobGeo, steelPolishedMat, 'lid_knob');

  // 7. Gooseneck spout
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.064, 0.033, 0),
    new THREE.Vector3(-0.088, 0.036, 0),
    new THREE.Vector3(-0.104, 0.055, 0),
    new THREE.Vector3(-0.111, 0.086, 0),
    new THREE.Vector3(-0.121, 0.111, 0),
    new THREE.Vector3(-0.140, 0.121, 0),
  ]);
  const spoutGeo = new THREE.TubeGeometry(spoutCurve, 32, SPOUT_RADIUS, 16, false);
  addMesh(spoutGeo, steelMat, 'gooseneck_spout');

  // 8. Spout base collar
  const spoutCollarGeo = new THREE.CylinderGeometry(SPOUT_RADIUS * 1.15, SPOUT_RADIUS * 1.45, 0.008, 16);
  const spoutCollar = addMesh(spoutCollarGeo, steelPolishedMat, 'spout_collar');
  spoutCollar.position.set(-0.068, 0.033, 0);
  spoutCollar.rotation.z = Math.PI / 2 - 0.12;

  // 9. Spout tip rim
  const spoutTipRimGeo = new THREE.TorusGeometry(SPOUT_RADIUS * 0.92, 0.0012, 10, 20);
  const spoutTipRim = addMesh(spoutTipRimGeo, steelPolishedMat, 'spout_tip_rim');
  spoutTipRim.position.set(-0.140, 0.121, 0);
  spoutTipRim.rotation.y = Math.PI / 2;
  spoutTipRim.rotation.x = 0.45;

  // 10. Spout interior dark opening
  const spoutOpeningGeo = new THREE.CylinderGeometry(SPOUT_RADIUS * 0.78, SPOUT_RADIUS * 0.78, 0.004, 16);
  const spoutOpening = addMesh(spoutOpeningGeo, darkInteriorMat, 'spout_opening');
  spoutOpening.position.set(-0.139, 0.1205, 0);
  spoutOpening.rotation.z = Math.PI / 2 - 0.45;

  // 11. Handle mount bracket
  const handleMountGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.012, 16);
  const handleMount = addMesh(handleMountGeo, steelPolishedMat, 'handle_mount');
  handleMount.position.set(0.056, 0.104, 0);
  handleMount.rotation.z = -Math.PI / 2 + 0.35;

  // 12. Ergonomic curved handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.057, 0.105, 0),
    new THREE.Vector3(0.078, 0.124, 0),
    new THREE.Vector3(0.102, 0.125, 0),
    new THREE.Vector3(0.116, 0.104, 0),
    new THREE.Vector3(0.124, 0.072, 0),
    new THREE.Vector3(0.128, 0.044, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_RADIUS, 16, false);
  addMesh(handleGeo, steelMat, 'kettle_handle');

  // 13. Handle bottom end cap
  const handleCapGeo = new THREE.SphereGeometry(HANDLE_RADIUS, 16, 12);
  const handleCap = addMesh(handleCapGeo, steelPolishedMat, 'handle_end_cap');
  handleCap.position.set(0.128, 0.044, 0);

  return group;
}
