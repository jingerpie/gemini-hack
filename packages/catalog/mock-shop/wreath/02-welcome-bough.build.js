function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.35;
  const RADIUS = DIAMETER / 2; // 0.175
  const DEPTH = 0.085;
  const CENTER_Y = RADIUS; // 0.175

  // Core torus dimensions
  const RING_MAJOR_R = 0.122;
  const RING_TUBE_R = 0.028;

  // Materials
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1f3d23,
    roughness: 0.85,
    metalness: 0.0,
  });

  const foliageDarkMat = new THREE.MeshStandardMaterial({
    color: 0x162d1a,
    roughness: 0.9,
    metalness: 0.0,
  });

  const pineconeMat = new THREE.MeshStandardMaterial({
    color: 0x6b442a,
    roughness: 0.82,
    metalness: 0.0,
  });

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xede6d6,
    roughness: 0.92,
    metalness: 0.0,
  });

  // Helper to configure shadows
  function prepMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Base wreath core (flattened at the back so z >= -DEPTH/2)
  const coreGeo = new THREE.TorusGeometry(RING_MAJOR_R, RING_TUBE_R, 12, 32);
  coreGeo.scale(1, 1, 0.65);
  const coreMesh = prepMesh(new THREE.Mesh(coreGeo, foliageDarkMat), 'wreath_core');
  coreMesh.position.set(0, CENTER_Y, -DEPTH / 2 + RING_TUBE_R * 0.65);
  group.add(coreMesh);

  // 2. Foliage bough clusters around the ring (20 meshes)
  const BOUGH_COUNT = 20;
  const boughGeo = new THREE.ConeGeometry(0.036, 0.095, 7);
  boughGeo.rotateX(Math.PI / 2); // point along +Z initially

  for (let i = 0; i < BOUGH_COUNT; i++) {
    const angle = (i / BOUGH_COUNT) * Math.PI * 2;
    const isEven = i % 2 === 0;
    const mat = isEven ? foliageMat : foliageDarkMat;

    const bough = prepMesh(new THREE.Mesh(boughGeo, mat), `foliage_bough_${i + 1}`);

    // Position around the ring, keeping outermost tips within RADIUS (0.175)
    const rOffset = isEven ? RING_MAJOR_R + 0.006 : RING_MAJOR_R - 0.006;
    const bx = Math.cos(angle) * rOffset;
    const by = CENTER_Y + Math.sin(angle) * rOffset;
    const bz = -DEPTH / 2 + 0.028 + (isEven ? 0.008 : 0.0);

    bough.position.set(bx, by, bz);

    // Orient tangentially and slightly outward
    const tangentAngle = angle + Math.PI / 2;
    bough.rotation.set(
      isEven ? 0.25 : -0.15,
      isEven ? 0.2 : -0.2,
      tangentAngle + (isEven ? 0.25 : -0.2)
    );
    bough.scale.set(1.0, 0.75, 1.0);
    group.add(bough);
  }

  // 3. Pinecones (5 meshes using LatheGeometry for scalloped silhouette)
  const conePts = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.012, 0.004),
    new THREE.Vector2(0.016, 0.010),
    new THREE.Vector2(0.011, 0.013),
    new THREE.Vector2(0.018, 0.018),
    new THREE.Vector2(0.012, 0.021),
    new THREE.Vector2(0.016, 0.026),
    new THREE.Vector2(0.009, 0.030),
    new THREE.Vector2(0.011, 0.034),
    new THREE.Vector2(0.001, 0.038),
  ];
  const pineconeGeo = new THREE.LatheGeometry(conePts, 10);

  // Angles matching photo: ~10, ~8, ~6, ~4, ~2 o'clock
  const pineconeAngles = [
    (155 * Math.PI) / 180,
    (215 * Math.PI) / 180,
    (270 * Math.PI) / 180,
    (325 * Math.PI) / 180,
    (25 * Math.PI) / 180,
  ];

  pineconeAngles.forEach((ang, idx) => {
    const pc = prepMesh(new THREE.Mesh(pineconeGeo, pineconeMat), `pinecone_${idx + 1}`);
    const r = RING_MAJOR_R - 0.004;
    pc.position.set(
      Math.cos(ang) * r,
      CENTER_Y + Math.sin(ang) * r,
      0.012
    );
    pc.rotation.set(Math.PI / 2 - 0.25, 0, ang - Math.PI / 2);
    group.add(pc);
  });

  // 4. Linen Bow at top-center (5 meshes: knot, 2 loops, 2 swallowtail tails)
  const bowZ = 0.026;
  const bowY = CENTER_Y + RING_MAJOR_R - 0.008;

  // Center knot
  const knotGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.022, 12);
  const knot = prepMesh(new THREE.Mesh(knotGeo, ribbonMat), 'bow_knot');
  knot.position.set(0, bowY, bowZ + 0.006);
  knot.scale.set(1.0, 1.0, 0.7);
  group.add(knot);

  // Bow loops (left & right)
  const loopGeo = new THREE.TorusGeometry(0.024, 0.009, 8, 16);
  loopGeo.scale(1.45, 0.78, 0.55);

  const leftLoop = prepMesh(new THREE.Mesh(loopGeo, ribbonMat), 'bow_loop_left');
  leftLoop.position.set(-0.034, bowY + 0.004, bowZ);
  leftLoop.rotation.set(0.15, 0.2, -0.15);
  group.add(leftLoop);

  const rightLoop = prepMesh(new THREE.Mesh(loopGeo, ribbonMat), 'bow_loop_right');
  rightLoop.position.set(0.034, bowY + 0.004, bowZ);
  rightLoop.rotation.set(0.15, -0.2, 0.15);
  group.add(rightLoop);

  // Bow tails with swallowtail (V-notch) ends
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.008, 0);
  tailShape.lineTo(0.008, 0);
  tailShape.lineTo(0.016, -0.105);
  tailShape.lineTo(0.0, -0.092);
  tailShape.lineTo(-0.016, -0.105);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.003,
    bevelEnabled: false,
  });

  const leftTail = prepMesh(new THREE.Mesh(tailGeo, ribbonMat), 'bow_tail_left');
  leftTail.position.set(-0.008, bowY - 0.005, bowZ);
  leftTail.rotation.set(-0.08, 0.05, -0.22);
  group.add(leftTail);

  const rightTail = prepMesh(new THREE.Mesh(tailGeo, ribbonMat), 'bow_tail_right');
  rightTail.position.set(0.008, bowY - 0.005, bowZ);
  rightTail.rotation.set(-0.08, -0.05, 0.22);
  group.add(rightTail);

  return group;
}
