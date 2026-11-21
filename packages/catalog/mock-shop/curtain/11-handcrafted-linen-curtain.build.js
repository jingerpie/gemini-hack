function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const CURTAIN_W = 1.18;
  const CURTAIN_H = 2.28;
  const FOLD_DEPTH = 0.065;
  const FABRIC_THICK = 0.008;
  const NUM_FOLDS = 7;

  const ROD_W = 1.62;
  const ROD_R = 0.015;
  const ROD_Y = CURTAIN_H - 0.03;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xd2c8b8,
    roughness: 0.92,
    metalness: 0.0,
  });

  const linenDarkMat = new THREE.MeshStandardMaterial({
    color: 0xc4b8a6,
    roughness: 0.95,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc28e54,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Helper to create a wavy curtain profile shape in X-Y (extruded along Y_world)
  function createWavyShape(width, depth, thick, numFolds, segments) {
    const shape = new THREE.Shape();
    const halfW = width / 2;
    const ptsFront = [];
    const ptsBack = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfW + t * width;
      const angle = t * numFolds * Math.PI * 2;
      const zCenter = Math.cos(angle) * (depth * 0.5);
      ptsFront.push(new THREE.Vector2(x, zCenter + thick * 0.5));
      ptsBack.push(new THREE.Vector2(x, zCenter - thick * 0.5));
    }

    shape.moveTo(ptsFront[0].x, ptsFront[0].y);
    for (let i = 1; i < ptsFront.length; i++) {
      shape.lineTo(ptsFront[i].x, ptsFront[i].y);
    }
    for (let i = ptsBack.length - 1; i >= 0; i--) {
      shape.lineTo(ptsBack[i].x, ptsBack[i].y);
    }
    shape.closePath();
    return shape;
  }

  // 1. Main curtain panel
  const panelShape = createWavyShape(CURTAIN_W, FOLD_DEPTH, FABRIC_THICK, NUM_FOLDS, 96);
  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: CURTAIN_H - 0.015,
    bevelEnabled: false,
    curveSegments: 12,
  });
  const curtainPanel = new THREE.Mesh(panelGeo, linenMat);
  curtainPanel.name = "curtain_panel";
  curtainPanel.rotation.x = -Math.PI / 2;
  curtainPanel.position.y = 0.015;
  curtainPanel.castShadow = true;
  curtainPanel.receiveShadow = true;
  group.add(curtainPanel);

  // 2. Top gathered header band wrapping the rod
  const headerShape = createWavyShape(CURTAIN_W, FOLD_DEPTH * 0.85, FABRIC_THICK * 2.2, NUM_FOLDS, 72);
  const headerGeo = new THREE.ExtrudeGeometry(headerShape, {
    depth: 0.055,
    bevelEnabled: false,
  });
  const topHeader = new THREE.Mesh(headerGeo, linenDarkMat);
  topHeader.name = "top_header_band";
  topHeader.rotation.x = -Math.PI / 2;
  topHeader.position.y = ROD_Y - 0.025;
  topHeader.castShadow = true;
  topHeader.receiveShadow = true;
  group.add(topHeader);

  // 3. Gathered pleat tucks along the top edge
  const numTucks = 12;
  const tuckGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.06, 12);
  for (let i = 0; i < numTucks; i++) {
    const t = (i + 0.5) / numTucks;
    const x = -CURTAIN_W / 2 + t * CURTAIN_W;
    const angle = t * NUM_FOLDS * Math.PI * 2;
    const z = -Math.cos(angle) * (FOLD_DEPTH * 0.42);
    const tuck = new THREE.Mesh(tuckGeo, linenMat);
    tuck.name = `pleat_tuck_${i}`;
    tuck.position.set(x, ROD_Y + 0.005, z);
    tuck.castShadow = true;
    tuck.receiveShadow = true;
    group.add(tuck);
  }

  // 4. Bottom hem / fringe tufts
  const numFringe = 14;
  const fringeGeo = new THREE.BoxGeometry(CURTAIN_W / numFringe * 0.85, 0.018, 0.012);
  for (let i = 0; i < numFringe; i++) {
    const t = (i + 0.5) / numFringe;
    const x = -CURTAIN_W / 2 + t * CURTAIN_W;
    const angle = t * NUM_FOLDS * Math.PI * 2;
    const z = -Math.cos(angle) * (FOLD_DEPTH * 0.5);
    const fringe = new THREE.Mesh(fringeGeo, linenDarkMat);
    fringe.name = `bottom_fringe_${i}`;
    fringe.position.set(x, 0.009, z);
    fringe.castShadow = true;
    fringe.receiveShadow = true;
    group.add(fringe);
  }

  // 5. Wooden curtain rod
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 24);
  const rod = new THREE.Mesh(rodGeo, woodMat);
  rod.name = "curtain_rod";
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, ROD_Y, 0);
  rod.castShadow = true;
  rod.receiveShadow = true;
  group.add(rod);

  // 6. Rod end caps
  const capGeo = new THREE.CylinderGeometry(ROD_R * 1.15, ROD_R * 1.15, 0.018, 24);
  const capLeft = new THREE.Mesh(capGeo, woodMat);
  capLeft.name = "rod_cap_left";
  capLeft.rotation.z = Math.PI / 2;
  capLeft.position.set(-ROD_W / 2 - 0.009, ROD_Y, 0);
  capLeft.castShadow = true;
  capLeft.receiveShadow = true;
  group.add(capLeft);

  const capRight = new THREE.Mesh(capGeo, woodMat);
  capRight.name = "rod_cap_right";
  capRight.rotation.z = Math.PI / 2;
  capRight.position.set(ROD_W / 2 + 0.009, ROD_Y, 0);
  capRight.castShadow = true;
  capRight.receiveShadow = true;
  group.add(capRight);

  return group;
}
