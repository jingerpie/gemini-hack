function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const CARAFE_R = 0.052;
  const CARAFE_WALL = 0.0025;
  const CARAFE_H = 0.165;
  const BASE_R = 0.068;
  const BASE_H = 0.018;
  const FRAME_R = CARAFE_R + 0.0022;
  const BAND_BOTTOM_H = 0.024;
  const BAND_TOP_Y = 0.126;
  const BAND_TOP_H = 0.020;
  const LID_Y = 0.165;
  const KNOB_TOP_Y = 0.208;
  const PLUNGER_Y = 0.046;

  // Shared materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8c8cc,
    metalness: 0.85,
    roughness: 0.28,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.6,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Flared stainless steel base (y = 0 to BASE_H)
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R, 0.003),
    new THREE.Vector2(BASE_R - 0.003, 0.007),
    new THREE.Vector2(FRAME_R + 0.002, BASE_H),
    new THREE.Vector2(0.0, BASE_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(baseGeo, steelMat, 'steel_base');

  // 2. Bottom frame band
  const bottomBandGeo = new THREE.CylinderGeometry(
    FRAME_R,
    FRAME_R,
    BAND_BOTTOM_H,
    32,
    1,
    true
  );
  const bottomBand = addMesh(bottomBandGeo, steelMat, 'frame_bottom_band');
  bottomBand.position.y = BASE_H + BAND_BOTTOM_H / 2;

  // 3. Top frame band
  const topBandGeo = new THREE.CylinderGeometry(
    FRAME_R,
    FRAME_R,
    BAND_TOP_H,
    32,
    1,
    true
  );
  const topBand = addMesh(topBandGeo, steelMat, 'frame_top_band');
  topBand.position.y = BAND_TOP_Y + BAND_TOP_H / 2;

  // 4. Four vertical frame struts
  const strutH = BAND_TOP_Y - (BASE_H + BAND_BOTTOM_H) + 0.004;
  const strutGeo = new THREE.BoxGeometry(0.011, strutH, 0.0025);
  const strutAngles = [
    Math.PI * 0.25,
    Math.PI * 0.75,
    Math.PI * 1.25,
    Math.PI * 1.75,
  ];
  strutAngles.forEach((angle, idx) => {
    const strut = addMesh(strutGeo, steelMat, `frame_strut_${idx + 1}`);
    const r = FRAME_R - 0.0005;
    strut.position.set(
      Math.cos(angle) * r,
      BASE_H + BAND_BOTTOM_H + strutH / 2 - 0.002,
      Math.sin(angle) * r
    );
    strut.rotation.y = -angle + Math.PI / 2;
  });

  // 5. Glass carafe (hollow cylinder with bottom)
  const carafePoints = [
    new THREE.Vector2(0.0, BASE_H),
    new THREE.Vector2(CARAFE_R, BASE_H),
    new THREE.Vector2(CARAFE_R, CARAFE_H),
    new THREE.Vector2(CARAFE_R - CARAFE_WALL, CARAFE_H),
    new THREE.Vector2(CARAFE_R - CARAFE_WALL, BASE_H + CARAFE_WALL),
    new THREE.Vector2(0.0, BASE_H + CARAFE_WALL),
  ];
  const carafeGeo = new THREE.LatheGeometry(carafePoints, 32);
  addMesh(carafeGeo, glassMat, 'glass_carafe');

  // 6. Glass pour spout at -X
  const spoutGeo = new THREE.ConeGeometry(0.009, 0.018, 16, 1, true);
  const spout = addMesh(spoutGeo, glassMat, 'glass_spout');
  spout.position.set(-CARAFE_R - 0.005, CARAFE_H - 0.008, 0);
  spout.rotation.z = Math.PI * 0.35;

  // 7. Stainless steel handle on +X side
  const handleShape = new THREE.Shape();
  handleShape.moveTo(FRAME_R - 0.002, BAND_TOP_Y + 0.014);
  handleShape.lineTo(FRAME_R + 0.046, BAND_TOP_Y + 0.014);
  handleShape.quadraticCurveTo(
    FRAME_R + 0.054,
    BAND_TOP_Y + 0.014,
    FRAME_R + 0.054,
    BAND_TOP_Y + 0.004
  );
  handleShape.lineTo(FRAME_R + 0.052, 0.072);
  handleShape.quadraticCurveTo(
    FRAME_R + 0.051,
    0.064,
    FRAME_R + 0.044,
    0.057
  );
  handleShape.lineTo(FRAME_R - 0.002, 0.024);
  handleShape.lineTo(FRAME_R - 0.002, 0.032);
  handleShape.lineTo(FRAME_R + 0.040, 0.062);
  handleShape.quadraticCurveTo(
    FRAME_R + 0.045,
    0.067,
    FRAME_R + 0.046,
    0.074
  );
  handleShape.lineTo(FRAME_R + 0.048, BAND_TOP_Y + 0.003);
  handleShape.quadraticCurveTo(
    FRAME_R + 0.048,
    BAND_TOP_Y + 0.008,
    FRAME_R + 0.042,
    BAND_TOP_Y + 0.008
  );
  handleShape.lineTo(FRAME_R - 0.002, BAND_TOP_Y + 0.008);
  handleShape.closePath();

  const handleDepth = 0.014;
  const handleGeo = new THREE.ExtrudeGeometry(handleShape, {
    depth: handleDepth,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
  });
  handleGeo.translate(0, 0, -handleDepth / 2);
  addMesh(handleGeo, steelMat, 'steel_handle');

  // 8. Dark inner lid gasket / filter collar
  const gasketGeo = new THREE.CylinderGeometry(
    CARAFE_R - 0.003,
    CARAFE_R - 0.004,
    0.014,
    32
  );
  const gasket = addMesh(gasketGeo, darkMat, 'lid_gasket');
  gasket.position.y = LID_Y - 0.007;

  // 9. Stainless steel lid cap
  const lidPoints = [
    new THREE.Vector2(0.0, LID_Y),
    new THREE.Vector2(CARAFE_R + 0.004, LID_Y),
    new THREE.Vector2(CARAFE_R + 0.004, LID_Y + 0.009),
    new THREE.Vector2(CARAFE_R + 0.001, LID_Y + 0.012),
    new THREE.Vector2(0.006, LID_Y + 0.014),
    new THREE.Vector2(0.0, LID_Y + 0.014),
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  addMesh(lidGeo, steelMat, 'steel_lid');

  // 10. Plunger rod
  const rodH = KNOB_TOP_Y - 0.012 - PLUNGER_Y;
  const rodGeo = new THREE.CylinderGeometry(0.0028, 0.0028, rodH, 16);
  const rod = addMesh(rodGeo, steelMat, 'plunger_rod');
  rod.position.y = PLUNGER_Y + rodH / 2;

  // 11. Plunger knob neck
  const neckGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.014, 16);
  const neck = addMesh(neckGeo, steelMat, 'plunger_knob_neck');
  neck.position.y = LID_Y + 0.020;

  // 12. Plunger knob cap
  const knobGeo = new THREE.CylinderGeometry(0.018, 0.017, 0.010, 24);
  const knob = addMesh(knobGeo, steelMat, 'plunger_knob');
  knob.position.y = KNOB_TOP_Y - 0.005;

  // 13. Plunger filter plate
  const filterPlateGeo = new THREE.CylinderGeometry(
    CARAFE_R - 0.006,
    CARAFE_R - 0.006,
    0.003,
    24
  );
  const filterPlate = addMesh(filterPlateGeo, steelMat, 'filter_plate');
  filterPlate.position.y = PLUNGER_Y;

  // 14. Plunger spiral mesh ring
  const filterRingGeo = new THREE.TorusGeometry(
    CARAFE_R - 0.006,
    0.0035,
    12,
    28
  );
  const filterRing = addMesh(filterRingGeo, steelMat, 'filter_mesh_ring');
  filterRing.rotation.x = Math.PI / 2;
  filterRing.position.y = PLUNGER_Y;

  // 15. Plunger center nut
  const nutGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.012, 16);
  const nut = addMesh(nutGeo, steelMat, 'filter_center_nut');
  nut.position.y = PLUNGER_Y + 0.005;

  return group;
}
