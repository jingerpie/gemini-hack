function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const DIAMETER = 0.50;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.36;
  const TOP_SEAM_Y = HEIGHT * 0.78;
  const BOTTOM_SEAM_Y = HEIGHT * 0.08;
  const RADIAL_SEGMENTS = 32;

  // Materials
  const tealLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1e5957,
    roughness: 0.55,
    metalness: 0.05
  });

  const darkTealMat = new THREE.MeshStandardMaterial({
    color: 0x164442,
    roughness: 0.65,
    metalness: 0.04
  });

  const goldEmbroideryMat = new THREE.MeshStandardMaterial({
    color: 0xc8923a,
    roughness: 0.75,
    metalness: 0.08
  });

  const ochreEmbroideryMat = new THREE.MeshStandardMaterial({
    color: 0x9c6224,
    roughness: 0.78,
    metalness: 0.05
  });

  const creamEmbroideryMat = new THREE.MeshStandardMaterial({
    color: 0xdfc99b,
    roughness: 0.72,
    metalness: 0.04
  });

  // Main pouf body profile (LatheGeometry)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(RADIUS * 0.72, 0.0),
    new THREE.Vector2(RADIUS * 0.86, HEIGHT * 0.03),
    new THREE.Vector2(RADIUS * 0.94, BOTTOM_SEAM_Y),
    new THREE.Vector2(RADIUS * 0.99, HEIGHT * 0.25),
    new THREE.Vector2(RADIUS * 1.00, HEIGHT * 0.45),
    new THREE.Vector2(RADIUS * 0.98, HEIGHT * 0.65),
    new THREE.Vector2(RADIUS * 0.92, TOP_SEAM_Y),
    new THREE.Vector2(RADIUS * 0.78, HEIGHT * 0.88),
    new THREE.Vector2(RADIUS * 0.52, HEIGHT * 0.95),
    new THREE.Vector2(RADIUS * 0.25, HEIGHT * 0.99),
    new THREE.Vector2(0.0, HEIGHT)
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, RADIAL_SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, tealLeatherMat);
  bodyMesh.name = 'pouf_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Base leather pad
  const basePadGeo = new THREE.CylinderGeometry(RADIUS * 0.74, RADIUS * 0.70, 0.012, RADIAL_SEGMENTS);
  const basePadMesh = new THREE.Mesh(basePadGeo, darkTealMat);
  basePadMesh.name = 'pouf_base_pad';
  basePadMesh.position.y = 0.006;
  basePadMesh.castShadow = true;
  basePadMesh.receiveShadow = true;
  group.add(basePadMesh);

  // Top seam piping
  const topPipingGeo = new THREE.TorusGeometry(RADIUS * 0.922, 0.0065, 10, RADIAL_SEGMENTS);
  const topPipingMesh = new THREE.Mesh(topPipingGeo, ochreEmbroideryMat);
  topPipingMesh.name = 'top_seam_piping';
  topPipingMesh.rotation.x = Math.PI / 2;
  topPipingMesh.position.y = TOP_SEAM_Y;
  topPipingMesh.castShadow = true;
  topPipingMesh.receiveShadow = true;
  group.add(topPipingMesh);

  // Bottom seam piping
  const bottomPipingGeo = new THREE.TorusGeometry(RADIUS * 0.935, 0.0055, 10, RADIAL_SEGMENTS);
  const bottomPipingMesh = new THREE.Mesh(bottomPipingGeo, darkTealMat);
  bottomPipingMesh.name = 'bottom_seam_piping';
  bottomPipingMesh.rotation.x = Math.PI / 2;
  bottomPipingMesh.position.y = BOTTOM_SEAM_Y;
  bottomPipingMesh.castShadow = true;
  bottomPipingMesh.receiveShadow = true;
  group.add(bottomPipingMesh);

  // Top center embroidered medallion
  const topMedallionGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.008, 16);
  const topMedallionMesh = new THREE.Mesh(topMedallionGeo, goldEmbroideryMat);
  topMedallionMesh.name = 'top_center_medallion';
  topMedallionMesh.position.y = HEIGHT - 0.002;
  topMedallionMesh.castShadow = true;
  topMedallionMesh.receiveShadow = true;
  group.add(topMedallionMesh);

  // Side embroidered floral medallions (8 around middle)
  const MEDALLION_COUNT = 8;
  const sideMedallionGeo = new THREE.SphereGeometry(0.036, 12, 10);
  const sideCenterGeo = new THREE.SphereGeometry(0.014, 10, 8);
  const upperMedallionGeo = new THREE.SphereGeometry(0.024, 10, 8);

  for (let i = 0; i < MEDALLION_COUNT; i++) {
    const angle = (i / MEDALLION_COUNT) * Math.PI * 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Main middle medallion
    const medMesh = new THREE.Mesh(sideMedallionGeo, goldEmbroideryMat);
    medMesh.name = `side_medallion_${i}`;
    medMesh.position.set(cosA * (RADIUS * 0.995), HEIGHT * 0.44, sinA * (RADIUS * 0.995));
    medMesh.lookAt(cosA * 2, HEIGHT * 0.44, sinA * 2);
    medMesh.scale.set(1.0, 1.0, 0.22);
    medMesh.castShadow = true;
    medMesh.receiveShadow = true;
    group.add(medMesh);

    // Center accent of middle medallion
    const centerMesh = new THREE.Mesh(sideCenterGeo, creamEmbroideryMat);
    centerMesh.name = `side_medallion_center_${i}`;
    centerMesh.position.set(cosA * (RADIUS * 1.005), HEIGHT * 0.44, sinA * (RADIUS * 1.005));
    centerMesh.lookAt(cosA * 2, HEIGHT * 0.44, sinA * 2);
    centerMesh.scale.set(1.0, 1.0, 0.3);
    centerMesh.castShadow = true;
    centerMesh.receiveShadow = true;
    group.add(centerMesh);

    // Staggered upper-shoulder medallion
    const upperAngle = angle + Math.PI / MEDALLION_COUNT;
    const uCos = Math.cos(upperAngle);
    const uSin = Math.sin(upperAngle);
    const upperMesh = new THREE.Mesh(upperMedallionGeo, ochreEmbroideryMat);
    upperMesh.name = `upper_medallion_${i}`;
    upperMesh.position.set(uCos * (RADIUS * 0.955), HEIGHT * 0.66, uSin * (RADIUS * 0.955));
    upperMesh.lookAt(uCos * 2, HEIGHT * 0.72, uSin * 2);
    upperMesh.scale.set(1.0, 1.0, 0.25);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    group.add(upperMesh);
  }

  return group;
}
