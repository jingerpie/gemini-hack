function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.16;
  const POT_BOT_R = 0.075;
  const POT_TOP_R = 0.102;
  const POT_RIM_R = 0.11;
  const POT_RIM_H = 0.026;
  const SOIL_Y = POT_H - 0.015;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x8f4729,
    roughness: 0.62,
    metalness: 0.02
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2b1e16,
    roughness: 0.95,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2d6a27, roughness: 0.55, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x3b7d2c, roughness: 0.52, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x4c9134, roughness: 0.48, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x5ca33d, roughness: 0.45, metalness: 0.0 })
  ];

  // 1. Pot (LatheGeometry with rim and base lip)
  const potPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(POT_BOT_R - 0.004, 0),
    new THREE.Vector2(POT_BOT_R, 0.008),
    new THREE.Vector2(POT_TOP_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H - POT_RIM_H + 0.003),
    new THREE.Vector2(POT_RIM_R + 0.002, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.006, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.008, SOIL_Y - 0.01),
    new THREE.Vector2(0, SOIL_Y - 0.01)
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.name = 'terracotta_pot';
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // 2. Soil mound
  const soilGeo = new THREE.SphereGeometry(POT_TOP_R - 0.006, 24, 12);
  soilGeo.scale(1, 0.22, 1);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.name = 'potting_soil';
  soilMesh.position.y = SOIL_Y;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // Helper to build a pinnate fern frond geometry with a natural arch
  function createFrondGeometry(length, width, archDrop, pinnaeCount) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);

    // Right side pinnae (lobes)
    for (let i = 0; i < pinnaeCount; i++) {
      const t0 = i / pinnaeCount;
      const t1 = (i + 0.5) / pinnaeCount;
      const t2 = (i + 1) / pinnaeCount;
      const y0 = t0 * length;
      const y1 = t1 * length;
      const y2 = t2 * length;

      // Envelope: narrow at base, widest around 35%, tapering to tip
      const env = Math.sin(Math.pow(t1, 0.75) * Math.PI);
      const w = width * (0.18 + 0.82 * env);

      shape.lineTo(0.0025, y0);
      shape.lineTo(w, y1);
      shape.lineTo(0.0025, y2);
    }

    // Tip
    shape.lineTo(0, length + 0.008);

    // Left side pinnae
    for (let i = pinnaeCount - 1; i >= 0; i--) {
      const t0 = (i + 1) / pinnaeCount;
      const t1 = (i + 0.5) / pinnaeCount;
      const t2 = i / pinnaeCount;
      const y0 = t0 * length;
      const y1 = t1 * length;
      const y2 = t2 * length;

      const env = Math.sin(Math.pow(t1, 0.75) * Math.PI);
      const w = width * (0.18 + 0.82 * env);

      shape.lineTo(-0.0025, y0);
      shape.lineTo(-w, y1);
      shape.lineTo(-0.0025, y2);
    }

    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0018,
      bevelEnabled: false,
      curveSegments: 2
    });

    // Bend vertices along a parabolic arch in Z-Y plane
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = Math.max(0, Math.min(1, y / length));

      // Arch outward (+Z) and droop (-Y)
      const archZ = z + Math.sin(t * Math.PI * 0.65) * length * 0.45 + t * t * length * 0.25;
      const archY = y - t * t * archDrop;
      // Slight V-fold on pinnae
      const foldZ = archZ - Math.abs(x) * 0.15;

      pos.setXYZ(i, x, archY, foldZ);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Deterministic phyllotaxis spiral for fronds
  const GOLDEN_ANGLE = 2.3999632;

  // Tier 1: Outer drooping fronds
  const outerCount = 14;
  for (let i = 0; i < outerCount; i++) {
    const angle = i * GOLDEN_ANGLE;
    const len = 0.26 + (i % 3) * 0.025;
    const wid = 0.032 + (i % 2) * 0.004;
    const drop = 0.14 + (i % 3) * 0.02;
    const geo = createFrondGeometry(len, wid, drop, 18);
    const mat = leafMats[i % 2];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `fern_frond_outer_${i + 1}`;
    mesh.position.set(
      Math.sin(angle) * 0.03,
      SOIL_Y + 0.005,
      Math.cos(angle) * 0.03
    );
    mesh.rotation.y = angle;
    mesh.rotation.x = 0.55 + (i % 3) * 0.08;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Tier 2: Middle arching fronds
  const midCount = 14;
  for (let i = 0; i < midCount; i++) {
    const angle = (i + outerCount) * GOLDEN_ANGLE + 0.3;
    const len = 0.24 + (i % 3) * 0.02;
    const wid = 0.03 + (i % 2) * 0.004;
    const drop = 0.09 + (i % 2) * 0.02;
    const geo = createFrondGeometry(len, wid, drop, 16);
    const mat = leafMats[1 + (i % 2)];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `fern_frond_mid_${i + 1}`;
    mesh.position.set(
      Math.sin(angle) * 0.02,
      SOIL_Y + 0.01,
      Math.cos(angle) * 0.02
    );
    mesh.rotation.y = angle;
    mesh.rotation.x = 0.28 + (i % 3) * 0.07;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Tier 3: Inner upright fronds
  const innerCount = 10;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i + outerCount + midCount) * GOLDEN_ANGLE + 0.6;
    const len = 0.17 + (i % 3) * 0.025;
    const wid = 0.024 + (i % 2) * 0.003;
    const drop = 0.04 + (i % 2) * 0.015;
    const geo = createFrondGeometry(len, wid, drop, 14);
    const mat = leafMats[2 + (i % 2)];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `fern_frond_inner_${i + 1}`;
    mesh.position.set(
      Math.sin(angle) * 0.01,
      SOIL_Y + 0.012,
      Math.cos(angle) * 0.01
    );
    mesh.rotation.y = angle;
    mesh.rotation.x = 0.08 + (i % 3) * 0.06;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}
