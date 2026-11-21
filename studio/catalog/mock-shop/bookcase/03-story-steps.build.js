function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.80;
  const H = 0.80;
  const D = 0.32;
  const T = 0.018; // 18mm plywood thickness
  const CORNER_R = 0.035;
  const BOTTOM_GAP = 0.035;
  const TOP_LIP = 0.045;
  const FACE_INSET = 0.0015; // slight inset for laminated face

  // Materials
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x82a9be,
    roughness: 0.55,
    metalness: 0.02,
  });

  const birchMat = new THREE.MeshStandardMaterial({
    color: 0xd8b88e,
    roughness: 0.65,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create side panel shape in XY plane (X = Z_world, Y = Y_world)
  // Front is +Z (right side of shape), Back is -Z (left side of shape)
  function createSideShape(zMin, zMax, yMin, yMax, r) {
    const shape = new THREE.Shape();
    shape.moveTo(zMin, yMin);
    shape.lineTo(zMax - r, yMin);
    shape.absarc(zMax - r, yMin + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(zMax, yMax - r);
    shape.absarc(zMax - r, yMax - r, r, 0, Math.PI / 2, false);
    shape.lineTo(zMin, yMax);
    shape.closePath();
    return shape;
  }

  const sideCoreShape = createSideShape(-D / 2, D / 2, 0, H, CORNER_R);
  const sideCoreGeo = new THREE.ExtrudeGeometry(sideCoreShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  // Rotate so shape X -> +Z, shape Y -> +Y, extrude depth -> +X
  sideCoreGeo.rotateY(-Math.PI / 2);

  const sideFaceShape = createSideShape(
    -D / 2 + FACE_INSET,
    D / 2 - FACE_INSET,
    FACE_INSET,
    H - FACE_INSET,
    CORNER_R - FACE_INSET
  );
  const sideFaceGeo = new THREE.ExtrudeGeometry(sideFaceShape, {
    depth: 0.001,
    bevelEnabled: false,
    curveSegments: 16,
  });
  sideFaceGeo.rotateY(-Math.PI / 2);

  // Left side panel (-X)
  const leftX = -W / 2 + T;
  addMesh(sideCoreGeo, birchMat, 'left_side_core', leftX, 0, 0);
  addMesh(sideFaceGeo, blueMat, 'left_side_outer_face', -W / 2 + 0.0005, 0, 0);
  addMesh(sideFaceGeo, blueMat, 'left_side_inner_face', leftX + 0.0005, 0, 0);

  // Right side panel (+X)
  const rightX = W / 2;
  addMesh(sideCoreGeo, birchMat, 'right_side_core', rightX, 0, 0);
  addMesh(sideFaceGeo, blueMat, 'right_side_outer_face', rightX + 0.0005, 0, 0);
  addMesh(sideFaceGeo, blueMat, 'right_side_inner_face', W / 2 - T + 0.0005, 0, 0);

  // Back panel
  const innerW = W - 2 * T;
  const backH = H - BOTTOM_GAP;
  const backY = BOTTOM_GAP + backH / 2;
  const backZ = -D / 2 + T / 2;

  const backGeo = new THREE.BoxGeometry(innerW, backH - 0.002, T);
  addMesh(backGeo, blueMat, 'back_panel', 0, backY - 0.001, backZ);

  const backTopEdgeGeo = new THREE.BoxGeometry(innerW, 0.002, T);
  addMesh(backTopEdgeGeo, birchMat, 'back_panel_top_edge', 0, H - 0.001, backZ);

  // Shelves (bottom, middle, top)
  const shelfD = D - T;
  const shelfZ = T / 2;
  const shelfGeo = new THREE.BoxGeometry(innerW, T, shelfD - 0.002);
  const shelfEdgeGeo = new THREE.BoxGeometry(innerW, T, 0.002);

  const bottomShelfY = BOTTOM_GAP + T / 2;
  const topShelfY = H - TOP_LIP - T / 2;
  const midShelfY = (bottomShelfY + topShelfY) / 2;

  const shelves = [
    { name: 'bottom_shelf', y: bottomShelfY },
    { name: 'middle_shelf', y: midShelfY },
    { name: 'top_shelf', y: topShelfY },
  ];

  for (const s of shelves) {
    addMesh(shelfGeo, blueMat, s.name, 0, s.y, shelfZ - 0.001);
    addMesh(shelfEdgeGeo, birchMat, `${s.name}_front_edge`, 0, s.y, D / 2 - 0.001);
  }

  return group;
}
