function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.594;
  const D = 0.45;
  const H = 1.85;

  const POST_SIZE = 0.038;
  const POST_THICK = 0.004;
  const CAP_H = 0.015;
  const CAP_PAD = 0.003;

  const SHELF_THICK = 0.032;
  const SHELF_YS = [0.08, 0.50, 0.92, 1.34, 1.76];

  const RIB_W = 0.018;
  const RIB_H = 0.016;

  const BRACE_W = 0.018;
  const BRACE_THICK = 0.005;

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e31,
    roughness: 0.42,
    metalness: 0.68,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x151719,
    roughness: 0.82,
    metalness: 0.1,
  });

  // Helper to enable shadows
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

  // L-shaped angle post geometry (extruded along +Y)
  const postShape = new THREE.Shape();
  postShape.moveTo(0, 0);
  postShape.lineTo(POST_SIZE, 0);
  postShape.lineTo(POST_SIZE, POST_THICK);
  postShape.lineTo(POST_THICK, POST_THICK);
  postShape.lineTo(POST_THICK, POST_SIZE);
  postShape.lineTo(0, POST_SIZE);
  postShape.closePath();

  const postLen = H - CAP_H * 2;
  const postGeo = new THREE.ExtrudeGeometry(postShape, {
    depth: postLen,
    bevelEnabled: false,
  });
  // Rotate so extrusion is along +Y
  postGeo.rotateX(-Math.PI / 2);

  const capGeo = new THREE.BoxGeometry(
    POST_SIZE + CAP_PAD * 2,
    CAP_H,
    POST_SIZE + CAP_PAD * 2
  );

  // 4 Corner Posts + Foot Caps + Top Caps
  const halfW = W / 2;
  const halfD = D / 2;

  const corners = [
    { name: 'front_left', x: -halfW, z: halfD, ry: 0 },
    { name: 'front_right', x: halfW, z: halfD, ry: Math.PI / 2 },
    { name: 'back_right', x: halfW, z: -halfD, ry: Math.PI },
    { name: 'back_left', x: -halfW, z: -halfD, ry: -Math.PI / 2 },
  ];

  corners.forEach((c) => {
    addMesh(postGeo, steelMat, `post_${c.name}`, c.x, CAP_H, c.z, 0, c.ry, 0);

    // Center of cap relative to corner
    const capOffsetX = c.x < 0 ? POST_SIZE / 2 : -POST_SIZE / 2;
    const capOffsetZ = c.z < 0 ? POST_SIZE / 2 : -POST_SIZE / 2;

    addMesh(
      capGeo,
      capMat,
      `foot_cap_${c.name}`,
      c.x + capOffsetX,
      CAP_H / 2,
      c.z + capOffsetZ
    );
    addMesh(
      capGeo,
      capMat,
      `top_cap_${c.name}`,
      c.x + capOffsetX,
      H - CAP_H / 2,
      c.z + capOffsetZ
    );
  });

  // Shelves & Under-shelf Support Ribs
  const shelfW = W - POST_THICK * 2;
  const shelfD = D - POST_THICK * 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_THICK, shelfD);
  const ribGeo = new THREE.BoxGeometry(RIB_W, RIB_H, shelfD - 0.02);

  SHELF_YS.forEach((sy, idx) => {
    addMesh(shelfGeo, steelMat, `shelf_${idx + 1}`, 0, sy, 0);

    // Two transverse support ribs under each shelf
    const ribY = sy - SHELF_THICK / 2 - RIB_H / 2;
    addMesh(ribGeo, steelMat, `shelf_${idx + 1}_rib_left`, -shelfW * 0.25, ribY, 0);
    addMesh(ribGeo, steelMat, `shelf_${idx + 1}_rib_right`, shelfW * 0.25, ribY, 0);
  });

  // Side X-Bracing (spanning between shelf 2 and shelf 4 on left & right sides)
  const braceY1 = SHELF_YS[1];
  const braceY2 = SHELF_YS[3];
  const braceSpanY = braceY2 - braceY1;
  const braceSpanZ = D - POST_SIZE;
  const braceLen = Math.hypot(braceSpanY, braceSpanZ);
  const braceAngle = Math.atan2(braceSpanY, braceSpanZ);
  const braceMidY = (braceY1 + braceY2) / 2;

  const braceGeo = new THREE.BoxGeometry(BRACE_THICK, BRACE_W, braceLen);

  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? 'left' : 'right';
    const xPos = side * (halfW - POST_THICK - BRACE_THICK / 2);

    addMesh(
      braceGeo,
      steelMat,
      `side_brace_${sideName}_a`,
      xPos,
      braceMidY,
      0,
      braceAngle,
      0,
      0
    );
    addMesh(
      braceGeo,
      steelMat,
      `side_brace_${sideName}_b`,
      xPos,
      braceMidY,
      0,
      -braceAngle,
      0,
      0
    );
  });

  return group;
}
