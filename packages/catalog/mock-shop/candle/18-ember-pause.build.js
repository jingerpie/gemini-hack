function build(THREE) {
  const group = new THREE.Group();

  const VESSEL_R = 0.05;
  const VESSEL_H = 0.075;
  const OPENING_R = 0.038;
  const WALL_THICK = 0.005;
  const WAX_H = 0.052;
  const WAX_TOP_Y = 0.062;
  const WICK_H = 0.01;
  const LID_R = 0.044;
  const LID_H = 0.022;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece3,
    roughness: 0.78,
    metalness: 0.02
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe0,
    roughness: 0.45,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x3b3228,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // 1. Ceramic vessel body (LatheGeometry with hollow interior)
  const vesselPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.03, 0.0),
    new THREE.Vector2(0.042, 0.012),
    new THREE.Vector2(VESSEL_R, 0.035),
    new THREE.Vector2(0.047, 0.058),
    new THREE.Vector2(OPENING_R + WALL_THICK, VESSEL_H - 0.004),
    new THREE.Vector2(OPENING_R + WALL_THICK * 0.5, VESSEL_H),
    new THREE.Vector2(OPENING_R, VESSEL_H - 0.003),
    new THREE.Vector2(OPENING_R + 0.004, 0.055),
    new THREE.Vector2(OPENING_R + 0.005, 0.035),
    new THREE.Vector2(0.032, 0.012),
    new THREE.Vector2(0.0, 0.008)
  ];
  const vesselGeo = new THREE.LatheGeometry(vesselPts, 32);
  const vessel = new THREE.Mesh(vesselGeo, ceramicMat);
  vessel.name = 'ceramic_vessel';
  vessel.castShadow = true;
  vessel.receiveShadow = true;
  group.add(vessel);

  // 2. Pouring spout lip on the +Z (front) rim
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.011, VESSEL_H - 0.002, OPENING_R + 0.001),
    new THREE.Vector3(-0.005, VESSEL_H - 0.004, OPENING_R + 0.008),
    new THREE.Vector3(0.0, VESSEL_H - 0.005, OPENING_R + 0.011),
    new THREE.Vector3(0.005, VESSEL_H - 0.004, OPENING_R + 0.008),
    new THREE.Vector3(0.011, VESSEL_H - 0.002, OPENING_R + 0.001)
  ]);
  const spoutGeo = new THREE.TubeGeometry(spoutCurve, 16, 0.0032, 10, false);
  const spout = new THREE.Mesh(spoutGeo, ceramicMat);
  spout.name = 'pouring_spout';
  spout.castShadow = true;
  spout.receiveShadow = true;
  group.add(spout);

  // 3. Wax fill inside the vessel
  const waxGeo = new THREE.CylinderGeometry(OPENING_R + 0.002, OPENING_R - 0.002, WAX_H, 28);
  const wax = new THREE.Mesh(waxGeo, waxMat);
  wax.name = 'candle_wax';
  wax.position.y = WAX_TOP_Y - WAX_H * 0.5;
  wax.castShadow = true;
  wax.receiveShadow = true;
  group.add(wax);

  // 4. Wick
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0014, WICK_H, 8);
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.name = 'candle_wick';
  wick.position.y = WAX_TOP_Y + WICK_H * 0.5 - 0.001;
  wick.castShadow = true;
  wick.receiveShadow = true;
  group.add(wick);

  // 5. Lit flame (teardrop LatheGeometry)
  const flamePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.0032, 0.003),
    new THREE.Vector2(0.0036, 0.007),
    new THREE.Vector2(0.0024, 0.012),
    new THREE.Vector2(0.0008, 0.016),
    new THREE.Vector2(0.0, 0.018)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePts, 16);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.name = 'emit_flame';
  flame.position.y = WAX_TOP_Y + WICK_H - 0.002;
  flame.castShadow = true;
  flame.receiveShadow = true;
  group.add(flame);

  // 6. Ceramic lid leaning beside the vessel
  const lidPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(OPENING_R - 0.003, 0.0),
    new THREE.Vector2(OPENING_R - 0.002, 0.006),
    new THREE.Vector2(LID_R, 0.008),
    new THREE.Vector2(LID_R, 0.013),
    new THREE.Vector2(LID_R * 0.82, 0.018),
    new THREE.Vector2(LID_R * 0.45, 0.021),
    new THREE.Vector2(0.0, LID_H)
  ];
  const lidGeo = new THREE.LatheGeometry(lidPts, 32);
  const lid = new THREE.Mesh(lidGeo, ceramicMat);
  lid.name = 'ceramic_lid';
  lid.position.set(VESSEL_R + 0.018, 0.036, -0.01);
  lid.rotation.z = -1.12;
  lid.rotation.y = 0.25;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  return group;
}
