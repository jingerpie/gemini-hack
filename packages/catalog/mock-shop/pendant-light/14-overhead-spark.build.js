function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.96;
  const CHANDELIER_W = 0.62;
  const ARM_RADIUS = CHANDELIER_W * 0.45; // 0.279
  const ARM_COUNT = 6;

  const CANOPY_R = 0.065;
  const CANOPY_H = 0.025;
  const TOP_LOOP_Y = 0.66;
  const TOP_COLLAR_Y = 0.54;
  const BOTTOM_HUB_Y = 0.14;
  const BOTTOM_HUB_R = 0.036;
  const BOTTOM_HUB_H = 0.032;

  const CANDLE_Y = 0.22;
  const CANDLE_H = 0.085;
  const BULB_H = 0.075;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc2a15e,
    metalness: 0.85,
    roughness: 0.28
  });

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.05,
    transparent: true,
    opacity: 0.75,
    clearcoat: 1.0
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e5,
    emissive: 0xffe4b5,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    group.add(mesh);
    return mesh;
  }

  // 1. Canopy plate at ceiling (y = TOTAL_H)
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R * 0.85, CANOPY_H, 24);
  addMesh(canopyGeo, brassMat, 'canopy_plate', [0, TOTAL_H - CANOPY_H / 2, 0]);

  // 2. Hanging chain/rod from canopy down to top loop
  const chainLen = (TOTAL_H - CANOPY_H) - TOP_LOOP_Y;
  const chainGeo = new THREE.CylinderGeometry(0.005, 0.005, chainLen + 0.02, 12);
  addMesh(chainGeo, brassMat, 'hanging_chain', [0, TOP_LOOP_Y + chainLen / 2, 0]);

  // 3. Top loop
  const topLoopGeo = new THREE.TorusGeometry(0.018, 0.004, 10, 20);
  addMesh(topLoopGeo, brassMat, 'top_loop', [0, TOP_LOOP_Y, 0]);

  // 4. Central stem
  const stemLen = TOP_LOOP_Y - BOTTOM_HUB_Y;
  const stemGeo = new THREE.CylinderGeometry(0.009, 0.011, stemLen, 16);
  addMesh(stemGeo, brassMat, 'central_stem', [0, BOTTOM_HUB_Y + stemLen / 2, 0]);

  // 5. Top collar
  const collarGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.022, 20);
  addMesh(collarGeo, brassMat, 'top_collar', [0, TOP_COLLAR_Y, 0]);

  // 6. Bottom hub
  const hubGeo = new THREE.CylinderGeometry(BOTTOM_HUB_R, BOTTOM_HUB_R * 0.9, BOTTOM_HUB_H, 24);
  addMesh(hubGeo, brassMat, 'bottom_hub', [0, BOTTOM_HUB_Y, 0]);

  // 7. Bottom crystal finial (touches y = 0)
  const finialPts = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.018, 0.014),
    new THREE.Vector2(0.020, 0.028),
    new THREE.Vector2(0.008, 0.044),
    new THREE.Vector2(0.004, 0.090),
    new THREE.Vector2(0.008, 0.130),
    new THREE.Vector2(0.000, 0.135)
  ];
  const finialGeo = new THREE.LatheGeometry(finialPts, 16);
  addMesh(finialGeo, crystalMat, 'bottom_crystal_finial', [0, 0, 0]);

  // Shared geometries for radial arms
  const candlePts = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.036, 0.008),
    new THREE.Vector2(0.040, 0.012),
    new THREE.Vector2(0.014, 0.014),
    new THREE.Vector2(0.012, 0.018),
    new THREE.Vector2(0.012, CANDLE_H),
    new THREE.Vector2(0.000, CANDLE_H)
  ];
  const candleGeo = new THREE.LatheGeometry(candlePts, 20);

  const bulbPts = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.011, 0.012),
    new THREE.Vector2(0.014, 0.028),
    new THREE.Vector2(0.011, 0.048),
    new THREE.Vector2(0.004, 0.068),
    new THREE.Vector2(0.000, BULB_H)
  ];
  const bulbGeo = new THREE.LatheGeometry(bulbPts, 16);

  const dropPts = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.011, 0.022),
    new THREE.Vector2(0.013, 0.036),
    new THREE.Vector2(0.005, 0.065),
    new THREE.Vector2(0.003, 0.088),
    new THREE.Vector2(0.000, 0.092)
  ];
  const dropGeo = new THREE.LatheGeometry(dropPts, 12);

  // 8-12. Radial arms, candle holders, bulbs, upper scrolls, lower crystal drops
  for (let i = 0; i < ARM_COUNT; i++) {
    const angle = (i / ARM_COUNT) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const idx = i + 1;

    // Lower S-curve arm
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cos * (BOTTOM_HUB_R * 0.7), BOTTOM_HUB_Y, sin * (BOTTOM_HUB_R * 0.7)),
      new THREE.Vector3(cos * 0.11, 0.10, sin * 0.11),
      new THREE.Vector3(cos * 0.21, 0.12, sin * 0.21),
      new THREE.Vector3(cos * (ARM_RADIUS + 0.02), 0.17, sin * (ARM_RADIUS + 0.02)),
      new THREE.Vector3(cos * ARM_RADIUS, CANDLE_Y + 0.005, sin * ARM_RADIUS)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 24, 0.0055, 10, false);
    addMesh(armGeo, brassMat, `arm_${idx}`);

    // Candle holder (bobeche + sleeve)
    addMesh(candleGeo, brassMat, `candle_holder_${idx}`, [
      cos * ARM_RADIUS,
      CANDLE_Y,
      sin * ARM_RADIUS
    ]);

    // Emissive flame-tip bulb
    addMesh(bulbGeo, bulbMat, `emit_bulb_${idx}`, [
      cos * ARM_RADIUS,
      CANDLE_Y + CANDLE_H - 0.005,
      sin * ARM_RADIUS
    ]);

    // Upper scroll rib
    const scrollCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cos * (BOTTOM_HUB_R * 0.7), BOTTOM_HUB_Y + 0.01, sin * (BOTTOM_HUB_R * 0.7)),
      new THREE.Vector3(cos * 0.055, 0.28, sin * 0.055),
      new THREE.Vector3(cos * 0.024, TOP_COLLAR_Y, sin * 0.024),
      new THREE.Vector3(cos * 0.045, 0.63, sin * 0.045),
      new THREE.Vector3(cos * 0.095, 0.64, sin * 0.095),
      new THREE.Vector3(cos * 0.115, 0.59, sin * 0.115)
    ]);
    const scrollGeo = new THREE.TubeGeometry(scrollCurve, 24, 0.0045, 8, false);
    addMesh(scrollGeo, brassMat, `upper_scroll_${idx}`);

    // Lower crystal drop hanging under arm
    addMesh(dropGeo, crystalMat, `crystal_drop_lower_${idx}`, [
      cos * (ARM_RADIUS * 0.78),
      0.035,
      sin * (ARM_RADIUS * 0.78)
    ]);
  }

  return group;
}
