function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const OUTER_R = 0.28;
  const OUTER_H = 0.52;
  const INNER_R = 0.20;
  const INNER_H = 0.42;
  const TOP_THICK = 0.024;
  const LEG_W = 0.018;
  const RING_H = 0.016;
  const SCREW_R = 0.005;
  const SCREW_H = 0.002;
  const INNER_OFFSET_Z = -0.01;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdccbb5,
    roughness: 0.65,
    metalness: 0.0,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d0,
    roughness: 0.45,
    metalness: 0.15,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x9a9ea3,
    roughness: 0.35,
    metalness: 0.8,
  });

  function createCRingGeometry(outerRadius, width, height, startAngle, endAngle) {
    const innerRadius = outerRadius - width;
    const shape = new THREE.Shape();
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (i / segments) * (endAngle - startAngle);
      const x = Math.cos(a) * outerRadius;
      const y = Math.sin(a) * outerRadius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    for (let i = segments; i >= 0; i--) {
      const a = startAngle + (i / segments) * (endAngle - startAngle);
      const x = Math.cos(a) * innerRadius;
      const y = Math.sin(a) * innerRadius;
      shape.lineTo(x, y);
    }

    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 32,
    });
    geo.rotateX(Math.PI / 2);
    return geo;
  }

  function buildTable(prefix, radius, height, offsetZ) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, offsetZ);

    // Tabletop
    const topGeo = new THREE.CylinderGeometry(radius, radius, TOP_THICK, 32);
    const topMesh = new THREE.Mesh(topGeo, woodMat);
    topMesh.name = `${prefix}_tabletop`;
    topMesh.position.y = height - TOP_THICK / 2;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // C-ring angles: opening faces +Z (which corresponds to -Math.PI/2 in shape XY after rotateX(PI/2))
    // After rotateX(PI/2): shape X -> world X, shape Y -> world Z, shape Z -> world -Y.
    // So world +Z is shape +Y (angle +PI/2).
    const startAngle = 0.82 * Math.PI;
    const endAngle = 2.18 * Math.PI;
    const midAngle = 1.5 * Math.PI;
    const legAngles = [startAngle + 0.03, midAngle, endAngle - 0.03];

    const ringOuterR = radius - 0.008;
    const ringMidR = ringOuterR - LEG_W / 2;

    // Bottom C-ring
    const bottomRingGeo = createCRingGeometry(ringOuterR, LEG_W, RING_H, startAngle, endAngle);
    const bottomRing = new THREE.Mesh(bottomRingGeo, frameMat);
    bottomRing.name = `${prefix}_bottom_ring`;
    bottomRing.position.y = RING_H;
    bottomRing.castShadow = true;
    bottomRing.receiveShadow = true;
    tableGroup.add(bottomRing);

    // Top C-ring (apron under tabletop)
    const topRingGeo = createCRingGeometry(ringOuterR, LEG_W, RING_H, startAngle, endAngle);
    const topRing = new THREE.Mesh(topRingGeo, frameMat);
    topRing.name = `${prefix}_top_ring`;
    topRing.position.y = height - TOP_THICK;
    topRing.castShadow = true;
    topRing.receiveShadow = true;
    tableGroup.add(topRing);

    // 3 Vertical Legs
    const legH = height - TOP_THICK;
    const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
    for (let i = 0; i < legAngles.length; i++) {
      const a = legAngles[i];
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.name = `${prefix}_leg_${i + 1}`;
      leg.position.set(
        Math.cos(a) * ringMidR,
        legH / 2,
        Math.sin(a) * ringMidR
      );
      leg.rotation.y = -a;
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
    }

    // 3 Screw heads on top of tabletop
    const screwGeo = new THREE.CylinderGeometry(SCREW_R, SCREW_R, SCREW_H, 12);
    for (let i = 0; i < legAngles.length; i++) {
      const a = legAngles[i];
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.name = `${prefix}_screw_${i + 1}`;
      screw.position.set(
        Math.cos(a) * ringMidR,
        height + SCREW_H / 2 - 0.0005,
        Math.sin(a) * ringMidR
      );
      screw.castShadow = true;
      screw.receiveShadow = true;
      tableGroup.add(screw);
    }

    return tableGroup;
  }

  group.add(buildTable('outer', OUTER_R, OUTER_H, 0));
  group.add(buildTable('inner', INNER_R, INNER_H, INNER_OFFSET_Z));

  return group;
}
