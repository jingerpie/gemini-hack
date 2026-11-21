function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.40;
  const OUTER_R = DIAMETER / 2;
  const DEPTH = 0.030;
  const CENTER_Y = OUTER_R;

  const OUTER_TUBE_R = 0.008;
  const OUTER_RING_R = OUTER_R - OUTER_TUBE_R;

  const INNER_TUBE_R = 0.0065;
  const INNER_RING_R = 0.125;
  const LIP_TUBE_R = 0.004;
  const LIP_RING_R = 0.118;

  const GLASS_R = 0.118;
  const GLASS_THICK = 0.004;
  const BACKING_R = 0.122;
  const BACKING_THICK = 0.006;

  const LOOP_COUNT = 24;
  const LOOP_TUBE_R = 0.003;

  const rattanMat = new THREE.MeshStandardMaterial({
    color: 0xc8a679,
    roughness: 0.65,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0xb59265,
    roughness: 0.75,
    metalness: 0.0,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backZ = -DEPTH / 2;

  const backingGeo = new THREE.CylinderGeometry(BACKING_R, BACKING_R, BACKING_THICK, 32);
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = 'mirror_backing';
  backingMesh.rotation.x = Math.PI / 2;
  backingMesh.position.set(0, CENTER_Y, backZ + BACKING_THICK / 2);
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  const glassGeo = new THREE.CylinderGeometry(GLASS_R, GLASS_R, GLASS_THICK, 32);
  const glassMesh = new THREE.Mesh(glassGeo, mirrorMat);
  glassMesh.name = 'mirror_glass';
  glassMesh.rotation.x = Math.PI / 2;
  glassMesh.position.set(0, CENTER_Y, backZ + BACKING_THICK + GLASS_THICK / 2);
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  group.add(glassMesh);

  const outerRingGeo = new THREE.TorusGeometry(OUTER_RING_R, OUTER_TUBE_R, 12, 32);
  const outerRing = new THREE.Mesh(outerRingGeo, rattanMat);
  outerRing.name = 'outer_rattan_ring';
  outerRing.position.set(0, CENTER_Y, 0);
  outerRing.castShadow = true;
  outerRing.receiveShadow = true;
  group.add(outerRing);

  const innerRingGeo = new THREE.TorusGeometry(INNER_RING_R, INNER_TUBE_R, 12, 32);
  const innerRing = new THREE.Mesh(innerRingGeo, rattanMat);
  innerRing.name = 'inner_rattan_ring';
  innerRing.position.set(0, CENTER_Y, 0.004);
  innerRing.castShadow = true;
  innerRing.receiveShadow = true;
  group.add(innerRing);

  const lipRingGeo = new THREE.TorusGeometry(LIP_RING_R, LIP_TUBE_R, 10, 32);
  const lipRing = new THREE.Mesh(lipRingGeo, rattanMat);
  lipRing.name = 'inner_lip_ring';
  lipRing.position.set(0, CENTER_Y, 0.002);
  lipRing.castShadow = true;
  lipRing.receiveShadow = true;
  group.add(lipRing);

  const angleStep = (Math.PI * 2) / LOOP_COUNT;
  const halfSpan = angleStep * 0.36;
  const rStart = INNER_RING_R;
  const rMid = (INNER_RING_R + OUTER_RING_R) * 0.55;
  const rPeak = OUTER_RING_R - OUTER_TUBE_R * 0.35;

  for (let i = 0; i < LOOP_COUNT; i++) {
    const theta = i * angleStep;
    const a1 = theta - halfSpan;
    const a2 = theta + halfSpan;
    const aMid1 = theta - halfSpan * 0.78;
    const aMid2 = theta + halfSpan * 0.78;

    const pts = [
      new THREE.Vector3(Math.cos(a1) * rStart, CENTER_Y + Math.sin(a1) * rStart, 0.002),
      new THREE.Vector3(Math.cos(aMid1) * rMid, CENTER_Y + Math.sin(aMid1) * rMid, 0.002),
      new THREE.Vector3(Math.cos(theta) * rPeak, CENTER_Y + Math.sin(theta) * rPeak, 0.002),
      new THREE.Vector3(Math.cos(aMid2) * rMid, CENTER_Y + Math.sin(aMid2) * rMid, 0.002),
      new THREE.Vector3(Math.cos(a2) * rStart, CENTER_Y + Math.sin(a2) * rStart, 0.002),
    ];

    const curve = new THREE.CatmullRomCurve3(pts);
    const loopGeo = new THREE.TubeGeometry(curve, 20, LOOP_TUBE_R, 8, false);
    const loopMesh = new THREE.Mesh(loopGeo, rattanMat);
    loopMesh.name = 'rattan_loop_' + i;
    loopMesh.castShadow = true;
    loopMesh.receiveShadow = true;
    group.add(loopMesh);
  }

  return group;
}
