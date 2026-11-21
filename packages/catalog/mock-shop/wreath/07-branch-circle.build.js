function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.35;
  const DEPTH = 0.065;
  const RING_RADIUS = 0.122;
  const STICK_COUNT = 34;
  const BACKING_TUBE = 0.004;

  const driftwoodMats = [
    new THREE.MeshStandardMaterial({ color: 0xb8a792, roughness: 0.9, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x9e8c76, roughness: 0.92, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0xc5b7a3, roughness: 0.88, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x877662, roughness: 0.94, metalness: 0.0 }),
  ];

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x4f463c,
    roughness: 0.85,
    metalness: 0.1,
  });

  const twineMat = new THREE.MeshStandardMaterial({
    color: 0xa69680,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Backing wire ring at the back plane
  const backingGeo = new THREE.TorusGeometry(RING_RADIUS, BACKING_TUBE, 8, 32);
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = "backing_ring";
  backingMesh.position.set(0, 0, -DEPTH * 0.42);
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  // Small twine hanging loop at the top
  const loopGeo = new THREE.TorusGeometry(0.011, 0.0022, 6, 16);
  const loopMesh = new THREE.Mesh(loopGeo, twineMat);
  loopMesh.name = "hanging_loop";
  loopMesh.position.set(0, DIAMETER * 0.5 - 0.012, -DEPTH * 0.35);
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  // Driftwood sticks arranged in overlapping tangential layers
  for (let i = 0; i < STICK_COUNT; i++) {
    const t = (i / STICK_COUNT) * Math.PI * 2;
    const layer = i % 3;

    // Deterministic variations
    const v1 = Math.sin(i * 1.73 + 0.5);
    const v2 = Math.cos(i * 2.41 + 1.1);
    const v3 = Math.sin(i * 3.17 + 2.3);

    const stickRadius = 0.0105 + 0.0032 * (0.5 + 0.5 * v1);
    const stickLength = 0.095 + 0.032 * (0.5 + 0.5 * v2);

    const radialOffset = (layer - 1) * 0.011 + v3 * 0.007;
    const r = RING_RADIUS + radialOffset;

    const zBase = -DEPTH * 0.25 + layer * 0.014 + v1 * 0.004;

    const stickGeo = new THREE.CapsuleGeometry(stickRadius, stickLength, 4, 8);
    const stickMat = driftwoodMats[i % driftwoodMats.length];
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.name = `driftwood_branch_${i + 1}`;

    stick.position.set(Math.cos(t) * r, Math.sin(t) * r, zBase);

    // Orient tangentially around the ring with slight natural tilt
    const tangentAngle = t + Math.PI * 0.5 + v2 * 0.14;
    stick.rotation.z = tangentAngle - Math.PI * 0.5;
    stick.rotation.x = v3 * 0.09;
    stick.rotation.y = v1 * 0.07;

    stick.castShadow = true;
    stick.receiveShadow = true;
    group.add(stick);
  }

  // Normalize bounding box to exact 0.35m x 0.35m, bottom at y = 0, centered on x = 0 and z = 0
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const scaleX = DIAMETER / size.x;
  const scaleY = DIAMETER / size.y;
  group.scale.set(scaleX, scaleY, 1);

  const scaledBox = new THREE.Box3().setFromObject(group);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  group.position.x -= scaledCenter.x;
  group.position.y -= scaledBox.min.y;
  group.position.z -= scaledCenter.z;

  return group;
}
