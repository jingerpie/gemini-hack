function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const H = 1.82;
  const D = 0.38;
  const POST_SIZE = 0.018;
  const SHELF_T = 0.028;
  const SHELF_COUNT = 6;
  const BOTTOM_CLEARANCE = 0.085;
  const RAIL_H = 0.014;
  const RAIL_W = 0.012;
  const BACK_BAR_H = 0.045;
  const BACK_BAR_T = 0.008;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x5c5b57,
    roughness: 0.42,
    metalness: 0.72,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb6895b,
    roughness: 0.58,
    metalness: 0.04,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a28,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Helper to enable shadows
  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 4 Vertical Posts
  const postX = W / 2 - POST_SIZE / 2;
  const postZ = D / 2 - POST_SIZE / 2;
  const footH = 0.006;
  const postH = H - footH;
  const postGeo = new THREE.BoxGeometry(POST_SIZE, postH, POST_SIZE);
  const footGeo = new THREE.CylinderGeometry(POST_SIZE * 0.45, POST_SIZE * 0.45, footH, 12);

  const postPositions = [
    { name: 'post_front_left', x: -postX, z: postZ },
    { name: 'post_front_right', x: postX, z: postZ },
    { name: 'post_back_left', x: -postX, z: -postZ },
    { name: 'post_back_right', x: postX, z: -postZ },
  ];

  postPositions.forEach((p) => {
    addMesh(postGeo, metalMat, p.name, p.x, footH + postH / 2, p.z);
    addMesh(footGeo, footMat, p.name.replace('post_', 'foot_'), p.x, footH / 2, p.z);
  });

  // Shelf Geometry (beveled wood plank)
  const shelfW = W - 2 * POST_SIZE;
  const shelfD = D - 0.006;
  const bevel = 0.005;
  const coreW = shelfW - 2 * bevel;
  const coreT = SHELF_T - 2 * bevel;

  const shelfShape = new THREE.Shape();
  shelfShape.moveTo(-coreW / 2, -coreT / 2);
  shelfShape.lineTo(coreW / 2, -coreT / 2);
  shelfShape.lineTo(coreW / 2, coreT / 2);
  shelfShape.lineTo(-coreW / 2, coreT / 2);
  shelfShape.closePath();

  const shelfGeo = new THREE.ExtrudeGeometry(shelfShape, {
    depth: shelfD - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  shelfGeo.center();

  // Side support rails under each shelf
  const railLen = D - 2 * POST_SIZE;
  const railGeo = new THREE.BoxGeometry(RAIL_W, RAIL_H, railLen);
  const railX = W / 2 - POST_SIZE + RAIL_W / 2 - 0.002;

  const firstShelfY = BOTTOM_CLEARANCE + SHELF_T / 2;
  const lastShelfY = H - SHELF_T / 2;
  const stepY = (lastShelfY - firstShelfY) / (SHELF_COUNT - 1);

  for (let i = 0; i < SHELF_COUNT; i++) {
    const sy = firstShelfY + i * stepY;
    addMesh(shelfGeo, woodMat, `shelf_${i + 1}`, 0, sy, 0);

    const railY = sy - SHELF_T / 2 - RAIL_H / 2 + 0.002;
    addMesh(railGeo, metalMat, `side_rail_left_${i + 1}`, -railX, railY, 0);
    addMesh(railGeo, metalMat, `side_rail_right_${i + 1}`, railX, railY, 0);
  }

  // Top back stabilizer bar
  const backBarW = W - 2 * POST_SIZE;
  const backBarGeo = new THREE.BoxGeometry(backBarW, BACK_BAR_H, BACK_BAR_T);
  const backBarY = lastShelfY - SHELF_T / 2 - BACK_BAR_H / 2;
  const backBarZ = -postZ;
  addMesh(backBarGeo, metalMat, 'top_back_stabilizer_bar', 0, backBarY, backBarZ);

  return group;
}
