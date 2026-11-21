function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.075;
  const BASE_H = 0.026;
  const PAD_H = 0.004;
  const STEM_R = 0.008;
  const STEM_H = 0.165;
  const STEM_Z = -0.028;
  const NECK_R = 0.0065;
  const SHADE_R = 0.082;
  const SHADE_H = 0.115;
  const CAP_R = 0.024;
  const CAP_H = 0.042;
  const BULB_R = 0.02;

  // Materials
  const oliveMat = new THREE.MeshStandardMaterial({
    color: 0x5f6b3c,
    roughness: 0.5,
    metalness: 0.35
  });
  const oliveDarkMat = new THREE.MeshStandardMaterial({
    color: 0x434e2f,
    roughness: 0.5,
    metalness: 0.4
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xd8ceb8,
    roughness: 0.4,
    metalness: 0.1
  });
  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xeae5d9,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.BackSide
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.7,
    metalness: 0.1
  });
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x7b725d,
    roughness: 0.6,
    metalness: 0.05
  });
  const metalProngMat = new THREE.MeshStandardMaterial({
    color: 0xb8b2a6,
    roughness: 0.3,
    metalness: 0.85
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d8,
    emissive: 0xffe4b5,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // 1. Base pad (bottom at y = 0)
  const padGeo = new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.98, PAD_H, 32);
  const pad = addMesh(padGeo, blackMat, "base_pad");
  pad.position.set(0, PAD_H / 2, 0);

  // 2. Weighted circular base (LatheGeometry for smooth domed top)
  const basePts = [
    new THREE.Vector2(0, PAD_H),
    new THREE.Vector2(BASE_R, PAD_H),
    new THREE.Vector2(BASE_R, PAD_H + BASE_H * 0.55),
    new THREE.Vector2(BASE_R * 0.92, PAD_H + BASE_H * 0.85),
    new THREE.Vector2(BASE_R * 0.6, PAD_H + BASE_H),
    new THREE.Vector2(0, PAD_H + BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePts, 32);
  addMesh(baseGeo, oliveMat, "base_body");

  // 3. Cream collar at base of stem
  const collarY = PAD_H + BASE_H;
  const collarGeo = new THREE.CylinderGeometry(STEM_R * 1.25, STEM_R * 1.65, 0.016, 20);
  const collar = addMesh(collarGeo, creamMat, "stem_collar");
  collar.position.set(0, collarY + 0.008, STEM_Z);

  // 4. Vertical stem
  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 20);
  const stem = addMesh(stemGeo, oliveMat, "vertical_stem");
  stem.position.set(0, collarY + STEM_H / 2, STEM_Z);

  // 5. Stem-to-gooseneck ferrule
  const ferruleY = collarY + STEM_H;
  const ferruleGeo = new THREE.CylinderGeometry(NECK_R * 1.15, STEM_R * 1.05, 0.012, 20);
  const ferrule = addMesh(ferruleGeo, oliveDarkMat, "neck_ferrule");
  ferrule.position.set(0, ferruleY + 0.006, STEM_Z);

  // 6. Flexible gooseneck curve
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, ferruleY + 0.01, STEM_Z),
    new THREE.Vector3(0, ferruleY + 0.065, STEM_Z + 0.008),
    new THREE.Vector3(0, ferruleY + 0.125, STEM_Z + 0.038),
    new THREE.Vector3(0, ferruleY + 0.155, STEM_Z + 0.082)
  ]);
  const neckGeo = new THREE.TubeGeometry(neckCurve, 24, NECK_R, 12, false);
  addMesh(neckGeo, oliveDarkMat, "gooseneck_core");

  // Ribbed rings along gooseneck (14 rings)
  const ringGeo = new THREE.TorusGeometry(NECK_R * 1.08, 0.0016, 8, 16);
  const ringCount = 14;
  for (let i = 1; i <= ringCount; i++) {
    const t = i / (ringCount + 1);
    const pt = neckCurve.getPointAt(t);
    const tangent = neckCurve.getTangentAt(t);
    const ring = addMesh(ringGeo, oliveDarkMat, `gooseneck_rib_${i}`);
    ring.position.copy(pt);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
  }

  // 7. Lamp Head Group (opening faces DOWN and slightly forward +Z)
  const headPivot = new THREE.Group();
  const neckEnd = neckCurve.getPointAt(1);
  headPivot.position.copy(neckEnd);
  headPivot.rotation.x = -Math.PI * 0.22;
  group.add(headPivot);

  function addHeadMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    headPivot.add(m);
    return m;
  }

  // Upper socket cap
  const capGeo = new THREE.CylinderGeometry(CAP_R * 0.9, CAP_R, CAP_H, 24);
  const cap = addHeadMesh(capGeo, oliveMat, "shade_cap");
  cap.position.set(0, 0.018, 0.015);

  // Cap top dome
  const capTopGeo = new THREE.SphereGeometry(CAP_R * 0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const capTop = addHeadMesh(capTopGeo, oliveMat, "shade_cap_top");
  capTop.position.set(0, 0.018 + CAP_H / 2, 0.015);

  // Outer bell shade (LatheGeometry ordered bottom-to-top so normals face outward)
  const shadePts = [
    new THREE.Vector2(SHADE_R, -SHADE_H),
    new THREE.Vector2(SHADE_R * 0.98, -SHADE_H * 0.8),
    new THREE.Vector2(SHADE_R * 0.85, -SHADE_H * 0.45),
    new THREE.Vector2(SHADE_R * 0.55, -SHADE_H * 0.14),
    new THREE.Vector2(CAP_R, 0)
  ];
  const shadeOuterGeo = new THREE.LatheGeometry(shadePts, 32);
  const shadeOuter = addHeadMesh(shadeOuterGeo, oliveMat, "shade_outer");
  shadeOuter.position.set(0, 0.018 - CAP_H / 2 + 0.005, 0.015);

  // Inner lighter lining of shade (strictly inside outer shade, BackSide faces inward)
  const shadeInnerPts = shadePts.map(
    (p) => new THREE.Vector2(Math.max(0.001, p.x - 0.002), p.y + 0.001)
  );
  const shadeInnerGeo = new THREE.LatheGeometry(shadeInnerPts, 32);
  const shadeInner = addHeadMesh(shadeInnerGeo, shadeInnerMat, "shade_inner");
  shadeInner.position.copy(shadeOuter.position);

  // Bulb inside shade
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 20, 16);
  const bulb = addHeadMesh(bulbGeo, bulbMat, "emit_bulb");
  bulb.position.set(0, shadeOuter.position.y - SHADE_H * 0.42, 0.015);

  // 8. Power cord exiting rear of base with inline switch and plug
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, PAD_H + 0.006, -BASE_R + 0.004),
    new THREE.Vector3(-0.02, 0.004, -BASE_R - 0.04),
    new THREE.Vector3(-0.08, 0.004, -BASE_R - 0.07),
    new THREE.Vector3(-0.13, 0.004, -BASE_R - 0.01),
    new THREE.Vector3(-0.11, 0.004, 0.05)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, 0.0032, 8, false);
  addMesh(cordGeo, cordMat, "power_cord");

  // Inline switch on cord
  const switchGeo = new THREE.BoxGeometry(0.028, 0.011, 0.014);
  const switchMesh = addMesh(switchGeo, cordMat, "inline_switch");
  const swPt = cordCurve.getPointAt(0.35);
  switchMesh.position.set(swPt.x, 0.0055, swPt.z);
  switchMesh.rotation.y = 0.5;

  // Plug at end of cord
  const plugEnd = cordCurve.getPointAt(1);
  const plugGeo = new THREE.BoxGeometry(0.018, 0.014, 0.022);
  const plug = addMesh(plugGeo, cordMat, "power_plug");
  plug.position.set(plugEnd.x, 0.007, plugEnd.z + 0.01);

  const prongGeo = new THREE.BoxGeometry(0.0015, 0.005, 0.014);
  const prongL = addMesh(prongGeo, metalProngMat, "plug_prong_left");
  prongL.position.set(plugEnd.x - 0.0045, 0.007, plugEnd.z + 0.026);
  const prongR = addMesh(prongGeo, metalProngMat, "plug_prong_right");
  prongR.position.set(plugEnd.x + 0.0045, 0.007, plugEnd.z + 0.026);

  return group;
}
