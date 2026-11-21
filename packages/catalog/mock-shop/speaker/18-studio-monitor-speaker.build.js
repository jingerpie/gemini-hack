function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.21;
  const H = 0.34;
  const D = 0.25;
  const PAD_H = 0.006;
  const CAB_H = H - PAD_H;
  const BEVEL = 0.008;
  const CORNER_R = 0.012;

  const TWEETER_Y = PAD_H + CAB_H * 0.77;
  const TWEETER_R = 0.044;
  const WOOFER_Y = PAD_H + CAB_H * 0.41;
  const WOOFER_R = 0.078;
  const PORT_Y = PAD_H + CAB_H * 0.095;
  const PORT_W = 0.105;
  const PORT_H = 0.024;

  const FRONT_Z = D / 2;

  // Materials
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3f,
    roughness: 0.62,
    metalness: 0.06,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e30,
    roughness: 0.5,
    metalness: 0.1,
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1b1c,
    roughness: 0.78,
    metalness: 0.02,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9a35a,
    roughness: 0.34,
    metalness: 0.68,
  });
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x151617,
    roughness: 0.4,
    metalness: 0.5,
  });
  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x09090a,
    roughness: 0.95,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  // 1. Bottom isolation pad
  const padGeo = new THREE.BoxGeometry(W * 0.84, PAD_H, D * 0.86);
  addMesh(padGeo, rubberMat, 'isolation_pad', 0, PAD_H / 2, 0);

  // 2. Main cabinet (rounded box via ExtrudeGeometry)
  const cabShape = makeRoundedRectShape(W - BEVEL * 2, CAB_H - BEVEL * 2, CORNER_R);
  const cabGeo = new THREE.ExtrudeGeometry(cabShape, {
    depth: D - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  cabGeo.translate(0, 0, -(D - BEVEL * 2) / 2);
  addMesh(cabGeo, cabinetMat, 'speaker_cabinet', 0, PAD_H + CAB_H / 2, 0);

  // 3. Tweeter faceplate
  const twPlateGeo = new THREE.CylinderGeometry(TWEETER_R, TWEETER_R, 0.004, 32);
  addMesh(twPlateGeo, trimMat, 'tweeter_faceplate', 0, TWEETER_Y, FRONT_Z - 0.001, Math.PI / 2);

  // 4. Tweeter inner waveguide ring
  const twRingGeo = new THREE.TorusGeometry(0.021, 0.0045, 16, 32);
  addMesh(twRingGeo, rubberMat, 'tweeter_waveguide', 0, TWEETER_Y, FRONT_Z + 0.001);

  // 5. Tweeter gold dome
  const twDomeGeo = new THREE.SphereGeometry(0.017, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  addMesh(twDomeGeo, goldMat, 'tweeter_dome', 0, TWEETER_Y, FRONT_Z - 0.001, Math.PI / 2);

  // 6. Tweeter mounting screws (4x)
  const screwGeo = new THREE.CylinderGeometry(0.0024, 0.0024, 0.002, 12);
  const screwDist = TWEETER_R * 0.72;
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 4) + i * (Math.PI / 2);
    const sx = Math.cos(angle) * screwDist;
    const sy = TWEETER_Y + Math.sin(angle) * screwDist;
    addMesh(screwGeo, screwMat, `tweeter_screw_${i + 1}`, sx, sy, FRONT_Z + 0.001, Math.PI / 2);
  }

  // 7. Woofer outer trim ring
  const wfTrimGeo = new THREE.TorusGeometry(WOOFER_R, 0.006, 16, 32);
  addMesh(wfTrimGeo, trimMat, 'woofer_trim_ring', 0, WOOFER_Y, FRONT_Z - 0.001);

  // 8. Woofer rubber surround
  const wfSurroundGeo = new THREE.TorusGeometry(WOOFER_R * 0.78, 0.0085, 18, 32);
  addMesh(wfSurroundGeo, rubberMat, 'woofer_surround', 0, WOOFER_Y, FRONT_Z + 0.001);

  // 9. Woofer gold cone (LatheGeometry)
  const conePts = [
    new THREE.Vector2(0.018, -0.014),
    new THREE.Vector2(0.036, -0.009),
    new THREE.Vector2(WOOFER_R * 0.72, 0.001),
  ];
  const wfConeGeo = new THREE.LatheGeometry(conePts, 32);
  addMesh(wfConeGeo, goldMat, 'woofer_cone', 0, WOOFER_Y, FRONT_Z - 0.001, Math.PI / 2);

  // 10. Woofer gold dust cap
  const wfCapGeo = new THREE.SphereGeometry(0.023, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  addMesh(wfCapGeo, goldMat, 'woofer_dust_cap', 0, WOOFER_Y, FRONT_Z - 0.012, Math.PI / 2);

  // 11. Bass reflex port bezel
  const portOuterShape = makeRoundedRectShape(PORT_W, PORT_H, PORT_H / 2);
  const portHole = makeRoundedRectShape(PORT_W - 0.01, PORT_H - 0.01, (PORT_H - 0.01) / 2);
  portOuterShape.holes.push(portHole);
  const portBezelGeo = new THREE.ExtrudeGeometry(portOuterShape, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3,
    curveSegments: 12,
  });
  addMesh(portBezelGeo, trimMat, 'bass_port_bezel', 0, PORT_Y, FRONT_Z - 0.004);

  // 12. Bass reflex port inner cavity
  const portCavityGeo = new THREE.ExtrudeGeometry(portHole, {
    depth: 0.02,
    bevelEnabled: false,
    curveSegments: 12,
  });
  addMesh(portCavityGeo, cavityMat, 'bass_port_cavity', 0, PORT_Y, FRONT_Z - 0.02);

  return group;
}
