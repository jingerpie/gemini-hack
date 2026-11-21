function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.14;
  const POT_TOP_R = 0.076;
  const POT_BOT_R = 0.052;
  const RIM_H = 0.026;
  const RIM_R = 0.080;
  const SOIL_Y = 0.126;
  const SOIL_R = 0.071;
  const PLANT_H = 0.31;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x9c4c2f,
    roughness: 0.55,
    metalness: 0.02
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x261c15,
    roughness: 0.95,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x566436,
    roughness: 0.65,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshPhysicalMaterial({
      color: 0x2b5926,
      roughness: 0.28,
      metalness: 0.0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x35682d,
      roughness: 0.26,
      metalness: 0.0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x3f7535,
      roughness: 0.30,
      metalness: 0.0,
      clearcoat: 0.30,
      clearcoatRoughness: 0.28
    })
  ];

  // Pot via LatheGeometry
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(POT_BOT_R, 0.0),
    new THREE.Vector2(POT_BOT_R + 0.002, 0.006),
    new THREE.Vector2(POT_TOP_R - 0.002, POT_H - RIM_H),
    new THREE.Vector2(RIM_R, POT_H - RIM_H),
    new THREE.Vector2(RIM_R, POT_H - 0.003),
    new THREE.Vector2(RIM_R - 0.002, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.004, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.005, SOIL_Y - 0.01),
    new THREE.Vector2(0.0, SOIL_Y - 0.01)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'terracotta_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(SOIL_R, SOIL_R * 0.95, 0.02, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.01;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Leaf geometry (obovate fleshy shape)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.014, 0.008, 0.028, 0.028, 0.024, 0.048);
  leafShape.bezierCurveTo(0.020, 0.062, 0.008, 0.068, 0, 0.068);
  leafShape.bezierCurveTo(-0.008, 0.068, -0.020, 0.062, -0.024, 0.048);
  leafShape.bezierCurveTo(-0.028, 0.028, -0.014, 0.008, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0018,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 2,
    curveSegments: 10
  });
  leafGeo.rotateX(Math.PI / 2);

  // Stem configurations: [baseX, baseZ, topX, topY, topZ, leafCount]
  const stems = [
    [-0.018, 0.012, -0.055, PLANT_H, 0.025, 8],
    [0.022, 0.010, 0.058, PLANT_H - 0.015, 0.020, 8],
    [0.002, -0.020, 0.010, PLANT_H - 0.030, -0.048, 7],
    [-0.010, 0.024, -0.015, PLANT_H - 0.055, 0.055, 7],
    [0.015, -0.005, 0.032, PLANT_H - 0.045, -0.015, 6]
  ];

  const petioleGeo = new THREE.CylinderGeometry(0.0022, 0.0028, 0.016, 6);
  petioleGeo.translate(0, 0.008, 0);
  petioleGeo.rotateX(Math.PI / 2);

  for (let s = 0; s < stems.length; s++) {
    const [bx, bz, tx, ty, tz, leafCount] = stems[s];
    const midX = (bx + tx) * 0.5 + (s % 2 === 0 ? -0.01 : 0.01);
    const midY = (SOIL_Y + ty) * 0.52;
    const midZ = (bz + tz) * 0.5;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, SOIL_Y - 0.005, bz),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(tx, ty - 0.02, tz)
    ]);

    const stemGeo = new THREE.TubeGeometry(curve, 12, 0.0042, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = `stem_${s + 1}`;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    for (let l = 0; l < leafCount; l++) {
      const t = 0.18 + (l / (leafCount - 1)) * 0.80;
      const pos = curve.getPoint(t);
      const yaw = s * 1.3 + l * 2.35;
      const pitch = 0.35 + (1 - t) * 0.45;
      const scale = 0.72 + Math.sin(t * Math.PI) * 0.35;

      const leafGroup = new THREE.Group();
      leafGroup.position.copy(pos);
      leafGroup.rotation.order = 'YXZ';
      leafGroup.rotation.y = yaw;
      leafGroup.rotation.x = pitch;

      const petiole = new THREE.Mesh(petioleGeo, stemMat);
      petiole.name = `petiole_${s + 1}_${l + 1}`;
      petiole.castShadow = true;
      petiole.receiveShadow = true;
      leafGroup.add(petiole);

      const leafMat = leafMats[(s + l) % leafMats.length];
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.name = `leaf_${s + 1}_${l + 1}`;
      leafMesh.position.z = 0.013;
      leafMesh.rotation.x = -0.25;
      leafMesh.scale.set(scale, scale, scale);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      leafGroup.add(leafMesh);

      group.add(leafGroup);
    }
  }

  return group;
}
