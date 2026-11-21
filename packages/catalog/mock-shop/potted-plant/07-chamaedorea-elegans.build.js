function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_TOP_R = 0.08;
  const POT_BOT_R = 0.058;
  const POT_H = 0.135;
  const RIM_H = 0.022;
  const RIM_R = 0.084;
  const SOIL_Y = 0.122;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x9e5236,
    roughness: 0.62,
    metalness: 0.04,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x36271d,
    roughness: 0.95,
    metalness: 0.0,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x4f7823,
    roughness: 0.9,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5d8c34,
    roughness: 0.55,
    metalness: 0.02,
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({
      color: 0x3f7522,
      roughness: 0.42,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x4d872b,
      roughness: 0.45,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x5c9635,
      roughness: 0.48,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  ];

  // Pot body
  const potBodyGeo = new THREE.CylinderGeometry(POT_TOP_R, POT_BOT_R, POT_H, 28);
  const potBody = new THREE.Mesh(potBodyGeo, potMat);
  potBody.position.y = POT_H / 2;
  potBody.name = 'pot_body';
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  group.add(potBody);

  // Pot rim
  const potRimGeo = new THREE.CylinderGeometry(RIM_R, RIM_R * 0.98, RIM_H, 28);
  const potRim = new THREE.Mesh(potRimGeo, potMat);
  potRim.position.y = POT_H - RIM_H / 2;
  potRim.name = 'pot_rim';
  potRim.castShadow = true;
  potRim.receiveShadow = true;
  group.add(potRim);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R * 0.96, POT_TOP_R * 0.92, 0.015, 24);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = SOIL_Y;
  soil.name = 'pot_soil';
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  // Moss patches on soil
  const mossGeo = new THREE.SphereGeometry(0.022, 10, 8);
  mossGeo.scale(1.4, 0.35, 1.0);
  const moss1 = new THREE.Mesh(mossGeo, mossMat);
  moss1.position.set(0.032, SOIL_Y + 0.005, 0.018);
  moss1.rotation.y = 0.4;
  moss1.name = 'soil_moss_1';
  moss1.castShadow = true;
  moss1.receiveShadow = true;
  group.add(moss1);

  const moss2 = new THREE.Mesh(mossGeo, mossMat);
  moss2.position.set(0.042, SOIL_Y + 0.004, -0.015);
  moss2.scale.set(0.8, 0.9, 0.8);
  moss2.rotation.y = -0.7;
  moss2.name = 'soil_moss_2';
  moss2.castShadow = true;
  moss2.receiveShadow = true;
  group.add(moss2);

  // Shared leaflet geometry (pointed palm leaflet)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.011, 0.035, 0.006, 0.075);
  leafShape.quadraticCurveTo(0.002, 0.095, 0, 0.11);
  leafShape.quadraticCurveTo(-0.002, 0.095, -0.006, 0.075);
  leafShape.quadraticCurveTo(-0.011, 0.035, 0, 0);

  const leafletGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0012,
    bevelEnabled: false,
    curveSegments: 8,
  });
  leafletGeo.rotateX(-Math.PI / 2);

  // Deterministic frond configurations: [azimuth, reach, height, baseRadius, pairsCount]
  const fronds = [
    // Tall outer arching fronds
    [0.2, 0.21, 0.36, 0.012, 5],
    [1.45, 0.22, 0.34, 0.014, 5],
    [2.75, 0.20, 0.37, 0.011, 5],
    [4.05, 0.23, 0.35, 0.013, 5],
    [5.3, 0.19, 0.33, 0.012, 4],
    // Medium inner fronds
    [0.8, 0.13, 0.29, 0.008, 4],
    [2.1, 0.14, 0.31, 0.009, 4],
    [3.4, 0.12, 0.28, 0.008, 4],
    [4.7, 0.14, 0.30, 0.009, 4],
    // Shorter lower fronds
    [1.1, 0.11, 0.20, 0.016, 3],
    [3.8, 0.12, 0.21, 0.015, 3],
  ];

  let leafCounter = 0;

  for (let i = 0; i < fronds.length; i++) {
    const [az, reach, height, baseR, pairs] = fronds[i];
    const cosA = Math.cos(az);
    const sinA = Math.sin(az);

    const p0 = new THREE.Vector3(cosA * baseR, SOIL_Y - 0.01, sinA * baseR);
    const p1 = new THREE.Vector3(cosA * (baseR + reach * 0.25), SOIL_Y + height * 0.48, sinA * (baseR + reach * 0.25));
    const p2 = new THREE.Vector3(cosA * (baseR + reach * 0.68), SOIL_Y + height * 0.88, sinA * (baseR + reach * 0.68));
    const p3 = new THREE.Vector3(cosA * (baseR + reach), SOIL_Y + height * 0.82, sinA * (baseR + reach));

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const stemGeo = new THREE.TubeGeometry(curve, 12, 0.0024, 6, false);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.name = `palm_stem_${i + 1}`;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    // Place leaflet pairs along the upper portion of the frond
    for (let j = 0; j < pairs; j++) {
      const t = 0.42 + (j / pairs) * 0.50;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();

      // Side vector perpendicular to tangent and up
      const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // Taper leaflet size toward tip
      const sizeScale = (0.75 + 0.35 * Math.sin((j / pairs) * Math.PI)) * (height / 0.34);
      const mat = leafMats[(i + j) % leafMats.length];

      for (let s = -1; s <= 1; s += 2) {
        const leaflet = new THREE.Mesh(leafletGeo, mat);
        leaflet.position.copy(pt);

        // Direction: angled forward along tangent and outward along side, with slight droop
        const dir = new THREE.Vector3()
          .addScaledVector(tangent, 0.65)
          .addScaledVector(side, s * 0.85)
          .add(new THREE.Vector3(0, -0.22 - j * 0.04, 0))
          .normalize();

        const target = pt.clone().add(dir);
        leaflet.lookAt(target);
        leaflet.rotateZ(s * 0.18);
        leaflet.scale.set(sizeScale, sizeScale, sizeScale);

        leafCounter++;
        leaflet.name = `palm_leaflet_${leafCounter}`;
        leaflet.castShadow = true;
        leaflet.receiveShadow = true;
        group.add(leaflet);
      }
    }

    // Terminal leaflet at the tip
    const tipPt = curve.getPoint(0.98);
    const tipTan = curve.getTangent(0.98).normalize();
    const tipLeaf = new THREE.Mesh(leafletGeo, leafMats[i % leafMats.length]);
    tipLeaf.position.copy(tipPt);
    tipLeaf.lookAt(tipPt.clone().add(tipTan).add(new THREE.Vector3(0, -0.15, 0)));
    const tipScale = 0.72 * (height / 0.34);
    tipLeaf.scale.set(tipScale, tipScale, tipScale);
    leafCounter++;
    tipLeaf.name = `palm_leaflet_${leafCounter}`;
    tipLeaf.castShadow = true;
    tipLeaf.receiveShadow = true;
    group.add(tipLeaf);
  }

  return group;
}
