function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.22;
  const H = 0.14;
  const D = 0.046;
  const CORNER_R = 0.036;
  const BEVEL = 0.01;
  const GRILLE_W = 0.168;
  const GRILLE_H = 0.096;
  const GRILLE_R = 0.024;
  const CABLE_R = 0.0022;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x367a82,
    roughness: 0.88,
    metalness: 0.02
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x28636b,
    roughness: 0.52,
    metalness: 0.05
  });
  const darkInnerMat = new THREE.MeshStandardMaterial({
    color: 0x15363b,
    roughness: 0.9,
    metalness: 0.05
  });
  const zipperMat = new THREE.MeshStandardMaterial({
    color: 0x24565c,
    roughness: 0.72,
    metalness: 0.08
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x2f7078,
    roughness: 0.42,
    metalness: 0.04
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d7d9,
    roughness: 0.2,
    metalness: 0.92
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.5,
    metalness: 0.1
  });

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

  const bodyCenterY = H / 2;

  // 1. Main fabric-covered pillow speaker body
  const bodyShape = makeRoundedRectShape(W - BEVEL * 2, H - BEVEL * 2, CORNER_R - BEVEL);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: D - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 6,
    curveSegments: 16
  });
  bodyGeo.center();
  addMesh(bodyGeo, fabricMat, 'speaker_body', [0, bodyCenterY, 0]);

  // 2. Zipper seam / piping around the perimeter
  const seamShape = makeRoundedRectShape(W + 0.001, H + 0.001, CORNER_R);
  const seamGeo = new THREE.ExtrudeGeometry(seamShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 2,
    curveSegments: 16
  });
  seamGeo.center();
  addMesh(seamGeo, zipperMat, 'zipper_seam', [0, bodyCenterY, -0.004]);

  // 3. Zipper pull tab at bottom-right
  const pullGeo = new THREE.BoxGeometry(0.012, 0.006, 0.004);
  addMesh(pullGeo, zipperMat, 'zipper_pull', [W * 0.28, 0.004, -0.004], [0, 0, -0.15]);

  // 4. Recessed dark inner backing behind grille
  const innerShape = makeRoundedRectShape(GRILLE_W - 0.004, GRILLE_H - 0.004, GRILLE_R - 0.002);
  const innerGeo = new THREE.ExtrudeGeometry(innerShape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 12
  });
  innerGeo.center();
  addMesh(innerGeo, darkInnerMat, 'grille_backing', [0, bodyCenterY, D / 2 - 0.002]);

  // 5. Front perforated-style grille plate
  const grilleShape = makeRoundedRectShape(GRILLE_W, GRILLE_H, GRILLE_R);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 3,
    curveSegments: 14
  });
  grilleGeo.center();
  addMesh(grilleGeo, grilleMat, 'front_grille', [0, bodyCenterY, D / 2 - 0.0005]);

  // 6. Subtle internal speaker driver rings visible on grille
  const driverRingGeo = new THREE.TorusGeometry(0.026, 0.0015, 8, 24);
  addMesh(driverRingGeo, darkInnerMat, 'left_driver_ring', [-0.042, bodyCenterY, D / 2 + 0.001]);
  addMesh(driverRingGeo, darkInnerMat, 'right_driver_ring', [0.042, bodyCenterY, D / 2 + 0.001]);

  // 7. Coiled audio cable resting on y = 0 in front-right
  const coilCenterX = 0.065;
  const coilCenterZ = 0.048;
  const coilPoints1 = [];
  const coilPoints2 = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rx = 0.042;
    const rz = 0.022;
    coilPoints1.push(new THREE.Vector3(
      coilCenterX + Math.cos(t) * rx,
      CABLE_R,
      coilCenterZ + Math.sin(t) * rz
    ));
    coilPoints2.push(new THREE.Vector3(
      coilCenterX + Math.cos(t) * (rx - 0.005),
      CABLE_R * 2.5,
      coilCenterZ + Math.sin(t) * (rz - 0.004)
    ));
  }
  const coilCurve1 = new THREE.CatmullRomCurve3(coilPoints1, true);
  const coilGeo1 = new THREE.TubeGeometry(coilCurve1, 32, CABLE_R, 8, true);
  addMesh(coilGeo1, cableMat, 'cable_coil_lower');

  const coilCurve2 = new THREE.CatmullRomCurve3(coilPoints2, true);
  const coilGeo2 = new THREE.TubeGeometry(coilCurve2, 32, CABLE_R, 8, true);
  addMesh(coilGeo2, cableMat, 'cable_coil_upper');

  // Cable lead from speaker bottom-right to coil
  const leadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W * 0.32, 0.006, 0),
    new THREE.Vector3(W * 0.42, CABLE_R, 0.018),
    new THREE.Vector3(coilCenterX + 0.038, CABLE_R, coilCenterZ - 0.01)
  ]);
  const leadGeo = new THREE.TubeGeometry(leadCurve, 16, CABLE_R, 8, false);
  addMesh(leadGeo, cableMat, 'cable_lead_to_speaker');

  // Cable lead from coil to 3.5mm plug
  const plugLeadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(coilCenterX - 0.038, CABLE_R, coilCenterZ + 0.008),
    new THREE.Vector3(0.005, CABLE_R, 0.058),
    new THREE.Vector3(-0.025, 0.004, 0.062)
  ]);
  const plugLeadGeo = new THREE.TubeGeometry(plugLeadCurve, 12, CABLE_R, 8, false);
  addMesh(plugLeadGeo, cableMat, 'cable_lead_to_plug');

  // 8. Inline volume control housing
  const ctrlShape = makeRoundedRectShape(0.034, 0.012, 0.005);
  const ctrlGeo = new THREE.ExtrudeGeometry(ctrlShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 8
  });
  ctrlGeo.center();
  addMesh(ctrlGeo, cableMat, 'volume_control_housing', [coilCenterX, 0.007, coilCenterZ + 0.018], [Math.PI / 2, 0, 0]);

  // Volume slider wheel
  const wheelGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.01, 16);
  addMesh(wheelGeo, zipperMat, 'volume_slider_wheel', [coilCenterX, 0.01, coilCenterZ + 0.018], [Math.PI / 2, 0, 0]);

  // 9. 3.5mm Audio Jack Plug (pointing -X at front-left)
  const plugY = 0.0045;
  const plugZ = 0.062;

  const bootGeo = new THREE.CylinderGeometry(0.0038, 0.0032, 0.018, 12);
  addMesh(bootGeo, cableMat, 'jack_strain_relief', [-0.034, plugY, plugZ], [0, 0, Math.PI / 2]);

  const collarGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.006, 12);
  addMesh(collarGeo, metalMat, 'jack_collar', [-0.046, plugY, plugZ], [0, 0, Math.PI / 2]);

  const shaftGeo = new THREE.CylinderGeometry(0.0017, 0.0017, 0.015, 12);
  addMesh(shaftGeo, metalMat, 'jack_metal_shaft', [-0.0565, plugY, plugZ], [0, 0, Math.PI / 2]);

  const ringGeo = new THREE.CylinderGeometry(0.00175, 0.00175, 0.0012, 12);
  addMesh(ringGeo, blackMat, 'jack_insulator_ring_1', [-0.054, plugY, plugZ], [0, 0, Math.PI / 2]);
  addMesh(ringGeo, blackMat, 'jack_insulator_ring_2', [-0.059, plugY, plugZ], [0, 0, Math.PI / 2]);

  const tipGeo = new THREE.SphereGeometry(0.0018, 10, 10);
  addMesh(tipGeo, metalMat, 'jack_tip', [-0.0645, plugY, plugZ]);

  return group;
}
