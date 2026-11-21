function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.442;
  const D = 0.142;
  const CASE_H = 0.024;
  const FOOT_H = 0.004;
  const TILT = 0.065; // ~3.7 deg typing angle

  const U = 0.01905;
  const KEY_GAP = 0.002;
  const KEY_H = 0.009;

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.55, metalness: 0.15 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.7, metalness: 0.2 });
  const whiteKeyMat = new THREE.MeshStandardMaterial({ color: 0xebebeb, roughness: 0.45, metalness: 0.05 });
  const darkKeyMat = new THREE.MeshStandardMaterial({ color: 0x24272a, roughness: 0.5, metalness: 0.05 });
  const blueKeyMat = new THREE.MeshStandardMaterial({ color: 0x1b64c2, roughness: 0.4, metalness: 0.05 });
  const redKeyMat = new THREE.MeshStandardMaterial({ color: 0xd12c2c, roughness: 0.4, metalness: 0.05 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xf2be22, roughness: 0.45, metalness: 0.05 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, roughness: 0.3, metalness: 0.85 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0.0 });

  // Keyboard assembly (tilted)
  const kbGroup = new THREE.Group();
  kbGroup.rotation.x = TILT;
  // Position so the lowest front edge + feet sit at y = 0
  kbGroup.position.set(0, CASE_H / 2 + FOOT_H + Math.sin(TILT) * (D / 2), 0);
  group.add(kbGroup);

  // Main case body
  const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(W, CASE_H, D), caseMat);
  caseMesh.name = 'keyboard_case';
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  kbGroup.add(caseMesh);

  // Inner switch plate
  const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.014, 0.004, D - 0.014), plateMat);
  plateMesh.name = 'switch_plate';
  plateMesh.position.y = CASE_H / 2 - 0.001;
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  kbGroup.add(plateMesh);

  // Rubber feet (4 corners)
  const footGeo = new THREE.CylinderGeometry(0.008, 0.008, FOOT_H, 16);
  const footOffsets = [
    [-W / 2 + 0.025, -D / 2 + 0.02],
    [W / 2 - 0.025, -D / 2 + 0.02],
    [-W / 2 + 0.025, D / 2 - 0.02],
    [W / 2 - 0.025, D / 2 - 0.02],
  ];
  footOffsets.forEach(([fx, fz], idx) => {
    const foot = new THREE.Mesh(footGeo, rubberMat);
    foot.name = `rubber_foot_${idx + 1}`;
    foot.position.set(fx, -CASE_H / 2 - FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    kbGroup.add(foot);
  });

  // Shared keycap geometry
  const keyGeo = new THREE.BoxGeometry(1, 1, 1);
  const startX = -W / 2 + 0.012;
  const keyY = CASE_H / 2 + KEY_H / 2;

  function addKey(xU, zPos, wU, dU, mat, name) {
    const kw = wU * U - KEY_GAP;
    const kd = dU * U - KEY_GAP;
    const mesh = new THREE.Mesh(keyGeo, mat);
    mesh.name = name;
    mesh.scale.set(kw, KEY_H, kd);
    mesh.position.set(startX + (xU + wU / 2) * U, keyY, zPos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    kbGroup.add(mesh);
  }

  // Row 0: Function row
  const r0Z = -D / 2 + 0.018;
  addKey(0, r0Z, 1, 1, redKeyMat, 'key_esc');
  for (let i = 0; i < 4; i++) addKey(2 + i, r0Z, 1, 1, whiteKeyMat, `key_f${i + 1}`);
  for (let i = 0; i < 4; i++) addKey(6.5 + i, r0Z, 1, 1, blueKeyMat, `key_f${i + 5}`);
  for (let i = 0; i < 4; i++) addKey(11 + i, r0Z, 1, 1, whiteKeyMat, `key_f${i + 9}`);
  // Nav top
  for (let i = 0; i < 3; i++) addKey(15.25 + i, r0Z, 1, 1, blueKeyMat, `key_nav_top_${i}`);
  // Numpad top (4 keys)
  for (let i = 0; i < 3; i++) addKey(18.5 + i, r0Z, 1, 1, darkKeyMat, `key_media_${i}`);
  addKey(21.5, r0Z, 1, 1, redKeyMat, 'key_top_right_red');

  // Row 1: Number row
  const r1Z = r0Z + 1.25 * U;
  for (let i = 0; i < 13; i++) addKey(i, r1Z, 1, 1, whiteKeyMat, `key_num_${i}`);
  addKey(13, r1Z, 2, 1, darkKeyMat, 'key_backspace');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, r1Z, 1, 1, darkKeyMat, `key_nav_r1_${i}`);
  for (let i = 0; i < 4; i++) addKey(18.5 + i, r1Z, 1, 1, darkKeyMat, `key_num_r1_${i}`);

  // Row 2: QWERTY
  const r2Z = r1Z + U;
  addKey(0, r2Z, 1.5, 1, darkKeyMat, 'key_tab');
  for (let i = 0; i < 12; i++) addKey(1.5 + i, r2Z, 1, 1, whiteKeyMat, `key_qwe_${i}`);
  addKey(13.5, r2Z, 1.5, 1, whiteKeyMat, 'key_backslash');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, r2Z, 1, 1, darkKeyMat, `key_nav_r2_${i}`);
  for (let i = 0; i < 3; i++) addKey(18.5 + i, r2Z, 1, 1, whiteKeyMat, `key_num_789_${i}`);
  addKey(21.5, r2Z + 0.5 * U, 1, 2, darkKeyMat, 'key_num_plus');

  // Row 3: ASDF
  const r3Z = r2Z + U;
  addKey(0, r3Z, 1.75, 1, darkKeyMat, 'key_caps');
  for (let i = 0; i < 11; i++) addKey(1.75 + i, r3Z, 1, 1, whiteKeyMat, `key_asd_${i}`);
  addKey(12.75, r3Z, 2.25, 1, blueKeyMat, 'key_enter');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, r3Z, 1, 1, whiteKeyMat, `key_num_456_${i}`);

  // Row 4: ZXCV
  const r4Z = r3Z + U;
  addKey(0, r4Z, 2.25, 1, darkKeyMat, 'key_lshift');
  for (let i = 0; i < 10; i++) addKey(2.25 + i, r4Z, 1, 1, whiteKeyMat, `key_zxc_${i}`);
  addKey(12.25, r4Z, 2.75, 1, darkKeyMat, 'key_rshift');
  addKey(16.25, r4Z, 1, 1, darkKeyMat, 'key_arrow_up');
  for (let i = 0; i < 3; i++) addKey(18.5 + i, r4Z, 1, 1, whiteKeyMat, `key_num_123_${i}`);
  addKey(21.5, r4Z + 0.5 * U, 1, 2, blueKeyMat, 'key_num_enter');

  // Row 5: Bottom row
  const r5Z = r4Z + U;
  addKey(0, r5Z, 1.25, 1, darkKeyMat, 'key_lctrl');
  addKey(1.25, r5Z, 1.25, 1, darkKeyMat, 'key_lwin');
  addKey(2.5, r5Z, 1.25, 1, darkKeyMat, 'key_lalt');
  addKey(3.75, r5Z, 6.25, 1, whiteKeyMat, 'key_spacebar');
  addKey(10, r5Z, 1.25, 1, darkKeyMat, 'key_ralt');
  addKey(11.25, r5Z, 1.25, 1, darkKeyMat, 'key_fn');
  addKey(12.5, r5Z, 1.25, 1, darkKeyMat, 'key_rwin');
  addKey(13.75, r5Z, 1.25, 1, darkKeyMat, 'key_rctrl');
  for (let i = 0; i < 3; i++) addKey(15.25 + i, r5Z, 1, 1, darkKeyMat, `key_arrow_bot_${i}`);
  addKey(18.5, r5Z, 2, 1, whiteKeyMat, 'key_num_0');
  addKey(20.5, r5Z, 1, 1, whiteKeyMat, 'key_num_dot');

  // Coiled Yellow USB Cable
  const cablePlugX = -0.14;
  const cablePlugZ = -D / 2;
  const cablePlugY = 0.018;

  // Strain relief at keyboard back
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0055, 0.022, 16), cableMat);
  relief.name = 'cable_strain_relief';
  relief.rotation.x = Math.PI / 2;
  relief.position.set(cablePlugX, cablePlugY, cablePlugZ - 0.011);
  relief.castShadow = true;
  relief.receiveShadow = true;
  group.add(relief);

  // Coiled cable curve
  const pts = [];
  pts.push(new THREE.Vector3(cablePlugX, cablePlugY, cablePlugZ - 0.02));
  pts.push(new THREE.Vector3(cablePlugX - 0.02, 0.008, cablePlugZ - 0.06));

  // Helix coil
  const coilStart = new THREE.Vector3(cablePlugX - 0.03, 0.011, cablePlugZ - 0.075);
  const coilEnd = new THREE.Vector3(cablePlugX + 0.08, 0.011, cablePlugZ - 0.16);
  const coilDir = new THREE.Vector3().subVectors(coilEnd, coilStart);
  const coilLen = coilDir.length();
  coilDir.normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(coilDir, up).normalize();

  const turns = 22;
  const steps = turns * 10;
  const coilR = 0.008;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const p = new THREE.Vector3().copy(coilStart).addScaledVector(coilDir, t * coilLen);
    p.addScaledVector(side, Math.cos(angle) * coilR);
    p.addScaledVector(up, Math.sin(angle) * coilR);
    pts.push(p);
  }

  // Tail to USB-A plug
  const usbPos = new THREE.Vector3(coilEnd.x - 0.04, 0.006, coilEnd.z - 0.035);
  pts.push(usbPos);

  const cableCurve = new THREE.CatmullRomCurve3(pts);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 260, 0.0028, 8, false);
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.name = 'coiled_usb_cable';
  cableMesh.castShadow = true;
  cableMesh.receiveShadow = true;
  group.add(cableMesh);

  // USB-A Connector
  const usbGroup = new THREE.Group();
  usbGroup.position.copy(usbPos);
  usbGroup.rotation.y = Math.PI * 0.28;
  group.add(usbGroup);

  const usbBody = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.026), cableMat);
  usbBody.name = 'usb_connector_body';
  usbBody.castShadow = true;
  usbBody.receiveShadow = true;
  usbGroup.add(usbBody);

  const usbPlug = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0045, 0.012), metalMat);
  usbPlug.name = 'usb_metal_plug';
  usbPlug.position.z = -0.019;
  usbPlug.castShadow = true;
  usbPlug.receiveShadow = true;
  usbGroup.add(usbPlug);

  return group;
}
