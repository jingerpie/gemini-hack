function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale for a 1L French press)
  const BASE_R = 0.056;
  const BASE_H = 0.010;
  const COLLAR_R = 0.0515;
  const LOWER_COLLAR_H = 0.038;
  const UPPER_COLLAR_Y = 0.138;
  const UPPER_COLLAR_H = 0.022;
  const GLASS_R = 0.048;
  const GLASS_WALL = 0.0025;
  const GLASS_BOTTOM_Y = 0.014;
  const GLASS_TOP_Y = 0.178;
  const LID_Y = 0.178;
  const LID_R = 0.052;
  const LID_H = 0.012;
  const KNOB_STEM_H = 0.012;
  const KNOB_TOP_R = 0.018;
  const KNOB_TOP_H = 0.009;
  const FILTER_Y = 0.042;
  const ROD_R = 0.0028;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xebe6dc,
    roughness: 0.45,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1.0,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d2d4,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 1. Base foot
  const baseGeo = new THREE.CylinderGeometry(BASE_R * 0.97, BASE_R, BASE_H, 32);
  const baseFoot = new THREE.Mesh(baseGeo, frameMat);
  baseFoot.name = 'base_foot';
  baseFoot.position.y = BASE_H / 2;
  baseFoot.castShadow = true;
  baseFoot.receiveShadow = true;
  group.add(baseFoot);

  // 2. Lower collar
  const lowerCollarGeo = new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, LOWER_COLLAR_H, 32);
  const lowerCollar = new THREE.Mesh(lowerCollarGeo, frameMat);
  lowerCollar.name = 'lower_collar';
  lowerCollar.position.y = BASE_H + LOWER_COLLAR_H / 2 - 0.001;
  lowerCollar.castShadow = true;
  lowerCollar.receiveShadow = true;
  group.add(lowerCollar);

  // 3. Upper collar (hollow ring via LatheGeometry)
  const collarPoints = [
    new THREE.Vector2(GLASS_R + 0.0005, 0),
    new THREE.Vector2(COLLAR_R, 0),
    new THREE.Vector2(COLLAR_R, UPPER_COLLAR_H),
    new THREE.Vector2(GLASS_R + 0.0005, UPPER_COLLAR_H),
    new THREE.Vector2(GLASS_R + 0.0005, 0),
  ];
  const upperCollarGeo = new THREE.LatheGeometry(collarPoints, 32);
  const upperCollar = new THREE.Mesh(upperCollarGeo, frameMat);
  upperCollar.name = 'upper_collar';
  upperCollar.position.y = UPPER_COLLAR_Y;
  upperCollar.castShadow = true;
  upperCollar.receiveShadow = true;
  group.add(upperCollar);

  // 4. Vertical cage struts (4 struts at 45, 135, 225, 315 deg)
  const strutH = UPPER_COLLAR_Y - (BASE_H + LOWER_COLLAR_H) + 0.004;
  const strutY = (BASE_H + LOWER_COLLAR_H + UPPER_COLLAR_Y) / 2;
  const strutGeo = new THREE.BoxGeometry(0.011, strutH, 0.004);
  const strutAngles = [
    { name: 'strut_front_right', angle: Math.PI * 0.25 },
    { name: 'strut_front_left', angle: Math.PI * 0.75 },
    { name: 'strut_back_left', angle: Math.PI * 1.25 },
    { name: 'strut_back_right', angle: Math.PI * 1.75 },
  ];
  const strutR = COLLAR_R - 0.0015;
  for (const s of strutAngles) {
    const strut = new THREE.Mesh(strutGeo, frameMat);
    strut.name = s.name;
    strut.position.set(
      Math.cos(s.angle) * strutR,
      strutY,
      Math.sin(s.angle) * strutR
    );
    strut.rotation.y = -s.angle + Math.PI / 2;
    strut.castShadow = true;
    strut.receiveShadow = true;
    group.add(strut);
  }

  // 5. Handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(COLLAR_R - 0.004, UPPER_COLLAR_Y + UPPER_COLLAR_H * 0.5, 0),
    new THREE.Vector3(COLLAR_R + 0.028, UPPER_COLLAR_Y + UPPER_COLLAR_H * 0.5, 0),
    new THREE.Vector3(COLLAR_R + 0.038, UPPER_COLLAR_Y + UPPER_COLLAR_H * 0.1, 0),
    new THREE.Vector3(COLLAR_R + 0.038, BASE_H + LOWER_COLLAR_H * 0.75, 0),
    new THREE.Vector3(COLLAR_R + 0.028, BASE_H + LOWER_COLLAR_H * 0.45, 0),
    new THREE.Vector3(COLLAR_R - 0.004, BASE_H + LOWER_COLLAR_H * 0.45, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, 0.0075, 16, false);
  const handle = new THREE.Mesh(handleGeo, frameMat);
  handle.name = 'handle';
  handle.castShadow = true;
  handle.receiveShadow = true;
  group.add(handle);

  // 6. Glass carafe (LatheGeometry with wall thickness)
  const glassPoints = [
    new THREE.Vector2(0, GLASS_BOTTOM_Y),
    new THREE.Vector2(GLASS_R, GLASS_BOTTOM_Y),
    new THREE.Vector2(GLASS_R, GLASS_TOP_Y),
    new THREE.Vector2(GLASS_R - GLASS_WALL, GLASS_TOP_Y),
    new THREE.Vector2(GLASS_R - GLASS_WALL, GLASS_BOTTOM_Y + GLASS_WALL),
    new THREE.Vector2(0, GLASS_BOTTOM_Y + GLASS_WALL),
  ];
  const glassGeo = new THREE.LatheGeometry(glassPoints, 32);
  const glassCarafe = new THREE.Mesh(glassGeo, glassMat);
  glassCarafe.name = 'glass_carafe';
  glassCarafe.castShadow = true;
  glassCarafe.receiveShadow = true;
  group.add(glassCarafe);

  // 7. Glass pouring spout on -X side
  const spoutGeo = new THREE.ConeGeometry(0.011, 0.022, 16);
  const glassSpout = new THREE.Mesh(spoutGeo, glassMat);
  glassSpout.name = 'glass_spout';
  glassSpout.position.set(-GLASS_R - 0.005, GLASS_TOP_Y - 0.008, 0);
  glassSpout.rotation.z = Math.PI * 0.62;
  glassSpout.castShadow = true;
  glassSpout.receiveShadow = true;
  group.add(glassSpout);

  // 8. Lid inner skirt
  const lidSkirtGeo = new THREE.CylinderGeometry(GLASS_R - GLASS_WALL - 0.001, GLASS_R - GLASS_WALL - 0.002, 0.014, 32);
  const lidSkirt = new THREE.Mesh(lidSkirtGeo, frameMat);
  lidSkirt.name = 'lid_skirt';
  lidSkirt.position.y = LID_Y - 0.006;
  lidSkirt.castShadow = true;
  lidSkirt.receiveShadow = true;
  group.add(lidSkirt);

  // 9. Lid cap
  const lidCapGeo = new THREE.CylinderGeometry(LID_R * 0.96, LID_R, LID_H, 32);
  const lidCap = new THREE.Mesh(lidCapGeo, frameMat);
  lidCap.name = 'lid_cap';
  lidCap.position.y = LID_Y + LID_H / 2;
  lidCap.castShadow = true;
  lidCap.receiveShadow = true;
  group.add(lidCap);

  // 10. Plunger knob stem
  const knobStemGeo = new THREE.CylinderGeometry(0.006, 0.006, KNOB_STEM_H, 20);
  const knobStem = new THREE.Mesh(knobStemGeo, frameMat);
  knobStem.name = 'knob_stem';
  knobStem.position.y = LID_Y + LID_H + KNOB_STEM_H / 2 - 0.001;
  knobStem.castShadow = true;
  knobStem.receiveShadow = true;
  group.add(knobStem);

  // 11. Plunger knob top
  const knobTopGeo = new THREE.CylinderGeometry(KNOB_TOP_R * 0.94, KNOB_TOP_R, KNOB_TOP_H, 32);
  const knobTop = new THREE.Mesh(knobTopGeo, frameMat);
  knobTop.name = 'knob_top';
  knobTop.position.y = LID_Y + LID_H + KNOB_STEM_H + KNOB_TOP_H / 2 - 0.002;
  knobTop.castShadow = true;
  knobTop.receiveShadow = true;
  group.add(knobTop);

  // 12. Plunger rod (stainless steel)
  const rodH = LID_Y - FILTER_Y;
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, rodH, 16);
  const plungerRod = new THREE.Mesh(rodGeo, steelMat);
  plungerRod.name = 'plunger_rod';
  plungerRod.position.y = FILTER_Y + rodH / 2;
  plungerRod.castShadow = true;
  plungerRod.receiveShadow = true;
  group.add(plungerRod);

  // 13. Filter hub
  const filterHubGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.010, 16);
  const filterHub = new THREE.Mesh(filterHubGeo, steelMat);
  filterHub.name = 'filter_hub';
  filterHub.position.y = FILTER_Y + 0.004;
  filterHub.castShadow = true;
  filterHub.receiveShadow = true;
  group.add(filterHub);

  // 14. Filter plate
  const filterPlateGeo = new THREE.CylinderGeometry(GLASS_R - GLASS_WALL - 0.003, GLASS_R - GLASS_WALL - 0.003, 0.0025, 32);
  const filterPlate = new THREE.Mesh(filterPlateGeo, steelMat);
  filterPlate.name = 'filter_plate';
  filterPlate.position.y = FILTER_Y;
  filterPlate.castShadow = true;
  filterPlate.receiveShadow = true;
  group.add(filterPlate);

  // 15. Filter spiral spring ring
  const springRingGeo = new THREE.TorusGeometry(GLASS_R - GLASS_WALL - 0.003, 0.0028, 12, 32);
  const springRing = new THREE.Mesh(springRingGeo, steelMat);
  springRing.name = 'filter_spring_ring';
  springRing.position.y = FILTER_Y + 0.001;
  springRing.rotation.x = Math.PI / 2;
  springRing.castShadow = true;
  springRing.receiveShadow = true;
  group.add(springRing);

  return group;
}
