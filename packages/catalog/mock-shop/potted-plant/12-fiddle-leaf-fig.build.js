function build(THREE) {
  const group = new THREE.Group();

  const H = 0.85;
  const POT_H = 0.28;
  const POT_R = 0.145;
  const SOIL_Y = POT_H - 0.025;
  const STEM_H = H - SOIL_Y - 0.22;
  const LEAF_COUNT = 24;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x9eb08e,
    roughness: 0.65,
    metalness: 0.05
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1d,
    roughness: 0.95,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c432b,
    roughness: 0.85,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({
      color: 0x3b5e2b,
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide
    }),
    new THREE.MeshStandardMaterial({
      color: 0x466d32,
      roughness: 0.38,
      metalness: 0.02,
      side: THREE.DoubleSide
    }),
    new THREE.MeshStandardMaterial({
      color: 0x527a39,
      roughness: 0.45,
      metalness: 0.02,
      side: THREE.DoubleSide
    })
  ];

  // Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(POT_R * 0.58, 0),
    new THREE.Vector2(POT_R * 0.78, POT_H * 0.06),
    new THREE.Vector2(POT_R * 0.93, POT_H * 0.18),
    new THREE.Vector2(POT_R, POT_H * 0.36),
    new THREE.Vector2(POT_R, POT_H),
    new THREE.Vector2(POT_R - 0.012, POT_H),
    new THREE.Vector2(POT_R - 0.014, POT_H - 0.04)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'ceramic_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_R - 0.012, POT_R - 0.012, 0.02, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.01;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Main Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, SOIL_Y - 0.01, 0),
    new THREE.Vector3(0.005, SOIL_Y + STEM_H * 0.35, 0.004),
    new THREE.Vector3(-0.004, SOIL_Y + STEM_H * 0.7, -0.003),
    new THREE.Vector3(0.002, SOIL_Y + STEM_H, 0.002)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.009, 10, false);
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  stemMesh.name = 'main_stem';
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  group.add(stemMesh);

  // Fiddle Leaf Shape
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.032, 0.02, 0.046, 0.055, 0.038, 0.095);
  leafShape.bezierCurveTo(0.033, 0.115, 0.058, 0.145, 0.076, 0.185);
  leafShape.bezierCurveTo(0.086, 0.225, 0.056, 0.265, 0.0, 0.275);
  leafShape.bezierCurveTo(-0.056, 0.265, -0.086, 0.225, -0.076, 0.185);
  leafShape.bezierCurveTo(-0.058, 0.145, -0.033, 0.115, -0.038, 0.095);
  leafShape.bezierCurveTo(-0.046, 0.055, -0.032, 0.02, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0025,
    bevelEnabled: false,
    curveSegments: 10
  });

  const petioleGeo = new THREE.CylinderGeometry(0.0022, 0.0032, 1, 6);
  petioleGeo.translate(0, 0.5, 0);

  // Deterministic spiral phyllotaxis for leaves
  const goldenAngle = 2.39996323;
  for (let i = 0; i < LEAF_COUNT; i++) {
    const t = i / (LEAF_COUNT - 1);
    const stemT = 0.28 + t * 0.72;
    const attachPos = stemCurve.getPoint(stemT);
    const angle = i * goldenAngle;

    const leafPivot = new THREE.Group();
    leafPivot.position.copy(attachPos);
    leafPivot.rotation.y = angle;

    // Lower leaves droop more, upper leaves point more upright
    const tiltOut = 1.18 - t * 0.75;
    const petioleLen = 0.035 + (1 - Math.abs(t - 0.5)) * 0.025;

    const petioleMesh = new THREE.Mesh(petioleGeo, stemMat);
    petioleMesh.name = `petiole_${i + 1}`;
    petioleMesh.scale.set(1, petioleLen, 1);
    petioleMesh.rotation.x = tiltOut;
    petioleMesh.castShadow = true;
    petioleMesh.receiveShadow = true;
    leafPivot.add(petioleMesh);

    const leafScale = 0.58 + Math.sin(t * Math.PI * 0.85) * 0.42;
    const leafMesh = new THREE.Mesh(leafGeo, leafMats[i % leafMats.length]);
    leafMesh.name = `fiddle_leaf_${i + 1}`;
    leafMesh.scale.set(leafScale, leafScale, 1);
    leafMesh.position.set(0, Math.cos(tiltOut) * petioleLen, Math.sin(tiltOut) * petioleLen);
    leafMesh.rotation.x = tiltOut + 0.12 - t * 0.18;
    leafMesh.rotation.z = ((i % 3) - 1) * 0.08;
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    leafPivot.add(leafMesh);

    group.add(leafPivot);
  }

  return group;
}
