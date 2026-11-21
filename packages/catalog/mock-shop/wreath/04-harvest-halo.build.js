function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.35;
  const R_OUTER = DIAMETER / 2;
  const R_INNER = 0.088;
  const D = 0.032;
  const CENTER_Y = R_OUTER;
  const RIM_OUTER_W = 0.014;
  const RIM_INNER_W = 0.010;
  const BACK_THICK = 0.008;

  // Materials
  const matOrangeRim = new THREE.MeshStandardMaterial({
    color: 0xe36e24,
    roughness: 0.65,
    metalness: 0.05
  });
  const matPumpkinBright = new THREE.MeshStandardMaterial({
    color: 0xe87728,
    roughness: 0.6,
    metalness: 0.05
  });
  const matPumpkinWarm = new THREE.MeshStandardMaterial({
    color: 0xd96120,
    roughness: 0.65,
    metalness: 0.05
  });
  const matPumpkinGold = new THREE.MeshStandardMaterial({
    color: 0xeb8c2d,
    roughness: 0.6,
    metalness: 0.05
  });
  const matStem = new THREE.MeshStandardMaterial({
    color: 0x7a4824,
    roughness: 0.8,
    metalness: 0.02
  });
  const matBackNavy = new THREE.MeshStandardMaterial({
    color: 0x1e2633,
    roughness: 0.75,
    metalness: 0.05
  });
  const matLeafOchre = new THREE.MeshStandardMaterial({
    color: 0xd69a38,
    roughness: 0.7,
    metalness: 0.05
  });
  const matLeafBurnt = new THREE.MeshStandardMaterial({
    color: 0xc75226,
    roughness: 0.7,
    metalness: 0.05
  });
  const matCatFur = new THREE.MeshStandardMaterial({
    color: 0xd97d38,
    roughness: 0.65,
    metalness: 0.05
  });
  const matCatCream = new THREE.MeshStandardMaterial({
    color: 0xf2e4d5,
    roughness: 0.7,
    metalness: 0.02
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

  // Helper to create a flat extruded ring
  function createRingGeo(rIn, rOut, depth) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 32
    });
  }

  // 1. Back plate (flat back at z = -D/2)
  const backGeo = createRingGeo(R_INNER, R_OUTER, BACK_THICK);
  addMesh(backGeo, matBackNavy, 'back_plate', 0, CENTER_Y, -D / 2);

  // 2. Outer and inner rims (front framing)
  const rimDepth = D - BACK_THICK;
  const outerRimGeo = createRingGeo(R_OUTER - RIM_OUTER_W, R_OUTER, rimDepth);
  addMesh(outerRimGeo, matOrangeRim, 'outer_rim', 0, CENTER_Y, -D / 2 + BACK_THICK);

  const innerRimGeo = createRingGeo(R_INNER, R_INNER + RIM_INNER_W, rimDepth);
  addMesh(innerRimGeo, matOrangeRim, 'inner_rim', 0, CENTER_Y, -D / 2 + BACK_THICK);

  // 3. Pumpkins around the ring
  const pumpkinSpecs = [
    { angle: Math.PI / 2, r: 0.132, sx: 0.029, sy: 0.024, mat: matPumpkinBright, z: 0.004 }, // 12:00
    { angle: Math.PI * 0.17, r: 0.131, sx: 0.025, sy: 0.022, mat: matPumpkinWarm, z: 0.003 }, // 2:00
    { angle: -Math.PI * 0.02, r: 0.132, sx: 0.025, sy: 0.022, mat: matPumpkinGold, z: 0.004 }, // 3:00
    { angle: -Math.PI * 0.25, r: 0.131, sx: 0.026, sy: 0.023, mat: matPumpkinWarm, z: 0.003 }, // 4:30
    { angle: -Math.PI / 2, r: 0.132, sx: 0.030, sy: 0.025, mat: matPumpkinBright, z: 0.004 }, // 6:00
    { angle: -Math.PI * 0.72, r: 0.130, sx: 0.024, sy: 0.021, mat: matPumpkinWarm, z: 0.003 }, // 7:30
    { angle: Math.PI * 0.98, r: 0.132, sx: 0.025, sy: 0.022, mat: matPumpkinGold, z: 0.004 }, // 9:00
    { angle: Math.PI * 0.76, r: 0.131, sx: 0.025, sy: 0.022, mat: matPumpkinBright, z: 0.003 } // 10:30
  ];

  const pumpkinGeo = new THREE.SphereGeometry(1, 20, 14);
  const stemGeo = new THREE.CylinderGeometry(0.0025, 0.004, 0.011, 8);

  pumpkinSpecs.forEach((p, idx) => {
    const px = Math.cos(p.angle) * p.r;
    const py = CENTER_Y + Math.sin(p.angle) * p.r;
    const body = addMesh(pumpkinGeo, p.mat, `pumpkin_body_${idx + 1}`, px, py, p.z);
    body.scale.set(p.sx, p.sy, 0.008);

    addMesh(
      stemGeo,
      matStem,
      `pumpkin_stem_${idx + 1}`,
      px,
      py + p.sy * 0.95,
      p.z,
      0,
      0,
      -0.12
    );
  });

  // 4. Autumn leaves tucked behind/between pumpkins
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.010, 0.008, 0.006, 0.022);
  leafShape.quadraticCurveTo(0, 0.028, -0.006, 0.022);
  leafShape.quadraticCurveTo(-0.010, 0.008, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 10
  });

  const leafSpecs = [
    { angle: Math.PI * 0.38, r: 0.138, rot: -0.5, mat: matLeafOchre },
    { angle: Math.PI * 0.10, r: 0.138, rot: -1.1, mat: matLeafBurnt },
    { angle: -Math.PI * 0.14, r: 0.138, rot: -2.0, mat: matLeafOchre },
    { angle: -Math.PI * 0.38, r: 0.138, rot: -2.6, mat: matLeafBurnt },
    { angle: -Math.PI * 0.62, r: 0.138, rot: 2.4, mat: matLeafOchre },
    { angle: -Math.PI * 0.86, r: 0.138, rot: 1.6, mat: matLeafBurnt },
    { angle: Math.PI * 0.88, r: 0.138, rot: 0.9, mat: matLeafOchre },
    { angle: Math.PI * 0.62, r: 0.138, rot: 0.4, mat: matLeafOchre }
  ];

  leafSpecs.forEach((l, idx) => {
    const lx = Math.cos(l.angle) * l.r;
    const ly = CENTER_Y + Math.sin(l.angle) * l.r;
    addMesh(leafGeo, l.mat, `autumn_leaf_${idx + 1}`, lx, ly, -0.004, 0, 0, l.rot);
  });

  // 5. Cat 1 (top-right, peeking over inner rim around 1:30)
  const cat1Angle = Math.PI * 0.30;
  const c1x = Math.cos(cat1Angle) * 0.112;
  const c1y = CENTER_Y + Math.sin(cat1Angle) * 0.112;
  const catHeadGeo = new THREE.SphereGeometry(0.019, 18, 14);
  const catEarGeo = new THREE.ConeGeometry(0.007, 0.013, 4);
  const catMuzzleGeo = new THREE.SphereGeometry(0.009, 14, 10);
  const catPawGeo = new THREE.CapsuleGeometry(0.0045, 0.006, 6, 10);

  const c1Head = addMesh(catHeadGeo, matCatFur, 'cat_1_head', c1x, c1y, 0.006, 0, 0, -0.45);
  c1Head.scale.set(1.1, 0.95, 0.35);

  addMesh(catEarGeo, matCatFur, 'cat_1_ear_l', c1x - 0.012, c1y + 0.017, 0.006, 0, 0, 0.25);
  addMesh(catEarGeo, matCatFur, 'cat_1_ear_r', c1x + 0.014, c1y + 0.011, 0.006, 0, 0, -0.65);

  const c1Muzzle = addMesh(catMuzzleGeo, matCatCream, 'cat_1_muzzle', c1x - 0.002, c1y - 0.005, 0.011);
  c1Muzzle.scale.set(1.15, 0.85, 0.35);

  addMesh(catPawGeo, matCatCream, 'cat_1_paw_l', c1x - 0.020, c1y - 0.015, 0.012, 0, 0, -0.4);
  addMesh(catPawGeo, matCatCream, 'cat_1_paw_r', c1x + 0.006, c1y - 0.023, 0.012, 0, 0, -0.4);

  // 6. Cat 2 (bottom-right, peeking up-left around 4:30)
  const cat2Angle = -Math.PI * 0.16;
  const c2x = Math.cos(cat2Angle) * 0.092;
  const c2y = CENTER_Y + Math.sin(cat2Angle) * 0.092;

  const c2Head = addMesh(catHeadGeo, matCatFur, 'cat_2_head', c2x, c2y, 0.006, 0, 0, 0.25);
  c2Head.scale.set(1.05, 0.92, 0.35);

  addMesh(catEarGeo, matCatFur, 'cat_2_ear_l', c2x - 0.014, c2y + 0.013, 0.006, 0, 0, 0.55);
  addMesh(catEarGeo, matCatFur, 'cat_2_ear_r', c2x + 0.010, c2y + 0.017, 0.006, 0, 0, -0.25);

  const c2Muzzle = addMesh(catMuzzleGeo, matCatCream, 'cat_2_muzzle', c2x - 0.002, c2y - 0.005, 0.011);
  c2Muzzle.scale.set(1.15, 0.85, 0.35);

  addMesh(catPawGeo, matCatCream, 'cat_2_paw', c2x - 0.010, c2y - 0.020, 0.012, 0, 0, 0.3);

  return group;
}
