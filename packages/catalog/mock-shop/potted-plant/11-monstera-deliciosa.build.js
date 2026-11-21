function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale)
  const POT_H = 0.26;
  const POT_R = 0.145;
  const POT_BOT_R = 0.085;
  const POT_BEVEL_H = 0.055;
  const POT_WALL = 0.014;
  const SOIL_Y = POT_H - 0.035;
  const PLANT_H = 0.72;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xb5a48b,
    roughness: 0.85,
    metalness: 0.02,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c20,
    roughness: 0.95,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c7540,
    roughness: 0.65,
    metalness: 0.02,
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({
      color: 0x55733b,
      roughness: 0.45,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x628044,
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x486332,
      roughness: 0.48,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x708f50,
      roughness: 0.40,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  ];

  // 1. Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(POT_BOT_R, 0.0),
    new THREE.Vector2(POT_R, POT_BEVEL_H),
    new THREE.Vector2(POT_R, POT_H),
    new THREE.Vector2(POT_R - POT_WALL, POT_H),
    new THREE.Vector2(POT_R - POT_WALL, SOIL_Y - 0.02),
    new THREE.Vector2(0.0, SOIL_Y - 0.02),
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'ceramic_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(
    POT_R - POT_WALL + 0.001,
    POT_R - POT_WALL,
    0.02,
    28
  );
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.01;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Helper: Create fenestrated Monstera leaf geometry
  // Leaf lies in XZ-like local plane (drawn in XY, then rotated so +Y is leaf tip)
  function createMonsteraLeafGeo(slitCount) {
    const shape = new THREE.Shape();
    // Base cordate (heart) notch at (0, 0)
    shape.moveTo(0, 0.01);

    // Right side from base up to tip
    shape.bezierCurveTo(0.05, -0.02, 0.14, 0.01, 0.17, 0.08);

    if (slitCount >= 3) {
      // Lower right slit
      shape.lineTo(0.06, 0.11);
      shape.lineTo(0.06, 0.125);
      shape.lineTo(0.18, 0.14);
      shape.quadraticCurveTo(0.19, 0.17, 0.185, 0.20);
    }

    if (slitCount >= 2) {
      // Middle right slit
      shape.lineTo(0.055, 0.21);
      shape.lineTo(0.055, 0.228);
      shape.lineTo(0.175, 0.25);
      shape.quadraticCurveTo(0.17, 0.285, 0.15, 0.31);
    }

    if (slitCount >= 1) {
      // Upper right slit
      shape.lineTo(0.05, 0.315);
      shape.lineTo(0.05, 0.332);
      shape.lineTo(0.13, 0.355);
      shape.quadraticCurveTo(0.10, 0.40, 0.0, 0.45);
    } else {
      shape.quadraticCurveTo(0.15, 0.26, 0.0, 0.45);
    }

    // Left side from tip down to base (mirrored)
    if (slitCount >= 1) {
      shape.quadraticCurveTo(-0.10, 0.40, -0.13, 0.355);
      shape.lineTo(-0.05, 0.332);
      shape.lineTo(-0.05, 0.315);
      shape.lineTo(-0.15, 0.31);
    } else {
      shape.quadraticCurveTo(-0.15, 0.26, -0.17, 0.08);
    }

    if (slitCount >= 2) {
      shape.quadraticCurveTo(-0.17, 0.285, -0.175, 0.25);
      shape.lineTo(-0.055, 0.228);
      shape.lineTo(-0.055, 0.21);
      shape.lineTo(-0.185, 0.20);
    }

    if (slitCount >= 3) {
      shape.quadraticCurveTo(-0.19, 0.17, -0.18, 0.14);
      shape.lineTo(-0.06, 0.125);
      shape.lineTo(-0.06, 0.11);
      shape.lineTo(-0.17, 0.08);
    }

    shape.bezierCurveTo(-0.14, 0.01, -0.05, -0.02, 0, 0.01);

    const extrudeSettings = {
      depth: 0.0025,
      bevelEnabled: false,
      curveSegments: 8,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  const leafGeos = [
    createMonsteraLeafGeo(3),
    createMonsteraLeafGeo(2),
    createMonsteraLeafGeo(1),
  ];

  // 3. Stems and Leaves (deterministic golden-angle arrangement)
  const LEAF_COUNT = 18;
  const GOLDEN_ANGLE = 2.3999632;

  for (let i = 0; i < LEAF_COUNT; i++) {
    const t = i / (LEAF_COUNT - 1); // 0 (inner/top) to 1 (outer/lower)
    const angle = i * GOLDEN_ANGLE + 0.35;

    // Height and radial spread
    const heightFactor = 1.0 - t * 0.58;
    const leafY = SOIL_Y + 0.12 + heightFactor * (PLANT_H - SOIL_Y - 0.16);
    const spreadR = 0.04 + t * 0.20 + Math.sin(i * 1.7) * 0.02;

    const baseX = Math.cos(angle) * 0.025 * (0.4 + t * 0.6);
    const baseZ = Math.sin(angle) * 0.025 * (0.4 + t * 0.6);

    const tipX = Math.cos(angle) * spreadR;
    const tipZ = Math.sin(angle) * spreadR;

    // Curved stem from soil to leaf base
    const midX = (baseX + tipX) * 0.45;
    const midZ = (baseZ + tipZ) * 0.45;
    const midY = SOIL_Y + (leafY - SOIL_Y) * 0.58;

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(baseX, SOIL_Y - 0.01, baseZ),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(tipX, leafY, tipZ),
    ]);

    const stemRadius = 0.0045 + (1 - t * 0.4) * 0.0025;
    const stemGeo = new THREE.TubeGeometry(stemCurve, 10, stemRadius, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = `monstera_stem_${i + 1}`;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    // Leaf attached at stem tip
    const geoIdx = i < 10 ? 0 : i < 15 ? 1 : 2;
    const matIdx = i % leafMats.length;
    const leafMesh = new THREE.Mesh(leafGeos[geoIdx], leafMats[matIdx]);
    leafMesh.name = `monstera_leaf_${i + 1}`;

    const leafScale = 0.55 + (1 - t * 0.45) * 0.45 + Math.cos(i * 2.1) * 0.06;
    leafMesh.scale.set(leafScale, leafScale, 1);

    leafMesh.position.set(tipX, leafY, tipZ);

    // Orient leaf outward along its stem angle and tilt downward slightly
    const leafGroupRotY = -angle + Math.PI / 2;
    const droopPitch = 0.65 + t * 0.55 + Math.sin(i * 1.3) * 0.12;
    const roll = Math.sin(i * 2.7) * 0.18;

    leafMesh.rotation.order = 'YXZ';
    leafMesh.rotation.y = leafGroupRotY;
    leafMesh.rotation.x = droopPitch;
    leafMesh.rotation.z = roll;

    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    group.add(leafMesh);
  }

  return group;
}
