function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters
  const W = 0.58;
  const H = 0.58;
  const D = 0.14;
  const CENTER_Y = H / 2;
  const RING_R = 0.20;
  const TUBE_R = 0.052;
  const BACK_Z = -D / 2;

  // Materials (sandstone variations)
  const stoneBaseMat = new THREE.MeshStandardMaterial({
    color: 0xb59a78,
    roughness: 0.9,
    metalness: 0.02
  });
  const stoneLeafMat = new THREE.MeshStandardMaterial({
    color: 0xc6ad8b,
    roughness: 0.86,
    metalness: 0.02
  });
  const stoneBerryMat = new THREE.MeshStandardMaterial({
    color: 0xd1b998,
    roughness: 0.82,
    metalness: 0.02
  });

  // Base wreath ring (flattened slightly on Z for wall mounting)
  const torusGeo = new THREE.TorusGeometry(RING_R, TUBE_R, 16, 32);
  const baseRing = new THREE.Mesh(torusGeo, stoneBaseMat);
  baseRing.name = "wreath_base_ring";
  baseRing.scale.set(1, 1, 0.72);
  baseRing.position.set(0, CENTER_Y, BACK_Z + TUBE_R * 0.72);
  baseRing.castShadow = true;
  baseRing.receiveShadow = true;
  group.add(baseRing);

  // Sculpted leaf geometry
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.026, 0.032, 0.018, 0.075);
  leafShape.quadraticCurveTo(0.006, 0.098, 0, 0.112);
  leafShape.quadraticCurveTo(-0.006, 0.098, -0.018, 0.075);
  leafShape.quadraticCurveTo(-0.026, 0.032, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.005,
    bevelThickness: 0.006
  });
  leafGeo.center();

  // Place 22 overlapping leaves around the ring
  const leafCount = 22;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const rOffset = isOuter ? RING_R + 0.022 : RING_R - 0.015;
    const zOffset = isOuter ? 0.012 : 0.028;

    const leaf = new THREE.Mesh(leafGeo, stoneLeafMat);
    leaf.name = `sandstone_leaf_${i + 1}`;

    const x = Math.cos(angle) * rOffset;
    const y = CENTER_Y + Math.sin(angle) * rOffset;
    const z = BACK_Z + TUBE_R * 0.72 + zOffset;

    leaf.position.set(x, y, z);

    // Orient leaf tangent to the ring, tilted outward and forward
    leaf.rotation.z = angle - Math.PI / 2 + (isOuter ? -0.35 : 0.28);
    leaf.rotation.x = isOuter ? 0.25 : 0.42;
    leaf.rotation.y = (i % 3 - 1) * 0.18;

    const scale = isOuter ? 1.0 : 0.85;
    leaf.scale.set(scale, scale, scale);

    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  // Place 14 berry spheres in clusters along the inner/mid ring
  const berryGeo = new THREE.SphereGeometry(0.016, 12, 10);
  const berryAngles = [
    0.15, 0.32, 0.95, 1.12, 1.85, 2.05, 2.75,
    2.92, 3.65, 3.85, 4.45, 4.65, 5.35, 5.55
  ];

  for (let i = 0; i < berryAngles.length; i++) {
    const angle = berryAngles[i];
    const rOffset = RING_R - 0.018 + (i % 2) * 0.022;
    const berry = new THREE.Mesh(berryGeo, stoneBerryMat);
    berry.name = `sandstone_berry_${i + 1}`;

    const x = Math.cos(angle) * rOffset;
    const y = CENTER_Y + Math.sin(angle) * rOffset;
    const z = BACK_Z + TUBE_R * 0.72 + 0.036 + (i % 2) * 0.01;

    berry.position.set(x, y, z);
    const s = 0.85 + (i % 3) * 0.15;
    berry.scale.set(s, s, s);

    berry.castShadow = true;
    berry.receiveShadow = true;
    group.add(berry);
  }

  return group;
}
