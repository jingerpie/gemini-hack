function build(THREE) {
  const group = new THREE.Group();

  const W = 1.20;
  const D = 1.20;
  const H_BASE = 0.008;
  const H_PILE = 0.006;
  const BORDER_R = 0.0075;
  const R_OUTER = 0.54;
  const R_INNER = 0.22;
  const GAP_ANGLE = 0.012;

  const matLight = new THREE.MeshStandardMaterial({
    color: 0xd4a446,
    roughness: 0.92,
    metalness: 0.0
  });

  const matDark = new THREE.MeshStandardMaterial({
    color: 0xb57c1e,
    roughness: 0.94,
    metalness: 0.0
  });

  const matBorder = new THREE.MeshStandardMaterial({
    color: 0xc89536,
    roughness: 0.88,
    metalness: 0.0
  });

  const matGroove = new THREE.MeshStandardMaterial({
    color: 0x9c6a18,
    roughness: 0.95,
    metalness: 0.0
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Base backing layer
  const baseGeo = new THREE.BoxGeometry(W - BORDER_R * 2, H_BASE, D - BORDER_R * 2);
  const baseMesh = new THREE.Mesh(baseGeo, matLight);
  baseMesh.position.set(0, H_BASE / 2, 0);
  addMesh(baseMesh, 'rug_base');

  // 4 Outer circle quadrants & 4 Inner circle quadrants
  for (let i = 0; i < 4; i++) {
    const isDark = i % 2 === 0;
    const mat = isDark ? matDark : matLight;
    const thetaStart = i * (Math.PI / 2) + GAP_ANGLE / 2;
    const thetaLength = Math.PI / 2 - GAP_ANGLE;

    const outerGeo = new THREE.CylinderGeometry(
      R_OUTER,
      R_OUTER,
      H_PILE,
      32,
      1,
      false,
      thetaStart,
      thetaLength
    );
    const outerMesh = new THREE.Mesh(outerGeo, mat);
    outerMesh.position.set(0, H_BASE + H_PILE / 2, 0);
    addMesh(outerMesh, `outer_quadrant_${i}`);

    const innerGeo = new THREE.CylinderGeometry(
      R_INNER,
      R_INNER,
      H_PILE + 0.001,
      32,
      1,
      false,
      thetaStart,
      thetaLength
    );
    const innerMesh = new THREE.Mesh(innerGeo, mat);
    innerMesh.position.set(0, H_BASE + (H_PILE + 0.001) / 2, 0);
    addMesh(innerMesh, `inner_quadrant_${i}`);
  }

  // Carved groove rings
  const outerRingGeo = new THREE.TorusGeometry(R_OUTER, 0.0022, 8, 32);
  const outerRingMesh = new THREE.Mesh(outerRingGeo, matGroove);
  outerRingMesh.rotation.x = Math.PI / 2;
  outerRingMesh.position.set(0, H_BASE + H_PILE - 0.001, 0);
  addMesh(outerRingMesh, 'outer_groove_ring');

  const innerRingGeo = new THREE.TorusGeometry(R_INNER, 0.0022, 8, 32);
  const innerRingMesh = new THREE.Mesh(innerRingGeo, matGroove);
  innerRingMesh.rotation.x = Math.PI / 2;
  innerRingMesh.position.set(0, H_BASE + H_PILE, 0);
  addMesh(innerRingMesh, 'inner_groove_ring');

  // Whipstitched edge bindings
  const edgeLenX = W - BORDER_R * 2;
  const edgeLenZ = D - BORDER_R * 2;
  const edgeGeoX = new THREE.CapsuleGeometry(BORDER_R, edgeLenX, 4, 12);
  const edgeGeoZ = new THREE.CapsuleGeometry(BORDER_R, edgeLenZ, 4, 12);

  const frontEdge = new THREE.Mesh(edgeGeoX, matBorder);
  frontEdge.rotation.z = Math.PI / 2;
  frontEdge.position.set(0, BORDER_R, D / 2 - BORDER_R);
  addMesh(frontEdge, 'edge_binding_front');

  const backEdge = new THREE.Mesh(edgeGeoX, matBorder);
  backEdge.rotation.z = Math.PI / 2;
  backEdge.position.set(0, BORDER_R, -D / 2 + BORDER_R);
  addMesh(backEdge, 'edge_binding_back');

  const rightEdge = new THREE.Mesh(edgeGeoZ, matBorder);
  rightEdge.rotation.x = Math.PI / 2;
  rightEdge.position.set(W / 2 - BORDER_R, BORDER_R, 0);
  addMesh(rightEdge, 'edge_binding_right');

  const leftEdge = new THREE.Mesh(edgeGeoZ, matBorder);
  leftEdge.rotation.x = Math.PI / 2;
  leftEdge.position.set(-W / 2 + BORDER_R, BORDER_R, 0);
  addMesh(leftEdge, 'edge_binding_left');

  return group;
}
