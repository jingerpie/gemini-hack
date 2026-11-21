function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.205;
  const R = 0.058;
  const BASE_H = 0.032;
  const TOP_R = 0.044;
  const SHOULDER_R = 0.014;
  const SEGS = 32;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x26292c,
    roughness: 0.92,
    metalness: 0.04
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x2f3338,
    roughness: 0.58,
    metalness: 0.08
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xbec4ca,
    roughness: 0.25,
    metalness: 0.88
  });

  const topDiscMat = new THREE.MeshStandardMaterial({
    color: 0x45494e,
    roughness: 0.5,
    metalness: 0.1
  });

  const iconMat = new THREE.MeshStandardMaterial({
    color: 0x8b9096,
    roughness: 0.4,
    metalness: 0.35
  });

  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x16181a,
    roughness: 0.75,
    metalness: 0.05
  });

  const metalPinMat = new THREE.MeshStandardMaterial({
    color: 0xaab0b6,
    roughness: 0.22,
    metalness: 0.92
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bottom plastic base (LatheGeometry from y=0 to BASE_H)
  const basePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R * 0.62, 0),
    new THREE.Vector2(R * 0.78, 0.002),
    new THREE.Vector2(R * 0.91, 0.007),
    new THREE.Vector2(R * 0.98, 0.016),
    new THREE.Vector2(R, BASE_H),
    new THREE.Vector2(R * 0.96, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePts, SEGS);
  addMesh(baseGeo, baseMat, 'base_cup');

  // 2. Main fabric body (LatheGeometry from BASE_H to H)
  const bodyPts = [
    new THREE.Vector2(R * 0.96, BASE_H),
    new THREE.Vector2(R, BASE_H),
    new THREE.Vector2(R, H - SHOULDER_R)
  ];
  const shoulderSteps = 8;
  for (let i = 1; i <= shoulderSteps; i++) {
    const t = (i / shoulderSteps) * (Math.PI / 2);
    const r = (R - SHOULDER_R) + Math.cos(t) * SHOULDER_R;
    const y = (H - SHOULDER_R) + Math.sin(t) * SHOULDER_R;
    bodyPts.push(new THREE.Vector2(r, y));
  }
  bodyPts.push(new THREE.Vector2(TOP_R, H));
  bodyPts.push(new THREE.Vector2(TOP_R * 0.9, H - 0.004));

  const bodyGeo = new THREE.LatheGeometry(bodyPts, SEGS);
  addMesh(bodyGeo, fabricMat, 'fabric_body');

  // 3. Top silver chamfered ring
  const ringGeo = new THREE.TorusGeometry(TOP_R - 0.0015, 0.0022, 12, SEGS);
  ringGeo.rotateX(Math.PI / 2);
  addMesh(ringGeo, silverMat, 'top_metal_ring', 0, H - 0.001, 0);

  // 4. Top dark grey control disc
  const discGeo = new THREE.CylinderGeometry(TOP_R - 0.0025, TOP_R - 0.0025, 0.003, SEGS);
  addMesh(discGeo, topDiscMat, 'top_control_disc', 0, H - 0.002, 0);

  // 5. Center play/pause button
  const centerBtnR = 0.0145;
  const centerBtnGeo = new THREE.CylinderGeometry(centerBtnR, centerBtnR, 0.0015, SEGS);
  addMesh(centerBtnGeo, topDiscMat, 'center_button', 0, H - 0.0002, 0);

  // Play triangle + pause bars on center button
  const iconY = H + 0.0007;
  const playTriGeo = new THREE.ConeGeometry(0.0022, 0.0034, 3);
  playTriGeo.rotateZ(-Math.PI / 2);
  playTriGeo.scale(1, 0.35, 1);
  addMesh(playTriGeo, iconMat, 'icon_play_tri', -0.0022, iconY, 0);

  const pauseBarGeo = new THREE.BoxGeometry(0.0009, 0.0006, 0.0034);
  addMesh(pauseBarGeo, iconMat, 'icon_pause_1', 0.0012, iconY, 0);
  addMesh(pauseBarGeo, iconMat, 'icon_pause_2', 0.0030, iconY, 0);

  // Volume + (at -Z) and - (at +Z)
  const plusHGeo = new THREE.BoxGeometry(0.0048, 0.0006, 0.001);
  const plusVGeo = new THREE.BoxGeometry(0.001, 0.0006, 0.0048);
  const volDist = 0.027;
  addMesh(plusHGeo, iconMat, 'icon_plus_h', 0, iconY, -volDist);
  addMesh(plusVGeo, iconMat, 'icon_plus_v', 0, iconY, -volDist);
  addMesh(plusHGeo, iconMat, 'icon_minus', 0, iconY, volDist);

  // Previous |<< (at -X) and Next >>| (at +X)
  const trackDist = 0.027;
  const barGeo = new THREE.BoxGeometry(0.0009, 0.0006, 0.0034);
  const triGeo = new THREE.ConeGeometry(0.0018, 0.0028, 3);
  triGeo.scale(1, 0.35, 1);

  const prevTri = triGeo.clone();
  prevTri.rotateZ(Math.PI / 2);
  addMesh(barGeo, iconMat, 'icon_prev_bar', -trackDist - 0.0022, iconY, 0);
  addMesh(prevTri, iconMat, 'icon_prev_tri', -trackDist + 0.0002, iconY, 0);

  const nextTri = triGeo.clone();
  nextTri.rotateZ(-Math.PI / 2);
  addMesh(nextTri, iconMat, 'icon_next_tri', trackDist - 0.0002, iconY, 0);
  addMesh(barGeo, iconMat, 'icon_next_bar', trackDist + 0.0022, iconY, 0);

  // 6. Four microphone pinholes on top disc
  const micGeo = new THREE.CylinderGeometry(0.0007, 0.0007, 0.001, 8);
  const micR = 0.023;
  const micAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  micAngles.forEach((ang, idx) => {
    addMesh(
      micGeo,
      darkRecessMat,
      `mic_hole_${idx + 1}`,
      Math.cos(ang) * micR,
      H - 0.0004,
      Math.sin(ang) * micR
    );
  });

  // 7. Mute switch on upper front (+Z)
  const muteY = H - 0.028;
  const muteBezelGeo = new THREE.CapsuleGeometry(0.0042, 0.011, 6, 12);
  muteBezelGeo.rotateZ(Math.PI / 2);
  addMesh(muteBezelGeo, darkRecessMat, 'mute_bezel', 0, muteY, R - 0.0015);

  const muteSliderGeo = new THREE.CapsuleGeometry(0.003, 0.005, 6, 12);
  muteSliderGeo.rotateZ(Math.PI / 2);
  addMesh(muteSliderGeo, topDiscMat, 'mute_slider', -0.0025, muteY, R + 0.0008);

  // 8. Power inlet port on lower front (+Z)
  const portY = 0.014;
  const portZ = R * 0.95;
  const portGeo = new THREE.CapsuleGeometry(0.0045, 0.009, 6, 12);
  portGeo.rotateZ(Math.PI / 2);
  addMesh(portGeo, darkRecessMat, 'power_recess', 0, portY, portZ);

  const pinGeo = new THREE.CylinderGeometry(0.001, 0.001, 0.004, 10);
  pinGeo.rotateX(Math.PI / 2);
  addMesh(pinGeo, metalPinMat, 'power_pin_1', -0.0035, portY, portZ + 0.0015);
  addMesh(pinGeo, metalPinMat, 'power_pin_2', 0.0035, portY, portZ + 0.0015);

  return group;
}
