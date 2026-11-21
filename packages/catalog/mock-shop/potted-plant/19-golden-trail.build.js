function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.135;
  const POT_BOT_R = 0.058;
  const POT_TOP_R = 0.078;
  const RIM_H = 0.018;
  const RIM_R = 0.083;
  const SOIL_Y = 0.122;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x63735e,
    roughness: 0.55,
    metalness: 0.02
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2b2017,
    roughness: 0.95,
    metalness: 0.0
  });
  const perliteMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.85,
    metalness: 0.0
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x6b8f3c,
    roughness: 0.6,
    metalness: 0.0
  });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x4d7a2c, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x7ca832, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0xc2cf5f, roughness: 0.45, metalness: 0.02 })
  ];

  // 1. Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(POT_BOT_R, 0.0),
    new THREE.Vector2(POT_BOT_R + 0.002, 0.006),
    new THREE.Vector2(POT_TOP_R - 0.003, POT_H - RIM_H),
    new THREE.Vector2(RIM_R, POT_H - RIM_H),
    new THREE.Vector2(RIM_R, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.004, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.005, SOIL_Y - 0.01),
    new THREE.Vector2(0.0, SOIL_Y - 0.01)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 28);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'nursery_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil disc
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R - 0.004, POT_TOP_R - 0.006, 0.014, 24);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y - 0.005;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Perlite specks on soil surface
  const perliteGeo = new THREE.SphereGeometry(0.0028, 6, 5);
  for (let i = 0; i < 10; i++) {
    const angle = i * 2.39996;
    const rad = 0.015 + ((i * 17) % 10) * 0.0048;
    const speck = new THREE.Mesh(perliteGeo, perliteMat);
    speck.name = `soil_perlite_${i}`;
    speck.position.set(Math.cos(angle) * rad, SOIL_Y + 0.001, Math.sin(angle) * rad);
    speck.scale.set(1.2, 0.6, 0.9);
    speck.castShadow = true;
    speck.receiveShadow = true;
    group.add(speck);
  }

  // 3. Leaf Geometry (Heart-shaped pothos leaf)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(-0.028, -0.006, -0.042, 0.025, -0.028, 0.055);
  leafShape.bezierCurveTo(-0.018, 0.075, -0.005, 0.088, 0, 0.095);
  leafShape.bezierCurveTo(0.005, 0.088, 0.018, 0.075, 0.028, 0.055);
  leafShape.bezierCurveTo(0.042, 0.025, 0.028, -0.006, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0018,
    bevelEnabled: false,
    curveSegments: 8
  });
  leafGeo.rotateX(Math.PI / 2);

  // Helper to add a stem + leaf
  function addStemAndLeaf(namePrefix, start, end, leafScale, yaw, pitch, roll, matIdx) {
    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(
        (start.x + end.x) * 0.5,
        Math.max(start.y, end.y) + 0.015,
        (start.z + end.z) * 0.5
      ),
      end
    ]);
    const stemGeo = new THREE.TubeGeometry(curve, 8, 0.0024, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = `${namePrefix}_stem`;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    group.add(stemMesh);

    const leafMesh = new THREE.Mesh(leafGeo, leafMats[matIdx % leafMats.length]);
    leafMesh.name = `${namePrefix}_leaf`;
    leafMesh.position.copy(end);
    leafMesh.rotation.order = 'YXZ';
    leafMesh.rotation.set(pitch, yaw, roll);
    leafMesh.scale.set(leafScale, 1, leafScale);
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    group.add(leafMesh);
  }

  // 4. Upright & arching crown leaves
  const crownCount = 20;
  for (let i = 0; i < crownCount; i++) {
    const t = i / crownCount;
    const angle = i * 2.39996 + 0.4; // golden angle
    const baseR = 0.008 + (i % 4) * 0.011;
    const spreadR = 0.035 + (i % 5) * 0.022;
    const height = 0.055 + ((i * 7) % 10) * 0.011;

    const start = new THREE.Vector3(
      Math.cos(angle) * baseR,
      SOIL_Y - 0.002,
      Math.sin(angle) * baseR
    );
    const end = new THREE.Vector3(
      Math.cos(angle) * spreadR,
      SOIL_Y + height,
      Math.sin(angle) * spreadR
    );

    const leafScale = 0.68 + (i % 4) * 0.12;
    const yaw = -angle + Math.PI / 2;
    const pitch = 0.25 + (i % 3) * 0.22;
    const roll = ((i % 2 === 0 ? 1 : -1) * 0.15);

    addStemAndLeaf(`crown_${i}`, start, end, leafScale, yaw, pitch, roll, i);
  }

  // 5. Prominent trailing vine cascading to -X, +Z
  const vinePoints = [
    new THREE.Vector3(-0.025, SOIL_Y, 0.02),
    new THREE.Vector3(-0.068, SOIL_Y + 0.015, 0.045),
    new THREE.Vector3(-0.105, SOIL_Y - 0.015, 0.075),
    new THREE.Vector3(-0.145, SOIL_Y - 0.065, 0.105),
    new THREE.Vector3(-0.185, SOIL_Y - 0.095, 0.135)
  ];
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineGeo = new THREE.TubeGeometry(vineCurve, 20, 0.0028, 6, false);
  const vineMesh = new THREE.Mesh(vineGeo, stemMat);
  vineMesh.name = 'trailing_vine_main';
  vineMesh.castShadow = true;
  vineMesh.receiveShadow = true;
  group.add(vineMesh);

  // Leaves along the trailing vine
  const vineNodes = [
    { u: 0.22, dx: -0.025, dy: 0.035, dz: -0.01, scale: 0.85, yaw: -2.1, pitch: 0.45, roll: 0.2, mat: 1 },
    { u: 0.42, dx: -0.035, dy: 0.015, dz: 0.02, scale: 0.92, yaw: -2.6, pitch: 0.55, roll: -0.15, mat: 2 },
    { u: 0.58, dx: 0.015, dy: -0.01, dz: 0.035, scale: 0.88, yaw: -1.4, pitch: 0.5, roll: 0.1, mat: 0 },
    { u: 0.74, dx: -0.04, dy: 0.01, dz: -0.015, scale: 0.82, yaw: -2.8, pitch: 0.6, roll: -0.2, mat: 1 },
    { u: 0.88, dx: -0.03, dy: -0.015, dz: 0.015, scale: 0.78, yaw: -2.3, pitch: 0.65, roll: 0.15, mat: 2 },
    { u: 1.0, dx: -0.02, dy: -0.015, dz: 0.02, scale: 0.85, yaw: -2.0, pitch: 0.7, roll: 0.0, mat: 1 }
  ];

  for (let i = 0; i < vineNodes.length; i++) {
    const n = vineNodes[i];
    const start = vineCurve.getPoint(n.u);
    const end = new THREE.Vector3(start.x + n.dx, start.y + n.dy, start.z + n.dz);
    addStemAndLeaf(`vine_${i}`, start, end, n.scale, n.yaw, n.pitch, n.roll, n.mat);
  }

  return group;
}
