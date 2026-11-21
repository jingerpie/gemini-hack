function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SWAG_W = 1.52;
  const HALF_W = SWAG_W / 2;
  const Y_TOP = 0.50;
  const Y_MIN = 0.22;
  const SAG = Y_TOP - Y_MIN;
  const WIRE_R = 0.0018;
  const BULB_R = 0.0075;
  const BULB_COUNT = 24;

  const PACK_W = 0.036;
  const PACK_H = 0.084;
  const PACK_D = 0.022;
  const CAP_H = 0.022;

  // Materials
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    metalness: 0.85,
    roughness: 0.25
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3a0,
    emissive: 0xffe455,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const clipMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f8,
    roughness: 0.15,
    metalness: 0.0,
    transparent: true,
    opacity: 0.55,
    clearcoat: 0.8
  });

  const packBodyMat = new THREE.MeshStandardMaterial({
    color: 0x3b4045,
    roughness: 0.55,
    metalness: 0.1
  });

  const packCapMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a5056,
    roughness: 0.25,
    metalness: 0.05,
    transparent: true,
    opacity: 0.72,
    clearcoat: 0.5
  });

  // Catenary swag curve
  const swagPoints = [];
  const CURVE_SAMPLES = 32;
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const t = i / CURVE_SAMPLES;
    const x = -HALF_W + SWAG_W * t;
    const u = x / HALF_W;
    const y = Y_MIN + SAG * u * u;
    const z = 0.004 * (1 - u * u);
    swagPoints.push(new THREE.Vector3(x, y, z));
  }
  const swagCurve = new THREE.CatmullRomCurve3(swagPoints);

  const wireSwagGeo = new THREE.TubeGeometry(swagCurve, 48, WIRE_R, 8, false);
  const wireSwag = new THREE.Mesh(wireSwagGeo, wireMat);
  wireSwag.name = 'wire_swag';
  wireSwag.castShadow = true;
  wireSwag.receiveShadow = true;
  group.add(wireSwag);

  // Lead wire from left swag end down to battery pack
  const leadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-HALF_W, Y_TOP, 0),
    new THREE.Vector3(-HALF_W - 0.008, (Y_TOP + PACK_H) * 0.5, 0.003),
    new THREE.Vector3(-HALF_W, PACK_H, 0)
  ]);
  const wireLeadGeo = new THREE.TubeGeometry(leadCurve, 16, WIRE_R, 8, false);
  const wireLead = new THREE.Mesh(wireLeadGeo, wireMat);
  wireLead.name = 'wire_lead';
  wireLead.castShadow = true;
  wireLead.receiveShadow = true;
  group.add(wireLead);

  // Clear plastic mounting clips
  const clipGeo = new THREE.BoxGeometry(0.016, 0.014, 0.012);
  const clipPositions = [
    { name: 'clip_left', x: -HALF_W, y: Y_TOP, z: -0.002 },
    { name: 'clip_center', x: 0, y: Y_MIN, z: 0.001 },
    { name: 'clip_right', x: HALF_W, y: Y_TOP, z: -0.002 }
  ];
  for (let i = 0; i < clipPositions.length; i++) {
    const cp = clipPositions[i];
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.name = cp.name;
    clip.position.set(cp.x, cp.y, cp.z);
    clip.castShadow = true;
    clip.receiveShadow = true;
    group.add(clip);
  }

  // Battery pack at left end, bottom at y = 0
  const packBodyGeo = new THREE.BoxGeometry(PACK_W, PACK_H - CAP_H, PACK_D);
  const packBody = new THREE.Mesh(packBodyGeo, packBodyMat);
  packBody.name = 'battery_pack_body';
  packBody.position.set(-HALF_W, (PACK_H - CAP_H) / 2, 0);
  packBody.castShadow = true;
  packBody.receiveShadow = true;
  group.add(packBody);

  const packCapGeo = new THREE.BoxGeometry(PACK_W, CAP_H, PACK_D);
  const packCap = new THREE.Mesh(packCapGeo, packCapMat);
  packCap.name = 'battery_pack_cap';
  packCap.position.set(-HALF_W, PACK_H - CAP_H / 2, 0);
  packCap.castShadow = true;
  packCap.receiveShadow = true;
  group.add(packCap);

  const switchGeo = new THREE.BoxGeometry(0.008, 0.012, 0.005);
  const packSwitch = new THREE.Mesh(switchGeo, clipMat);
  packSwitch.name = 'battery_pack_switch';
  packSwitch.position.set(-HALF_W, PACK_H - CAP_H * 0.5, PACK_D / 2 + 0.002);
  packSwitch.castShadow = true;
  packSwitch.receiveShadow = true;
  group.add(packSwitch);

  // LED bulbs along the swag
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 10, 8);
  for (let i = 0; i < BULB_COUNT; i++) {
    const t = (i + 0.5) / BULB_COUNT;
    const pt = swagCurve.getPointAt(t);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    const idxStr = i + 1 < 10 ? '0' + (i + 1) : '' + (i + 1);
    bulb.name = 'emit_bulb_' + idxStr;
    bulb.position.copy(pt);
    bulb.castShadow = true;
    bulb.receiveShadow = true;
    group.add(bulb);
  }

  return group;
}
