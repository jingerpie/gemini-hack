function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.24;
  const POT_TOP_R = 0.135;
  const POT_BOT_R = 0.105;
  const RIM_H = 0.032;
  const RIM_R = 0.142;
  const SOIL_Y = 0.215;
  const TRUNK_H = 0.72;
  const LEAF_COUNT = 14;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xc8beb0,
    roughness: 0.72,
    metalness: 0.02
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c20,
    roughness: 0.95,
    metalness: 0.0
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6b533b,
    roughness: 0.88,
    metalness: 0.0
  });

  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x4a6b32, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x567d3b, roughness: 0.45, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x3e5c29, roughness: 0.48, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x638c45, roughness: 0.40, metalness: 0.02 })
  ];

  // Pot body
  const potGeo = new THREE.CylinderGeometry(POT_TOP_R, POT_BOT_R, POT_H, 28);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.name = 'pot_body';
  pot.position.y = POT_H / 2;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // Pot rim
  const rimGeo = new THREE.CylinderGeometry(RIM_R, RIM_R * 0.98, RIM_H, 28);
  const rim = new THREE.Mesh(rimGeo, potMat);
  rim.name = 'pot_rim';
  rim.position.y = POT_H - RIM_H / 2;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R * 0.94, POT_TOP_R * 0.92, 0.02, 24);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.name = 'pot_soil';
  soil.position.y = SOIL_Y;
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  // Trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, SOIL_Y - 0.02, 0),
    new THREE.Vector3(-0.008, SOIL_Y + 0.18, 0.005),
    new THREE.Vector3(0.010, SOIL_Y + 0.38, -0.006),
    new THREE.Vector3(-0.005, SOIL_Y + 0.56, 0.004),
    new THREE.Vector3(0.002, SOIL_Y + TRUNK_H, 0)
  ]);

  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.012, 8, false);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.name = 'main_trunk';
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Fiddle-leaf shape
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.12, 0.08, 0.22, 0.20, 0.18, 0.35);
  leafShape.bezierCurveTo(0.15, 0.45, 0.16, 0.50, 0.26, 0.62);
  leafShape.bezierCurveTo(0.36, 0.75, 0.32, 0.92, 0.12, 0.98);
  leafShape.bezierCurveTo(0.05, 1.00, 0.02, 1.00, 0, 0.99);
  leafShape.bezierCurveTo(-0.02, 1.00, -0.05, 1.00, -0.12, 0.98);
  leafShape.bezierCurveTo(-0.32, 0.92, -0.36, 0.75, -0.26, 0.62);
  leafShape.bezierCurveTo(-0.16, 0.50, -0.15, 0.45, -0.18, 0.35);
  leafShape.bezierCurveTo(-0.22, 0.20, -0.12, 0.08, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 10
  });

  // Leaves arranged spirally along upper trunk
  const goldenAngle = 2.39996323;
  for (let i = 0; i < LEAF_COUNT; i++) {
    const frac = i / (LEAF_COUNT - 1);
    const t = 0.42 + frac * 0.56;
    const attachPt = trunkCurve.getPointAt(t);

    const leafPivot = new THREE.Group();
    leafPivot.position.copy(attachPt);
    leafPivot.rotation.y = i * goldenAngle + 0.4;

    const petioleLen = 0.055 + (1 - frac) * 0.025;
    const elevation = 0.25 + frac * 0.85; // lower leaves flatter, top leaves upright
    const leafScale = 0.22 + Math.sin(frac * Math.PI * 0.85) * 0.11 + frac * 0.05;

    // Petiole
    const petioleGeo = new THREE.CylinderGeometry(0.003, 0.0045, petioleLen, 6);
    const petiole = new THREE.Mesh(petioleGeo, trunkMat);
    petiole.name = `leaf_petiole_${i + 1}`;
    petiole.rotation.x = Math.PI / 2 - elevation * 0.6;
    petiole.position.set(
      0,
      Math.sin(elevation * 0.6) * (petioleLen * 0.5),
      Math.cos(elevation * 0.6) * (petioleLen * 0.5)
    );
    petiole.castShadow = true;
    petiole.receiveShadow = true;
    leafPivot.add(petiole);

    // Leaf blade
    const blade = new THREE.Mesh(leafGeo, leafMats[i % leafMats.length]);
    blade.name = `leaf_blade_${i + 1}`;
    blade.scale.set(leafScale, leafScale, 1);
    blade.position.set(
      0,
      Math.sin(elevation * 0.6) * (petioleLen * 0.95),
      Math.cos(elevation * 0.6) * (petioleLen * 0.95)
    );
    blade.rotation.x = Math.PI / 2 - elevation;
    blade.rotation.z = Math.sin(i * 1.7) * 0.12;
    blade.castShadow = true;
    blade.receiveShadow = true;
    leafPivot.add(blade);

    group.add(leafPivot);
  }

  return group;
}
