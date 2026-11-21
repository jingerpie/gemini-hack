function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.18;
  const POT_R_TOP = 0.10;
  const POT_R_BOT = 0.075;
  const RIM_H = 0.026;
  const RIM_R_TOP = 0.106;
  const RIM_R_BOT = 0.102;
  const SOIL_Y = POT_H - 0.015;
  const SOIL_R = POT_R_TOP - 0.006;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x944b30,
    roughness: 0.62,
    metalness: 0.02,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x362419,
    roughness: 0.95,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x567a32,
    roughness: 0.45,
    metalness: 0.0,
  });

  const leafMats = [
    new THREE.MeshPhysicalMaterial({
      color: 0x3b6e22,
      roughness: 0.28,
      metalness: 0.0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x4b7f2b,
      roughness: 0.26,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.22,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x2e5919,
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.28,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x5c8f36,
      roughness: 0.24,
      metalness: 0.0,
      clearcoat: 0.42,
      clearcoatRoughness: 0.2,
    }),
  ];

  // Pot body
  const potGeo = new THREE.CylinderGeometry(POT_R_TOP, POT_R_BOT, POT_H, 28);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.position.y = POT_H / 2;
  potMesh.name = 'pot_body';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Pot rim
  const rimGeo = new THREE.CylinderGeometry(RIM_R_TOP, RIM_R_BOT, RIM_H, 28);
  const rimMesh = new THREE.Mesh(rimGeo, potMat);
  rimMesh.position.y = POT_H - RIM_H / 2;
  rimMesh.name = 'pot_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(SOIL_R, SOIL_R * 0.96, 0.02, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = SOIL_Y;
  soilMesh.name = 'pot_soil';
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Leaf geometry (pointed oval shape extruded thinly)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.018, 0.014, 0.02, 0.042, 0, 0.064);
  leafShape.bezierCurveTo(-0.02, 0.042, -0.018, 0.014, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0022,
    bevelEnabled: false,
    curveSegments: 8,
  });
  leafGeo.translate(0, 0, -0.0011);

  // Stem definitions: [baseX, baseZ, midX, midY, midZ, topX, topY, topZ, radius, leafPairs, startT]
  const stems = [
    // Tall left-center stem
    [-0.025, 0.01, -0.075, 0.38, 0.015, -0.17, 0.62, 0.02, 0.0075, 8, 0.25],
    // Tall right stem
    [0.03, -0.005, 0.095, 0.36, -0.01, 0.21, 0.59, -0.015, 0.0075, 8, 0.24],
    // Medium-tall outer left stem
    [-0.045, -0.01, -0.13, 0.31, -0.02, -0.24, 0.47, -0.025, 0.0068, 7, 0.26],
    // Medium center-back stem
    [0.005, -0.03, 0.01, 0.30, -0.06, 0.03, 0.44, -0.09, 0.0065, 6, 0.28],
    // Shorter front-left stem
    [-0.02, 0.035, -0.055, 0.25, 0.075, -0.09, 0.35, 0.11, 0.006, 5, 0.30],
    // Shorter front-right stem
    [0.025, 0.03, 0.055, 0.24, 0.065, 0.10, 0.33, 0.09, 0.0058, 5, 0.32],
    // Small inner center stem
    [0.0, 0.005, -0.015, 0.23, 0.02, -0.025, 0.30, 0.035, 0.0052, 4, 0.35],
  ];

  let leafCounter = 0;

  for (let s = 0; s < stems.length; s++) {
    const [bx, bz, mx, my, mz, tx, ty, tz, rad, pairs, startT] = stems[s];

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, SOIL_Y - 0.01, bz),
      new THREE.Vector3(mx, my, mz),
      new THREE.Vector3(tx, ty, tz),
    ]);

    const stemGeo = new THREE.TubeGeometry(curve, 16, rad, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = `stem_${s + 1}`;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    // Place opposite/sub-opposite leaf pairs along the stem
    for (let p = 0; p < pairs; p++) {
      const frac = pairs > 1 ? p / (pairs - 1) : 1;
      const t = startT + frac * (0.96 - startT);
      const pos = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();

      // Scale leaves slightly smaller near the tip
      const sizeScale = 0.85 + 0.3 * Math.sin(frac * Math.PI * 0.85);

      for (let side = -1; side <= 1; side += 2) {
        const leafMat = leafMats[(leafCounter + s) % leafMats.length];
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        leafMesh.name = `leaf_${leafCounter + 1}`;
        leafMesh.castShadow = true;
        leafMesh.receiveShadow = true;

        // Sub-opposite offset
        const offsetT = Math.min(0.99, t + (side === 1 ? 0.015 : 0));
        const leafPos = curve.getPoint(offsetT);
        leafMesh.position.copy(leafPos);

        // Orient leaf outward from stem
        const up = new THREE.Vector3(0, 1, 0);
        const sideVec = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (sideVec.lengthSq() < 0.01) {
          sideVec.set(1, 0, 0);
        }

        const leafDir = new THREE.Vector3()
          .copy(tangent)
          .multiplyScalar(0.55)
          .addScaledVector(sideVec, side * 0.78)
          .add(new THREE.Vector3(0, 0.25, 0))
          .normalize();

        const quat = new THREE.Quaternion().setFromUnitVectors(up, leafDir);
        leafMesh.quaternion.copy(quat);

        // Slight natural roll so the flat face catches light
        leafMesh.rotateY(side * 0.35 + (p % 2 === 0 ? 0.12 : -0.12));
        leafMesh.scale.set(sizeScale, sizeScale, sizeScale);

        group.add(leafMesh);
        leafCounter++;
      }
    }

    // Terminal leaf at the tip
    const tipPos = curve.getPoint(0.98);
    const tipTangent = curve.getTangent(0.98).normalize();
    const tipLeaf = new THREE.Mesh(leafGeo, leafMats[s % leafMats.length]);
    tipLeaf.name = `leaf_${leafCounter + 1}`;
    tipLeaf.castShadow = true;
    tipLeaf.receiveShadow = true;
    tipLeaf.position.copy(tipPos);
    tipLeaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipTangent);
    tipLeaf.scale.set(0.82, 0.82, 0.82);
    group.add(tipLeaf);
    leafCounter++;
  }

  return group;
}
