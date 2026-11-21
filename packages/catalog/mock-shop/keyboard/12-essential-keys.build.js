function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.320;
  const D = 0.112;
  const H = 0.028;
  const FOOT_H = 0.002;
  const CASE_Y = FOOT_H;
  const BEZEL = 0.008;
  const KEY_PITCH = 0.01905;
  const KEY_GAP = 0.0020;
  const KEY_H = 0.0095;
  const CABLE_Z_OFFSET = 0.026; // Shift keyboard +Z so keyboard+cable centers near Z=0

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.42,
    metalness: 0.22
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x15181c,
    roughness: 0.65,
    metalness: 0.3
  });
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x3b4048,
    roughness: 0.48,
    metalness: 0.05
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x363b42,
    roughness: 0.52,
    metalness: 0.08
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8cdd4,
    roughness: 0.25,
    metalness: 0.85
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.85,
    metalness: 0.0
  });

  // Helper to create rounded rectangle shape
  function makeRoundedRectShape(w, d, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r);
    s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r);
    s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  }

  // 1. Rubber feet (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.006, 0.006, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + 0.018, -D / 2 + 0.016],
    [W / 2 - 0.018, -D / 2 + 0.016],
    [-W / 2 + 0.018, D / 2 - 0.016],
    [W / 2 - 0.018, D / 2 - 0.016]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(pos[0], FOOT_H / 2, pos[1] + CABLE_Z_OFFSET);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // 2. Keyboard outer case
  const caseShape = makeRoundedRectShape(W, D, 0.006);
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
    depth: H - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3
  });
  caseGeo.rotateX(Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, caseMat);
  caseMesh.name = 'keyboard_case';
  caseMesh.position.set(0, CASE_Y + H - 0.002, CABLE_Z_OFFSET);
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  group.add(caseMesh);

  // 3. Recessed inner plate
  const plateGeo = new THREE.BoxGeometry(W - BEZEL * 1.6, 0.004, D - BEZEL * 1.6);
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.name = 'keyboard_plate';
  plateMesh.position.set(0, CASE_Y + H - 0.003, CABLE_Z_OFFSET);
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // 4. Keys (65% layout: 5 rows, 16u wide, 68 keys)
  const rows = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1],
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1],
    [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, 1],
    [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1, 1]
  ];

  const unitKeyGeo = new THREE.BoxGeometry(1, 1, 1);
  const startX = -(16 * KEY_PITCH) / 2;
  const startZ = -(5 * KEY_PITCH) / 2 + CABLE_Z_OFFSET;
  const keyY = CASE_Y + H + KEY_H / 2 - 0.001;

  let keyIndex = 0;
  rows.forEach((row, rIdx) => {
    let cursorX = startX;
    const z = startZ + (rIdx + 0.5) * KEY_PITCH;
    row.forEach((u) => {
      const kw = u * KEY_PITCH - KEY_GAP;
      const kd = KEY_PITCH - KEY_GAP;
      const keyMesh = new THREE.Mesh(unitKeyGeo, keyMat);
      keyMesh.name = `keycap_${keyIndex++}`;
      keyMesh.scale.set(kw, KEY_H, kd);
      keyMesh.position.set(cursorX + (u * KEY_PITCH) / 2, keyY, z);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      group.add(keyMesh);
      cursorX += u * KEY_PITCH;
    });
  });

  // 5. USB-C connector at back-left
  const portX = -W / 2 + 0.028;
  const portZ = -D / 2 + CABLE_Z_OFFSET;
  const usbcGeo = new THREE.BoxGeometry(0.011, 0.007, 0.015);
  const usbcMesh = new THREE.Mesh(usbcGeo, cableMat);
  usbcMesh.name = 'usb_c_connector';
  usbcMesh.position.set(portX, CASE_Y + H * 0.5, portZ - 0.005);
  usbcMesh.castShadow = true;
  usbcMesh.receiveShadow = true;
  group.add(usbcMesh);

  // 6. Coiled USB cable
  const coilPoints = [];
  const coilRadius = 0.0085;
  const tubeRadius = 0.0027;
  const coilY = coilRadius + tubeRadius;
  const coilZ = portZ - 0.044;
  const coilStartX = portX + 0.008;
  const coilEndX = 0.012;
  const turns = 22;
  const stepsPerTurn = 10;

  // Lead-in from USB-C
  coilPoints.push(new THREE.Vector3(portX, CASE_Y + H * 0.5, portZ - 0.012));
  coilPoints.push(new THREE.Vector3(portX, coilY + 0.004, portZ - 0.028));
  coilPoints.push(new THREE.Vector3(coilStartX, coilY, coilZ));

  // Helix
  const totalSteps = turns * stepsPerTurn;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const angle = t * turns * Math.PI * 2;
    const x = coilStartX + t * (coilEndX - coilStartX);
    const y = coilY + Math.sin(angle) * coilRadius;
    const z = coilZ + Math.cos(angle) * coilRadius;
    coilPoints.push(new THREE.Vector3(x, y, z));
  }

  // Lead-out to USB-A
  const usbaX = 0.064;
  coilPoints.push(new THREE.Vector3(coilEndX + 0.018, 0.0045, coilZ));
  coilPoints.push(new THREE.Vector3(usbaX - 0.012, 0.0045, coilZ));

  const cableCurve = new THREE.CatmullRomCurve3(coilPoints);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 240, tubeRadius, 8, false);
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.name = 'coiled_usb_cable';
  cableMesh.castShadow = true;
  cableMesh.receiveShadow = true;
  group.add(cableMesh);

  // 7. USB-A plug
  const usbaHousingGeo = new THREE.BoxGeometry(0.024, 0.009, 0.015);
  const usbaHousing = new THREE.Mesh(usbaHousingGeo, cableMat);
  usbaHousing.name = 'usb_a_housing';
  usbaHousing.position.set(usbaX, 0.0045, coilZ);
  usbaHousing.castShadow = true;
  usbaHousing.receiveShadow = true;
  group.add(usbaHousing);

  const usbaTipGeo = new THREE.BoxGeometry(0.013, 0.0055, 0.012);
  const usbaTip = new THREE.Mesh(usbaTipGeo, metalMat);
  usbaTip.name = 'usb_a_tip';
  usbaTip.position.set(usbaX + 0.0185, 0.0045, coilZ);
  usbaTip.castShadow = true;
  usbaTip.receiveShadow = true;
  group.add(usbaTip);

  return group;
}
