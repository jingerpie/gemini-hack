function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BODY_R = 0.082;
  const BODY_H = 0.105;
  const LID_R = 0.056;
  const HANDLE_H = 0.195;
  const HANDLE_W = 0.148;
  const HANDLE_THICK = 0.005;
  const HANDLE_DEPTH = 0.011;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8cacb,
    metalness: 0.85,
    roughness: 0.28
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d40,
    metalness: 0.7,
    roughness: 0.5
  });

  const oliveMat = new THREE.MeshStandardMaterial({
    color: 0x5c6638,
    metalness: 0.05,
    roughness: 0.72
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

  // 1. Main Kettle Body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BODY_R - 0.012, 0.0),
    new THREE.Vector2(BODY_R - 0.004, 0.003),
    new THREE.Vector2(BODY_R, 0.012),
    new THREE.Vector2(BODY_R, 0.062),
    new THREE.Vector2(BODY_R - 0.005, 0.076),
    new THREE.Vector2(BODY_R - 0.015, 0.088),
    new THREE.Vector2(LID_R + 0.003, 0.098),
    new THREE.Vector2(LID_R + 0.004, 0.102),
    new THREE.Vector2(LID_R - 0.002, 0.102)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  addMesh(bodyGeo, steelMat, 'kettle_body');

  // Rim ring around lid opening
  const rimGeo = new THREE.TorusGeometry(LID_R + 0.001, 0.0022, 10, 32);
  addMesh(rimGeo, steelMat, 'body_top_rim', [0, 0.101, 0], [Math.PI / 2, 0, 0]);

  // 2. Spout (on -X side, angled up and out)
  const spoutBaseX = -BODY_R + 0.006;
  const spoutBaseY = 0.076;
  const spoutAngle = 0.78; // ~45 deg

  const spoutGeo = new THREE.CylinderGeometry(0.011, 0.016, 0.036, 24);
  addMesh(
    spoutGeo,
    steelMat,
    'spout_tube',
    [spoutBaseX - 0.011, spoutBaseY + 0.012, 0],
    [0, 0, spoutAngle]
  );

  // Spout base collar
  const spoutCollarGeo = new THREE.TorusGeometry(0.015, 0.0025, 10, 24);
  addMesh(
    spoutCollarGeo,
    steelMat,
    'spout_collar',
    [spoutBaseX - 0.001, spoutBaseY + 0.001, 0],
    [0, Math.PI / 2, spoutAngle - Math.PI / 2]
  );

  // Spout dark interior
  const spoutInnerGeo = new THREE.CylinderGeometry(0.0095, 0.011, 0.012, 20);
  addMesh(
    spoutInnerGeo,
    darkSteelMat,
    'spout_interior',
    [spoutBaseX - 0.020, spoutBaseY + 0.021, 0],
    [0, 0, spoutAngle]
  );

  // 3. Lid
  const lidPoints = [
    new THREE.Vector2(0.0, 0.111),
    new THREE.Vector2(0.022, 0.110),
    new THREE.Vector2(0.042, 0.107),
    new THREE.Vector2(LID_R - 0.002, 0.103),
    new THREE.Vector2(LID_R, 0.101)
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  addMesh(lidGeo, steelMat, 'kettle_lid');

  // Lid knob base (olive)
  const knobBaseGeo = new THREE.CylinderGeometry(0.016, 0.017, 0.004, 24);
  addMesh(knobBaseGeo, oliveMat, 'lid_knob_base', [0, 0.111, 0]);

  // Lid knob vertical tab (olive)
  const knobTabGeo = new THREE.BoxGeometry(0.020, 0.016, 0.009);
  addMesh(knobTabGeo, oliveMat, 'lid_knob_tab', [0, 0.119, 0]);

  const knobTopGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.020, 16);
  addMesh(knobTopGeo, oliveMat, 'lid_knob_top', [0, 0.127, 0], [0, 0, Math.PI / 2]);

  // 4. Handle Brackets & Rivets (-X and +X)
  const bracketX = HANDLE_W / 2 - 0.002;
  const bracketY = 0.095;

  for (let i = 0; i < 2; i++) {
    const sign = i === 0 ? -1 : 1;
    const side = i === 0 ? 'left' : 'right';

    const bracketGeo = new THREE.BoxGeometry(0.005, 0.022, 0.015);
    addMesh(
      bracketGeo,
      steelMat,
      `handle_bracket_${side}`,
      [sign * bracketX, bracketY, 0],
      [0, 0, sign * -0.18]
    );

    const rivetGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.008, 12);
    addMesh(
      rivetGeo,
      steelMat,
      `handle_rivet_${side}`,
      [sign * (bracketX + 0.001), bracketY + 0.005, 0],
      [0, 0, Math.PI / 2]
    );
  }

  // 5. Bail Handle (upright U-shape)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-HANDLE_W / 2, bracketY + 0.004, 0),
    new THREE.Vector3(-HANDLE_W / 2, HANDLE_H - 0.022, 0),
    new THREE.Vector3(-HANDLE_W / 2 + 0.012, HANDLE_H - 0.004, 0),
    new THREE.Vector3(0, HANDLE_H, 0),
    new THREE.Vector3(HANDLE_W / 2 - 0.012, HANDLE_H - 0.004, 0),
    new THREE.Vector3(HANDLE_W / 2, HANDLE_H - 0.022, 0),
    new THREE.Vector3(HANDLE_W / 2, bracketY + 0.004, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 32, HANDLE_THICK, 12, false);
  const handleMesh = addMesh(handleGeo, steelMat, 'bail_handle');
  handleMesh.scale.set(1, 1, HANDLE_DEPTH / (HANDLE_THICK * 2));

  // 6. Olive Silicone Handle Sleeves
  // Top horizontal grip
  const topGripGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.105, 20);
  addMesh(topGripGeo, oliveMat, 'handle_top_grip', [0, HANDLE_H - 0.001, 0], [0, 0, Math.PI / 2]);

  // Right vertical grip
  const sideGripGeo = new THREE.CylinderGeometry(0.0072, 0.0072, 0.042, 20);
  addMesh(sideGripGeo, oliveMat, 'handle_side_grip', [HANDLE_W / 2, HANDLE_H - 0.046, 0]);

  return group;
}
