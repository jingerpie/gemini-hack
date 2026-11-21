function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2; // 0.15
  const DEPTH = 0.075;
  const CENTER_Y = RADIUS; // 0.15
  const RING_MAJOR_R = 0.105;
  const RING_TUBE_R = 0.028;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x4a573e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x6b7a5e,
    roughness: 0.75,
    metalness: 0.0,
  });

  const leafMatDark = new THREE.MeshStandardMaterial({
    color: 0x546248,
    roughness: 0.8,
    metalness: 0.0,
  });

  const roseMat = new THREE.MeshStandardMaterial({
    color: 0xe8dfd1,
    roughness: 0.65,
    metalness: 0.0,
  });

  const blossomMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.7,
    metalness: 0.0,
  });

  // 1. Base wreath ring (flattened slightly on the back to sit flush against wall)
  const baseGeo = new THREE.TorusGeometry(RING_MAJOR_R, RING_TUBE_R, 14, 32);
  const baseRing = new THREE.Mesh(baseGeo, baseMat);
  baseRing.name = 'wreath_base_ring';
  baseRing.scale.set(1, 1, 0.75);
  baseRing.position.set(0, CENTER_Y, -DEPTH / 2 + RING_TUBE_R * 0.75);
  baseRing.castShadow = true;
  baseRing.receiveShadow = true;
  group.add(baseRing);

  // 2. Rose geometry (cup-shaped lathe profile)
  const rosePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.010, 0.002),
    new THREE.Vector2(0.017, 0.008),
    new THREE.Vector2(0.019, 0.015),
    new THREE.Vector2(0.015, 0.019),
    new THREE.Vector2(0.008, 0.016),
    new THREE.Vector2(0.004, 0.018),
    new THREE.Vector2(0.0, 0.014),
  ];
  const roseGeo = new THREE.LatheGeometry(rosePoints, 16);

  // Place 16 roses around the ring
  const roseCount = 16;
  for (let i = 0; i < roseCount; i++) {
    const angle = (i / roseCount) * Math.PI * 2 + (i % 2 === 0 ? 0.08 : -0.06);
    const rOffset = RING_MAJOR_R + (i % 3 === 0 ? 0.012 : i % 3 === 1 ? -0.010 : 0.002);
    const rx = Math.cos(angle) * rOffset;
    const ry = CENTER_Y + Math.sin(angle) * rOffset;
    const rz = -DEPTH / 2 + RING_TUBE_R * 1.35 + (i % 2) * 0.006;

    const rose = new THREE.Mesh(roseGeo, roseMat);
    rose.name = `rose_${String(i + 1).padStart(2, '0')}`;
    const s = 0.85 + (i % 3) * 0.14;
    rose.scale.set(s, s, s);
    rose.position.set(rx, ry, rz);
    // Orient rose cup to face +Z with slight outward tilt
    rose.rotation.x = Math.PI / 2 - Math.sin(angle) * 0.25;
    rose.rotation.z = -Math.cos(angle) * 0.25;
    rose.castShadow = true;
    rose.receiveShadow = true;
    group.add(rose);
  }

  // 3. Hydrangea / small blossom clusters (10 clusters)
  const blossomGeo = new THREE.SphereGeometry(0.014, 10, 8);
  const blossomCount = 10;
  for (let i = 0; i < blossomCount; i++) {
    const angle = (i / blossomCount) * Math.PI * 2 + 0.18;
    const rOffset = RING_MAJOR_R + (i % 2 === 0 ? -0.014 : 0.015);
    const bx = Math.cos(angle) * rOffset;
    const by = CENTER_Y + Math.sin(angle) * rOffset;
    const bz = -DEPTH / 2 + RING_TUBE_R * 1.2 + (i % 2) * 0.008;

    const cluster = new THREE.Mesh(blossomGeo, blossomMat);
    cluster.name = `blossom_cluster_${String(i + 1).padStart(2, '0')}`;
    cluster.scale.set(1.2, 1.0, 0.85);
    cluster.position.set(bx, by, bz);
    cluster.rotation.z = angle;
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    group.add(cluster);
  }

  // 4. Eucalyptus leaves (12 leaves around outer & inner perimeter, defining 0.30m diameter)
  const leafGeo = new THREE.SphereGeometry(0.018, 10, 8);
  const leafCount = 12;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    // Outer leaves reach RADIUS (0.15m)
    const rOffset = isOuter ? RADIUS - 0.016 : RING_MAJOR_R - RING_TUBE_R - 0.006;
    const lx = Math.cos(angle) * rOffset;
    const ly = CENTER_Y + Math.sin(angle) * rOffset;
    const lz = -DEPTH / 2 + RING_TUBE_R * 0.85 + (i % 3) * 0.005;

    const leaf = new THREE.Mesh(leafGeo, i % 3 === 0 ? leafMatDark : leafMat);
    leaf.name = `eucalyptus_leaf_${String(i + 1).padStart(2, '0')}`;
    leaf.scale.set(0.85, 1.15, 0.18);
    leaf.position.set(lx, ly, lz);
    leaf.rotation.z = angle - Math.PI / 2;
    leaf.rotation.x = isOuter ? 0.2 : -0.25;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  return group;
}
