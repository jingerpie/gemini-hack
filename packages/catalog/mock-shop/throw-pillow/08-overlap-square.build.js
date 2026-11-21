function build(THREE) {
  const W = 0.45;
  const H = 0.45;
  const D = 0.15;

  const BEVEL_SIZE = 0.055;
  const BEVEL_THICKNESS = 0.065;
  const EXT_DEPTH = D - BEVEL_THICKNESS * 2;
  const SHAPE_HW = W * 0.5 - BEVEL_SIZE;
  const SHAPE_HH = H * 0.5 - BEVEL_SIZE;
  const CORNER_R = 0.025;

  const group = new THREE.Group();

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd19c22,
    roughness: 0.9,
    metalness: 0.0
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xb07e14,
    roughness: 0.95,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Single soft rounded square cushion body
  const shape = new THREE.Shape();
  shape.moveTo(-SHAPE_HW + CORNER_R, -SHAPE_HH);
  shape.lineTo(SHAPE_HW - CORNER_R, -SHAPE_HH);
  shape.quadraticCurveTo(SHAPE_HW, -SHAPE_HH, SHAPE_HW, -SHAPE_HH + CORNER_R);
  shape.lineTo(SHAPE_HW, SHAPE_HH - CORNER_R);
  shape.quadraticCurveTo(SHAPE_HW, SHAPE_HH, SHAPE_HW - CORNER_R, SHAPE_HH);
  shape.lineTo(-SHAPE_HW + CORNER_R, SHAPE_HH);
  shape.quadraticCurveTo(-SHAPE_HW, SHAPE_HH, -SHAPE_HW, SHAPE_HH - CORNER_R);
  shape.lineTo(-SHAPE_HW, -SHAPE_HH + CORNER_R);
  shape.quadraticCurveTo(-SHAPE_HW, -SHAPE_HH, -SHAPE_HW + CORNER_R, -SHAPE_HH);

  const cushionGeo = new THREE.ExtrudeGeometry(shape, {
    depth: EXT_DEPTH,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 1,
    bevelSize: BEVEL_SIZE,
    bevelThickness: BEVEL_THICKNESS,
    curveSegments: 12
  });
  cushionGeo.center();

  addMesh(cushionGeo, fabricMat, 'cushion_body', 0, H * 0.5, 0);

  // Subtle overlap envelope flap on the +X side
  const flapLen = H - 0.16;
  const flapGeo = new THREE.CapsuleGeometry(0.014, flapLen, 8, 16);
  addMesh(
    flapGeo,
    fabricMat,
    'overlap_flap',
    W * 0.5 - 0.016,
    H * 0.5,
    -0.01,
    0,
    0,
    -0.03,
    0.55,
    1,
    1.7
  );

  // Subtle darker seam along the overlap opening
  const seamGeo = new THREE.CapsuleGeometry(0.005, flapLen - 0.01, 6, 12);
  addMesh(
    seamGeo,
    seamMat,
    'overlap_seam',
    W * 0.5 - 0.025,
    H * 0.5,
    -0.002,
    0,
    0,
    -0.03,
    0.65,
    1,
    1.1
  );

  return group;
}
