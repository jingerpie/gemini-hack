function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.56; // overall width
  const H = 0.56; // overall height
  const D = 0.085; // overall depth (front-to-back)
  const RING_R = 0.205; // major radius of wreath core
  const RING_TUBE = 0.032; // minor radius of wreath core
  const Z_BACK = -D / 2;
  const CENTER_Y = H / 2;

  // Materials
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b,
    roughness: 0.85,
    metalness: 0.0
  });
  const woodLightMat = new THREE.MeshStandardMaterial({
    color: 0xb88450,
    roughness: 0.55,
    metalness: 0.02
  });
  const woodMedMat = new THREE.MeshStandardMaterial({
    color: 0x9c6334,
    roughness: 0.55,
    metalness: 0.02
  });
  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: 0x734222,
    roughness: 0.58,
    metalness: 0.02
  });
  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x264223,
    roughness: 0.78,
    metalness: 0.0
  });
  const redBerryMat = new THREE.MeshPhysicalMaterial({
    color: 0x8c161c,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2
  });
  const creamBerryMat = new THREE.MeshStandardMaterial({
    color: 0xdfd4b4,
    roughness: 0.45,
    metalness: 0.0
  });

  // Base wreath ring (flattened on the back)
  const coreGeo = new THREE.TorusGeometry(RING_R, RING_TUBE, 12, 32);
  coreGeo.scale(1, 1, 0.38);
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.set(0, CENTER_Y, Z_BACK + RING_TUBE * 0.38);
  coreMesh.name = 'wreath_base_ring';
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // Carved oak/chestnut leaf shape
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.022, 0.015, 0.032, 0.035);
  leafShape.quadraticCurveTo(0.018, 0.042, 0.015, 0.048);
  leafShape.quadraticCurveTo(0.034, 0.062, 0.038, 0.082);
  leafShape.quadraticCurveTo(0.020, 0.088, 0.016, 0.095);
  leafShape.quadraticCurveTo(0.028, 0.112, 0.022, 0.130);
  leafShape.quadraticCurveTo(0.010, 0.145, 0.0, 0.160);
  leafShape.quadraticCurveTo(-0.010, 0.145, -0.022, 0.130);
  leafShape.quadraticCurveTo(-0.028, 0.112, -0.016, 0.095);
  leafShape.quadraticCurveTo(-0.020, 0.088, -0.038, 0.082);
  leafShape.quadraticCurveTo(-0.034, 0.062, -0.015, 0.048);
  leafShape.quadraticCurveTo(-0.018, 0.042, -0.032, 0.035);
  leafShape.quadraticCurveTo(-0.022, 0.015, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });

  const leafMats = [woodLightMat, woodMedMat, woodDarkMat];
  const leafCount = 15;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + 0.15;
    const radialOffset = (i % 2 === 0) ? 0.012 : -0.012;
    const r = RING_R + radialOffset;
    const x = Math.cos(angle) * r;
    const y = CENTER_Y + Math.sin(angle) * r;
    const z = Z_BACK + 0.022 + (i % 3) * 0.006;

    const leaf = new THREE.Mesh(leafGeo, leafMats[i % 3]);
    leaf.position.set(x, y, z);
    // Orient leaf tangentially around the ring, slightly outward
    const tangentAngle = angle + Math.PI / 2 + ((i % 2 === 0) ? -0.35 : 0.25);
    leaf.rotation.set(0.18, ((i % 2 === 0) ? 0.15 : -0.15), tangentAngle - Math.PI / 2);
    const s = 0.88 + (i % 3) * 0.08;
    leaf.scale.set(s, s, 1);
    leaf.name = `chestnut_leaf_${i + 1}`;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  // Pine needle sprig shape
  const sprigShape = new THREE.Shape();
  sprigShape.moveTo(-0.004, 0);
  sprigShape.lineTo(-0.038, 0.035);
  sprigShape.lineTo(-0.010, 0.032);
  sprigShape.lineTo(-0.045, 0.068);
  sprigShape.lineTo(-0.012, 0.065);
  sprigShape.lineTo(-0.036, 0.102);
  sprigShape.lineTo(-0.008, 0.098);
  sprigShape.lineTo(0, 0.132);
  sprigShape.lineTo(0.008, 0.098);
  sprigShape.lineTo(0.036, 0.102);
  sprigShape.lineTo(0.012, 0.065);
  sprigShape.lineTo(0.045, 0.068);
  sprigShape.lineTo(0.010, 0.032);
  sprigShape.lineTo(0.038, 0.035);
  sprigShape.lineTo(0.004, 0);
  sprigShape.closePath();

  const sprigGeo = new THREE.ExtrudeGeometry(sprigShape, {
    depth: 0.004,
    bevelEnabled: false
  });

  const sprigCount = 8;
  for (let i = 0; i < sprigCount; i++) {
    const angle = (i / sprigCount) * Math.PI * 2 + 0.35;
    const isOuter = i % 2 === 0;
    const r = RING_R + (isOuter ? 0.02 : -0.025);
    const x = Math.cos(angle) * r;
    const y = CENTER_Y + Math.sin(angle) * r;
    const z = Z_BACK + 0.012 + (i % 2) * 0.005;

    const sprig = new THREE.Mesh(sprigGeo, pineMat);
    sprig.position.set(x, y, z);
    const outAngle = angle + (isOuter ? -0.35 : 2.55);
    sprig.rotation.set(0.12, 0, outAngle - Math.PI / 2);
    sprig.name = `pine_sprig_${i + 1}`;
    sprig.castShadow = true;
    sprig.receiveShadow = true;
    group.add(sprig);
  }

  // Berries (red and cream clusters)
  const berryGeo = new THREE.SphereGeometry(0.014, 14, 12);
  const berrySpecs = [
    // [angle, radialOffset, zOffset, isRed]
    [0.42, 0.015, 0.056, true],
    [0.49, -0.005, 0.052, true],
    [1.15, 0.010, 0.058, false],
    [1.24, -0.012, 0.054, false],
    [2.05, 0.008, 0.056, true],
    [2.13, -0.010, 0.052, true],
    [2.75, 0.014, 0.058, false],
    [2.84, -0.008, 0.054, false],
    [3.55, 0.012, 0.056, true],
    [3.63, -0.010, 0.052, true],
    [4.35, 0.010, 0.058, false],
    [4.44, -0.012, 0.054, false],
    [5.15, 0.014, 0.056, true],
    [5.23, -0.006, 0.052, true]
  ];

  for (let i = 0; i < berrySpecs.length; i++) {
    const [ang, rOff, zOff, isRed] = berrySpecs[i];
    const r = RING_R + rOff;
    const x = Math.cos(ang) * r;
    const y = CENTER_Y + Math.sin(ang) * r;
    const z = Z_BACK + zOff;

    const berry = new THREE.Mesh(berryGeo, isRed ? redBerryMat : creamBerryMat);
    berry.position.set(x, y, z);
    berry.name = isRed ? `red_berry_${i + 1}` : `cream_berry_${i + 1}`;
    berry.castShadow = true;
    berry.receiveShadow = true;
    group.add(berry);
  }

  return group;
}
