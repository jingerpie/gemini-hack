function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.2;
  const D = 1.0;
  const H = 0.76;
  const TOP_THICK = 0.045;
  const PLANK_COUNT = 5;
  const PLANK_GAP = 0.002;
  const LEG_H = H - TOP_THICK;
  const LEG_THICK = 0.055;
  const LEG_X_OFFSET = W * 0.34;
  const LEG_TOP_W = 0.24;
  const LEG_BOT_W = 0.31;
  const LEG_INNER_GAP = 0.028;
  const TENON_W = 0.036;
  const TENON_H = 0.14;
  const TENON_D = 0.046;
  const TENON_Y = 0.22;
  const PAD_H = 0.004;

  // Materials
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.55,
    metalness: 0.02
  });

  const teakAccentMat = new THREE.MeshStandardMaterial({
    color: 0xc59b68,
    roughness: 0.58,
    metalness: 0.02
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622,
    roughness: 0.9,
    metalness: 0.0
  });

  // Helper to configure shadows
  function prep(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Tabletop planks (5 longitudinal planks along X)
  const totalGap = PLANK_GAP * (PLANK_COUNT - 1);
  const plankD = (D - totalGap) / PLANK_COUNT;
  const plankGeo = new THREE.BoxGeometry(W, TOP_THICK, plankD);

  for (let i = 0; i < PLANK_COUNT; i++) {
    const z = -D / 2 + plankD / 2 + i * (plankD + PLANK_GAP);
    const plank = new THREE.Mesh(plankGeo, teakMat);
    plank.position.set(0, H - TOP_THICK / 2, z);
    group.add(prep(plank, `tabletop_plank_${i + 1}`));
  }

  // Under-top longitudinal support beam
  const beamGeo = new THREE.BoxGeometry(LEG_X_OFFSET * 2 + LEG_THICK, 0.035, 0.12);
  const beam = new THREE.Mesh(beamGeo, teakMat);
  beam.position.set(0, H - TOP_THICK - 0.0175, 0);
  group.add(prep(beam, 'under_top_support_beam'));

  // Tapered leg slab shape (+Z side after Y rotation)
  const bevel = 0.004;
  const innerZ = LEG_INNER_GAP / 2;
  const legShapePos = new THREE.Shape();
  legShapePos.moveTo(innerZ, PAD_H);
  legShapePos.lineTo(innerZ + LEG_BOT_W, PAD_H);
  legShapePos.lineTo(innerZ + LEG_TOP_W, LEG_H);
  legShapePos.lineTo(innerZ, LEG_H);
  legShapePos.closePath();

  const legExtrudeSettings = {
    depth: LEG_THICK - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2
  };

  const legGeoPos = new THREE.ExtrudeGeometry(legShapePos, legExtrudeSettings);
  legGeoPos.translate(0, 0, -(LEG_THICK - bevel * 2) / 2);
  legGeoPos.rotateY(-Math.PI / 2);

  // Tapered leg slab shape (-Z side after Y rotation)
  const legShapeNeg = new THREE.Shape();
  legShapeNeg.moveTo(-innerZ, PAD_H);
  legShapeNeg.lineTo(-innerZ, LEG_H);
  legShapeNeg.lineTo(-innerZ - LEG_TOP_W, LEG_H);
  legShapeNeg.lineTo(-innerZ - LEG_BOT_W, PAD_H);
  legShapeNeg.closePath();

  const legGeoNeg = new THREE.ExtrudeGeometry(legShapeNeg, legExtrudeSettings);
  legGeoNeg.translate(0, 0, -(LEG_THICK - bevel * 2) / 2);
  legGeoNeg.rotateY(-Math.PI / 2);

  // Shared geometries for pedestal details
  const tenonGeo = new THREE.BoxGeometry(TENON_D, TENON_H, TENON_W);
  const cleatGeo = new THREE.BoxGeometry(LEG_THICK + 0.03, 0.025, LEG_TOP_W * 2 + LEG_INNER_GAP);
  const padGeo = new THREE.BoxGeometry(LEG_THICK * 0.85, PAD_H, LEG_BOT_W * 0.85);

  const ends = [
    { label: 'left', x: -LEG_X_OFFSET },
    { label: 'right', x: LEG_X_OFFSET }
  ];

  for (const end of ends) {
    // Back (-Z) leg slab
    const legBack = new THREE.Mesh(legGeoNeg, teakMat);
    legBack.position.set(end.x, 0, 0);
    group.add(prep(legBack, `leg_${end.label}_back`));

    // Front (+Z) leg slab
    const legFront = new THREE.Mesh(legGeoPos, teakMat);
    legFront.position.set(end.x, 0, 0);
    group.add(prep(legFront, `leg_${end.label}_front`));

    // Center tenon connector block
    const tenon = new THREE.Mesh(tenonGeo, teakAccentMat);
    tenon.position.set(end.x, TENON_Y, 0);
    group.add(prep(tenon, `leg_${end.label}_tenon`));

    // Top mounting cleat
    const cleat = new THREE.Mesh(cleatGeo, teakMat);
    cleat.position.set(end.x, H - TOP_THICK - 0.0125, 0);
    group.add(prep(cleat, `leg_${end.label}_cleat`));

    // Floor pads
    const padBack = new THREE.Mesh(padGeo, padMat);
    padBack.position.set(end.x, PAD_H / 2, -innerZ - LEG_BOT_W / 2);
    group.add(prep(padBack, `pad_${end.label}_back`));

    const padFront = new THREE.Mesh(padGeo, padMat);
    padFront.position.set(end.x, PAD_H / 2, innerZ + LEG_BOT_W / 2);
    group.add(prep(padFront, `pad_${end.label}_front`));
  }

  return group;
}
