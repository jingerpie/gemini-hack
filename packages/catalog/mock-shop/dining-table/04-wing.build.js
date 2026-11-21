function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.75;
  const TOP_THICK = 0.028;
  const CENTER_W = 0.80;
  const DEPTH = 0.85;
  const LEAF_LEN = 0.42;
  const LEAF_THICK = 0.025;
  const LEAF_GAP = 0.004;

  const BASE_W = 0.64;
  const BASE_D = 0.68;
  const LEG_SIZE = 0.05;
  const FOOT_H = 0.012;
  const APRON_H = 0.045;
  const APRON_T = 0.035;
  const XBAR_H = 0.045;
  const XBAR_T = 0.035;
  const XBAR_Y = 0.075;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8a986,
    roughness: 0.55,
    metalness: 0.0
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x242424,
    roughness: 0.45,
    metalness: 0.6
  });
  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x9a9a9a,
    roughness: 0.3,
    metalness: 0.85
  });

  function addMesh(name, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Center tabletop
  const topY = H - TOP_THICK / 2;
  addMesh(
    'tabletop_center',
    new THREE.BoxGeometry(CENTER_W, TOP_THICK, DEPTH),
    woodMat,
    0,
    topY,
    0
  );

  // Drop leaves (hanging vertically on left -X and right +X)
  const leafX = CENTER_W / 2 + LEAF_GAP + LEAF_THICK / 2;
  const leafY = H - TOP_THICK - LEAF_LEN / 2;
  const leafGeo = new THREE.BoxGeometry(LEAF_THICK, LEAF_LEN, DEPTH);
  addMesh('drop_leaf_left', leafGeo, woodMat, -leafX, leafY, 0);
  addMesh('drop_leaf_right', leafGeo, woodMat, leafX, leafY, 0);

  // Hinges connecting leaves to center top
  const hingeGeo = new THREE.BoxGeometry(0.018, 0.04, 0.035);
  const hingeZ = DEPTH * 0.34;
  const hingeY = H - TOP_THICK - 0.025;
  const hingeX = CENTER_W / 2 - 0.005;
  addMesh('hinge_left_front', hingeGeo, hingeMat, -hingeX, hingeY, hingeZ);
  addMesh('hinge_left_back', hingeGeo, hingeMat, -hingeX, hingeY, -hingeZ);
  addMesh('hinge_right_front', hingeGeo, hingeMat, hingeX, hingeY, hingeZ);
  addMesh('hinge_right_back', hingeGeo, hingeMat, hingeX, hingeY, -hingeZ);

  // Four vertical legs + floor glides
  const legH = H - TOP_THICK - FOOT_H;
  const legY = FOOT_H + legH / 2;
  const legX = BASE_W / 2 - LEG_SIZE / 2;
  const legZ = BASE_D / 2 - LEG_SIZE / 2;
  const legGeo = new THREE.BoxGeometry(LEG_SIZE, legH, LEG_SIZE);
  const footGeo = new THREE.CylinderGeometry(LEG_SIZE * 0.42, LEG_SIZE * 0.45, FOOT_H, 16);

  const corners = [
    ['fl', -legX, legZ],
    ['fr', legX, legZ],
    ['bl', -legX, -legZ],
    ['br', legX, -legZ]
  ];

  for (const [tag, cx, cz] of corners) {
    addMesh(`leg_${tag}`, legGeo, metalMat, cx, legY, cz);
    addMesh(`foot_${tag}`, footGeo, metalMat, cx, FOOT_H / 2, cz);
  }

  // Bottom X-crossbars connecting opposite legs
  const diagLen = Math.hypot(BASE_W - LEG_SIZE, BASE_D - LEG_SIZE);
  const diagAngle = Math.atan2(BASE_D - LEG_SIZE, BASE_W - LEG_SIZE);
  const xBarGeo = new THREE.BoxGeometry(diagLen, XBAR_H, XBAR_T);
  addMesh('bottom_x_bar_1', xBarGeo, metalMat, 0, XBAR_Y, 0, 0, diagAngle, 0);
  addMesh('bottom_x_bar_2', xBarGeo, metalMat, 0, XBAR_Y, 0, 0, -diagAngle, 0);

  // Top apron frame under the tabletop
  const apronY = H - TOP_THICK - APRON_H / 2;
  const apronFBGeo = new THREE.BoxGeometry(BASE_W - LEG_SIZE, APRON_H, APRON_T);
  const apronLRGeo = new THREE.BoxGeometry(APRON_T, APRON_H, BASE_D - LEG_SIZE);
  addMesh('top_apron_front', apronFBGeo, metalMat, 0, apronY, legZ);
  addMesh('top_apron_back', apronFBGeo, metalMat, 0, apronY, -legZ);
  addMesh('top_apron_left', apronLRGeo, metalMat, -legX, apronY, 0);
  addMesh('top_apron_right', apronLRGeo, metalMat, legX, apronY, 0);

  // Diagonal corner gussets at the top of the legs
  const gussetLen = 0.14;
  const gussetGeo = new THREE.BoxGeometry(gussetLen, 0.028, 0.028);
  const gussetY = H - TOP_THICK - APRON_H - 0.04;
  const gussetXOffset = legX - 0.05;
  addMesh('gusset_fl', gussetGeo, metalMat, -gussetXOffset, gussetY, legZ, 0, 0, Math.PI / 4);
  addMesh('gusset_fr', gussetGeo, metalMat, gussetXOffset, gussetY, legZ, 0, 0, -Math.PI / 4);
  addMesh('gusset_bl', gussetGeo, metalMat, -gussetXOffset, gussetY, -legZ, 0, 0, Math.PI / 4);
  addMesh('gusset_br', gussetGeo, metalMat, gussetXOffset, gussetY, -legZ, 0, 0, -Math.PI / 4);

  // Small folding support brackets on the outer sides of the legs
  const supportGeo = new THREE.BoxGeometry(0.055, 0.022, 0.022);
  const supportY = H - TOP_THICK - 0.14;
  const supportX = legX + LEG_SIZE / 2 + 0.015;
  addMesh('support_arm_left_front', supportGeo, metalMat, -supportX, supportY, legZ * 0.7, 0, 0, -0.35);
  addMesh('support_arm_left_back', supportGeo, metalMat, -supportX, supportY, -legZ * 0.7, 0, 0, -0.35);
  addMesh('support_arm_right_front', supportGeo, metalMat, supportX, supportY, legZ * 0.7, 0, 0, 0.35);
  addMesh('support_arm_right_back', supportGeo, metalMat, supportX, supportY, -legZ * 0.7, 0, 0, 0.35);

  return group;
}
