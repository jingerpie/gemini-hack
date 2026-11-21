function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.70;
  const TOP_R = 0.32;
  const TOP_THICK = 0.024;
  const LEG_H = 0.21;
  const LEG_SPREAD = 0.25;
  const HUB_R = 0.042;
  const HUB_H = 0.095;
  const HUB_Y = LEG_H - HUB_H * 0.55;
  const COL_BOTTOM_Y = HUB_Y + HUB_H * 0.45;
  const CLEAT_H = 0.024;
  const COL_TOP_Y = H - TOP_THICK - CLEAT_H;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x46291a,
    roughness: 0.38,
    metalness: 0.04
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x351e12,
    roughness: 0.5,
    metalness: 0.04
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8b734b,
    roughness: 0.42,
    metalness: 0.78
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

  // 1. Tabletop (LatheGeometry for subtle rounded edge profile)
  const topProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(TOP_R - 0.008, 0),
    new THREE.Vector2(TOP_R, 0.005),
    new THREE.Vector2(TOP_R, TOP_THICK - 0.005),
    new THREE.Vector2(TOP_R - 0.006, TOP_THICK),
    new THREE.Vector2(0, TOP_THICK)
  ];
  const topGeo = new THREE.LatheGeometry(topProfile, 32);
  addMesh(topGeo, woodMat, 'tabletop', [0, H - TOP_THICK, 0]);

  // 2. Under-top tilt cleats & hinge block
  const cleatLen = TOP_R * 1.15;
  const cleatGeo = new THREE.BoxGeometry(0.028, CLEAT_H, cleatLen);
  addMesh(cleatGeo, darkWoodMat, 'tilt_cleat_left', [-0.055, H - TOP_THICK - CLEAT_H / 2, 0]);
  addMesh(cleatGeo, darkWoodMat, 'tilt_cleat_right', [0.055, H - TOP_THICK - CLEAT_H / 2, 0]);

  const blockGeo = new THREE.BoxGeometry(0.11, CLEAT_H * 0.9, 0.11);
  addMesh(blockGeo, darkWoodMat, 'tilt_hinge_block', [0, H - TOP_THICK - CLEAT_H * 0.45, 0]);

  // 3. Brass tilt latch on the left (-X) side
  const latchPlateGeo = new THREE.BoxGeometry(0.025, 0.006, 0.035);
  addMesh(latchPlateGeo, brassMat, 'tilt_latch_plate', [-0.085, H - TOP_THICK - 0.003, 0]);

  const latchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.085, H - TOP_THICK - 0.006, 0),
    new THREE.Vector3(-0.095, H - TOP_THICK - 0.025, 0),
    new THREE.Vector3(-0.102, H - TOP_THICK - 0.048, 0),
    new THREE.Vector3(-0.116, H - TOP_THICK - 0.050, 0)
  ]);
  const latchLeverGeo = new THREE.TubeGeometry(latchCurve, 12, 0.0045, 8, false);
  addMesh(latchLeverGeo, brassMat, 'tilt_latch_lever');

  // 4. Turned Pedestal Column (LatheGeometry)
  const colH = COL_TOP_Y - COL_BOTTOM_Y;
  const colPts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.040, 0),
    new THREE.Vector2(0.044, colH * 0.04),
    new THREE.Vector2(0.032, colH * 0.08),
    new THREE.Vector2(0.038, colH * 0.11),
    new THREE.Vector2(0.028, colH * 0.15),
    new THREE.Vector2(0.044, colH * 0.28),
    new THREE.Vector2(0.046, colH * 0.40),
    new THREE.Vector2(0.036, colH * 0.58),
    new THREE.Vector2(0.029, colH * 0.78),
    new THREE.Vector2(0.036, colH * 0.84),
    new THREE.Vector2(0.028, colH * 0.88),
    new THREE.Vector2(0.042, colH * 0.94),
    new THREE.Vector2(0.044, colH),
    new THREE.Vector2(0.001, colH)
  ];
  const colGeo = new THREE.LatheGeometry(colPts, 28);
  addMesh(colGeo, woodMat, 'pedestal_column', [0, COL_BOTTOM_Y, 0]);

  // 5. Central Hub at bottom of column
  const hubGeo = new THREE.CylinderGeometry(HUB_R, HUB_R * 0.92, HUB_H, 20);
  addMesh(hubGeo, woodMat, 'pedestal_base_hub', [0, HUB_Y, 0]);

  // 6. Three Cabriole Legs (120 degrees apart, one facing +Z)
  const legShape = new THREE.Shape();
  // Profile in X-Y plane: X is radial distance from center, Y is height from floor (0)
  legShape.moveTo(HUB_R * 0.7, HUB_Y + HUB_H * 0.32);
  legShape.bezierCurveTo(
    HUB_R + 0.08, HUB_Y + HUB_H * 0.30,
    HUB_R + 0.11, HUB_Y + 0.01,
    LEG_SPREAD * 0.62, 0.065
  );
  legShape.bezierCurveTo(
    LEG_SPREAD * 0.75, 0.022,
    LEG_SPREAD * 0.90, 0.026,
    LEG_SPREAD, 0.016
  );
  legShape.lineTo(LEG_SPREAD, 0.004);
  legShape.lineTo(LEG_SPREAD - 0.042, 0.002);
  legShape.bezierCurveTo(
    LEG_SPREAD * 0.74, 0.005,
    LEG_SPREAD * 0.62, 0.025,
    LEG_SPREAD * 0.48, 0.085
  );
  legShape.bezierCurveTo(
    HUB_R + 0.065, HUB_Y - 0.01,
    HUB_R + 0.04, HUB_Y - HUB_H * 0.25,
    HUB_R * 0.7, HUB_Y - HUB_H * 0.35
  );
  legShape.closePath();

  const legExtrudeSettings = {
    depth: 0.024,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.005,
    bevelThickness: 0.005
  };
  const legGeo = new THREE.ExtrudeGeometry(legShape, legExtrudeSettings);
  // Center the extrusion thickness on Z=0
  legGeo.translate(0, 0, -0.012);

  for (let i = 0; i < 3; i++) {
    // Angle so leg 0 points along +Z (rotate Y by -PI/2 puts +X along +Z)
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    const legMesh = addMesh(legGeo, woodMat, `cabriole_leg_${i + 1}`, [0, 0, 0], [0, angle, 0]);

    // Small foot pad at the tip of each leg touching y = 0
    const footGeo = new THREE.CylinderGeometry(0.018, 0.020, 0.008, 12);
    const fx = Math.cos(angle) * (LEG_SPREAD - 0.018);
    const fz = -Math.sin(angle) * (LEG_SPREAD - 0.018);
    addMesh(footGeo, darkWoodMat, `leg_foot_pad_${i + 1}`, [fx, 0.004, fz]);
    void legMesh;
  }

  return group;
}
