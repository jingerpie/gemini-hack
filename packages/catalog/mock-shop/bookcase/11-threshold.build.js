function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 1.90;
  const D = 0.36;
  const POST_SIZE = 0.025;
  const SHELF_THICK = 0.022;
  const RAIL_H = 0.022;
  const RAIL_T = 0.015;
  const BRACE_R = 0.006;

  const SHELF_LEVELS = [0.08, 0.44, 0.80, 1.16, 1.52, 1.878];

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3a,
    roughness: 0.45,
    metalness: 0.65,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc9a075,
    roughness: 0.62,
    metalness: 0.02,
  });

  const addMesh = (geo, mat, name, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. Vertical posts (6 meshes: left, center, right x front, back)
  const postGeo = new THREE.BoxGeometry(POST_SIZE, H, POST_SIZE);
  const postXPositions = [-W / 2 + POST_SIZE / 2, 0, W / 2 - POST_SIZE / 2];
  const postZPositions = [-D / 2 + POST_SIZE / 2, D / 2 - POST_SIZE / 2];
  const xNames = ['left', 'center', 'right'];
  const zNames = ['back', 'front'];

  for (let xi = 0; xi < postXPositions.length; xi++) {
    for (let zi = 0; zi < postZPositions.length; zi++) {
      addMesh(
        postGeo,
        metalMat,
        `post_${xNames[xi]}_${zNames[zi]}`,
        postXPositions[xi],
        H / 2,
        postZPositions[zi]
      );
    }
  }

  // 2. Shelves and horizontal frame rails
  const shelfW = W - POST_SIZE * 0.4;
  const shelfD = D - POST_SIZE * 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_THICK, shelfD);

  const frontBackRailW = W - POST_SIZE * 2;
  const frontBackRailGeo = new THREE.BoxGeometry(frontBackRailW, RAIL_H, RAIL_T);

  const sideRailD = D - POST_SIZE * 2;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailD);

  for (let i = 0; i < SHELF_LEVELS.length; i++) {
    const sy = SHELF_LEVELS[i];
    const railY = sy - SHELF_THICK / 2 - RAIL_H / 2;

    // Wood shelf
    addMesh(shelfGeo, woodMat, `shelf_${i + 1}`, 0, sy, 0);

    // Front & back support rails
    addMesh(
      frontBackRailGeo,
      metalMat,
      `rail_front_${i + 1}`,
      0,
      railY,
      D / 2 - POST_SIZE / 2
    );
    addMesh(
      frontBackRailGeo,
      metalMat,
      `rail_back_${i + 1}`,
      0,
      railY,
      -D / 2 + POST_SIZE / 2
    );

    // Left & right side rails
    addMesh(
      sideRailGeo,
      metalMat,
      `rail_left_${i + 1}`,
      -W / 2 + POST_SIZE / 2,
      railY,
      0
    );
    addMesh(
      sideRailGeo,
      metalMat,
      `rail_right_${i + 1}`,
      W / 2 - POST_SIZE / 2,
      railY,
      0
    );
  }

  // 3. Back X-bracing on the lower two intervals (between shelf 1 and shelf 3)
  const braceY1 = SHELF_LEVELS[0];
  const braceY2 = SHELF_LEVELS[2];
  const braceMidY = (braceY1 + braceY2) / 2;
  const braceH = braceY2 - braceY1;
  const bayW = W / 2 - POST_SIZE;
  const braceLen = Math.hypot(bayW, braceH);
  const braceAngle = Math.atan2(bayW, braceH);
  const braceGeo = new THREE.CylinderGeometry(BRACE_R, BRACE_R, braceLen, 10);
  const braceZ = -D / 2 + POST_SIZE / 2;

  const bayCenters = [-W / 4, W / 4];
  const bayNames = ['left', 'right'];

  for (let b = 0; b < bayCenters.length; b++) {
    const m1 = addMesh(
      braceGeo,
      metalMat,
      `x_brace_${bayNames[b]}_a`,
      bayCenters[b],
      braceMidY,
      braceZ
    );
    m1.rotation.z = braceAngle;

    const m2 = addMesh(
      braceGeo,
      metalMat,
      `x_brace_${bayNames[b]}_b`,
      bayCenters[b],
      braceMidY,
      braceZ
    );
    m2.rotation.z = -braceAngle;
  }

  return group;
}
