function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const H = 0.48;
  const D = 0.16;
  const PIPING_R = 0.008;
  const CORNER_FLARE = 0.02;

  // Materials
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x162048,
    roughness: 0.85,
    metalness: 0.05,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x7a623c,
    roughness: 0.6,
    metalness: 0.25,
  });

  const goldEmbroideryMat = new THREE.MeshStandardMaterial({
    color: 0xc49552,
    roughness: 0.5,
    metalness: 0.35,
  });

  const bronzeEmbroideryMat = new THREE.MeshStandardMaterial({
    color: 0x9e6338,
    roughness: 0.55,
    metalness: 0.3,
  });

  // Pillow body using ExtrudeGeometry with heavy bevel for soft, plump silhouette
  const halfW = W / 2 - D * 0.28;
  const halfH = H / 2 - D * 0.28;
  const pillowShape = new THREE.Shape();
  pillowShape.moveTo(-halfW - CORNER_FLARE, -halfH - CORNER_FLARE);
  pillowShape.quadraticCurveTo(0, -halfH + 0.01, halfW + CORNER_FLARE, -halfH - CORNER_FLARE);
  pillowShape.quadraticCurveTo(halfW - 0.01, 0, halfW + CORNER_FLARE, halfH + CORNER_FLARE);
  pillowShape.quadraticCurveTo(0, halfH - 0.01, -halfW - CORNER_FLARE, halfH + CORNER_FLARE);
  pillowShape.quadraticCurveTo(-halfW + 0.01, 0, -halfW - CORNER_FLARE, -halfH - CORNER_FLARE);

  const extrudeDepth = D * 0.16;
  const bevelThick = D * 0.42;
  const pillowGeo = new THREE.ExtrudeGeometry(pillowShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: bevelThick,
    bevelSize: D * 0.26,
    bevelSegments: 10,
    curveSegments: 16,
  });
  pillowGeo.center();

  const pillowBody = new THREE.Mesh(pillowGeo, velvetMat);
  pillowBody.name = 'pillow_body';
  pillowBody.position.set(0, H / 2, 0);
  pillowBody.castShadow = true;
  pillowBody.receiveShadow = true;
  group.add(pillowBody);

  // Corded piping around the perimeter
  const pW = W / 2 - PIPING_R * 0.5;
  const pH = H / 2 - PIPING_R * 0.5;
  const pipingCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-pW, H / 2 - pH, 0),
      new THREE.Vector3(0, H / 2 - pH + 0.012, 0),
      new THREE.Vector3(pW, H / 2 - pH, 0),
      new THREE.Vector3(pW - 0.012, H / 2, 0),
      new THREE.Vector3(pW, H / 2 + pH, 0),
      new THREE.Vector3(0, H / 2 + pH - 0.012, 0),
      new THREE.Vector3(-pW, H / 2 + pH, 0),
      new THREE.Vector3(-pW + 0.012, H / 2, 0),
    ],
    true
  );
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, PIPING_R, 10, true);
  const piping = new THREE.Mesh(pipingGeo, pipingMat);
  piping.name = 'pillow_piping';
  piping.castShadow = true;
  piping.receiveShadow = true;
  group.add(piping);

  // Helper to create an 8-pointed star geometry
  function createStarGeo(outerR, innerR) {
    const shape = new THREE.Shape();
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.002,
      bevelEnabled: false,
    });
  }

  const starGeo = createStarGeo(0.022, 0.008);
  const smallStarGeo = createStarGeo(0.016, 0.006);
  const frontZ = D / 2 - 0.001;

  // Central vertical column of 3 stars + 2 side stars
  const starPositions = [
    { name: 'star_center_top', x: 0, y: H / 2 + 0.11, z: frontZ - 0.008, geo: starGeo },
    { name: 'star_center_mid', x: 0, y: H / 2, z: frontZ, geo: starGeo },
    { name: 'star_center_bot', x: 0, y: H / 2 - 0.11, z: frontZ - 0.008, geo: starGeo },
    { name: 'star_left_mid', x: -0.15, y: H / 2, z: frontZ - 0.012, geo: smallStarGeo },
    { name: 'star_right_mid', x: 0.15, y: H / 2, z: frontZ - 0.012, geo: smallStarGeo },
  ];

  starPositions.forEach((sp) => {
    const star = new THREE.Mesh(sp.geo, goldEmbroideryMat);
    star.name = sp.name;
    star.position.set(sp.x, sp.y, sp.z);
    star.castShadow = true;
    star.receiveShadow = true;
    group.add(star);
  });

  // 4 Crescent / Baroque scroll motifs in the quadrants
  const crescentGeo = new THREE.TorusGeometry(0.065, 0.007, 8, 24, Math.PI * 1.25);
  const quadrantConfigs = [
    { name: 'crescent_top_left', x: -0.11, y: H / 2 + 0.1, rotZ: -Math.PI * 0.62, rotY: -0.15 },
    { name: 'crescent_top_right', x: 0.11, y: H / 2 + 0.1, rotZ: Math.PI * 0.38, rotY: 0.15 },
    { name: 'crescent_bot_left', x: -0.11, y: H / 2 - 0.1, rotZ: -Math.PI * 0.62, rotY: -0.15 },
    { name: 'crescent_bot_right', x: 0.11, y: H / 2 - 0.1, rotZ: Math.PI * 0.38, rotY: 0.15 },
  ];

  quadrantConfigs.forEach((qc) => {
    const crescent = new THREE.Mesh(crescentGeo, bronzeEmbroideryMat);
    crescent.name = qc.name;
    crescent.position.set(qc.x, qc.y, frontZ - 0.01);
    crescent.rotation.set(0, qc.rotY, qc.rotZ);
    crescent.castShadow = true;
    crescent.receiveShadow = true;
    group.add(crescent);
  });

  // Central vertical scroll frame lines (left and right of center stars)
  const scrollLeftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.045, H / 2 + 0.17, frontZ - 0.018),
    new THREE.Vector3(-0.03, H / 2 + 0.11, frontZ - 0.008),
    new THREE.Vector3(-0.055, H / 2 + 0.05, frontZ - 0.005),
    new THREE.Vector3(-0.025, H / 2, frontZ - 0.002),
    new THREE.Vector3(-0.055, H / 2 - 0.05, frontZ - 0.005),
    new THREE.Vector3(-0.03, H / 2 - 0.11, frontZ - 0.008),
    new THREE.Vector3(-0.045, H / 2 - 0.17, frontZ - 0.018),
  ]);
  const scrollLeft = new THREE.Mesh(
    new THREE.TubeGeometry(scrollLeftCurve, 32, 0.005, 8, false),
    goldEmbroideryMat
  );
  scrollLeft.name = 'scroll_frame_left';
  scrollLeft.castShadow = true;
  scrollLeft.receiveShadow = true;
  group.add(scrollLeft);

  const scrollRightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.045, H / 2 + 0.17, frontZ - 0.018),
    new THREE.Vector3(0.03, H / 2 + 0.11, frontZ - 0.008),
    new THREE.Vector3(0.055, H / 2 + 0.05, frontZ - 0.005),
    new THREE.Vector3(0.025, H / 2, frontZ - 0.002),
    new THREE.Vector3(0.055, H / 2 - 0.05, frontZ - 0.005),
    new THREE.Vector3(0.03, H / 2 - 0.11, frontZ - 0.008),
    new THREE.Vector3(0.045, H / 2 - 0.17, frontZ - 0.018),
  ]);
  const scrollRight = new THREE.Mesh(
    new THREE.TubeGeometry(scrollRightCurve, 32, 0.005, 8, false),
    goldEmbroideryMat
  );
  scrollRight.name = 'scroll_frame_right';
  scrollRight.castShadow = true;
  scrollRight.receiveShadow = true;
  group.add(scrollRight);

  return group;
}
