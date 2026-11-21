function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const POT_H = 0.16;
  const POT_R_TOP = 0.095;
  const POT_R_BOT = 0.072;
  const RIM_H = 0.026;
  const RIM_OVERHANG = 0.007;
  const SOIL_Y = POT_H - 0.015;
  const SOIL_R = POT_R_TOP - 0.005;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x5c7a62,
    roughness: 0.62,
    metalness: 0.04
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2a211b,
    roughness: 0.95,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x4f8a28, roughness: 0.36, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x5d9932, roughness: 0.34, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x3f751f, roughness: 0.40, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x6ba63b, roughness: 0.32, metalness: 0.02 })
  ];

  const midribMat = new THREE.MeshStandardMaterial({
    color: 0x261d14,
    roughness: 0.7,
    metalness: 0.0
  });

  // 1. Pot body
  const potBodyGeo = new THREE.CylinderGeometry(POT_R_TOP, POT_R_BOT, POT_H - RIM_H * 0.5, 28);
  const potBody = new THREE.Mesh(potBodyGeo, potMat);
  potBody.name = 'pot_body';
  potBody.position.y = (POT_H - RIM_H * 0.5) * 0.5;
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  group.add(potBody);

  // 2. Pot rim
  const potRimGeo = new THREE.CylinderGeometry(
    POT_R_TOP + RIM_OVERHANG,
    POT_R_TOP + RIM_OVERHANG * 0.7,
    RIM_H,
    28
  );
  const potRim = new THREE.Mesh(potRimGeo, potMat);
  potRim.name = 'pot_rim';
  potRim.position.y = POT_H - RIM_H * 0.5;
  potRim.castShadow = true;
  potRim.receiveShadow = true;
  group.add(potRim);

  // 3. Soil
  const soilGeo = new THREE.CylinderGeometry(SOIL_R, SOIL_R * 0.9, 0.02, 24);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.name = 'pot_soil';
  soil.position.y = SOIL_Y - 0.01;
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  // Helper to create a wavy-edged Bird's Nest Fern frond geometry
  function createFrondGeometry(length, maxWidth, waveAmp, waveFreq) {
    const shape = new THREE.Shape();
    const steps = 20;
    shape.moveTo(0, 0);

    // Right edge (from base to tip)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = t * length;
      // Lanceolate width profile: narrow at base, widest around t = 0.55, pointed tip
      const baseWidth = Math.sin(Math.pow(t, 0.75) * Math.PI) * maxWidth * 0.5;
      const wave = Math.sin(t * Math.PI * waveFreq) * waveAmp * Math.sin(t * Math.PI);
      const x = Math.max(0.002, baseWidth + wave);
      shape.lineTo(x, y);
    }

    // Left edge (from tip back to base)
    for (let i = steps - 1; i >= 1; i--) {
      const t = i / steps;
      const y = t * length;
      const baseWidth = Math.sin(Math.pow(t, 0.75) * Math.PI) * maxWidth * 0.5;
      const wave = Math.sin(t * Math.PI * waveFreq + 0.6) * waveAmp * Math.sin(t * Math.PI);
      const x = -Math.max(0.002, baseWidth + wave);
      shape.lineTo(x, y);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0025,
      bevelEnabled: false,
      curveSegments: 8
    });
    // Center thickness on Z
    geo.translate(0, 0, -0.00125);
    return geo;
  }

  // Pre-build 3 frond geometries for variety
  const frondGeos = [
    createFrondGeometry(0.24, 0.068, 0.006, 7),
    createFrondGeometry(0.29, 0.078, 0.008, 8),
    createFrondGeometry(0.20, 0.056, 0.005, 6)
  ];

  // Rosette arrangement (deterministic golden-angle spiral)
  const GOLDEN_ANGLE = 2.39996323;
  const LEAF_COUNT = 24;

  for (let i = 0; i < LEAF_COUNT; i++) {
    const t = i / (LEAF_COUNT - 1); // 0 = innermost/youngest, 1 = outermost/oldest
    const yaw = i * GOLDEN_ANGLE;

    // Pitch: inner leaves are more upright (~22 deg from vertical), outer leaves arch outward (~72 deg)
    const pitch = 0.38 + t * 0.88 + Math.sin(i * 1.7) * 0.07;

    // Scale: inner leaves slightly shorter, middle leaves longest, outer leaves medium-long
    const lengthScale = 0.72 + Math.sin(t * Math.PI * 0.85) * 0.42;
    const widthScale = 0.85 + t * 0.25;

    const leafPivot = new THREE.Group();
    leafPivot.position.set(
      Math.sin(yaw) * (0.008 + t * 0.018),
      SOIL_Y - 0.005,
      Math.cos(yaw) * (0.008 + t * 0.018)
    );
    leafPivot.rotation.y = yaw;

    // Tilt outward along local +Z, with slight deterministic roll for natural twist
    const frondTilt = new THREE.Group();
    frondTilt.rotation.x = pitch;
    frondTilt.rotation.z = Math.sin(i * 2.3) * 0.14;
    leafPivot.add(frondTilt);

    const geoIdx = i % frondGeos.length;
    const matIdx = i % leafMats.length;

    const blade = new THREE.Mesh(frondGeos[geoIdx], leafMats[matIdx]);
    blade.name = `fern_leaf_${i + 1}`;
    blade.scale.set(widthScale, lengthScale, 1);
    blade.castShadow = true;
    blade.receiveShadow = true;
    frondTilt.add(blade);

    // Dark midrib running along the center of the frond
    const baseLen = geoIdx === 0 ? 0.24 : geoIdx === 1 ? 0.29 : 0.20;
    const ribLen = baseLen * lengthScale * 0.88;
    const ribGeo = new THREE.CylinderGeometry(0.0012, 0.0028, ribLen, 6);
    const rib = new THREE.Mesh(ribGeo, midribMat);
    rib.name = `fern_midrib_${i + 1}`;
    rib.position.y = ribLen * 0.5;
    rib.position.z = 0.0008;
    rib.castShadow = true;
    rib.receiveShadow = true;
    frondTilt.add(rib);

    group.add(leafPivot);
  }

  return group;
}
