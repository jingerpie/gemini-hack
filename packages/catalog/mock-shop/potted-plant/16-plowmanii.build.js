function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.16;
  const POT_TOP_R = 0.092;
  const POT_BOT_R = 0.066;
  const POT_RIM_H = 0.024;
  const POT_RIM_R = 0.098;
  const SOIL_Y = 0.142;
  const TOTAL_H = 0.46;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x9e5438,
    roughness: 0.65,
    metalness: 0.05
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2e2118,
    roughness: 0.95,
    metalness: 0.0
  });
  const perliteMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c3,
    roughness: 0.85,
    metalness: 0.0
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5d823b,
    roughness: 0.55,
    metalness: 0.02
  });
  const leafMats = [
    new THREE.MeshPhysicalMaterial({
      color: 0x4f7b32,
      roughness: 0.45,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x5c893b,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x426b29,
      roughness: 0.48,
      metalness: 0.02,
      clearcoat: 0.12,
      clearcoatRoughness: 0.45
    })
  ];

  // 1. Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(POT_BOT_R, 0.0),
    new THREE.Vector2(POT_BOT_R + 0.002, 0.012),
    new THREE.Vector2(POT_TOP_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.005, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.006, SOIL_Y - 0.005),
    new THREE.Vector2(0.0, SOIL_Y - 0.005)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'nursery_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R - 0.005, POT_TOP_R - 0.008, 0.02, 28);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.005;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Perlite speckles on soil (deterministic)
  const perliteGeo = new THREE.SphereGeometry(0.0032, 6, 5);
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.39996; // golden angle
    const radius = 0.015 + ((i * 7) % 13) * 0.005;
    const pMesh = new THREE.Mesh(perliteGeo, perliteMat);
    pMesh.name = `soil_perlite_${i}`;
    pMesh.position.set(
      Math.cos(angle) * radius,
      SOIL_Y + 0.004,
      Math.sin(angle) * radius
    );
    pMesh.scale.set(1.0, 0.6, 0.9);
    pMesh.castShadow = true;
    pMesh.receiveShadow = true;
    group.add(pMesh);
  }

  // 3. Central Rhizome / Stem Base
  const baseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, SOIL_Y - 0.005, -0.01),
    new THREE.Vector3(0.0, SOIL_Y + 0.025, 0.0),
    new THREE.Vector3(0.008, SOIL_Y + 0.055, 0.008)
  ]);
  const baseGeo = new THREE.TubeGeometry(baseCurve, 10, 0.01, 10, false);
  const baseMesh = new THREE.Mesh(baseGeo, stemMat);
  baseMesh.name = 'plant_rhizome_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Heart-shaped leaf geometry helper
  function createHeartLeafGeometry(width, length) {
    const shape = new THREE.Shape();
    // Start at the sinus (notch between lobes) at (0, 0)
    shape.moveTo(0, 0);
    // Right lobe
    shape.bezierCurveTo(
      width * 0.18, length * 0.22,
      width * 0.55, length * 0.18,
      width * 0.5, -length * 0.15
    );
    // Right edge down to tip
    shape.bezierCurveTo(
      width * 0.45, -length * 0.5,
      width * 0.15, -length * 0.78,
      0, -length * 0.92
    );
    // Left edge up from tip
    shape.bezierCurveTo(
      -width * 0.15, -length * 0.78,
      -width * 0.45, -length * 0.5,
      -width * 0.5, -length * 0.15
    );
    // Left lobe back to sinus
    shape.bezierCurveTo(
      -width * 0.55, length * 0.18,
      -width * 0.18, length * 0.22,
      0, 0
    );

    const extrudeSettings = {
      depth: 0.0022,
      bevelEnabled: true,
      bevelThickness: 0.0008,
      bevelSize: 0.0008,
      bevelSegments: 2,
      curveSegments: 16
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  // 4. Leaves and Petioles configuration (matching photo silhouette)
  const leafConfigs = [
    // Large central upright leaf
    {
      name: 'leaf_center_large',
      start: [0.002, SOIL_Y + 0.035, 0.0],
      mid: [0.005, SOIL_Y + 0.16, -0.02],
      end: [0.0, TOTAL_H - 0.075, -0.015],
      width: 0.165,
      length: 0.19,
      rot: [-0.22, 0.04, 0.02],
      matIdx: 1
    },
    // Large left leaf
    {
      name: 'leaf_left_large',
      start: [-0.005, SOIL_Y + 0.03, 0.005],
      mid: [-0.065, SOIL_Y + 0.16, 0.015],
      end: [-0.115, TOTAL_H - 0.095, 0.025],
      width: 0.15,
      length: 0.18,
      rot: [-0.65, -0.35, -0.45],
      matIdx: 0
    },
    // Large right leaf
    {
      name: 'leaf_right_large',
      start: [0.008, SOIL_Y + 0.035, 0.008],
      mid: [0.065, SOIL_Y + 0.145, 0.02],
      end: [0.11, TOTAL_H - 0.135, 0.04],
      width: 0.145,
      length: 0.175,
      rot: [-0.72, 0.42, 0.48],
      matIdx: 2
    },
    // Small lower-left leaf
    {
      name: 'leaf_left_small',
      start: [-0.012, SOIL_Y + 0.015, -0.005],
      mid: [-0.045, SOIL_Y + 0.085, -0.01],
      end: [-0.075, SOIL_Y + 0.135, -0.015],
      width: 0.075,
      length: 0.09,
      rot: [-0.85, -0.3, -0.35],
      matIdx: 1
    },
    // Small lower-right leaf
    {
      name: 'leaf_right_small',
      start: [0.015, SOIL_Y + 0.015, 0.012],
      mid: [0.048, SOIL_Y + 0.07, 0.035],
      end: [0.075, SOIL_Y + 0.105, 0.055],
      width: 0.072,
      length: 0.085,
      rot: [-0.95, 0.25, 0.35],
      matIdx: 0
    },
    // Back-right filler leaf
    {
      name: 'leaf_back_medium',
      start: [0.005, SOIL_Y + 0.025, -0.015],
      mid: [0.045, SOIL_Y + 0.11, -0.045],
      end: [0.085, SOIL_Y + 0.175, -0.065],
      width: 0.105,
      length: 0.125,
      rot: [-0.8, 0.75, 0.35],
      matIdx: 2
    }
  ];

  leafConfigs.forEach((cfg, idx) => {
    // Petiole (stem)
    const pCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cfg.start[0], cfg.start[1], cfg.start[2]),
      new THREE.Vector3(cfg.mid[0], cfg.mid[1], cfg.mid[2]),
      new THREE.Vector3(cfg.end[0], cfg.end[1], cfg.end[2])
    ]);
    const petioleGeo = new THREE.TubeGeometry(pCurve, 14, 0.0045, 8, false);
    const petioleMesh = new THREE.Mesh(petioleGeo, stemMat);
    petioleMesh.name = `petiole_${idx}`;
    petioleMesh.castShadow = true;
    petioleMesh.receiveShadow = true;
    group.add(petioleMesh);

    // Leaf blade
    const leafGeo = createHeartLeafGeometry(cfg.width, cfg.length);
    const leafMesh = new THREE.Mesh(leafGeo, leafMats[cfg.matIdx]);
    leafMesh.name = cfg.name;
    leafMesh.position.set(cfg.end[0], cfg.end[1], cfg.end[2]);
    leafMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    group.add(leafMesh);
  });

  return group;
}
