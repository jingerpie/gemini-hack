function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.90;
  const RADIUS = DIAMETER / 2;
  const BASE_H = 0.011;
  const BACKING_H = 0.002;
  const RIDGE_H = 0.007;
  const EDGE_TUBE_R = 0.007;
  const TORUS_R = RADIUS - EDGE_TUBE_R;

  const sageBaseMat = new THREE.MeshStandardMaterial({
    color: 0x8d9b78,
    roughness: 0.94,
    metalness: 0.0,
  });

  const sageRidgeMat = new THREE.MeshStandardMaterial({
    color: 0x94a37f,
    roughness: 0.96,
    metalness: 0.0,
  });

  const sageEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x859370,
    roughness: 0.90,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x6b7062,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Non-slip backing
  const backingGeo = new THREE.CylinderGeometry(RADIUS - EDGE_TUBE_R, RADIUS - EDGE_TUBE_R, BACKING_H, 32);
  const backing = new THREE.Mesh(backingGeo, backingMat);
  backing.position.y = BACKING_H / 2;
  backing.name = 'rug_backing';
  backing.castShadow = true;
  backing.receiveShadow = true;
  group.add(backing);

  // Main tufted base disc
  const baseGeo = new THREE.CylinderGeometry(RADIUS - EDGE_TUBE_R * 0.4, RADIUS - EDGE_TUBE_R * 0.4, BASE_H, 32);
  const base = new THREE.Mesh(baseGeo, sageBaseMat);
  base.position.y = BACKING_H + BASE_H / 2 - 0.001;
  base.name = 'rug_base';
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Serged outer edge piping
  const edgeGeo = new THREE.TorusGeometry(TORUS_R, EDGE_TUBE_R, 12, 32);
  edgeGeo.rotateX(Math.PI / 2);
  const edge = new THREE.Mesh(edgeGeo, sageEdgeMat);
  edge.position.y = EDGE_TUBE_R;
  edge.name = 'rug_outer_piping';
  edge.castShadow = true;
  edge.receiveShadow = true;
  group.add(edge);

  function addArcRidge(innerR, outerR, startAngle, endAngle, height, mat, name) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, startAngle, endAngle, false);
    shape.absarc(0, 0, innerR, endAngle, startAngle, true);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
      curveSegments: 32,
    });
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = BACKING_H + BASE_H - 0.002;
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Concentric orbit arc ridges matching the photo's asymmetrical breaks
  addArcRidge(0.325, 0.355, 0.15, Math.PI * 1.55, RIDGE_H, sageRidgeMat, 'orbit_ridge_outer_1');
  addArcRidge(0.325, 0.355, Math.PI * 1.65, Math.PI * 2.02, RIDGE_H * 0.85, sageRidgeMat, 'orbit_ridge_outer_2');

  addArcRidge(0.265, 0.295, Math.PI * 0.45, Math.PI * 1.92, RIDGE_H, sageRidgeMat, 'orbit_ridge_mid_outer_1');
  addArcRidge(0.265, 0.295, Math.PI * 0.05, Math.PI * 0.36, RIDGE_H * 0.85, sageRidgeMat, 'orbit_ridge_mid_outer_2');

  addArcRidge(0.205, 0.235, Math.PI * 0.85, Math.PI * 2.25, RIDGE_H, sageRidgeMat, 'orbit_ridge_mid_inner_1');
  addArcRidge(0.205, 0.235, Math.PI * 0.35, Math.PI * 0.72, RIDGE_H * 0.85, sageRidgeMat, 'orbit_ridge_mid_inner_2');

  addArcRidge(0.148, 0.174, Math.PI * 1.15, Math.PI * 2.48, RIDGE_H, sageRidgeMat, 'orbit_ridge_inner_1');
  addArcRidge(0.148, 0.174, Math.PI * 0.62, Math.PI * 1.02, RIDGE_H * 0.85, sageRidgeMat, 'orbit_ridge_inner_2');

  // Subtle central tufted accent rings
  addArcRidge(0.092, 0.112, 0.2, Math.PI * 1.35, RIDGE_H * 0.55, sageBaseMat, 'center_tuft_ring_1');
  addArcRidge(0.042, 0.060, Math.PI * 0.9, Math.PI * 2.1, RIDGE_H * 0.45, sageBaseMat, 'center_tuft_ring_2');

  return group;
}
