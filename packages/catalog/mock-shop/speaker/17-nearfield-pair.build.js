function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SPK_W = 0.115;
  const SPK_H = 0.175;
  const SPK_D = 0.130;
  const CORNER_R = 0.012;
  const BEVEL = 0.004;
  const GAP = 0.045;

  const FOOT_R = 0.008;
  const FOOT_H = 0.005;

  const KNOB_R = 0.013;
  const KNOB_H = 0.010;

  const CABLE_R = 0.0022;

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xb8b9bc,
    roughness: 0.35,
    metalness: 0.78,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x4a4c50,
    roughness: 0.55,
    metalness: 0.5,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x2a2b2e,
    roughness: 0.5,
    metalness: 0.2,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,
    roughness: 0.85,
    metalness: 0.05,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xddeeff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  const metalPlugMat = new THREE.MeshStandardMaterial({
    color: 0xd4d6d8,
    roughness: 0.22,
    metalness: 0.92,
  });

  function setShadow(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Rounded rectangle shape for speaker body
  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  const bodyShape = createRoundedRectShape(SPK_W - BEVEL * 2, SPK_H - BEVEL * 2, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: SPK_D - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  bodyGeo.center();

  const bezelShape = createRoundedRectShape(SPK_W - 0.012, SPK_H - 0.012, CORNER_R * 0.75);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 8,
  });
  bezelGeo.center();

  const grilleShape = createRoundedRectShape(SPK_W - 0.018, SPK_H - 0.018, CORNER_R * 0.6);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.0025,
    bevelEnabled: false,
    curveSegments: 8,
  });
  grilleGeo.center();

  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 16);

  const speakerXOffsets = [-(SPK_W / 2 + GAP / 2), SPK_W / 2 + GAP / 2];
  const speakerNames = ['left', 'right'];

  speakerXOffsets.forEach((xPos, idx) => {
    const side = speakerNames[idx];
    const bodyY = FOOT_H + SPK_H / 2;

    // Main enclosure
    const body = setShadow(new THREE.Mesh(bodyGeo, aluminumMat), `${side}_speaker_body`);
    body.position.set(xPos, bodyY, 0);
    group.add(body);

    // Front bezel
    const bezel = setShadow(new THREE.Mesh(bezelGeo, bezelMat), `${side}_speaker_bezel`);
    bezel.position.set(xPos, bodyY, SPK_D / 2 - 0.0005);
    group.add(bezel);

    // Front grille
    const grille = setShadow(new THREE.Mesh(grilleGeo, grilleMat), `${side}_speaker_grille`);
    grille.position.set(xPos, bodyY, SPK_D / 2 + 0.0005);
    group.add(grille);

    // 4 rubber feet
    const footOffsetX = SPK_W / 2 - 0.018;
    const footOffsetZ = SPK_D / 2 - 0.018;
    const footCoords = [
      [-footOffsetX, -footOffsetZ],
      [footOffsetX, -footOffsetZ],
      [-footOffsetX, footOffsetZ],
      [footOffsetX, footOffsetZ],
    ];
    footCoords.forEach(([fx, fz], fIdx) => {
      const foot = setShadow(new THREE.Mesh(footGeo, rubberMat), `${side}_speaker_foot_${fIdx + 1}`);
      foot.position.set(xPos + fx, FOOT_H / 2, fz);
      group.add(foot);
    });
  });

  // Right speaker volume knob & LED indicator
  const rightX = speakerXOffsets[1];
  const knobGeo = new THREE.CylinderGeometry(KNOB_R, KNOB_R, KNOB_H, 24);
  const knob = setShadow(new THREE.Mesh(knobGeo, aluminumMat), 'volume_knob');
  knob.rotation.z = -Math.PI / 2;
  knob.position.set(rightX + SPK_W / 2 + KNOB_H / 2 - 0.001, FOOT_H + 0.036, SPK_D / 2 - 0.036);
  group.add(knob);

  const ledGeo = new THREE.SphereGeometry(0.0018, 12, 12);
  const led = setShadow(new THREE.Mesh(ledGeo, ledMat), 'power_led');
  led.position.set(rightX + SPK_W / 2 + 0.0005, FOOT_H + 0.044, SPK_D / 2 - 0.062);
  group.add(led);

  // Left speaker audio cable looping to front-left
  const leftX = speakerXOffsets[0];
  const leftCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(leftX, FOOT_H + 0.025, -SPK_D / 2),
    new THREE.Vector3(leftX - 0.04, 0.008, -SPK_D / 2 - 0.03),
    new THREE.Vector3(leftX - 0.11, CABLE_R, -0.02),
    new THREE.Vector3(leftX - 0.10, CABLE_R, 0.06),
    new THREE.Vector3(leftX - 0.03, CABLE_R, SPK_D / 2 + 0.035),
  ]);
  const leftCableGeo = new THREE.TubeGeometry(leftCableCurve, 32, CABLE_R, 8, false);
  const leftCable = setShadow(new THREE.Mesh(leftCableGeo, rubberMat), 'left_audio_cable');
  group.add(leftCable);

  // Left 3.5mm plug
  const plugBodyGeo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.024, 12);
  const leftPlugBody = setShadow(new THREE.Mesh(plugBodyGeo, rubberMat), 'left_plug_body');
  leftPlugBody.rotation.z = -Math.PI / 2;
  leftPlugBody.position.set(leftX - 0.018, 0.0042, SPK_D / 2 + 0.035);
  group.add(leftPlugBody);

  const plugTipGeo = new THREE.CylinderGeometry(0.0016, 0.0016, 0.014, 10);
  const leftPlugTip = setShadow(new THREE.Mesh(plugTipGeo, metalPlugMat), 'left_plug_tip');
  leftPlugTip.rotation.z = -Math.PI / 2;
  leftPlugTip.position.set(leftX + 0.001, 0.0042, SPK_D / 2 + 0.035);
  group.add(leftPlugTip);

  // Right speaker USB/audio cable looping to front-right
  const rightCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(rightX, FOOT_H + 0.025, -SPK_D / 2),
    new THREE.Vector3(rightX + 0.04, 0.008, -SPK_D / 2 - 0.03),
    new THREE.Vector3(rightX + 0.11, CABLE_R, -0.01),
    new THREE.Vector3(rightX + 0.09, CABLE_R, 0.07),
    new THREE.Vector3(rightX + 0.02, CABLE_R, SPK_D / 2 + 0.04),
  ]);
  const rightCableGeo = new THREE.TubeGeometry(rightCableCurve, 32, CABLE_R, 8, false);
  const rightCable = setShadow(new THREE.Mesh(rightCableGeo, rubberMat), 'right_usb_cable');
  group.add(rightCable);

  // Right USB-A plug
  const usbBodyGeo = new THREE.BoxGeometry(0.022, 0.008, 0.014);
  const usbBody = setShadow(new THREE.Mesh(usbBodyGeo, rubberMat), 'usb_plug_body');
  usbBody.position.set(rightX + 0.009, 0.004, SPK_D / 2 + 0.04);
  group.add(usbBody);

  const usbTipGeo = new THREE.BoxGeometry(0.012, 0.005, 0.011);
  const usbTip = setShadow(new THREE.Mesh(usbTipGeo, metalPlugMat), 'usb_plug_tip');
  usbTip.position.set(rightX - 0.008, 0.004, SPK_D / 2 + 0.04);
  group.add(usbTip);

  return group;
}
