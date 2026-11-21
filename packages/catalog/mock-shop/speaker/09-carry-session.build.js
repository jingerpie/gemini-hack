function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BASE_W = 0.27;
  const BASE_H = 0.024;
  const BASE_D = 0.135;

  const FOOT_R_TOP = 0.011;
  const FOOT_R_BOT = 0.009;
  const FOOT_H = 0.008;

  const BODY_W = 0.23;
  const BODY_H = 0.115;
  const BODY_D = 0.095;
  const BODY_R = 0.026;

  const HANDLE_H = 0.058;
  const HANDLE_W = 0.022;
  const HANDLE_THICK = 0.006;

  const BODY_Y_BOT = BASE_H + FOOT_H;
  const BODY_Y_CTR = BODY_Y_BOT + BODY_H / 2;
  const BODY_Y_TOP = BODY_Y_BOT + BODY_H;

  // Materials
  const matBase = new THREE.MeshStandardMaterial({
    color: 0x18181a,
    roughness: 0.7,
    metalness: 0.05
  });

  const matBody = new THREE.MeshStandardMaterial({
    color: 0x2c2d30,
    roughness: 0.65,
    metalness: 0.08
  });

  const matGrille = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.92,
    metalness: 0.05
  });

  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x151517,
    roughness: 0.85,
    metalness: 0.02
  });

  const matStrap = new THREE.MeshStandardMaterial({
    color: 0x35363a,
    roughness: 0.6,
    metalness: 0.05
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0xb8bcc2,
    roughness: 0.25,
    metalness: 0.85
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  // 1. Base Plinth
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
  addMesh(baseGeo, matBase, "charging_base", 0, BASE_H / 2, 0);

  // 2. Four Rubber Feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R_TOP, FOOT_R_BOT, FOOT_H, 20);
  const footX = BODY_W * 0.34;
  const footZ = BODY_D * 0.28;
  const footY = BASE_H + FOOT_H / 2;
  addMesh(footGeo, matRubber, "foot_front_left", -footX, footY, footZ);
  addMesh(footGeo, matRubber, "foot_front_right", footX, footY, footZ);
  addMesh(footGeo, matRubber, "foot_back_left", -footX, footY, -footZ);
  addMesh(footGeo, matRubber, "foot_back_right", footX, footY, -footZ);

  // 3. Speaker Main Body (rounded-rect extruded along X)
  const bodyShape = makeRoundedRectShape(BODY_D - 0.012, BODY_H - 0.012, BODY_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_W - 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 4,
    curveSegments: 16
  });
  bodyGeo.center();
  addMesh(bodyGeo, matBody, "speaker_body", 0, BODY_Y_CTR, 0, 0, Math.PI / 2, 0);

  // 4. Front Speaker Grille
  const grilleW = BODY_W - 0.024;
  const grilleH = BODY_H - 0.022;
  const grilleShape = makeRoundedRectShape(grilleW, grilleH, BODY_R * 0.75);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12
  });
  grilleGeo.center();
  addMesh(grilleGeo, matGrille, "front_grille", 0, BODY_Y_CTR, BODY_D / 2 - 0.001);

  // 5. Side Passive Radiators (Left & Right)
  const radRingGeo = new THREE.TorusGeometry(0.024, 0.0045, 12, 24);
  const radCapGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.004, 24);
  const sideX = BODY_W / 2 - 0.001;

  addMesh(radRingGeo, matRubber, "passive_radiator_ring_right", sideX, BODY_Y_CTR, 0, 0, Math.PI / 2, 0);
  addMesh(radCapGeo, matBody, "passive_radiator_cap_right", sideX - 0.001, BODY_Y_CTR, 0, 0, 0, Math.PI / 2);

  addMesh(radRingGeo, matRubber, "passive_radiator_ring_left", -sideX, BODY_Y_CTR, 0, 0, Math.PI / 2, 0);
  addMesh(radCapGeo, matBody, "passive_radiator_cap_left", -sideX + 0.001, BODY_Y_CTR, 0, 0, 0, Math.PI / 2);

  // 6. Top Control Buttons
  const btnY = BODY_Y_TOP + 0.0015;
  const btnDiscGeo = new THREE.CylinderGeometry(0.0085, 0.009, 0.003, 20);
  addMesh(btnDiscGeo, matBody, "button_power", -0.052, btnY, 0);
  addMesh(btnDiscGeo, matBody, "button_bluetooth", -0.022, btnY, 0);

  const minusGeo = new THREE.BoxGeometry(0.016, 0.003, 0.0035);
  addMesh(minusGeo, matBody, "button_volume_down", 0.014, btnY, 0);

  const plusHGeo = new THREE.BoxGeometry(0.016, 0.003, 0.0035);
  const plusVGeo = new THREE.BoxGeometry(0.0035, 0.003, 0.016);
  addMesh(plusHGeo, matBody, "button_volume_up_h", 0.048, btnY, 0);
  addMesh(plusVGeo, matBody, "button_volume_up_v", 0.048, btnY, 0);

  // 7. Carry Handle Strap
  const strapSpan = BODY_W * 0.78;
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-strapSpan / 2, BODY_Y_TOP - 0.006, 0),
    new THREE.Vector3(-strapSpan * 0.42, BODY_Y_TOP + HANDLE_H * 0.72, 0),
    new THREE.Vector3(0, BODY_Y_TOP + HANDLE_H, 0),
    new THREE.Vector3(strapSpan * 0.42, BODY_Y_TOP + HANDLE_H * 0.72, 0),
    new THREE.Vector3(strapSpan / 2, BODY_Y_TOP - 0.006, 0)
  ]);
  const strapGeo = new THREE.TubeGeometry(strapCurve, 28, HANDLE_THICK / 2, 10, false);
  const strapMesh = addMesh(strapGeo, matStrap, "carry_handle_strap");
  strapMesh.scale.set(1, 1, HANDLE_W / HANDLE_THICK);

  // 8. USB-C Cable & Connector
  const portX = BODY_W / 2;
  const portY = BODY_Y_BOT + 0.018;
  const portZ = 0.012;

  const bootGeo = new THREE.CylinderGeometry(0.0045, 0.0055, 0.016, 12);
  addMesh(bootGeo, matRubber, "usbc_port_boot", portX + 0.007, portY, portZ, 0, 0, Math.PI / 2);

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(portX + 0.014, portY, portZ),
    new THREE.Vector3(portX + 0.045, portY - 0.006, portZ + 0.015),
    new THREE.Vector3(portX + 0.055, 0.004, 0.065),
    new THREE.Vector3(0.09, 0.003, 0.115),
    new THREE.Vector3(-0.02, 0.003, 0.125),
    new THREE.Vector3(-0.085, 0.004, 0.11)
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 32, 0.0024, 8, false);
  addMesh(cableGeo, matRubber, "usbc_cable");

  const plugBodyGeo = new THREE.BoxGeometry(0.022, 0.007, 0.012);
  addMesh(plugBodyGeo, matBody, "usbc_plug_housing", -0.096, 0.0045, 0.107, 0, -0.25, 0);

  const plugTipGeo = new THREE.BoxGeometry(0.008, 0.0035, 0.0085);
  addMesh(plugTipGeo, matMetal, "usbc_plug_tip", -0.11, 0.0045, 0.103, 0, -0.25, 0);

  return group;
}
