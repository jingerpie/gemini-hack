function build(THREE) {
  const group = new THREE.Group();

  const W = 0.62;
  const H = 0.74;
  const D = 0.044;
  const FRAME_W = 0.082;
  const BACK_THICK = 0.008;
  const MIRROR_THICK = 0.006;
  const FRAME_DEPTH = D - BACK_THICK;

  const rx = W / 2;
  const ry = H / 2;
  const cx = rx * 0.56;
  const cy = ry * 0.48;

  const irx = rx - FRAME_W;
  const iry = ry - FRAME_W;
  const icx = irx * 0.56;
  const icy = iry * 0.48;

  const outerPts = [
    new THREE.Vector2(rx - cx, ry),
    new THREE.Vector2(rx, ry - cy),
    new THREE.Vector2(rx, -(ry - cy)),
    new THREE.Vector2(rx - cx, -ry),
    new THREE.Vector2(-(rx - cx), -ry),
    new THREE.Vector2(-rx, -(ry - cy)),
    new THREE.Vector2(-rx, ry - cy),
    new THREE.Vector2(-(rx - cx), ry),
  ];

  const innerPts = [
    new THREE.Vector2(irx - icx, iry),
    new THREE.Vector2(irx, iry - icy),
    new THREE.Vector2(irx, -(iry - icy)),
    new THREE.Vector2(irx - icx, -iry),
    new THREE.Vector2(-(irx - icx), -iry),
    new THREE.Vector2(-irx, -(iry - icy)),
    new THREE.Vector2(-irx, iry - icy),
    new THREE.Vector2(-(irx - icx), iry),
  ];

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const aquaGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7cb4b4,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const frostedAquaMat = new THREE.MeshStandardMaterial({
    color: 0x6ea0a0,
    roughness: 0.55,
    metalness: 0.05,
  });

  const backingShape = new THREE.Shape(outerPts);
  const backingGeo = new THREE.ExtrudeGeometry(backingShape, {
    depth: BACK_THICK,
    bevelEnabled: false,
  });
  const backingMesh = new THREE.Mesh(backingGeo, frostedAquaMat);
  backingMesh.name = 'backing_plate';
  backingMesh.position.set(0, ry, -D / 2);
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  const mirrorShape = new THREE.Shape(innerPts);
  const mirrorGeo = new THREE.ExtrudeGeometry(mirrorShape, {
    depth: MIRROR_THICK,
    bevelEnabled: false,
  });
  const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirrorMesh.name = 'mirror_glass';
  mirrorMesh.position.set(0, ry, -D / 2 + BACK_THICK);
  mirrorMesh.castShadow = true;
  mirrorMesh.receiveShadow = true;
  group.add(mirrorMesh);

  const segNames = [
    'top_right',
    'right',
    'bottom_right',
    'bottom',
    'bottom_left',
    'left',
    'top_left',
    'top',
  ];

  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;
    const o1 = outerPts[i];
    const o2 = outerPts[next];
    const i2 = innerPts[next];
    const i1 = innerPts[i];

    const segShape = new THREE.Shape([o1, o2, i2, i1]);
    const segGeo = new THREE.ExtrudeGeometry(segShape, {
      depth: FRAME_DEPTH - 0.006,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.004,
      bevelSegments: 2,
    });

    const segMesh = new THREE.Mesh(segGeo, aquaGlassMat);
    segMesh.name = 'frame_segment_' + segNames[i];
    segMesh.position.set(0, ry, -D / 2 + BACK_THICK);
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;
    group.add(segMesh);

    const dx = o2.x - o1.x;
    const dy = o2.y - o1.y;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const trimGeo = new THREE.BoxGeometry(len, 0.004, FRAME_DEPTH * 0.85);
    const trimMesh = new THREE.Mesh(trimGeo, frostedAquaMat);
    trimMesh.name = 'frame_edge_trim_' + segNames[i];
    trimMesh.position.set(
      (o1.x + o2.x) / 2,
      ry + (o1.y + o2.y) / 2,
      -D / 2 + BACK_THICK + FRAME_DEPTH * 0.425
    );
    trimMesh.rotation.z = angle;
    trimMesh.castShadow = true;
    trimMesh.receiveShadow = true;
    group.add(trimMesh);
  }

  return group;
}
