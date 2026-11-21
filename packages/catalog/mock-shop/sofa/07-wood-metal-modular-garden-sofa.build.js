function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.28;
  const D = 0.84;
  const H = 0.78;
  const MOD_W = W / 3; // 0.76m per module
  const TUBE = 0.042;
  const SEAT_BASE_H = 0.25;
  const ARM_H = 0.58;
  const WOOD_T = 0.025;
  const CUSHION_SEAT_H = 0.16;
  const CUSHION_BACK_H = 0.40;
  const CUSHION_BACK_T = 0.18;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3f,
    roughness: 0.45,
    metalness: 0.65,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88b61,
    roughness: 0.65,
    metalness: 0.05,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x737e5c,
    roughness: 0.88,
    metalness: 0.02,
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

  // Helper to create a rounded-edge cushion using ExtrudeGeometry
  function makeCushionGeo(w, h, d, radius = 0.03) {
    const shape = new THREE.Shape();
    const hw = w / 2 - radius;
    const hh = h / 2 - radius;
    shape.moveTo(-hw, -hh - radius);
    shape.lineTo(hw, -hh - radius);
    shape.quadraticCurveTo(hw + radius, -hh - radius, hw + radius, -hh);
    shape.lineTo(hw + radius, hh);
    shape.quadraticCurveTo(hw + radius, hh + radius, hw, hh + radius);
    shape.lineTo(-hw, hh + radius);
    shape.quadraticCurveTo(-hw - radius, hh + radius, -hw - radius, hh);
    shape.lineTo(-hw - radius, -hh);
    shape.quadraticCurveTo(-hw - radius, -hh - radius, -hw, -hh - radius);

    const extrudeSettings = {
      steps: 1,
      depth: d - radius * 2,
      bevelEnabled: true,
      bevelThickness: radius,
      bevelSize: radius,
      bevelSegments: 4,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  // Helper for sled side frame (rectangular loop)
  function makeSledSideGeo(depth, height, tube) {
    const shape = new THREE.Shape();
    shape.moveTo(-depth / 2, 0);
    shape.lineTo(depth / 2, 0);
    shape.lineTo(depth / 2, height);
    shape.lineTo(-depth / 2, height);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-depth / 2 + tube, tube);
    hole.lineTo(depth / 2 - tube, tube);
    hole.lineTo(depth / 2 - tube, height - tube);
    hole.lineTo(-depth / 2 + tube, height - tube);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: tube,
      bevelEnabled: false,
    });
    geo.rotateY(Math.PI / 2);
    geo.translate(-tube / 2, 0, 0);
    return geo;
  }

  const sledLowGeo = makeSledSideGeo(D, SEAT_BASE_H, TUBE);
  const sledArmGeo = makeSledSideGeo(D, ARM_H - WOOD_T, TUBE);
  const crossbarGeo = new THREE.BoxGeometry(MOD_W - TUBE * 2, TUBE, TUBE);
  const woodDeckGeo = new THREE.BoxGeometry(MOD_W - 0.01, WOOD_T, D - 0.02);
  const woodBackGeo = new THREE.BoxGeometry(MOD_W - 0.01, 0.44, WOOD_T);
  const armrestGeo = new THREE.BoxGeometry(TUBE + 0.012, WOOD_T, D);

  const seatCushionW = MOD_W - 0.015;
  const seatCushionD = D - 0.04;
  const seatCushionGeo = makeCushionGeo(seatCushionW, CUSHION_SEAT_H, seatCushionD, 0.025);

  const backCushionW = MOD_W - 0.015;
  const backCushionGeo = makeCushionGeo(backCushionW, CUSHION_BACK_H, CUSHION_BACK_T, 0.035);

  const moduleNames = ['left', 'center', 'right'];

  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * MOD_W;
    const modName = moduleNames[i];
    const isLeftOuter = i === 0;
    const isRightOuter = i === 2;

    // Left sled frame of module
    const leftSledGeo = isLeftOuter ? sledArmGeo : sledLowGeo;
    addMesh(
      leftSledGeo,
      metalMat,
      `module_${modName}_sled_left`,
      cx - MOD_W / 2 + TUBE / 2,
      0,
      0
    );

    // Right sled frame of module
    const rightSledGeo = isRightOuter ? sledArmGeo : sledLowGeo;
    addMesh(
      rightSledGeo,
      metalMat,
      `module_${modName}_sled_right`,
      cx + MOD_W / 2 - TUBE / 2,
      0,
      0
    );

    // Front & back metal crossbars
    addMesh(
      crossbarGeo,
      metalMat,
      `module_${modName}_crossbar_front`,
      cx,
      SEAT_BASE_H - TUBE / 2,
      D / 2 - TUBE / 2
    );
    addMesh(
      crossbarGeo,
      metalMat,
      `module_${modName}_crossbar_back`,
      cx,
      SEAT_BASE_H - TUBE / 2,
      -D / 2 + TUBE / 2
    );

    // Wood seat deck
    addMesh(
      woodDeckGeo,
      woodMat,
      `module_${modName}_wood_deck`,
      cx,
      SEAT_BASE_H + WOOD_T / 2,
      0
    );

    // Angled wood backrest
    const backTilt = -0.18;
    addMesh(
      woodBackGeo,
      woodMat,
      `module_${modName}_wood_backrest`,
      cx,
      SEAT_BASE_H + WOOD_T + 0.21,
      -D / 2 + 0.07,
      backTilt,
      0,
      0
    );

    // Seat cushion
    addMesh(
      seatCushionGeo,
      fabricMat,
      `module_${modName}_seat_cushion`,
      cx,
      SEAT_BASE_H + WOOD_T + CUSHION_SEAT_H / 2 - 0.005,
      0.015
    );

    // Back cushion
    addMesh(
      backCushionGeo,
      fabricMat,
      `module_${modName}_back_cushion`,
      cx,
      SEAT_BASE_H + WOOD_T + CUSHION_SEAT_H + CUSHION_BACK_H / 2 - 0.03,
      -D / 2 + 0.17,
      backTilt,
      0,
      0
    );
  }

  // Left & Right wood armrests
  addMesh(
    armrestGeo,
    woodMat,
    'armrest_left',
    -W / 2 + TUBE / 2,
    ARM_H - WOOD_T / 2,
    0
  );
  addMesh(
    armrestGeo,
    woodMat,
    'armrest_right',
    W / 2 - TUBE / 2,
    ARM_H - WOOD_T / 2,
    0
  );

  return group;
}
