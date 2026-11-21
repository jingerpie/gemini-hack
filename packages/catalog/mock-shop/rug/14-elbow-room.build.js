function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 1.20;
  const D = 1.20;
  const ARM_W = 0.58;
  const H = 0.020;
  const BACKING_H = 0.002;
  const PIPING_R = 0.011;
  const CORNER_R = 0.025;
  const GROOVE_OFFSET = 0.11;
  const GROOVE_W = 0.018;
  const GROOVE_H = 0.002;

  const HALF_W = W / 2;
  const HALF_D = D / 2;
  const INNER_X = -HALF_W + ARM_W;
  const INNER_Z = -HALF_D + ARM_W;

  // Materials
  const sageMat = new THREE.MeshStandardMaterial({
    color: 0x92a17f,
    roughness: 0.92,
    metalness: 0.0,
  });

  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0x738262,
    roughness: 0.95,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x9aa888,
    roughness: 0.88,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x5c6650,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Helper to create rounded L-shape in XY (mapped to X, -Z after rotation)
  function createLShape(inset) {
    const x0 = -HALF_W + inset;
    const x1 = HALF_W - inset;
    const ix = INNER_X - inset;
    const y0 = -HALF_D + inset; // maps to +Z
    const y1 = HALF_D - inset;  // maps to -Z
    const iy = -INNER_Z + inset;
    const r = Math.max(0.005, CORNER_R - inset * 0.5);

    const shape = new THREE.Shape();
    shape.moveTo(x0 + r, y1);
    shape.lineTo(x1 - r, y1);
    shape.quadraticCurveTo(x1, y1, x1, y1 - r);
    shape.lineTo(x1, iy + r);
    shape.quadraticCurveTo(x1, iy, x1 - r, iy);
    shape.lineTo(ix + r, iy);
    shape.quadraticCurveTo(ix, iy, ix, iy - r);
    shape.lineTo(ix, y0 + r);
    shape.quadraticCurveTo(ix, y0, ix - r, y0);
    shape.lineTo(x0 + r, y0);
    shape.quadraticCurveTo(x0, y0, x0, y0 + r);
    shape.lineTo(x0, y1 - r);
    shape.quadraticCurveTo(x0, y1, x0 + r, y1);
    return shape;
  }

  // 1. Non-slip backing pad
  const backingGeo = new THREE.ExtrudeGeometry(createLShape(0.008), {
    depth: BACKING_H,
    bevelEnabled: false,
    curveSegments: 8,
  });
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = 'rug_backing_pad';
  backingMesh.rotation.x = -Math.PI / 2;
  backingMesh.position.y = 0;
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  // 2. Main tufted rug body
  const bodyGeo = new THREE.ExtrudeGeometry(createLShape(PIPING_R * 0.6), {
    depth: H - BACKING_H,
    bevelEnabled: false,
    curveSegments: 8,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, sageMat);
  bodyMesh.name = 'rug_tufted_body';
  bodyMesh.rotation.x = -Math.PI / 2;
  bodyMesh.position.y = BACKING_H;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 3. Recessed darker-sage accent groove lines
  const grooveY = H - GROOVE_H * 0.3;
  const gx = INNER_X - GROOVE_OFFSET;
  const gz = INNER_Z - GROOVE_OFFSET;

  const grooveSpecs = [
    {
      name: 'groove_stripe_front_vert',
      w: GROOVE_W,
      d: HALF_D - gz,
      x: gx,
      z: (gz + HALF_D) / 2,
    },
    {
      name: 'groove_stripe_front_horiz',
      w: gx - (-HALF_W + PIPING_R),
      d: GROOVE_W,
      x: (-HALF_W + PIPING_R + gx) / 2,
      z: HALF_D - GROOVE_OFFSET,
    },
    {
      name: 'groove_stripe_right_horiz',
      w: HALF_W - gx,
      d: GROOVE_W,
      x: (gx + HALF_W) / 2,
      z: gz,
    },
    {
      name: 'groove_stripe_right_vert',
      w: GROOVE_W,
      d: gz - (-HALF_D + PIPING_R),
      x: HALF_W - GROOVE_OFFSET,
      z: (-HALF_D + PIPING_R + gz) / 2,
    },
  ];

  grooveSpecs.forEach((spec) => {
    const geo = new THREE.BoxGeometry(spec.w, GROOVE_H, spec.d);
    const mesh = new THREE.Mesh(geo, grooveMat);
    mesh.name = spec.name;
    mesh.position.set(spec.x, grooveY, spec.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 4. Whipstitched outer edge piping (6 segments + 6 corners)
  const pMinX = -HALF_W + PIPING_R;
  const pMaxX = HALF_W - PIPING_R;
  const pMinZ = -HALF_D + PIPING_R;
  const pMaxZ = HALF_D - PIPING_R;
  const pInX = INNER_X - PIPING_R;
  const pInZ = INNER_Z - PIPING_R;

  const corners = [
    { name: 'corner_piping_back_left', x: pMinX, z: pMinZ },
    { name: 'corner_piping_back_right', x: pMaxX, z: pMinZ },
    { name: 'corner_piping_mid_right', x: pMaxX, z: pInZ },
    { name: 'corner_piping_inner', x: pInX, z: pInZ },
    { name: 'corner_piping_mid_front', x: pInX, z: pMaxZ },
    { name: 'corner_piping_front_left', x: pMinX, z: pMaxZ },
  ];

  const cornerGeo = new THREE.SphereGeometry(PIPING_R, 12, 10);
  corners.forEach((c) => {
    const mesh = new THREE.Mesh(cornerGeo, pipingMat);
    mesh.name = c.name;
    mesh.position.set(c.x, PIPING_R, c.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  const edgeNames = [
    'edge_piping_back',
    'edge_piping_right',
    'edge_piping_inner_horiz',
    'edge_piping_inner_vert',
    'edge_piping_front',
    'edge_piping_left',
  ];

  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    const edgeGeo = new THREE.CylinderGeometry(PIPING_R, PIPING_R, len, 12);
    const edgeMesh = new THREE.Mesh(edgeGeo, pipingMat);
    edgeMesh.name = edgeNames[i];
    edgeMesh.position.set((a.x + b.x) / 2, PIPING_R, (a.z + b.z) / 2);

    if (Math.abs(dx) > Math.abs(dz)) {
      edgeMesh.rotation.z = Math.PI / 2;
    } else {
      edgeMesh.rotation.x = Math.PI / 2;
    }

    edgeMesh.castShadow = true;
    edgeMesh.receiveShadow = true;
    group.add(edgeMesh);
  }

  return group;
}
